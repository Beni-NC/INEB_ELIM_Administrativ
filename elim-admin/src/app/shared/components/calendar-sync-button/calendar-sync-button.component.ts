import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CalendarService } from '../../../core/services/calendar.service';
import { DataService } from '../../../core/services/data.service';
import { ScheduleEntry, getEntryTimes } from '../../../core/models';

/**
 * Botón compacto que abre un menú con las dos opciones de sincronización:
 *   1. Descarga .ics (puntual)
 *   2. Suscripción webcal (live)
 *
 * Se configura mediante uno (y sólo uno) de:
 *   - [event]    → exporta un único evento.
 *   - [team]     → exporta todas las próximas programaciones del equipo.
 *   - [youthId] + [youthName] → exporta las próximas programaciones del joven.
 */
@Component({
  selector: 'app-calendar-sync-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatButtonModule, MatMenuModule, MatTooltipModule, MatSnackBarModule, TranslateModule],
  template: `
    <button type="button"
            class="cal-sync-btn"
            [class.cal-sync-icon-only]="iconOnly()"
            [class.cal-sync-compact]="compact()"
            [matMenuTriggerFor]="syncMenu"
            [matTooltip]="('calendar.add_to_calendar' | translate)"
            (click)="$event.stopPropagation()"
            aria-label="Calendar sync">
      <span class="material-symbols-rounded cal-sync-icon">event_available</span>
      @if (!iconOnly()) {
        <span class="cal-sync-label">{{ 'calendar.add_to_calendar_short' | translate }}</span>
      }
    </button>
    <mat-menu #syncMenu="matMenu" xPosition="before" class="cal-sync-menu">
      <div class="cal-sync-menu-header" (click)="$event.stopPropagation()">
        <span class="material-symbols-rounded">sync_alt</span>
        <span>{{ 'calendar.sync_title' | translate }}</span>
      </div>
      <p class="cal-sync-menu-intro" (click)="$event.stopPropagation()">
        {{ 'calendar.sync_intro' | translate }}
      </p>

      <button mat-menu-item type="button" class="cal-sync-option" (click)="download(); $event.stopPropagation()">
        <span class="material-symbols-rounded cal-sync-opt-icon">download</span>
        <div class="cal-sync-opt-text">
          <span class="cal-sync-opt-title">{{ 'calendar.option_download_title' | translate }}</span>
          <span class="cal-sync-opt-desc">{{ 'calendar.option_download_desc' | translate }}</span>
        </div>
      </button>

      <!-- Preview de eventos que se añadirán al descargar -->
      <div class="cal-sync-preview" (click)="$event.stopPropagation()">
        <div class="cal-sync-preview-header">
          <span class="material-symbols-rounded">event_note</span>
          <span class="cal-sync-preview-title">{{ 'calendar.preview_download_title' | translate }}</span>
          <span class="cal-sync-preview-count">{{ downloadEvents().length }}</span>
        </div>
        @if (downloadEvents().length === 0) {
          <p class="cal-sync-preview-empty">{{ 'calendar.preview_empty' | translate }}</p>
        } @else {
          <ul class="cal-sync-preview-list">
            @for (ev of downloadEvents().slice(0, previewLimit); track ev.date.getTime() + '|' + ev.team) {
              <li class="cal-sync-preview-item">
                <span class="cal-sync-preview-date">{{ formatShortDate(ev.date) }}</span>
                <span class="cal-sync-preview-info">
                  <span class="cal-sync-preview-team">{{ ev.team }}</span>
                  <span class="cal-sync-preview-time">
                    <span class="material-symbols-rounded">schedule</span>
                    {{ getTime(ev) }}
                  </span>
                </span>
              </li>
            }
          </ul>
          @if (downloadEvents().length > previewLimit) {
            <p class="cal-sync-preview-more">
              {{ 'calendar.preview_more' | translate: { n: downloadEvents().length - previewLimit } }}
            </p>
          }
        }
      </div>

      <button mat-menu-item type="button" class="cal-sync-option" (click)="subscribe(); $event.stopPropagation()">
        <span class="material-symbols-rounded cal-sync-opt-icon">link</span>
        <div class="cal-sync-opt-text">
          <span class="cal-sync-opt-title">{{ 'calendar.option_subscribe_title' | translate }}</span>
          <span class="cal-sync-opt-desc">{{ 'calendar.option_subscribe_desc' | translate }}</span>
          @if (lastWebcalUrl(); as url) {
            <span class="cal-sync-opt-url" [title]="url">{{ url }}</span>
          }
        </div>
      </button>

      <!-- Preview de eventos que se sincronizarán por suscripción -->
      <div class="cal-sync-preview" (click)="$event.stopPropagation()">
        <div class="cal-sync-preview-header">
          <span class="material-symbols-rounded">autorenew</span>
          <span class="cal-sync-preview-title">{{ 'calendar.preview_subscribe_title' | translate }}</span>
          <span class="cal-sync-preview-count">{{ subscribeEvents().length }}</span>
        </div>
        @if (subscribeEvents().length === 0) {
          <p class="cal-sync-preview-empty">{{ 'calendar.preview_empty' | translate }}</p>
        } @else {
          <ul class="cal-sync-preview-list">
            @for (ev of subscribeEvents().slice(0, previewLimit); track ev.date.getTime() + '|' + ev.team) {
              <li class="cal-sync-preview-item">
                <span class="cal-sync-preview-date">{{ formatShortDate(ev.date) }}</span>
                <span class="cal-sync-preview-info">
                  <span class="cal-sync-preview-team">{{ ev.team }}</span>
                  <span class="cal-sync-preview-time">
                    <span class="material-symbols-rounded">schedule</span>
                    {{ getTime(ev) }}
                  </span>
                </span>
              </li>
            }
          </ul>
          @if (subscribeEvents().length > previewLimit) {
            <p class="cal-sync-preview-more">
              {{ 'calendar.preview_more' | translate: { n: subscribeEvents().length - previewLimit } }}
            </p>
          }
        }
      </div>

      <p class="cal-sync-menu-footer" (click)="$event.stopPropagation()">
        <span class="material-symbols-rounded">info</span>
        <span>{{ 'calendar.webcal_note' | translate }}</span>
      </p>
    </mat-menu>
  `,
})
export class CalendarSyncButtonComponent {
  readonly event = input<ScheduleEntry | null>(null);
  readonly team = input<string | null>(null);
  readonly youthId = input<string | null>(null);
  readonly youthName = input<string | null>(null);
  readonly iconOnly = input<boolean>(false);
  readonly compact = input<boolean>(false);

