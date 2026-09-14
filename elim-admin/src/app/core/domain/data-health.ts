import { DomainData, ScheduleEntry } from '../models';
import { ScheduleIndex } from './schedule-index';
import { TEAM_COLORS } from '../constants';

/**
 * Diagnóstico de los datos escritos a mano en `core/data/*.data.ts`.
 *
 * Es la MISMA lógica para dos consumidores: `data-integrity.spec.ts` (falla el build si hay
 * errores) y el módulo `/admin` (los muestra con el detalle para arreglarlos). Por eso vive en
 * `core/domain` y es puro: sin Angular, sin i18n (devuelve claves y datos; el texto lo pone la
 * vista o el test).
 *
 * `error` = la app mostrará algo mal (un vínculo que no aparece, un contador incompleto).
 * `warning` = probablemente falte trabajo de planificación o sea una errata, pero la app funciona.
 */
export type IssueLevel = 'error' | 'warning';

export interface DataIssue {
  /** Identificador estable; la vista traduce `admin.health.<id>`. */
  readonly id: string;
  readonly level: IssueLevel;
  /** Entidades afectadas, ya legibles ("Echipa 4 · 10-03-2025"). */
  readonly items: readonly string[];
}

const dateKey = (d: Date): string => `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
const WEEKDAYS = ['dum', 'lun', 'mar', 'mie', 'joi', 'vin', 'sâm'];
const duplicates = <T>(list: readonly T[]): T[] => [...new Set(list.filter((x, i) => list.indexOf(x) !== i))];
/** Lista sin repetidos: un mismo id roto puede aparecer en varias filas y basta con señalarlo una vez. */
const unique = <T>(list: readonly T[]): T[] => [...new Set(list)];
const eventLabel = (e: ScheduleEntry): string => `${e.team} · ${dateKey(e.date)}`;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
/** La actividad es los viernes; otro día suele ser una errata al teclear la fecha. */
const FRIDAY = 5;

/**
 * Revisa `data` (por defecto, los datos reales) y devuelve solo los problemas encontrados.
 * `today` decide qué es "futuro" en los avisos de planificación.
 */
export function checkDomainData(data: DomainData, today = new Date()): DataIssue[] {
  const index = new ScheduleIndex(today, data);
  const { schedule, youths, memberships, parents, parentYouthLinks } = data;
  const youthIds = new Set(youths.map(y => y.id));
  const parentIds = new Set(parents.map(p => p.id));
  const teamNames = new Set(memberships.map(m => m.teamName));
  const issues: DataIssue[] = [];
  const add = (id: string, level: IssueLevel, items: string[]): void => { if (items.length > 0) issues.push({ id, level, items }); };

  /* ── Identificadores ───────────────────────────────────────────── */
  add('duplicate_youth_id', 'error', duplicates(youths.map(y => y.id)));
  add('duplicate_parent_id', 'error', duplicates(parents.map(p => p.id)));
  // El coordinador de una programación se resuelve por nombre: dos jóvenes homónimos lo romperían.
  add('duplicate_youth_name', 'error', duplicates(index.youths.map(y => y.fullName)));

  /* ── Equipos y pertenencias ────────────────────────────────────── */
  add('unknown_youth_in_membership', 'error', unique(memberships.filter(m => !youthIds.has(m.youthId)).map(m => `${m.youthId} (${m.teamName})`)));
  add('team_without_color', 'error', [...teamNames].filter(t => !(t in TEAM_COLORS)));

  const coordsByTeam = new Map<string, number>();
  for (const m of memberships) {
    if (!m.active) continue;
    coordsByTeam.set(m.teamName, (coordsByTeam.get(m.teamName) ?? 0) + (m.role === 'coordonator' ? 1 : 0));
  }
  add('coordinator_count', 'error', [...coordsByTeam].filter(([, n]) => n !== 1).map(([team, n]) => `${team} (${n})`));
  add('duplicate_membership', 'error',
    duplicates(memberships.map(m => `${m.teamName}|${m.active ? 'activă' : dateKey(m.endDate ?? new Date(0))}|${m.youthId}`)));
  add('closed_membership_without_end', 'error', memberships.filter(m => !m.active && !m.endDate).map(m => `${m.youthId} (${m.teamName})`));
  add('active_membership_with_end', 'error', memberships.filter(m => m.active && m.endDate).map(m => `${m.youthId} (${m.teamName})`));

  /* ── Programaciones ────────────────────────────────────────────── */
  add('invalid_date', 'error', schedule.filter(e => Number.isNaN(e.date.getTime())).map(e => e.team));
  add('date_with_time', 'error', schedule.filter(e => e.date.getHours() + e.date.getMinutes() + e.date.getSeconds() > 0).map(eventLabel));
  add('duplicate_date', 'error', duplicates(schedule.map(e => dateKey(e.date))));
  add('unknown_team', 'error', schedule.filter(e => !teamNames.has(e.team)).map(eventLabel));
  add('unknown_coordinator', 'error',
    schedule.filter(e => !index.getYouthByName(e.coordinator)).map(e => `${e.coordinator} → ${eventLabel(e)}`));
  add('coordinator_not_in_team', 'error', schedule.filter(e => {
    const y = index.getYouthByName(e.coordinator);
    const comp = index.getCompositionForEvent(e);
    return !!y && !!comp && !comp.members.some(m => m.id === y.id);
  }).map(e => `${e.coordinator} → ${eventLabel(e)}`));
  add('unknown_parent_supporter', 'error',
    schedule.flatMap(e => (e.parentSupporters ?? []).filter(id => !parentIds.has(id)).map(id => `${id} → ${eventLabel(e)}`)));
  add('duplicate_parent_supporter', 'error',
    schedule.filter(e => duplicates(e.parentSupporters ?? []).length > 0).map(eventLabel));
  add('bad_time_format', 'error', schedule.filter(e =>
    [e.programStartTime, e.youthsArrivalTime, e.parentsFoodArrivalTime].some(t => !!t && !TIME_RE.test(t))).map(eventLabel));

  /* ── Vínculos familiares ───────────────────────────────────────── */
  add('unknown_parent_in_link', 'error', unique(parentYouthLinks.filter(l => !parentIds.has(l.parentId)).map(l => l.parentId)));
  add('unknown_youth_in_link', 'error', unique(parentYouthLinks.filter(l => !youthIds.has(l.youthId)).map(l => l.youthId)));
  add('duplicate_link', 'error', duplicates(parentYouthLinks.map(l => `${l.parentId} ↔ ${l.youthId}`)));

  /* ── Avisos (planificación pendiente o erratas probables) ──────── */
  add('not_friday', 'warning', schedule.filter(e => e.date.getDay() !== FRIDAY).map(e => `${eventLabel(e)} (${WEEKDAYS[e.date.getDay()]})`));
  add('team_without_upcoming', 'warning', index.teamRotation.filter(r => !r.next).map(r => r.teamName));
  add('upcoming_without_parents', 'warning', index.upcomingWithoutParents.map(eventLabel));
  add('youth_without_team', 'warning',
    index.activeYouths.filter(y => index.getActiveTeamsForYouth(y.id).length === 0).map(y => y.fullName));

  return issues;
}

export function errorsOf(issues: readonly DataIssue[]): DataIssue[] {
  return issues.filter(i => i.level === 'error');
}

export function warningsOf(issues: readonly DataIssue[]): DataIssue[] {
  return issues.filter(i => i.level === 'warning');
}
