import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach } from 'vitest';
import { provideZonelessChangeDetection } from '@angular/core';
import { InebLogoComponent, InebLogoVariant } from './ineb-logo.component';

/**
 * El componente de marca no depende de nada de la app, así que el test tampoco: solo necesita
 * detección de cambios. Cubre las combinaciones que la hoja de marca promete, para que nadie las
 * rompa sin enterarse.
 */
describe('InebLogoComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] }));

  async function render(props: Partial<{ tone: 'light' | 'dark'; variant: InebLogoVariant; mono: boolean; tile: boolean; label: string }> = {}) {
    const fixture = TestBed.createComponent(InebLogoComponent);
    for (const [k, v] of Object.entries(props)) fixture.componentRef.setInput(k, v);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    return {
      el,
      svgs: [...el.querySelectorAll('svg')],
      rellenos: [...el.querySelectorAll('[fill]')].map(n => n.getAttribute('fill')),
    };
  }

  it('pinta la forma completa con la paleta de marca y el nombre en blanco sobre oscuro', async () => {
    const { svgs, rellenos } = await render({ tone: 'dark' });
    expect(svgs).toHaveLength(1);
    expect(svgs[0].getAttribute('viewBox')).toBe('0 0 118.2 35.5');
    expect(rellenos).toContain('var(--ineb-yellow)');   // la placa
    expect(rellenos).toContain('var(--ineb-red)');      // «EB»
    expect(rellenos).toContain('#ffffff');              // «IN» sobre oscuro
  });

  it('sobre claro el nombre toma la tinta de marca y el rojo no se mueve', async () => {
    const { rellenos } = await render({ tone: 'light' });
    expect(rellenos).toContain('var(--ineb-navy)');
    expect(rellenos).toContain('var(--ineb-red)');
    expect(rellenos).not.toContain('#ffffff');
  });

  it('la compacta es una sola línea y conserva los dos colores', async () => {
    const { svgs, rellenos } = await render({ variant: 'compact', tone: 'light' });
    expect(svgs).toHaveLength(1);
    expect(svgs[0].getAttribute('viewBox')).toBe('0 0 132.7 35.5');
    expect(rellenos).toContain('var(--ineb-red)');
    expect(rellenos).not.toContain('var(--ineb-yellow)');   // sin placa
  });

  it('el isotipo es cuadrado y solo pinta el cuadro navy si se le pide', async () => {
    const sin = await render({ variant: 'mark' });
    expect(sin.svgs[0].getAttribute('viewBox')).toBe('0 0 48 48');
    expect(sin.el.querySelectorAll('rect[width="48"]')).toHaveLength(0);

    const con = await render({ variant: 'mark', tile: true, tone: 'light' });
    const cuadro = con.el.querySelector('rect[width="48"]');
    expect(cuadro?.getAttribute('fill')).toBe('var(--ineb-navy)');
    // Con cuadro navy detrás, el nombre va en blanco aunque el tono sea claro.
    expect(con.rellenos).toContain('#ffffff');
  });

  it('en una tinta no queda ni amarillo ni rojo, y TECH se cala al color del papel', async () => {
    const { rellenos } = await render({ mono: true, tone: 'light' });
    expect(rellenos).not.toContain('var(--ineb-yellow)');
    expect(rellenos).not.toContain('var(--ineb-red)');
    expect(rellenos).toContain('var(--ineb-paper)');
  });

  it('en modo auto lleva las dos formas y el CSS decide cuál se ve', async () => {
    const { el } = await render({ variant: 'auto' });
    expect(el.querySelector('.ineb--lockup')).not.toBeNull();
    expect(el.querySelector('.ineb--compact')).not.toBeNull();
    expect((el.firstElementChild as HTMLElement).ownerDocument).toBeTruthy();
  });

  it('es decorativo salvo que se le dé nombre', async () => {
    const mudo = await render();
    expect(mudo.svgs[0].getAttribute('aria-hidden')).toBe('true');
    expect(mudo.svgs[0].getAttribute('role')).toBeNull();

    const conNombre = await render({ label: 'INEB' });
    expect(conNombre.svgs[0].getAttribute('role')).toBe('img');
    expect(conNombre.svgs[0].getAttribute('aria-label')).toBe('INEB');
    expect(conNombre.svgs[0].getAttribute('aria-hidden')).toBeNull();
  });
});
