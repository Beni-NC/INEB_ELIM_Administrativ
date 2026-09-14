import { Injectable, inject } from '@angular/core';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

/** Nombre corto de la app, igual que `short_name` del manifest. */
const APP_NAME = 'ELIM Tineret';

/**
 * Título del documento por pestaña ("Echipe · ELIM Tineret"): cada ruta declara la clave i18n
 * de su pestaña en `title`. Se vuelve a aplicar al cambiar de idioma.
 */
@Injectable({ providedIn: 'root' })
export class I18nTitleStrategy extends TitleStrategy {
  private readonly translate = inject(TranslateService);
  private lastKey: string | undefined;

  constructor() {
    super();
    this.translate.onLangChange.subscribe(() => this.apply());
  }

  override updateTitle(snapshot: RouterStateSnapshot): void {
    this.lastKey = this.buildTitle(snapshot);
    this.apply();
  }

  private apply(): void {
    const tab = this.lastKey ? this.translate.instant(this.lastKey) as string : '';
    document.title = tab && tab !== this.lastKey ? `${tab} · ${APP_NAME}` : APP_NAME;
  }
}
