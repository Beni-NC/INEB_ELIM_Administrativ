import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { PluralPipe } from '../../../core/i18n/plural.pipe';
import { AdminDataService } from '../admin-data.service';
import { Relationship, YouthRole } from '../../../core/models';
import {
  DraftYouth, closeMembershipLine, joinBlocks, membershipLine, nextParentId, parentBlock, parentBlockFor,
  parentYouthLinkLine, parentYouthLinkLines, todoComment, withHeader, youthId, youthLineFor, youthLine,
} from '../../../core/utils/data-source.utils';
import { TranslateService } from '@ngx-translate/core';
import { AdminCodeComponent } from '../../../shared/ui/admin-code/admin-code.component';

const FILES = {
  youths: 'src/app/core/data/youths.data.ts',
  memberships: 'src/app/core/data/memberships.data.ts',
  parents: 'src/app/core/data/parents.data.ts',
  links: 'src/app/core/data/parents.data.ts (PARENT_YOUTH_LINKS)',
} as const;

/** Fila de "hijo ↔ relación" de los formularios de vínculos familiares. */
interface ChildRow { id: number; youthId: string; relationship: Relationship }

/**
 * Personas: alta de jóvenes y de padres (con **varios hijos de una vez**), edición y archivo de
 * los que ya existen, y vínculos familiares entre personas ya dadas de alta — el caso típico de
 * "el joven ya estaba y ahora se apunta su madre", que antes obligaba a escribir la línea a mano.
 */
@Component({
  selector: 'app-admin-people-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, TranslatePipe, PluralPipe, AdminCodeComponent],
  templateUrl: './people-section.component.html',
  styleUrl: './section.css',
})
export class PeopleSectionComponent {
  protected readonly admin = inject(AdminDataService);
  protected readonly data = this.admin.data;
  private readonly translate = inject(TranslateService);
  readonly relationships: Relationship[] = ['mother', 'father', 'guardian'];

  /** Texto traducido de cada aviso, para escribirlo como TODO dentro del código generado. */
  private todo(issues: readonly string[]): string {
    return todoComment(issues.map(i => this.translate.instant(`admin.check.${i}`) as string));
  }
  readonly roles: YouthRole[] = ['membru', 'coordonator'];

  readonly youths = computed(() => this.data.activeYouths);
  readonly allYouths = computed(() => this.data.youthsSorted);
  readonly parents = computed(() => this.data.parents);

  /* ═════════ Joven nuevo ═════════ */
  readonly ny = {
    firstName: signal(''), lastName: signal(''), gender: signal<'M' | 'F'>('M'),
    birthDate: signal(''), joinedYear: signal(this.data.today.getFullYear()),
    phone: signal(''), email: signal(''), notes: signal(''),
    team: signal(this.admin.teams()[0] ?? ''), role: signal<YouthRole>('membru'),
  };
  private nyChildId = 1;
  /** Padres ya existentes a los que vincular al joven nuevo. */
  readonly nyParents = signal<{ id: number; parentId: string; relationship: Relationship }[]>([]);

  readonly newYouthId = computed(() => youthId(this.ny.firstName().trim(), this.ny.lastName().trim()));

  addYouthParent(): void {
    this.nyParents.update(l => [...l, { id: this.nyChildId++, parentId: '', relationship: 'mother' }]);
  }
  patchYouthParent(id: number, patch: Partial<{ parentId: string; relationship: Relationship }>): void {
    this.nyParents.update(l => l.map(r => r.id === id ? { ...r, ...patch } : r));
  }
  removeYouthParent(id: number): void { this.nyParents.update(l => l.filter(r => r.id !== id)); }

  readonly newYouthIssues = computed(() => {
    const n = this.ny;
    const out: string[] = [];
    if (!n.firstName().trim() || !n.lastName().trim()) out.push('missing_name');
    if (!n.birthDate()) out.push('missing_birth');
    const fullName = `${n.lastName().trim()} ${n.firstName().trim()}`;
    if (n.firstName().trim() && (this.data.getYouthById(this.newYouthId()) || this.data.getYouthByName(fullName))) {
      out.push('youth_exists');
    }
    if (!n.team()) out.push('missing_team');
    const parents = this.nyParents().map(r => r.parentId).filter(Boolean);
    if (new Set(parents).size !== parents.length) out.push('duplicate_parents');
    return out;
  });

