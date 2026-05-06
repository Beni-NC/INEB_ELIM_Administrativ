import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { CalendarSyncButtonComponent } from '../../shared/components/calendar-sync-button/calendar-sync-button.component';
import { DataService } from '../../core/services/data.service';
import { NavigationService } from '../../core/services/navigation.service';
import { EventNotesService } from '../../core/services/event-notes.service';
import { ScheduleEntry } from '../../core/models';
import { formatDateShort, daysBetween } from '../../core/utils/date.utils';
import { getTeamColor, getTeamNumber } from '../../core/utils/team.utils';
import { AtmGalleryComponent } from '../../shared/components/atm-gallery/atm-gallery.component';
import { GalleryService } from '../../shared/components/atm-gallery/gallery.service';

@Component({
  selector: 'app-teams',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, MatCardModule, MatButtonModule,
    MatDividerModule, MatTooltipModule, TranslateModule,
    AtmGalleryComponent, CalendarSyncButtonComponent,
  ],
  templateUrl: './teams.component.html',
})
export class TeamsComponent implements OnInit {
  protected readonly data = inject(DataService);
  protected readonly nav = inject(NavigationService);
  protected readonly notes = inject(EventNotesService);
  protected readonly gallery = inject(GalleryService);

  readonly expandedTeam = signal<string | null>(null);
  readonly showHistory = signal(false);
  readonly pastEventsOpen = signal<Set<string>>(new Set());

  protected readonly formatDateShort = formatDateShort;
  protected readonly getTeamColor = getTeamColor;
  protected readonly getTeamNumber = getTeamNumber;

  ngOnInit(): void {
    const pending = this.nav.consumeExpanded('team');
    if (pending) this.expandedTeam.set(pending);
    /* Open history section if a historical-team navigation is pending. */
    const histKey = this.nav.consumeHistoryKey();
    if (histKey) this.showHistory.set(true);
  }

  toggle(name: string): void {
    this.expandedTeam.update(v => v === name ? null : name);
  }

  togglePastEvents(name: string, ev: Event): void {
    ev.stopPropagation();
    const next = new Set(this.pastEventsOpen());
    if (next.has(name)) next.delete(name); else next.add(name);
    this.pastEventsOpen.set(next);
  }
  isPastEventsOpen(name: string): boolean { return this.pastEventsOpen().has(name); }

  openNotes(entry: ScheduleEntry, ev: Event): void {
    ev.stopPropagation();
    this.notes.open(entry);
  }

  hasGalleryImages(teamName: string): boolean {
    return this.gallery.getByKeyGroup(teamName).length > 0;
  }

  /** Stable key matching the composition timeline (`<team>-<endTime>`). */
  historyKeyFor(hist: { name: string; endDate: Date }): string {
    return `${hist.name}-${hist.endDate.getTime()}`;
  }

  /** Coordinator Youth (if it exists in the youths catalogue) for a historical composition. */
  historyCoordinator(hist: { coordinator: string }) {
    return this.data.getYouthByName(hist.coordinator);
  }

  /** Past events linked to that exact historical composition (newest first). */
  pastEventsForHistory(hist: { name: string; endDate: Date }) {
    return this.data.getEventsForHistoryKey(this.historyKeyFor(hist));
  }

  daysUntil(date: Date): number { return daysBetween(date, this.data.today); }
}
