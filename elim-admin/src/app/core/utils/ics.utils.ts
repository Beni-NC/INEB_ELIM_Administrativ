import { EntryTimes, ScheduleEntry } from '../models';
import { getEntryTimes } from './schedule.utils';

/**
 * Generación de iCalendar (RFC 5545) sin dependencias ni Angular: la usan `CalendarService`
 * (descarga desde la app) y `scripts/generate-calendars.mjs` (feeds publicados en el deploy).
 */

/** Textos que van dentro del .ics; los aporta quien llama (app → i18n; generador → ro.json). */
export interface IcsLabels {
  calendarName: string;
  description: string;
  /** Resumen del evento; `{{team}}` se sustituye por el nombre del equipo. */
  eventSummary: string;
  location: string;
  fieldProgramType: string;
  fieldCoordinator: string;
  fieldArrival: string;
  fieldProgramStart: string;
  fieldFood: string;
  fieldEstimated: string;
  fieldNotes: string;
}

const PRODID = '-//ELIM Administrativ//Calendar Sync//EN';
/** El evento cubre desde la llegada de los jóvenes hasta el fin estimado (inicio + 2 h 30). */
const DURATION_AFTER_START_MIN = 150;

/** Calendario completo con un VEVENT por programación. */
export function buildIcs(events: readonly ScheduleEntry[], labels: IcsLabels, now = new Date()): string {
  const dtstamp = formatUtc(now);
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:${PRODID}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(labels.calendarName)}`,
    `X-WR-CALDESC:${escapeText(labels.description)}`,
    'X-WR-TIMEZONE:Europe/Madrid',
    'X-PUBLISHED-TTL:PT1H',
    'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
  ];
  for (const ev of events) lines.push(...buildEvent(ev, dtstamp, labels));
  lines.push('END:VCALENDAR');
  return foldLines(lines).join('\r\n') + '\r\n';
}

/** Nombre de fichero estable para un evento: `echipa-1-20260508.ics`. */
export function icsFileNameForEvent(entry: ScheduleEntry): string {
  return slug(`${entry.team}-${formatDateKey(entry.date)}`) + '.ics';
}

/** Texto a identificador de fichero/URL: sin acentos, minúsculas, guiones. */
export function slug(text: string): string {
  return (text ?? '')
    .normalize('NFD')
    // Rango de diacríticos combinantes U+0300–U+036F (escritos literalmente).
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function buildEvent(entry: ScheduleEntry, dtstamp: string, labels: IcsLabels): string[] {
  const times = getEntryTimes(entry);
  const start = combine(entry.date, times.youthsArrival);
  const end = new Date(combine(entry.date, times.programStart).getTime() + DURATION_AFTER_START_MIN * 60_000);
  const summary = labels.eventSummary.replace('{{team}}', entry.team);
  return [
    'BEGIN:VEVENT',
    `UID:${slug(entry.team)}-${formatDateKey(entry.date)}@elim-admin`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${formatLocal(start)}`,
    `DTEND:${formatLocal(end)}`,
    `SUMMARY:${escapeText(summary)}`,
    `LOCATION:${escapeText(labels.location)}`,
    `DESCRIPTION:${escapeText(buildDescription(entry, times, labels))}`,
    `CATEGORIES:${escapeText(entry.team)}`,
    `STATUS:${entry.completed ? 'CONFIRMED' : 'TENTATIVE'}`,
    'TRANSP:OPAQUE',
    // Recordatorio 12 h antes: útil para no olvidar el servicio.
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeText(summary)}`,
    'TRIGGER:-PT12H',
    'END:VALARM',
    'END:VEVENT',
  ];
}

function buildDescription(entry: ScheduleEntry, times: EntryTimes, l: IcsLabels): string {
  const parts = [
    `${l.fieldProgramType}: ${entry.programType}`,
    `${l.fieldCoordinator}: ${entry.coordinator}`,
    `${l.fieldArrival}: ${times.youthsArrival}`,
    `${l.fieldProgramStart}: ${times.programStart}`,
    `${l.fieldFood}: ${times.parentsFoodArrival}`,
    `${l.fieldEstimated}: ${entry.estimatedPersons}`,
  ];
  if (entry.observations) parts.push('', `${l.fieldNotes}: ${entry.observations}`);
  // Saltos de línea reales: `escapeText` los convierte en la secuencia "\n" que exige el formato.
  return parts.join('\n');
}

/** Combina un día con "HH:mm" → Date local en ese día y hora. */
function combine(date: Date, hhmm: string): Date {
  const [h, m] = hhmm.split(':').map(Number);
  const out = new Date(date);
  out.setHours(h, m, 0, 0);
  return out;
}

const pad = (n: number): string => String(n).padStart(2, '0');

/** Hora local flotante (sin Z): el cliente la interpreta en su zona. */
function formatLocal(d: Date): string {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function formatUtc(d: Date): string {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

function formatDateKey(d: Date): string {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
}

/** Escapa los caracteres reservados de un valor de texto iCalendar. */
function escapeText(text: string): string {
  return (text ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/** Plegado de líneas a 75 octetos (RFC 5545 §3.1). */
function foldLines(lines: string[]): string[] {
  const out: string[] = [];
  for (const line of lines) {
    if (line.length <= 75) { out.push(line); continue; }
    out.push(line.slice(0, 75));
    let rest = line.slice(75);
    while (rest.length > 74) { out.push(' ' + rest.slice(0, 74)); rest = rest.slice(74); }
    if (rest.length > 0) out.push(' ' + rest);
  }
  return out;
}
