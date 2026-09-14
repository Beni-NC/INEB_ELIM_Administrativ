import { describe, expect, it } from 'vitest';
import { CheckContext, checkDraft, hasErrors } from './draft-checks';
import { DraftEntry } from '../../core/utils/data-source.utils';

const TODAY = new Date(2026, 8, 14);              // lunes 14-09-2026
const FRIDAY = new Date(2026, 8, 25);             // viernes libre
const draft = (extra: Partial<DraftEntry> = {}): DraftEntry => ({
  date: FRIDAY, teamName: 'Echipa 1', coordinatorName: 'Halas Luigi', estimatedPersons: 60, parentIds: ['p-001'], ...extra,
});
const ctx = (extra: Partial<CheckContext> = {}): CheckContext => ({
  takenDates: new Set<number>(), otherDraftDates: [], today: TODAY, teamMembers: ['Halas Luigi'], ...extra,
});
const keys = (d: DraftEntry, c: CheckContext = ctx()): string[] => checkDraft(d, c).map(x => x.key);

describe('checkDraft', () => {
  it('no dice nada de una programación correcta', () => {
    expect(keys(draft())).toEqual([]);
  });

  it('detecta lo que rompería los datos: fecha ocupada, repetida, sin coordinador o padres duplicados', () => {
    expect(keys(draft(), ctx({ takenDates: new Set([FRIDAY.getTime()]) }))).toContain('date_taken');
    expect(keys(draft(), ctx({ otherDraftDates: [FRIDAY.getTime()] }))).toContain('date_duplicated');
    expect(keys(draft({ coordinatorName: '—' }))).toContain('no_coordinator');
    expect(keys(draft({ parentIds: ['p-001', 'p-001'] }))).toContain('duplicate_parents');
    expect(keys(draft({ estimatedPersons: 0 }))).toContain('bad_persons');
    expect(hasErrors(checkDraft(draft({ estimatedPersons: 0 }), ctx()))).toBe(true);
  });

  it('avisa sin bloquear de lo que puede ser intencionado', () => {
    // Una conferencia un jueves es legítima, pero conviene verlo.
    const thursday = checkDraft(draft({ date: new Date(2026, 8, 24) }), ctx());
    expect(thursday.map(c => c.key)).toContain('not_friday');
    expect(hasErrors(thursday)).toBe(false);
    expect(keys(draft({ date: new Date(2026, 8, 4) }))).toContain('past_date');
    expect(keys(draft({ coordinatorName: 'Invitat Special' }))).toContain('coordinator_outside_team');
    expect(keys(draft({ parentIds: [] }))).toContain('no_parents');
  });
});
