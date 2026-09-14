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

export const FRIDAY = 5;

/**
 * Primer día de la semana `weekday` (0 = domingo) a partir de `from` (a medianoche). Con
 * `minDaysAhead = 0` el propio `from` cuenta si ya es ese día; con 1, se salta al siguiente.
 */
export function nextWeekday(from: Date, weekday: number, minDaysAhead = 0): Date {
  const r = startOfDay(from);
  r.setDate(r.getDate() + minDaysAhead);
  r.setDate(r.getDate() + ((weekday - r.getDay() + 7) % 7));
  return r;
}

/** 1 de septiembre de la temporada (año escolar) a la que pertenece `d`. */
export function seasonStartOf(d: Date): Date {
  return new Date(d.getMonth() >= 8 ? d.getFullYear() : d.getFullYear() - 1, 8, 1);
}
