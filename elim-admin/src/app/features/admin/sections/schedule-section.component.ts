import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { AdminDataService } from '../admin-data.service';
import { CheckContext, DraftCheck, checkDraft, hasErrors } from '../draft-checks';
import { ParentSort, distributeParents } from '../parent-options';
import { ScheduleEntry } from '../../../core/models';
import { LDatePipe } from '../../../core/i18n/ldate.pipe';
import { entryKey, getEntryTimes } from '../../../core/utils/schedule.utils';
import { getTeamColor, getTeamNumber } from '../../../core/utils/team.utils';
import {
  DraftEntry, joinBlocks, removeHint, scheduleLine, scheduleLineFor, scheduleLines, toDraft, withHeader,
} from '../../../core/utils/data-source.utils';
import { AdminCodeComponent } from '../../../shared/ui/admin-code/admin-code.component';

const SCHEDULE_FILE = 'src/app/core/data/schedule.data.ts';

/** Fila de la propuesta: una programación en preparación con identidad estable para editarla. */
interface PlannerRow extends DraftEntry {
  readonly id: number;
}

/**
 * Programaciones: propone los próximos turnos siguiendo la rotación y deja **editarlo todo** fila
 * a fila (fecha —también un día que no sea viernes, si hay conferencia—, equipo, coordinador,
 * personas, observaciones, horas y padres), añadir o quitar filas y aplazar a partir de una. Cada
 * fila avisa de lo que no cuadra antes de copiar. Debajo, el editor de una programación ya
 * publicada: los mismos campos y la línea de reemplazo.
 */
@Component({
  selector: 'app-admin-schedule-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, TranslatePipe, LDatePipe, AdminCodeComponent],
  templateUrl: './schedule-section.component.html',
  styleUrl: './section.css',
})
export class ScheduleSectionComponent {
  protected readonly admin = inject(AdminDataService);
  protected readonly data = this.admin.data;
  protected readonly getTeamColor = getTeamColor;
  protected readonly getTeamNumber = getTeamNumber;
  protected readonly slots = [0, 1];

  /* ─────────── Controles del generador ─────────── */
  readonly count = signal(Math.max(this.data.teamRotation.filter(r => !r.next).length, 1));
  readonly from = signal(this.admin.toInput(this.data.today));
  readonly persons = signal(60);
  readonly withParents = signal(true);
  readonly parentSort = signal<ParentSort>('workload');
  readonly showTimes = signal(false);

  readonly parents = computed(() => this.admin.sortedParents(this.parentSort()));
  readonly sorts: ParentSort[] = ['workload', 'oldest', 'name'];

  /* ─────────── Filas en preparación ─────────── */
  private nextId = 1;
  readonly rows = signal<PlannerRow[]>([]);

  constructor() {
    this.regenerate();
  }

  /** Rehace la propuesta desde los controles (descarta las ediciones manuales). */
  regenerate(): void {
    const proposals = this.data.proposeSchedule(this.count(), this.admin.fromInput(this.from()));
    const assigned = this.withParents()
      ? distributeParents(proposals.length, this.parents().map(p => p.parent.id))
      : proposals.map(() => []);
    this.nextId = 1;
    this.rows.set(proposals.map((p, i) => ({
      id: this.nextId++,
      date: p.date,
      teamName: p.teamName,
      coordinatorName: p.coordinatorName,
      estimatedPersons: this.persons(),
      parentIds: assigned[i],
      observations: '',
    })));
  }

  /** Añade una fila al final, en el siguiente viernes libre y con el equipo que toque. */
  addRow(): void {
    const rows = this.rows();
    const used = new Set(rows.map(r => r.date.getTime()));
    const last = rows.at(-1);
    const date = this.admin.nextFreeFriday(last?.date ?? this.admin.fromInput(this.from()), used, !!last);
    const order = this.data.teamRotation.map(r => r.teamName);
    const nextTeam = order[(order.indexOf(last?.teamName ?? order[0]) + 1) % order.length] ?? order[0] ?? '';
    this.rows.update(list => [...list, {
      id: this.nextId++,
      date,
      teamName: nextTeam,
      coordinatorName: this.admin.coordinatorOf(nextTeam),
      estimatedPersons: this.persons(),
      parentIds: [],
      observations: '',
    }]);
  }

  removeRow(id: number): void {
    this.rows.update(list => list.filter(r => r.id !== id));
  }

  /**
   * "Ese viernes no hay programa": mueve esta fila y todas las siguientes al próximo viernes libre,
   * conservando el orden y los equipos.
   */
  postponeFrom(id: number): void {
    const rows = this.rows();
    const start = rows.findIndex(r => r.id === id);
    if (start === -1) return;
    const used = new Set(rows.slice(0, start).map(r => r.date.getTime()));
    const shifted = rows.map((row, i) => {
      if (i < start) return row;
      const date = this.admin.nextFreeFriday(row.date, used, true);
      used.add(date.getTime());
      return { ...row, date };
    });
    this.rows.set(shifted);
  }

