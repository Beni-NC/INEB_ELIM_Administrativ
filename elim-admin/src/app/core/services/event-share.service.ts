import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DataService } from './data.service';
import { LanguageService } from './language.service';
import { ScheduleEntry } from '../models';
import { getEntryTimes } from '../utils/schedule.utils';
import { TAB_PATHS } from '../constants';

/**
 * "Trimite detaliile": compone el mensaje de una programación (fecha, equipo, coordinador, horas,
 * padres, observaciones y enlace al equipo) tal y como el coordinador lo escribe cada semana en el
 * grupo de WhatsApp del equipo, y lo abre en la hoja nativa de compartir; sin ella, en WhatsApp Web.
 */
@Injectable({ providedIn: 'root' })
export class EventShareService {
  private readonly data = inject(DataService);
  private readonly lang = inject(LanguageService);
  private readonly translate = inject(TranslateService);

  message(entry: ScheduleEntry): string {
    const t = (key: string, params?: Record<string, unknown>): string => this.translate.instant(key, params) as string;
    const times = getEntryTimes(entry);
    const date = new Intl.DateTimeFormat(this.lang.current(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(entry.date);
    const parents = this.data.getParentsForEvent(entry).map(p => p.name);
    const lines = [
      `*${t('event_share.title', { team: entry.team })}*`,
      `${date.charAt(0).toUpperCase()}${date.slice(1)}`,
      `${t('calendar.field_coordinator')}: ${this.data.getCoordinatorNameForEvent(entry)}`,
      `${t('schedule.youths_present')}: ${times.youthsArrival} · ${t('event.program')}: ${times.programStart} · ${t('schedule.parents_food')}: ${times.parentsFoodArrival}`,
      `${t('calendar.field_estimated')}: ${entry.estimatedPersons}`,
      parents.length > 0 ? `${t('schedule.support_parents')}: ${parents.join(', ')}` : t('event_share.no_parents'),
    ];
    if (entry.observations.trim()) lines.push(`${t('calendar.field_notes')}: ${entry.observations.trim()}`);
    lines.push('', this.teamUrl(entry.team));
    return lines.join('\n');
  }

  async share(entry: ScheduleEntry): Promise<void> {
    const text = this.message(entry);
    if (typeof navigator.share === 'function') {
      try { await navigator.share({ text }); return; } catch { /* cancelado por el usuario: nada que hacer */ return; }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  }

  /** Enlace profundo al equipo (se expande al abrirlo). */
  private teamUrl(team: string): string {
    const url = new URL(document.baseURI);
    url.pathname = url.pathname.replace(/\/?$/, '/') + TAB_PATHS.teams;
    url.hash = `team:${team}`;
    return url.href;
  }
}
