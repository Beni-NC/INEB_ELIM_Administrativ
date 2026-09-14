import { DOMAIN_DATA } from '../data';
import {
  CoordinatorRotation, DomainData, MonthGroup, Parent, ParentEvent, ParentRecord, ScheduleEntry,
  ScheduleStats, TeamComposition, Youth, YouthRecord, YouthRole, YouthStats, YouthTeamMembership,
} from '../models';

/** Participación pasada de un joven en una programación. */
export interface YouthPastEvent {
  entry: ScheduleEntry;
  role: YouthRole;
  teamName: string;
  historical: boolean;
}

/**
 * Índice de solo lectura de todo el dominio, **sin Angular**: lo usa `DataService` en la app y
 * el generador de calendarios (`scripts/generate-calendars.mjs`) en Node.
 *
 * Los datos son estáticos, así que todas las agregaciones se calculan una vez en el constructor
 * y las relaciones se guardan en `Map`s (O(1)). `today` particiona pasado/futuro.
 */
export class ScheduleIndex {
  /* ─────── Colecciones (derivadas de los datos crudos) ─────── */
  readonly schedule: ScheduleEntry[];
  /** Composiciones activas, una por equipo, en orden de número. */
  readonly teams: TeamComposition[];
  /** Composiciones cerradas, la más reciente primero. */
  readonly teamsHistory: TeamComposition[];
  /** Lista completa (incluye archivados). Para la UI usar `activeParents` / `inactiveParents`. */
  readonly parents: Parent[];
  /** Lista completa (incluye archivados). Para la UI usar `activeYouths` / `inactiveYouths`. */
  readonly youths: Youth[];
  private readonly memberships: YouthTeamMembership[];

  /* ─────── Hoy (congelado para la sesión) ─────── */
  readonly today: Date;

  /* ─────── Índices (construidos una vez) ─────── */
  private readonly youthById = new Map<string, Youth>();
  private readonly youthByName = new Map<string, Youth>();
  private readonly parentById = new Map<string, Parent>();
  private readonly parentsByEvent = new Map<ScheduleEntry, Parent[]>();
  private readonly youthsForParentMap = new Map<string, Array<{ youth: Youth; relationship: string }>>();
  private readonly parentsForYouthMap = new Map<string, Array<{ parent: Parent; relationship: string }>>();
  private readonly youthsByTeam = new Map<string, Youth[]>();
  private readonly coordinatorByTeam = new Map<string, Youth | undefined>();
  private readonly activeTeamsByYouth = new Map<string, Array<{ teamName: string; role: YouthRole }>>();
  private readonly historicalTeamsByYouth = new Map<string, Array<{ teamName: string; role: YouthRole; endDate?: Date }>>();
  /**
   * Por equipo: instante en que empieza la composición activa (= último endDate histórico
   * + 1 ms; 0 si no hay histórico). Es la fecha de alta implícita de las pertenencias activas
   * que no la indican, para no atribuir a miembros nuevos programaciones anteriores a su alta.
   */
  private readonly activeStartByTeam = new Map<string, number>();
  private readonly nextEventByTeam = new Map<string, ScheduleEntry>();
  private readonly upcomingEventsByTeam = new Map<string, ScheduleEntry[]>();
  private readonly pastEventsByTeam = new Map<string, ScheduleEntry[]>();
  private readonly nextEventByParent = new Map<string, ScheduleEntry>();
  private readonly nextEventByYouth = new Map<string, ScheduleEntry>();
  private readonly upcomingEventsByYouth = new Map<string, ScheduleEntry[]>();
  /** Participación de cada joven en TODAS las programaciones (respetando ventanas de pertenencia). */
  private readonly allEventsByYouth = new Map<string, YouthPastEvent[]>();
  private readonly pastEventsByYouth = new Map<string, YouthPastEvent[]>();
  private readonly upcomingEventsByParent = new Map<string, ScheduleEntry[]>();
  private readonly pastEventsByParent = new Map<string, ScheduleEntry[]>();
  /** Línea temporal de composiciones por equipo (históricas asc, activa al final). */
  private readonly compositionsByTeam = new Map<string, TeamComposition[]>();
  /** Resolución `programación → composición vigente` (calculada una vez). */
  private readonly compositionByEvent = new Map<ScheduleEntry, TeamComposition>();

