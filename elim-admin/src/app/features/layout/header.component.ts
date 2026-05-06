import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { DataService } from '../../core/services/data.service';
import { LanguageService, AppLanguage } from '../../core/services/language.service';
import { formatDate, getMonthShort, getWeekdayShort } from '../../core/utils/date.utils';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, MatToolbarModule, MatTooltipModule, MatMenuModule, MatButtonModule, TranslateModule],
  template: `
    <mat-toolbar class="header-toolbar" color="primary">
      <div class="header-content">
        <div class="header-top">
          <a routerLink="/" class="logo-group-link" [attr.aria-label]="'common.back_to_main' | translate">
            <div class="logo-frame">
              <img src="assets/logo-elim.png" alt="Logo Biserica ELIM" class="header-logo">
            </div>
            <div class="logo-frame">
              <img src="assets/logo_admin-192.png" alt="Logo Departament Administrativ" class="header-logo">
            </div>
            <div class="header-divider" aria-hidden="true"></div>
            <div class="header-text">
              <h1 class="church-name">{{ 'header.title' | translate }}</h1>
              <p class="header-tagline">
                <span class="material-symbols-rounded tagline-icon">restaurant</span>
                {{ 'header.subtitle' | translate }}
              </p>
            </div>
          </a>
          <div class="header-right">
            <button type="button"
                    class="header-lang-btn"
                    [matTooltip]="'header.lang_label' | translate"
                    [matMenuTriggerFor]="langMenu"
                    aria-label="Language">
              <span class="header-lang-flag" [innerHTML]="langSvg()"></span>
              <span class="header-lang-code">{{ langCode().toUpperCase() }}</span>
              <span class="material-symbols-rounded header-lang-caret">expand_more</span>
            </button>
            <mat-menu #langMenu="matMenu" xPosition="before" class="lang-menu">
              <button mat-menu-item type="button" class="lang-menu-item" (click)="setLang('ro')" [class.active]="langCode() === 'ro'">
                <span class="header-lang-flag" [innerHTML]="roSvg"></span>
                <span class="lang-text">Română</span>
              </button>
              <button mat-menu-item type="button" class="lang-menu-item" (click)="setLang('es')" [class.active]="langCode() === 'es'">
                <span class="header-lang-flag" [innerHTML]="esSvg"></span>
                <span class="lang-text">Español</span>
              </button>
            </mat-menu>
            <div class="header-today" [matTooltip]="todayTooltip()">
              <div class="header-today-text">
                <span class="header-today-dow">{{ wd() }}</span>
                <span class="header-today-day">{{ today.getDate() }}</span>
                <span class="header-today-mo">{{ mo() }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="header-accent-bar" aria-hidden="true"></div>
    </mat-toolbar>
  `,
})
export class HeaderComponent {
  private readonly data = inject(DataService);
  private readonly lang = inject(LanguageService);
  private readonly translate = inject(TranslateService);
  private readonly sanitizer = inject(DomSanitizer);

  private readonly roSvgRaw = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 2"><rect width="3" height="2" fill="#002B7F"/><rect width="2" height="2" x="1" fill="#FCD116"/><rect width="1" height="2" x="2" fill="#CE1126"/></svg>`;
  private readonly esSvgRaw = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 2"><rect width="3" height="2" fill="#c60b1e"/><rect width="3" height="1" y="0.5" fill="#ffc400"/></svg>`;

  readonly roSvg: SafeHtml = this.sanitizer.bypassSecurityTrustHtml(this.roSvgRaw);
  readonly esSvg: SafeHtml = this.sanitizer.bypassSecurityTrustHtml(this.esSvgRaw);

  /** Señal que se actualiza con cada `LangChangeEvent`. */
  private readonly langChange = toSignal(this.translate.onLangChange, { initialValue: null });

  readonly today = this.data.today;
  readonly langCode = this.lang.current;

  readonly wd = computed(() => { this.langChange(); return getWeekdayShort(this.today); });
  readonly mo = computed(() => { this.langChange(); return getMonthShort(this.today); });
  readonly todayLabel = computed(() => { this.langChange(); return formatDate(this.today); });
  readonly todayTooltip = computed(() => `${this.translate.instant('common.today')}: ${this.todayLabel()}`);

  readonly langSvg = computed(() => this.langCode() === 'es' ? this.esSvg : this.roSvg);

  setLang(l: AppLanguage): void { this.lang.use(l); }
}
