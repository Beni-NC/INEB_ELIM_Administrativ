import { Injectable, computed, signal } from '@angular/core';
import {
  SCHEDULE_DATA, TEAMS_DATA, TEAMS_HISTORY, RULES, PARENTS,
  PARENT_YOUTH_LINKS, YOUTHS, YOUTH_TEAM_MEMBERSHIPS,
} from '../data/schedule-data';
import {
  CoordinatorRotation, MonthGroup, Parent, ScheduleEntry, ScheduleStats,
  Youth, YouthFilter, YouthRole, YouthStats,
} from '../models';
import { MONTHS_LONG } from '../constants';
import { startOfDay } from '../utils/date.utils';
import { getTeamColor } from '../utils/team.utils';

/**
 * Represents a single composition (roster) of a team valid for a given time window.
 *  - `isActive: true` → currently running composition (no end date).
 *  - `isActive: false` → historical composition closed at `end`.
 * The `historyKey` (only present for historical comps) is used as DOM anchor and
 * navigation token so that past events can deep-link to the exact composition
 * that prepared them.
 */
export interface TeamComposition {
  teamName: string;
  coordinator?: Youth;
  coordinatorName: string;
  members: Youth[];
  end?: Date;
  isActive: boolean;
  historyKey?: string;
}

/**
 * Centralized read-only access to all domain data.
 * Heavy aggregations are precomputed once at construction (data is static at runtime),
 * and reactive concerns (filters, search) are exposed as signals.
 *
 * Performance notes:
 *   - All ↔ relationships are stored in O(1) Map lookups.
 *   - Computed signals only recompute when their inputs change.
 */
@Injectable({ providedIn: 'root' })
export class DataService {
  /* ─────── Raw collections (read-only) ─────── */
  readonly schedule = SCHEDULE_DATA;
  readonly teams = TEAMS_DATA;
  readonly teamsHistory = TEAMS_HISTORY;
  readonly rules = RULES;
  /** Lista completă (incluse și arhivate). Foloseşte `activeParents()` / `inactiveParents()` pentru UI. */
  readonly parents = PARENTS;
  /** Lista completă (incluse și arhivate). Foloseşte `activeYouths()` / `inactiveYouths()` pentru UI. */
  readonly youths = YOUTHS;

  /* ─────── Reactive archive overrides (runtime mutations) ───────
   * Map<id, { inactiveSince, inactiveReason }> sau `null` pentru „reactivat”.
   * Permite arhivarea / restaurarea fără a pierde datele originale.
   */
  private readonly _youthOverrides = signal<Map<string, { inactive: boolean; since?: Date; reason?: string }>>(new Map());
  private readonly _parentOverrides = signal<Map<string, { inactive: boolean; since?: Date; reason?: string }>>(new Map());

  /* ─────── Today (frozen for the session) ─────── */
  readonly today = startOfDay();

  /* ─────── Lookup maps (built once) ─────── */
  private readonly youthById = new Map<string, Youth>();
  private readonly youthByName = new Map<string, Youth>();
  private readonly parentById = new Map<string, Parent>();

  private readonly parentsByTeam = new Map<string, Parent[]>();
  private readonly teamsByParent = new Map<string, string[]>();
  private readonly parentsByEvent = new Map<ScheduleEntry, Parent[]>();
  private readonly youthsForParentMap = new Map<string, Array<{ youth: Youth; relationship: string }>>();
  private readonly parentsForYouthMap = new Map<string, Array<{ parent: Parent; relationship: string }>>();
  private readonly youthsByTeam = new Map<string, Youth[]>();
  private readonly coordinatorByTeam = new Map<string, Youth | undefined>();
  private readonly activeTeamsByYouth = new Map<string, Array<{ teamName: string; role: YouthRole }>>();
  private readonly historicalTeamsByYouth = new Map<string, Array<{ teamName: string; role: YouthRole; endDate?: Date }>>();
  /** Per team: timestamp marking the start of the current active composition
   * (= latest historical endDate + 1ms; 0 if no history). Used as the implicit
   * joinedDate for active memberships that don't specify one. */
  private readonly activeStartByTeam = new Map<string, number>();
  private readonly nextEventByTeam = new Map<string, ScheduleEntry>();
  private readonly upcomingEventsByTeam = new Map<string, ScheduleEntry[]>();
  private readonly pastEventsByTeam = new Map<string, ScheduleEntry[]>();
  private readonly nextEventByParent = new Map<string, ScheduleEntry>();
  private readonly nextEventByYouth = new Map<string, ScheduleEntry>();
  private readonly upcomingEventsByYouth = new Map<string, ScheduleEntry[]>();
  private readonly pastEventsByYouth = new Map<string, Array<{ entry: ScheduleEntry; role: YouthRole; teamName: string; historical: boolean }>>();
  private readonly upcomingEventsByParent = new Map<string, ScheduleEntry[]>();
  private readonly pastEventsByParent = new Map<string, ScheduleEntry[]>();

