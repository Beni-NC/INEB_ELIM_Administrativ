import { Injectable, Injector, afterNextRender, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { NavTarget } from '../models';
import { TAB_PATHS } from '../constants';

/** Entidades que pueden ir en el fragmento de la URL (`#team:Echipa 4`, `#youth:y-…`, `#history:<clave>`). */
type FragmentTarget = NavTarget | 'history';
const FRAGMENT_RE = /^(team|youth|parent|history):(.+)$/;
/** Fragmento del bloque "Rândul echipelor" de Programare (sin entidad). */
const ROTATION_FRAGMENT = 'rotation';
const ROTATION_ANCHOR = 'card-rotation';

/**
 * Estado de navegación compartido entre pestañas.
 *
 * Guarda qué entidad está expandida en cada pestaña (equipo, joven, padre, composición
 * histórica). Es la única fuente de verdad: los componentes leen estas señales directamente,
 * así la navegación cruzada (clic en un coordinador desde Programare → se abre su perfil en
 * Tineri) funciona igual desde otra pestaña que desde la misma, y al volver a una pestaña se
 * conserva lo que el usuario tenía abierto.
 *
 * La entidad expandida se refleja en el fragmento de la URL (`/echipe#team:Echipa 4`), de modo
 * que un enlace se puede compartir ("mira tu equipo") y una recarga vuelve a abrir lo mismo.
 * Al llegar con fragmento (enlace externo, recarga, atrás/adelante) se expande y se hace scroll.
 *
 * Tras navegar hace scroll al ancla `card-<target>-<id>` y la resalta brevemente; el scroll
 * espera al siguiente render (`afterNextRender`), que es cuando la vista destino ya ha pintado
 * la entidad expandida.
 */
@Injectable({ providedIn: 'root' })
export class NavigationService {
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);

  readonly expandedTeam = signal<string | null>(null);
  readonly expandedYouthId = signal<string | null>(null);
  readonly expandedParentId = signal<string | null>(null);
  /** Clave de composición histórica (`<equipo>-<endTimeMs>`) expandida en Echipe. */
  readonly expandedHistoryKey = signal<string | null>(null);

  private flashTimer: ReturnType<typeof setTimeout> | null = null;
  private lastFlashedEl: HTMLElement | null = null;
  /** true mientras somos nosotros quienes escribimos el fragmento: ese NavigationEnd no se aplica. */
  private writingFragment = false;

  constructor() {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(e => { if (!this.writingFragment) this.applyFragment(this.router.parseUrl(e.urlAfterRedirects).fragment); });
  }

  /** Abre/cierra una entidad desde su propia pestaña (sin scroll). */
  toggle(target: NavTarget, id: string): void {
    const sig = this.signalFor(target);
    const next = sig() === id ? null : id;
    sig.set(next);
    this.writeFragment(next === null ? null : `${target}:${id}`);
  }

  toggleHistory(key: string): void {
    const next = this.expandedHistoryKey() === key ? null : key;
    this.expandedHistoryKey.set(next);
    this.writeFragment(next === null ? null : `history:${key}`);
  }

  /** Navega a la pestaña de `target`, expande la entidad y hace scroll hasta ella. */
  goTo(target: NavTarget, id: string, ev?: Event): void {
    ev?.stopPropagation();
    this.signalFor(target).set(id);
    this.navigateAndReveal(this.pathFor(target), `${target}:${id}`, `card-${target}-${id}`);
  }

  /** Navega a Echipe y muestra una composición histórica concreta. */
  goToHistoricalTeam(historyKey: string, ev?: Event): void {
    ev?.stopPropagation();
    this.expandedHistoryKey.set(historyKey);
    this.navigateAndReveal(TAB_PATHS.teams, `history:${historyKey}`, `card-team-history-${historyKey}`);
  }

  /** Navega a Programare y muestra el bloque de rotación ("a quién le toca"). */
  goToRotation(ev?: Event): void {
    ev?.stopPropagation();
    this.navigateAndReveal(TAB_PATHS.schedule, ROTATION_FRAGMENT, ROTATION_ANCHOR);
  }

  /* ─────── Fragmento de la URL ─────── */

  /** Enlace entrante: expande la entidad del fragmento y la revela. Sin fragmento no toca nada. */
  private applyFragment(fragment: string | null): void {
    if (fragment === ROTATION_FRAGMENT) { this.reveal(ROTATION_ANCHOR); return; }
    const m = fragment ? FRAGMENT_RE.exec(fragment) : null;
    if (!m) return;
    const target = m[1] as FragmentTarget;
    const id = m[2];
    if (target === 'history') {
      this.expandedHistoryKey.set(id);
      this.reveal(`card-team-history-${id}`);
    } else {
      this.signalFor(target).set(id);
      this.reveal(`card-${target}-${id}`);
    }
  }

  /** Escribe (o borra) el fragmento sin añadir entradas al historial ni disparar scroll. */
  private writeFragment(fragment: string | null): void {
    this.writingFragment = true;
    void this.router.navigate([], { fragment: fragment ?? undefined, replaceUrl: true, queryParamsHandling: 'preserve' })
      .finally(() => { this.writingFragment = false; });
  }

  private navigateAndReveal(path: string, fragment: string, anchorId: string): void {
    this.cancelPending();
    const url = this.router.createUrlTree(['/' + path], { fragment });
    this.writingFragment = true;
    void this.router.navigateByUrl(url)
      .then(ok => { if (ok) this.reveal(anchorId); })
      .finally(() => { this.writingFragment = false; });
  }

  /* ─────── Scroll y resaltado ─────── */

  /** Tras el siguiente render (la vista destino ya ha pintado la entidad expandida) hace scroll y resalta. */
  private reveal(anchorId: string): void {
    afterNextRender(() => {
      const el = document.getElementById(anchorId);
      if (!el) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      this.flash(el);
    }, { injector: this.injector });
  }

  private flash(el: HTMLElement): void {
    if (this.lastFlashedEl && this.lastFlashedEl !== el) this.lastFlashedEl.classList.remove('flash-highlight');
    if (this.flashTimer !== null) clearTimeout(this.flashTimer);
    el.classList.add('flash-highlight');
    this.lastFlashedEl = el;
    this.flashTimer = setTimeout(() => {
      this.flashTimer = null;
      el.classList.remove('flash-highlight');
      if (this.lastFlashedEl === el) this.lastFlashedEl = null;
    }, 1600);
  }

  private cancelPending(): void {
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
