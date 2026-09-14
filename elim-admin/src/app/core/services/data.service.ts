import { Injectable, computed, inject, signal } from '@angular/core';
import { ScheduleIndex } from '../domain/schedule-index';
import { Youth, YouthFilter } from '../models';
import { startOfDay } from '../utils/date.utils';
import { APP_DATA, APP_TODAY } from '../tokens';
import { normalizeForSearch } from '../utils/text.utils';

/**
 * Acceso a los datos desde la app: el índice de dominio (`ScheduleIndex`, sin Angular) más el
 * único estado reactivo de UI que depende de la interacción (búsqueda y filtro de jóvenes).
 */
@Injectable({ providedIn: 'root' })
export class DataService extends ScheduleIndex {
  private readonly _youthSearch = signal('');
  private readonly _youthFilter = signal<YouthFilter>('toti');
  readonly youthSearch = this._youthSearch.asReadonly();
  readonly youthFilter = this._youthFilter.asReadonly();

  /**
   * Jóvenes activos que pasan búsqueda y filtro. La búsqueda ignora diacríticos y también
   * encuentra por equipo ("echipa 4" o simplemente "4" lista a sus miembros).
   */
  readonly filteredYouths = computed<Youth[]>(() => {
    const term = normalizeForSearch(this._youthSearch());
    const filter = this._youthFilter();
    if (!term && filter === 'toti') return this.activeYouths;
    return this.activeYouths.filter(y => {
      const isCoord = this.isActiveCoordinator(y.id);
      if (filter === 'coordonatori' && !isCoord) return false;
      if (filter === 'membri' && isCoord) return false;
      return !term || this.searchKey(y).includes(term);
    });
  });

  /** Texto normalizado sobre el que se busca: nombre + equipos activos. Se calcula una vez por joven. */
  private readonly searchKeys = new Map<string, string>();
  private searchKey(y: Youth): string {
    let key = this.searchKeys.get(y.id);
    if (key === undefined) {
      const teams = this.getActiveTeamsForYouth(y.id).map(t => t.teamName).join(' ');
      key = normalizeForSearch(`${y.fullName} ${teams}`);
      this.searchKeys.set(y.id, key);
    }
    return key;
  }

  constructor() {
    // Sin providers explícitos (la app): fecha real y datos reales. Los tests inyectan los suyos.
    super(inject(APP_TODAY, { optional: true }) ?? startOfDay(), inject(APP_DATA, { optional: true }) ?? undefined);
  }

  setYouthSearch(value: string): void { this._youthSearch.set(value); }
  setYouthFilter(value: YouthFilter): void { this._youthFilter.set(value); }
  clearYouthSearch(): void { this._youthSearch.set(''); }
}
