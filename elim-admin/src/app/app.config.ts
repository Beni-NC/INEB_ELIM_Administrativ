import { ApplicationConfig, inject, isDevMode, provideAppInitializer, provideZonelessChangeDetection } from '@angular/core';
import { PreloadAllModules, provideRouter, withInMemoryScrolling, withPreloading } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { provideHttpClient } from '@angular/common/http';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { routes } from './app.routes';
import { LanguageService } from './core/services/language.service';
import { ThemeService } from './core/services/theme.service';
import { PwaInstallService } from './core/services/pwa-install.service';

export const appConfig: ApplicationConfig = {
  providers: [
    // Sin zone.js: todos los componentes son OnPush y el estado vive en signals.
    provideZonelessChangeDetection(),
    provideHttpClient(),
    provideTranslateService({
      fallbackLang: 'ro',
      loader: provideTranslateHttpLoader({ prefix: 'assets/i18n/', suffix: '.json' }),
    }),
    provideAppInitializer(() => inject(LanguageService).init()),
    provideAppInitializer(() => inject(ThemeService).init()),
    provideAppInitializer(() => inject(PwaInstallService).init()),
    provideRouter(
      routes,
      withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' }),
      withPreloading(PreloadAllModules),
    ),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      // Comprueba actualizaciones en cuanto la app se estabiliza (≈30 s).
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
