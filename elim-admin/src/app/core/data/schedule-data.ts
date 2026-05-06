/* ============================================================
   ELIM ADMIN — Sursa unică de date (mock JSON)
   ============================================================
   Structură normalizată:
     • YOUTHS                  → tabela unică „tineri"
     • PARENTS                 → părinți (foștii „sprijin")
     • YOUTH_TEAM_MEMBERSHIPS  → tabel intermediar tânăr ↔ echipă
     • PARENT_TEAM_ASSIGNMENTS → tabel intermediar părinte ↔ echipă
     • PARENT_YOUTH_LINKS      → tabel intermediar părinte ↔ tânăr
     • SCHEDULE_DATA           → programarea săptămânală
     • RULES                   → reguli pentru coordonatori
   Constantele TEAMS_DATA / TEAMS_HISTORY sunt derivate (computed) din
   tabelele de mai sus pentru a păstra compatibilitatea cu UI-ul existent.
   ============================================================ */

/* ===================== INTERFEȚE ===================== */

export interface ScheduleEntry {
  team: string;
  coordinator: string;
  programType: string;
  estimatedPersons: number;
  date: Date;
  observations: string;
  completed: boolean;
  /** ID-uri de părinți care sprijină punctual ACEASTĂ programare (asignare manuală). */
  parentSupporters?: string[];
  /** Ora la care începe programul de tineret (HH:mm). Default: 20:30. */
  programStartTime?: string;
  /** Ora la care tinerii trebuie să fie prezenți la biserică pentru pregătirea mesei (HH:mm). Default: 19:30. */
  youthsArrivalTime?: string;
  /** Ora la care părinții trebuie să aducă mâncarea pregătită (HH:mm). Default (calculat): cu 30 min înainte de începerea programului. */
  parentsFoodArrivalTime?: string | null;
}

/** Ora implicită de începere a programului de tineret. */
export const DEFAULT_PROGRAM_START_TIME = '20:30';
/** Ora implicită de prezență a tinerilor pentru pregătirea mesei. */
export const DEFAULT_YOUTHS_ARRIVAL_TIME = '19:30';
/** Decalajul implicit (în minute) ÎNAINTE de începerea programului la care părinții aduc mâncarea. */
export const DEFAULT_PARENTS_FOOD_OFFSET_MIN = 30;

/** Helper intern: scade `minutes` minute dintr-o oră în format „HH:mm". */
function subtractMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = (h * 60 + m - minutes + 24 * 60) % (24 * 60);
  const hh = Math.floor(total / 60).toString().padStart(2, '0');
  const mm = (total % 60).toString().padStart(2, '0');
  return `${hh}:${mm}`;
}

/**
 * Returnează orele efective ale unei programări, aplicând valorile implicite.
 * `parentsFoodArrival` este calculat ca `programStart - DEFAULT_PARENTS_FOOD_OFFSET_MIN`
 * dacă nu este definit explicit pe entry.
 */
export function getEntryTimes(entry: ScheduleEntry): {
  programStart: string;
  youthsArrival: string;
  parentsFoodArrival: string;
} {
  const programStart = entry.programStartTime ?? DEFAULT_PROGRAM_START_TIME;
  const youthsArrival = entry.youthsArrivalTime ?? DEFAULT_YOUTHS_ARRIVAL_TIME;
  const parentsFoodArrival =
    entry.parentsFoodArrivalTime ??
    subtractMinutes(programStart, DEFAULT_PARENTS_FOOD_OFFSET_MIN);
  return { programStart, youthsArrival, parentsFoodArrival };
}

/** Membru de echipă (DTO simplu, derivat din Youth pentru UI). */
export interface TeamMember {
  name: string;
  phone?: string;
  youthId?: string;
}

export interface Team {
  name: string;
  coordinator: string;
  coordinatorPhone: string;
  coordinatorYouthId?: string;
  members: TeamMember[];
}

export interface TeamHistory {
  name: string;
  coordinator: string;
  coordinatorPhone?: string;
  members: TeamMember[];
  endDate: Date;
}

/** Tânăr — entitatea principală a departamentului. */
export interface Youth {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;          // afișaj canonic „Nume Prenume"
  phone?: string;
  email?: string;
  birthDate: Date;
  joinedYear: number;        // anul în care s-a alăturat departamentului
  initials: string;
  accentColor: string;
  gender: 'M' | 'F';
  address?: string;
  notes?: string;
  interests?: string[];
  isCoordinator?: boolean;
  /** False = arhivat (istoric, nu mai participă activ). Default: true. */
  active?: boolean;
  /** Data de la care nu mai este activ. */
  inactiveSince?: Date;
  /** Motivul retragerii (ex: „mutat în alt oraș”, „pauză personală”). */
  inactiveReason?: string;
}

/** Tabel intermediar tânăr ↔ echipă (cu rol și status istoric/activ). */
export interface YouthTeamMembership {
  youthId: string;
  teamName: string;
  role: 'coordonator' | 'membru';
  active: boolean;
  joinedDate?: Date;
  endDate?: Date;
}

/** Părinte (anterior „persoană de sprijin"). */
export interface Parent {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: string;
  skills: string[];
  joinedDate: Date;
  notes: string;
  initials: string;
  accentColor: string;
  available: boolean;
  /** False = arhivat (nu mai oferă sprijin activ). Default: true. */
  active?: boolean;
  inactiveSince?: Date;
  inactiveReason?: string;
}

