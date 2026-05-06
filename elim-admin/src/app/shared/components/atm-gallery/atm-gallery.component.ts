import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { GalleriaModule, Galleria } from 'primeng/galleria';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

import { GalleryService } from './gallery.service';
import { GalleryItem } from './atm-gallery.models';

const GALLERY_AUTOPLAY_KEY = 'elim_gallery_autoplay';
const GALLERY_THUMBNAILS_KEY = 'elim_gallery_thumbnails';

@Component({
  selector: 'app-atm-gallery',
  standalone: true,
  imports: [CommonModule, GalleriaModule, ButtonModule, TooltipModule],
  changeDetection: ChangeDetectionStrategy.Default,
  templateUrl: './atm-gallery.component.html',
  styleUrls: ['./atm-gallery.component.scss'],
})
export class AtmGalleryComponent implements OnInit, OnChanges, OnDestroy {
  @Input() keyGroup: string = '';

  @ViewChild('galleria') galleria?: Galleria;

  images: GalleryItem[] = [];
  activeIndex = 0;
  loading = false;
  showThumbnails: boolean = AtmGalleryComponent._readThumbnails();
  isAutoPlay: boolean = AtmGalleryComponent._readAutoPlay();
  fullscreen = false;
  simulatedFullscreen = false;

  private onFullScreenListener: any;

  constructor(private gallerySvc: GalleryService) {}

  ngOnInit(): void {
    if (this.keyGroup) this.loadGallery();
    this.bindDocumentListeners();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['keyGroup'] && !changes['keyGroup'].firstChange) {
      this.loadGallery();
    }
  }

  ngOnDestroy(): void {
    this.unbindDocumentListeners();
    if (this.simulatedFullscreen) {
      document.body.style.overflow = '';
    }
  }

  private loadGallery(): void {
    if (!this.keyGroup) {
      this.images = [];
      return;
    }
    this.loading = true;
    const items = this.gallerySvc.getByKeyGroup(this.keyGroup);
    this.images = items;
    const defaultIdx = items.findIndex(i => i.isDefault);
    this.activeIndex = defaultIdx >= 0 ? defaultIdx : 0;
    this.loading = false;
  }

  // ─── Controles básicos ────────────────────────────────────
  onThumbnailButtonClick(): void {
    this.showThumbnails = !this.showThumbnails;
    AtmGalleryComponent._saveThumbnails(this.showThumbnails);
  }

  toggleAutoSlide(): void {
    this.isAutoPlay = !this.isAutoPlay;
    AtmGalleryComponent._saveAutoPlay(this.isAutoPlay);
  }

  get slideButtonIcon(): string {
    return this.isAutoPlay ? 'pi pi-pause' : 'pi pi-play';
  }

  get fullScreenIcon(): string {
    return this.fullscreen || this.simulatedFullscreen
      ? 'pi pi-window-minimize'
      : 'pi pi-window-maximize';
  }

  toggleFullScreen(): void {
    if (this.fullscreen || this.simulatedFullscreen) {
      this.closePreviewFullScreen();
    } else {
      this.openPreviewFullScreen();
    }
  }

  openPreviewFullScreen(): void {
    const elem = (this.galleria as any)?.element?.nativeElement?.querySelector('.p-galleria');
    if (!elem) {
      this.activateSimulatedFullscreen();
      return;
    }
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(() => this.activateSimulatedFullscreen());
    } else if (elem['webkitRequestFullscreen']) {
      try { elem['webkitRequestFullscreen'](); } catch { this.activateSimulatedFullscreen(); }
    } else if (elem['msRequestFullscreen']) {
      try { elem['msRequestFullscreen'](); } catch { this.activateSimulatedFullscreen(); }
    } else {
      this.activateSimulatedFullscreen();
    }
  }

  closePreviewFullScreen(): void {
    if (this.simulatedFullscreen) {
      this.deactivateSimulatedFullscreen();
      return;
    }
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if ((document as any)['webkitExitFullscreen']) {
      (document as any)['webkitExitFullscreen']();
    } else if ((document as any)['msExitFullscreen']) {
      (document as any)['msExitFullscreen']();
    }
  }

  private activateSimulatedFullscreen(): void {
    this.simulatedFullscreen = true;
    this.fullscreen = true;
    document.body.style.overflow = 'hidden';
  }

  private deactivateSimulatedFullscreen(): void {
    this.simulatedFullscreen = false;
    this.fullscreen = false;
    document.body.style.overflow = '';
  }

  onFullScreenChange(): void {
    this.fullscreen = !!document.fullscreenElement;
  }

  private bindDocumentListeners(): void {
    this.onFullScreenListener = this.onFullScreenChange.bind(this);
    document.addEventListener('fullscreenchange', this.onFullScreenListener);
    document.addEventListener('webkitfullscreenchange', this.onFullScreenListener);
  }

  private unbindDocumentListeners(): void {
    if (!this.onFullScreenListener) return;
    document.removeEventListener('fullscreenchange', this.onFullScreenListener);
    document.removeEventListener('webkitfullscreenchange', this.onFullScreenListener);
    this.onFullScreenListener = null;
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.simulatedFullscreen) {
      event.preventDefault();
      this.deactivateSimulatedFullscreen();
      return;
    }
    if (this.images.length <= 1) return;
    const el = event.target as HTMLElement;
    if (!el) return;
    const tag = el.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (el.isContentEditable) return;

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.activeIndex = (this.activeIndex + 1) % this.images.length;
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.activeIndex = (this.activeIndex - 1 + this.images.length) % this.images.length;
    }
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('ro-RO', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  isOverflowing(el: HTMLElement | null): boolean {
    if (!el) return false;
    return el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight;
  }

  // ─── Persistencia preferencias ────────────────────────────
  private static _readAutoPlay(): boolean {
    try { return localStorage.getItem(GALLERY_AUTOPLAY_KEY) === 'true'; } catch { return false; }
  }
  private static _saveAutoPlay(value: boolean): void {
    try { localStorage.setItem(GALLERY_AUTOPLAY_KEY, String(value)); } catch { /* ignore */ }
  }
  private static _readThumbnails(): boolean {
    try { return localStorage.getItem(GALLERY_THUMBNAILS_KEY) === 'true'; } catch { return false; }
  }
  private static _saveThumbnails(value: boolean): void {
    try { localStorage.setItem(GALLERY_THUMBNAILS_KEY, String(value)); } catch { /* ignore */ }
  }
}
