import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

/** Idiomas soportados por la aplicación. */
export type AppLanguage = 'ro' | 'es';

const STORAGE_KEY = 'app.lang';
const DEFAULT_LANG: AppLanguage = 'ro';
const SUPPORTED: readonly AppLanguage[] = ['ro', 'es'];

/**
 * Idioma activo: inicializa ngx-translate, persiste la preferencia en localStorage y
 * expone la señal `current` de la que dependen el pipe `ldate` y los textos.
 */
@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly translate = inject(TranslateService);

  readonly current = signal<AppLanguage>(DEFAULT_LANG);
  readonly supported = SUPPORTED;

  init(): void {
    this.translate.addLangs([...SUPPORTED]);
    // El idioma de reserva (ro) lo fija `provideTranslateService` en app.config.
    this.use(this.readFromStorage() ?? DEFAULT_LANG);
  }

  use(lang: AppLanguage): void {
    if (!SUPPORTED.includes(lang)) lang = DEFAULT_LANG;
    this.translate.use(lang);
    this.current.set(lang);
    document.documentElement.lang = lang;
    this.writeToStorage(lang);
  }

  private readFromStorage(): AppLanguage | null {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      return v === 'ro' || v === 'es' ? v : null;
    } catch { return null; }
  }

  private writeToStorage(lang: AppLanguage): void {
    try { localStorage.setItem(STORAGE_KEY, lang); } catch { /* sin almacenamiento: no pasa nada */ }
  }
}
