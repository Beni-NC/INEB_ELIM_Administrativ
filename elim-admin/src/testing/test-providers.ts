import { EnvironmentProviders, Provider, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { APP_DATA, APP_TODAY } from '../app/core/tokens';
import { DATA, TODAY } from './domain-fixture';
import { routes } from '../app/app.routes';

/**
 * Providers comunes de los tests de componente: zoneless, router real con las rutas de la app,
 * traducciones sin cargador (cada clave se muestra tal cual, así los tests comprueban claves y
 * no textos) y el dominio con el fixture y "hoy" fijados.
 */
export function testProviders(): (Provider | EnvironmentProviders)[] {
  return [
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideTranslateService({ fallbackLang: 'ro' }),
    { provide: APP_TODAY, useValue: TODAY },
    { provide: APP_DATA, useValue: DATA },
  ];
}
