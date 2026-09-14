import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { AdminDataService } from '../admin-data.service';
import { Youth, YouthRole } from '../../../core/models';
import { getTeamColor, getTeamNumber } from '../../../core/utils/team.utils';
import { normalizeForSearch } from '../../../core/utils/text.utils';
import {
  closedMembershipBlock, joinBlocks, membershipBlock, membershipLine, removeHint, withHeader,
} from '../../../core/utils/data-source.utils';
import { AdminCodeComponent } from '../../../shared/ui/admin-code/admin-code.component';

const MEMBERSHIPS_FILE = 'src/app/core/data/memberships.data.ts';

/**
 * Equipos: componer una plantilla (marcar quién está y quién coordina), cerrarla cuando el equipo
 * se reorganiza y mover a alguien de un equipo a otro. Son los tres cambios que antes obligaban a
 * reescribir a mano varias líneas seguidas de `memberships.data.ts`, con el riesgo de dejar dos
 * coordinadores o una pertenencia huérfana.
 */
@Component({
  selector: 'app-admin-teams-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, TranslatePipe, AdminCodeComponent],
  templateUrl: './teams-section.component.html',
  styleUrl: './section.css',
})
export class TeamsSectionComponent {
  protected readonly admin = inject(AdminDataService);
  protected readonly data = this.admin.data;
  protected readonly getTeamColor = getTeamColor;
  protected readonly getTeamNumber = getTeamNumber;

  readonly teams = this.admin.teams;
  /** Filtro de la lista de miembros: con 60 jóvenes, buscar es más rápido que recorrer. */
  readonly search = signal('');
  readonly youths = computed(() => {
    const term = normalizeForSearch(this.search());
    const list = this.data.activeYouths;
    if (!term) return list;
    return list.filter(y => normalizeForSearch(
      `${y.fullName} ${this.data.getActiveTeamsForYouth(y.id).map(t => t.teamName).join(' ')}`).includes(term));
  });

  /* ═════════ Composición de un equipo ═════════ */
  readonly team = signal(this.admin.teams()[0] ?? '');
  /** Miembros marcados; al cambiar de equipo se parte de su composición actual. */
  readonly members = signal<string[]>(this.admin.teamMembers(this.admin.teams()[0] ?? '').map(y => y.id));
  readonly coordinatorId = signal(this.data.getCoordinatorForTeam(this.admin.teams()[0] ?? '')?.id ?? '');

  selectTeam(team: string): void {
    this.team.set(team);
    this.members.set(this.admin.teamMembers(team).map(y => y.id));
    this.coordinatorId.set(this.data.getCoordinatorForTeam(team)?.id ?? '');
  }

  isMember(id: string): boolean { return this.members().includes(id); }

  toggleMember(id: string): void {
    this.members.update(list => list.includes(id) ? list.filter(x => x !== id) : [...list, id]);
    if (this.coordinatorId() === id && !this.isMember(id)) this.coordinatorId.set('');
  }

  /** Miembros marcados, en el orden alfabético de la app y con el coordinador primero. */
  readonly chosen = computed<Youth[]>(() => {
    const ids = new Set(this.members());
    const list = this.data.activeYouths.filter(y => ids.has(y.id));
    const coord = list.find(y => y.id === this.coordinatorId());
    return coord ? [coord, ...list.filter(y => y.id !== coord.id)] : list;
  });

  readonly compositionIssue = computed(() => {
    if (this.members().length === 0) return 'no_members';
    if (!this.coordinatorId()) return 'no_coordinator';
    if (!this.members().includes(this.coordinatorId())) return 'coordinator_not_member';
    return null;
  });

  readonly compositionCode = computed(() => {
    if (this.compositionIssue()) return '';
    const rows = this.chosen().map(y => ({ id: y.id, role: (y.id === this.coordinatorId() ? 'coordonator' : 'membru') as YouthRole }));
    return withHeader(`${MEMBERSHIPS_FILE} (înlocuiește blocul activ al echipei)`, membershipBlock(this.team(), rows));
  });

  /* ═════════ Cierre de la composición ═════════ */
  readonly closeTeam = signal(this.admin.teams()[0] ?? '');
  readonly closeDate = signal(this.admin.toInput(this.data.today));

  readonly closeCode = computed(() => {
    const team = this.closeTeam();
    const members = this.admin.teamMembers(team);
    if (members.length === 0) return '';
    const coord = this.data.getCoordinatorForTeam(team);
    const rows = members.map(y => ({ id: y.id, role: (y.id === coord?.id ? 'coordonator' : 'membru') as YouthRole }));
    return withHeader(`${MEMBERSHIPS_FILE} (compoziția închisă)`,
      closedMembershipBlock(team, rows, this.admin.fromInput(this.closeDate())));
  });

  /* ═════════ Mover a alguien de equipo ═════════ */
  readonly moveYouthId = signal('');
  readonly moveTo = signal(this.admin.teams()[0] ?? '');
  readonly moveRole = signal<YouthRole>('membru');
  readonly roles: YouthRole[] = ['membru', 'coordonator'];

  readonly moveYouth = computed(() => this.data.getYouthById(this.moveYouthId()) ?? null);
  readonly moveFrom = computed(() => this.data.getActiveTeamsForYouth(this.moveYouthId()).map(t => t.teamName));

  readonly moveIssue = computed(() => {
    if (!this.moveYouthId()) return 'missing_youth';
    if (this.moveFrom().includes(this.moveTo())) return 'same_team';
    if (this.moveRole() === 'coordonator' && this.data.getCoordinatorForTeam(this.moveTo())) return 'team_has_coordinator';
    return null;
  });

  readonly moveCode = computed(() => {
    const y = this.moveYouth();
    if (!y || this.moveIssue()) return '';
    const from = this.moveFrom();
    return joinBlocks(
      from.length > 0
        ? removeHint(MEMBERSHIPS_FILE, from.map(t => `membership('${y.id}', '${t}')`).join(' · '))
        : '',
      withHeader(MEMBERSHIPS_FILE, membershipLine(y.id, this.moveTo(), this.moveRole())),
    );
  });
}
