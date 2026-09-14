import { Injectable, computed, inject } from '@angular/core';
import { DataService } from '../../core/services/data.service';
import { LanguageService } from '../../core/services/language.service';
import { Parent, Youth } from '../../core/models';
import { ParentSort, ParentStat, parentOptionLabel, sortParents } from './parent-options';
import { FRIDAY, nextWeekday, startOfDay } from '../../core/utils/date.utils';

/**
 * Lo que todas las secciones del panel necesitan: la carga real de cada padre (con su última vez),
 * los miembros de cada equipo, el cálculo de viernes libres y las conversiones de fecha de los
 * `<input type="date">`. Está aquí y no en `ScheduleIndex` porque es apoyo de la herramienta, no
 * dominio de la app.
 */
@Injectable({ providedIn: 'root' })
export class AdminDataService {
  readonly data = inject(DataService);
  private readonly lang = inject(LanguageService);

  readonly teams = computed(() => this.data.teams.map(t => t.teamName));

  /** Estadística de apoyo de cada padre activo, ya lista para ordenar y etiquetar. */
  readonly parentStats = computed<ParentStat[]>(() => this.data.activeParents.map(parent => {
    const past = this.data.getPastEventsForParent(parent.id);
    const upcoming = this.data.getUpcomingEventsForParent(parent.id);
    return { parent, total: past.length + upcoming.length, upcoming: upcoming.length, last: past[0]?.date ?? null };
  }));

  sortedParents(sort: ParentSort): ParentStat[] {
    return sortParents(this.parentStats(), sort);
  }

  /** Etiqueta de un padre en un desplegable: nombre · apoyos · última vez. */
  parentLabel(stat: ParentStat, neverLabel: string): string {
    return parentOptionLabel(stat, this.lang.current(), neverLabel);
  }

  /** Nombres de la composición activa de un equipo, con el coordinador primero. */
  teamMembers(team: string): Youth[] {
    const members = this.data.getYouthsForTeam(team);
    const coord = this.data.getCoordinatorForTeam(team);
    return coord ? [coord, ...members.filter(m => m.id !== coord.id)] : members;
  }

  coordinatorOf(team: string): string {
    return this.data.getCoordinatorForTeam(team)?.fullName ?? '—';
  }

  parentById(id: string): Parent | undefined {
    return this.data.getParentById(id);
  }

  /** Fechas ya ocupadas por programaciones publicadas (en ms). */
  readonly takenDates = computed(() => new Set(this.data.sortedSchedule.map(e => e.date.getTime())));

  /**
   * Siguiente viernes libre a partir de `from`, saltando los que ya están ocupados (publicados o
   * en preparación). `strictlyAfter` fuerza avanzar al menos una semana.
   */
  nextFreeFriday(from: Date, used: ReadonlySet<number> = new Set(), strictlyAfter = false): Date {
    let friday = nextWeekday(from, FRIDAY, strictlyAfter ? 1 : 0);
    const taken = this.takenDates();
    while (taken.has(friday.getTime()) || used.has(friday.getTime())) {
      friday = nextWeekday(friday, FRIDAY, 1);
    }
    return friday;
  }

  /** Date → "aaaa-mm-dd" para `<input type="date">`. */
  toInput(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  /** "aaaa-mm-dd" → Date local a medianoche (sin sorpresas de zona horaria). */
  fromInput(value: string): Date {
    const [y, m, d] = value.split('-').map(Number);
    return Number.isFinite(y) && Number.isFinite(m) && Number.isFinite(d) ? new Date(y, m - 1, d) : startOfDay();
  }
}
