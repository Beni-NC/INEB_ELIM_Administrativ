import { DraftEntry } from '../../core/utils/data-source.utils';

/**
 * Avisos de una programación en preparación (panel `/admin`). Son **puros** para poder probarlos
 * y para que la vista solo tenga que traducir `admin.check.<key>`:
 *  - `error`: si se pega tal cual, los datos quedarán mal (fecha ocupada, repetida, sin coordinador).
 *  - `warning`: es posible y a veces querido (un martes de excepción, un coordinador invitado),
 *    pero conviene verlo antes de copiar.
 */
export type CheckLevel = 'error' | 'warning';

export interface DraftCheck {
  readonly level: CheckLevel;
  /** Clave i18n `admin.check.<key>`. */
  readonly key: string;
}

export interface CheckContext {
  /** Fechas (en ms) que ya existen en los datos publicados. */
  readonly takenDates: ReadonlySet<number>;
  /** Fechas (en ms) del resto de filas en preparación. */
  readonly otherDraftDates: readonly number[];
  readonly today: Date;
  /** Nombres de los miembros de la composición activa del equipo. */
  readonly teamMembers: readonly string[];
}

const FRIDAY = 5;
const MAX_PERSONS = 500;

export function checkDraft(d: DraftEntry, ctx: CheckContext): DraftCheck[] {
  const out: DraftCheck[] = [];
  const time = d.date.getTime();

  if (Number.isNaN(time)) return [{ level: 'error', key: 'invalid_date' }];
  if (ctx.takenDates.has(time)) out.push({ level: 'error', key: 'date_taken' });
  if (ctx.otherDraftDates.filter(t => t === time).length > 0) out.push({ level: 'error', key: 'date_duplicated' });
  if (!d.coordinatorName || d.coordinatorName === '—') out.push({ level: 'error', key: 'no_coordinator' });
  if (new Set(d.parentIds).size !== d.parentIds.length) out.push({ level: 'error', key: 'duplicate_parents' });
  if (!Number.isFinite(d.estimatedPersons) || d.estimatedPersons < 1 || d.estimatedPersons > MAX_PERSONS) {
    out.push({ level: 'error', key: 'bad_persons' });
  }

  if (d.date.getDay() !== FRIDAY) out.push({ level: 'warning', key: 'not_friday' });
  if (time < ctx.today.getTime()) out.push({ level: 'warning', key: 'past_date' });
  if (d.coordinatorName && d.coordinatorName !== '—' && ctx.teamMembers.length > 0 && !ctx.teamMembers.includes(d.coordinatorName)) {
    out.push({ level: 'warning', key: 'coordinator_outside_team' });
  }
  if (d.parentIds.length === 0) out.push({ level: 'warning', key: 'no_parents' });

  return out;
}

export function hasErrors(checks: readonly DraftCheck[]): boolean {
  return checks.some(c => c.level === 'error');
}
