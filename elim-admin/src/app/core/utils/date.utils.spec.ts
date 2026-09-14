import { describe, expect, it } from 'vitest';
import { FRIDAY, nextWeekday, seasonStartOf } from './date.utils';

describe('nextWeekday', () => {
  it('devuelve el propio día si ya es ese día de la semana y no se exige avance', () => {
    expect(nextWeekday(new Date(2026, 8, 18, 15, 0), FRIDAY)).toEqual(new Date(2026, 8, 18)); // viernes
    expect(nextWeekday(new Date(2026, 8, 14), FRIDAY)).toEqual(new Date(2026, 8, 18));        // lunes → viernes
  });

  it('con avance mínimo salta al siguiente', () => {
    expect(nextWeekday(new Date(2026, 8, 18), FRIDAY, 1)).toEqual(new Date(2026, 8, 25));
  });
});

describe('seasonStartOf', () => {
  it('la temporada empieza el 1 de septiembre', () => {
    expect(seasonStartOf(new Date(2026, 8, 14))).toEqual(new Date(2026, 8, 1));
    expect(seasonStartOf(new Date(2026, 4, 6))).toEqual(new Date(2025, 8, 1));
  });
});
