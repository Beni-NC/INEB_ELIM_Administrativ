import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { AdminDataService } from '../admin-data.service';
import { ParentSort } from '../parent-options';
import { Parent, ParentYouthLink, ProgramType, Relationship, ScheduleEntry, Youth, YouthRole, YouthTeamMembership } from '../../../core/models';
import { LDatePipe } from '../../../core/i18n/ldate.pipe';
import { entryKey } from '../../../core/utils/schedule.utils';
import { normalizeForSearch } from '../../../core/utils/text.utils';
import { getTeamColor, getTeamNumber } from '../../../core/utils/team.utils';
import {
  DraftEntry, DraftParent, DraftYouth, closeMembershipLine, dateLiteral, joinBlocks, membershipLine,
  parentBlockFor, parentYouthLinkLine, removeHint, scheduleLine, toDraft, toParentDraft, toYouthDraft,
  withHeader, youthLine,
} from '../../../core/utils/data-source.utils';
import { AdminCodeComponent } from '../../../shared/ui/admin-code/admin-code.component';

/** Las cinco tablas que se editan a mano en `core/data`. */
export type Entity = 'schedule' | 'youths' | 'parents' | 'memberships' | 'links';

const FILES: Record<Entity, string> = {
  schedule: 'src/app/core/data/schedule.data.ts',
  youths: 'src/app/core/data/youths.data.ts',
  parents: 'src/app/core/data/parents.data.ts',
  memberships: 'src/app/core/data/memberships.data.ts',
  links: 'src/app/core/data/parents.data.ts (PARENT_YOUTH_LINKS)',
};

/**
 * **Datele** — el visor de los datos tal y como están en los ficheros: las cinco tablas, registro a
 * registro, con un formulario que abre cada uno y **todos sus campos editables**. Al cambiar algo
 * sale la línea exacta que hay que sustituir; con "Șterge", la instrucción de lo que hay que
 * borrar (incluidas las filas que dependen de ese registro, que es donde se cometen los errores).
 *
 * Las demás secciones resuelven un flujo concreto (proponer turnos, dar de alta, recomponer un
 * equipo); esta es la vista cruda para cuando hay que corregir un dato suelto.
 */
@Component({
  selector: 'app-admin-data-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, FormsModule, TranslatePipe, LDatePipe, AdminCodeComponent],
  templateUrl: './data-section.component.html',
  styleUrl: './section.css',
})
export class DataSectionComponent {
  protected readonly admin = inject(AdminDataService);
  protected readonly data = this.admin.data;
  private readonly translate = inject(TranslateService);
  protected readonly getTeamColor = getTeamColor;
  protected readonly getTeamNumber = getTeamNumber;
  protected readonly entryKey = entryKey;

  readonly entities: Entity[] = ['schedule', 'youths', 'parents', 'memberships', 'links'];
  readonly entity = signal<Entity>('schedule');
  readonly search = signal('');
  /** Clave del registro abierto; solo uno a la vez, como en la app. */
  readonly openKey = signal('');

  readonly relationships: Relationship[] = ['mother', 'father', 'guardian'];
  readonly roles: YouthRole[] = ['membru', 'coordonator'];
  readonly programTypes: ProgramType[] = ['youth_evening'];
  readonly parentsSorted = computed(() => this.admin.sortedParents('name' as ParentSort));

  selectEntity(entity: Entity): void {
    this.entity.set(entity);
    this.openKey.set('');
    this.search.set('');
  }

  private matches(text: string): boolean {
    const term = normalizeForSearch(this.search());
    return !term || normalizeForSearch(text).includes(term);
  }

  /* ═══════════ Programaciones ═══════════ */

  readonly schedule = computed(() => [...this.data.sortedSchedule].reverse()
    .filter(e => this.matches(`${e.team} ${e.coordinator} ${e.date.getFullYear()} ${e.observations}`)));

  readonly entryDraft = signal<DraftEntry | null>(null);
  private editedEntry: ScheduleEntry | null = null;

  openEntry(e: ScheduleEntry): void {
    const key = entryKey(e);
    if (this.openKey() === key) { this.close(); return; }
    this.openKey.set(key);
    this.editedEntry = e;
    this.entryDraft.set(toDraft(e));
  }

  patchEntry(patch: Partial<DraftEntry>): void {
    const d = this.entryDraft();
    if (d) this.entryDraft.set({ ...d, ...patch });
  }

