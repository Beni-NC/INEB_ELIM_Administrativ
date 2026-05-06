import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { EventNotesService } from '../../core/services/event-notes.service';
import { formatDate } from '../../core/utils/date.utils';
import { getTeamColor, getTeamNumber } from '../../core/utils/team.utils';
import { getEntryTimes } from '../../core/models';

@Component({
  selector: 'app-event-notes-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TranslateModule],
  template: `
    @if (notes.openEntry(); as entry) {
      <div class="evnotes-backdrop" (click)="close()"></div>
      <div class="evnotes-dialog" role="dialog" aria-modal="true">
        <div class="evnotes-header"
             [style.background]="'linear-gradient(135deg, ' + teamColor() + ', ' + teamColor() + 'cc)'">
          <div class="evnotes-num">{{ teamNum() }}</div>
          <div class="evnotes-title">
            <span class="evnotes-team">{{ entry.team }}</span>
            <span class="evnotes-date">
              <span class="material-symbols-rounded">event</span>
              {{ format(entry.date) }}
            </span>
          </div>
          <button type="button" class="evnotes-close" (click)="close()" [attr.aria-label]="'common.close' | translate">
            <span class="material-symbols-rounded">close</span>
          </button>
        </div>
        <div class="evnotes-body">
          <div class="evnotes-meta">
            <span class="evnotes-pill">
              <span class="material-symbols-rounded">person</span>
              {{ entry.coordinator }}
            </span>
            <span class="evnotes-pill">
              <span class="material-symbols-rounded">restaurant</span>
              {{ entry.estimatedPersons }} {{ 'common.people' | translate }}
            </span>
            <span class="evnotes-pill">
              <span class="material-symbols-rounded">celebration</span>
              {{ entry.programType }}
            </span>
            <span class="evnotes-pill" [title]="'event_dialog.tooltip_program_start' | translate">
              <span class="material-symbols-rounded">event</span>
              {{ 'event_dialog.program' | translate }} {{ getEntryTimes(entry).programStart }}
            </span>
            <span class="evnotes-pill" [title]="'event_dialog.tooltip_youths_arrival' | translate">
              <span class="material-symbols-rounded">schedule</span>
              {{ 'event_dialog.youths_present' | translate }} {{ getEntryTimes(entry).youthsArrival }}
            </span>
            <span class="evnotes-pill parents" [title]="'event_dialog.tooltip_parents_food' | translate">
              <span class="material-symbols-rounded">restaurant_menu</span>
              {{ 'event_dialog.food' | translate }} {{ getEntryTimes(entry).parentsFoodArrival }}
            </span>
            @if (entry.completed) {
              <span class="evnotes-pill done">
                <span class="material-symbols-rounded">check_circle</span>
                {{ 'event_dialog.completed' | translate }}
              </span>
            }
          </div>

          @if (entry.observations) {
            <div class="evnotes-section">
              <div class="evnotes-label">
                <span class="material-symbols-rounded">sticky_note_2</span>
                {{ 'event_dialog.notes' | translate }}
              </div>
              <p class="evnotes-personal">{{ entry.observations }}</p>
            </div>
          } @else {
            <p class="evnotes-empty">{{ 'event_dialog.no_notes' | translate }}</p>
          }
        </div>
      </div>
    }
  `,
})
export class EventNotesDialogComponent {
  protected readonly notes = inject(EventNotesService);
  protected readonly format = formatDate;
  protected readonly getEntryTimes = getEntryTimes;

  teamColor = computed(() => {
    const e = this.notes.openEntry();
    return e ? getTeamColor(e.team) : '#1565c0';
  });
  teamNum = computed(() => {
    const e = this.notes.openEntry();
    return e ? getTeamNumber(e.team) : '';
  });

  close(): void { this.notes.close(); }
}
