import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Fondo sobre el que se pinta: decide la tinta de «IN» (no hay dos ficheros). */
export type InebLogoTone = 'light' | 'dark';

/**
 * Marca de INEB, el mismo planteamiento que `app-brand-logo`: dibujo en el propio bundle en vez de
 * un PNG. El original (`logo-ineb.png`) solo servía sobre fondo oscuro —«IN» es blanco—, se veía
 * borroso al escalar y pesaba 6 kB de red.
 *
 * Geometría medida sobre el arte original a 6000×1875 (1 unidad = 50 px de aquel lienzo), así que
 * cada número de los trazados es una medida, no un tanteo. El `viewBox` va **a ras de tinta**: el
 * alto que pida el contexto es el alto del logotipo, sin aire por medio. La estructura es un
 * bloque de dos alturas: a la izquierda la placa «TECH» sobre «IN», ambas del mismo ancho, y a la
 * derecha «EB» a toda altura, con la misma línea base que «IN».
 *
 * El tamaño lo decide el contexto con `--ineb-size` (alto); sin él, 40 px. Los colores de marca
 * viven aquí y no en los tokens de la app: son de INEB, no del tema.
 */
@Component({
  selector: 'app-ineb-logo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'hostClass()' },
  template: `
    <svg viewBox="0 0 118.2 34.5" fill="none" aria-hidden="true">
      <!-- La caja es la marca: el viewBox va a ras de tinta, sin el aire que traía el PNG, así
           el alto que pide el contexto es exactamente el alto del logotipo.
           Placa y «IN» comparten borde izquierdo y derecho (0 y 38,9), que es la intención del
           diseño original; en el arte bailaban una décima. -->
      <rect y="0.76" width="38.9" height="8.22" fill="var(--ineb-yellow)"/>

      <!-- TECH centrado en la placa —igual arriba que abajo— y con el tracking repartido a partes
           iguales: las cuatro letras miden 21 y los tres huecos, 4,88 cada uno. -->
      <g fill="var(--ineb-navy)">
        <path d="M1.63 2.05h5.32v1.8H5.19v3.84H3.39V3.85H1.63z"/>
        <path d="M11.83 2.05h4.78v1.5h-3.08v.57h2.47v1.5h-2.47v.57h3.08v1.5h-4.78z"/>
        <path d="M31.83 2.05h1.7v2.07h2.04V2.05h1.7v5.64h-1.7V5.62h-2.04v2.07h-1.7z"/>
      </g>
      <!-- La C se traza con línea, así que su caja de tinta es el arco MÁS medio trazo por lado:
           por eso el arco no llega a 26,95, sino a 26,10. Con eso los tres huecos miden 4,88. -->
      <path d="M26.1 4.05a1.97 1.97 0 1 0 0 1.64" stroke="var(--ineb-navy)" stroke-width="1.7"/>

      <!-- IN: mismo ancho que la placa y misma línea base que EB. -->
      <g fill="var(--ineb-in)">
        <rect y="10.7" width="7.7" height="23.8"/>
        <path d="M15 10.7h7.1l9.8 12.5V10.7h7v23.8h-7l-9.8-11.6v11.6H15z"/>
      </g>

      <!-- EB. Las tres barras de la E y los dos contrapuntos de la B comparten alturas (0–8,3 /
           13,1–21 / 26,3–34,5): es la retícula del original. La barra central es más corta y el
           cuenco de abajo más ancho que el de arriba, estrechándose en la cintura. -->
      <g fill="var(--ineb-red)">
        <path d="M46.8 0h29.8v8.3H57.8v4.8h16.1V21H57.8v5.3h19.1v8.2H46.8z"/>
        <path fill-rule="evenodd" clip-rule="evenodd"
              d="M85 0h26.5a5.8 8.3 0 0 1 .2 16.6 6.95 8.95 0 0 1-.9 17.9H85zM96 8.3h7.7a2.4 2.4 0 0 1 0 4.8H96zM96 21h8.25a2.65 2.65 0 0 1 0 5.3H96z"/>
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