  /* ─────── Programación ordenada y particionada ─────── */
  readonly sortedSchedule: readonly ScheduleEntry[];
  readonly upcomingSchedule: ScheduleEntry[];
  readonly pastSchedule: ScheduleEntry[];
  readonly nextEvent: ScheduleEntry | null;
  readonly upcomingByMonth: MonthGroup<ScheduleEntry>[];
  readonly pastByMonth: MonthGroup<ScheduleEntry>[];

  /* ─────── Agregados ─────── */
  readonly coordinatorRotations: CoordinatorRotation[];
  readonly scheduleStats: ScheduleStats;
  readonly youthStats: YouthStats;
  readonly nextParentEvent: ParentEvent | null;
  /** Próximas con padres, excluida la primera (que es `nextParentEvent`). */
  readonly upcomingParentEvents: ParentEvent[];
  readonly pastParentEvents: ParentEvent[];

  /* ─────── Personas ─────── */
  /** Jóvenes ordenados alfabéticamente (colación rumana). */
  readonly youthsSorted: Youth[];
  readonly activeYouths: Youth[];
  readonly inactiveYouths: Youth[];
  readonly activeParents: Parent[];
  readonly inactiveParents: Parent[];

  constructor(today: Date, data: DomainData = DOMAIN_DATA) {
    this.today = today;
    this.schedule = data.schedule;
    this.memberships = data.memberships;
    this.youths = data.youths.map(toYouth);
    this.parents = data.parents.map(toParent);
    this.sortedSchedule = [...this.schedule].sort((a, b) => a.date.getTime() - b.date.getTime());
    const todayMs = this.today.getTime();
    this.pastSchedule = this.sortedSchedule.filter(e => e.date.getTime() < todayMs);
    this.upcomingSchedule = this.sortedSchedule.filter(e => e.date.getTime() >= todayMs);
    this.nextEvent = this.upcomingSchedule[0] ?? null;

    this.youthsSorted = [...this.youths].sort((a, b) => a.fullName.localeCompare(b.fullName, 'ro'));
    this.activeYouths = this.youthsSorted.filter(y => y.active !== false);
    this.inactiveYouths = this.youthsSorted.filter(y => y.active === false);
    this.activeParents = this.parents.filter(p => p.active !== false);
    this.inactiveParents = this.parents.filter(p => p.active === false);

    this.buildLookupMaps(data.parentYouthLinks);
    this.teams = this.deriveActiveTeams();
    this.teamsHistory = this.deriveTeamsHistory();
    this.upcomingByMonth = groupByMonth(this.upcomingSchedule);
    this.pastByMonth = groupByMonth([...this.pastSchedule].reverse());
    this.coordinatorRotations = this.computeCoordinatorRotations();
    this.scheduleStats = this.computeScheduleStats();
    this.youthStats = this.computeYouthStats();

    const parentEvents = (list: ScheduleEntry[]): ParentEvent[] => {
      const out: ParentEvent[] = [];
      for (const entry of list) {
        const people = this.parentsByEvent.get(entry);
        if (people && people.length > 0) out.push({ entry, people });
      }
      return out;
    };
    const upcomingWithParents = parentEvents(this.upcomingSchedule);
    this.nextParentEvent = upcomingWithParents[0] ?? null;
    this.upcomingParentEvents = upcomingWithParents.slice(1);
    this.pastParentEvents = parentEvents([...this.pastSchedule].reverse());
  }

