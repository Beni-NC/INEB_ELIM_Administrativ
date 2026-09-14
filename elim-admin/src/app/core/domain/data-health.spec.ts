import { describe, expect, it } from 'vitest';
import { checkDomainData, errorsOf, warningsOf } from './data-health';
import { DATA, TODAY, entry } from '../../../testing/domain-fixture';
import { DomainData } from '../models';

/** El fixture es coherente: cualquier problema que salga aquí lo ha introducido el propio test. */
const ids = (data: DomainData) => checkDomainData(data, TODAY).map(i => i.id);
const idsOf = (list: { id: string }[]) => list.map(i => i.id);

describe('checkDomainData', () => {
  it('no marca errores en datos coherentes', () => {
    expect(idsOf(errorsOf(checkDomainData(DATA, TODAY)))).toEqual([]);
  });

  it('detecta referencias rotas', () => {
    expect(ids({ ...DATA, schedule: [...DATA.schedule, entry('Echipa 9', 'Pop Ana', new Date(2026, 6, 3))] }))
      .toContain('unknown_team');
    expect(ids({ ...DATA, parentYouthLinks: [{ parentId: 'p-99', youthId: 'y-dan', relationship: 'mother' }] }))
      .toContain('unknown_parent_in_link');
    expect(ids({ ...DATA, schedule: DATA.schedule.map(e => ({ ...e, parentSupporters: ['p-inexistent'] })) }))
      .toContain('unknown_parent_supporter');
  });

  it('detecta coordinadores que no existen o que no estaban en el equipo', () => {
    expect(ids({ ...DATA, schedule: [...DATA.schedule, entry('Echipa 1', 'Cineva Necunoscut', new Date(2026, 6, 10))] }))
      .toContain('unknown_coordinator');
    // Eva coordina Echipa 2; ponerla al frente de una de Echipa 1 no cuadra con la composición.
    expect(ids({ ...DATA, schedule: [...DATA.schedule, entry('Echipa 1', 'Rus Eva', new Date(2026, 6, 17))] }))
      .toContain('coordinator_not_in_team');
  });

  it('detecta fechas repetidas, con hora o en un día que no es viernes', () => {
    const repeated = ids({ ...DATA, schedule: [...DATA.schedule, entry('Echipa 2', 'Rus Eva', new Date(2026, 4, 15))] });
    expect(repeated).toContain('duplicate_date');
    expect(ids({ ...DATA, schedule: [entry('Echipa 1', 'Ionescu Ion', new Date(2026, 6, 3, 19, 30))] }))
      .toContain('date_with_time');
    // Una fecha en otro día de la semana es un aviso (errata probable), no un error.
    const monday = checkDomainData({ ...DATA, schedule: [...DATA.schedule, entry('Echipa 2', 'Rus Eva', new Date(2026, 6, 6))] }, TODAY);
    expect(idsOf(errorsOf(monday))).toEqual([]);
    expect(idsOf(warningsOf(monday))).toContain('not_friday');
  });

  it('detecta composiciones sin coordinador único y pertenencias mal cerradas', () => {
    expect(ids({ ...DATA, memberships: DATA.memberships.filter(m => !(m.active && m.role === 'coordonator')) }))
      .toContain('coordinator_count');
    expect(ids({ ...DATA, memberships: DATA.memberships.map(m => m.active ? m : { ...m, endDate: undefined }) }))
      .toContain('closed_membership_without_end');
  });

  it('avisa de la planificación pendiente sin considerarla un error', () => {
    // Sin programaciones futuras: los dos equipos quedan a la espera y nada falla.
    const data = { ...DATA, schedule: DATA.schedule.filter(e => e.date < TODAY) };
    const issues = checkDomainData(data, TODAY);
    expect(idsOf(errorsOf(issues))).toEqual([]);
    expect(idsOf(warningsOf(issues))).toContain('team_without_upcoming');
  });
});