  /** Per-team timeline of compositions (historical first asc, active last). */
  private readonly compositionsByTeam = new Map<string, TeamComposition[]>();
  /** Cached resolution of `entry → composition` (built once at startup). */
  private readonly compositionByEvent = new Map<ScheduleEntry, TeamComposition>();

  /* ─────── Sorted / partitioned schedule ─────── */
  readonly sortedSchedule: readonly ScheduleEntry[];
  readonly upcomingSchedule: ScheduleEntry[];
  readonly pastSchedule: ScheduleEntry[];
  readonly nextEvent: ScheduleEntry | null;
  readonly nextThree: ScheduleEntry[];
  readonly upcomingByMonth: MonthGroup<ScheduleEntry>[];
  readonly pastByMonth: MonthGroup<ScheduleEntry>[];

  /* ─────── Aggregates ─────── */
  readonly totalMealsServed: number;
  readonly coordinatorRotations: CoordinatorRotation[];
  readonly scheduleStats: ScheduleStats;
  readonly youthStats: YouthStats;
  readonly nextParentEvent: { entry: ScheduleEntry; people: Parent[] } | null;
  readonly upcomingParentEvents: Array<{ entry: ScheduleEntry; people: Parent[] }>;

  /* ─────── Reactive UI state (signals) ─────── */
  private readonly _youthSearch = signal('');
  private readonly _youthFilter = signal<YouthFilter>('toti');

  readonly youthSearch = this._youthSearch.asReadonly();
  readonly youthFilter = this._youthFilter.asReadonly();

  /** Sorted youth list (by Romanian collation), used in the Tineri tab. */
  readonly youthsSorted: Youth[];

  /** Doar tineri activi, ordonaţi alfabetic. Reactiv la arhivări. */
  readonly activeYouths = computed<Youth[]>(() => {
    const overrides = this._youthOverrides();
    return this.youthsSorted.filter(y => this.isActive(y, overrides));
  });

  /** Doar tineri arhivaţi (istoric). Reactiv la arhivări. */
  readonly inactiveYouths = computed<Youth[]>(() => {
    const overrides = this._youthOverrides();
    return this.youthsSorted
      .filter(y => !this.isActive(y, overrides))
      .map(y => this.applyOverride(y, overrides));
  });

  /** Doar părinţi activi. */
  readonly activeParents = computed<Parent[]>(() => {
    const overrides = this._parentOverrides();
    return this.parents.filter(p => this.isActive(p, overrides));
  });

  /** Doar părinţi arhivaţi (foste persoane de sprijin). */
  readonly inactiveParents = computed<Parent[]>(() => {
    const overrides = this._parentOverrides();
    return this.parents
      .filter(p => !this.isActive(p, overrides))
      .map(p => this.applyOverride(p, overrides));
  });

  /** Reactive filtered list driven by signals — recomputes only when inputs change. */
  readonly filteredYouths = computed<Youth[]>(() => {
    const term = this._youthSearch().trim().toLowerCase();
    const filter = this._youthFilter();
    const list = this.activeYouths();
    if (!term && filter === 'toti') return list;
    return list.filter(y => {
      const isActiveCoord = this.isActiveCoordinator(y.id);
      if (filter === 'coordonatori' && !isActiveCoord) return false;
      if (filter === 'membri' && isActiveCoord) return false;
      if (term && !y.fullName.toLowerCase().includes(term)) return false;
      return true;
    });
  });

