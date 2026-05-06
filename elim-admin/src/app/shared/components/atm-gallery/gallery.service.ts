import { Injectable } from '@angular/core';
import { GalleryItem } from './atm-gallery.models';
import { MOCK_GALLERY_DATA } from './mock-gallery.data';

/**
 * Servicio read-only basado únicamente en mocks.
 * No persiste estado ni permite mutaciones.
 *
 * Convención de claves:
 *  - Equipos activos:    `keyGroup = team.name`           (ej. "Echipa 1")
 *  - Composiciones históricas: `keyGroup = "<team.name>-<endDate.getTime()>"`
 *
 * Si una composición histórica no tiene entradas propias en `MOCK_GALLERY_DATA`,
 * se reutilizan automáticamente las imágenes del equipo activo con el mismo
 * nombre (fallback). Esto permite añadir imágenes para histórico de dos formas:
 *   1. Genérico — basta añadir mocks bajo la clave del equipo (ej. "Echipa 1").
 *   2. Específico para una composición concreta — añadir mocks bajo la clave
 *      compuesta `"Echipa 1-<timestamp>"`, que tendrá prioridad sobre el genérico.
 */
@Injectable({ providedIn: 'root' })
export class GalleryService {
  getByKeyGroup(keyGroup: string): GalleryItem[] {
    const direct = MOCK_GALLERY_DATA[keyGroup];
    let items = direct;
    if ((!items || items.length === 0) && this.isHistoryKey(keyGroup)) {
      const teamName = this.teamNameFromHistoryKey(keyGroup);
      items = MOCK_GALLERY_DATA[teamName] ?? [];
    }
    return (items ?? [])
      .slice()
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map(i => ({
        ...i,
        thumbnailImageSrc: i.thumbnailImageSrc || i.itemImageSrc,
      }));
  }

  /** `Echipa X-<digits>` → es una clave de composición histórica. */
  private isHistoryKey(key: string): boolean {
    return /-\d+$/.test(key);
  }

  private teamNameFromHistoryKey(key: string): string {
    return key.replace(/-\d+$/, '');
  }
}
