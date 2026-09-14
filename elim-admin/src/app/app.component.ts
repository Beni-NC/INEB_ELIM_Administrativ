import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnDestroy, ViewChild, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs';
import { HeaderComponent } from './layout/header.component';
import { FooterComponent } from './layout/footer.component';
import { TabsNavComponent } from './layout/tabs-nav.component';
import { PwaInstallPromptComponent } from './layout/pwa-install-prompt.component';
import { FloatingDockComponent } from './layout/floating-dock.component';
import { PwaUpdateService } from './core/services/pwa-update.service';
import { DayRolloverService } from './core/services/day-rollover.service';
import { TAB_ORDER, TAB_PATHS } from './core/constants';

/** Umbrales del gesto de deslizar entre pestañas (px). */
const SWIPE_MIN_X = 80;
const SWIPE_MAX_Y = 60;

@Component({
    selector: 'app-root',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [RouterOutlet, TranslatePipe, HeaderComponent, FooterComponent, TabsNavComponent, PwaInstallPromptComponent, FloatingDockComponent],
    template: `
    <button type="button" class="skip-link" (click)="focusMain()">{{ 'a11y.skip_to_content' | translate }}</button>
    <app-header />
    <app-tabs-nav />
    <main class="ui-main ui-container" #mainContent id="main" tabindex="-1">
      <router-outlet />
    </main>
    <!-- Lo que anuncia el lector de pantalla al cambiar de pestaña (el título del documento no basta en todos). -->
    <div class="sr-only" aria-live="polite" aria-atomic="true">{{ announcement() }}</div>
    <app-footer />
    <!-- Elementos para participantes: no tienen sentido en el panel de planificación. -->
    @if (!isAdmin()) {
      <app-pwa-install-prompt />
      <app-floating-dock />
    }
  `,
    // Flechas ←/→ para cambiar de pestaña con teclado (equivalente al gesto de deslizar en móvil).
    host: { '(document:keydown)': 'onKeydown($event)' },
})
export class AppComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mainContent') mainContent!: ElementRef<HTMLElement>;
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  /** Nombre de la pestaña activa, para la región `aria-live`. */
  protected readonly announcement = signal('');
  /** El panel `/admin` no es una pestaña: ni se anuncia ni lleva los añadidos de la app pública. */
  protected readonly isAdmin = signal(false);

  private touchStartX = 0;
  private touchStartY = 0;
  private touchActive = false;

  constructor() {
    inject(PwaUpdateService).init();
    inject(DayRolloverService).init();
    this.router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd)).subscribe(e => {
      const path = e.urlAfterRedirects.split(/[?#]/)[0].replace(/^\//, '');
      const tab = (Object.entries(TAB_PATHS) as [string, string][]).find(([, p]) => p === path)?.[0];
      this.announcement.set(tab ? this.translate.instant(`tabs.${tab}`) as string : '');
      this.isAdmin.set(path === 'admin');
    });
  }

  /** Skip link: lleva el foco (y el scroll) al contenido, saltando cabecera y pestañas. */
  protected focusMain(): void {
    this.mainContent.nativeElement.focus({ preventScroll: false });
  }

  ngAfterViewInit(): void {
    const el = this.mainContent.nativeElement;
    el.addEventListener('touchstart', this.onTouchStart, { passive: true });
    el.addEventListener('touchend', this.onTouchEnd, { passive: true });
    el.addEventListener('touchcancel', this.onTouchCancel, { passive: true });
  }

  ngOnDestroy(): void {
    const el = this.mainContent?.nativeElement;
    if (!el) return;
    el.removeEventListener('touchstart', this.onTouchStart);
    el.removeEventListener('touchend', this.onTouchEnd);
    el.removeEventListener('touchcancel', this.onTouchCancel);
  }

  private onTouchStart = (ev: TouchEvent): void => {
    if (ev.touches.length !== 1) { this.touchActive = false; return; }
    this.touchStartX = ev.touches[0].clientX;
    this.touchStartY = ev.touches[0].clientY;
    this.touchActive = true;
  };

  private onTouchCancel = (): void => { this.touchActive = false; };

  /**
   * ← / → cambian de pestaña. Se ignora si hay modificadores (Alt+← es "atrás" en el navegador),
   * si el foco está en un campo de texto (las flechas mueven el cursor) o si hay un diálogo
   * abierto (el foco pertenece al diálogo).
   */
  protected onKeydown(ev: KeyboardEvent): void {
    if (ev.key !== 'ArrowLeft' && ev.key !== 'ArrowRight') return;
    if (ev.altKey || ev.ctrlKey || ev.metaKey || ev.shiftKey || ev.defaultPrevented) return;
    const target = ev.target as HTMLElement | null;
    if (target?.closest('input, textarea, select, [contenteditable="true"], dialog[open]')) return;
    ev.preventDefault();
    this.navigateTab(ev.key === 'ArrowRight' ? 1 : -1, 'keyboard');
  }

  /** Deslizar a la izquierda → pestaña siguiente; a la derecha → anterior. */
  private onTouchEnd = (ev: TouchEvent): void => {
    if (!this.touchActive) return;
    this.touchActive = false;
    const t = ev.changedTouches[0];
    if (!t) return;
    const dx = t.clientX - this.touchStartX;
    const dy = t.clientY - this.touchStartY;
    // Debe ser un gesto horizontal claro para no interferir con el scroll.
    if (Math.abs(dx) < SWIPE_MIN_X || Math.abs(dy) > SWIPE_MAX_Y) return;
    this.navigateTab(dx < 0 ? 1 : -1, 'touch');
  };

  private navigateTab(delta: number, source: 'touch' | 'keyboard'): void {
    const currentPath = this.router.url.split('?')[0].split('#')[0].replace(/^\//, '');
    const currentIdx = TAB_ORDER.indexOf(currentPath);
    if (currentIdx === -1) return;
    const nextIdx = currentIdx + delta;
    if (nextIdx < 0 || nextIdx >= TAB_ORDER.length) return;
    // La pestaña que se tocó antes conserva el foco y, en algunos navegadores, su anillo: al
    // cambiar por gesto ya no representa nada, así que se suelta el foco.
    (document.activeElement as HTMLElement | null)?.blur?.();
    void this.router.navigateByUrl('/' + TAB_ORDER[nextIdx]).then(ok => {
      // Con teclado el foco sigue a la pestaña nueva: el anillo indica dónde se está y el lector
      // de pantalla anuncia el cambio. En táctil no hay foco que mostrar.
      if (ok && source === 'keyboard') document.querySelector<HTMLElement>('.ui-tab.is-active')?.focus();
    });
  }
}
