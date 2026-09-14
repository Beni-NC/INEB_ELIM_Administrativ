import { DomainData, ScheduleEntry } from '../app/core/models';

/**
 * Fixture mínimo pero con todos los casos que importan del dominio:
 *  - Echipa 1: composición cerrada el 2026-02-27 (coordinadora Ana) y composición activa
 *    (coordinador Ion, con un miembro nuevo, Dan, que no estaba en la antigua).
 *  - Echipa 2: solo composición activa (coordinadora Eva).
 *  - Programaciones antes y después del cierre y de "hoy" (2026-05-06).
 *  - Un padre vinculado a un joven y asignado a una programación futura.
 */
export const TODAY = new Date(2026, 4, 6);
export const END_E1 = new Date(2026, 1, 27);

export const entry = (team: string, coordinator: string, date: Date, extra: Partial<ScheduleEntry> = {}): ScheduleEntry => ({
  team, coordinator, date, programType: 'youth_evening', estimatedPersons: 40, observations: '', ...extra,
});

export const DATA: DomainData = {
  schedule: [
    entry('Echipa 1', 'Pop Ana', new Date(2026, 0, 16)),               // antes del cierre → composición histórica
    entry('Echipa 2', 'Rus Eva', new Date(2026, 0, 23)),
    entry('Echipa 1', 'Ionescu Ion', new Date(2026, 3, 10)),           // tras el cierre, ya pasada → composición activa
    entry('Echipa 1', 'Ionescu Ion', new Date(2026, 4, 8), { parentSupporters: ['p-1'], observations: 'Aduceți farfurii, virgulă; punct' }),
    entry('Echipa 2', 'Rus Eva', new Date(2026, 4, 15)),
    entry('Echipa 1', 'Ionescu Ion', new Date(2026, 5, 5)),
  ],
  youths: [
    { id: 'y-ana', firstName: 'Ana', lastName: 'Pop', gender: 'F', birthDate: new Date(2000, 0, 1), joinedYear: 2024, active: false, inactiveSince: END_E1 },
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
  parentYouthLinks: [{ parentId: 'p-1', youthId: 'y-dan', relationship: 'mother' }],
};

