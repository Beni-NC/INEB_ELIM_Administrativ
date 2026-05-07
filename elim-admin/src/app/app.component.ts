import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, AfterViewInit, ViewChild, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { HeaderComponent } from './features/layout/header.component';
import { FooterComponent } from './features/layout/footer.component';
import { TabsNavComponent } from './features/layout/tabs-nav.component';
import { EventNotesDialogComponent } from './features/layout/event-notes-dialog.component';
import { PwaInstallPromptComponent } from './features/layout/pwa-install-prompt.component';
import { PwaUpdateService } from './core/services/pwa-update.service';
import { TAB_PATHS } from './core/constants';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, HeaderComponent, FooterComponent, TabsNavComponent, EventNotesDialogComponent, PwaInstallPromptComponent],
  template: `
    <app-header />
    <app-tabs-nav />
    <main class="main-content" #mainContent>
      <section class="section">
        <router-outlet />
      </section>
    </main>
    <app-footer />
    <app-event-notes-dialog />
    <app-pwa-install-prompt />
  `,
})
export class AppComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mainContent') mainContent!: ElementRef<HTMLElement>;
  private readonly router = inject(Router);

  // Ordinea taburilor pentru navigare cu swipe
  private readonly tabOrder: string[] = [
    TAB_PATHS.schedule,
    TAB_PATHS.teams,
    TAB_PATHS.youths,
    TAB_PATHS.parents,
    TAB_PATHS.rules,
  ];

  // Praguri swipe (px)
  private readonly SWIPE_THRESHOLD = 80; // distanță minimă orizontală
  private readonly MAX_VERTICAL = 60;     // mișcare verticală maximă tolerată

  private touchStartX = 0;
  private touchStartY = 0;
  private touchActive = false;

  constructor() {
    inject(PwaUpdateService).init();
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
    const t = ev.touches[0];
    this.touchStartX = t.clientX;
    this.touchStartY = t.clientY;
    this.touchActive = true;
  };

  private onTouchCancel = (): void => {
    this.touchActive = false;
  };

  private onTouchEnd = (ev: TouchEvent): void => {
    if (!this.touchActive) return;
    this.touchActive = false;
    const t = ev.changedTouches[0];
    if (!t) return;
    const dx = t.clientX - this.touchStartX;
    const dy = t.clientY - this.touchStartY;

    // Trebuie sa fie mișcat (pentru a evita simple tap-uri ratate ca swipe)
    if (Math.abs(dx) < this.SWIPE_THRESHOLD) return;
    // Mișcare verticală mică, ca să nu interfereze cu scroll-ul
    if (Math.abs(dy) > this.MAX_VERTICAL) return;

    // Stânga (dx < 0) → tab următor; Dreapta (dx > 0) → tab precedent
    const direction = dx < 0 ? 1 : -1;
    this.navigateTab(direction);
  };

  private navigateTab(delta: number): void {
    const currentPath = this.router.url.split('?')[0].split('#')[0].replace(/^\//, '');
    const currentIdx = this.tabOrder.indexOf(currentPath);
    if (currentIdx === -1) return;
    const nextIdx = currentIdx + delta;
    if (nextIdx < 0 || nextIdx >= this.tabOrder.length) return;
    this.router.navigateByUrl('/' + this.tabOrder[nextIdx]);
  }
}
