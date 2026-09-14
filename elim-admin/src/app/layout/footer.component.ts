import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, ElementRef, computed, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { DataService } from '../core/services/data.service';
import { DockOverlapService } from '../core/services/dock-overlap.service';
import { LanguageService } from '../core/services/language.service';
import { CONTACT } from '../core/contact.config';
import { APP_VERSION } from '../../version';
import { BrandLogoComponent } from '../shared/ui/brand-logo/brand-logo.component';
import { WhatsappButtonComponent } from '../shared/ui/whatsapp-button/whatsapp-button.component';
import { ShareButtonComponent } from '../shared/ui/share-button/share-button.component';

/**
 * Pie mínimo en banda navy (misma banda que MEDIA-ELIM), alineado con la columna de contenido y
 * con los logos como protagonistas: wordmark de la iglesia · dos líneas de texto (departamento /
 * iglesia © año + versión) · acciones compactas (volver arriba, WhatsApp, compartir) · crédito a INEB.
 *
 * La versión visible es el semver de package.json; el detalle técnico (build, revisión, fecha)
 * va en un tooltip al pasar el ratón o enfocar el chip, para no ensuciar el pie y seguir a un
 * gesto de distancia cuando alguien reporta una incidencia. Mientras el pie está en pantalla, el
 * dock flotante se esconde (repite las acciones y lo taparía).
 */
@Component({
  selector: 'app-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe, BrandLogoComponent, WhatsappButtonComponent, ShareButtonComponent],
  template: `
    <footer class="ui-footer">
      <div class="ui-footer__inner ui-container">
        <app-brand-logo tone="dark" [link]="null" />
        <div class="ui-footer__text">
          <span class="ui-footer__line ui-footer__line--strong">{{ 'footer.department' | translate }}</span>
          <span class="ui-footer__line">
            {{ 'footer.church' | translate }} &copy; {{ year }}
            <span class="ui-footer__version" tabindex="0" aria-describedby="footer-build"
                  [attr.aria-label]="'footer.version' | translate">
              v{{ v.release }}{{ v.dirty ? '+' : '' }}
              <span class="ui-footer__build" id="footer-build" role="tooltip">
                <span class="ui-footer__build-row"><span>{{ 'footer.version' | translate }}</span><b class="num">{{ v.release }}</b></span>
                <span class="ui-footer__build-row"><span>{{ 'footer.build' | translate }}</span><b class="num">{{ v.build }}</b></span>
                <span class="ui-footer__build-row"><span>{{ 'footer.commit' | translate }}</span><b class="num">{{ v.commit }}{{ v.dirty ? ' +' : '' }}</b></span>
                <span class="ui-footer__build-row"><span>{{ 'footer.built_at' | translate }}</span><b class="num">{{ builtAt() }}</b></span>
              </span>
            </span>
          </span>
        </div>
        <div class="ui-footer__actions">
          <button type="button" class="ui-btn ui-btn--on-dark ui-btn--icon" (click)="backToTop()"
                  [attr.aria-label]="'dock.back_to_top' | translate" [title]="'dock.back_to_top' | translate">
            <span class="icon" aria-hidden="true">arrow_upward</span>
          </button>
          <app-whatsapp-button [iconOnly]="true" [onDark]="true" [label]="'contact.label' | translate" [message]="'contact.message' | translate" />
          <app-share-button [iconOnly]="true" [onDark]="true" />
          <span class="ui-footer__sep" aria-hidden="true"></span>
          <a class="ui-footer__partner" [href]="contact.partnerUrl" target="_blank" rel="noopener noreferrer"
             [attr.aria-label]="'footer.partner' | translate" [title]="'footer.partner' | translate">
            <img src="assets/logo-ineb.png" alt="" width="128" height="40" loading="lazy" decoding="async">
          </a>
        </div>
      </div>
    </footer>
  `,
})
export class FooterComponent implements AfterViewInit {
  readonly year = inject(DataService).today.getFullYear();
  readonly v = APP_VERSION;
  readonly contact = CONTACT;
  private readonly lang = inject(LanguageService);
  private readonly overlap = inject(DockOverlapService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  /** Fecha de compilación en el idioma activo (día y hora). */
  readonly builtAt = computed(() =>
    new Intl.DateTimeFormat(this.lang.current(), { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      .format(new Date(APP_VERSION.builtAt)),
  );

  /** Igual que el del dock: quien llega al pie ya ha bajado toda la página. */
  backToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  ngAfterViewInit(): void {
    if (typeof IntersectionObserver === 'undefined') return;
    const obs = new IntersectionObserver(
      entries => { for (const e of entries) this.overlap.report('footer', e.isIntersecting); },
      { threshold: 0.3 },
    );
    obs.observe(this.host.nativeElement);
    this.destroyRef.onDestroy(() => { obs.disconnect(); this.overlap.report('footer', false); });
  }
}
