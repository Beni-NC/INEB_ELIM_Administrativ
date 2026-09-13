import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { PwaInstallService } from '../core/services/pwa-install.service';

/** Barra "instala la aplicación": el estado (prompt nativo, iOS, aplazamiento) vive en `PwaInstallService`. */
@Component({
  selector: 'app-pwa-install-prompt',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe],
  template: `
    @if (install.bannerVisible()) {
      <div class="ui-banner" role="dialog" aria-live="polite">
        <img src="assets/logo_admin-trans-192.png" alt="" class="ui-banner__img" width="36" height="36">
        <div class="ui-banner__text">
          <strong>{{ 'pwa_install.title' | translate }}</strong>
          @if (install.isIos()) {
            <span class="ui-banner__hint">
              {{ 'pwa_install.ios_hint_1' | translate }}
              <!-- Icono "compartir" de iOS -->
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
                <path d="M12 2 7 7l1.4 1.4L11 5.8V16h2V5.8l2.6 2.6L17 7l-5-5zM5 20v-9h2v7h10v-7h2v9H5z"/>
              </svg>
              {{ 'pwa_install.ios_hint_2' | translate }}
            </span>
          } @else {
            <span class="ui-banner__hint">{{ 'pwa_install.android_hint' | translate }}</span>
          }
        </div>
        @if (!install.isIos()) {
          <button type="button" class="ui-btn ui-btn--primary" (click)="install.install()">
            {{ 'pwa_install.cta' | translate }}
          </button>
        }
        <button type="button" class="ui-btn ui-btn--ghost ui-btn--icon" (click)="install.dismissBanner()"
                [attr.aria-label]="'pwa_install.close' | translate">
          <span class="icon" aria-hidden="true">close</span>
        </button>
      </div>
    }
  `,
})
export class PwaInstallPromptComponent {
  protected readonly install = inject(PwaInstallService);
}
