import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Fondo sobre el que se pinta: decide la tinta de «IN» (no hay dos ficheros). */
export type InebLogoTone = 'light' | 'dark';

/**
 * Marca de INEB, el mismo planteamiento que `app-brand-logo`: dibujo en el propio bundle en vez de
 * un PNG. El original (`logo-ineb.png`) solo servía sobre fondo oscuro —«IN» es blanco—, se veía
 * borroso al escalar y pesaba 6 kB de red.
 *
 * Geometría medida sobre el arte original a 6000×1875: el `viewBox` de 120×38 es exactamente esa
 * retícula, así que cada número de los trazados es una medida, no un tanteo. La estructura es un
 * bloque de dos alturas: a la izquierda la placa «TECH» sobre «IN», ambas del mismo ancho, y a la
 * derecha «EB» a toda altura.
 *
 * El tamaño lo decide el contexto con `--ineb-size` (alto); sin él, 40 px. Los colores de marca
 * viven aquí y no en los tokens de la app: son de INEB, no del tema.
 */
@Component({
  selector: 'app-ineb-logo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'hostClass()' },
  template: `
    <svg viewBox="0 0 120 37.5" fill="none" aria-hidden="true">
      <!-- Placa TECH. Todas las coordenadas son medidas del arte original (1 unidad = 50 px de
           aquel lienzo de 6000×1875), no aproximaciones. -->
      <rect x="0.78" y="2.16" width="39.12" height="8.22" fill="var(--ineb-yellow)"/>
      <g fill="var(--ineb-navy)">
        <path d="M2.34 3.06h5.56v1.8H6.02v3.84H4.22V4.86H2.34z"/>
        <path d="M11.2 3.06h5.4v1.55h-3.85v.5h3.35v1.55h-3.35v.5h3.85V8.7h-5.4z"/>
        <path d="M32 3.06h1.65V5.1h2.62V3.06h1.65V8.7h-1.65V6.66h-2.62V8.7H32z"/>
      </g>
      <path d="M25.9 4.35a2 2 0 1 0 0 3.05" stroke="var(--ineb-navy)" stroke-width="1.7"/>

      <!-- IN: mismo ancho que la placa (0,9–39,8) y dos tercios de alto. -->
      <g fill="var(--ineb-in)">
        <rect x="0.9" y="12.1" width="7.7" height="24"/>
        <path d="M15.9 12.1H23l9.8 12.5V12.1h7v24h-7L23 24.2v11.9h-7.1z"/>
      </g>

      <!-- EB, a toda altura. Las tres barras de la E y los cuencos de la B salen de las mismas
           medidas: la barra central es más corta y el cuenco de abajo, más ancho que el de arriba. -->
      <g fill="var(--ineb-red)">
        <path d="M47.7 1.4h29.8v8.3H58.7v4.8h16.1v7.9H58.7v5.3h19.1v8.2H47.7z"/>
        <path fill-rule="evenodd" clip-rule="evenodd"
              d="M85.9 1.4h26.5a5.9 8.3 0 0 1 .2 16.6 7.1 8.95 0 0 1-.9 17.9H85.9zM96.9 9.7h7.6a2.4 2.4 0 0 1 0 4.8h-7.6zM96.9 22.4h8.3a2.65 2.65 0 0 1 0 5.3h-8.3z"/>
      </g>
    </svg>
  `,
  styles: `
    :host {
      display: inline-block;
      line-height: 0;
      /* Paleta de INEB, medida del arte original. */
      --ineb-yellow: #ffd230;
      --ineb-red: #ff3131;
      --ineb-navy: #10144a;
    }
    /* Sobre oscuro «IN» es blanco, como el original; sobre claro toma la tinta de marca, que es lo
       que el PNG no podía hacer (se quedaba invisible). */
    :host(.is-dark) { --ineb-in: #ffffff; }
    :host(.is-light) { --ineb-in: var(--ineb-navy); }
    svg { display: block; height: var(--ineb-size, 40px); width: auto; }
  `,
})
export class InebLogoComponent {
  readonly tone = input<InebLogoTone>('dark');

  protected readonly hostClass = computed(() => `is-${this.tone()}`);
}
