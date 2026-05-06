import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CalendarService } from '../../../core/services/calendar.service';
import { ScheduleEntry } from '../../../core/models';

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

  private readonly cal = inject(CalendarService);
  private readonly snack = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);

  protected readonly lastWebcalUrl = signal<string | null>(null);

  protected readonly mode = computed<'event' | 'team' | 'youth' | 'none'>(() => {
    if (this.event()) return 'event';
    if (this.team()) return 'team';
    if (this.youthId()) return 'youth';
    return 'none';
  });

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
