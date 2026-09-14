import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { PluralPipe } from '../../../core/i18n/plural.pipe';
import { AdminDataService } from '../admin-data.service';
import { CheckContext, DraftCheck, checkDraft, hasErrors } from '../draft-checks';
import { ParentSort } from '../parent-options';
import { MIN_GAP_DAYS, SlotAdvice, adviseSlot, clashes, crowdedParents, pickParents } from '../parent-fairness';
import { ScheduleEntry } from '../../../core/models';
import { LDatePipe } from '../../../core/i18n/ldate.pipe';
import { entryKey, getEntryTimes } from '../../../core/utils/schedule.utils';
import { getTeamColor, getTeamNumber } from '../../../core/utils/team.utils';
import {
  DraftEntry, joinBlocks, removeHint, scheduleLine, scheduleLineFor, scheduleLines, toDraft, todoComment, withHeader,
} from '../../../core/utils/data-source.utils';
import { TranslateService } from '@ngx-translate/core';
import { AdminCodeComponent } from '../../../shared/ui/admin-code/admin-code.component';

const SCHEDULE_FILE = 'src/app/core/data/schedule.data.ts';

/** Fila de la propuesta: una programación en preparación con identidad estable para editarla. */
interface PlannerRow extends DraftEntry {
  readonly id: number;
}

/** Consejo de un hueco de padre, ya con el nombre resuelto para poder enseñarlo. */
interface SlotHint extends SlotAdvice {
  readonly name: string;
}

/** Una programación del resumen "quién ayuda y cuándo": publicada o en preparación. */
interface AgendaRow {
  readonly time: number;
  readonly date: Date;
  readonly teamName: string;
  readonly parents: readonly { readonly id: string; readonly name: string }[];
  /** Clave de la programación publicada; vacía si es una fila en preparación. */
  readonly key: string;
  /** Id de la fila en preparación; `undefined` si ya está publicada. */
  readonly rowId?: number;
  readonly draft: boolean;
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
  imports: [FormsModule, TranslatePipe, LDatePipe, PluralPipe, AdminCodeComponent],
  templateUrl: './schedule-section.component.html',
  styleUrl: './section.css',
})
export class ScheduleSectionComponent {
  protected readonly admin = inject(AdminDataService);
  protected readonly data = this.admin.data;
  protected readonly getTeamColor = getTeamColor;
  protected readonly getTeamNumber = getTeamNumber;
  protected readonly slots = [0, 1];
  private readonly translate = inject(TranslateService);

