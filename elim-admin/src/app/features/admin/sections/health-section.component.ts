import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { PluralPipe } from '../../../core/i18n/plural.pipe';
import { AdminDataService } from '../admin-data.service';
import { checkDomainData, errorsOf, warningsOf } from '../../../core/domain/data-health';

/**
 * Estado de los datos: las mismas comprobaciones que corren en cada build (`npm test`), pero con
 * el detalle de cada caso para poder arreglarlo. Rojo = la app mostrará algo mal; ámbar = falta
 * planificación o es una errata probable.
 */
@Component({
  selector: 'app-admin-health-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe, PluralPipe],
  template: `
    <section class="ui-section">
      <div class="ui-card">
        <header class="ui-card__header">
          <h3 class="ui-card__title">{{ 'admin.health_title' | translate }}</h3>
          @if (errors().length > 0) {
            <span class="ui-badge ui-badge--danger">{{ errors().length | plural:'admin.health_errors' }}</span>
          }
          @if (warnings().length > 0) {
            <span class="ui-badge ui-badge--warning">{{ warnings().length | plural:'admin.health_warnings' }}</span>
          }
        </header>
        <p class="ui-card__desc">{{ 'admin.health_desc' | translate }}</p>

        @if (issues().length === 0) {
          <div class="ui-empty">
            <svg class="icon" aria-hidden="true"><use href="assets/icons.svg#check_circle"/></svg>
            <span>{{ 'admin.health_ok' | translate }}</span>
          </div>
        } @else {
          <div class="ui-list">
            @for (issue of issues(); track issue.id) {
              <div class="ui-row issue" [class.issue--error]="issue.level === 'error'">
                <div class="ui-row__lead">
                  <svg class="icon" aria-hidden="true"><use [attr.href]="'assets/icons.svg#' + (issue.level === 'error' ? 'error' : 'warning')"/></svg>
                </div>
                <div class="ui-row__main">
                  <span class="ui-row__title"><span class="truncate">{{ ('admin.health.' + issue.id) | translate }}</span></span>
                  <span class="ui-row__meta issue__items">{{ issue.items.join(' · ') }}</span>
                </div>
                <div class="ui-row__trail"><span class="ui-badge num">{{ issue.items.length }}</span></div>
              </div>
            }
          </div>
        }
      </div>
    </section>
  `,
  styles: `
    :host { display: block; }
    .issue .icon { color: var(--c-warning); }
    .issue--error .icon { color: var(--c-danger); }
    .issue__items { white-space: normal; font-size: var(--fs-sm); }
  `,
})
export class HealthSectionComponent {
  private readonly admin = inject(AdminDataService);

  private readonly all = computed(() => checkDomainData(this.admin.raw, this.admin.data.today));
  readonly errors = computed(() => errorsOf(this.all()));
  readonly warnings = computed(() => warningsOf(this.all()));
  /** Primero lo que rompe la app, después lo que solo conviene mirar. */
  readonly issues = computed(() => [...this.errors(), ...this.warnings()]);
}
