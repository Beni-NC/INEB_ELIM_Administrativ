import { slug } from './ics.utils';

/**
 * Nombres de los feeds .ics publicados en `assets/calendars/` por `scripts/generate-calendars.mjs`.
 * Un único sitio para el nombre de fichero: la app construye la URL de suscripción con estas
 * mismas funciones, así no pueden divergir.
 */
export const CALENDAR_FEEDS_DIR = 'assets/calendars';

export const feedFileForAll = (): string => 'toate.ics';
export const feedFileForTeam = (team: string): string => `echipa-${slug(team.replace(/^Echipa\s*/i, ''))}.ics`;
export const feedFileForYouth = (youthId: string): string => `tanar-${slug(youthId.replace(/^y-/, ''))}.ics`;
export const feedFileForParent = (parentId: string): string => `parinte-${slug(parentId)}.ics`;

/** URL https absoluta del feed a partir del origen y del base href de la app. */
export function feedUrl(origin: string, baseHref: string, file: string): string {
  const base = baseHref.endsWith('/') ? baseHref : baseHref + '/';
  return `${origin}${base}${CALENDAR_FEEDS_DIR}/${file}`;
}
