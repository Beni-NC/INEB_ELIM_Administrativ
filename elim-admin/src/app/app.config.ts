import { ApplicationConfig, inject, isDevMode, provideAppInitializer, provideZonelessChangeDetection } from '@angular/core';
import { PreloadAllModules, TitleStrategy, provideRouter, withInMemoryScrolling, withPreloading } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { provideHttpClient } from '@angular/common/http';
import { TranslateLoader, provideTranslateService } from '@ngx-translate/core';
import { BundledTranslateLoader } from './core/i18n/translate.loader';
import { routes } from './app.routes';
import { LanguageService } from './core/services/language.service';
import { ThemeService } from './core/services/theme.service';
import { PwaInstallService } from './core/services/pwa-install.service';
import { I18nTitleStrategy } from './core/i18n/title.strategy';

export const appConfig: ApplicationConfig = {
  providers: [
    // Sin zone.js: todos los componentes son OnPush y el estado vive en signals.
    provideZonelessChangeDetection(),
    provideHttpClient(),
    provideTranslateService({
      fallbackLang: 'ro',
      // Rumano empaquetado (sin petición de red al arrancar); otros idiomas desde assets/i18n/.
      loader: { provide: TranslateLoader, useClass: BundledTranslateLoader },
    }),
    provideAppInitializer(() => inject(LanguageService).init()),
    provideAppInitializer(() => inject(ThemeService).init()),
    provideAppInitializer(() => inject(PwaInstallService).init()),
    provideRouter(
      routes,
      withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' }),
      withPreloading(PreloadAllModules),
    ),
    // Título del documento por pestaña, traducido (las rutas declaran `title: 'tabs.<clave>'`).
    { provide: TitleStrategy, useClass: I18nTitleStrategy },
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      // Comprueba actualizaciones en cuanto la app se estabiliza (≈30 s).
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
