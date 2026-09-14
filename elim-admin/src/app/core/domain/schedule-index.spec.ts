import { describe, expect, it } from 'vitest';
import { ScheduleIndex } from './schedule-index';
import { DomainData, ScheduleEntry } from '../models';

/**
 * Fixture mínimo pero con todos los casos que importan del dominio:
 *  - Echipa 1: composición cerrada el 2026-02-27 (coordinadora Ana) y composición activa
 *    (coordinador Ion, con un miembro nuevo, Dan, que no estaba en la antigua).
 *  - Echipa 2: solo composición activa (coordinadora Eva).
 *  - Programaciones antes y después del cierre y de "hoy" (2026-05-06).
 *  - Un padre vinculado a un joven y asignado a una programación futura.
 */
const TODAY = new Date(2026, 4, 6);
const END_E1 = new Date(2026, 1, 27);

const entry = (team: string, coordinator: string, date: Date, extra: Partial<ScheduleEntry> = {}): ScheduleEntry => ({
  team, coordinator, date, programType: 'Seară de tineret', estimatedPersons: 40, observations: '', completed: date < TODAY, ...extra,
});

const DATA: DomainData = {
  schedule: [
    entry('Echipa 1', 'Pop Ana', new Date(2026, 0, 16)),               // antes del cierre → composición histórica
    entry('Echipa 2', 'Rus Eva', new Date(2026, 0, 23)),
    entry('Echipa 1', 'Ionescu Ion', new Date(2026, 3, 10)),           // tras el cierre, ya pasada → composición activa
    entry('Echipa 1', 'Ionescu Ion', new Date(2026, 4, 8), { parentSupporters: ['p-1'], observations: 'Aduceți farfurii, virgulă; punct' }),
    entry('Echipa 2', 'Rus Eva', new Date(2026, 4, 15)),
    entry('Echipa 1', 'Ionescu Ion', new Date(2026, 5, 5)),
  ],
  youths: [
    { id: 'y-ana', firstName: 'Ana', lastName: 'Pop', gender: 'F', birthDate: new Date(2000, 0, 1), joinedYear: 2024, isCoordinator: true, active: false, inactiveSince: END_E1 },
    { id: 'y-ion', firstName: 'Ion', lastName: 'Ionescu', gender: 'M', birthDate: new Date(2001, 0, 1), joinedYear: 2024 },
    { id: 'y-dan', firstName: 'Dan', lastName: 'Dinu', gender: 'M', birthDate: new Date(2005, 0, 1), joinedYear: 2026 },
    { id: 'y-eva', firstName: 'Eva', lastName: 'Rus', gender: 'F', birthDate: new Date(2002, 0, 1), joinedYear: 2024 },
  ],
  memberships: [
    // Echipa 1 — composición cerrada
    { youthId: 'y-ana', teamName: 'Echipa 1', role: 'coordonator', active: false, endDate: END_E1 },
    { youthId: 'y-ion', teamName: 'Echipa 1', role: 'membru', active: false, endDate: END_E1 },
    // Echipa 1 — composición activa (Dan es nuevo)
    { youthId: 'y-ion', teamName: 'Echipa 1', role: 'coordonator', active: true },
    { youthId: 'y-dan', teamName: 'Echipa 1', role: 'membru', active: true },
    // Echipa 2 — solo activa
    { youthId: 'y-eva', teamName: 'Echipa 2', role: 'coordonator', active: true },
  ],
  parents: [
    { id: 'p-1', name: 'Maria Dinu Popa', phone: '', email: '', role: '', skills: [], joinedDate: new Date(2026, 0, 1), notes: '', available: true },
  ],
  parentYouthLinks: [{ parentId: 'p-1', youthId: 'y-dan', relationship: 'mamă' }],
};

const index = () => new ScheduleIndex(TODAY, DATA);

describe('ScheduleIndex — partición temporal', () => {
  it('separa pasado y futuro respecto a hoy y ordena cronológicamente', () => {
    const idx = index();
    expect(idx.pastSchedule.map(e => e.date.getTime())).toEqual([
      new Date(2026, 0, 16), new Date(2026, 0, 23), new Date(2026, 3, 10),
    ].map(d => d.getTime()));
    expect(idx.upcomingSchedule).toHaveLength(3);
    expect(idx.nextEvent?.date).toEqual(new Date(2026, 4, 8));
  });

  it('agrupa por mes conservando el orden y expone año/mes para formatear en la vista', () => {
    const idx = index();
    expect(idx.upcomingByMonth.map(g => [g.year, g.month, g.entries.length])).toEqual([[2026, 4, 2], [2026, 5, 1]]);
    // El histórico va del más reciente al más antiguo.
    expect(idx.pastByMonth.map(g => g.month)).toEqual([3, 0]);
  });

  it('calcula los KPI de la portada', () => {
    expect(index().scheduleStats).toEqual({ upcoming: 3, thisMonth: 2, completed: 3, teams: 2 });
  });
});

