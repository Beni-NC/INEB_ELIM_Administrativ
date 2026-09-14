import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { DataService } from '../../core/services/data.service';
import { NavigationService } from '../../core/services/navigation.service';
import { LDatePipe } from '../../core/i18n/ldate.pipe';
import { entryKey } from '../../core/utils/schedule.utils';
import { MyTeamService } from '../../core/services/my-team.service';
import { UntilPipe } from '../../core/i18n/until.pipe';
import { getTeamColor, getTeamNumber } from '../../core/utils/team.utils';
import { EventRowComponent } from '../../shared/ui/event-row/event-row.component';
import { NextEventCardComponent } from '../../shared/ui/next-event-card/next-event-card.component';
import { CalendarButtonComponent } from '../../shared/ui/calendar-button/calendar-button.component';

/** Programare: KPIs, próximo evento, próximas por mes, resumen de coordinadores e histórico. */
@Component({
    selector: 'app-schedule',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [TranslatePipe, LDatePipe, UntilPipe, EventRowComponent, NextEventCardComponent, CalendarButtonComponent],
    templateUrl: './schedule.component.html',
    styleUrl: './schedule.component.css'
})
export class ScheduleComponent {
  protected readonly data = inject(DataService);
  protected readonly nav = inject(NavigationService);
  protected readonly myTeam = inject(MyTeamService);

  readonly showPast = signal(false);
  /** Los 8 coordinadores con más programaciones dirigidas. */
  readonly topCoordinators = this.data.coordinatorRotations.slice(0, 8);

  protected readonly entryKey = entryKey;
  protected readonly getTeamColor = getTeamColor;
  protected readonly getTeamNumber = getTeamNumber;

  print(): void { window.print(); }

  /** Fecha representativa de un grupo mensual, para formatearla con `ldate`. */
  monthDate(group: { year: number; month: number }): Date {
    return new Date(group.year, group.month, 1);
  }

  goToCoordinator(name: string): void {
    const y = this.data.getYouthByName(name);
    if (y) this.nav.goTo('youth', y.id);
  }
}
