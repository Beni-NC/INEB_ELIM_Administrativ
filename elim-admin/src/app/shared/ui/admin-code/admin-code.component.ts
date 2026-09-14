import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { CopyButtonComponent } from '../copy-button/copy-button.component';

/**
 * Bloque de código generado por el panel `/admin`: el texto exacto que se pega en un fichero de
 * datos, con su botón de copiar. Se repite en todas las secciones, así que vive en un solo sitio.
 * Si no hay nada que generar (formulario vacío), no se pinta.
 */
@Component({
  selector: 'app-admin-code',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe, CopyButtonComponent],
  template: `
    @if (code()) {
      <div class="ui-card__body admin-code">
        @if (hint()) { <p class="admin-code__hint">{{ hint() | translate }}</p> }
        <pre class="ui-code">{{ code() }}</pre>
        <div class="admin-code__actions"><app-copy-button [text]="code()" [primary]="true" [label]="label()" /></div>
      </div>
    }
  `,
  styles: `
    .admin-code { display: flex; flex-direction: column; gap: var(--sp-2); border-top: 1px solid var(--c-border); }
    .admin-code__hint { margin: 0; font-size: var(--fs-sm); color: var(--c-text-2); }
    .admin-code__actions { display: flex; justify-content: flex-end; }
  `,
})
export class AdminCodeComponent {
  readonly code = input('');
  /** Clave i18n del botón de copiar. */
  readonly label = input('admin.copy_lines');
  /** Clave i18n de una frase de ayuda sobre qué hacer con el código. */
  readonly hint = input('');
}