  constructor() {
    /* Sort schedule once. Static data → safe to memoize. */
    this.sortedSchedule = [...this.schedule].sort((a, b) => a.date.getTime() - b.date.getTime());
    const todayMs = this.today.getTime();
    this.pastSchedule = this.sortedSchedule.filter(e => e.date.getTime() < todayMs);
    this.upcomingSchedule = this.sortedSchedule.filter(e => e.date.getTime() >= todayMs);
    this.nextEvent = this.upcomingSchedule[0] ?? null;

    this.youthsSorted = [...this.youths].sort(
      (a, b) => a.fullName.localeCompare(b.fullName, 'ro')
    );

    this.buildLookupMaps();
    this.nextThree = this.upcomingSchedule.slice(0, 3);
    this.upcomingByMonth = this.groupByMonth(this.upcomingSchedule, false);
    this.pastByMonth = this.groupByMonth(this.pastSchedule, true);
    this.totalMealsServed = this.computeMealsServed();
    this.coordinatorRotations = this.computeCoordinatorRotations();
    this.scheduleStats = this.computeScheduleStats();
    this.youthStats = this.computeYouthStats();
    this.nextParentEvent = this.computeNextParentEvent();
    this.upcomingParentEvents = this.computeUpcomingParentEvents();
  }

  /* ─────── Public mutators (signals) ─────── */
  setYouthSearch(value: string): void { this._youthSearch.set(value); }
  setYouthFilter(value: YouthFilter): void { this._youthFilter.set(value); }
  clearYouthSearch(): void { this._youthSearch.set(''); }

  /* ─────── Archive / restore (runtime, non-destructive) ─────── */
  /** Marchează un tânăr ca arhivat (istoric), păstrând toate datele. */
  archiveYouth(id: string, reason?: string): void {
    const next = new Map(this._youthOverrides());
    next.set(id, { inactive: true, since: new Date(), reason });
    this._youthOverrides.set(next);
  }
  /** Reactivează un tânăr arhivat. */
  restoreYouth(id: string): void {
    const next = new Map(this._youthOverrides());
    next.set(id, { inactive: false });
    this._youthOverrides.set(next);
  }
  archiveParent(id: string, reason?: string): void {
    const next = new Map(this._parentOverrides());
    next.set(id, { inactive: true, since: new Date(), reason });
    this._parentOverrides.set(next);
  }
  restoreParent(id: string): void {
    const next = new Map(this._parentOverrides());
    next.set(id, { inactive: false });
    this._parentOverrides.set(next);
  }

  /** Returnează true dacă entitatea este activă (default: true dacă nu e specificat). */
  private isActive<T extends { id: string; active?: boolean }>(
    entity: T,
    overrides: Map<string, { inactive: boolean }>,
  ): boolean {
    const ovr = overrides.get(entity.id);
    if (ovr) return !ovr.inactive;
    return entity.active !== false;
  }
  /** Suprascrie inactiveSince/inactiveReason cu valorile din override (pentru afişare). */
  private applyOverride<T extends { id: string; inactiveSince?: Date; inactiveReason?: string }>(
    entity: T,
    overrides: Map<string, { inactive: boolean; since?: Date; reason?: string }>,
  ): T {
    const ovr = overrides.get(entity.id);
    if (!ovr || !ovr.inactive) return entity;
    return {
      ...entity,
      inactiveSince: ovr.since ?? entity.inactiveSince,
      inactiveReason: ovr.reason ?? entity.inactiveReason,
    };
  }