/** Tabel intermediar părinte ↔ echipă. */
export interface ParentTeamAssignment {
  parentId: string;
  teamName: string;
  assignedSince: Date;
  reason?: string;
}

/** Tabel intermediar părinte ↔ tânăr (relație familială). */
export interface ParentYouthLink {
  parentId: string;
  youthId: string;
  relationship: 'tată' | 'mamă' | 'tutore';
}

/* ===================== PROGRAMARE ===================== */

export const SCHEDULE_DATA: ScheduleEntry[] = [
  { team: 'Echipa 1', coordinator: 'Halas Luigi',     programType: 'Seară de tineret', estimatedPersons: 60, date: new Date(2025, 2, 10),  observations: '', completed: true },
  { team: 'Echipa 2', coordinator: 'Dobre David',     programType: 'Seară de tineret', estimatedPersons: 60, date: new Date(2025, 9, 10),  observations: '', completed: true },
  { team: 'Echipa 3', coordinator: 'Istrătoaie Ruben',programType: 'Seară de tineret', estimatedPersons: 60, date: new Date(2025, 9, 17),  observations: '', completed: true },
  { team: 'Echipa 4', coordinator: 'Ivaşcu Simona',   programType: 'Seară de tineret', estimatedPersons: 60, date: new Date(2025, 9, 24),  observations: '', completed: true },
  { team: 'Echipa 5', coordinator: 'Toader Noemi',    programType: 'Seară de tineret', estimatedPersons: 60, date: new Date(2025, 9, 31),  observations: '', completed: true },
  { team: 'Echipa 6', coordinator: 'Bosancu Amalia',  programType: 'Seară de tineret', estimatedPersons: 60, date: new Date(2025, 10, 14), observations: '', completed: true },
  { team: 'Echipa 7', coordinator: 'Bereza Ionatan',  programType: 'Seară de tineret', estimatedPersons: 60, date: new Date(2025, 10, 21), observations: '', completed: true },
  { team: 'Echipa 1', coordinator: 'Halas Luigi',     programType: 'Seară de tineret', estimatedPersons: 60, date: new Date(2025, 10, 28), observations: '', completed: true },
  { team: 'Echipa 2', coordinator: 'Dobre David',     programType: 'Seară de tineret', estimatedPersons: 60, date: new Date(2025, 11, 5),  observations: '', completed: true },
  { team: 'Echipa 3', coordinator: 'Istrătoaie Ruben',programType: 'Seară de tineret', estimatedPersons: 60, date: new Date(2025, 11, 12), observations: '', completed: true },
  { team: 'Echipa 4', coordinator: 'Ivaşcu Simona',   programType: 'Seară de tineret', estimatedPersons: 60, date: new Date(2026, 0, 2),   observations: '', completed: true },
  { team: 'Echipa 5', coordinator: 'Toader Noemi',    programType: 'Seară de tineret', estimatedPersons: 60, date: new Date(2026, 0, 9),   observations: '', completed: true },
  { team: 'Echipa 6', coordinator: 'Bosancu Amalia',  programType: 'Seară de tineret', estimatedPersons: 60, date: new Date(2026, 0, 16),  observations: '', completed: true },
  { team: 'Echipa 3', coordinator: 'Istrătoaie Ruben',programType: 'Seară de tineret', estimatedPersons: 60, date: new Date(2026, 0, 30),  observations: '', completed: true },
  { team: 'Echipa 7', coordinator: 'Bereza Ionatan',  programType: 'Seară de tineret', estimatedPersons: 60, date: new Date(2026, 1, 6),   observations: '', completed: true },
  { team: 'Echipa 2', coordinator: 'Dobre David',     programType: 'Seară de tineret', estimatedPersons: 60, date: new Date(2026, 1, 13),  observations: '', completed: true },
  { team: 'Echipa 1', coordinator: 'Halas Luigi',     programType: 'Seară de tineret', estimatedPersons: 60, date: new Date(2026, 1, 20),  observations: '', completed: true },
  { team: 'Echipa 4', coordinator: 'Ivaşcu Simona',   programType: 'Seară de tineret', estimatedPersons: 60, date: new Date(2026, 1, 27),  observations: '', completed: true },
  { team: 'Echipa 5', coordinator: 'Toader Noemi',    programType: 'Seară de tineret', estimatedPersons: 60, date: new Date(2026, 2, 6),   observations: '', completed: true },
  { team: 'Echipa 6', coordinator: 'Halas Noemi',     programType: 'Seară de tineret', estimatedPersons: 60, date: new Date(2026, 2, 13),  observations: '', completed: true },
  { team: 'Echipa 7', coordinator: 'Bereza Ionatan',  programType: 'Seară de tineret', estimatedPersons: 60, date: new Date(2026, 2, 27),  observations: '', completed: true },
  { team: 'Echipa 1', coordinator: 'Halas Luigi',     programType: 'Seară de tineret', estimatedPersons: 60, date: new Date(2026, 3, 10),  observations: '', completed: true },
  { team: 'Echipa 2', coordinator: 'Dobre David',     programType: 'Seară de tineret', estimatedPersons: 60, date: new Date(2026, 3, 17),  observations: '', completed: true },
  { team: 'Echipa 3', coordinator: 'Istrătoaie Dina', programType: 'Seară de tineret', estimatedPersons: 60, date: new Date(2026, 3, 24),  observations: '', completed: true },
  { team: 'Echipa 4', coordinator: 'Mic Karina',      programType: 'Seară de tineret', estimatedPersons: 60, date: new Date(2026, 4, 8),   observations: 'Primul program în care părinții vor fi implicați din nou la pregătirea mesei.', completed: false, parentSupporters: ['p-004'] },
  { team: 'Echipa 5', coordinator: 'Toader Noemi',    programType: 'Seară de tineret', estimatedPersons: 60, date: new Date(2026, 4, 15),   observations: '', completed: false, parentSupporters: ['p-007']},
  { team: 'Echipa 6', coordinator: 'Halas Noemi',     programType: 'Seară de tineret', estimatedPersons: 60, date: new Date(2026, 4, 22),  observations: '', completed: false, parentSupporters: ['p-005']},
  { team: 'Echipa 7', coordinator: 'Bereza Ionatan',  programType: 'Seară de tineret', estimatedPersons: 60, date: new Date(2026, 4, 29),  observations: '', completed: false, parentSupporters: ['p-008']},
  { team: 'Echipa 1', coordinator: 'Halas Luigi',     programType: 'Seară de tineret', estimatedPersons: 60, date: new Date(2026, 5, 5),  observations: '', completed: false, parentSupporters: ['p-001']},
  { team: 'Echipa 2', coordinator: 'Dobre David',     programType: 'Seară de tineret', estimatedPersons: 60, date: new Date(2026, 5, 12),   observations: '', completed: false, parentSupporters: ['p-003'] },
  { team: 'Echipa 3', coordinator: 'Istrătoaie Dina', programType: 'Seară de tineret', estimatedPersons: 60, date: new Date(2026, 5, 19),  observations: '', completed: false, parentSupporters: ['p-006']},
  { team: 'Echipa 4', coordinator: 'Mic Karina',      programType: 'Seară de tineret', estimatedPersons: 60, date: new Date(2026, 5, 26),  observations: '', completed: false, parentSupporters: ['p-002',]},
  { team: 'Echipa 5', coordinator: 'Toader Noemi',    programType: 'Seară de tineret', estimatedPersons: 60, date: new Date(2026, 6, 3),   observations: '', completed: false, parentSupporters: ['p-005'] },
  { team: 'Echipa 6', coordinator: 'Halas Noemi',     programType: 'Seară de tineret', estimatedPersons: 60, date: new Date(2026, 6, 10),  observations: '', completed: false, parentSupporters: ['p-004'] },
  { team: 'Echipa 7', coordinator: 'Bereza Ionatan',  programType: 'Seară de tineret', estimatedPersons: 60, date: new Date(2026, 6, 17),  observations: '', completed: false, parentSupporters: ['p-007'] },
  { team: 'Echipa 1', coordinator: 'Halas Luigi',     programType: 'Seară de tineret', estimatedPersons: 60, date: new Date(2026, 6, 24),  observations: '', completed: false, parentSupporters: ['p-008'] },
  { team: 'Echipa 2', coordinator: 'Dobre David',     programType: 'Seară de tineret', estimatedPersons: 60, date: new Date(2026, 6, 31),  observations: '', completed: false, parentSupporters: ['p-001'] },
  // falta 2 - 3 - 6
];

