import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ScheduleEntry, getEntryTimes } from '../models';
import { DataService } from './data.service';

/**
 * CalendarService — generación de archivos .ics (RFC 5545) y URLs webcal://
 * para sincronizar la programación con Google Calendar / Apple Calendar / Outlook.
 *
 *  ▸ Exportación puntual (.ics)        →  download de un evento o de un conjunto.
 *  ▸ Suscripción en vivo (webcal://)   →  URL estable que el cliente de calendario
 *                                          consulta periódicamente. Requiere que la
 *                                          ruta /assets/calendars/<id>.ics esté
 *                                          publicada en el servidor que sirve la SPA.
 *
 * No depende de librerías externas: el formato iCalendar se construye manualmente
 * para mantener el bundle compacto y evitar dependencias arrastradas.
 */
@Injectable({ providedIn: 'root' })
export class CalendarService {
  private readonly data = inject(DataService);
  private readonly translate = inject(TranslateService);

  /** Identificador único usado en PRODID y como base para los UID de eventos. */
  private static readonly PRODID = '-//ELIM Administrativ//Calendar Sync//EN';
  /** Duración por defecto de un evento (minutos) cuando no se calcula otra cosa. */
  private static readonly DEFAULT_DURATION_MIN = 150; // 2h30

  /* ──────────────────────────── API pública ──────────────────────────── */

  /** Descarga un único evento como archivo .ics. */
  downloadEvent(entry: ScheduleEntry): void {
    const ics = this.buildCalendar([entry], this.calendarTitleForEvent(entry));
    this.triggerDownload(ics, this.fileNameForEvent(entry));
  }

  /** Descarga TODOS los eventos próximos de un equipo como un único .ics. */
  downloadTeam(teamName: string): void {
    const events = this.data.getUpcomingEventsForTeam(teamName);
    const ics = this.buildCalendar(events, this.t('calendar.team_calendar_name', { team: teamName }));
    this.triggerDownload(ics, this.slug(`echipa-${teamName}`) + '.ics');
  }

  /** Descarga todos los próximos eventos de un joven (de cualquiera de sus equipos activos). */
  downloadYouth(youthId: string, displayName: string): void {
    const events = this.data.getUpcomingEventsForYouth(youthId);
    const ics = this.buildCalendar(events, this.t('calendar.youth_calendar_name', { name: displayName }));
    this.triggerDownload(ics, this.slug(`${displayName}-programari`) + '.ics');
  }

  /** Descarga todos los próximos eventos donde participa un padre (apoyo). */
  downloadParent(parentId: string, displayName: string): void {
    const events = this.data.getUpcomingEventsForParent(parentId);
    const ics = this.buildCalendar(events, this.t('calendar.parent_calendar_name', { name: displayName }));
    this.triggerDownload(ics, this.slug(`${displayName}-sprijin`) + '.ics');
  }

  /**
   * URL webcal:// para suscripción en vivo. Apunta a un archivo estático
   * en /assets/calendars/<id>.ics que debe ser publicado por backend o build pipeline.
   * Si la app se sirve por https://, devuelve `webcal://host/...`.
   */
  webcalUrlForTeam(teamName: string): string {
    return this.buildWebcalUrl(`team-${this.slug(teamName)}.ics`);
  }

  webcalUrlForYouth(youthId: string): string {
    return this.buildWebcalUrl(`youth-${this.slug(youthId)}.ics`);
  }

  webcalUrlForParent(parentId: string): string {
    return this.buildWebcalUrl(`parent-${this.slug(parentId)}.ics`);
  }

  webcalUrlForAll(): string {
    return this.buildWebcalUrl('all.ics');
  }

