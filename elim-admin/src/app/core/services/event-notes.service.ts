import { Injectable, signal } from '@angular/core';
import { ScheduleEntry } from '../models';

/**
 * Controlează dialogul de vizualizare a notițelor pentru o programare.
 * Notițele se definesc manual în mock data (câmpul `observations`);
 * aplicația doar le afișează — nu există editare.
 */
@Injectable({ providedIn: 'root' })
export class EventNotesService {
  private readonly _open = signal<ScheduleEntry | null>(null);

  /** Programarea deschisă în dialog (sau null). */
  readonly openEntry = this._open.asReadonly();

  /** Are programarea o notiță vizibilă (din mock data)? */
  hasNotes(entry: ScheduleEntry): boolean {
    return !!entry.observations?.trim();
  }

  open(entry: ScheduleEntry): void { this._open.set(entry); }
  close(): void { this._open.set(null); }
}
