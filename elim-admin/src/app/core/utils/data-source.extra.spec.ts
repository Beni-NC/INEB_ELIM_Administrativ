import { describe, expect, it } from 'vitest';
import {
  closedMembershipBlock, membershipBlock, parentBlock, parentBlockFor, parentYouthLinkLines,
  removeHint, scheduleLine, scheduleLineFor, youthLine, youthLineFor,
} from './data-source.utils';
import { Parent, ScheduleEntry, YouthRecord } from '../models';

const ENTRY: ScheduleEntry = {
  team: 'Echipa 1', coordinator: 'Halas Luigi', programType: 'youth_evening', estimatedPersons: 60,
  date: new Date(2026, 8, 18), observations: '', parentSupporters: ['p-001'],
};
const YOUTH: YouthRecord = {
  id: 'y-halas-luigi', firstName: 'Luigi', lastName: 'Halas', gender: 'M',
  birthDate: new Date(1998, 6, 30), joinedYear: 2026, phone: '643 86 91 66',
};
const PARENT: Parent = {
  id: 'p-001', name: 'Maria Bîrle', phone: '', email: '', role: '', skills: [],
  joinedDate: new Date(2026, 0, 1), notes: '', initials: 'MB', tone: 0, available: true,
};

describe('data-source.utils — personalización completa', () => {
  it('escribe las horas solo cuando se apartan de las de por defecto', () => {
    expect(scheduleLine({ ...ENTRY, teamName: ENTRY.team, coordinatorName: ENTRY.coordinator, parentIds: [], date: ENTRY.date }))
      .not.toContain('programStartTime');
    const custom = scheduleLineFor(ENTRY, { programStartTime: '19:00', youthsArrivalTime: '18:00', parentsFoodArrivalTime: '18:30' });
    expect(custom).toContain("programStartTime: '19:00'");
    expect(custom).toContain("youthsArrivalTime: '18:00'");
    expect(custom).toContain("parentsFoodArrivalTime: '18:30'");
  });

  it('conserva lo que no se cambia de una programación existente', () => {
    const line = scheduleLineFor(ENTRY, { estimatedPersons: 45 });
    expect(line).toContain('estimatedPersons: 45');
    expect(line).toContain("parentSupporters: ['p-001']");
    expect(line).toContain('new Date(2026, 8, 18)');
  });

  it('archiva un joven con su fecha y motivo, sin perder el resto de datos', () => {
    const line = youthLineFor(YOUTH, { active: false, inactiveSince: new Date(2026, 5, 30), inactiveReason: 'A plecat' });
    expect(line).toContain("phone: '643 86 91 66'");
    expect(line).toContain('active: false');
    expect(line).toContain('inactiveSince: new Date(2026, 5, 30)');
    expect(line).toContain("inactiveReason: 'A plecat'");
  });

  it('no escribe campos vacíos de un joven nuevo', () => {
    expect(youthLine({ firstName: 'Ana', lastName: 'Pop', gender: 'F', birthDate: new Date(2008, 0, 1), joinedYear: 2026 }))
      .toContain('2026, {}),');
  });

  it('archiva un padre añadiendo solo las líneas necesarias', () => {
    const block = parentBlockFor(PARENT, { active: false, inactiveSince: new Date(2026, 5, 1), inactiveReason: 'Mutare' });
    expect(block).toContain('active: false,');
    expect(block).toContain('inactiveSince: new Date(2026, 5, 1),');
    expect(parentBlock({ id: 'p-002', name: 'X', joinedDate: new Date(2026, 0, 1) })).not.toContain('active:');
  });

  it('genera varios hijos de una vez, saltando las filas vacías', () => {
    expect(parentYouthLinkLines('p-014', [
      { youthId: 'y-a', relationship: 'mother' },
      { youthId: '', relationship: 'father' },
      { youthId: 'y-b', relationship: 'mother' },
    ]).split('\n')).toHaveLength(2);
  });

  it('compone y cierra la plantilla de un equipo con su cabecera', () => {
    const rows = [{ id: 'y-1', role: 'coordonator' as const }, { id: 'y-2', role: 'membru' as const }];
    expect(membershipBlock('Echipa 3', rows).split('\n')[0]).toBe('  // ---- Echipa 3 (activă) ----');
    const closed = closedMembershipBlock('Echipa 3', rows, new Date(2026, 1, 27));
    expect(closed).toContain("membership('y-1', 'Echipa 3', 'coordonator', false, new Date(2026, 1, 27)),");
  });

  it('deja instrucciones para lo que hay que borrar a mano', () => {
    expect(removeHint('x.ts', 'Echipa 1 · 2026-09-18')).toContain('ELIMINĂ / ELIMINA: Echipa 1 · 2026-09-18');
  });
});
