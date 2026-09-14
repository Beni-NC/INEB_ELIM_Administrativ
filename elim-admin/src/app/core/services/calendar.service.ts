import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ScheduleEntry } from '../models';
import { DataService } from './data.service';
import { IcsLabels, PARENT_ALARMS, buildIcs, icsFileNameForEvent, slug } from '../utils/ics.utils';
import {
  feedFileForAll, feedFileForParent, feedFileForTeam, feedFileForYouth, feedUrl,
} from '../utils/calendar-feeds';

/** Sobre qué se exporta o suscribe: un evento, un equipo, un joven o un padre. */
export type CalendarScope =
  | { kind: 'all' }
  | { kind: 'event'; entry: ScheduleEntry }
  | { kind: 'team'; team: string }
  | { kind: 'youth'; id: string; name: string }
  | { kind: 'parent'; id: string; name: string };

/**
 * Calendario: descarga puntual de un .ics generado en el navegador, y URL de suscripción a los
 * feeds publicados en `assets/calendars/` (los genera `scripts/generate-calendars.mjs` en cada
 * deploy, con los mismos nombres de `calendar-feeds.ts`). El .ics lo construye `ics.utils.ts`.
 */
@Injectable({ providedIn: 'root' })
export class CalendarService {
  private readonly data = inject(DataService);
  private readonly translate = inject(TranslateService);

  /** Programaciones futuras que cubre el ámbito (lo que se descarga). */
  upcomingEvents(scope: CalendarScope): ScheduleEntry[] {
    switch (scope.kind) {
      case 'all': return this.data.upcomingSchedule;
      case 'event': return [scope.entry];
      case 'team': return this.data.getUpcomingEventsForTeam(scope.team);
      case 'youth': return this.data.getUpcomingEventsForYouth(scope.id);
      case 'parent': return this.data.getUpcomingEventsForParent(scope.id);
    }
  }

  /** Descarga un .ics con las programaciones futuras del ámbito. */
  download(scope: CalendarScope): void {
    const events = this.upcomingEvents(scope);
    // Los padres reciben además un recordatorio 2 días antes (compras).
    const ics = buildIcs(events, this.labels(this.calendarName(scope)), new Date(), scope.kind === 'parent' ? PARENT_ALARMS : undefined);
    this.triggerDownload(ics, this.fileName(scope));
  }

  /**
   * URL https del feed de suscripción del ámbito. Para un evento suelto se suscribe al feed
   * de su equipo (un feed de un solo evento no tendría sentido).
   */
  subscriptionUrl(scope: CalendarScope): string {
    const file = scope.kind === 'all' ? feedFileForAll()
      : scope.kind === 'event' ? feedFileForTeam(scope.entry.team)
      : scope.kind === 'team' ? feedFileForTeam(scope.team)
        : scope.kind === 'youth' ? feedFileForYouth(scope.id)
          : feedFileForParent(scope.id);
    return feedUrl(window.location.origin, document.baseURI.replace(window.location.origin, ''), file);
  }

  /** Variante `webcal://` (Apple Calendar la abre directamente). */
  toWebcal(url: string): string {
    return url.replace(/^https?:\/\//i, 'webcal://');
  }

  /** Copia al portapapeles; false si el navegador no lo permite. */
  async copyToClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }

  private calendarName(scope: CalendarScope): string {
    switch (scope.kind) {
      case 'all': return this.t('calendar.calendar_description');
      case 'event': return this.t('calendar.event_summary', { team: scope.entry.team });
      case 'team': return this.t('calendar.team_calendar_name', { team: scope.team });
      case 'youth': return this.t('calendar.youth_calendar_name', { name: scope.name });
      case 'parent': return this.t('calendar.parent_calendar_name', { name: scope.name });
    }
  }

  private fileName(scope: CalendarScope): string {
    switch (scope.kind) {
      case 'all': return 'programari-tineret-elim.ics';
      case 'event': return icsFileNameForEvent(scope.entry);
      case 'team': return slug(`echipa-${scope.team}`) + '.ics';
      case 'youth': return slug(`${scope.name}-programari`) + '.ics';
      case 'parent': return slug(`${scope.name}-sprijin`) + '.ics';
    }
  }

  private labels(calendarName: string): IcsLabels {
    return {
      calendarName,
      description: this.t('calendar.calendar_description'),
      eventSummary: this.t('calendar.event_summary', { team: '{{team}}' }),
      location: this.t('calendar.location_default'),
      fieldProgramType: this.t('calendar.field_program_type'),
      fieldCoordinator: this.t('calendar.field_coordinator'),
      fieldArrival: this.t('calendar.field_arrival'),
      fieldProgramStart: this.t('calendar.field_program_start'),
      fieldFood: this.t('calendar.field_food'),
      fieldEstimated: this.t('calendar.field_estimated'),
      fieldNotes: this.t('calendar.field_notes'),
      programTypes: this.translate.instant('program_type') as Record<string, string>,
    };
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
