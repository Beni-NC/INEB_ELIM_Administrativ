import { ApplicationRef, Injectable, inject } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { concat, filter, first, interval } from 'rxjs';

/**
 * Gestor de actualizaciones del Service Worker.
 *
 * - Comprueba periódicamente si hay versión nueva (cada 1h) además de cada
 *   vez que la app se inicializa.
 * - Cuando detecta una nueva versión, activa el SW y recarga la página
 *   automáticamente para que el usuario nunca quede atrapado en una
 *   versión cacheada antigua.
 */
@Injectable({ providedIn: 'root' })
export class PwaUpdateService {
  private readonly swUpdate = inject(SwUpdate);
  private readonly appRef = inject(ApplicationRef);

  init(): void {
    if (!this.swUpdate.isEnabled) return;

    // Polling: una vez la app está estable, comprobar cada hora.
    const stable$ = this.appRef.isStable.pipe(first(s => s));
    const everyHour$ = interval(60 * 60 * 1000);
    concat(stable$, everyHour$).subscribe(() => {
      this.swUpdate.checkForUpdate().catch(() => { /* ignore */ });
    });

    // Cuando hay una nueva versión preparada → activar y recargar.
    this.swUpdate.versionUpdates
      .pipe(filter((e): e is VersionReadyEvent => e.type === 'VERSION_READY'))
      .subscribe(async () => {
        try {
          await this.swUpdate.activateUpdate();
        } finally {
          document.location.reload();
        }
      });

    // Si el SW detecta archivos corruptos o inconsistentes → recarga limpia.
    this.swUpdate.unrecoverable.subscribe(() => {
      document.location.reload();
    });
  }
}
