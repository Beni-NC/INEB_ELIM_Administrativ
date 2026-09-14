import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TranslateLoader, TranslationObject } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import ro from '../../../assets/i18n/ro.json';

/**
 * Rumano (idioma por defecto) va dentro del bundle: la primera pantalla se pinta en cuanto arranca
 * Angular, sin esperar a otra petición de red. Medido con Lighthouse en móvil lento, esa espera
 * era la mayor parte del LCP (~9 s). El resto de idiomas se sigue cargando por HTTP desde
 * assets/i18n/ solo cuando se eligen. El JSON de rumano sigue en assets/ porque también lo leen
 * los scripts de Node (feeds de calendario).
 */
@Injectable({ providedIn: 'root' })
export class BundledTranslateLoader implements TranslateLoader {
  private readonly http = inject(HttpClient);

  getTranslation(lang: string): Observable<TranslationObject> {
    if (lang === 'ro') return of(ro as TranslationObject);
    return this.http.get<TranslationObject>(`assets/i18n/${lang}.json`);
  }
}
