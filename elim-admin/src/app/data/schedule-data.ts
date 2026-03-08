export interface ScheduleEntry {
  team: string;
  coordinator: string;
  programType: string;
  estimatedPersons: number;
  date: Date;
  observations: string;
  completed: boolean;
}

export interface TeamMember {
  name: string;
  phone?: string;
}

export interface Team {
  name: string;
  coordinator: string;
  coordinatorPhone: string;
  members: TeamMember[];
}

export interface TeamHistory {
  name: string;
  coordinator: string;
  coordinatorPhone?: string;
  members: TeamMember[];
  endDate: Date;
}

export const SCHEDULE_DATA: ScheduleEntry[] = [
  { team: 'Echipa 1', coordinator: 'Halas Luigi', programType: 'Seară de tineret', estimatedPersons: 60, date: new Date(2025, 2, 10), observations: '', completed: true },
  { team: 'Echipa 2', coordinator: 'Dobre David', programType: 'Seară de tineret', estimatedPersons: 60, date: new Date(2025, 9, 10), observations: '', completed: true },
  { team: 'Echipa 3', coordinator: 'Istrătoaie Ruben', programType: 'Seară de tineret', estimatedPersons: 60, date: new Date(2025, 9, 17), observations: '', completed: true },
  { team: 'Echipa 4', coordinator: 'Ivaşcu Simona', programType: 'Seară de tineret', estimatedPersons: 60, date: new Date(2025, 9, 24), observations: '', completed: true },
  { team: 'Echipa 5', coordinator: 'Toader Noemi', programType: 'Seară de tineret', estimatedPersons: 60, date: new Date(2025, 9, 31), observations: '', completed: true },
  { team: 'Echipa 6', coordinator: 'Bosancu Amalia', programType: 'Seară de tineret', estimatedPersons: 60, date: new Date(2025, 10, 14), observations: '', completed: true },
  { team: 'Echipa 7', coordinator: 'Bereza Ionatan', programType: 'Seară de tineret', estimatedPersons: 60, date: new Date(2025, 10, 21), observations: '', completed: true },
  { team: 'Echipa 1', coordinator: 'Halas Luigi', programType: 'Seară de tineret', estimatedPersons: 60, date: new Date(2025, 10, 28), observations: '', completed: true },
  { team: 'Echipa 2', coordinator: 'Dobre David', programType: 'Seară de tineret', estimatedPersons: 60, date: new Date(2025, 11, 5), observations: '', completed: true },
  { team: 'Echipa 3', coordinator: 'Istrătoaie Ruben', programType: 'Seară de tineret', estimatedPersons: 60, date: new Date(2025, 11, 12), observations: '', completed: true },
  { team: 'Echipa 4', coordinator: 'Ivaşcu Simona', programType: 'Seară de tineret', estimatedPersons: 60, date: new Date(2026, 0, 2), observations: '', completed: true },
  { team: 'Echipa 5', coordinator: 'Toader Noemi', programType: 'Seară de tineret', estimatedPersons: 60, date: new Date(2026, 0, 9), observations: '', completed: true },
  { team: 'Echipa 6', coordinator: 'Bosancu Amalia', programType: 'Seară de tineret', estimatedPersons: 60, date: new Date(2026, 0, 16), observations: '', completed: true },
  { team: 'Echipa 3', coordinator: 'Istrătoaie Ruben', programType: 'Seară de tineret', estimatedPersons: 60, date: new Date(2026, 0, 30), observations: '', completed: true },
  { team: 'Echipa 7', coordinator: 'Bereza Ionatan', programType: 'Seară de tineret', estimatedPersons: 60, date: new Date(2026, 1, 6), observations: '', completed: true },
  { team: 'Echipa 2', coordinator: 'Dobre David', programType: 'Seară de tineret', estimatedPersons: 60, date: new Date(2026, 1, 13), observations: '', completed: true },
  { team: 'Echipa 1', coordinator: 'Halas Luigi', programType: 'Seară de tineret', estimatedPersons: 60, date: new Date(2026, 1, 20), observations: '', completed: true },
  { team: 'Echipa 4', coordinator: 'Ivaşcu Simona', programType: 'Seară de tineret', estimatedPersons: 60, date: new Date(2026, 1, 27), observations: '', completed: true },
  { team: 'Echipa 5', coordinator: 'Toader Noemi', programType: 'Seară de tineret', estimatedPersons: 60, date: new Date(2026, 2, 6), observations: '', completed: true },
  { team: 'Echipa 6', coordinator: 'Bosancu Amalia', programType: 'Seară de tineret', estimatedPersons: 60, date: new Date(2026, 2, 13), observations: '', completed: false },
  { team: 'Echipa 7', coordinator: 'Bereza Ionatan', programType: 'Seară de tineret', estimatedPersons: 60, date: new Date(2026, 2, 27), observations: '', completed: false },
  { team: 'Echipa 1', coordinator: 'Halas Luigi', programType: 'Seară de tineret', estimatedPersons: 60, date: new Date(2026, 3, 3), observations: '', completed: false },
  { team: 'Echipa 2', coordinator: 'Dobre David', programType: 'Seară de tineret', estimatedPersons: 60, date: new Date(2026, 3, 10), observations: '', completed: false },
  { team: 'Echipa 3', coordinator: 'Istrătoaie Ruben', programType: 'Seară de tineret', estimatedPersons: 60, date: new Date(2026, 3, 17), observations: '', completed: false },
  { team: 'Echipa 4', coordinator: 'Miriam Mitoşeriu', programType: 'Seară de tineret', estimatedPersons: 60, date: new Date(2026, 3, 24), observations: '', completed: false },
  { team: 'Echipa 5', coordinator: 'Toader Noemi', programType: 'Seară de tineret', estimatedPersons: 60, date: new Date(2026, 4, 1), observations: '', completed: false },
  { team: 'Echipa 6', coordinator: 'Bosancu Amalia', programType: 'Seară de tineret', estimatedPersons: 60, date: new Date(2026, 4, 8), observations: '', completed: false },
  { team: 'Echipa 7', coordinator: 'Bereza Ionatan', programType: 'Seară de tineret', estimatedPersons: 60, date: new Date(2026, 4, 15), observations: '', completed: false },
  { team: 'Echipa 1', coordinator: 'Halas Luigi', programType: 'Seară de tineret', estimatedPersons: 60, date: new Date(2026, 4, 22), observations: '', completed: false },
  { team: 'Echipa 2', coordinator: 'Dobre David', programType: 'Seară de tineret', estimatedPersons: 60, date: new Date(2026, 4, 29), observations: '', completed: false },
];