/* ===================== TINERI (sursa unică) ===================== */

const PALETTE = [
  '#1565c0', '#6a1b9a', '#2e7d32', '#e65100', '#c62828',
  '#00838f', '#ad1457', '#283593', '#558b2f', '#ef6c00',
];

function pickColor(i: number): string { return PALETTE[i % PALETTE.length]; }

function makeInitials(first: string, last: string): string {
  return (last.charAt(0) + first.charAt(0)).toUpperCase();
}

/** Helper compact pentru a defini un tânăr cu valori implicite. */
function youth(
  id: string,
  firstName: string,
  lastName: string,
  gender: 'M' | 'F',
  birthDate: Date,
  joinedYear: number,
  extra: Partial<Youth> = {},
  index = 0,
): Youth {
  return {
    id,
    firstName,
    lastName,
    fullName: `${lastName} ${firstName}`,
    gender,
    birthDate,
    joinedYear,
    initials: makeInitials(firstName, lastName),
    accentColor: extra.accentColor ?? pickColor(index),
    ...extra,
  };
}

export const YOUTHS: Youth[] = [
  // ---- Echipa 1 ----
  youth('y-pintilei-david',     'David',    'Pintilei',   'M', new Date(2005, 4, 12), 2026, { phone: '610 11 22 33', email: '' }, 0),
  youth('y-halas-timotei',      'Timotei',  'Halas',      'M', new Date(2006, 1, 18), 2026, { phone: '610 22 33 44' }, 1),
  youth('y-mitoseriu-kevin',    'Kevin',    'Mitoseriu',  'M', new Date(2007, 7,  8), 2026, {}, 2),
  youth('y-birle-filip',        'Filip',    'Bîrle',      'M', new Date(2005, 10, 2), 2026, { phone: '610 33 44 55' }, 3),
  youth('y-toth-sara',          'Sara',     'Toth',       'F', new Date(2006, 3, 25), 2026, {}, 4),
  youth('y-muresan-naomi',      'Naomi',    'Muresan',    'F', new Date(2007, 8, 14), 2026, {}, 5),
  youth('y-halas-luigi',        'Luigi',    'Halas',      'M', new Date(1998, 6, 30), 2026, { phone: '643 86 91 66', email: '', isCoordinator: true }, 6),
  youth('y-birle-tania',        'Tania',    'Bîrle',      'F', new Date(2005, 9, 17), 2026, { phone: '611 22 33 44' }, 7),
  youth('y-halas-noemi',        'Noemi',    'Halas',      'F', new Date(2002, 5, 11), 2026, { phone: '642 46 11 08', email: '', isCoordinator: true }, 8),
  youth('y-dobre-irene',        'Irene',    'Dobre',      'F', new Date(2006, 11, 1), 2026, {}, 9),
  youth('y-mitoseriu-miriam',   'Miriam',   'Mitoşeriu',  'F', new Date(2003, 2, 22), 2026, { phone: '641 45 43 01', email: '' }, 0),
  youth('y-zagrean-jesica',     'Jesica',   'Zăgrean',    'F', new Date(2006, 7, 19), 2026, {}, 1),
  youth('y-halas-damaris',      'Damaris',  'Halas',      'F', new Date(2008, 0, 5),  2026, {}, 2),
  youth('y-marcu-nereea',       'Nereea',   'Marcu',      'F', new Date(2007, 6, 28), 2026, {}, 3),
  youth('y-dobre-david',        'David',    'Dobre',      'M', new Date(2001, 3, 14), 2026, { phone: '641 45 50 67', email: '', isCoordinator: true }, 4),
  youth('y-les-fineas',         'Fineas',   'Leş',        'M', new Date(2006, 5, 9),  2026, {}, 5),
  youth('y-copran-david',       'David',    'Copran',     'M', new Date(2007, 1, 21), 2026, {}, 6),
  youth('y-dulca-daniel',       'Daniel',   'Dulcă',      'M', new Date(2005, 8, 3),  2026, {}, 7),
  youth('y-dulca-david',        'David',    'Dulcă',      'M', new Date(2008, 4, 16), 2026, {}, 8),
  youth('y-apalaghiei-samuel',  'Samuel',   'Apalaghiei', 'M', new Date(2006, 9, 27), 2026, {}, 9),
  youth('y-gherasim-sara',      'Sara',     'Gherasim',   'F', new Date(2007, 2, 4),  2026, {}, 0),
  youth('y-istratoaie-dina',    'Dina',     'Istrătoaie', 'F', new Date(2005, 11, 8), 2026, {}, 1),
  youth('y-istratoaie-ruben',   'Ruben',    'Istrătoaie', 'M', new Date(2000, 7, 13), 2026, { phone: '624 20 97 09', email: '', isCoordinator: true }, 2),
  youth('y-barba-levi',         'Levi',     'Barbă',      'M', new Date(2006, 0, 24), 2026, {}, 3),
  youth('y-barba-rebeca',       'Rebeca',   'Barbă',      'F', new Date(2008, 5, 7),  2026, {}, 4),
  youth('y-biris-sara',         'Sara',     'Biriş',      'F', new Date(2007, 9, 30), 2026, {}, 5),
  youth('y-biris-david',        'David',    'Biriş',      'M', new Date(2005, 6, 2),  2026, {}, 6),
  youth('y-jescu-marco',        'Marco',    'Jescu',      'M', new Date(2006, 2, 19), 2026, {}, 7),
  youth('y-albu-gabriel',       'Gabriel',  'Albu',       'M', new Date(2007, 11, 12),2026, {}, 8),
  youth('y-mic-karina',         'Karina',   'Mic',        'F', new Date(2008, 3, 6),  2026, {phone: '641 25 32 94', email: '', isCoordinator: true }, 9),
  youth('y-negrusier-rut',      'Rut',      'Negrusier',  'F', new Date(2007, 7, 17), 2026, {}, 0),
  youth('y-bosancu-amalia',         'Amalia',     'Bosancu',      'F', new Date(2006, 0, 24), 2026, {}, 3),
  youth('y-valean-noelia',      'Noelia',   'Valean',     'F', new Date(2006, 4, 28), 2026, {}, 1),
  youth('y-valean-vlad',        'Vlad',     'Valean',     'M', new Date(2005, 1, 11), 2026, {}, 2),
  youth('y-valean-naomi',       'Naomi',    'Valean',     'F', new Date(2008, 6, 22), 2026, {}, 3),
  youth('y-dragan-abel',        'Abel',     'Dragăn',     'M', new Date(2007, 10, 5), 2026, {}, 4),
  youth('y-baleanu-samuel',     'Samuel',   'Baleanu',    'M', new Date(2006, 8, 1),  2026, {}, 5),
  youth('y-muresan-denisa',     'Denisa',   'Muresan',    'F', new Date(2007, 0, 15), 2026, {}, 6),
  youth('y-toader-noemi',       'Noemi',    'Toader',     'F', new Date(2001, 9, 4),  2026, { phone: '643 55 03 01', email: '', isCoordinator: true }, 7),
  youth('y-blejusca-david',     'David',    'Blejusca',   'M', new Date(2006, 7, 25), 2026, {}, 8),
  youth('y-rus-miriam',         'Miriam',   'Rus',        'F', new Date(2007, 4, 18), 2026, {}, 9),
  youth('y-romosan-david',      'David',    'Romoşan',    'M', new Date(2005, 3, 9),  2026, {}, 0),
  youth('y-romosan-iosif',      'Iosif',    'Romoşan',    'M', new Date(2008, 1, 27), 2026, {}, 1),
  youth('y-istratoaie-rebeca',  'Rebeca',   'Istrătoaie', 'F', new Date(2007, 5, 14), 2026, {}, 2),
  youth('y-istratoaie-david',   'David',    'Istrătoaie', 'M', new Date(2006, 10, 3), 2026, {}, 3),
  youth('y-toader-carla',       'Carla',    'Toader',     'F', new Date(2008, 2, 21), 2026, {}, 4),
  youth('y-toader-ainoa',       'Ainoa',    'Toader',     'F', new Date(2009, 6, 8),  2026, {}, 5),
  youth('y-filimon-natanael',   'Natanael', 'Filimon',    'M', new Date(2006, 11, 17),2026, {}, 6),
  youth('y-suciu-sara',         'Sara',     'Suciu',      'F', new Date(2007, 8, 23), 2026, {}, 7),
  youth('y-stulianec-sara',     'Sara',     'Stulianec',  'F', new Date(2008, 4, 11), 2026, {}, 8),
  youth('y-stulianec-david',    'David',    'Stulianec',  'M', new Date(2006, 6, 6),  2026, {}, 9),
  youth('y-pop-naomi',          'Naomi',    'Pop',        'F', new Date(2007, 2, 30), 2026, {}, 0),
  youth('y-mihalca-darius',     'Darius',   'Mihalca',    'M', new Date(2005, 9, 19), 2026, {}, 1),
  youth('y-bereza-eduard',      'Eduard',   'Bereza',     'M', new Date(2008, 7, 4),  2026, {}, 2),
  youth('y-bereza-ionatan',     'Ionatan',  'Bereza',     'M', new Date(1999, 11, 28),2026, { phone: '643 74 50 12', email: '', isCoordinator: true }, 3),
  youth('y-copran-matias',      'Matias',   'Copran',     'M', new Date(2008, 7, 4),  2026, {}, 4),
  youth('y-tot-aaron',          'Aaron',    'Tot',        'M', new Date(2008, 7, 4),  2026, {}, 5),

  // ---- Foști coordonatori (istoric) — au coordonat compoziții de echipă închise și nu mai sunt activi ----
  youth('y-ivascu-simona',
    'Simona',
    'Ivaşcu',
    'F',
    new Date(1995, 1, 10),
    2026,
    { isCoordinator: true, 
      phone: '624 18 33 02',
      active: false,
      inactiveSince: new Date(2026, 1, 28),
      inactiveReason: ''
    }, 
    4
  ),
  /* 
  // ---- Foști membri (arhivați — nu mai participă activ, dar păstrăm istoricul) ----
  youth('y-arhiva-andrei',      'Andrei',   'Petrescu',   'M', new Date(2003, 5, 14), 2022,
    { active: false, phone: '610 88 11 22',
      inactiveSince: new Date(2025, 5, 30),
      inactiveReason: 'Mutat în alt oraș pentru studii.' }, 6),
  youth('y-arhiva-elena',       'Elena',    'Crăciun',    'F', new Date(2004, 8,  3), 2023,
    { active: false,
      inactiveSince: new Date(2025, 11, 15),
      inactiveReason: 'Pauză personală.' }, 7),
  youth('y-arhiva-mihai',       'Mihai',    'Stoica',     'M', new Date(2002, 2, 19), 2021,
    { active: false,
      inactiveSince: new Date(2024, 8, 1),
      inactiveReason: 'A trecut la grupa de adulți.' }, 8), 
  */
];

