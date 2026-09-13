import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NavTarget } from '../models';
import { TAB_PATHS } from '../constants';

/**
 * Estado de navegación compartido entre pestañas.
 *
 * Guarda qué entidad está expandida en cada pestaña (equipo, joven, padre, composición
 * histórica). Es la única fuente de verdad: los componentes leen estas señales directamente,
 * así la navegación cruzada (clic en un coordinador desde Programare → se abre su perfil en
 * Tineri) funciona igual desde otra pestaña que desde la misma, y al volver a una pestaña se
 * conserva lo que el usuario tenía abierto.
 *
 * Tras navegar hace scroll al ancla `card-<target>-<id>` y la resalta brevemente. Los
 * temporizadores pendientes se cancelan en cada nueva petición para que clics rápidos no
 * acumulen trabajo.
 */
@Injectable({ providedIn: 'root' })
export class NavigationService {
  private readonly router = inject(Router);

  readonly expandedTeam = signal<string | null>(null);
  readonly expandedYouthId = signal<string | null>(null);
  readonly expandedParentId = signal<string | null>(null);
  /** Clave de composición histórica (`<equipo>-<endTimeMs>`) expandida en Echipe. */
  readonly expandedHistoryKey = signal<string | null>(null);

  private scrollTimer: ReturnType<typeof setTimeout> | null = null;
  private flashTimer: ReturnType<typeof setTimeout> | null = null;
  private lastFlashedEl: HTMLElement | null = null;

  /** Abre/cierra una entidad desde su propia pestaña (sin scroll). */
  toggle(target: NavTarget, id: string): void {
    const sig = this.signalFor(target);
    sig.update(v => (v === id ? null : id));
  }

  toggleHistory(key: string): void {
    this.expandedHistoryKey.update(v => (v === key ? null : key));
  }

  /** Navega a la pestaña de `target`, expande la entidad y hace scroll hasta ella. */
  goTo(target: NavTarget, id: string, ev?: Event): void {
    ev?.stopPropagation();
    this.signalFor(target).set(id);
    this.navigateAndReveal(this.pathFor(target), `card-${target}-${id}`);
  }

  /** Navega a Echipe y muestra una composición histórica concreta. */
  goToHistoricalTeam(historyKey: string, ev?: Event): void {
    ev?.stopPropagation();
    this.expandedHistoryKey.set(historyKey);
    this.navigateAndReveal(TAB_PATHS.teams, `card-team-history-${historyKey}`);
  }

  private navigateAndReveal(path: string, anchorId: string): void {
    this.cancelPending();
    const url = '/' + path;
    const alreadyThere = this.router.url.split('?')[0].split('#')[0] === url;
    const navPromise = alreadyThere ? Promise.resolve(true) : this.router.navigateByUrl(url);
    navPromise.then(ok => { if (ok) this.scheduleReveal(anchorId); });
  }

  /** Espera a que la vista pinte la entidad expandida antes de hacer scroll. */
  private scheduleReveal(anchorId: string): void {
    this.scrollTimer = setTimeout(() => {
      this.scrollTimer = null;
      const el = document.getElementById(anchorId);
      if (!el) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (this.lastFlashedEl && this.lastFlashedEl !== el) this.lastFlashedEl.classList.remove('flash-highlight');
      el.classList.add('flash-highlight');
      this.lastFlashedEl = el;
      this.flashTimer = setTimeout(() => {
        this.flashTimer = null;
        el.classList.remove('flash-highlight');
        if (this.lastFlashedEl === el) this.lastFlashedEl = null;
      }, 1600);
    }, 240);
  }

  private cancelPending(): void {
    if (this.scrollTimer !== null) { clearTimeout(this.scrollTimer); this.scrollTimer = null; }
    if (this.flashTimer !== null) { clearTimeout(this.flashTimer); this.flashTimer = null; }
    if (this.lastFlashedEl) { this.lastFlashedEl.classList.remove('flash-highlight'); this.lastFlashedEl = null; }
  }

  private signalFor(target: NavTarget) {
    return target === 'team' ? this.expandedTeam
      : target === 'youth' ? this.expandedYouthId
        : this.expandedParentId;
  }

  private pathFor(target: NavTarget): string {
    return target === 'team' ? TAB_PATHS.teams
      : target === 'youth' ? TAB_PATHS.youths
        : TAB_PATHS.parents;
  }
}
