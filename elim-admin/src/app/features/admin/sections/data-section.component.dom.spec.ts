import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach } from 'vitest';
import { DataSectionComponent } from './data-section.component';
import { testProviders } from '../../../../testing/test-providers';

/**
 * La sección de datos es el editor en crudo: abrir un registro, cambiar un campo y obtener la
 * línea de reemplazo; o pedir el borrado y obtener qué hay que quitar, incluidas las filas que
 * dependen de él. El fixture tiene 6 programaciones, 4 jóvenes, 1 padre y 1 vínculo.
 */
describe('DataSectionComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: testProviders() }));

  async function render() {
    const fixture = TestBed.createComponent(DataSectionComponent);
    await fixture.whenStable();
    return { fixture, cmp: fixture.componentInstance };
  }

  it('lista cada tabla y filtra por el buscador', async () => {
    const { fixture, cmp } = await render();
    expect(cmp.entity()).toBe('schedule');
    expect(cmp.count()).toBe(6);
    cmp.search.set('echipa 2');
    await fixture.whenStable();
    expect(cmp.schedule().every(e => e.team === 'Echipa 2')).toBe(true);

    cmp.selectEntity('youths');
    await fixture.whenStable();
    expect(cmp.search()).toBe('');                 // el buscador se limpia al cambiar de tabla
    expect(cmp.count()).toBe(4);
    cmp.selectEntity('memberships');
    await fixture.whenStable();
    expect(cmp.count()).toBe(5);
    cmp.selectEntity('links');
    await fixture.whenStable();
    expect(cmp.count()).toBe(1);
  });

  it('edita cualquier campo de una programación y genera su línea de reemplazo', async () => {
    const { fixture, cmp } = await render();
    const entry = cmp.schedule().find(e => e.date.getTime() === new Date(2026, 4, 8).getTime())!;
    cmp.openEntry(entry);
    await fixture.whenStable();
    cmp.patchEntry({ estimatedPersons: 25, observations: 'Test', programStartTime: '19:00' });
    await fixture.whenStable();
    const code = cmp.code();
    expect(code).toContain('înlocuiește linia din 2026-05-08');
    expect(code).toContain('estimatedPersons: 25');
    expect(code).toContain("observations: 'Test'");
    expect(code).toContain("programStartTime: '19:00'");
  });

  it('al borrar un joven recuerda sus pertenencias y sus vínculos', async () => {
    const { fixture, cmp } = await render();
    cmp.selectEntity('youths');
    await fixture.whenStable();
    cmp.openYouth(cmp.youths().find(y => y.id === 'y-dan')!);
    cmp.removing.set(true);
    await fixture.whenStable();
    const code = cmp.code();
    expect(code).toContain("youth('y-dan', …)");
    expect(code).toContain("membership('y-dan', …)");   // está en Echipa 1
    expect(code).toContain("youthId: 'y-dan'");          // y vinculado a p-1
  });

  it('cambia una pertenencia entre activa y cerrada', async () => {
    const { fixture, cmp } = await render();
    cmp.selectEntity('memberships');
    await fixture.whenStable();
    const row = cmp.memberships().find(r => r.m.youthId === 'y-dan' && r.m.active)!;
    cmp.openMembership(row.m, row.index);
    await fixture.whenStable();
    expect(cmp.code()).toContain("membership('y-dan', 'Echipa 1'),");
    cmp.patchMembership({ active: false, endDate: new Date(2026, 5, 30) });
    await fixture.whenStable();
    expect(cmp.code()).toContain("membership('y-dan', 'Echipa 1', 'membru', false, new Date(2026, 5, 30)),");
  });

  it('edita un vínculo familiar y cierra el registro abierto', async () => {
    const { fixture, cmp } = await render();
    cmp.selectEntity('links');
    await fixture.whenStable();
    const row = cmp.links()[0];
    cmp.openLink(row.l, row.index);
    await fixture.whenStable();
    cmp.patchLink({ relationship: 'father' });
    await fixture.whenStable();
    expect(cmp.code()).toContain("relationship: 'father'");
    cmp.close();
    await fixture.whenStable();
    expect(cmp.code()).toBe('');
  });
});
