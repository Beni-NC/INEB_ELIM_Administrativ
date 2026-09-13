/**
 * Modelos de dominio y tipos de UI. Única fuente de interfaces: los ficheros de datos
 * (`data/*.data.ts`) importan de aquí, nunca al revés.
 */

/* ─────────────────────────── Programación ─────────────────────────── */

export interface ScheduleEntry {
  team: string;
  coordinator: string;
  programType: string;
  estimatedPersons: number;
  date: Date;
  observations: string;
  completed: boolean;
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
  gender: 'M' | 'F';
  address?: string;
  notes?: string;
  interests?: string[];
  isCoordinator?: boolean;
  /** `false` = archivado (ya no participa). Por defecto activo. */
  active?: boolean;
  inactiveSince?: Date;
  inactiveReason?: string;
}

/** Joven tal y como se escribe en los datos: lo derivable (`fullName`, `initials`) lo calcula el índice. */
export type YouthRecord = Omit<Youth, 'fullName' | 'initials'>;

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
  available: boolean;
  /** `false` = archivado. Por defecto activo. */
  active?: boolean;
  inactiveSince?: Date;
  inactiveReason?: string;
}

/** Padre tal y como se escribe en los datos: `initials` lo calcula el índice. */
export type ParentRecord = Omit<Parent, 'initials'>;

/** Asignación fija padre ↔ equipo (actualmente sin uso: el apoyo es por programación). */
export interface ParentTeamAssignment {
  parentId: string;
  teamName: string;
  assignedSince: Date;
  reason?: string;
}

/** Vínculo familiar padre ↔ joven. */
export interface ParentYouthLink {
  parentId: string;
  youthId: string;
  relationship: 'tată' | 'mamă' | 'tutore';
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

export interface ScheduleStats {
  upcoming: number;
  thisMonth: number;
  completed: number;
  teams: number;
}

export interface YouthStats {
  total: number;
  coordinators: number;
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
