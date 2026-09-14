import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DataService } from '../services/data.service';
import { daysBetween } from '../utils/date.utils';

/**
 * Cuenta atrás corta para badges: "Azi!" (hoy), "Mâine" (mañana) o "4z" (días). Impuro para
 * seguir al idioma activo, como `ldate`; el coste es una resta y una traducción por celda.
 */
@Pipe({ name: 'until', standalone: true, pure: false })
export class UntilPipe implements PipeTransform {
  private readonly data = inject(DataService);
  private readonly translate = inject(TranslateService);

  transform(date: Date | null | undefined): string {
    if (!date) return '';
    const days = daysBetween(date, this.data.today);
    if (days === 0) return this.translate.instant('common.today_excl') as string;
    if (days === 1) return this.translate.instant('common.tomorrow') as string;
    return `${days}${this.translate.instant('common.day_letter') as string}`;
  }
}
