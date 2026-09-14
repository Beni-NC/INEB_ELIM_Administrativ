import { Injectable, computed, inject, signal } from '@angular/core';
import { DataService } from './data.service';

const STORAGE_KEY = 'app.team';

/**
 * "Echipa mea": el usuario elige su equipo una vez (botón en Echipe) y la app se lo guarda en el
 * dispositivo, igual que el tema. Con él la portada responde a la pregunta de casi todo el que
 * abre la app — "¿cuándo me toca?" — y Tineri puede filtrar por su equipo. Si el equipo guardado
 * deja de existir (se reorganizan los equipos), se ignora sin más.
 */
@Injectable({ providedIn: 'root' })
export class MyTeamService {
  private readonly data = inject(DataService);
  private readonly _team = signal<string | null>(this.read());

  /** Nombre del equipo elegido, o null si no hay (o ya no existe). */
  readonly team = computed(() => {
    const t = this._team();
    return t && this.data.teams.some(c => c.teamName === t) ? t : null;
  });

  isMine(teamName: string): boolean { return this.team() === teamName; }

  /** Marca el equipo; volver a marcar el mismo lo desmarca. */
  toggle(teamName: string): void {
    const next = this._team() === teamName ? null : teamName;
    this._team.set(next);
    try {
      if (next) localStorage.setItem(STORAGE_KEY, next); else localStorage.removeItem(STORAGE_KEY);
    } catch { /* sin almacenamiento: la elección dura la sesión */ }
  }

  private read(): string | null {
    try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
  }
}
