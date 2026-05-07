import { ChangeDetectionStrategy, Component, HostListener, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

/** Evento del navegador para PWA install (Chrome / Edge / Samsung Internet). */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

const STORAGE_KEY = 'pwa-install-dismissed-at';
// Si el usuario lo cierra, no volvemos a molestar durante 3 días.
const SNOOZE_MS = 3 * 24 * 60 * 60 * 1000;

@Component({
  selector: 'app-pwa-install-prompt',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TranslateModule],
  template: `
    @if (visible()) {
      <div class="pwa-install-banner" role="dialog" aria-live="polite">
        <button type="button"
                class="pwa-install-close"
                (click)="dismiss()"
                [attr.aria-label]="'pwa_install.close' | translate">×</button>

        <img src="assets/logo_admin-trans-192.png" alt="" class="pwa-install-icon">

        <div class="pwa-install-text">
          <strong>{{ 'pwa_install.title' | translate }}</strong>
          @if (isIos()) {
            <span class="pwa-install-hint">
              {{ 'pwa_install.ios_hint_1' | translate }}
              <span class="pwa-install-icon-share" aria-hidden="true">
                <!-- iOS share icon -->
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M12 2 7 7l1.4 1.4L11 5.8V16h2V5.8l2.6 2.6L17 7l-5-5zM5 20v-9h2v7h10v-7h2v9H5z"/>
                </svg>
              </span>
              {{ 'pwa_install.ios_hint_2' | translate }}
            </span>
          } @else {
            <span class="pwa-install-hint">{{ 'pwa_install.android_hint' | translate }}</span>
          }
        </div>

        @if (!isIos()) {
          <button type="button" class="pwa-install-cta" (click)="install()">
            {{ 'pwa_install.cta' | translate }}
          </button>
        }
      </div>
    }
  `,
  styles: [`
    .pwa-install-banner {
      position: fixed;
      left: 12px;
      right: 12px;
      bottom: 12px;
      z-index: 1100;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 14px 12px 12px;
      background: #ffffff;
      color: #1e293b;
      border-radius: 14px;
      box-shadow: 0 10px 28px rgba(15, 23, 42, .22), 0 2px 6px rgba(15, 23, 42, .12);
      border: 1px solid rgba(30, 58, 95, .12);
      animation: pwa-slide-up .35s ease-out;
      max-width: 560px;
      margin: 0 auto;
    }
    @keyframes pwa-slide-up {
      from { transform: translateY(120%); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    .pwa-install-icon {
      width: 44px;
      height: 44px;
      flex-shrink: 0;
      border-radius: 10px;
      background: #1e3a5f;
      padding: 4px;
    }
    .pwa-install-text {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      line-height: 1.25;
    }
    .pwa-install-text strong { font-size: .95rem; color: #0f172a; }
    .pwa-install-hint {
      font-size: .78rem;
      color: #475569;
      margin-top: 2px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      flex-wrap: wrap;
    }
    .pwa-install-icon-share {
      display: inline-flex;
      align-items: center;
      color: #2563eb;
    }
    .pwa-install-cta {
      flex-shrink: 0;
      background: linear-gradient(135deg, #1e3a5f, #2c5282);
      color: #fff;
      border: none;
      border-radius: 10px;
      padding: 9px 16px;
      font-weight: 600;
      font-size: .88rem;
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(30, 58, 95, .3);
      transition: transform .15s ease, box-shadow .15s ease;
    }
    .pwa-install-cta:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(30, 58, 95, .4); }
    .pwa-install-cta:active { transform: translateY(0); }
    .pwa-install-close {
      position: absolute;
      top: 4px;
      right: 6px;
      width: 22px;
      height: 22px;
      border: none;
      background: transparent;
      color: #94a3b8;
      font-size: 18px;
      line-height: 1;
      cursor: pointer;
      border-radius: 50%;
    }
    .pwa-install-close:hover { background: #f1f5f9; color: #1e293b; }
    @media (max-width: 480px) {
      .pwa-install-banner { padding: 10px 12px; gap: 10px; }
      .pwa-install-icon { width: 38px; height: 38px; }
      .pwa-install-cta { padding: 8px 12px; font-size: .82rem; }
    }
  `],
})
export class PwaInstallPromptComponent implements OnInit {
  private readonly translate = inject(TranslateService);
  private deferredPrompt: BeforeInstallPromptEvent | null = null;

  readonly visible = signal(false);
  readonly isIos = signal(false);

  ngOnInit(): void {
    // Si ya está instalada (modo standalone) NO mostramos nada.
    if (this.isStandalone()) return;

    const ua = navigator.userAgent || '';
    const isIosDevice = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    const isIosSafari = isIosDevice && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
    this.isIos.set(isIosSafari);

    // Respetar el snooze del usuario (cerró el banner hace poco).
    if (this.isSnoozed()) return;

    if (isIosSafari) {
      // iOS no soporta beforeinstallprompt. Mostramos hint nativo.
      setTimeout(() => this.visible.set(true), 1500);
    }
    // Android: esperamos beforeinstallprompt (HostListener de abajo).
  }

  @HostListener('window:beforeinstallprompt', ['$event'])
  onBeforeInstall(e: Event): void {
    e.preventDefault();
    this.deferredPrompt = e as BeforeInstallPromptEvent;
    if (!this.isStandalone() && !this.isSnoozed()) {
      this.visible.set(true);
    }
  }

  @HostListener('window:appinstalled')
  onInstalled(): void {
    this.visible.set(false);
    this.deferredPrompt = null;
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
  }

  async install(): Promise<void> {
    if (!this.deferredPrompt) {
      // Fallback: cerrar el banner si por alguna razón no hay prompt.
      this.dismiss();
      return;
    }
    try {
      await this.deferredPrompt.prompt();
      const choice = await this.deferredPrompt.userChoice;
      this.deferredPrompt = null;
      this.visible.set(false);
      if (choice.outcome === 'dismissed') this.snooze();
    } catch {
      this.dismiss();
    }
  }

  dismiss(): void {
    this.visible.set(false);
    this.snooze();
  }

  private snooze(): void {
    try { localStorage.setItem(STORAGE_KEY, String(Date.now())); } catch { /* noop */ }
  }

  private isSnoozed(): boolean {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (!v) return false;
      return Date.now() - Number(v) < SNOOZE_MS;
    } catch { return false; }
  }

  private isStandalone(): boolean {
    // Android / desktop PWA
    if (window.matchMedia?.('(display-mode: standalone)').matches) return true;
    // iOS Safari
    if ((navigator as any).standalone === true) return true;
    return false;
  }
}