  /** Cambia un campo de una fila; al cambiar de equipo, el coordinador sigue al del equipo. */
  patchRow(id: number, patch: Partial<DraftEntry>): void {
    this.rows.update(list => list.map(r => {
      if (r.id !== id) return r;
      const next = { ...r, ...patch };
      if (patch.teamName && patch.teamName !== r.teamName) next.coordinatorName = this.admin.coordinatorOf(patch.teamName);
      return next;
    }));
  }

  setRowDate(id: number, value: string): void { this.patchRow(id, { date: this.admin.fromInput(value) }); }

  setRowParent(id: number, slot: number, parentId: string): void {
    const row = this.rows().find(r => r.id === id);
    if (!row) return;
    const parentIds = [...row.parentIds];
    parentIds[slot] = parentId;
    this.patchRow(id, { parentIds: parentIds.filter(Boolean) });
  }

  dateInput(d: Date): string { return this.admin.toInput(d); }

  /* ─────────── Avisos ─────────── */

  private checkContext(rows: readonly DraftEntry[], row: DraftEntry, ignore?: ScheduleEntry): CheckContext {
    const taken = new Set(this.admin.takenDates());
    if (ignore) taken.delete(ignore.date.getTime());
    return {
      takenDates: taken,
      otherDraftDates: rows.filter(r => r !== row).map(r => r.date.getTime()),
      today: this.data.today,
      teamMembers: this.admin.teamMembers(row.teamName).map(y => y.fullName),
    };
  }

  readonly checksByRow = computed<Map<number, DraftCheck[]>>(() => {
    const rows = this.rows();
    return new Map(rows.map(row => [row.id, checkDraft(row, this.checkContext(rows, row))]));
  });

  checksFor(id: number): DraftCheck[] { return this.checksByRow().get(id) ?? []; }
  rowHasErrors(id: number): boolean { return hasErrors(this.checksFor(id)); }

  readonly errorCount = computed(() => [...this.checksByRow().values()].filter(hasErrors).length);
  readonly warningCount = computed(() =>
    [...this.checksByRow().values()].filter(cs => !hasErrors(cs) && cs.length > 0).length);

  /* ─────────── Código generado ─────────── */

  readonly code = computed(() => {
    const rows = [...this.rows()].sort((a, b) => a.date.getTime() - b.date.getTime());
    return withHeader(SCHEDULE_FILE, scheduleLines(rows));
  });

  /* ═══════════ Editor de una programación publicada ═══════════ */

  readonly editableEvents = computed(() => [...this.data.sortedSchedule].reverse());
  readonly editingKey = signal('');
  readonly editing = computed(() => this.editableEvents().find(e => entryKey(e) === this.editingKey()) ?? null);
  private readonly edits = signal<Partial<DraftEntry>>({});

  /** Valores del formulario: lo editado o lo que ya tiene la programación. */
  readonly editDraft = computed<DraftEntry | null>(() => {
    const entry = this.editing();
    if (!entry) return null;
    const base = toDraft(entry);
    const times = getEntryTimes(entry);
    return {
      ...base,
      programStartTime: base.programStartTime ?? times.programStart,
      youthsArrivalTime: base.youthsArrivalTime ?? times.youthsArrival,
      parentsFoodArrivalTime: base.parentsFoodArrivalTime ?? times.parentsFoodArrival,
      ...this.edits(),
    };
  });

  selectEvent(key: string): void {
    this.editingKey.set(key);
    this.edits.set({});
  }

  patchEdit(patch: Partial<DraftEntry>): void {
    const draft = this.editDraft();
    if (patch.teamName && draft && patch.teamName !== draft.teamName) {
      patch = { ...patch, coordinatorName: this.admin.coordinatorOf(patch.teamName) };
    }
    this.edits.update(e => ({ ...e, ...patch }));
  }

  setEditParent(slot: number, parentId: string): void {
    const draft = this.editDraft();
    if (!draft) return;
    const parentIds = [...draft.parentIds];
    parentIds[slot] = parentId;
    this.patchEdit({ parentIds: parentIds.filter(Boolean) });
  }

  readonly editChecks = computed<DraftCheck[]>(() => {
    const draft = this.editDraft();
    const entry = this.editing();
    return draft && entry ? checkDraft(draft, this.checkContext([], draft, entry)) : [];
  });

  readonly editCode = computed(() => {
    const entry = this.editing();
    const draft = this.editDraft();
    if (!entry || !draft) return '';
    return withHeader(`${SCHEDULE_FILE} (înlocuiește linia din ${this.dateInput(entry.date)})`, scheduleLine(draft));
  });

  /** Programación anulada: no hay línea que pegar, sino una que quitar. */
  readonly removeCode = computed(() => {
    const entry = this.editing();
    return entry ? joinBlocks(removeHint(SCHEDULE_FILE, `${entry.team} · ${this.dateInput(entry.date)}`),
      `//${scheduleLineFor(entry)}`) : '';
  });
}
