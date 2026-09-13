import { Injectable, computed, signal } from '@angular/core';
import { ScheduleIndex } from '../domain/schedule-index';
import { Youth, YouthFilter } from '../models';
import { startOfDay } from '../utils/date.utils';

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

  /** Jóvenes activos que pasan búsqueda y filtro. */
  readonly filteredYouths = computed<Youth[]>(() => {
    const term = this._youthSearch().trim().toLowerCase();
    const filter = this._youthFilter();
    if (!term && filter === 'toti') return this.activeYouths;
    return this.activeYouths.filter(y => {
      const isCoord = this.isActiveCoordinator(y.id);
      if (filter === 'coordonatori' && !isCoord) return false;
      if (filter === 'membri' && isCoord) return false;
      return !term || y.fullName.toLowerCase().includes(term);
    });
  });

  constructor() {
    super(startOfDay());
  }

  setYouthSearch(value: string): void { this._youthSearch.set(value); }
  setYouthFilter(value: YouthFilter): void { this._youthFilter.set(value); }
  clearYouthSearch(): void { this._youthSearch.set(''); }
}