  setEntryParent(slot: number, id: string): void {
    const d = this.entryDraft();
    if (!d) return;
    const parentIds = [...d.parentIds];
    parentIds[slot] = id;
    this.patchEntry({ parentIds: parentIds.filter(Boolean) });
  }

  /* ═══════════ Jóvenes ═══════════ */

  readonly youths = computed(() => this.data.youthsSorted
    .filter(y => this.matches(`${y.fullName} ${this.data.getActiveTeamsForYouth(y.id).map(t => t.teamName).join(' ')}`)));

  readonly youthDraft = signal<DraftYouth | null>(null);
  private editedYouth: Youth | null = null;

  openYouth(y: Youth): void {
    if (this.openKey() === y.id) { this.close(); return; }
    this.openKey.set(y.id);
    this.editedYouth = y;
    this.youthDraft.set(toYouthDraft(y));
  }

  patchYouth(patch: Partial<DraftYouth>): void {
    const d = this.youthDraft();
    if (d) this.youthDraft.set({ ...d, ...patch });
  }

  /* ═══════════ Padres ═══════════ */

  readonly parents = computed(() => this.data.parents
    .filter(p => this.matches(`${p.name} ${this.data.getYouthsForParent(p.id).map(l => l.youth.fullName).join(' ')}`)));

  /** Hijos de un padre en una línea; vacío si no tiene. */
  childrenOf(id: string): string {
    return this.data.getYouthsForParent(id).map(l => l.youth.fullName).join(', ');
  }

  readonly parentDraft = signal<DraftParent | null>(null);
  private editedParent: Parent | null = null;

  openParent(p: Parent): void {
    if (this.openKey() === p.id) { this.close(); return; }
    this.openKey.set(p.id);
    this.editedParent = p;
    this.parentDraft.set(toParentDraft(p));
  }

  patchParent(patch: Partial<DraftParent>): void {
    const d = this.parentDraft();
    if (d) this.parentDraft.set({ ...d, ...patch });
  }

  /* ═══════════ Pertenencias ═══════════ */

  readonly memberships = computed(() => this.admin.raw.memberships
    .map((m, index) => ({ m, index, name: this.data.getYouthById(m.youthId)?.fullName ?? m.youthId }))
    .filter(row => this.matches(`${row.name} ${row.m.teamName} ${row.m.role}`)));

  readonly membershipDraft = signal<YouthTeamMembership | null>(null);
  private editedMembership: YouthTeamMembership | null = null;

  openMembership(m: YouthTeamMembership, index: number): void {
    const key = `m-${index}`;
    if (this.openKey() === key) { this.close(); return; }
    this.openKey.set(key);
    this.editedMembership = m;
    this.membershipDraft.set({ ...m });
  }

  patchMembership(patch: Partial<YouthTeamMembership>): void {
    const d = this.membershipDraft();
    if (d) this.membershipDraft.set({ ...d, ...patch });
  }

  /* ═══════════ Vínculos ═══════════ */

  readonly links = computed(() => this.admin.raw.parentYouthLinks
    .map((l, index) => ({
      l, index,
      parent: this.data.getParentById(l.parentId)?.name ?? l.parentId,
      youth: this.data.getYouthById(l.youthId)?.fullName ?? l.youthId,
    }))
    .filter(row => this.matches(`${row.parent} ${row.youth}`)));

  readonly linkDraft = signal<ParentYouthLink | null>(null);
  private editedLink: ParentYouthLink | null = null;

  openLink(l: ParentYouthLink, index: number): void {
    const key = `l-${index}`;
    if (this.openKey() === key) { this.close(); return; }
    this.openKey.set(key);
    this.editedLink = l;
    this.linkDraft.set({ ...l });
  }

  patchLink(patch: Partial<ParentYouthLink>): void {
    const d = this.linkDraft();
    if (d) this.linkDraft.set({ ...d, ...patch });
  }

  /* ═══════════ Común ═══════════ */

  close(): void {
    this.openKey.set('');
    this.entryDraft.set(null);
    this.youthDraft.set(null);
    this.parentDraft.set(null);
    this.membershipDraft.set(null);
    this.linkDraft.set(null);
    this.removing.set(false);
  }

  /** Modo borrar: en vez de la línea de reemplazo, la instrucción de lo que hay que quitar. */
  readonly removing = signal(false);

  isOpen(key: string): boolean { return this.openKey() === key; }

