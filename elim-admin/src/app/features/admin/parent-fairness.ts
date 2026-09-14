import { MS_PER_DAY } from '../../core/constants';

/**
 * Reparto justo de los padres de apoyo.
 *
 * Repartir "por turnos" no basta: lo que molesta de verdad no es ayudar muchas veces al año, sino
 * que te toque **dos viernes seguidos** mientras otros llevan meses sin salir. Aquí se elige a
 * quien menos carga tiene **y** más separado queda de sus otras fechas, y se avisa cuando dos
 * apoyos de la misma persona caen demasiado juntos.
 *
 * Puro (sin Angular, sin fechas "de hoy"): entra el historial y sale la decisión.
 */

/** Separación mínima recomendada entre dos apoyos de la misma persona. */
export const MIN_GAP_DAYS = 28;

export interface ParentLoad {
  readonly id: string;
  /** Fechas (ms) en las que ya ayuda: pasadas, futuras y las de la tanda que se está preparando. */
  readonly dates: readonly number[];
}

/** Días hasta la fecha ya asignada más cercana (Infinity si nunca ha ayudado). */
export function nearestGapDays(load: ParentLoad, date: Date): number {
  if (load.dates.length === 0) return Infinity;
  const target = date.getTime();
  return Math.min(...load.dates.map(d => Math.abs(d - target))) / MS_PER_DAY;
}

/**
 * Todos los candidatos ordenados de más a menos adecuado para esa fecha:
 *  1. quien **no** queda demasiado pegado a otro apoyo suyo (separación ≥ `minGapDays`),
 *  2. quien menos veces ayuda en total,
 *  3. quien queda más separado de sus otras fechas,
 *  4. el orden en que llega el `pool` (el criterio elegido en el panel: menos solicitados,
 *     más tiempo sin ayudar o alfabético).
 */
export function rankParents(pool: readonly ParentLoad[], date: Date, minGapDays = MIN_GAP_DAYS): string[] {
  return pool
    .map((load, order) => ({ load, order, gap: nearestGapDays(load, date) }))
    .sort((a, b) => {
      const conflict = Number(a.gap < minGapDays) - Number(b.gap < minGapDays);
      if (conflict !== 0) return conflict;
      if (a.load.dates.length !== b.load.dates.length) return a.load.dates.length - b.load.dates.length;
      if (a.gap !== b.gap) return b.gap - a.gap;
      return a.order - b.order;
    })
    .map(r => r.load.id);
}

/**
 * Los `perEvent` primeros de esa lista. Si no hay suficientes candidatos "cómodos", se completa con
 * los menos malos: es mejor proponer algo y avisar que dejar el hueco vacío.
 */
export function pickParents(pool: readonly ParentLoad[], date: Date, perEvent = 2, minGapDays = MIN_GAP_DAYS): string[] {
  return rankParents(pool, date, minGapDays).slice(0, Math.min(perEvent, pool.length));
}

/** Lo que se aconseja para un hueco de padre concreto. */
export interface SlotAdvice {
  /** Recambio propuesto; cadena vacía si no hay ningún otro candidato. */
  readonly suggestionId: string;
  /** Días entre quien está puesto ahí y su apoyo más cercano; `null` si el hueco está vacío. */
  readonly gapDays: number | null;
  /** Quien está puesto ahí vuelve a ayudar antes de `minGapDays`. */
  readonly tooSoon: boolean;
}

/**
 * Aconseja para un hueco concreto: `pool` son los candidatos posibles —ya sin los que ocupan los
 * otros huecos de esa misma programación— y `current` quien está puesto ahora.
 *
 * Si el hueco está vacío o quien está ayuda demasiado seguido, se propone **el mejor** de la lista;
 * si ya está bien, el siguiente. Así, pulsando repetidamente, se recorren las alternativas de mejor
 * a peor y se vuelve al principio, sin necesidad de recordar nada entre clic y clic.
 */
export function adviseSlot(pool: readonly ParentLoad[], date: Date, current: string,
                           minGapDays = MIN_GAP_DAYS): SlotAdvice {
  const ranked = rankParents(pool, date, minGapDays);
  const load = pool.find(p => p.id === current);
  const gap = load ? nearestGapDays(load, date) : Infinity;
  const best = ranked.find(id => id !== current) ?? '';
  const next = ranked[(ranked.indexOf(current) + 1) % ranked.length] ?? '';
  const tooSoon = gap < minGapDays;
  return {
    suggestionId: !load || tooSoon ? best : (next === current ? '' : next),
    gapDays: load && Number.isFinite(gap) ? Math.round(gap) : null,
    tooSoon,
  };
}

export interface Assignment {
  readonly date: Date;
  readonly parentIds: readonly string[];
}

/** Dos apoyos seguidos de la misma persona que caen demasiado juntos. */
export interface Clash {
  readonly id: string;
  /** Días entre los dos. */
  readonly gapDays: number;
  /** El apoyo que conviene cambiar: el segundo de los dos (el primero puede ser ya pasado). */
  readonly time: number;
  /** El apoyo anterior, el que lo deja demasiado pegado. */
  readonly previousTime: number;
}

/**
 * Todos los choques de la lista, ordenados por fecha. Da la fecha exacta, y no solo el nombre,
 * porque con ella se puede ofrecer el arreglo: cambiar a esa persona **en esa programación**.
 */
export function clashes(assignments: readonly Assignment[], minGapDays = MIN_GAP_DAYS): Clash[] {
  const byParent = new Map<string, number[]>();
  for (const a of assignments) {
    for (const id of a.parentIds) byParent.set(id, [...(byParent.get(id) ?? []), a.date.getTime()]);
  }
  const out: Clash[] = [];
  for (const [id, times] of byParent) {
    const sorted = [...times].sort((a, b) => a - b);
    for (let i = 1; i < sorted.length; i++) {
      const gapDays = Math.round((sorted[i] - sorted[i - 1]) / MS_PER_DAY);
      if (gapDays < minGapDays) out.push({ id, gapDays, time: sorted[i], previousTime: sorted[i - 1] });
    }
  }
  return out.sort((a, b) => a.time - b.time || a.gapDays - b.gapDays);
}

export interface TooSoon {
  readonly id: string;
  /** Días entre los dos apoyos más juntos de esa persona. */
  readonly gapDays: number;
}

/**
 * Resumen por persona de una lista de choques: la separación más justa de cada una, de peor a
 * mejor. Es lo que se enseña como aviso: "esta persona ayuda demasiado seguido".
 */
export function crowdedParents(list: readonly Clash[]): TooSoon[] {
  const smallest = new Map<string, number>();
  for (const c of list) smallest.set(c.id, Math.min(smallest.get(c.id) ?? Infinity, c.gapDays));
  return [...smallest].map(([id, gapDays]) => ({ id, gapDays })).sort((a, b) => a.gapDays - b.gapDays);
}