  /* ─────── Public lookup API (O(1)) ─────── */
  getYouthById(id: string): Youth | undefined { return this.youthById.get(id); }
  getYouthByName(name: string): Youth | undefined { return this.youthByName.get(name); }
  getParentById(id: string): Parent | undefined { return this.parentById.get(id); }
  /** @deprecated Părinţii nu mai sunt asignaţi la echipe fixe. Păstrat doar pentru retro‑compat. */
  getTeamsForParent(id: string): string[] { return this.teamsByParent.get(id) ?? []; }
  /** @deprecated Foloseşte `getParentsForEvent(entry)`. */
  getParentsForTeam(team: string): Parent[] { return this.parentsByTeam.get(team) ?? []; }
  /** Părinţi care sprijină punctual o programare anume. */
  getParentsForEvent(entry: ScheduleEntry): Parent[] { return this.parentsByEvent.get(entry) ?? []; }
  getYouthsForTeam(team: string): Youth[] { return this.youthsByTeam.get(team) ?? []; }
  getCoordinatorForTeam(team: string): Youth | undefined { return this.coordinatorByTeam.get(team); }
  getNextEventForTeam(team: string): ScheduleEntry | undefined { return this.nextEventByTeam.get(team); }
  getUpcomingEventsForTeam(team: string): ScheduleEntry[] { return this.upcomingEventsByTeam.get(team) ?? []; }
  getPastEventsForTeam(team: string): ScheduleEntry[] { return this.pastEventsByTeam.get(team) ?? []; }
  getNextEventForParent(id: string): ScheduleEntry | undefined { return this.nextEventByParent.get(id); }
  getNextEventForYouth(id: string): ScheduleEntry | undefined { return this.nextEventByYouth.get(id); }
  getUpcomingEventsForYouth(id: string): ScheduleEntry[] { return this.upcomingEventsByYouth.get(id) ?? []; }
  getPastEventsForYouth(id: string) { return this.pastEventsByYouth.get(id) ?? []; }
  getUpcomingEventsForParent(id: string): ScheduleEntry[] { return this.upcomingEventsByParent.get(id) ?? []; }
  getPastEventsForParent(id: string): ScheduleEntry[] { return this.pastEventsByParent.get(id) ?? []; }
  getYouthsForParent(id: string) { return this.youthsForParentMap.get(id) ?? []; }
  getParentsForYouth(id: string) { return this.parentsForYouthMap.get(id) ?? []; }
  getActiveTeamsForYouth(id: string) { return this.activeTeamsByYouth.get(id) ?? []; }
  getHistoricalTeamsForYouth(id: string) { return this.historicalTeamsByYouth.get(id) ?? []; }

  /**
   * True only if the youth currently coordinates at least one ACTIVE team.
   * A youth flagged `isCoordinator` in mock data who only coordinated
   * historical (closed) compositions reverts to a regular member here.
   */
  isActiveCoordinator(id: string): boolean {
    const teams = this.activeTeamsByYouth.get(id);
    if (!teams) return false;
    for (const t of teams) if (t.role === 'coordonator') return true;
    return false;
  }
  /** True if the youth was the coordinator of a historical (closed) team composition by name. */
  wasCoordinatorOfHistoricalTeam(id: string, teamName: string): boolean {
    const hist = this.historicalTeamsByYouth.get(id);
    if (!hist) return false;
    for (const h of hist) if (h.teamName === teamName && h.role === 'coordonator') return true;
    return false;
  }

  /* ─────── Composition timeline (echipe + istoric) ─────── */
  /** All compositions of a team, oldest historical first → active last. */
  getCompositionsForTeam(team: string): TeamComposition[] {
    return this.compositionsByTeam.get(team) ?? [];
  }
  /** Resolve which composition was running when the event happened. */
  getCompositionForEvent(entry: ScheduleEntry): TeamComposition | undefined {
    return this.compositionByEvent.get(entry);
  }
  /** True if the event belongs to a closed (historical) composition. */
  isHistoricalEvent(entry: ScheduleEntry): boolean {
    const c = this.compositionByEvent.get(entry);
    return !!c && !c.isActive;
  }
  /** Stable DOM/anchor key for a historical composition (or null when active). */
  getHistoryKeyForEvent(entry: ScheduleEntry): string | null {
    const c = this.compositionByEvent.get(entry);
    return c && !c.isActive ? (c.historyKey ?? null) : null;
  }
  /** All past events that belonged to a historical composition (newest first). */
  getEventsForHistoryKey(historyKey: string): ScheduleEntry[] {
    const out: ScheduleEntry[] = [];
    for (const [entry, comp] of this.compositionByEvent) {
      if (comp.historyKey === historyKey) out.push(entry);
    }
    return out.sort((a, b) => b.date.getTime() - a.date.getTime());
  }
  /** Coordinator name resolved through the timeline (matches `entry.coordinator` if recorded). */
  getCoordinatorNameForEvent(entry: ScheduleEntry): string {
    /* Always trust the per-event coordinator recorded on the schedule entry — that
     * is the source of truth for who actually led the program on that date.
     * Falls back to composition coordinator only if missing. */
    return entry.coordinator || this.compositionByEvent.get(entry)?.coordinatorName || '—';
  }
  /** Members snapshot for the composition that handled the event, filtered by joinedDate/endDate. */
  getMembersForEvent(entry: ScheduleEntry): Youth[] {
    const t = entry.date.getTime();
    const out: Youth[] = [];
    const seen = new Set<string>();
    for (const m of YOUTH_TEAM_MEMBERSHIPS) {
      if (m.teamName !== entry.team) continue;
      if (!this.membershipCoversDate(m, t)) continue;
      if (seen.has(m.youthId)) continue;
      const y = this.youthById.get(m.youthId);
      if (y) { out.push(y); seen.add(m.youthId); }
    }
    return out;
  }

