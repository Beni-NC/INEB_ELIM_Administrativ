import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { DataService } from '../core/services/data.service';
import { PwaInstallService } from '../core/services/pwa-install.service';
import { CONTACT } from '../core/contact.config';
import { APP_VERSION } from '../../version';
import { BrandLogoComponent } from '../shared/ui/brand-logo/brand-logo.component';
import { WhatsappButtonComponent } from '../shared/ui/whatsapp-button/whatsapp-button.component';
import { ShareButtonComponent } from '../shared/ui/share-button/share-button.component';

/**
 * Pie institucional en banda navy (mismo lenguaje que MEDIA-ELIM), en columnas: identidad ·
 * contacto (UN solo botón de WhatsApp para preguntas e implicarse; el dock flotante se oculta
 * aquí para no duplicarlo) · distribuir (compartir e instalar). Debajo, la franja legal con el
 * emblema del departamento, © + versión y el crédito a INEB. Es la única superficie oscura de la
 * app: los PNG del departamento y de INEB están diseñados para fondo oscuro y aquí se ven bien.
 */
@Component({
  selector: 'app-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe, BrandLogoComponent, WhatsappButtonComponent, ShareButtonComponent],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css',
})
export class FooterComponent {
  protected readonly install = inject(PwaInstallService);
  readonly year = inject(DataService).today.getFullYear();
  readonly version = APP_VERSION;
  readonly contact = CONTACT;
}
