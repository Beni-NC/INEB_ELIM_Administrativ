import { Pipe, PipeTransform, inject } from '@angular/core';
import { LanguageService } from '../services/language.service';

/**
 * Formatos de fecha de la app. Un solo vocabulario para todas las vistas:
 *  - `full`      → "Sâmbătă, 12 septembrie 2026"
 *  - `short`     → "12 sep 2026"
 *  - `dayMonth`  → "12 sep"
 *  - `monthYear` → "Septembrie 2026"
 *  - `dow`       → "SÂM"   (día de la semana abreviado)
 *  - `dowLetter` → "S"
 *  - `mon`       → "SEP"   (mes abreviado)
 *  - `year`      → "2026"
 */
export type LDateFormat = 'full' | 'short' | 'dayMonth' | 'monthYear' | 'dow' | 'dowLetter' | 'mon' | 'year';

/**
 * Formatea fechas con `Intl.DateTimeFormat` en el idioma activo.
 * Impuro a propósito: debe re-evaluarse al cambiar de idioma. El coste es un
 * `Map.get` + `format()` por celda; los formateadores se cachean por idioma.
 */
@Pipe({ name: 'ldate', standalone: true, pure: false })
export class LDatePipe implements PipeTransform {
  private readonly lang = inject(LanguageService);
  private static readonly cache = new Map<string, Intl.DateTimeFormat>();

  transform(value: Date | null | undefined, format: LDateFormat = 'short'): string {
    if (!value) return '';
    const locale = this.lang.current();
    switch (format) {
      case 'full':      return capitalize(this.fmt(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }, value));
      case 'short':     return `${value.getDate()} ${this.monthShort(locale, value)} ${value.getFullYear()}`;
      case 'dayMonth':  return `${value.getDate()} ${this.monthShort(locale, value)}`;
      case 'monthYear': return capitalize(this.fmt(locale, { month: 'long', year: 'numeric' }, value));
      case 'dow':       return stripDot(this.fmt(locale, { weekday: 'short' }, value)).toUpperCase();
      case 'dowLetter': return this.fmt(locale, { weekday: 'short' }, value).charAt(0).toUpperCase();
      case 'mon':       return this.monthShort(locale, value).toUpperCase();
      case 'year':      return String(value.getFullYear());
    }
  }

  /** Mes en 3 letras, sin el punto que añade Intl en rumano ("sept." → "sep"). */
  private monthShort(locale: string, d: Date): string {
    return stripDot(this.fmt(locale, { month: 'short' }, d)).slice(0, 3);
  }

  private fmt(locale: string, options: Intl.DateTimeFormatOptions, d: Date): string {
    const key = locale + JSON.stringify(options);
    let f = LDatePipe.cache.get(key);
    if (!f) {
      f = new Intl.DateTimeFormat(locale, options);
      LDatePipe.cache.set(key, f);
    }
    return f.format(d);
  }
}

function stripDot(s: string): string { return s.replace(/\./g, ''); }
function capitalize(s: string): string { return s.charAt(0).toUpperCase() + s.slice(1); }
