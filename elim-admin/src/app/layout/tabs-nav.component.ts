import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { TAB_PATHS } from '../core/constants';

interface NavTab {
  path: string;
  icon: string;
  labelKey: string;
  exact: boolean;
}

/** Barra de pestañas enlazada al router (sticky). El contenido lo pinta `<router-outlet>`. */
@Component({
    selector: 'app-tabs-nav',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [RouterLink, RouterLinkActive, TranslatePipe],
    // El propio host es el elemento sticky: un sticky solo se pega dentro de su padre, y el
    // padre del host es <app-root>, que abarca toda la página.
    host: { class: 'ui-tabs' },
    template: `
    <nav class="ui-tabs__inner" [attr.aria-label]="'tabs.aria' | translate">
        @for (t of tabs; track t.path) {
          <a class="ui-tab"
             [routerLink]="['/' + t.path]"
             routerLinkActive="is-active"
             [routerLinkActiveOptions]="{ exact: t.exact }"
             ariaCurrentWhenActive="page">
            <span class="icon" aria-hidden="true">{{ t.icon }}</span>
            <span>{{ t.labelKey | translate }}</span>
          </a>
        }
    </nav>
  `
})
export class TabsNavComponent {
  readonly tabs: NavTab[] = [
    { path: TAB_PATHS.schedule, icon: 'calendar_month',  labelKey: 'tabs.schedule', exact: true },
    { path: TAB_PATHS.teams,    icon: 'groups',          labelKey: 'tabs.teams',    exact: false },
    { path: TAB_PATHS.youths,   icon: 'person',          labelKey: 'tabs.youths',   exact: false },
    { path: TAB_PATHS.parents,  icon: 'family_restroom', labelKey: 'tabs.parents',  exact: false },
    { path: TAB_PATHS.rules,    icon: 'menu_book',       labelKey: 'tabs.rules',    exact: false },
  ];
}
