import { describe, expect, it } from 'vitest';
import { ScheduleIndex } from './schedule-index';
import { DATA, END_E1, TODAY } from '../../../testing/domain-fixture';

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
    expect(index().scheduleStats).toEqual({ upcoming: 3, thisMonth: 2, daysToNext: 2, teamsWithoutUpcoming: 0 });
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
    expect(idx.youthStats).toEqual({ total: 3, coordinators: 2, withoutUpcoming: 0 });
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
    expect(idx.getParentsForYouth('y-dan')[0].relationship).toBe('mother');
    expect(idx.getAllEventsForParent('p-1')).toHaveLength(1);
    expect(idx.parentStats).toEqual({ total: 1, withoutUpcoming: 0 });
    expect(idx.upcomingWithoutParents.map(e => e.date)).toEqual([new Date(2026, 4, 15), new Date(2026, 5, 5)]);
  });

  it('ordena los padres por carga: menos apoyos, después el que lleva más sin ayudar', () => {
    const idx = new ScheduleIndex(TODAY, {
      ...DATA,
      parents: [
        ...DATA.parents,
        { id: 'p-2', name: 'Ana Zet', phone: '', email: '', role: '', skills: [], joinedDate: TODAY, notes: '', available: true },
        { id: 'p-3', name: 'Bob Alfa', phone: '', email: '', role: '', skills: [], joinedDate: TODAY, notes: '', available: true },
      ],
      // p-3 ayudó una vez en el pasado; p-2 nunca; p-1 tiene apoyo futuro (no se sugiere).
      schedule: DATA.schedule.map(e => e.date.getTime() === new Date(2026, 0, 16).getTime() ? { ...e, parentSupporters: ['p-3'] } : e),
    });
    // p-2 nunca ha ayudado, p-3 una vez en el pasado, p-1 tiene un apoyo futuro.
    expect(idx.parentsByWorkload().map(p => p.id)).toEqual(['p-2', 'p-1', 'p-3']);
  });
});

describe('ScheduleIndex — rotación de equipos', () => {
  it('ordena primero los equipos sin turno (el que más tiempo lleva, antes) y después por próximo turno', () => {
    const idx = new ScheduleIndex(TODAY, {
      ...DATA,
      // Echipa 2 pierde sus turnos futuros y Echipa 3 (nueva, nunca ha salido) entra en la rotación.
      schedule: DATA.schedule.filter(e => !(e.team === 'Echipa 2' && e.date >= TODAY)),
      memberships: [...DATA.memberships, { youthId: 'y-eva', teamName: 'Echipa 3', role: 'coordonator', active: true }],
    });
    expect(idx.teamRotation.map(r => [r.teamName, !!r.next, r.daysSinceLast])).toEqual([
      ['Echipa 3', false, null],                 // nunca ha salido → la más "debida"
      ['Echipa 2', false, 103],                  // última el 23-01, sin turno futuro
      ['Echipa 1', true, 26],                    // ya programada (08-05)
    ]);
    expect(idx.scheduleStats.teamsWithoutUpcoming).toBe(2);
    // Eva coordina Echipa 2 (sin turno) y Echipa 3 (nunca programada): queda sin programación.
    expect(idx.youthStats.withoutUpcoming).toBe(1);
  });

  it('cuenta los turnos de la temporada (septiembre → agosto) por equipo', () => {
    // Hoy 2026-05-06 → temporada desde 2025-09-01: Echipa 1 tiene 4 (16-01, 10-04, 08-05, 05-06), Echipa 2 tiene 2.
    expect(index().seasonStart).toEqual(new Date(2025, 8, 1));
    expect(index().teamRotation.map(r => [r.teamName, r.turnsThisSeason])).toEqual([['Echipa 1', 4], ['Echipa 2', 2]]);
  });

  it('propone el siguiente viernes libre a cada equipo sin turno, en el orden de la rotación', () => {
    const idx = new ScheduleIndex(TODAY, {
      ...DATA,
      schedule: DATA.schedule.filter(e => !(e.team === 'Echipa 2' && e.date >= TODAY)),
      memberships: [...DATA.memberships, { youthId: 'y-eva', teamName: 'Echipa 3', role: 'coordonator', active: true }],
    });
    // Hoy es miércoles 06-05; el viernes 08-05 ya está ocupado (Echipa 1) → 15-05 y 22-05.
    expect(idx.proposeSchedule()).toEqual([
      { date: new Date(2026, 4, 15), teamName: 'Echipa 3', coordinatorName: 'Rus Eva' },
      { date: new Date(2026, 4, 22), teamName: 'Echipa 2', coordinatorName: 'Rus Eva' },
    ]);
    expect(index().proposeSchedule()).toEqual([]); // todos programados: nada que proponer
    // Con un número explícito sigue la rotación en ciclo desde la fecha pedida, saltando los
    // viernes ya ocupados (el 5 de junio ya es de Echipa 1).
    expect(idx.proposeSchedule(4, new Date(2026, 5, 1)).map(p => [p.teamName, p.date.getMonth(), p.date.getDate()])).toEqual([
      ['Echipa 3', 5, 12], ['Echipa 2', 5, 19], ['Echipa 1', 5, 26], ['Echipa 3', 6, 3],
    ]);
  });

  it('con todos los equipos programados ordena por fecha del próximo turno', () => {
    expect(index().teamRotation.map(r => r.teamName)).toEqual(['Echipa 1', 'Echipa 2']);
    expect(index().teamRotation[0].next?.date).toEqual(new Date(2026, 4, 8));
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
