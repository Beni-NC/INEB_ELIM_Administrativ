import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { PwaInstallService } from '../core/services/pwa-install.service';
import { DockOverlapService } from '../core/services/dock-overlap.service';
import { ShareButtonComponent } from '../shared/ui/share-button/share-button.component';
import { WhatsappButtonComponent } from '../shared/ui/whatsapp-button/whatsapp-button.component';

/**
 * Dock flotante abajo a la derecha (mismo patrón que MEDIA-ELIM): acciones que deben estar
 * siempre a un toque sin ocupar la cabecera.
 *  - WhatsApp: preguntas al responsable, con el mensaje ya empezado.
 *  - Compartir la aplicación.
 *  - Volver arriba: solo tras bajar más de 1,5 pantallas (antes es ruido).
 *
 * Se esconde mientras el footer o el bloque de contacto de Reguli están en pantalla (repiten sus
 * acciones y lo taparía) y se eleva sobre el banner de instalación.
 * Sin desplegable: con tres acciones como máximo, un toque extra solo esconde lo que se busca.
 */
@Component({
  selector: 'app-floating-dock',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe, ShareButtonComponent, WhatsappButtonComponent],
  template: `
    <div class="ui-dock" [class.ui-dock--hidden]="overlap.duplicateVisible()" [class.ui-dock--raised]="install.bannerVisible()"
         role="complementary" [attr.aria-label]="'dock.aria' | translate" [attr.aria-hidden]="overlap.duplicateVisible()">
      @if (scrolledFar()) {
        <button type="button" class="ui-btn ui-btn--ghost ui-btn--icon" (click)="backToTop()"
                [attr.aria-label]="'dock.back_to_top' | translate" [title]="'dock.back_to_top' | translate">
          <span class="icon" aria-hidden="true">arrow_upward</span>
        </button>
        <span class="ui-dock__sep" aria-hidden="true"></span>
      }
      <app-share-button [iconOnly]="true" />
      <app-whatsapp-button [iconOnly]="true" [label]="'contact.label' | translate" [message]="'contact.message' | translate" />
    </div>
  `,
  styles: [`
    :host { display: contents; }
    /* Deja sitio al banner de instalación (56 px + margen) cuando está visible. */
    .ui-dock--raised { bottom: calc(var(--sp-3) + 64px); }
  `],
})
export class FloatingDockComponent {
  protected readonly install = inject(PwaInstallService);
  protected readonly overlap = inject(DockOverlapService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly scrolledFar = signal(false);

  constructor() {
    // El scroll dispara cientos de eventos: la señal solo cambia al cruzar el umbral.
    const onScroll = (): void => {
      const far = window.scrollY > window.innerHeight * 1.5;
      if (far !== this.scrolledFar()) this.scrolledFar.set(far);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    this.destroyRef.onDestroy(() => window.removeEventListener('scroll', onScroll));
  }

  protected backToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