describe('ScheduleIndex — derivación de personas', () => {
  it('deriva fullName e iniciales de los jóvenes ("Apellido Nombre", "AN")', () => {
    const ion = index().getYouthById('y-ion')!;
    expect(ion.fullName).toBe('Ionescu Ion');
    expect(ion.initials).toBe('II');
    expect(index().getYouthByName('Dinu Dan')?.id).toBe('y-dan');
  });

  it('deriva las iniciales de los padres (una por palabra, máximo tres)', () => {
    expect(index().getParentById('p-1')?.initials).toBe('MDP');
  });

  it('asigna a cada persona un tono de avatar estable entre 0 y 7', () => {
    const idx = index();
    for (const y of idx.youths) expect(y.tone).toBeGreaterThanOrEqual(0), expect(y.tone).toBeLessThan(8);
    expect(idx.getYouthById('y-ion')!.tone).toBe(index().getYouthById('y-ion')!.tone);
    expect(idx.getParentById('p-1')!.tone).toBe(index().getParentById('p-1')!.tone);
  });

  it('ordena los jóvenes alfabéticamente y separa activos de archivados', () => {
    const idx = index();
    expect(idx.activeYouths.map(y => y.fullName)).toEqual(['Dinu Dan', 'Ionescu Ion', 'Rus Eva']);
    expect(idx.inactiveYouths.map(y => y.id)).toEqual(['y-ana']);
  });
});

describe('ScheduleIndex — equipos y composiciones', () => {
  it('deriva una composición activa por equipo, ordenadas por número', () => {
    const teams = index().teams;
    expect(teams.map(t => t.teamName)).toEqual(['Echipa 1', 'Echipa 2']);
    expect(teams[0].coordinatorName).toBe('Ionescu Ion');
    expect(teams[0].members.map(m => m.id).sort()).toEqual(['y-dan', 'y-ion']);
    expect(teams.every(t => t.isActive && t.historyKey === undefined)).toBe(true);
  });

  it('deriva las composiciones cerradas con su clave de ancla', () => {
    const [hist] = index().teamsHistory;
    expect(index().teamsHistory).toHaveLength(1);
    expect(hist.teamName).toBe('Echipa 1');
    expect(hist.coordinatorName).toBe('Pop Ana');
    expect(hist.end).toEqual(END_E1);
    expect(hist.historyKey).toBe(`Echipa 1-${END_E1.getTime()}`);
  });

  it('resuelve cada programación a la composición vigente en su fecha', () => {
    const idx = index();
    const [before, , after] = idx.sortedSchedule;
    expect(idx.isHistoricalEvent(before)).toBe(true);
    expect(idx.getHistoryKeyForEvent(before)).toBe(`Echipa 1-${END_E1.getTime()}`);
    expect(idx.isHistoricalEvent(after)).toBe(false);
    expect(idx.getEventsForHistoryKey(`Echipa 1-${END_E1.getTime()}`)).toEqual([before]);
  });

  it('solo cuenta como coordinador a quien coordina una composición ACTIVA', () => {
    const idx = index();
    expect(idx.isActiveCoordinator('y-ion')).toBe(true);
    expect(idx.isActiveCoordinator('y-ana')).toBe(false); // solo coordinó la cerrada
    expect(idx.youthStats).toEqual({ total: 3, coordinators: 2 });
  });
});

describe('ScheduleIndex — ventanas de pertenencia', () => {
  it('no atribuye a un miembro nuevo programaciones anteriores a su alta en la composición activa', () => {
    const idx = index();
    // Dan entró con la composición activa (tras el 27-02): la del 16-01 no es suya.
    expect(idx.getPastEventsForYouth('y-dan').map(x => x.entry.date)).toEqual([new Date(2026, 3, 10)]);
    // Ion estuvo en ambas composiciones: participó en todas las de Echipa 1.
    expect(idx.getAllEventsForYouth('y-ion')).toHaveLength(4);
    expect(idx.getPastEventsForYouth('y-ion')[0].entry.date).toEqual(new Date(2026, 3, 10)); // más reciente primero
    expect(idx.getPastEventsForYouth('y-ion').at(-1)?.historical).toBe(true);
  });

  it('las programaciones futuras de un joven son las de sus equipos activos', () => {
    const idx = index();
    expect(idx.getUpcomingEventsForYouth('y-dan').map(e => e.date)).toEqual([new Date(2026, 4, 8), new Date(2026, 5, 5)]);
    expect(idx.getNextEventForYouth('y-eva')?.date).toEqual(new Date(2026, 4, 15));
    expect(idx.getUpcomingEventsForYouth('y-ana')).toEqual([]);
  });
});

describe('ScheduleIndex — padres', () => {
  it('relaciona padres con programaciones (por apoyo) y con hijos (por vínculo)', () => {
    const idx = index();
    const next = idx.nextEvent!;
    expect(idx.getParentsForEvent(next).map(p => p.id)).toEqual(['p-1']);
    expect(idx.getNextEventForParent('p-1')).toBe(next);
    expect(idx.nextParentEvent?.people[0].initials).toBe('MDP');
    expect(idx.upcomingParentEvents).toEqual([]); // la única futura con padres es la próxima
    expect(idx.getYouthsForParent('p-1').map(l => l.youth.id)).toEqual(['y-dan']);
    expect(idx.getParentsForYouth('y-dan')[0].relationship).toBe('mamă');
    expect(idx.getAllEventsForParent('p-1')).toHaveLength(1);
  });
});

describe('ScheduleIndex — coordinadores', () => {
  it('cuenta las programaciones pasadas dirigidas por cada coordinador y equipo', () => {
    expect(index().coordinatorRotations).toEqual([
      { name: 'Pop Ana', team: 'Echipa 1', count: 1 },
      { name: 'Rus Eva', team: 'Echipa 2', count: 1 },
      { name: 'Ionescu Ion', team: 'Echipa 1', count: 1 },
    ]);
  });

  it('el coordinador de una programación es el registrado en ella, no el de la composición', () => {
    const idx = index();
    const custom = { ...idx.sortedSchedule[0], coordinator: 'Invitat Special' };
    expect(idx.getCoordinatorNameForEvent(custom)).toBe('Invitat Special');
  });
});
