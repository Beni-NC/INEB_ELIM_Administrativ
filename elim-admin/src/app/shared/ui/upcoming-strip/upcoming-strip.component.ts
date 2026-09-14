import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { DataService } from '../../../core/services/data.service';
import { NavigationService } from '../../../core/services/navigation.service';
import { LDatePipe } from '../../../core/i18n/ldate.pipe';
import { getTeamColor, getTeamNumber } from '../../../core/utils/team.utils';

/**
 * Lo que viene, en una línea por programación: fecha, equipo y —en el modo `parents`— quién ayuda.
 *
 * Responde de un vistazo a la pregunta de siempre ("¿cuándo me toca?") sin bajar hasta la lista
 * larga, que sigue debajo con todo el detalle. Por eso es solo lectura y lo más densa posible: una
 * rejilla de líneas de 22 px donde cada nombre lleva a su ficha.
 */
@Component({
  selector: 'app-upcoming-strip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe, LDatePipe],
  template: `
    @if (rows().length > 0) {
      <div class="strip">
        <span class="ui-eyebrow">
          {{ (mode() === 'teams' ? 'schedule.strip_teams' : 'schedule.strip_parents') | translate }}
          <span class="ui-count">{{ rows().length }}</span>
        </span>
        <div class="strip__grid" [class.strip__grid--wide]="mode() === 'parents'">
          @for (r of rows(); track r.time) {
            <!-- La de la tarjeta de arriba se marca, para no perder el hilo entre una y otra. -->
            <div class="strip__item" [class.strip__item--next]="r.time === highlight()" [style.--team-color]="getTeamColor(r.team)">
              <span class="strip__date num">{{ r.date | ldate:'dayMonth' }}</span>
              <span class="ui-team-badge ui-team-badge--xs" [title]="r.team">{{ getTeamNumber(r.team) }}</span>
              @if (mode() === 'teams') {
                <button type="button" class="strip__link truncate" (click)="nav.goTo('team', r.team, $event)"
                        [title]="'schedule.view_team' | translate">{{ r.team }}</button>
              } @else if (r.parents.length > 0) {
                <span class="strip__names">
                  @for (p of r.parents; track p.id) {
                    @if (!$first) { <span class="strip__sep" aria-hidden="true">·</span> }
                    <button type="button" class="strip__link truncate" (click)="nav.goTo('parent', p.id, $event)"
                            [title]="'schedule.view_parent' | translate">{{ p.name }}</button>
                  }
                </span>
              } @else {
                <span class="faint truncate">{{ 'event.no_parents' | translate }}</span>
              }
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: `
    .strip {
      display: flex;
      flex-direction: column;
      gap: var(--sp-1);
      padding: var(--sp-2) var(--sp-3);
      border-top: 1px solid var(--c-border);
    }
    .strip .ui-eyebrow { display: flex; align-items: center; gap: var(--sp-1); }
    .strip__grid {
      display: grid;
      /* El nombre de un equipo es corto: caben muchas columnas. */
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 2px var(--sp-3);
      max-height: 164px;
      overflow-y: auto;
    }
    .strip__item {
      display: flex;
      align-items: center;
      gap: var(--sp-1);
      min-width: 0;
      padding: 1px 0 1px var(--sp-1);
      border-left: 2px solid transparent;
      font-size: var(--fs-sm);
      line-height: 1.6;
    }
    /* Dos nombres de padres necesitan 280 px para no cortarse; con menos, se cortan los dos. */
    .strip__grid--wide { grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); }
    .strip__item--next { border-left-color: var(--c-primary); }
    .strip__date { flex: 0 0 48px; color: var(--c-text-2); }
    .strip__names { display: flex; align-items: center; gap: 4px; min-width: 0; }
    .strip__sep { flex: 0 0 auto; color: var(--c-text-3); }
    /* Cada nombre se recorta por su cuenta: así su parte visible sigue siendo pulsable. */
    .strip__link {
      min-width: 0;
      padding: 0;
      border: 0;
      background: none;
      color: var(--c-text-2);
      font: inherit;
      cursor: pointer;
    }
    @media (hover: hover) { .strip__link:hover { color: var(--c-primary); text-decoration: underline; } }
  `,
})
export class UpcomingStripComponent {
  /** `teams`: a qué equipo le toca cada viernes. `parents`: quién ayuda cada viernes. */
  readonly mode = input<'teams' | 'parents'>('teams');
  /** Fecha (ms) que se marca como "la de la tarjeta": no siempre es la primera de la lista. */
  readonly highlight = input(0);

  private readonly data = inject(DataService);
  protected readonly nav = inject(NavigationService);
  protected readonly getTeamColor = getTeamColor;
  protected readonly getTeamNumber = getTeamNumber;

  protected readonly rows = computed(() => this.data.upcomingSchedule.map(entry => ({
    time: entry.date.getTime(),
    date: entry.date,
    team: entry.team,
    parents: this.mode() === 'parents' ? this.data.getParentsForEvent(entry) : [],
  })));
}