/* ===================== TABEL INTERMEDIAR TÂNĂR ↔ ECHIPĂ ===================== */

/** Helper pentru a crea apartenențe rapid. */
function membership(youthId: string, teamName: string, role: 'coordonator' | 'membru' = 'membru', active = true, endDate?: Date): YouthTeamMembership {
  return { youthId, teamName, role, active, endDate };
}

export const YOUTH_TEAM_MEMBERSHIPS: YouthTeamMembership[] = [
  // ---- Echipa 1 (activă) ----
  membership('y-pintilei-david',    'Echipa 1'),
  membership('y-halas-timotei',     'Echipa 1'),
  membership('y-mitoseriu-kevin',   'Echipa 1'),
  membership('y-birle-filip',       'Echipa 1'),
  membership('y-toth-sara',         'Echipa 1'),
  membership('y-muresan-naomi',     'Echipa 1'),
  membership('y-halas-luigi',       'Echipa 1', 'coordonator'),

  // ---- Echipa 2 (activă) ----
  membership('y-birle-tania',       'Echipa 2'),
  membership('y-halas-noemi',       'Echipa 2'),
  membership('y-dobre-irene',       'Echipa 2'),
  membership('y-mitoseriu-miriam',  'Echipa 2'),
  membership('y-zagrean-jesica',    'Echipa 2'),
  membership('y-halas-damaris',     'Echipa 2'),
  membership('y-marcu-nereea',      'Echipa 2'),
  membership('y-dobre-david',       'Echipa 2', 'coordonator'),

  // ---- Echipa 3 (activă) ----
  membership('y-les-fineas',        'Echipa 3'),
  membership('y-copran-david',      'Echipa 3'),
  membership('y-dulca-daniel',      'Echipa 3'),
  membership('y-dulca-david',       'Echipa 3'),
  membership('y-apalaghiei-samuel', 'Echipa 3'),
  membership('y-gherasim-sara',     'Echipa 3'),
  membership('y-istratoaie-ruben',  'Echipa 3'),
  membership('y-istratoaie-dina',   'Echipa 3', 'coordonator'),


  // ---- Echipa 4 (activă, coordonator nou Mitoşeriu Miriam) ----
  membership('y-barba-levi',        'Echipa 4'),
  membership('y-barba-rebeca',      'Echipa 4'),
  membership('y-biris-sara',        'Echipa 4'),
  membership('y-biris-david',       'Echipa 4'),
  membership('y-jescu-marco',       'Echipa 4'),
  membership('y-albu-gabriel',      'Echipa 4'),
  membership('y-copran-matias',     'Echipa 4'),
  membership('y-tot-aaron',         'Echipa 4'),
  membership('y-negrusier-rut',     'Echipa 4'),
  membership('y-mic-karina',        'Echipa 4', 'coordonator'),
  

  // ---- Echipa 5 (activă) ----
  membership('y-valean-noelia',     'Echipa 5'),
  membership('y-valean-vlad',       'Echipa 5'),
  membership('y-valean-naomi',      'Echipa 5'),
  membership('y-dragan-abel',       'Echipa 5'),
  membership('y-baleanu-samuel',    'Echipa 5'),
  membership('y-muresan-denisa',    'Echipa 5'),
  membership('y-toader-noemi',      'Echipa 5', 'coordonator'),

  // ---- Echipa 6 (activă, coordonator nou Halas Noemi) ----
  membership('y-blejusca-david',    'Echipa 6'),
  membership('y-rus-miriam',        'Echipa 6'),
  membership('y-romosan-david',     'Echipa 6'),
  membership('y-romosan-iosif',     'Echipa 6'),
  membership('y-bosancu-amalia',    'Echipa 6'),
  membership('y-istratoaie-rebeca', 'Echipa 6'),
  membership('y-istratoaie-david',  'Echipa 6'),
  membership('y-toader-carla',      'Echipa 6'),
  membership('y-toader-ainoa',      'Echipa 6'),
  membership('y-halas-noemi',       'Echipa 6', 'coordonator'),

  // ---- Echipa 7 (activă) ----
  membership('y-filimon-natanael',  'Echipa 7'),
  membership('y-suciu-sara',        'Echipa 7'),
  membership('y-stulianec-sara',    'Echipa 7'),
  membership('y-stulianec-david',   'Echipa 7'),
  membership('y-pop-naomi',         'Echipa 7'),
  membership('y-mihalca-darius',    'Echipa 7'),
  membership('y-bereza-eduard',     'Echipa 7'),
  membership('y-bereza-ionatan',    'Echipa 7', 'coordonator'),

  // ---- ISTORIC ----
  membership('y-biris-sara',        'Echipa 4', 'membru',     false, new Date(2026, 1, 27)),
  membership('y-biris-david',       'Echipa 4', 'membru',     false, new Date(2026, 1, 27)),
  membership('y-jescu-marco',       'Echipa 4', 'membru',     false, new Date(2026, 1, 27)),
  membership('y-albu-gabriel',      'Echipa 4', 'membru',     false, new Date(2026, 1, 27)),
  membership('y-ivascu-simona',     'Echipa 4', 'coordonator',false, new Date(2026, 1, 27)),

  membership('y-blejusca-david',    'Echipa 6', 'membru',     false, new Date(2026, 1, 27)),
  membership('y-rus-miriam',        'Echipa 6', 'membru',     false, new Date(2026, 1, 27)),
  membership('y-romosan-david',     'Echipa 6', 'membru',     false, new Date(2026, 1, 27)),
  membership('y-romosan-iosif',     'Echipa 6', 'membru',     false, new Date(2026, 1, 27)),
  membership('y-istratoaie-rebeca', 'Echipa 6', 'membru',     false, new Date(2026, 1, 27)),
  membership('y-istratoaie-david',  'Echipa 6', 'membru',     false, new Date(2026, 1, 27)),
  membership('y-bosancu-amalia',    'Echipa 6', 'coordonator',false, new Date(2026, 1, 27)),

  membership('y-les-fineas',    'Echipa 3', 'membru',     false, new Date(2026, 3, 17)),
  membership('y-copran-david',        'Echipa 3', 'membru',     false, new Date(2026, 3, 17)),
  membership('y-dulca-daniel',     'Echipa 3', 'membru',     false, new Date(2026, 3, 17)),
  membership('y-dulca-david',        'Echipa 3', 'membru',     false, new Date(2026, 3, 17)),
  membership('y-gherasim-sara',  'Echipa 3', 'membru',     false, new Date(2026, 3, 17)),
  membership('y-istratoaie-dina',  'Echipa 3', 'membru',     false, new Date(2026, 3, 17)),
  membership('y-istratoaie-ruben',    'Echipa 3', 'coordonator', false, new Date(2026, 3, 17)),

  // ---- Foști membri (arhivați) — apartenențe istorice care au generat istoric de programări ----
  /* 
  membership('y-arhiva-andrei',     'Echipa 1', 'membru', false, new Date(2025, 5, 30)),
  membership('y-arhiva-elena',      'Echipa 5', 'membru', false, new Date(2025, 11, 15)),
  membership('y-arhiva-mihai',      'Echipa 7', 'membru', false, new Date(2024, 8, 1)), 
  */
];

