import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { DataService } from '../../core/services/data.service';
import { NavigationService } from '../../core/services/navigation.service';
import { TeamComposition, Youth } from '../../core/models';
import { LDatePipe } from '../../core/i18n/ldate.pipe';
import { entryKey } from '../../core/utils/schedule.utils';
import { daysBetween } from '../../core/utils/date.utils';
import { getTeamColor, getTeamNumber } from '../../core/utils/team.utils';
import { EventRowComponent } from '../../shared/ui/event-row/event-row.component';
import { CalendarButtonComponent } from '../../shared/ui/calendar-button/calendar-button.component';

/** Echipe: lista de equipos activos con detalle expandible e histórico de composiciones. */
@Component({
    selector: 'app-teams',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [TranslatePipe, LDatePipe, EventRowComponent, CalendarButtonComponent],
    templateUrl: './teams.component.html',
    styleUrl: './teams.component.css'
})
export class TeamsComponent {
  protected readonly data = inject(DataService);
  protected readonly nav = inject(NavigationService);

  /** Equipo expandido: vive en NavigationService para que funcionen los enlaces cruzados. */
  readonly expanded = this.nav.expandedTeam;
  readonly expandedHistory = this.nav.expandedHistoryKey;
  /** El bloque de histórico se abre solo si hay una composición histórica pendiente de mostrar. */
  readonly showHistory = signal(this.expandedHistory() !== null);
  readonly historyOpen = computed(() => this.showHistory() || this.expandedHistory() !== null);
  /** Equipos / composiciones cuyo histórico de programaciones está desplegado. */
  readonly pastOpen = signal<Set<string>>(new Set());

  protected readonly entryKey = entryKey;
  protected readonly getTeamColor = getTeamColor;
  protected readonly getTeamNumber = getTeamNumber;

  toggle(team: TeamComposition): void { this.nav.toggle('team', team.teamName); }
  toggleHistory(hist: TeamComposition): void { this.nav.toggleHistory(hist.historyKey!); }

  togglePast(key: string): void {
    const next = new Set(this.pastOpen());
    if (next.has(key)) next.delete(key); else next.add(key);
    this.pastOpen.set(next);
  }
  isPastOpen(key: string): boolean { return this.pastOpen().has(key); }

  /** Miembros de una composición con el coordinador en primer lugar. */
  members(comp: TeamComposition): Youth[] {
    const coord = comp.coordinator;
    if (!coord) return comp.members;
    return [coord, ...comp.members.filter(y => y.id !== coord.id)];
  }

  historyEvents(hist: TeamComposition) { return this.data.getEventsForHistoryKey(hist.historyKey!); }

  daysUntil(date: Date): number { return daysBetween(date, this.data.today); }
}