  /** Copia un texto al portapapeles. Devuelve true si tuvo éxito. */
  async copyToClipboard(text: string): Promise<boolean> {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      /* fallthrough */
    }
    // Fallback legacy
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'absolute';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }

  /* ───────────────────────── Construcción .ics ───────────────────────── */

  private buildCalendar(events: ScheduleEntry[], calendarName: string): string {
    const now = this.formatUtc(new Date());
    const lines: string[] = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      `PRODID:${CalendarService.PRODID}`,
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:${this.escape(calendarName)}`,
      `X-WR-CALDESC:${this.escape(this.t('calendar.calendar_description'))}`,
      'X-WR-TIMEZONE:Europe/Bucharest',
      'X-PUBLISHED-TTL:PT1H',
      'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
    ];
    for (const ev of events) {
      lines.push(...this.buildEvent(ev, now));
    }
    lines.push('END:VCALENDAR');
    return this.foldLines(lines).join('\r\n') + '\r\n';
  }

  private buildEvent(entry: ScheduleEntry, dtstamp: string): string[] {
    const times = getEntryTimes(entry);
    const start = this.combineDateAndTime(entry.date, times.youthsArrival);
    const end = this.combineDateAndTime(entry.date, times.programStart);
    // El evento debería abarcar desde llegada hasta el final estimado (programStart + 2h30).
    const realEnd = new Date(end.getTime() + CalendarService.DEFAULT_DURATION_MIN * 60_000);

    const uid = this.buildUid(entry);
    const summary = this.t('calendar.event_summary', { team: entry.team });
    const location = this.t('calendar.location_default');
    const description = this.buildDescription(entry, times);

    const lines = [
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART:${this.formatLocal(start)}`,
      `DTEND:${this.formatLocal(realEnd)}`,
      `SUMMARY:${this.escape(summary)}`,
      `LOCATION:${this.escape(location)}`,
      `DESCRIPTION:${this.escape(description)}`,
      `CATEGORIES:${this.escape(entry.team)}`,
      `STATUS:${entry.completed ? 'CONFIRMED' : 'TENTATIVE'}`,
      'TRANSP:OPAQUE',
      // Recordatorio 1 día antes a las 18:00 hora local — útil para no olvidar el servicio.
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${this.escape(summary)}`,
      'TRIGGER:-PT12H',
      'END:VALARM',
      'END:VEVENT',
    ];
    return lines;
  }

  private buildDescription(entry: ScheduleEntry, times: ReturnType<typeof getEntryTimes>): string {
    const parts: string[] = [];
    parts.push(`${this.t('calendar.field_program_type')}: ${entry.programType}`);
    parts.push(`${this.t('calendar.field_coordinator')}: ${entry.coordinator}`);
    parts.push(`${this.t('calendar.field_arrival')}: ${times.youthsArrival}`);
    parts.push(`${this.t('calendar.field_program_start')}: ${times.programStart}`);
    parts.push(`${this.t('calendar.field_food')}: ${times.parentsFoodArrival}`);
    parts.push(`${this.t('calendar.field_estimated')}: ${entry.estimatedPersons}`);
    if (entry.observations) {
      parts.push('');
      parts.push(`${this.t('calendar.field_notes')}: ${entry.observations}`);
    }
    return parts.join('\\n');
  }

  /* ────────────────────────────── Helpers ────────────────────────────── */

  private buildWebcalUrl(filename: string): string {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    // Reemplaza https:// o http:// por webcal://
    const noScheme = origin.replace(/^https?:\/\//i, '');
    return `webcal://${noScheme}/assets/calendars/${filename}`;
  }

  private buildUid(entry: ScheduleEntry): string {
    const dateKey = this.formatDateKey(entry.date);
    return `${this.slug(entry.team)}-${dateKey}@elim-admin`;
  }

  private fileNameForEvent(entry: ScheduleEntry): string {
    return this.slug(`${entry.team}-${this.formatDateKey(entry.date)}`) + '.ics';
  }

  private calendarTitleForEvent(entry: ScheduleEntry): string {
    return this.t('calendar.event_summary', { team: entry.team });
  }

  /** Combina una Date (cualquier hora) con "HH:mm" → Date local en ese día/hora. */
  private combineDateAndTime(date: Date, hhmm: string): Date {
    const [h, m] = hhmm.split(':').map(Number);
    const out = new Date(date);
    out.setHours(h, m, 0, 0);
    return out;
  }

  /** Formato local sin Z: YYYYMMDDTHHMMSS — el cliente lo interpreta en su tz. */
  private formatLocal(d: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return (
      d.getFullYear().toString() +
      pad(d.getMonth() + 1) +
      pad(d.getDate()) +
      'T' +
      pad(d.getHours()) +
      pad(d.getMinutes()) +
      pad(d.getSeconds())
    );
  }

  /** Formato UTC con Z: YYYYMMDDTHHMMSSZ — para DTSTAMP. */
  private formatUtc(d: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return (
      d.getUTCFullYear().toString() +
      pad(d.getUTCMonth() + 1) +
      pad(d.getUTCDate()) +
      'T' +
      pad(d.getUTCHours()) +
      pad(d.getUTCMinutes()) +
      pad(d.getUTCSeconds()) +
      'Z'
    );
  }

  private formatDateKey(d: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return d.getFullYear().toString() + pad(d.getMonth() + 1) + pad(d.getDate());
  }

  /** Escapa caracteres reservados en valores iCalendar. */
  private escape(text: string): string {
    return (text ?? '')
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\r?\n/g, '\\n');
  }

  /** Pliega líneas a 75 octetos (RFC 5545 §3.1). */
  private foldLines(lines: string[]): string[] {
    const out: string[] = [];
    for (const line of lines) {
      if (line.length <= 75) {
        out.push(line);
        continue;
      }
      let chunk = line.slice(0, 75);
      out.push(chunk);
      let rest = line.slice(75);
      while (rest.length > 74) {
        out.push(' ' + rest.slice(0, 74));
        rest = rest.slice(74);
      }
      if (rest.length > 0) out.push(' ' + rest);
    }
    return out;
  }

  private slug(text: string): string {
    return (text ?? '')
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private triggerDownload(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  private t(key: string, params?: Record<string, unknown>): string {
    const v = this.translate.instant(key, params);
    return typeof v === 'string' ? v : key;
  }
}