  /* ─────── Consultas O(1) ─────── */
  getYouthById(id: string): Youth | undefined { return this.youthById.get(id); }
  getYouthByName(name: string): Youth | undefined { return this.youthByName.get(name); }
  getParentById(id: string): Parent | undefined { return this.parentById.get(id); }
  /** Padres que apoyan puntualmente una programación. */
  getParentsForEvent(entry: ScheduleEntry): Parent[] { return this.parentsByEvent.get(entry) ?? []; }
  getYouthsForTeam(team: string): Youth[] { return this.youthsByTeam.get(team) ?? []; }
  getCoordinatorForTeam(team: string): Youth | undefined { return this.coordinatorByTeam.get(team); }
  getNextEventForTeam(team: string): ScheduleEntry | undefined { return this.nextEventByTeam.get(team); }
  getUpcomingEventsForTeam(team: string): ScheduleEntry[] { return this.upcomingEventsByTeam.get(team) ?? []; }
  getPastEventsForTeam(team: string): ScheduleEntry[] { return this.pastEventsByTeam.get(team) ?? []; }
  getNextEventForParent(id: string): ScheduleEntry | undefined { return this.nextEventByParent.get(id); }
  getNextEventForYouth(id: string): ScheduleEntry | undefined { return this.nextEventByYouth.get(id); }
  getUpcomingEventsForYouth(id: string): ScheduleEntry[] { return this.upcomingEventsByYouth.get(id) ?? []; }
  getPastEventsForYouth(id: string): YouthPastEvent[] { return this.pastEventsByYouth.get(id) ?? []; }
  /** Todas las programaciones (pasadas y futuras) en las que participa o participó el joven. */
  getAllEventsForYouth(id: string): YouthPastEvent[] { return this.allEventsByYouth.get(id) ?? []; }
  /** Todas las programaciones del equipo, en orden cronológico. */
  getAllEventsForTeam(team: string): ScheduleEntry[] { return this.sortedSchedule.filter(e => e.team === team); }
  /** Todas las programaciones que apoya o apoyó el padre, en orden cronológico. */
  getAllEventsForParent(id: string): ScheduleEntry[] { return this.sortedSchedule.filter(e => this.parentsByEvent.get(e)?.some(p => p.id === id)); }
  getUpcomingEventsForParent(id: string): ScheduleEntry[] { return this.upcomingEventsByParent.get(id) ?? []; }
  getPastEventsForParent(id: string): ScheduleEntry[] { return this.pastEventsByParent.get(id) ?? []; }
  getYouthsForParent(id: string) { return this.youthsForParentMap.get(id) ?? []; }
  getParentsForYouth(id: string) { return this.parentsForYouthMap.get(id) ?? []; }
  getActiveTeamsForYouth(id: string) { return this.activeTeamsByYouth.get(id) ?? []; }
  getHistoricalTeamsForYouth(id: string) { return this.historicalTeamsByYouth.get(id) ?? []; }

  /**
   * True solo si el joven coordina ahora mismo al menos un equipo ACTIVO. Un joven marcado
   * `isCoordinator` en los datos que solo coordinó composiciones cerradas cuenta como miembro.
   */
  isActiveCoordinator(id: string): boolean {
    return (this.activeTeamsByYouth.get(id) ?? []).some(t => t.role === 'coordonator');
  }

  /* ─────── Línea temporal de composiciones ─────── */
  getCompositionsForTeam(team: string): TeamComposition[] { return this.compositionsByTeam.get(team) ?? []; }
  getCompositionForEvent(entry: ScheduleEntry): TeamComposition | undefined { return this.compositionByEvent.get(entry); }
  /** True si la programación pertenece a una composición cerrada (histórica). */
  isHistoricalEvent(entry: ScheduleEntry): boolean {
    const c = this.compositionByEvent.get(entry);
    return !!c && !c.isActive;
  }
  /** Ancla estable de la composición histórica de la programación (o null si es la activa). */
  getHistoryKeyForEvent(entry: ScheduleEntry): string | null {
    const c = this.compositionByEvent.get(entry);
    return c && !c.isActive ? (c.historyKey ?? null) : null;
  }
  /** Programaciones pasadas de una composición histórica (más reciente primero). */
  getEventsForHistoryKey(historyKey: string): ScheduleEntry[] {
    const out: ScheduleEntry[] = [];
    for (const [entry, comp] of this.compositionByEvent) {
      if (comp.historyKey === historyKey) out.push(entry);
    }
    return out.sort((a, b) => b.date.getTime() - a.date.getTime());
  }
  /**
   * Coordinador de la programación. Manda el registrado en la propia entrada (es quien la
   * dirigió de verdad); la composición solo sirve de respaldo si falta.
   */
  getCoordinatorNameForEvent(entry: ScheduleEntry): string {
    return entry.coordinator || this.compositionByEvent.get(entry)?.coordinatorName || '—';
  }

