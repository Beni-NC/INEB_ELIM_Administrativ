import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { CONTACT } from '../../../core/contact.config';
import { PwaInstallService } from '../../../core/services/pwa-install.service';
import { DockOverlapService } from '../../../core/services/dock-overlap.service';
import { WhatsappButtonComponent } from '../whatsapp-button/whatsapp-button.component';
import { ShareButtonComponent } from '../share-button/share-button.component';

/**
 * Bloque "Contact și ajutor": preguntas e implicación (WhatsApp con mensaje preescrito, teléfono)
 * y distribución de la app (compartir, instalar). Va al final de Reguli, que es donde se acaba
 * de leer cómo funciona todo y surgen las dudas. Mientras está en pantalla, el dock flotante se
 * esconde (`DockOverlapService`) porque ofrece las mismas acciones.
 */
@Component({
  selector: 'app-contact-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe, WhatsappButtonComponent, ShareButtonComponent],
  template: `
    <section class="ui-card" id="contact">
      <div class="ui-card__body contact">
        <div class="contact__col">
          <span class="ui-eyebrow">{{ 'contact.title' | translate }}</span>
          <p class="contact__text">{{ 'contact.text' | translate }}</p>
          <div class="contact__actions">
            <app-whatsapp-button [label]="'contact.label' | translate" [message]="'contact.message' | translate" />
            <a class="ui-link num" [href]="'tel:+' + contact.whatsappNumber">{{ contact.whatsappDisplay }}</a>
          </div>
        </div>
        <div class="contact__col">
          <span class="ui-eyebrow">{{ 'share.title' | translate }}</span>
          <p class="contact__text">{{ 'share.text' | translate }}</p>
          <div class="contact__actions">
            <app-share-button />
            @if (install.canInstall()) {
              <button type="button" class="ui-btn" (click)="install.install()">
                <span class="icon" aria-hidden="true">install_mobile</span>
                {{ 'pwa_install.cta_long' | translate }}
              </button>
            }
          </div>
          @if (install.isIos() && !install.isStandalone()) {
            <p class="contact__hint">{{ 'pwa_install.ios_footer_hint' | translate }}</p>
          }
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .contact { display: grid; grid-template-columns: minmax(0, 1fr); gap: var(--sp-4); }
    @media (min-width: 700px) { .contact { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--sp-6); } }
    .contact__col { display: flex; flex-direction: column; gap: var(--sp-2); min-width: 0; }
    .contact__text { font-size: var(--fs-sm); color: var(--c-text-2); line-height: 1.5; max-width: 40em; }
    .contact__hint { font-size: var(--fs-xs); color: var(--c-text-3); line-height: 1.4; }
    .contact__actions { display: flex; flex-wrap: wrap; align-items: center; gap: var(--sp-2) var(--sp-3); }
  `],
})
export class ContactCardComponent implements AfterViewInit {
  protected readonly install = inject(PwaInstallService);
  protected readonly contact = CONTACT;
  private readonly overlap = inject(DockOverlapService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  ngAfterViewInit(): void {
    if (typeof IntersectionObserver === 'undefined') return;
    const obs = new IntersectionObserver(
      entries => { for (const e of entries) this.overlap.report('contact', e.isIntersecting); },
      { threshold: 0.2 },
    );
    obs.observe(this.host.nativeElement);
    this.destroyRef.onDestroy(() => { obs.disconnect(); this.overlap.report('contact', false); });
  }
}
