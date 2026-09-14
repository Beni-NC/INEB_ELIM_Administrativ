import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach } from 'vitest';
import { ScheduleSectionComponent } from './schedule-section.component';
import { testProviders } from '../../../../testing/test-providers';

/**
 * Con el fixture, "hoy" es el miércoles 06-05-2026 y los viernes 08-05 y 15-05 ya están ocupados,
 * así que la primera propuesta libre es el 22-05.
 */
describe('ScheduleSectionComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: testProviders() }));

  async function render() {
    const fixture = TestBed.createComponent(ScheduleSectionComponent);
    await fixture.whenStable();
    return { fixture, cmp: fixture.componentInstance };
  }

  it('propone los siguientes viernes libres y genera las líneas de schedule.data.ts', async () => {
    const { fixture, cmp } = await render();
    cmp.count.set(2);
    cmp.regenerate();
    await fixture.whenStable();
    expect(cmp.rows().map(r => r.date.getDate())).toEqual([22, 29]);
    expect(cmp.code()).toContain('// → src/app/core/data/schedule.data.ts');
    expect(cmp.code()).toContain('date: new Date(2026, 4, 22)');
  });

  it('deja quitar una fila y aplazar el resto cuando ese viernes no hay programa', async () => {
    const { fixture, cmp } = await render();
    cmp.count.set(3);
    cmp.regenerate();
    await fixture.whenStable();
    const [first, second] = cmp.rows();
    cmp.postponeFrom(second.id);
    await fixture.whenStable();
    // La 1.ª no se mueve; la 2.ª salta al siguiente viernes LIBRE (el 5 de junio ya está ocupado).
    expect(cmp.rows().map(r => r.date.getDate())).toEqual([22, 12, 19]);
    cmp.removeRow(first.id);
    await fixture.whenStable();
    expect(cmp.rows()).toHaveLength(2);
  });

  it('permite cambiar la fecha a otro día de la semana y avisa sin bloquear', async () => {
    const { fixture, cmp } = await render();
    const row = cmp.rows()[0];
    cmp.setRowDate(row.id, '2026-05-21'); // jueves
    await fixture.whenStable();
    expect(cmp.checksFor(row.id).map(c => c.key)).toContain('not_friday');
    expect(cmp.rowHasErrors(row.id)).toBe(false);
    expect(cmp.code()).toContain('date: new Date(2026, 4, 21)');
  });

  it('marca como error una fecha que ya tiene programación', async () => {
    const { fixture, cmp } = await render();
    const row = cmp.rows()[0];
    cmp.setRowDate(row.id, '2026-05-08'); // ya existe (Echipa 1)
    await fixture.whenStable();
    expect(cmp.checksFor(row.id).map(c => c.key)).toContain('date_taken');
    expect(cmp.errorCount()).toBe(1);
  });

  it('al cambiar de equipo actualiza el coordinador y el código', async () => {
    const { fixture, cmp } = await render();
    const row = cmp.rows()[0];
    cmp.patchRow(row.id, { teamName: 'Echipa 2' });
    await fixture.whenStable();
    expect(cmp.rows()[0].coordinatorName).toBe('Rus Eva');
    expect(cmp.code()).toContain("team: 'Echipa 2', coordinator: 'Rus Eva'");
  });

  it('añade filas manualmente con observaciones y horas propias', async () => {
    const { fixture, cmp } = await render();
    cmp.addRow();
    await fixture.whenStable();
    const added = cmp.rows().at(-1)!;
    cmp.patchRow(added.id, { observations: 'Conferință', programStartTime: '19:00' });
    await fixture.whenStable();
    expect(cmp.code()).toContain("observations: 'Conferință'");
    expect(cmp.code()).toContain("programStartTime: '19:00'");
  });

  it('edita una programación publicada y ofrece la línea de reemplazo y la de borrado', async () => {
    const { fixture, cmp } = await render();
    const entry = cmp.editableEvents().find(e => e.date.getTime() === new Date(2026, 4, 8).getTime())!;
    cmp.selectEvent(entry.date.getTime() + '|' + entry.team);
    await fixture.whenStable();
    cmp.patchEdit({ estimatedPersons: 30, observations: 'Test' });
    await fixture.whenStable();
    expect(cmp.editCode()).toContain('estimatedPersons: 30');
    expect(cmp.editCode()).toContain("observations: 'Test'");
    // Su propia fecha no cuenta como ocupada al editarla.
    expect(cmp.editChecks().map(c => c.key)).not.toContain('date_taken');
    expect(cmp.removeCode()).toContain('ELIMINĂ / ELIMINA');
  });
});