  protected readonly previewLimit = 5;

  private readonly cal = inject(CalendarService);
  private readonly data = inject(DataService);
  private readonly snack = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);

  protected readonly lastWebcalUrl = signal<string | null>(null);

  protected readonly mode = computed<'event' | 'team' | 'youth' | 'none'>(() => {
    if (this.event()) return 'event';
    if (this.team()) return 'team';
    if (this.youthId()) return 'youth';
    return 'none';
  });

  /** Eventos exactos que añadirá la opción "Descarga puntual". */
  protected readonly downloadEvents = computed<ScheduleEntry[]>(() => {
    switch (this.mode()) {
      case 'event': { const e = this.event(); return e ? [e] : []; }
      case 'team':  return this.data.getUpcomingEventsForTeam(this.team()!);
      case 'youth': return this.data.getUpcomingEventsForYouth(this.youthId()!);
      default: return [];
    }
  });

  /**
   * Eventos exactos que sincronizará la opción "Suscripción". Para un único
   * evento se suscribe al calendario del equipo (incluye todos los próximos).
   */
  protected readonly subscribeEvents = computed<ScheduleEntry[]>(() => {
    switch (this.mode()) {
      case 'event': { const e = this.event(); return e ? this.data.getUpcomingEventsForTeam(e.team) : []; }
      case 'team':  return this.data.getUpcomingEventsForTeam(this.team()!);
      case 'youth': return this.data.getUpcomingEventsForYouth(this.youthId()!);
      default: return [];
    }
  });

  protected getTime(ev: ScheduleEntry): string {
    return getEntryTimes(ev).programStart;
  }

  protected formatShortDate(d: Date): string {
    const days: string[] = this.translate.instant('days.short') ?? [];
    const months: string[] = this.translate.instant('months.short') ?? [];
    const dow = days[d.getDay()] ?? '';
    const mo = months[d.getMonth()] ?? '';
    return `${dow} ${d.getDate()} ${mo}`.trim();
  }

  protected download(): void {
    switch (this.mode()) {
      case 'event': this.cal.downloadEvent(this.event()!); break;
      case 'team':  this.cal.downloadTeam(this.team()!); break;
      case 'youth': this.cal.downloadYouth(this.youthId()!, this.youthName() ?? this.youthId()!); break;
    }
  }

  protected async subscribe(): Promise<void> {
    let url: string;
    switch (this.mode()) {
      case 'event':
      case 'team':  url = this.cal.webcalUrlForTeam(this.team() ?? this.event()!.team); break;
      case 'youth': url = this.cal.webcalUrlForYouth(this.youthId()!); break;
      default: return;
    }
    this.lastWebcalUrl.set(url);
    const ok = await this.cal.copyToClipboard(url);
    if (ok) {
      this.snack.open(this.translate.instant('calendar.copied'), '', { duration: 2200, panelClass: 'cal-snack' });
    }
    // En iOS/macOS abrir webcal:// dispara directamente Apple Calendar.
    try { window.location.href = url; } catch { /* noop */ }
  }
}
