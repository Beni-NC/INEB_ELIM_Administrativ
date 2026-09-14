import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { PluralPipe } from '../../../core/i18n/plural.pipe';
import { AdminDataService } from '../admin-data.service';
import { ParentSort } from '../parent-options';
import { pickParents } from '../parent-fairness';
import { ScheduleEntry } from '../../../core/models';
import { LDatePipe } from '../../../core/i18n/ldate.pipe';
import { entryKey } from '../../../core/utils/schedule.utils';
import { getTeamColor, getTeamNumber } from '../../../core/utils/team.utils';
import { scheduleLineFor, withHeader } from '../../../core/utils/data-source.utils';
import { AdminCodeComponent } from '../../../shared/ui/admin-code/admin-code.component';

const SCHEDULE_FILE = 'src/app/core/data/schedule.data.ts';

/**
 * Padres de apoyo: qué programaciones futuras siguen sin padres y quién debería ir, con el
 * criterio a la vista (cuántas veces ha ayudado cada uno y cuándo fue la última). El reparto
 * automático recorre la lista ordenada, así que le toca antes a quien lleva más tiempo libre.
 */
@Component({
  selector: 'app-admin-parents-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, TranslatePipe, LDatePipe, PluralPipe, AdminCodeComponent],
  templateUrl: './parents-section.component.html',
  styleUrl: './section.css',
})
export class ParentsSectionComponent {
  /** Hijos de un padre en una línea; cadena vacía si no tiene ninguno vinculado. */
  childrenOf(id: string): string {
    return this.data.getYouthsForParent(id).map(l => l.youth.fullName).join(', ');
  }

  protected readonly admin = inject(AdminDataService);
  protected readonly data = this.admin.data;
  protected readonly getTeamColor = getTeamColor;
  protected readonly getTeamNumber = getTeamNumber;
  protected readonly entryKey = entryKey;
  protected readonly slots = [0, 1];

  readonly sorts: ParentSort[] = ['workload', 'oldest', 'name'];
  readonly sort = signal<ParentSort>('workload');
  readonly onlyWithout = signal(true);
  readonly parents = computed(() => this.admin.sortedParents(this.sort()));

  /** Programaciones futuras: todas o solo las que aún no tienen padres. */
  readonly events = computed(() =>
    this.onlyWithout() ? this.data.upcomingWithoutParents : this.data.upcomingSchedule);

  /** Asignación elegida a mano; sin entrada, vale la del propio dato (o ninguna). */
  private readonly chosen = signal<Record<string, string[]>>({});

  parentsFor(entry: ScheduleEntry): string[] {
    return this.chosen()[entryKey(entry)] ?? entry.parentSupporters ?? [];
  }

  setParent(entry: ScheduleEntry, slot: number, id: string): void {
    const next = [...this.parentsFor(entry)];
    next[slot] = id;
    this.chosen.update(all => ({ ...all, [entryKey(entry)]: next.filter(Boolean) }));
  }

  /**
   * Reparte dos padres por programación con el criterio elegido y **respetando la separación**:
   * a nadie le toca dos veces en menos de cuatro semanas si hay alternativa.
   */
  autoAssign(): void {
    const booked = new Map<string, number[]>();
    const chosen: Record<string, string[]> = {};
    for (const e of this.events()) {
      const ids = pickParents(this.admin.parentLoads(this.sort(), booked), e.date);
      for (const id of ids) booked.set(id, [...(booked.get(id) ?? []), e.date.getTime()]);
      chosen[entryKey(e)] = ids;
    }
    this.chosen.set(chosen);
  }

  clearAssignments(): void { this.chosen.set({}); }

  /** Cuántas programaciones han cambiado respecto a lo publicado. */
  readonly changed = computed(() => this.events().filter(e => {
    const now = (e.parentSupporters ?? []).join('|');
    return this.parentsFor(e).join('|') !== now;
  }));

  readonly code = computed(() => withHeader(
    `${SCHEDULE_FILE} (înlocuiește liniile cu aceleași date)`,
    this.changed().map(e => scheduleLineFor(e, { parentIds: this.parentsFor(e) })).join('\n'),
  ));

  /** Aviso por programación: sin padres o con el mismo repetido. */
  issueFor(entry: ScheduleEntry): string | null {
    const ids = this.parentsFor(entry);
    if (new Set(ids).size !== ids.length) return 'duplicate_parents';
    if (ids.length === 0) return 'no_parents';
    return null;
  }
}