/* ===================== ECHIPE (DERIVATE) ===================== */

function buildTeam(teamName: string, active: boolean): { team: Team | null; history: TeamHistory | null } {
  const memberships = YOUTH_TEAM_MEMBERSHIPS.filter(m => m.teamName === teamName && m.active === active);
  if (memberships.length === 0) return { team: null, history: null };

  const coordMembership = memberships.find(m => m.role === 'coordonator');
  const coordYouth = coordMembership ? YOUTHS.find(y => y.id === coordMembership.youthId) : undefined;

  const members: TeamMember[] = memberships.map(m => {
    const y = YOUTHS.find(yy => yy.id === m.youthId);
    return y
      ? { name: y.fullName, phone: y.phone, youthId: y.id }
      : { name: '?', youthId: m.youthId };
  });

  if (active) {
    return {
      team: {
        name: teamName,
        coordinator: coordYouth?.fullName ?? '—',
        coordinatorPhone: coordYouth?.phone ?? '',
        coordinatorYouthId: coordYouth?.id,
        members,
      },
      history: null,
    };
  }
  return {
    team: null,
    history: {
      name: teamName,
      coordinator: coordYouth?.fullName ?? '—',
      coordinatorPhone: coordYouth?.phone,
      members,
      endDate: coordMembership?.endDate ?? new Date(),
    },
  };
}

