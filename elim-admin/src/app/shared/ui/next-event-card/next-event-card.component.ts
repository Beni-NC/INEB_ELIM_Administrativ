import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { DataService } from '../../../core/services/data.service';
import { NavigationService } from '../../../core/services/navigation.service';
import { ScheduleEntry } from '../../../core/models';
import { LDatePipe } from '../../../core/i18n/ldate.pipe';
import { getEntryTimes, hasNotes } from '../../../core/utils/schedule.utils';
import { daysBetween, isSameDay } from '../../../core/utils/date.utils';
import { getTeamColor, getTeamNumber } from '../../../core/utils/team.utils';
import { CalendarButtonComponent } from '../calendar-button/calendar-button.component';
import { EventShareButtonComponent } from '../event-share-button/event-share-button.component';

/**
 * Tarjeta destacada de una programación (el próximo evento en Programare, el próximo apoyo
 * en Părinți). Muestra fecha, equipo, coordinador, horas, countdown, equipo preparador y
 * padres de apoyo, con enlaces cruzados a cada entidad.
 */
@Component({
    selector: 'app-next-event-card',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [TranslatePipe, LDatePipe, CalendarButtonComponent, EventShareButtonComponent],
    templateUrl: './next-event-card.component.html',
    styleUrl: './next-event-card.component.css'
})
export class NextEventCardComponent {
  readonly entry = input.required<ScheduleEntry>();
  /** Clave i18n del título de la tarjeta. */
  readonly titleKey = input('schedule.next_event');
  /** Muestra la lista de jóvenes del equipo preparador. */
  readonly showRoster = input(true);

  protected readonly data = inject(DataService);
  protected readonly nav = inject(NavigationService);

  protected readonly teamColor = computed(() => getTeamColor(this.entry().team));
  protected readonly teamNumber = computed(() => getTeamNumber(this.entry().team));
  protected readonly times = computed(() => getEntryTimes(this.entry()));
  protected readonly hasNote = computed(() => hasNotes(this.entry()));
  protected readonly coordinator = computed(() => this.data.getCoordinatorForTeam(this.entry().team));
  protected readonly roster = computed(() => this.data.getYouthsForTeam(this.entry().team));
  protected readonly parents = computed(() => this.data.getParentsForEvent(this.entry()));
  protected readonly isToday = computed(() => isSameDay(this.entry().date, this.data.today));
  protected readonly daysUntil = computed(() => daysBetween(this.entry().date, this.data.today));
}
