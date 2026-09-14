import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach } from 'vitest';
import { ScheduleSectionComponent } from './schedule-section.component';
import { testProviders } from '../../../../testing/test-providers';
import { DATA } from '../../../../testing/domain-fixture';
import { APP_DATA } from '../../../core/tokens';
import { DomainData } from '../../../core/models';

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

  it('la fila añadida a mano ya viene con los padres que tocan', async () => {
    const { fixture, cmp } = await render();
    cmp.count.set(1);
    cmp.regenerate();
    await fixture.whenStable();
    const first = cmp.rows()[0].parentIds;
    expect(first.length).toBeGreaterThan(0);          // el fixture tiene un padre
    cmp.addRow();
    await fixture.whenStable();
    // Con reparto activado, la fila nueva no se queda vacía: recibe a quien menos ha salido.
    expect(cmp.rows().at(-1)!.parentIds).toEqual(first);
    // Sin reparto, se añade vacía y "rellenar los que falten" la completa.
    cmp.withParents.set(false);
    cmp.addRow();
    await fixture.whenStable();
    expect(cmp.rows().at(-1)!.parentIds).toEqual([]);
    cmp.withParents.set(true);
    cmp.fillMissingParents();
    await fixture.whenStable();
    expect(cmp.rows().at(-1)!.parentIds.length).toBeGreaterThan(0);
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

  it('resume quién ayuda y cuándo, mezclando lo publicado con lo que se prepara', async () => {
    const { fixture, cmp } = await render();
    cmp.count.set(1);
    cmp.regenerate();
    await fixture.whenStable();
    const agenda = cmp.agenda();
    // 3 futuras publicadas (08-05 con padre, 15-05 y 05-06 sin) + la fila en preparación.
    expect(agenda).toHaveLength(4);
    expect(agenda.map(a => a.date.getDate())).toEqual([8, 15, 22, 5]);
    expect(agenda.filter(a => a.draft)).toHaveLength(1);
    expect(agenda[0].parents.map(p => p.name)).toEqual(['Maria Dinu Popa']);
    // El único padre del fixture ayuda el 08-05 y otra vez el 22-05: dos semanas, demasiado seguido.
    expect(cmp.crowded().map(c => [c.name, c.gapDays])).toEqual([['Maria Dinu Popa', 14]]);
    expect(cmp.isCrowded('p-1')).toBe(true);
    // Con un solo padre no hay recambio posible: se avisa, pero no se ofrece cambiar.
    expect(cmp.fixFor(agenda[0], 'p-1')).toMatchObject({ tooSoon: true, suggestionId: '' });
  });

  it('avisa en el propio hueco cuando el padre puesto vuelve a ayudar demasiado pronto', async () => {
    const { fixture, cmp } = await render();
    cmp.count.set(1);
    cmp.regenerate();
    await fixture.whenStable();
    const row = cmp.rows()[0];
    // El único padre del fixture ayuda el 08-05 y la propuesta cae el 22-05: dos semanas.
    expect(cmp.hintFor(row.id, 0)).toMatchObject({ tooSoon: true, gapDays: 14, suggestionId: '' });
    expect(cmp.slotTitle(cmp.hintFor(row.id, 0)!)).toBe('admin.slot_too_soon');
    // El segundo hueco está vacío y no queda nadie más a quien ofrecer: ni aviso ni propuesta.
    expect(cmp.hintFor(row.id, 1)).toMatchObject({ tooSoon: false, gapDays: null, suggestionId: '' });
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

/**
 * El mismo fixture con un segundo padre y un choque entre dos programaciones ya publicadas:
 * p-1 ayuda el 08-05 y otra vez el 15-05, una semana después.
 */
describe('ScheduleSectionComponent · arreglar un padre ya publicado', () => {
  const DOS: DomainData = {
    ...DATA,
    parents: [...DATA.parents, {
      id: 'p-2', name: 'Elena Rus', phone: '', email: '', role: '', skills: [],
      joinedDate: new Date(2026, 0, 1), notes: '', available: true,
    }],
    schedule: DATA.schedule.map(e =>
      e.date.getTime() === new Date(2026, 4, 15).getTime() ? { ...e, parentSupporters: ['p-1'] } : e),
  };

  beforeEach(() => TestBed.configureTestingModule({
    providers: [...testProviders(), { provide: APP_DATA, useValue: DOS }],
  }));

  it('cambia al padre desde el resumen y saca la línea que reemplaza a esa programación', async () => {
    const fixture = TestBed.createComponent(ScheduleSectionComponent);
    await fixture.whenStable();
    const cmp = fixture.componentInstance;
    cmp.rows.set([]);                       // sin propuesta: el choque está entre dos publicadas
    await fixture.whenStable();

    expect(cmp.crowded().map(c => [c.id, c.gapDays])).toEqual([['p-1', 7]]);
    const row = cmp.agenda().find(a => a.date.getTime() === new Date(2026, 4, 15).getTime())!;
    expect(cmp.fixFor(row, 'p-1')).toMatchObject({ tooSoon: true, gapDays: 7, suggestionId: 'p-2' });

    cmp.applyFix(row, 'p-1');
    await fixture.whenStable();
    // Resuelto: ya no hay nadie demasiado seguido y abajo está la línea que hay que reemplazar.
    expect(cmp.crowded()).toEqual([]);
    expect(cmp.editedPublished()).toHaveLength(1);
    expect(cmp.publishedCode()).toContain('înlocuiește liniile din 2026-05-15');
    expect(cmp.publishedCode()).toContain("parentSupporters: ['p-2']");

    cmp.clearPublishedEdits();
    await fixture.whenStable();
    expect(cmp.publishedCode()).toBe('');
  });
});