  readonly newYouthCode = computed(() => {
    const n = this.ny;
    const id = this.newYouthId();
    const draft: DraftYouth = {
      firstName: n.firstName().trim(), lastName: n.lastName().trim(), gender: n.gender(),
      // Sin fecha, un marcador reconocible: el TODO de arriba recuerda completarla.
      birthDate: n.birthDate() ? this.admin.fromInput(n.birthDate()) : new Date(2000, 0, 1),
      joinedYear: Number(n.joinedYear()),
      phone: n.phone(), email: n.email(), notes: n.notes(),
    };
    // Un vínculo por cada padre elegido (el joven es el mismo en todos).
    const links = this.nyParents().filter(r => r.parentId);
    return this.todo(this.newYouthIssues()) + joinBlocks(
      withHeader(FILES.youths, youthLine(draft)),
      withHeader(FILES.memberships, membershipLine(id, n.team(), n.role())),
      withHeader(FILES.links, links.map(r => parentYouthLinkLine(r.parentId, id, r.relationship)).join('\n')),
    );
  });

  /* ═════════ Editar o archivar un joven ═════════ */
  readonly editYouthId = signal('');
  readonly editYouth = computed(() => this.data.getYouthById(this.editYouthId()) ?? null);
  readonly ey = {
    phone: signal(''), email: signal(''), notes: signal(''),
    archive: signal(false), since: signal(this.admin.toInput(this.data.today)), reason: signal(''),
  };

  selectYouth(id: string): void {
    this.editYouthId.set(id);
    const y = this.data.getYouthById(id);
    this.ey.phone.set(y?.phone ?? '');
    this.ey.email.set(y?.email ?? '');
    this.ey.notes.set(y?.notes ?? '');
    this.ey.archive.set(y?.active === false);
    this.ey.since.set(this.admin.toInput(y?.inactiveSince ?? this.data.today));
    this.ey.reason.set(y?.inactiveReason ?? '');
  }

  readonly editYouthCode = computed(() => {
    const y = this.editYouth();
    if (!y) return '';
    const archive = this.ey.archive();
    const line = youthLineFor(y, {
      phone: this.ey.phone(), email: this.ey.email(), notes: this.ey.notes(),
      active: archive ? false : undefined,
      inactiveSince: archive ? this.admin.fromInput(this.ey.since()) : undefined,
      inactiveReason: archive ? this.ey.reason() : undefined,
    });
    const blocks = [withHeader(`${FILES.youths} (înlocuiește linia lui ${y.fullName})`, line)];
    if (archive) {
      // Archivar = además cerrar sus pertenencias activas, si las tiene.
      const teams = this.data.getActiveTeamsForYouth(y.id);
      const since = this.admin.fromInput(this.ey.since());
      if (teams.length > 0) {
        blocks.push(withHeader(`${FILES.memberships} (închide apartenențele lui ${y.fullName})`,
          teams.map(t => closeMembershipLine(y.id, t.teamName, since, t.role)).join('\n')));
      }
    }
    return joinBlocks(...blocks);
  });

  /* ═════════ Padre nuevo (con varios hijos) ═════════ */
  readonly np = { name: signal(''), phone: signal(''), email: signal('') };
  private npChildId = 1;
  readonly npChildren = signal<ChildRow[]>([{ id: 0, youthId: '', relationship: 'mother' }]);

  readonly newParentId = computed(() => nextParentId(this.data.parents));

  addChild(): void { this.npChildren.update(l => [...l, { id: this.npChildId++, youthId: '', relationship: 'mother' }]); }
  patchChild(id: number, patch: Partial<ChildRow>): void {
    this.npChildren.update(l => l.map(r => r.id === id ? { ...r, ...patch } : r));
  }
  removeChild(id: number): void { this.npChildren.update(l => l.filter(r => r.id !== id)); }

