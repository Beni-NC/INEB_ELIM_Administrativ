import { Injectable, computed, signal } from '@angular/core';

/**
 * Coordina el dock flotante con los bloques que repiten sus acciones (el footer y el bloque de
 * contacto de Reguli): mientras alguno está en pantalla, el dock se esconde para no ofrecer dos
 * veces el mismo WhatsApp / compartir ni tapar el pie.
 */
@Injectable({ providedIn: 'root' })
export class DockOverlapService {
  private readonly visibleSources = signal<ReadonlySet<string>>(new Set());

  /** Algún bloque con las mismas acciones está en el viewport. */
  readonly duplicateVisible = computed(() => this.visibleSources().size > 0);

  /** Cada bloque informa de su visibilidad con un id propio ('footer', 'contact'…). */
  report(source: string, visible: boolean): void {
    const next = new Set(this.visibleSources());
    if (visible) next.add(source); else next.delete(source);
    this.visibleSources.set(next);
  }
}
