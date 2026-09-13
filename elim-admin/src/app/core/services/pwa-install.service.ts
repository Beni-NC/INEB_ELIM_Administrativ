import { Injectable, signal } from '@angular/core';

/** Evento del navegador para instalar la PWA (Chrome / Edge / Samsung Internet). */
interface BeforeInstallPromptEvent extends Event {
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

const STORAGE_KEY = 'pwa-install-dismissed-at';
/** Si el usuario cierra el banner, no se vuelve a mostrar durante 3 días. */
const SNOOZE_MS = 3 * 24 * 60 * 60 * 1000;

/**
 * Estado de instalación de la PWA, compartido por el banner de instalación y el botón del footer.
 *  - Android/desktop Chromium: se captura `beforeinstallprompt` y se lanza con `install()`.
 *  - iOS Safari: no existe el evento; solo se puede explicar el gesto "Compartir → Añadir a inicio".
 */
@Injectable({ providedIn: 'root' })
export class PwaInstallService {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;

  /** Ya se ejecuta como app instalada: nada que ofrecer. */
  readonly isStandalone = signal(false);
  /** iOS Safari: hay que mostrar el gesto manual. */
  readonly isIos = signal(false);
  /** Hay un prompt nativo listo para lanzar. */
  readonly canInstall = signal(false);
  /** El banner flotante debe verse (respeta el aplazamiento de 3 días). */
  readonly bannerVisible = signal(false);

  init(): void {
    this.isStandalone.set(
      window.matchMedia?.('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true,
    );
    if (this.isStandalone()) return;

    const ua = navigator.userAgent || '';
    const isIosDevice = /iPad|iPhone|iPod/.test(ua);
    this.isIos.set(isIosDevice && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua));

    if (this.isIos() && !this.isSnoozed()) {
      setTimeout(() => this.bannerVisible.set(true), 1500);
    }

    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault();
      this.deferredPrompt = e as BeforeInstallPromptEvent;
      this.canInstall.set(true);
      if (!this.isSnoozed()) this.bannerVisible.set(true);
    });
    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.canInstall.set(false);
      this.bannerVisible.set(false);
      try { localStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
    });
  }

  /** Lanza el prompt nativo. Si el usuario lo rechaza, se aplaza el banner. */
  async install(): Promise<void> {
    const prompt = this.deferredPrompt;
    if (!prompt) { this.dismissBanner(); return; }
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      this.bannerVisible.set(false);
      if (choice.outcome === 'dismissed') this.snooze();
      else { this.deferredPrompt = null; this.canInstall.set(false); }
    } catch {
      this.dismissBanner();
    }
  }

  dismissBanner(): void {
    this.bannerVisible.set(false);
    this.snooze();
  }

  private snooze(): void {
    try { localStorage.setItem(STORAGE_KEY, String(Date.now())); } catch { /* noop */ }
  }

  private isSnoozed(): boolean {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      return !!v && Date.now() - Number(v) < SNOOZE_MS;
    } catch { return false; }
  }
}