  readonly newParentIssues = computed(() => {
    const out: string[] = [];
    if (!this.np.name().trim()) out.push('missing_name');
    const chosen = this.npChildren().map(c => c.youthId).filter(Boolean);
    if (new Set(chosen).size !== chosen.length) out.push('duplicate_children');
    return out;
  });

  readonly newParentCode = computed(() => {
    const id = this.newParentId();
    const children = this.npChildren().filter(c => c.youthId).map(c => ({ youthId: c.youthId, relationship: c.relationship }));
    return this.todo(this.newParentIssues()) + joinBlocks(
      withHeader(FILES.parents, parentBlock({
        id, name: this.np.name().trim(), phone: this.np.phone(), email: this.np.email(), joinedDate: this.data.today,
      })),
      withHeader(FILES.links, parentYouthLinkLines(id, children)),
    );
  });

  /* ═════════ Editar o archivar un padre ═════════ */
  readonly editParentId = signal('');
  readonly editParent = computed(() => this.data.getParentById(this.editParentId()) ?? null);
  readonly ep = {
    name: signal(''), phone: signal(''), email: signal(''), available: signal(true),
    archive: signal(false), since: signal(this.admin.toInput(this.data.today)), reason: signal(''),
  };

  selectParent(id: string): void {
    this.editParentId.set(id);
    const p = this.data.getParentById(id);
    this.ep.name.set(p?.name ?? '');
    this.ep.phone.set(p?.phone ?? '');
    this.ep.email.set(p?.email ?? '');
    this.ep.available.set(p?.available ?? true);
    this.ep.archive.set(p?.active === false);
    this.ep.since.set(this.admin.toInput(p?.inactiveSince ?? this.data.today));
    this.ep.reason.set(p?.inactiveReason ?? '');
  }

  readonly editParentCode = computed(() => {
    const p = this.editParent();
    if (!p) return '';
    const archive = this.ep.archive();
    return withHeader(`${FILES.parents} (înlocuiește blocul lui ${p.name})`, parentBlockFor(p, {
      name: this.ep.name().trim() || p.name,
      phone: this.ep.phone(), email: this.ep.email(), available: this.ep.available(),
      active: archive ? false : undefined,
      inactiveSince: archive ? this.admin.fromInput(this.ep.since()) : undefined,
      inactiveReason: archive ? this.ep.reason() : undefined,
    }));
  });

  /* ═════════ Vincular personas que ya existen ═════════ */
  readonly linkParentId = signal('');
  private linkRowId = 1;
  readonly linkChildren = signal<ChildRow[]>([{ id: 0, youthId: '', relationship: 'mother' }]);

  addLinkChild(): void { this.linkChildren.update(l => [...l, { id: this.linkRowId++, youthId: '', relationship: 'mother' }]); }
  patchLinkChild(id: number, patch: Partial<ChildRow>): void {
    this.linkChildren.update(l => l.map(r => r.id === id ? { ...r, ...patch } : r));
  }
  removeLinkChild(id: number): void { this.linkChildren.update(l => l.filter(r => r.id !== id)); }

  /** Vínculos que ya existen: no hay que volver a escribirlos. */
  existingChildren(parentId: string): string[] {
    return this.data.getYouthsForParent(parentId).map(l => l.youth.id);
  }

  readonly linkIssues = computed(() => {
    const parentId = this.linkParentId();
    const out: string[] = [];
    if (!parentId) out.push('missing_parent');
    const chosen = this.linkChildren().map(c => c.youthId).filter(Boolean);
    if (chosen.length === 0) out.push('missing_child');
    if (new Set(chosen).size !== chosen.length) out.push('duplicate_children');
    if (parentId && chosen.some(id => this.existingChildren(parentId).includes(id))) out.push('link_exists');
    return out;
  });

  readonly linkCode = computed(() => {
    const children = this.linkChildren().filter(c => c.youthId).map(c => ({ youthId: c.youthId, relationship: c.relationship }));
    if (children.length === 0) return '';
    return this.todo(this.linkIssues())
      + withHeader(FILES.links, parentYouthLinkLines(this.linkParentId() || 'p-???', children));
  });

}
