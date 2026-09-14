import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach } from 'vitest';
import { UpcomingStripComponent } from './upcoming-strip.component';
import { testProviders } from '../../../../testing/test-providers';

/** Con el fixture, "hoy" es el 06-05-2026 y quedan tres viernes: 08-05 (con padre), 15-05 y 05-06. */
describe('UpcomingStripComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: testProviders() }));

  async function render(mode: 'teams' | 'parents', highlight = 0) {
    const fixture = TestBed.createComponent(UpcomingStripComponent);
    fixture.componentRef.setInput('mode', mode);
    fixture.componentRef.setInput('highlight', highlight);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('en modo padres pone quién ayuda cada viernes y avisa de los que están sin cubrir', async () => {
    const el = await render('parents', new Date(2026, 4, 15).getTime());
    const items = el.querySelectorAll('.strip__item');
    expect(items).toHaveLength(3);
    expect(items[0].textContent).toContain('Maria Dinu Popa');
    expect(items[1].textContent).toContain('event.no_parents');
    // La marca no es siempre la primera: es la programación de la tarjeta que la contiene.
    expect(el.querySelector('.strip__item--next')!.textContent).toContain('15');
  });

  it('en modo equipos pone a quién le toca, y cada nombre lleva a su ficha', async () => {
    const el = await render('teams');
    const links = el.querySelectorAll<HTMLButtonElement>('.strip__link');
    expect(links).toHaveLength(3);
    expect([...links].map(b => b.textContent!.trim())).toEqual(['Echipa 1', 'Echipa 2', 'Echipa 1']);
    expect(el.querySelector('.strip__item--next')).toBeNull();   // sin `highlight`, no se marca nada
  });
});