  dateInput(d: Date | undefined): string { return d ? this.admin.toInput(d) : ''; }

  /** Código de la edición abierta: sustitución o, en modo borrar, lo que hay que eliminar. */
  readonly code = computed(() => {
    if (!this.openKey()) return '';
    return this.removing() ? this.removeCode() : this.replaceCode();
  });

  private replaceCode(): string {
    switch (this.entity()) {
      case 'schedule': {
        const d = this.entryDraft();
        if (!d || !this.editedEntry) return '';
        return withHeader(`${FILES.schedule} (înlocuiește linia din ${this.dateInput(this.editedEntry.date)})`, scheduleLine(d));
      }
      case 'youths': {
        const d = this.youthDraft();
        if (!d || !this.editedYouth) return '';
        return withHeader(`${FILES.youths} (înlocuiește linia lui ${this.editedYouth.fullName})`, youthLine(d));
      }
      case 'parents': {
        const d = this.parentDraft();
        if (!d || !this.editedParent) return '';
        return withHeader(`${FILES.parents} (înlocuiește blocul lui ${this.editedParent.name})`, parentBlockFor(this.editedParent, d));
      }
      case 'memberships': {
        const d = this.membershipDraft();
        if (!d) return '';
        const line = d.active
          ? membershipLine(d.youthId, d.teamName, d.role)
          : closeMembershipLine(d.youthId, d.teamName, d.endDate ?? this.data.today, d.role);
        return withHeader(`${FILES.memberships} (înlocuiește linia)`, line);
      }
      case 'links': {
        const d = this.linkDraft();
        if (!d) return '';
        return withHeader(`${FILES.links} (înlocuiește linia)`, parentYouthLinkLine(d.parentId, d.youthId, d.relationship));
      }
    }
  }

  /**
   * Qué hay que borrar. Se listan también las filas que dependen del registro: al quitar un joven
   * hay que quitar sus pertenencias y sus vínculos, que es justo lo que se olvida.
   */
  private removeCode(): string {
    const t = (key: string): string => this.translate.instant(key) as string;
    switch (this.entity()) {
      case 'schedule': {
        const e = this.editedEntry;
        if (!e) return '';
        return joinBlocks(removeHint(FILES.schedule, `${e.team} · ${dateLiteral(e.date)}`), `//${scheduleLine(toDraft(e))}`);
      }
      case 'youths': {
        const y = this.editedYouth;
        if (!y) return '';
        const memberships = this.admin.raw.memberships.filter(m => m.youthId === y.id);
        const links = this.admin.raw.parentYouthLinks.filter(l => l.youthId === y.id);
        return joinBlocks(
          removeHint(FILES.youths, `youth('${y.id}', …)`),
          memberships.length > 0 ? removeHint(FILES.memberships, `${memberships.length} × membership('${y.id}', …)`) : '',
          links.length > 0 ? removeHint(FILES.links, `${links.length} × youthId: '${y.id}'`) : '',
          `// ${t('admin.data.remove_note')}`,
        );
      }
      case 'parents': {
        const p = this.editedParent;
        if (!p) return '';
        const links = this.admin.raw.parentYouthLinks.filter(l => l.parentId === p.id);
        const events = this.data.getAllEventsForParent(p.id);
        return joinBlocks(
          removeHint(FILES.parents, `id: '${p.id}' (${p.name})`),
          links.length > 0 ? removeHint(FILES.links, `${links.length} × parentId: '${p.id}'`) : '',
          events.length > 0 ? removeHint(FILES.schedule, `parentSupporters cu '${p.id}' (${events.length})`) : '',
          `// ${t('admin.data.remove_note')}`,
        );
      }
      case 'memberships': {
        const m = this.editedMembership;
        return m ? removeHint(FILES.memberships, `membership('${m.youthId}', '${m.teamName}'…)`) : '';
      }
      case 'links': {
        const l = this.editedLink;
        return l ? removeHint(FILES.links, `parentId: '${l.parentId}', youthId: '${l.youthId}'`) : '';
      }
    }
  }

  /** Cuántos registros tiene la tabla que se está viendo. */
  readonly count = computed(() => {
    switch (this.entity()) {
      case 'schedule': return this.schedule().length;
      case 'youths': return this.youths().length;
      case 'parents': return this.parents().length;
      case 'memberships': return this.memberships().length;
      case 'links': return this.links().length;
    }
  });
}
