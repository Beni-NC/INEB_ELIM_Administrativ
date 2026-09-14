import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach } from 'vitest';
import { PeopleSectionComponent } from './people-section.component';
import { TeamsSectionComponent } from './teams-section.component';
import { ParentsSectionComponent } from './parents-section.component';
import { testProviders } from '../../../../testing/test-providers';

describe('PeopleSectionComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: testProviders() }));

  async function render() {
    const fixture = TestBed.createComponent(PeopleSectionComponent);
    await fixture.whenStable();
    return { fixture, cmp: fixture.componentInstance };
  }

  it('da de alta un joven con su pertenencia y los padres que ya existen', async () => {
    const { fixture, cmp } = await render();
    expect(cmp.newYouthCode()).toBe('');           // formulario incompleto
    cmp.ny.firstName.set('Ana');
    cmp.ny.lastName.set('Bîrle');
    cmp.ny.birthDate.set('2008-03-14');
    cmp.ny.team.set('Echipa 2');
    cmp.ny.phone.set('600 11 22 33');
    cmp.addYouthParent();
    await fixture.whenStable();
    cmp.patchYouthParent(cmp.nyParents()[0].id, { parentId: 'p-1', relationship: 'mother' });
    await fixture.whenStable();
    const code = cmp.newYouthCode();
    expect(code).toContain("youth('y-birle-ana', 'Ana', 'Bîrle', 'M', new Date(2008, 2, 14), 2026,");
    expect(code).toContain("{ phone: '600 11 22 33' }");
    expect(code).toContain("membership('y-birle-ana', 'Echipa 2'),");
    expect(code).toContain("{ parentId: 'p-1', youthId: 'y-birle-ana', relationship: 'mother' },");
  });

  it('avisa si el joven ya existe', async () => {
    const { fixture, cmp } = await render();
    cmp.ny.firstName.set('Dan');
    cmp.ny.lastName.set('Dinu');
    cmp.ny.birthDate.set('2005-01-01');
    await fixture.whenStable();
    expect(cmp.newYouthIssue()).toBe('youth_exists');
    expect(cmp.newYouthCode()).toBe('');
  });

  it('archiva un joven y cierra sus pertenencias activas', async () => {
    const { fixture, cmp } = await render();
    cmp.selectYouth('y-dan');
    await fixture.whenStable();
    cmp.ey.archive.set(true);
    cmp.ey.since.set('2026-06-30');
    cmp.ey.reason.set('S-a mutat');
    await fixture.whenStable();
    const code = cmp.editYouthCode();
    expect(code).toContain('active: false');
    expect(code).toContain('inactiveSince: new Date(2026, 5, 30)');
    expect(code).toContain("membership('y-dan', 'Echipa 1', 'membru', false, new Date(2026, 5, 30)),");
  });

  it('da de alta un padre con varios hijos a la vez', async () => {
    const { fixture, cmp } = await render();
    cmp.np.name.set('Ioana Dinu');
    cmp.patchChild(cmp.npChildren()[0].id, { youthId: 'y-dan' });
    cmp.addChild();
    await fixture.whenStable();
    cmp.patchChild(cmp.npChildren()[1].id, { youthId: 'y-ion', relationship: 'mother' });
    await fixture.whenStable();
    const code = cmp.newParentCode();
    expect(code).toContain("id: 'p-002',");               // el fixture tiene p-1 → siguiente libre
    expect(code).toContain("youthId: 'y-dan'");
    expect(code).toContain("youthId: 'y-ion'");
    // El mismo hijo dos veces se avisa y no genera nada.
    cmp.patchChild(cmp.npChildren()[1].id, { youthId: 'y-dan' });
    await fixture.whenStable();
    expect(cmp.newParentIssue()).toBe('duplicate_children');
    expect(cmp.newParentCode()).toBe('');
  });

  it('vincula a un padre existente hijos que ya estaban dados de alta', async () => {
    const { fixture, cmp } = await render();
    cmp.linkParentId.set('p-1');
    await fixture.whenStable();
    // y-dan ya está vinculado en el fixture: no se puede repetir.
    cmp.patchLinkChild(cmp.linkChildren()[0].id, { youthId: 'y-dan' });
    await fixture.whenStable();
    expect(cmp.linkIssue()).toBe('link_exists');
    cmp.patchLinkChild(cmp.linkChildren()[0].id, { youthId: 'y-ion', relationship: 'father' });
    await fixture.whenStable();
    expect(cmp.linkIssue()).toBeNull();
    expect(cmp.linkCode()).toContain("{ parentId: 'p-1', youthId: 'y-ion', relationship: 'father' },");
  });
});

describe('TeamsSectionComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: testProviders() }));

  async function render() {
    const fixture = TestBed.createComponent(TeamsSectionComponent);
    await fixture.whenStable();
    return { fixture, cmp: fixture.componentInstance };
  }

  it('parte de la composición actual del equipo y genera su bloque', async () => {
    const { fixture, cmp } = await render();
    cmp.selectTeam('Echipa 1');
    await fixture.whenStable();
    expect(cmp.members().sort()).toEqual(['y-dan', 'y-ion']);
    expect(cmp.coordinatorId()).toBe('y-ion');
    const code = cmp.compositionCode();
    expect(code).toContain('// ---- Echipa 1 (activă) ----');
    expect(code).toContain("membership('y-ion', 'Echipa 1', 'coordonator'),");
  });

  it('avisa si el coordinador no está entre los miembros marcados', async () => {
    const { fixture, cmp } = await render();
    cmp.selectTeam('Echipa 1');
    await fixture.whenStable();
    cmp.toggleMember('y-ion');   // era el coordinador: al quitarlo, deja de estar elegido
    await fixture.whenStable();
    expect(cmp.coordinatorId()).toBe('');
    expect(cmp.compositionIssue()).toBe('no_coordinator');
    expect(cmp.compositionCode()).toBe('');
  });

  it('cierra la composición con su fecha', async () => {
    const { fixture, cmp } = await render();
    cmp.closeTeam.set('Echipa 2');
    cmp.closeDate.set('2026-06-30');
    await fixture.whenStable();
    expect(cmp.closeCode()).toContain("membership('y-eva', 'Echipa 2', 'coordonator', false, new Date(2026, 5, 30)),");
  });

  it('mueve a un joven de equipo y avisa si el destino ya tiene coordinador', async () => {
    const { fixture, cmp } = await render();
    cmp.moveYouthId.set('y-dan');
    cmp.moveTo.set('Echipa 2');
    await fixture.whenStable();
    expect(cmp.moveCode()).toContain("ELIMINĂ / ELIMINA: membership('y-dan', 'Echipa 1')");
    expect(cmp.moveCode()).toContain("membership('y-dan', 'Echipa 2'),");
    cmp.moveRole.set('coordonator');
    await fixture.whenStable();
    expect(cmp.moveIssue()).toBe('team_has_coordinator');
  });
});

describe('ParentsSectionComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: testProviders() }));

  it('reparte los padres menos solicitados y solo genera lo que cambia', async () => {
    const fixture = TestBed.createComponent(ParentsSectionComponent);
    await fixture.whenStable();
    const cmp = fixture.componentInstance;
    expect(cmp.events().map(e => e.date.getDate())).toEqual([15, 5]);
    cmp.autoAssign();
    await fixture.whenStable();
    expect(cmp.changed().length).toBe(2);
    expect(cmp.code()).toContain("parentSupporters: ['p-1']");
    cmp.clearAssignments();
    await fixture.whenStable();
    expect(cmp.changed().length).toBe(0);
    expect(cmp.code()).toBe('');
  });
});
