import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { DataService } from '../core/services/data.service';
import { AppLanguage, LanguageService } from '../core/services/language.service';
import { LDatePipe } from '../core/i18n/ldate.pipe';
import { ThemeService } from '../core/services/theme.service';
import { BrandLogoComponent } from '../shared/ui/brand-logo/brand-logo.component';

/** Cabecera: wordmark de la iglesia + nombre del departamento, fecha de hoy, idioma y tema (claro/oscuro manual). */
@Component({
    selector: 'app-header',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [RouterLink, TranslatePipe, LDatePipe, BrandLogoComponent],
    template: `
    <header class="ui-header">
      <app-brand-logo size="sm" tone="light" link="/" />
      <span class="ui-header__divider" aria-hidden="true"></span>
      <a routerLink="/" class="ui-header__brand" [attr.aria-label]="'common.back_to_main' | translate">
        <div class="ui-header__text">
          <h1 class="ui-header__title">{{ 'header.title' | translate }}</h1>
          <span class="ui-header__subtitle">{{ 'header.subtitle' | translate }}</span>
        </div>
      </a>
      <div class="ui-header__right">
        <span class="ui-header__today num" [title]="('common.today' | translate) + ': ' + (today | ldate:'full')">
          {{ today | ldate:'dow' }} {{ today.getDate() }} {{ today | ldate:'mon' }}
        </span>
        <div class="ui-segmented" role="group" [attr.aria-label]="'header.lang_label' | translate">
          @for (l of lang.supported; track l) {
            <button type="button" class="ui-segmented__btn"
                    [attr.aria-pressed]="lang.current() === l"
                    (click)="setLang(l)">{{ l.toUpperCase() }}</button>
          }
        </div>
        <button type="button" class="ui-btn ui-btn--ghost ui-btn--icon" (click)="theme.toggle()"
                [attr.aria-pressed]="theme.current() === 'dark'"
                [attr.aria-label]="(theme.current() === 'dark' ? 'theme.light' : 'theme.dark') | translate"
                [title]="(theme.current() === 'dark' ? 'theme.light' : 'theme.dark') | translate">
          <span class="icon" aria-hidden="true">{{ theme.current() === 'dark' ? 'light_mode' : 'dark_mode' }}</span>
        </button>
      </div>
    </header>
  `
})
export class HeaderComponent {
  protected readonly lang = inject(LanguageService);
  protected readonly theme = inject(ThemeService);
  readonly today = inject(DataService).today;

  setLang(l: AppLanguage): void { this.lang.use(l); }
}
