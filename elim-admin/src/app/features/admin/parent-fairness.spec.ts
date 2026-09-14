import { describe, expect, it } from 'vitest';
import { MIN_GAP_DAYS, ParentLoad, adviseSlot, clashes, crowdedParents, nearestGapDays, pickParents } from './parent-fairness';

const day = (d: number): number => new Date(2026, 8, d).getTime();
const load = (id: string, ...days: number[]): ParentLoad => ({ id, dates: days.map(day) });

describe('parent-fairness — a quién le toca', () => {
  it('prefiere a quien nunca ha ayudado', () => {
    const pool = [load('p-1', 1), load('p-2'), load('p-3', 1, 8)];
    expect(pickParents(pool, new Date(2026, 8, 25), 1)).toEqual(['p-2']);
  });

  it('a igualdad de carga, al que queda más separado de sus otras fechas', () => {
    const pool = [load('p-1', 20), load('p-2', 1)];   // objetivo: 25 de septiembre
    expect(pickParents(pool, new Date(2026, 8, 25), 1)).toEqual(['p-2']);
    expect(Math.round(nearestGapDays(pool[0], new Date(2026, 8, 25)))).toBe(5);
  });

  it('evita a quien quedaría a menos de cuatro semanas, aunque tenga menos apoyos', () => {
    // p-cerca solo ayudó una vez, pero sería tres días antes; p-lejos ayudó dos veces en agosto.
    const pool = [load('p-cerca', 22), load('p-lejos', -20, -13)];
    expect(pickParents(pool, new Date(2026, 8, 25), 1)).toEqual(['p-lejos']);
  });

  it('si no hay alternativa, propone igualmente (mejor eso que dejarlo vacío)', () => {
    const pool = [load('p-1', 24), load('p-2', 26)];
    expect(pickParents(pool, new Date(2026, 8, 25), 2)).toHaveLength(2);
    expect(pickParents([], new Date(2026, 8, 25))).toEqual([]);
  });

  it('a igualdad de todo, respeta el orden del criterio elegido', () => {
    expect(pickParents([load('p-a'), load('p-b')], new Date(2026, 8, 25), 2)).toEqual(['p-a', 'p-b']);
  });
});

describe('parent-fairness — quién ayuda demasiado seguido', () => {
  const assignments = [
    { date: new Date(2026, 8, 4), parentIds: ['p-1', 'p-2'] },
    { date: new Date(2026, 8, 11), parentIds: ['p-1'] },        // 7 días después
    { date: new Date(2026, 9, 30), parentIds: ['p-2'] },        // casi dos meses después
  ];

  it('da el choque con su fecha: la del apoyo que conviene cambiar', () => {
    expect(clashes(assignments, MIN_GAP_DAYS)).toEqual([
      { id: 'p-1', gapDays: 7, time: new Date(2026, 8, 11).getTime(), previousTime: new Date(2026, 8, 4).getTime() },
    ]);
  });

  it('no señala nada si todos van holgados', () => {
    expect(clashes(assignments, 5)).toEqual([]);
  });

  it('resume por persona quedándose con su separación más justa', () => {
    const list = [
      { id: 'p-1', gapDays: 21, time: 3, previousTime: 2 },
      { id: 'p-1', gapDays: 7, time: 2, previousTime: 1 },
      { id: 'p-2', gapDays: 14, time: 5, previousTime: 4 },
    ];
    expect(crowdedParents(list)).toEqual([{ id: 'p-1', gapDays: 7 }, { id: 'p-2', gapDays: 14 }]);
  });
});

describe('parent-fairness — consejo de un hueco concreto', () => {
  const target = new Date(2026, 8, 25);

  it('en un hueco vacío propone al mejor y no avisa de nada', () => {
    // p-2 nunca ha ayudado; p-3 saldría a 24 días y p-1 a 3: los dos van demasiado justos.
    const advice = adviseSlot([load('p-1', 22), load('p-2'), load('p-3', 1)], target, '');
    expect(advice).toEqual({ suggestionId: 'p-2', gapDays: null, tooSoon: false });
  });

  it('si el que está va bien, ofrece la siguiente alternativa y vuelve al principio al acabar', () => {
    const pool = [load('p-a'), load('p-b'), load('p-c')];
    expect(adviseSlot(pool, target, 'p-a').suggestionId).toBe('p-b');
    expect(adviseSlot(pool, target, 'p-b').suggestionId).toBe('p-c');
    expect(adviseSlot(pool, target, 'p-c').suggestionId).toBe('p-a');
  });

  it('si el que está ayuda demasiado pronto, lo dice con los días y propone al mejor', () => {
    const advice = adviseSlot([load('p-cerca', 22), load('p-lejos', -20)], target, 'p-cerca');
    expect(advice).toEqual({ suggestionId: 'p-lejos', gapDays: 3, tooSoon: true });
  });

  it('sin nadie a quien proponer, avisa igualmente pero no ofrece recambio', () => {
    expect(adviseSlot([load('p-solo', 22)], target, 'p-solo')).toEqual({ suggestionId: '', gapDays: 3, tooSoon: true });
  });
});
