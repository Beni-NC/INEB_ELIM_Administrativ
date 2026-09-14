import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { DataService } from '../../../core/services/data.service';
import { NavigationService } from '../../../core/services/navigation.service';
import { ScheduleEntry, YouthRole } from '../../../core/models';
import { LDatePipe } from '../../../core/i18n/ldate.pipe';
import { getEntryTimes, hasNotes } from '../../../core/utils/schedule.utils';
import { daysBetween, isSameDay } from '../../../core/utils/date.utils';
import { getTeamColor, getTeamNumber } from '../../../core/utils/team.utils';
import { CalendarButtonComponent } from '../calendar-button/calendar-button.component';
import { EventShareButtonComponent } from '../event-share-button/event-share-button.component';

/**
 * Fila de programación, la misma en todos los contextos (Programare, detalle de equipo,
 * perfil de joven o padre). Se adapta con inputs en vez de duplicar el marcado:
 *  - `past`        → fila atenuada, sin horas ni countdown; marca de completado.
 *  - `showTeam`    → título = equipo (badge + nombre); si no, título = tipo de programa.
 *  - `showMonth`   → el bloque de fecha incluye el mes (listas no agrupadas por mes).
 *  - `role`        → estrella si la persona cuya lista se muestra coordinaba ese evento.
 *  - `linkTeam`    → la fila navega al equipo (o a su composición histórica si es pasada).
 *  - `showParents` → chips de padres de apoyo bajo la fila.
 */
@Component({
    selector: 'app-event-row',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgTemplateOutlet, TranslatePipe, LDatePipe, CalendarButtonComponent, EventShareButtonComponent],
    templateUrl: './event-row.component.html',
    styleUrl: './event-row.component.css'
})
export class EventRowComponent {
  readonly entry = input.required<ScheduleEntry>();
  readonly past = input(false);
  readonly showTeam = input(true);
  readonly showMonth = input(false);
  readonly showYear = input(false);
  readonly showParents = input(true);
  readonly showCalendar = input(true);
  readonly linkTeam = input(true);
  readonly role = input<YouthRole | null>(null);

  protected readonly data = inject(DataService);
  protected readonly nav = inject(NavigationService);

  protected readonly teamColor = computed(() => getTeamColor(this.entry().team));
  protected readonly teamNumber = computed(() => getTeamNumber(this.entry().team));
  protected readonly times = computed(() => getEntryTimes(this.entry()));
  protected readonly hasNote = computed(() => hasNotes(this.entry()));
  protected readonly parents = computed(() => (this.showParents() ? this.data.getParentsForEvent(this.entry()) : []));
  protected readonly coordinatorName = computed(() => this.data.getCoordinatorNameForEvent(this.entry()));
  protected readonly historical = computed(() => this.past() && this.data.isHistoricalEvent(this.entry()));
  protected readonly isToday = computed(() => isSameDay(this.entry().date, this.data.today));
  protected readonly daysUntil = computed(() => daysBetween(this.entry().date, this.data.today));
  protected readonly isThisWeek = computed(() => this.daysUntil() >= 0 && this.daysUntil() <= 7);
  /** La fila es un botón si lleva a algún sitio. */
  protected readonly clickable = computed(() => this.linkTeam() && (!this.past() || this.historical()));

  protected open(ev: Event): void {
    if (!this.clickable()) return;
    if (this.historical()) {
      const key = this.data.getHistoryKeyForEvent(this.entry());
      if (key) { this.nav.goToHistoricalTeam(key, ev); return; }
    }
    this.nav.goTo('team', this.entry().team, ev);
  }
}
