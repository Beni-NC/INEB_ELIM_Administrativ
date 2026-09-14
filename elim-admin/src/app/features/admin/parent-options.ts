import { Parent } from '../../core/models';

/**
 * Cómo se ofrecen los padres al repartir apoyos. En un `<option>` no caben ni pipes ni maquetación,
 * así que la etiqueta se compone aquí: **nombre · nº de apoyos · última vez**. Con eso se ve de un
 * vistazo a quién le toca, que es justo el criterio para repartir.
 */
export type ParentSort = 'workload' | 'oldest' | 'name';

export interface ParentStat {
  readonly parent: Parent;
  /** Apoyos totales (pasados y futuros ya asignados). */
  readonly total: number;
  /** Última vez que ayudó; `null` si nunca. */
  readonly last: Date | null;
  /** Apoyos ya programados en el futuro. */
  readonly upcoming: number;
}

/** Ordena por el criterio elegido; a igualdad, el que lleva más tiempo sin ayudar y luego por nombre. */
export function sortParents(stats: readonly ParentStat[], sort: ParentSort): ParentStat[] {
  const byLast = (a: ParentStat, b: ParentStat): number => (a.last?.getTime() ?? 0) - (b.last?.getTime() ?? 0);
  const byName = (a: ParentStat, b: ParentStat): number => a.parent.name.localeCompare(b.parent.name, 'ro');
  return [...stats].sort((a, b) => {
    if (sort === 'name') return byName(a, b);
    if (sort === 'oldest') return byLast(a, b) || a.total - b.total || byName(a, b);
    return a.total - b.total || byLast(a, b) || byName(a, b);
  });
}

/**
 * Reparte `perEvent` padres a cada programación recorriendo la lista **en el orden recibido**, que
 * es el criterio elegido (menos solicitados primero). Nunca repite dentro de la misma programación
 * y, si hay menos padres que huecos, asigna los que haya.
 */
export function distributeParents(count: number, pool: readonly string[], perEvent = 2): string[][] {
  const take = Math.min(perEvent, pool.length);
  const out: string[][] = [];
  let i = 0;
  for (let e = 0; e < count; e++) {
    const ids: string[] = [];
    while (ids.length < take) ids.push(pool[i++ % pool.length]);
    out.push(ids);
  }
  return out;
}

/** "Maria Bîrle · 2× · 15 mai 2026" (o "· niciodată" si nunca ha ayudado). */
export function parentOptionLabel(stat: ParentStat, locale: string, neverLabel: string): string {
  const last = stat.last
    ? new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(stat.last).replace(/\./g, '')
    : neverLabel;
  return `${stat.parent.name} · ${stat.total}× · ${last}`;
}
