import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, input, signal, viewChild } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

/**
 * Compartir la aplicación.
 *  - Móvil (iOS Safari, Android Chrome…): hoja nativa del sistema (`navigator.share`) con todas
 *    las apps instaladas.
 *  - Escritorio o sin soporte: diálogo propio con WhatsApp, Telegram, e-mail y copiar enlace.
 *
 * El diálogo es un `<dialog>` abierto con `showModal()`: vive en la top layer, así que no le
 * afectan los `transform` del dock flotante ni el `overflow` de sus ancestros, y trae gratis
 * foco atrapado, cierre con Escape y velo.
 */
@Component({
  selector: 'app-share-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe],
  templateUrl: './share-button.component.html',
  styleUrl: './share-button.component.css',
})
export class ShareButtonComponent {
  readonly iconOnly = input(false);
  /** Sobre la banda navy del footer. */
  readonly onDark = input(false);

  private readonly translate = inject(TranslateService);
  private readonly dialogEl = viewChild<ElementRef<HTMLDialogElement>>('dialogEl');

  protected readonly isOpen = signal(false);
  protected readonly copied = signal(false);
  protected readonly copiedPage = signal(false);
  /** URL de lo que se está viendo (pestaña + entidad expandida); se lee al abrir el diálogo. */
  protected readonly pageUrl = signal('');

  /** URL pública de la app (raíz del despliegue, no la pestaña actual: se comparte la app). */
  protected readonly url = computed(() => new URL(document.baseURI).href);
  /* Getters, no `computed`: dependen del idioma activo (ngx-translate), que aquí no es una señal. */
  protected get text(): string { return this.t('share.message'); }
  protected get whatsappUrl(): string { return `https://wa.me/?text=${encodeURIComponent(`${this.text} ${this.url()}`)}`; }
  protected get telegramUrl(): string { return `https://t.me/share/url?url=${encodeURIComponent(this.url())}&text=${encodeURIComponent(this.text)}`; }
  protected get emailUrl(): string { return `mailto:?subject=${encodeURIComponent(this.t('share.subject'))}&body=${encodeURIComponent(`${this.text}\n\n${this.url()}`)}`; }

  protected async open(): Promise<void> {
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: this.t('share.subject'), text: this.text, url: this.url() });
        return;
      } catch (err) {
        // El usuario canceló la hoja nativa: no se abre nada más.
        if ((err as DOMException)?.name === 'AbortError') return;
      }
    }
    this.pageUrl.set(location.href);
    this.isOpen.set(true);
    const dialog = this.dialogEl()?.nativeElement;
    if (dialog && !dialog.open) dialog.showModal();
  }

  protected close(): void {
    this.dialogEl()?.nativeElement.close();
  }

  /** Cierre por cualquier vía (botón, Escape, velo): el evento `close` del diálogo llega aquí. */
  protected onClosed(): void {
    this.isOpen.set(false);
    this.copied.set(false);
    this.copiedPage.set(false);
  }

  protected async copyPage(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.pageUrl());
      this.copiedPage.set(true);
      setTimeout(() => this.copiedPage.set(false), 2000);
    } catch { /* sin portapapeles: nada más que hacer */ }
  }

  /** En un `<dialog>` el velo es el propio elemento: clic fuera del panel → `target === dialog`. */
  protected onBackdropClick(ev: MouseEvent): void {
    if (ev.target === this.dialogEl()?.nativeElement) this.close();
  }

  protected async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.url());
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    } catch { /* sin portapapeles: el enlace sigue visible para copiarlo a mano */ }
  }

  private t(key: string): string {
    const v = this.translate.instant(key);
    return typeof v === 'string' ? v : key;
  }
}
