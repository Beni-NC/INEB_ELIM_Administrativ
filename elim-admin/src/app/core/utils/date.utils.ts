import { MS_PER_DAY } from '../constants';

/**
 * Aritmética de fechas pura (sin formateo: eso lo hace el pipe `ldate`).
 * `ref` se pasa siempre como argumento para no acoplar al reloj.
 */

/** Días enteros desde `ref` hasta `target` (ambas a medianoche). Negativo si ya pasó. */
export function daysBetween(target: Date, ref: Date): number {
  return Math.ceil((target.getTime() - ref.getTime()) / MS_PER_DAY);
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

export function startOfDay(d = new Date()): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}