const TEAM_NAMES = ['Echipa 1', 'Echipa 2', 'Echipa 3', 'Echipa 4', 'Echipa 5', 'Echipa 6', 'Echipa 7'];

export const TEAMS_DATA: Team[] = TEAM_NAMES
  .map(n => buildTeam(n, true).team)
  .filter((t): t is Team => t !== null);

export const TEAMS_HISTORY: TeamHistory[] = (() => {
  // grupăm aparteneneţele istorice după echipă pentru a construi „istoricul"
  const historicalTeams = Array.from(
    new Set(YOUTH_TEAM_MEMBERSHIPS.filter(m => !m.active).map(m => m.teamName))
  );
  return historicalTeams
    .map(n => buildTeam(n, false).history)
    .filter((h): h is TeamHistory => h !== null);
})();

/* ===================== PĂRINȚI (foștii „sprijin") ===================== */

export const PARENTS: Parent[] = [
  {
    id: 'p-001',
    name: 'Maria Bîrle',
    phone: '',
    email: '',
    role: '',
    skills: [],
    joinedDate: new Date(2026, 0, 1),
    notes: '',
    initials: 'MB',
    accentColor: '#1565c0',
    available: true,
  },
  {
    id: 'p-002',
    name: 'Maria Dobre',
    phone: '',
    email: '',
    role: '',
    skills: [],
    joinedDate: new Date(2026, 0, 1),
    notes: '',
    initials: 'MD',
    accentColor: '#6a1b9a',
    available: true,
  },
  {
    id: 'p-003',
    name: 'Aura Mitoșeriu',
    phone: '',
    email: '',
    role: '',
    skills: [],
    joinedDate: new Date(2026, 0, 1),
    notes: '',
    initials: 'AM',
    accentColor: '#2e7d32',
    available: true,
  },
  {
    id: 'p-004',
    name: 'Vali Negrușier',
    phone: '',
    email: '',
    role: '',
    skills: [],
    joinedDate: new Date(2026, 0, 1),
    notes: '',
    initials: 'VN',
    accentColor: '#e65100',
    available: true,
  },
  {
    id: 'p-005',
    name: 'Gabriela Adina Dulca',
    phone: '',
    email: '',
    role: '',
    skills: [],
    joinedDate: new Date(2026, 0, 1),
    notes: '',
    initials: 'GAD',
    accentColor: '#00838f',
    available: true,
  },
  {
    id: 'p-006',
    name: 'Lenuța Apălăghie',
    phone: '',
    email: '',
    role: '',
    skills: [],
    joinedDate: new Date(2026, 0, 1),
    notes: '',
    initials: 'LA',
    accentColor: '#c93e22',
    available: true,
  },
  {
    id: 'p-007',
    name: 'Simona Pintilei',
    phone: '',
    email: '',
    role: '',
    skills: [],
    joinedDate: new Date(2026, 0, 1),
    notes: '',
    initials: 'SP',
    accentColor: '#ff27d4',
    available: true,
  },
  {
    id: 'p-008',
    name: 'Claudia Rus',
    phone: '',
    email: '',
    role: '',
    skills: [],
    joinedDate: new Date(2026, 0, 1),
    notes: '',
    initials: 'CR',
    accentColor: '#2745b1',
    available: true,
  },

  /* 
  // ✅ Singurul exemplu COMPLET — copiază structura pentru părinți reali.
  {
    id: 'p-001',
    name: 'Andrei Popescu',
    phone: '612 34 56 78',
    email: 'andrei.popescu@example.com',
    role: 'Bucătărie',
    skills: ['Gătit', 'Tăiat legume', 'Coordonare cuptor'],
    joinedDate: new Date(2026, 0, 1),
    notes: 'Are experiență în catering pentru evenimente mari.',
    initials: 'AP',
    accentColor: '#1565c0',
    available: true,
  },
  // ⬇️ Schelete curate — completează ulterior cu date reale.
  {
    id: 'p-002',
    name: 'Maria Ionescu',
    phone: '623 45 67 89',
    email: 'maria.ionescu@example.com',
    role: '',
    skills: [],
    joinedDate: new Date(2026, 0, 1),
    notes: '',
    initials: 'MI',
    accentColor: '#6a1b9a',
    available: true,
  },
  */

  /* 
  // ⬇️ Părinți arhivați (foști sprijin — nu mai sunt activi, dar îi păstrăm pentru istoric).
  {
    id: 'p-arhiva-001',
    name: 'Sorina Munteanu',
    phone: '660 11 22 33',
    email: 'sorina.munteanu@example.com',
    role: 'Bucătărie',
    skills: ['Gătit', 'Patiserie'],
    joinedDate: new Date(2024, 1, 10),
    notes: 'A ajutat 2 ani consecutiv la programele de iarnă.',
    initials: 'SM',
    accentColor: '#ad1457',
    available: false,
    active: false,
    inactiveSince: new Date(2025, 11, 31),
    inactiveReason: 'Schimbare de program profesional.',
  },
  */
];