  /** Avisos de todas las filas, escritos como TODO dentro del código (la estructura sale igual). */
  private todoOf(checks: readonly { key: string }[]): string {
    return todoComment([...new Set(checks.map(c => this.translate.instant(`admin.check.${c.key}`) as string))]);
  }

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
    const booked = new Map<string, number[]>();
    this.nextId = 1;
    this.rows.set(proposals.map(p => ({
      id: this.nextId++,
      date: p.date,
      teamName: p.teamName,
      coordinatorName: p.coordinatorName,
      estimatedPersons: this.persons(),
      // Se reparte fila a fila: cada una ya cuenta con lo repartido en las anteriores.
      parentIds: this.withParents() ? this.takeParents(p.date, booked) : [],
      observations: '',
    })));
  }

  /**
   * Elige los padres de una fecha y los apunta en `booked`, para que la siguiente fila ya los
   * tenga en cuenta. `booked` arranca vacío y acumula solo lo de esta tanda; el historial real lo
   * pone `parentLoads`.
   */
  private takeParents(date: Date, booked: Map<string, number[]>): string[] {
    const ids = pickParents(this.admin.parentLoads(this.parentSort(), booked), date);
    for (const id of ids) booked.set(id, [...(booked.get(id) ?? []), date.getTime()]);
    return ids;
  }

  /** Lo ya repartido en las filas de la tanda, por padre. */
  private bookedInDrafts(skipRowId?: number): Map<string, number[]> {
    const booked = new Map<string, number[]>();
    for (const row of this.rows()) {
      if (row.id === skipRowId) continue;
      for (const id of row.parentIds) booked.set(id, [...(booked.get(id) ?? []), row.date.getTime()]);
    }
    return booked;
  }

  /** Los padres que tocarían ahora mismo para esa fecha, con todo lo demás ya contado. */
  private suggestedParents(date: Date): string[] {
    return this.withParents() ? this.takeParents(date, this.bookedInDrafts()) : [];
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
      parentIds: this.suggestedParents(date),
      observations: '',
    }]);
  }

  removeRow(id: number): void {
    this.rows.update(list => list.filter(r => r.id !== id));
  }

  /**
   * Rellena solo las filas que se quedaron sin padres (al activar el reparto o al cambiar el
   * criterio). Lo elegido a mano no se toca nunca.
   */
  fillMissingParents(): void {
    if (!this.withParents()) return;
    const booked = this.bookedInDrafts();
    this.rows.update(list => list.map(row =>
      row.parentIds.length > 0 ? row : { ...row, parentIds: this.takeParents(row.date, booked) }));
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

  /* ─────────── Consejo de cada hueco de padre ─────────── */

  /**
   * Quién iría mejor en ese hueco, contando todo lo que ya hay (historial y el resto de la tanda) y
   * sin los padres que ocupan los otros huecos de esa misma programación.
   */
  private slotAdvice(date: Date, parentIds: readonly string[], slot: number,
                     booked: Map<string, number[]>, skipKey = ''): SlotHint {
    const others = parentIds.filter((_, i) => i !== slot);
    const pool = this.admin.parentLoads(this.parentSort(), booked, skipKey).filter(p => !others.includes(p.id));
    const advice = adviseSlot(pool, date, parentIds[slot] ?? '');
    return { ...advice, name: this.admin.parentById(advice.suggestionId)?.name ?? '' };
  }

  /** El consejo de todos los huecos de la tanda, de una pasada, indexado por `fila:hueco`. */
  private readonly slotHints = computed(() => {
    const hints = new Map<string, SlotHint>();
    for (const row of this.rows()) {
      const booked = this.bookedInDrafts(row.id);
      for (const slot of this.slots) {
        hints.set(`${row.id}:${slot}`, this.slotAdvice(row.date, row.parentIds, slot, booked));
      }
    }
    return hints;
  });

  hintFor(rowId: number, slot: number): SlotHint | undefined {
    return this.slotHints().get(`${rowId}:${slot}`);
  }

  /** Pone en ese hueco el padre aconsejado; al pulsar otra vez pasa a la siguiente alternativa. */
  suggestRowParent(rowId: number, slot: number): void {
    const id = this.hintFor(rowId, slot)?.suggestionId;
    if (id) this.setRowParent(rowId, slot, id);
  }

  /** Qué dice el botón: si quien está ayuda demasiado pronto y a quién se propone en su lugar. */
  slotTitle(hint: SlotHint): string {
    const when = hint.tooSoon ? this.translate.instant('admin.slot_too_soon', { days: hint.gapDays }) as string : '';
    const who = hint.name ? this.translate.instant('admin.slot_suggest', { name: hint.name }) as string : '';
    return [when, who].filter(Boolean).join(' · ');
  }

  dateInput(d: Date): string { return this.admin.toInput(d); }

  /** Padres del turno, en una línea; cadena vacía si aún no hay ninguno. */
  parentsOf(entry: ScheduleEntry): string {
    return this.data.getParentsForEvent(entry).map(p => p.name).join(' · ');
  }

  /** Días de espera del que más lleva, para dibujar la barra en proporción. */
  private readonly maxWait = computed(() =>
    Math.max(1, ...this.data.teamRotation.map(r => r.daysSinceLast ?? 0)));

  /** Porcentaje de la barra de espera (sin datos → llena: nunca ha salido, es el que más "espera"). */
  waitShare(days: number | null): number {
    return days === null ? 100 : Math.round((days / this.maxWait()) * 100);
  }

  /* ─────────── Resumen: quién ayuda y cuándo ─────────── */

  readonly showAgenda = signal(true);

  /**
   * Cambios hechos sobre programaciones **ya publicadas** desde el propio resumen: clave de la
   * programación → padres nuevos. No tocan los datos (eso se hace pegando el código); aquí sirven
   * para que el aviso desaparezca y para sacar abajo la línea que la reemplaza.
   */
  private readonly publishedEdits = signal<Record<string, readonly string[]>>({});

  /** Padres de una programación publicada, con el cambio pendiente si lo tiene. */
  private parentIdsOf(entry: ScheduleEntry): readonly string[] {
    return this.publishedEdits()[entryKey(entry)] ?? entry.parentSupporters ?? [];
  }

  /**
   * Lo publicado y lo que se está preparando, en una sola línea temporal: fecha, equipo y padres.
   * Es lo que hay que mirar para repartir sin cargar siempre a los mismos ni repetir a alguien dos
   * viernes seguidos; por eso incluye las filas en borrador, marcadas como nuevas.
   */
  readonly agenda = computed<AgendaRow[]>(() => {
    const named = (ids: readonly string[]): AgendaRow['parents'] =>
      ids.map(id => ({ id, name: this.admin.parentById(id)?.name ?? id }));
    const published: AgendaRow[] = this.data.upcomingSchedule.map(e => ({
      time: e.date.getTime(),
      date: e.date,
      teamName: e.team,
      parents: named(this.parentIdsOf(e)),
      key: entryKey(e),
      draft: false,
    }));
    const drafts: AgendaRow[] = this.rows().map(r => ({
      time: r.date.getTime(),
      date: r.date,
      teamName: r.teamName,
      parents: named(r.parentIds),
      key: '',
      rowId: r.id,
      draft: true,
    }));
    return [...published, ...drafts].sort((a, b) => a.time - b.time);
  });

  /**
   * Choques que todavía se pueden arreglar: dos apoyos de la misma persona a menos de cuatro
   * semanas, cuando el segundo no está ya en el pasado. Cuenta el historial completo, no solo lo
   * que se ve arriba: lo que molesta es repetir, aunque la vez anterior fuera antes de hoy.
   */
  private readonly clashes = computed(() => {
    const assignments = [
      ...this.data.sortedSchedule.map(e => ({ date: e.date, parentIds: this.parentIdsOf(e) })),
      ...this.rows().map(r => ({ date: r.date, parentIds: r.parentIds })),
    ];
    return clashes(assignments, MIN_GAP_DAYS).filter(c => c.time >= this.data.today.getTime());
  });

  /** Quién ayuda demasiado seguido, con su separación más justa. */
  readonly crowded = computed(() => crowdedParents(this.clashes())
    .map(c => ({ ...c, name: this.admin.parentById(c.id)?.name ?? c.id })));

  readonly crowdedNames = computed(() => this.crowded().map(c => `${c.name} · ${c.gapDays}z`));

  isCrowded(id: string): boolean {
    return this.crowded().some(c => c.id === id);
  }

  /**
   * Con quién se podría cambiar cada nombre en ámbar del resumen. Se calcula ahí mismo para que el
   * aviso y su arreglo estén en el mismo sitio: un clic en el nombre pone al recambio.
   */
  private readonly agendaFixes = computed(() => {
    const fixes = new Map<string, SlotHint>();
    const crowded = new Set(this.crowded().map(c => c.id));
    if (crowded.size === 0) return fixes;
    for (const row of this.agenda()) {
      const ids = row.parents.map(p => p.id);
      row.parents.forEach((p, slot) => {
        if (!crowded.has(p.id)) return;
        // En una fila en preparación se salta su propia fecha; en una publicada, su propia línea.
        fixes.set(`${row.time}:${p.id}`,
          this.slotAdvice(row.date, ids, slot, this.bookedInDrafts(row.rowId), row.key));
      });
    }
    return fixes;
  });

  fixFor(row: AgendaRow, parentId: string): SlotHint | undefined {
    return this.agendaFixes().get(`${row.time}:${parentId}`);
  }

  /**
   * Cambia a ese padre por el recambio aconsejado. Si la programación se está preparando, se
   * cambia en su fila; si ya está publicada, se anota como cambio pendiente y abajo aparece la
   * línea que la reemplaza —se pega a mano, como todo lo demás—.
   */
  applyFix(row: AgendaRow, parentId: string): void {
    const suggestion = this.fixFor(row, parentId)?.suggestionId;
    const slot = row.parents.findIndex(p => p.id === parentId);
    if (!suggestion || slot === -1) return;
    if (row.rowId !== undefined) {
      this.setRowParent(row.rowId, slot, suggestion);
      return;
    }
    const parentIds = row.parents.map(p => p.id);
    parentIds[slot] = suggestion;
    this.publishedEdits.update(edits => ({ ...edits, [row.key]: parentIds }));
    this.showEdits.set(true);
  }

  /* ─────────── Cambios pendientes sobre programaciones publicadas ─────────── */

  readonly showEdits = signal(false);

  /**
   * Las programaciones publicadas que se han cambiado, ya como borrador. La que esté abierta en el
   * editor de abajo se queda fuera: allí sale su propia línea y no deben salir dos para la misma.
   */
  readonly editedPublished = computed(() => {
    const edits = this.publishedEdits();
    const open = this.editingKey();
    return this.data.sortedSchedule
      .filter(e => edits[entryKey(e)] && entryKey(e) !== open)
      .map(e => ({ entry: e, draft: { ...toDraft(e), parentIds: [...edits[entryKey(e)]] } }));
  });

  /** Las líneas que reemplazan a esas programaciones, listas para pegar. */
  readonly publishedCode = computed(() => {
    const list = this.editedPublished();
    if (list.length === 0) return '';
    const dates = list.map(x => this.dateInput(x.entry.date)).join(', ');
    return withHeader(`${SCHEDULE_FILE} (înlocuiește liniile din ${dates})`, scheduleLines(list.map(x => x.draft)));
  });

  /** Nombres de los padres de una programación cambiada, para verla sin leer el código. */
  parentNames(ids: readonly string[]): string {
    return ids.map(id => this.admin.parentById(id)?.name ?? id).join(' · ');
  }

  clearPublishedEdits(): void {
    this.publishedEdits.set({});
  }

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
    const checks = [...this.checksByRow().values()].flat().filter(c => c.level === 'error');
    return this.todoOf(checks) + withHeader(SCHEDULE_FILE, scheduleLines(rows));
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
    const base = { ...toDraft(entry), parentIds: [...this.parentIdsOf(entry)] };
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

  /**
   * Consejo de los dos huecos de padre de la programación que se está editando. La propia
   * programación no cuenta como carga de sus padres: se descarta por su clave.
   */
  readonly editHints = computed<SlotHint[]>(() => {
    const draft = this.editDraft();
    const entry = this.editing();
    if (!draft || !entry) return [];
    return this.slots.map(slot => this.slotAdvice(draft.date, draft.parentIds, slot, new Map(), entryKey(entry)));
  });

  suggestEditParent(slot: number): void {
    const id = this.editHints()[slot]?.suggestionId;
    if (id) this.setEditParent(slot, id);
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
    return this.todoOf(this.editChecks().filter(c => c.level === 'error'))
      + withHeader(`${SCHEDULE_FILE} (înlocuiește linia din ${this.dateInput(entry.date)})`, scheduleLine(draft));
  });

  /** Programación anulada: no hay línea que pegar, sino una que quitar. */
  readonly removeCode = computed(() => {
    const entry = this.editing();
    return entry ? joinBlocks(removeHint(SCHEDULE_FILE, `${entry.team} · ${this.dateInput(entry.date)}`),
      `//${scheduleLineFor(entry)}`) : '';
  });
}
