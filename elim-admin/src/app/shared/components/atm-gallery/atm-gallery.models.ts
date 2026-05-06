/**
 * Modelo de un elemento de la galería.
 * Compatible con `data:` URLs y URLs externas.
 */
export interface GalleryItem {
  /** Identificador único interno (timestamp + random). */
  id: string;
  /** Identificador del grupo al que pertenece (ej. nombre del equipo). */
  keyGroup: string;
  /** Fuente principal: data URL o https. */
  itemImageSrc: string;
  /** Fuente para miniatura (si difiere). Por defecto = itemImageSrc. */
  thumbnailImageSrc?: string;
  title?: string;
  description?: string;
  /** Marca esta imagen como predeterminada del grupo. */
  isDefault?: boolean;
  /** Orden manual dentro del grupo (asc). */
  sortOrder: number;
  /** ISO-8601 con la fecha de subida/actualización. */
  uploadedAt: string;
}

/** Estado del archivo en cola para subida. */
export interface PendingUploadFile {
  file: File;
  previewSrc: string;
  title: string;
  description: string;
  isDefault: boolean;
}