/** Părinți alocați ca ajutor unor echipe (asignări active). */
export const PARENT_TEAM_ASSIGNMENTS: ParentTeamAssignment[] = [
  /* 
  { parentId: 'p-001', teamName: 'Echipa 4', assignedSince: new Date(2026, 3, 20), reason: 'Ajutor la bucătărie pentru programul din 8 mai.' },
  { parentId: 'p-002', teamName: 'Echipa 4', assignedSince: new Date(2026, 3, 20), reason: 'Ajutor la logistică și aranjarea meselor.' },
  */
];

/** Legături familiale părinte ↔ tânăr (pentru a conecta toate datele). relationship: mamă - tată */
export const PARENT_YOUTH_LINKS: ParentYouthLink[] = [
  { parentId: 'p-001', youthId: 'y-birle-tania',  relationship: 'mamă' },
  { parentId: 'p-001', youthId: 'y-birle-filip',  relationship: 'mamă' },
  { parentId: 'p-002', youthId: 'y-dobre-irene',  relationship: 'mamă' },
  { parentId: 'p-002', youthId: 'y-dobre-david',  relationship: 'mamă' },
  { parentId: 'p-003', youthId: 'y-mitoseriu-miriam',  relationship: 'mamă' },
  { parentId: 'p-003', youthId: 'y-mitoseriu-kevin',  relationship: 'mamă' },
  { parentId: 'p-004', youthId: 'y-negrusier-rut',  relationship: 'mamă' },
  { parentId: 'p-005', youthId: 'y-dulca-daniel',  relationship: 'mamă' },
  { parentId: 'p-005', youthId: 'y-dulca-david',  relationship: 'mamă' },
  { parentId: 'p-006', youthId: 'y-apalaghiei-samuel',  relationship: 'mamă' },
  { parentId: 'p-007', youthId: 'y-pintilei-david',  relationship: 'mamă' },
  { parentId: 'p-008', youthId: 'y-rus-miriam',  relationship: 'mamă' },
];