export const TEAMS_DATA: Team[] = [
  {
    name: 'Echipa 1',
    coordinator: 'Halas Luigi',
    coordinatorPhone: '643 86 91 66',
    members: [
      { name: 'Pintilei David' },
      { name: 'Halas Timotei' },
      { name: 'Mitoseriu Kevin' },
      { name: 'Bîrle Filip' },
      { name: 'Toth Sara' },
      { name: 'Muresan Naomi'},
      { name: 'Halas Luigi', phone: '643 86 91 66' },
    ]
  },
  {
    name: 'Echipa 2',
    coordinator: 'Dobre David',
    coordinatorPhone: '641 45 50 67',
    members: [
      { name: 'Bîrle Tania' },
      { name: 'Halas Noemi' },
      { name: 'Dobre Irene' },
      { name: 'Mitoşeriu Miriam' },
      { name: 'Zăgrean Jesica' },
      { name: 'Halas Damaris' },
      { name: 'Marcu Nereea' },
      { name: 'Dobre David', phone: '641 45 50 67' },
    ]
  },
  {
    name: 'Echipa 3',
    coordinator: 'Istrătoaie Ruben',
    coordinatorPhone: '624 20 97 09',
    members: [
      { name: 'Leş Fineas' },
      { name: 'Copran David' },
      { name: 'Dulcă Daniel' },
      { name: 'Dulcă David' },
      { name: 'Samuel Apalaghiei' },
      { name: 'Gherasim Sara' },
      { name: 'Istrătoaie Dina' },
      { name: 'Istrătoaie Ruben', phone: '624 20 97 09' },
    ]
  },
  {
    name: 'Echipa 4',
    coordinator: 'Mitoşeriu Miriam',
    coordinatorPhone: '641 45 43 01',
    members: [
      { name: 'Barbă Levi' },
      { name: 'Rebeca Levi' },
      { name: 'Biriş Sara' },
      { name: 'Biriş David' },
      { name: 'Jescu Marco' },
      { name: 'Albu Gabriel' },
      { name: 'Mic Karina' },
      { name: 'Toader Ainoa' },
      { name: 'Zăgrean Jesica' },
      { name: 'Mitoşeriu Miriam', phone: '641 45 43 01' },
    ]
  },
  {
    name: 'Echipa 5',
    coordinator: 'Toader Noemi',
    coordinatorPhone: '643 55 03 01',
    members: [
      { name: 'Valean Noelia' },
      { name: 'Valean Vlad' },
      { name: 'Valean Naomi' },
      { name: 'Dragăn Abel' },
      { name: 'Baleanu Samuel' },
      { name: 'Muresan Denisa' },
      { name: 'Toader Noemi', phone: '643 55 03 01' },
    ]
  },
  {
    name: 'Echipa 6',
    coordinator: 'Bosancu Amalia',
    coordinatorPhone: '672 26 31 77',
    members: [
      { name: 'Blejusca David' },
      { name: 'Rus Miriam' },
      { name: 'Romoşan David' },
      { name: 'Romoşan Iosif' },
      { name: 'Istrătoaie Rebeca' },
      { name: 'Istrătoaie David' },
      { name: 'Bosancu Amalia', phone: '672 26 31 77' },
    ]
  },
  {
    name: 'Echipa 7',
    coordinator: 'Bereza Ionatan',
    coordinatorPhone: '643 74 50 12',
    members: [
      { name: 'Filimon Natanael' },
      { name: 'Suciu Sara' },
      { name: 'Stulianec Sara' },
      { name: 'Stulianec David' },
      { name: 'Pop Naomi' },
      { name: 'Darius Mihalca' },
      { name: 'Bereza Eduard' },
      { name: 'Bereza Ionatan', phone: '643 74 50 12' },
    ]
  },
];

export const TEAMS_HISTORY: TeamHistory[] = [
  {
    name: 'Echipa 4',
    coordinator: 'Ivaşcu Simona',
    members: [
      { name: 'Biriş Sara' },
      { name: 'Biriş David' },
      { name: 'Jescu Marco' },
      { name: 'Albu Gabriel' },
      { name: 'Ivaşcu Simona'},
    ],
    endDate: new Date(2026, 1, 27),
  },
];

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
  }
};
