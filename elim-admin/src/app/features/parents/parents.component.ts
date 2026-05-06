import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatRippleModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { DataService } from '../../core/services/data.service';
import { NavigationService } from '../../core/services/navigation.service';
import { EventNotesService } from '../../core/services/event-notes.service';
import { ScheduleEntry, getEntryTimes } from '../../core/models';
import {
  formatDate, formatDateShort, formatJoinedDate, daysBetween, isSameDay,
} from '../../core/utils/date.utils';
import { getTeamColor, getTeamNumber } from '../../core/utils/team.utils';

@Component({
  selector: 'app-parents',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, MatButtonModule, MatCardModule, MatChipsModule,
    MatDividerModule, MatRippleModule, MatTooltipModule, TranslateModule,
  ],
  templateUrl: './parents.component.html',
})
export class ParentsComponent implements OnInit {
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

  getTooltipNames(people: {id: string, name: string}[]): string {
    return people.map(p => p.name).join(', ');
  }

  protected readonly formatDate = formatDate;
  protected readonly formatDateShort = formatDateShort;
  protected readonly formatJoinedDate = formatJoinedDate;
  protected readonly getTeamColor = getTeamColor;
  protected readonly getTeamNumber = getTeamNumber;
  protected readonly getEntryTimes = getEntryTimes;

  ngOnInit(): void {
    const id = this.nav.consumeExpanded('parent');
    if (id) {
      this.expanded.set(id);
      if (this.data.inactiveParents().some(p => p.id === id)) {
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
