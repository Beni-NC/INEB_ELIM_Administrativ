import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach } from 'vitest';
import { EventRowComponent } from './event-row.component';
import { DataService } from '../../../core/services/data.service';
import { testProviders } from '../../../../testing/test-providers';

describe('EventRowComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: testProviders() }));

  function render(index: number, inputs: Record<string, unknown> = {}) {
    const data = TestBed.inject(DataService);
    const fixture = TestBed.createComponent(EventRowComponent);
    fixture.componentRef.setInput('entry', data.sortedSchedule[index]);
    for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement, data };
  }

  it('pinta equipo, coordinador y horas de una programación futura', () => {
    const { el } = render(3); // 08-05-2026, Echipa 1, Ionescu Ion, con padres
    expect(el.querySelector('.ui-team-badge')?.textContent?.trim()).toBe('1');
    expect(el.textContent).toContain('Echipa 1');
    expect(el.textContent).toContain('Ionescu Ion');
    expect(el.querySelector('.ui-times')?.textContent).toContain('19:30');
    expect(el.querySelectorAll('.ui-chip').length).toBe(1); // Maria Dinu Popa
    expect(el.querySelector('.ui-badge--warning')).toBeNull();
  });

  it('no muestra nada de planificación cuando la programación no tiene padres (eso vive en /admin)', () => {
    const { el } = render(4); // 15-05-2026, Echipa 2, sin parentSupporters
    expect(el.querySelectorAll('.ui-chip').length).toBe(0);
    expect(el.querySelector('.ui-badge--warning')).toBeNull();
  });

  it('en el pasado atenúa la fila, quita horas y acciones y marca completado', () => {
    const { el } = render(0, { past: true });
    expect(el.querySelector('.ui-row')?.classList.contains('ui-row--muted')).toBe(true);
    expect(el.querySelector('.ui-times')).toBeNull();
    expect(el.querySelector('app-calendar-button')).toBeNull();
    expect(el.querySelector('.ev__done')).not.toBeNull();
    expect(el.querySelector('.ui-badge--warning')).toBeNull();
  });
});
