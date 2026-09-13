import { EntryTimes, ScheduleEntry } from '../models';

/** Hora por defecto de inicio del programa de jóvenes. */
export const DEFAULT_PROGRAM_START_TIME = '20:30';
/** Hora por defecto a la que los jóvenes deben estar en la iglesia para preparar la cena. */
export const DEFAULT_YOUTHS_ARRIVAL_TIME = '19:30';
/** Minutos ANTES del inicio a los que los padres traen la comida, si no se indica otra hora. */
export const DEFAULT_PARENTS_FOOD_OFFSET_MIN = 30;

/** Resta `minutes` a una hora "HH:mm". */
function subtractMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = (h * 60 + m - minutes + 24 * 60) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

/** Horas efectivas de una programación aplicando los valores por defecto. */
export function getEntryTimes(entry: ScheduleEntry): EntryTimes {
  const programStart = entry.programStartTime ?? DEFAULT_PROGRAM_START_TIME;
  const youthsArrival = entry.youthsArrivalTime ?? DEFAULT_YOUTHS_ARRIVAL_TIME;
  const parentsFoodArrival = entry.parentsFoodArrivalTime ?? subtractMinutes(programStart, DEFAULT_PARENTS_FOOD_OFFSET_MIN);
  return { programStart, youthsArrival, parentsFoodArrival };
}

/** Clave estable para `track` en listas de programaciones. */
export function entryKey(entry: ScheduleEntry): string {
  return entry.date.getTime() + '|' + entry.team;
}

export function hasNotes(entry: ScheduleEntry): boolean {
  return !!entry.observations?.trim();
}
