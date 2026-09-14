import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { DataService } from '../../core/services/data.service';
import { NavigationService } from '../../core/services/navigation.service';
import { ScheduleEntry, Youth, YouthFilter, YouthRole } from '../../core/models';
import { LDatePipe } from '../../core/i18n/ldate.pipe';
import { entryKey } from '../../core/utils/schedule.utils';
import { daysBetween, isSameDay } from '../../core/utils/date.utils';
import { getTeamColor, getTeamNumber } from '../../core/utils/team.utils';
import { EventRowComponent } from '../../shared/ui/event-row/event-row.component';
import { CalendarButtonComponent } from '../../shared/ui/calendar-button/calendar-button.component';
import { MyTeamService } from '../../core/services/my-team.service';
import { UntilPipe } from '../../core/i18n/until.pipe';

/** Tineri: directorio con búsqueda y filtro, perfil expandible en línea y archivo de antiguos miembros. */
@Component({
    selector: 'app-youths',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgTemplateOutlet, FormsModule, TranslatePipe, LDatePipe, UntilPipe, EventRowComponent, CalendarButtonComponent],
    templateUrl: './youths.component.html',
    styleUrl: './youths.component.css'
})
export class YouthsComponent {
  protected readonly data = inject(DataService);
  protected readonly nav = inject(NavigationService);
  protected readonly myTeam = inject(MyTeamService);

  readonly expanded = this.nav.expandedYouthId;
  /** Filtro "echipa mea" (solo existe si el usuario marcó su equipo en Echipe). */
  readonly onlyMine = signal(false);
  /** Búsqueda + filtro de rol (DataService) + filtro "echipa mea" (aquí: DataService no conoce al usuario). */
  readonly visibleYouths = computed<Youth[]>(() => {
    const list = this.data.filteredYouths();
    const mine = this.myTeam.team();
    if (!this.onlyMine() || !mine) return list;
    return list.filter(y => this.data.getActiveTeamsForYouth(y.id).some(t => t.teamName === mine));
  });
  /** "Membru din" solo aporta algo cuando no todos entraron el mismo año (hoy, el de arranque del departamento). */
  readonly showJoinedYear = new Set(this.data.youths.map(y => y.joinedYear)).size > 1;
  readonly showArchived = signal(false);
  /** El archivo se abre solo si el joven expandido (por enlace cruzado) está archivado. */
  readonly archivedOpen = computed(() => {
    const id = this.expanded();
    return this.showArchived() || (!!id && this.data.inactiveYouths.some(y => y.id === id));
  });
  readonly pastOpen = signal<Set<string>>(new Set());

  readonly filters: YouthFilter[] = ['toti', 'coordonatori', 'membri'];

  protected readonly entryKey = entryKey;
  protected readonly getTeamColor = getTeamColor;
  protected readonly getTeamNumber = getTeamNumber;

  toggle(y: Youth): void { this.nav.toggle('youth', y.id); }

  togglePast(id: string): void {
    const next = new Set(this.pastOpen());
    if (next.has(id)) next.delete(id); else next.add(id);
    this.pastOpen.set(next);
  }
  isPastOpen(id: string): boolean { return this.pastOpen().has(id); }

  /**
   * Equipos activos del joven con su próxima programación ya resuelta. Se precalcula aquí
   * porque un alias `@if (...; as x)` anidado dentro de `@for` en un `ng-template` falla en
   * tiempo de ejecución con Angular 17 ("tmp_x_0 is not defined").
   */
  activeTeams(y: Youth): Array<{ teamName: string; role: YouthRole; next?: ScheduleEntry }> {
    return this.data.getActiveTeamsForYouth(y.id).map(t => ({ ...t, next: this.data.getNextEventForTeam(t.teamName) }));
  }

  /**
   * Clave de `track` para equipos anteriores (un joven puede haber pasado dos veces por el
   * mismo equipo). Va en un método porque el compilador de Angular 17 no soporta `?.`/`??`
   * dentro de la expresión `track`.
   */
  historyTrack(h: { teamName: string; endDate?: Date }): string {
    return h.teamName + '|' + (h.endDate ? h.endDate.getTime() : 0);
  }

  /** Rol del joven en el equipo de una programación futura (estrella si la coordina). */
  roleFor(y: Youth, team: string): YouthRole | null {
    const t = this.data.getActiveTeamsForYouth(y.id).find(x => x.teamName === team);
    return t ? t.role : null;
  }

  daysUntil(date: Date): number { return daysBetween(date, this.data.today); }
  isToday(date: Date): boolean { return isSameDay(date, this.data.today); }
}
