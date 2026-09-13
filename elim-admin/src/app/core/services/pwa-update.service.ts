import { ApplicationRef, Injectable, inject } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { concat, filter, first, fromEvent, interval, merge } from 'rxjs';

/** Cada cuánto se comprueba si hay versión nueva mientras la app está abierta. */
const CHECK_EVERY_MS = 15 * 60 * 1000;

/**
 * Gestor de actualizaciones del Service Worker.
 *
 * La programación cambia a menudo y lo importante es que quien abra la app vea **siempre lo
 * último publicado**, sin pedirle nada. Por eso:
 *  - Se comprueba si hay versión nueva al arrancar, cada 15 minutos y cada vez que la app vuelve
 *    a primer plano (en el móvil la PWA suele quedar abierta en segundo plano durante días).
 *  - En cuanto la nueva versión está descargada, se activa y se recarga la página.
 *  - Si el SW detecta ficheros corruptos o inconsistentes, recarga limpia.
 */
@Injectable({ providedIn: 'root' })
export class PwaUpdateService {
  private readonly swUpdate = inject(SwUpdate);
  private readonly appRef = inject(ApplicationRef);

  init(): void {
    if (!this.swUpdate.isEnabled) return;

    const stable$ = this.appRef.isStable.pipe(first(s => s));
    const periodic$ = interval(CHECK_EVERY_MS);
    const foreground$ = fromEvent(document, 'visibilitychange').pipe(filter(() => document.visibilityState === 'visible'));
    concat(stable$, merge(periodic$, foreground$)).subscribe(() => {
      this.swUpdate.checkForUpdate().catch(() => { /* sin red: se reintenta en la siguiente comprobación */ });
    });

    this.swUpdate.versionUpdates
      .pipe(filter((e): e is VersionReadyEvent => e.type === 'VERSION_READY'))
      .subscribe(async () => {
        try {
          await this.swUpdate.activateUpdate();
        } finally {
          document.location.reload();
        }
      });

    this.swUpdate.unrecoverable.subscribe(() => document.location.reload());
  }
}
