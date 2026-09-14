import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

/**
 * Traduce un contador eligiendo la forma correcta: `clave_one` cuando vale 1 y `clave` en el
 * resto. Sin esto salen cosas como "1 avertismente" o "acum 1 zile", que es justo lo que delata
 * una interfaz descuidada. Si la clave singular no existe, se usa la plural (no rompe nada).
 *
 * Impuro, como `ldate`: debe recalcularse al cambiar de idioma.
 */
@Pipe({ name: 'plural', standalone: true, pure: false })
export class PluralPipe implements PipeTransform {
  private readonly translate = inject(TranslateService);

  transform(value: number | null | undefined, key: string): string {
    const n = value ?? 0;
    if (n === 1) {
      const single = this.translate.instant(`${key}_one`, { n }) as string;
      if (single !== `${key}_one`) return single;
    }
    return this.translate.instant(key, { n }) as string;
  }
}