  /* ─────── Internos ─────── */
  private buildLookupMaps(parentYouthLinks: readonly { parentId: string; youthId: string; relationship: string }[]): void {
    for (const y of this.youths) {
      this.youthById.set(y.id, y);
      this.youthByName.set(y.fullName, y);
    }
    for (const p of this.parents) this.parentById.set(p.id, p);

    for (const e of this.sortedSchedule) {
      const ids = e.parentSupporters;
      if (!ids || ids.length === 0) continue;
      const list = ids.map(id => this.parentById.get(id)).filter((p): p is Parent => !!p);
      if (list.length > 0) this.parentsByEvent.set(e, list);
    }

    for (const link of parentYouthLinks) {
      const youth = this.youthById.get(link.youthId);
      const parent = this.parentById.get(link.parentId);
      if (youth) pushTo(this.youthsForParentMap, link.parentId, { youth, relationship: link.relationship });
      if (parent) pushTo(this.parentsForYouthMap, link.youthId, { parent, relationship: link.relationship });
    }

    for (const m of this.memberships) {
      if (m.active || !m.endDate) continue;
      const t = m.endDate.getTime() + 1;
      if (t > (this.activeStartByTeam.get(m.teamName) ?? 0)) this.activeStartByTeam.set(m.teamName, t);
    }

    for (const m of this.memberships) {
      if (m.active) {
        const y = this.youthById.get(m.youthId);
        if (y) pushTo(this.youthsByTeam, m.teamName, y);
        pushTo(this.activeTeamsByYouth, m.youthId, { teamName: m.teamName, role: m.role });
        if (m.role === 'coordonator' && !this.coordinatorByTeam.has(m.teamName)) this.coordinatorByTeam.set(m.teamName, y);
      } else {
        pushTo(this.historicalTeamsByYouth, m.youthId, { teamName: m.teamName, role: m.role, endDate: m.endDate });
      }
    }

    for (const e of this.upcomingSchedule) {
      if (!this.nextEventByTeam.has(e.team)) this.nextEventByTeam.set(e.team, e);
      pushTo(this.upcomingEventsByTeam, e.team, e);
    }
    for (const e of this.pastSchedule) pushTo(this.pastEventsByTeam, e.team, e);
    for (const [t, list] of this.pastEventsByTeam) this.pastEventsByTeam.set(t, [...list].reverse());

    /* Próximas/pasadas por padre, derivadas de `parentSupporters` de cada programación. */
    for (const [entry, supporters] of this.parentsByEvent) {
      const isPast = entry.date.getTime() < this.today.getTime();
      for (const p of supporters) {
        pushTo(isPast ? this.pastEventsByParent : this.upcomingEventsByParent, p.id, entry);
      }
    }
    for (const [pid, list] of this.upcomingEventsByParent) {
      const sorted = [...list].sort((a, b) => a.date.getTime() - b.date.getTime());
      this.upcomingEventsByParent.set(pid, sorted);
      this.nextEventByParent.set(pid, sorted[0]);
    }
    for (const [pid, list] of this.pastEventsByParent) {
      this.pastEventsByParent.set(pid, [...list].sort((a, b) => b.date.getTime() - a.date.getTime()));
    }

    /* Próximas por joven: solo las de sus equipos activos y posteriores a su alta efectiva. */
    for (const [youthId, activeTeams] of this.activeTeamsByYouth) {
      const teamSet = new Set(activeTeams.map(t => t.teamName));
      const startByTeam = new Map<string, number>();
      for (const m of this.memberships) {
        if (m.youthId !== youthId || !m.active) continue;
        const start = m.joinedDate?.getTime() ?? this.activeStartByTeam.get(m.teamName) ?? 0;
        const cur = startByTeam.get(m.teamName);
        if (cur === undefined || start < cur) startByTeam.set(m.teamName, start);
      }
      const upcoming = this.upcomingSchedule.filter(e => teamSet.has(e.team) && e.date.getTime() >= (startByTeam.get(e.team) ?? 0));
      if (upcoming.length > 0) {
        this.nextEventByYouth.set(youthId, upcoming[0]);
        this.upcomingEventsByYouth.set(youthId, upcoming);
      }
    }

    /* Participación por joven en todas las programaciones (pertenencias activas e históricas,
     * respetando ventanas), sin duplicar fecha+equipo. El pasado es un subconjunto (más reciente primero). */
    const allByYouth = new Map<string, YouthPastEvent[]>();
    for (const m of this.memberships) {
      for (const e of this.sortedSchedule) {
        if (e.team !== m.teamName || !this.membershipCoversDate(m, e.date.getTime())) continue;
        pushTo(allByYouth, m.youthId, { entry: e, role: m.role, teamName: m.teamName, historical: !m.active });
      }
    }
    for (const [yid, list] of allByYouth) {
      const seen = new Set<string>();
      const all = list
        .sort((a, b) => a.entry.date.getTime() - b.entry.date.getTime())
        .filter(x => {
          const key = x.entry.date.getTime() + '|' + x.teamName;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      this.allEventsByYouth.set(yid, all);
      this.pastEventsByYouth.set(yid, all.filter(x => x.entry.date.getTime() < this.today.getTime()).reverse());
    }

    this.buildCompositionTimeline();
  }

  /**
   * True si la pertenencia "cubre" el instante dado:
   *  • Histórica: joinedDate (o 0) ≤ t ≤ endDate.
   *  • Activa: t ≥ (joinedDate ?? inicio de la ventana activa del equipo ?? 0).
   */
  private membershipCoversDate(m: YouthTeamMembership, t: number): boolean {
    if (!m.active) {
      const start = m.joinedDate?.getTime() ?? 0;
      const end = m.endDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
      return t >= start && t <= end;
    }
    return t >= (m.joinedDate?.getTime() ?? this.activeStartByTeam.get(m.teamName) ?? 0);
  }

  /**
   * Agrupa las pertenencias por (equipo, endDate) en composiciones y resuelve cada
   * programación a la composición vigente en su fecha (la primera histórica cuyo fin ≥ fecha;
   * si no hay, la activa).
   */
  private buildCompositionTimeline(): void {
    interface Bucket { teamName: string; end?: Date; active: boolean; rows: YouthTeamMembership[] }
    const buckets = new Map<string, Bucket>();
    for (const m of this.memberships) {
      const key = m.active ? `${m.teamName}|active` : `${m.teamName}|${m.endDate?.getTime() ?? 0}`;
      let b = buckets.get(key);
      if (!b) {
        b = { teamName: m.teamName, end: m.active ? undefined : m.endDate, active: m.active, rows: [] };
        buckets.set(key, b);
      }
      b.rows.push(m);
    }
    for (const b of buckets.values()) {
      const coordRow = b.rows.find(r => r.role === 'coordonator');
      const coord = coordRow ? this.youthById.get(coordRow.youthId) : undefined;
      const members: Youth[] = [];
      const seen = new Set<string>();
      for (const r of b.rows) {
        if (seen.has(r.youthId)) continue;
        const y = this.youthById.get(r.youthId);
        if (y) { members.push(y); seen.add(r.youthId); }
      }
      pushTo(this.compositionsByTeam, b.teamName, {
        teamName: b.teamName,
        coordinator: coord,
        coordinatorName: coord?.fullName ?? '—',
        members,
        end: b.end,
        isActive: b.active,
        historyKey: b.active ? undefined : `${b.teamName}-${b.end?.getTime() ?? 0}`,
      });
    }
    for (const list of this.compositionsByTeam.values()) {
      list.sort((a, b) => {
        if (a.isActive !== b.isActive) return a.isActive ? 1 : -1;
        return (a.end?.getTime() ?? 0) - (b.end?.getTime() ?? 0);
      });
    }
    for (const e of this.sortedSchedule) {
      const comps = this.compositionsByTeam.get(e.team);
      if (!comps || comps.length === 0) continue;
      const t = e.date.getTime();
      const chosen = comps.find(c => !c.isActive && c.end && t <= c.end.getTime())
        ?? comps.find(c => c.isActive)
        ?? comps[comps.length - 1];
      this.compositionByEvent.set(e, chosen);
    }
  }

  /** Una composición activa por equipo, ordenadas por número ("Echipa 1" … "Echipa 7"). */
  private deriveActiveTeams(): TeamComposition[] {
    const out: TeamComposition[] = [];
    for (const comps of this.compositionsByTeam.values()) {
      const active = comps.find(c => c.isActive);
      if (active) out.push(active);
    }
    return out.sort((a, b) => teamNumber(a.teamName) - teamNumber(b.teamName) || a.teamName.localeCompare(b.teamName));
  }

  /** Composiciones cerradas de todos los equipos, la más reciente primero. */
  private deriveTeamsHistory(): TeamComposition[] {
    const out: TeamComposition[] = [];
    for (const comps of this.compositionsByTeam.values()) {
      for (const c of comps) if (!c.isActive) out.push(c);
    }
    return out.sort((a, b) => (b.end?.getTime() ?? 0) - (a.end?.getTime() ?? 0) || teamNumber(a.teamName) - teamNumber(b.teamName));
  }

  private computeCoordinatorRotations(): CoordinatorRotation[] {
    const map = new Map<string, CoordinatorRotation>();
    for (const e of this.pastSchedule) {
      const key = `${e.coordinator}__${e.team}`;
      let entry = map.get(key);
      if (!entry) {
        entry = { name: e.coordinator, team: e.team, count: 0 };
        map.set(key, entry);
      }
      entry.count++;
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }

  private computeScheduleStats(): ScheduleStats {
    const month = this.today.getMonth();
    const year = this.today.getFullYear();
    const thisMonth = this.upcomingSchedule.filter(e => e.date.getMonth() === month && e.date.getFullYear() === year).length;
    return { upcoming: this.upcomingSchedule.length, thisMonth, completed: this.pastSchedule.length, teams: this.teams.length };
  }

  private computeYouthStats(): YouthStats {
    return {
      total: this.activeYouths.length,
      coordinators: this.activeYouths.filter(y => this.isActiveCoordinator(y.id)).length,
    };
  }
}

/** Completa un joven con lo derivable: nombre canónico "Apellido Nombre" e iniciales. */
function toYouth(r: YouthRecord): Youth {
  return { ...r, fullName: `${r.lastName} ${r.firstName}`, initials: (r.lastName.charAt(0) + r.firstName.charAt(0)).toUpperCase(), tone: toneOf(r.id) };
}

/** Completa un padre con sus iniciales (una por palabra del nombre, máximo tres). */
function toParent(r: ParentRecord): Parent {
  const initials = r.name.trim().split(/\s+/).slice(0, 3).map(w => w.charAt(0)).join('').toUpperCase();
  return { ...r, initials, tone: toneOf(r.id) };
}

/** Tono de avatar 0–7 a partir del id: estable entre sesiones y repartido entre los 8 tonos. */
export function toneOf(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h % 8;
}

/** "Echipa 4" → 4 (sin número → al final). */
function teamNumber(name: string): number {
  const n = Number(name.replace(/\D+/g, ''));
  return Number.isFinite(n) && n > 0 ? n : Number.MAX_SAFE_INTEGER;
}

/** Agrupa programaciones consecutivas por mes conservando el orden de entrada. */
function groupByMonth(list: ScheduleEntry[]): MonthGroup<ScheduleEntry>[] {
  const groups = new Map<string, MonthGroup<ScheduleEntry>>();
  for (const e of list) {
    const year = e.date.getFullYear();
    const month = e.date.getMonth();
    const key = `${year}-${month}`;
    let g = groups.get(key);
    if (!g) {
      g = { key, year, month, entries: [] };
      groups.set(key, g);
    }
    g.entries.push(e);
  }
  return Array.from(groups.values());
}

/** Añade a un `Map<K, V[]>` creando el bucket si hace falta. */
function pushTo<K, V>(map: Map<K, V[]>, key: K, value: V): void {
  let bucket = map.get(key);
  if (!bucket) { bucket = []; map.set(key, bucket); }
  bucket.push(value);
}
