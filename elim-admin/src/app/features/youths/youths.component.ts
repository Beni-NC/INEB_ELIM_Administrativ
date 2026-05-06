import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatRippleModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { CalendarSyncButtonComponent } from '../../shared/components/calendar-sync-button/calendar-sync-button.component';
import { DataService } from '../../core/services/data.service';
import { NavigationService } from '../../core/services/navigation.service';
import { EventNotesService } from '../../core/services/event-notes.service';
import { ScheduleEntry } from '../../core/models';
import { formatDate, formatDateShort, daysBetween, isSameDay } from '../../core/utils/date.utils';
import { getTeamColor, getTeamNumber } from '../../core/utils/team.utils';

@Component({
  selector: 'app-youths',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule, MatButtonModule, MatCardModule, MatChipsModule,
    MatDividerModule, MatIconModule, MatRippleModule, MatTooltipModule, TranslateModule,
    CalendarSyncButtonComponent,
  ],
  templateUrl: './youths.component.html',
})
export class YouthsComponent implements OnInit {
  protected readonly data = inject(DataService);
  protected readonly nav = inject(NavigationService);
  protected readonly notes = inject(EventNotesService);

  readonly expanded = signal<string | null>(null);
  readonly showArchived = signal(false);
  readonly pastEventsOpen = signal<Set<string>>(new Set());

  togglePastEvents(id: string, ev: Event): void {
    ev.stopPropagation();
    const next = new Set(this.pastEventsOpen());
    if (next.has(id)) next.delete(id); else next.add(id);
    this.pastEventsOpen.set(next);
  }
  isPastEventsOpen(id: string): boolean { return this.pastEventsOpen().has(id); }

  openNotes(entry: ScheduleEntry, ev: Event): void {
    ev.stopPropagation();
    this.notes.open(entry);
  }

  /** Echipe la care părintele a sprijinit programări coincidente cu echipele active ale tânărului. */
  getInvolvedTeams(youthId: string, parentId: string): string[] {
    const youthTeams = new Set(
      this.data.getActiveTeamsForYouth(youthId).map(t => t.teamName)
    );
    if (youthTeams.size === 0) return [];
    const parentEventTeams = new Set<string>([
      ...this.data.getUpcomingEventsForParent(parentId).map(e => e.team),
      ...this.data.getPastEventsForParent(parentId).map(e => e.team),
    ]);
    return [...parentEventTeams].filter(t => youthTeams.has(t));
  }

  protected readonly formatDate = formatDate;
  protected readonly formatDateShort = formatDateShort;
  protected readonly getTeamColor = getTeamColor;
  protected readonly getTeamNumber = getTeamNumber;

  ngOnInit(): void {
    const id = this.nav.consumeExpanded('youth');
    if (id) {
      this.expanded.set(id);
      if (this.data.inactiveYouths().some(y => y.id === id)) {
        this.showArchived.set(true);
      }
    }
  }

  toggle(id: string): void {
    this.expanded.update(v => v === id ? null : id);
  }

  daysUntil(date: Date): number { return daysBetween(date, this.data.today); }
  isToday(date: Date): boolean { return isSameDay(date, this.data.today); }
}
