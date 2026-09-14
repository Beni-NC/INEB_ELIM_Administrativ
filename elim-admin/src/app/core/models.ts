/**
 * Modelos de dominio y tipos de UI. Única fuente de interfaces: los ficheros de datos
 * (`data/*.data.ts`) importan de aquí, nunca al revés.
 */

/* ─────────────────────────── Programación ─────────────────────────── */

/** Tipo de programa. Código, no texto: la vista lo traduce con la clave `program_type.<código>`. */
export type ProgramType = 'youth_evening';

export interface ScheduleEntry {
  team: string;
  coordinator: string;
  programType: ProgramType;
  estimatedPersons: number;
  date: Date;
  observations: string;
  /** IDs de padres que apoyan puntualmente ESTA programación (asignación manual). */
  parentSupporters?: string[];
  /** Hora de inicio del programa (HH:mm). Por defecto `DEFAULT_PROGRAM_START_TIME`. */
  programStartTime?: string;
  /** Hora a la que los jóvenes deben estar en la iglesia (HH:mm). Por defecto `DEFAULT_YOUTHS_ARRIVAL_TIME`. */
  youthsArrivalTime?: string;
  /** Hora a la que los padres traen la comida (HH:mm). Por defecto: inicio − 30 min. */
  parentsFoodArrivalTime?: string | null;
}

/** Horas efectivas de una programación tras aplicar los valores por defecto. */
export interface EntryTimes {
  programStart: string;
  youthsArrival: string;
  parentsFoodArrival: string;
}

/* ─────────────────────────── Jóvenes ─────────────────────────── */

export type YouthRole = 'coordonator' | 'membru';

export interface Youth {
  id: string;
  firstName: string;
  lastName: string;
  /** Nombre canónico para mostrar: "Apellido Nombre". */
  fullName: string;
  phone?: string;
  email?: string;
  birthDate: Date;
  /** Año en que se incorporó al departamento. */
  joinedYear: number;
  initials: string;
  /** Tono de avatar (0–7), derivado del id: color estable por persona. */
  tone: number;
  gender: 'M' | 'F';
  address?: string;
  notes?: string;
  interests?: string[];
  /** `false` = archivado (ya no participa). Por defecto activo. */
  active?: boolean;
  inactiveSince?: Date;
  inactiveReason?: string;
}

/** Joven tal y como se escribe en los datos: lo derivable (`fullName`, `initials`) lo calcula el índice. */
export type YouthRecord = Omit<Youth, 'fullName' | 'initials' | 'tone'>;

/** Relación joven ↔ equipo (activa o histórica). */
export interface YouthTeamMembership {
  youthId: string;
  teamName: string;
  role: YouthRole;
  active: boolean;
  joinedDate?: Date;
  endDate?: Date;
}

/* ─────────────────────────── Padres ─────────────────────────── */

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
  /** Tono de avatar (0–7), derivado del id. */
  tone: number;
  available: boolean;
  /** `false` = archivado. Por defecto activo. */
  active?: boolean;
  inactiveSince?: Date;
  inactiveReason?: string;
}

/** Padre tal y como se escribe en los datos: `initials` lo calcula el índice. */
export type ParentRecord = Omit<Parent, 'initials' | 'tone'>;

/** Parentesco. Código, no texto: la vista lo traduce con la clave `relationship.<código>`. */
export type Relationship = 'mother' | 'father' | 'guardian';

/** Vínculo familiar padre ↔ joven. */
export interface ParentYouthLink {
  parentId: string;
  youthId: string;
  relationship: Relationship;
}

/** Conjunto de datos crudos que consume `ScheduleIndex` (permite inyectar fixtures en tests). */
export interface DomainData {
  schedule: ScheduleEntry[];
  youths: YouthRecord[];
  memberships: YouthTeamMembership[];
  parents: ParentRecord[];
  parentYouthLinks: ParentYouthLink[];
}

/* ─────────────────────────── Tipos de UI ─────────────────────────── */

export type YouthFilter = 'toti' | 'coordonatori' | 'membri';
export type NavTarget = 'team' | 'youth' | 'parent';

/** KPIs de portada: solo cifras que cambian algo en el día a día. */
export interface ScheduleStats {
  upcoming: number;
  thisMonth: number;
  /** Días hasta la próxima programación (0 = hoy); null si no hay ninguna. */
  daysToNext: number | null;
  /** Equipos activos sin programación futura: a los que "les toca". */
  teamsWithoutUpcoming: number;
}

/**
 * Situación de un equipo en la rotación: cuándo le tocó por última vez y si ya tiene turno
 * programado. Es lo que el coordinador general miraba a mano para decidir el siguiente.
 */
export interface TeamRotation {
  teamName: string;
  last?: ScheduleEntry;
  next?: ScheduleEntry;
  /** Días desde la última programación; null si nunca le ha tocado. */
  daysSinceLast: number | null;
  /** Programaciones (pasadas y futuras) del equipo en la temporada actual (septiembre → agosto). */
  turnsThisSeason: number;
}

/** Turno propuesto por la app: el siguiente viernes libre para el siguiente equipo de la rotación. */
export interface ProposedEntry {
  date: Date;
  teamName: string;
  coordinatorName: string;
}

export interface YouthStats {
  total: number;
  coordinators: number;
  /** Jóvenes activos sin ninguna programación futura (su equipo aún no tiene turno). */
  withoutUpcoming: number;
}

export interface ParentStats {
  total: number;
  /** Padres activos sin apoyo programado. */
  withoutUpcoming: number;
}

/** Grupo de entradas de un mismo mes; la etiqueta se formatea en la vista (según idioma). */
export interface MonthGroup<T> {
  key: string;
  year: number;
  month: number;
  entries: T[];
}

export interface CoordinatorRotation {
  name: string;
  team: string;
  count: number;
}

/** Programación con las personas (padres) que la apoyan. */
export interface ParentEvent {
  entry: ScheduleEntry;
  people: Parent[];
}

/**
 * Composición (plantilla) de un equipo vigente en una ventana temporal.
 * `isActive: false` → cerrada en `end`; `historyKey` sirve como ancla DOM y token de navegación.
 */
export interface TeamComposition {
  teamName: string;
  coordinator?: Youth;
  coordinatorName: string;
  members: Youth[];
  end?: Date;
  isActive: boolean;
  historyKey?: string;
}