  /**
   * True iff a membership row "covers" the given event timestamp.
   * Rules:
   *   • Historical (active=false): joinedDate (or default 0) ≤ t ≤ endDate.
   *   • Active: effective start = joinedDate ?? activeStartByTeam[team] ?? 0; t ≥ start.
   * The default for active rows is "the day after the latest historic composition
   * ended", so newly added members do not get attributed to past programari
   * that happened before they joined.
   */
  private membershipCoversDate(m: { teamName: string; active: boolean; joinedDate?: Date; endDate?: Date }, t: number): boolean {
    if (!m.active) {
      const start = m.joinedDate?.getTime() ?? 0;
      const end = m.endDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
      return t >= start && t <= end;
    }
    const start = m.joinedDate?.getTime() ?? this.activeStartByTeam.get(m.teamName) ?? 0;
    return t >= start;
  }

  /* ─────── Internals ─────── */
  private buildLookupMaps(): void {
    for (const y of this.youths) {
      this.youthById.set(y.id, y);
      this.youthByName.set(y.fullName, y);
    }
    for (const p of this.parents) this.parentById.set(p.id, p);

    /* Index parents per programare from `entry.parentSupporters` (ID-uri). */
    for (const e of this.sortedSchedule) {
      const ids = e.parentSupporters;
      if (!ids || ids.length === 0) continue;
      const list: Parent[] = [];
      for (const id of ids) {
        const p = this.parentById.get(id);
        if (p) list.push(p);
      }
      if (list.length > 0) this.parentsByEvent.set(e, list);
    }

    for (const link of PARENT_YOUTH_LINKS) {
      const youth = this.youthById.get(link.youthId);
      const parent = this.parentById.get(link.parentId);
      if (youth) pushTo(this.youthsForParentMap, link.parentId, { youth, relationship: link.relationship });
      if (parent) pushTo(this.parentsForYouthMap, link.youthId, { parent, relationship: link.relationship });
    }

    /* Per-team active-window start = latest historical endDate + 1ms.
     * Defaults to 0 (epoch) for teams without any historical composition. */
    for (const m of YOUTH_TEAM_MEMBERSHIPS) {
      if (m.active || !m.endDate) continue;
      const t = m.endDate.getTime() + 1;
      const cur = this.activeStartByTeam.get(m.teamName) ?? 0;
      if (t > cur) this.activeStartByTeam.set(m.teamName, t);
    }

    for (const m of YOUTH_TEAM_MEMBERSHIPS) {
      if (m.active) {
        const y = this.youthById.get(m.youthId);
        if (y) pushTo(this.youthsByTeam, m.teamName, y);
        pushTo(this.activeTeamsByYouth, m.youthId, { teamName: m.teamName, role: m.role });
        if (m.role === 'coordonator' && !this.coordinatorByTeam.has(m.teamName)) {
          this.coordinatorByTeam.set(m.teamName, y);
        }
      } else {
        pushTo(this.historicalTeamsByYouth, m.youthId, {
          teamName: m.teamName, role: m.role, endDate: m.endDate,
        });
      }
    }

    for (const e of this.upcomingSchedule) {
      if (!this.nextEventByTeam.has(e.team)) this.nextEventByTeam.set(e.team, e);
      pushTo(this.upcomingEventsByTeam, e.team, e);
    }
    for (const e of this.pastSchedule) {
      pushTo(this.pastEventsByTeam, e.team, e);
    }
    /* Past events newest-first per team. */
    for (const [t, list] of this.pastEventsByTeam) {
      this.pastEventsByTeam.set(t, [...list].sort((a, b) => b.date.getTime() - a.date.getTime()));
    }

    /* Upcoming/past per parent — derived from per-event parentSupporters. */
    for (const [entry, supporters] of this.parentsByEvent) {
      const isPast = entry.date.getTime() < this.today.getTime();
      for (const p of supporters) {
        if (isPast) {
          pushTo(this.pastEventsByParent, p.id, entry);
        } else {
          pushTo(this.upcomingEventsByParent, p.id, entry);
          if (!this.nextEventByParent.has(p.id)) {
            this.nextEventByParent.set(p.id, entry);
          }
        }
      }
    }
    /* Sort: upcoming asc, past desc. */
    for (const [pid, list] of this.upcomingEventsByParent) {
      this.upcomingEventsByParent.set(pid, [...list].sort((a, b) => a.date.getTime() - b.date.getTime()));
      // refresh next event after sorting
      this.nextEventByParent.set(pid, this.upcomingEventsByParent.get(pid)![0]);
    }
    for (const [pid, list] of this.pastEventsByParent) {
      this.pastEventsByParent.set(pid, [...list].sort((a, b) => b.date.getTime() - a.date.getTime()));
    }

    for (const [youthId, activeTeams] of this.activeTeamsByYouth) {
      const teamSet = new Set(activeTeams.map(t => t.teamName));
      /* Per-team effective joinedDate (auto-defaulted from active window). */
      const startByTeam = new Map<string, number>();
      for (const m of YOUTH_TEAM_MEMBERSHIPS) {
        if (m.youthId !== youthId || !m.active) continue;
        const start = m.joinedDate?.getTime() ?? this.activeStartByTeam.get(m.teamName) ?? 0;
        const cur = startByTeam.get(m.teamName);
        /* If a youth has multiple active rows for same team, take the earliest. */
        if (cur === undefined || start < cur) startByTeam.set(m.teamName, start);
      }
      const upcoming = this.upcomingSchedule.filter(e => {
        if (!teamSet.has(e.team)) return false;
        const start = startByTeam.get(e.team) ?? 0;
        return e.date.getTime() >= start;
      });
      if (upcoming.length > 0) {
        this.nextEventByYouth.set(youthId, upcoming[0]);
        this.upcomingEventsByYouth.set(youthId, upcoming);
      }
    }

    /* Past participation per youth (active + historical memberships, respecting
     * joinedDate/endDate; for active rows without joinedDate, the implicit start
     * is the active-window start of the team — i.e. day after the latest closed
     * composition ended). */
    const pastByYouth = new Map<string, Array<{ entry: ScheduleEntry; role: YouthRole; teamName: string; historical: boolean }>>();
    for (const m of YOUTH_TEAM_MEMBERSHIPS) {
      for (const e of this.pastSchedule) {
        if (e.team !== m.teamName) continue;
        if (!this.membershipCoversDate(m, e.date.getTime())) continue;
        pushTo(pastByYouth, m.youthId, { entry: e, role: m.role, teamName: m.teamName, historical: !m.active });
      }
    }
    /* Sort each youth's past events most-recent first and dedupe identical date+team rows. */
    for (const [yid, list] of pastByYouth) {
      const seen = new Set<string>();
      const sorted = list
        .sort((a, b) => b.entry.date.getTime() - a.entry.date.getTime())
        .filter(x => {
          const key = x.entry.date.getTime() + '|' + x.teamName;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      this.pastEventsByYouth.set(yid, sorted);
    }

    this.buildCompositionTimeline();
  }

  /**
   * Build per-team composition timeline from membership rows, then resolve each
   * event to the composition active on its date. Events that fall before the
   * earliest historical end-date or any anomaly default to the active comp.
   */
  private buildCompositionTimeline(): void {
    /* 1. Group memberships per (team, endDateKey). */
    interface Bucket { teamName: string; end?: Date; active: boolean; rows: typeof YOUTH_TEAM_MEMBERSHIPS; }
    const buckets = new Map<string, Bucket>();
    for (const m of YOUTH_TEAM_MEMBERSHIPS) {
      const key = m.active
        ? `${m.teamName}|active`
        : `${m.teamName}|${m.endDate?.getTime() ?? 0}`;
      let b = buckets.get(key);
      if (!b) {
        b = { teamName: m.teamName, end: m.active ? undefined : m.endDate, active: m.active, rows: [] as any };
        buckets.set(key, b);
      }
      (b.rows as any).push(m);
    }
    /* 2. Materialize compositions and group per team. */
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
      const comp: TeamComposition = {
        teamName: b.teamName,
        coordinator: coord,
        coordinatorName: coord?.fullName ?? '—',
        members,
        end: b.end,
        isActive: b.active,
        historyKey: b.active ? undefined : `${b.teamName}-${b.end?.getTime() ?? 0}`,
      };
      pushTo(this.compositionsByTeam, b.teamName, comp);
    }
    /* 3. Sort: historical first by ascending end, active last. */
    for (const [team, list] of this.compositionsByTeam) {
      list.sort((a, b) => {
        if (a.isActive !== b.isActive) return a.isActive ? 1 : -1;
        return (a.end?.getTime() ?? 0) - (b.end?.getTime() ?? 0);
      });
      this.compositionsByTeam.set(team, list);
    }
    /* 4. Resolve each event to its composition (first historical whose end >= date, else active). */
    for (const e of this.sortedSchedule) {
      const comps = this.compositionsByTeam.get(e.team);
      if (!comps || comps.length === 0) continue;
      const t = e.date.getTime();
      let chosen: TeamComposition | undefined;
      for (const c of comps) {
        if (!c.isActive && c.end && t <= c.end.getTime()) { chosen = c; break; }
      }
      if (!chosen) chosen = comps.find(c => c.isActive) ?? comps[comps.length - 1];
      this.compositionByEvent.set(e, chosen);
    }
  }

  private groupByMonth(list: ScheduleEntry[], reverse: boolean): MonthGroup<ScheduleEntry>[] {
    const groups = new Map<string, ScheduleEntry[]>();
    const source = reverse ? [...list].reverse() : list;
    for (const e of source) {
      const key = `${e.date.getFullYear()}-${e.date.getMonth()}`;
      pushTo(groups, key, e);
    }
    const out: MonthGroup<ScheduleEntry>[] = [];
    for (const [key, entries] of groups) {
      const [y, m] = key.split('-').map(Number);
      out.push({ key, label: `${MONTHS_LONG[m]} ${y}`, entries });
    }
    return out;
  }

  private computeMealsServed(): number {
    let meals = 0;
    for (const e of this.pastSchedule) {
      if (e.completed && e.programType.toLowerCase().includes('tineret')) {
        meals += e.estimatedPersons || 0;
      }
    }
    return meals;
  }

  private computeCoordinatorRotations(): CoordinatorRotation[] {
    const map = new Map<string, CoordinatorRotation>();
    for (const e of this.pastSchedule) {
      const key = `${e.coordinator}__${e.team}`;
      let entry = map.get(key);
      if (!entry) {
        entry = { name: e.coordinator, team: e.team, count: 0, color: getTeamColor(e.team) };
        map.set(key, entry);
      }
      entry.count++;
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }

  private computeScheduleStats(): ScheduleStats {
    const month = this.today.getMonth();
    const year = this.today.getFullYear();
    let thisMonth = 0;
    for (const e of this.upcomingSchedule) {
      if (e.date.getMonth() === month && e.date.getFullYear() === year) thisMonth++;
    }
    return {
      upcoming: this.upcomingSchedule.length,
      thisMonth,
      completed: this.pastSchedule.length,
      teams: this.teams.length,
    };
  }

  private computeYouthStats(): YouthStats {
    let coordinators = 0;
    let total = 0;
    for (const y of this.youths) {
      if (y.active === false) continue;
      total++;
      if (this.isActiveCoordinator(y.id)) coordinators++;
    }
    const thisWeek = this.nextEvent
      ? (this.youthsByTeam.get(this.nextEvent.team)?.length ?? 0)
      : 0;
    return { total, coordinators, thisWeek };
  }

  private computeNextParentEvent() {
    for (const entry of this.upcomingSchedule) {
      const people = this.parentsByEvent.get(entry);
      if (people && people.length > 0) return { entry, people };
    }
    return null;
  }

  private computeUpcomingParentEvents() {
    const list: Array<{ entry: ScheduleEntry; people: Parent[] }> = [];
    for (const entry of this.upcomingSchedule) {
      const people = this.parentsByEvent.get(entry);
      if (people && people.length > 0) list.push({ entry, people });
    }
    // Return all except the very first one (which is `nextParentEvent`)
    return list.slice(1);
  }
}

/* Local helper: push to a Map<K, V[]> with on-demand bucket creation. */
function pushTo<K, V>(map: Map<K, V[]>, key: K, value: V): void {
  let bucket = map.get(key);
  if (!bucket) { bucket = []; map.set(key, bucket); }
  bucket.push(value);
}
