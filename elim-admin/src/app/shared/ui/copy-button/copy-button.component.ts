import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Botón "copiar al portapapeles" con confirmación de dos segundos. Lo usa el panel `/admin` para
 * entregar las líneas ya formateadas de los ficheros de datos; el texto sigue visible en pantalla
 * por si el navegador no permite el portapapeles (contexto no seguro).
 */
@Component({
  selector: 'app-copy-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe],
  template: `
    <button type="button" class="ui-btn" [class.ui-btn--primary]="primary()" (click)="copy()" [disabled]="!text()">
      <svg class="icon" aria-hidden="true"><use [attr.href]="'assets/icons.svg#' + (copied() ? 'check' : 'content_copy')"/></svg>
      {{ (copied() ? 'admin.copied' : (label() || 'admin.copy')) | translate }}
    </button>
  `,
})
export class CopyButtonComponent {
  readonly text = input('');
  /** Clave i18n de la etiqueta; por defecto "Copiază". */
  readonly label = input('');
  readonly primary = input(false);
  protected readonly copied = signal(false);

  protected async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.text());
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    } catch { /* sin portapapeles: el texto sigue en pantalla para seleccionarlo a mano */ }
  }
}
