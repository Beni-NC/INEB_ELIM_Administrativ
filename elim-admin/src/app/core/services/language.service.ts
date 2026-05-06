import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { localizedConstants } from '../i18n/localized-constants';

/** Idiomas soportados por la aplicación. */
export type AppLanguage = 'ro' | 'es';

const STORAGE_KEY = 'app.lang';
const DEFAULT_LANG: AppLanguage = 'ro';
const SUPPORTED: AppLanguage[] = ['ro', 'es'];

/**
 * Servicio centralizado de idioma:
 *  - Inicializa ngx-translate.
 *  - Lee/persiste el idioma activo en localStorage.
 *  - Si no hay preferencia guardada, usa rumano por defecto.
 *  - Sincroniza arrays de días/meses localizados (`localizedConstants`).
 */
@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly translate = inject(TranslateService);

  /** Señal reactiva con el idioma actualmente activo. */
  readonly current = signal<AppLanguage>(DEFAULT_LANG);

  readonly supported = SUPPORTED;

  init(): void {
    this.translate.addLangs(SUPPORTED);
    this.translate.setDefaultLang(DEFAULT_LANG);
    // Mantener `localizedConstants` siempre actualizadas con el idioma activo.
    this.translate.onLangChange.subscribe(() => this.refreshConstants());
    const saved = this.readFromStorage();
    this.use(saved ?? DEFAULT_LANG);
  }

  use(lang: AppLanguage): void {
    if (!SUPPORTED.includes(lang)) lang = DEFAULT_LANG;
    this.translate.use(lang).subscribe(() => this.refreshConstants());
    this.current.set(lang);
    this.writeToStorage(lang);
  }

  toggle(): void {
    this.use(this.current() === 'ro' ? 'es' : 'ro');
  }

  /** Vuelca los arrays de días/meses traducidos en el singleton compartido. */
  private refreshConstants(): void {
    const days = this.translate.instant('days');
    const months = this.translate.instant('months');
    if (days && Array.isArray(days.long)) {
      localizedConstants.DAYS_LONG = days.long;
      localizedConstants.DAYS_SHORT = days.short;
      localizedConstants.DAYS_LETTER = days.letter;
    }
    if (months && Array.isArray(months.long)) {
      localizedConstants.MONTHS_LONG = months.long;
      localizedConstants.MONTHS_LONG_LOWER = months.long_lower;
      localizedConstants.MONTHS_SHORT = months.short;
      localizedConstants.MONTHS_SHORT_UPPER = months.short_upper;
    }
  }

  private readFromStorage(): AppLanguage | null {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v === 'ro' || v === 'es') return v;
    } catch { /* ignore */ }
    return null;
  }

  private writeToStorage(lang: AppLanguage): void {
    try { localStorage.setItem(STORAGE_KEY, lang); } catch { /* ignore */ }
  }
}