/* ===================== REGULI ===================== */

export const RULES = {
  coordinatorRole: {
    title: 'Funcția coordonatorilor',
    items: [
      'Coordonarea echipei pentru a participa toți membrii la pregătirea mesei, fiind atenți la ziua programată și amintindu-le celorlalți participanți că trebuie să-și facă timp pentru eveniment.',
      'În momentul pregătirii mesei, sunt responsabili de crearea unui ambient plăcut în echipă între membrii acesteia și de soluționarea oricărui conflict posibil.',
    ]
  },
  coordinatorOrganization: {
    title: 'Organizarea coordonatorilor',
    items: [
      'Planificarea mesei care se va pregăti cu tinerii la biserică și punerea în comun, împreună cu membrii echipei, din timp, a ceea ce se va pregăti.',
      'Planificarea cumpărăturilor necesare încadrate în bugetul stabilit pentru fiecare program și calcularea cantităților în funcție de numărul de persoane care se așteaptă să participe la program.',
      'Organizarea cumpărăturilor și executarea lor (în caz că nu o pot face ei înșiși, trebuie să se asigure că găsesc o persoană responsabilă pentru acestea).',
      'Păstrarea tichetelor cheltuielilor legate de pregătirea mesei și prezentarea acestora casierului departamentului de tineret.',
      'Informarea înainte de pregătire asupra lucrurilor disponibile la biserică și a celor care lipsesc, pentru o bună organizare a cumpărăturilor (sucuri, tacâmuri, pahare, fețe de masă din hârtie, șervețele etc.).',
      'Stabilirea orei de întâlnire pentru pregătirea mesei și a asigura prezența tuturor membrilor echipei. În mod obișnuit, ora de întâlnire va fi cu o oră înainte de program (19:30), cu excepția cazurilor în care există programe speciale.',
      'Respectarea regulilor de igienă la orice activitate care are legătură cu masa (spălarea mâinilor, folosirea mănușilor, prinderea părului lung în timpul pregătirii, asigurarea că toate produsele sunt în stare corectă pentru consum și au data de expirare valabilă etc.).',
    ]
  },
  beforeProgram: {
    title: 'Înainte de program',
    items: [
      'Montarea meselor (7 mese pentru 60 de persoane) și scoaterea lor.',
      'Punerea pe mese a fețelor de masă.',
      'Repartizarea pe mese: sucuri, mâncarea pregătită, articole de unică folosință (pahare, șervețele, farfurii, tacâmuri etc.).',
    ]
  },
  afterProgram: {
    title: 'La terminare',
    items: [
      'Adunarea lucrurilor nefolosite de pe masă și păstrarea lor în locurile corespunzătoare.',
      'Spălarea și curățarea meselor sau a oricărui obiect reutilizabil folosit.',
      'Demontarea meselor și repunerea lor.',
      'Măturarea și spălarea cu mopul a podelei din hol și a locurilor unde a avut loc activitatea.',
    ]
  },
  parentsRole: {
    title: 'Funcția părinților de sprijin',
    items: [
      'Ajutarea și îmbogățirea mesei cu aperitive sau prăjituri mai consistente, care să fie adăugate ca un compliment la fiecare masă pregătită de tineri.',
      'Responsabilitatea de a aduce mâncarea pregătită la biserică cu cel puțin 30 de minute înainte de începerea programului.'
    ]
  }
};
