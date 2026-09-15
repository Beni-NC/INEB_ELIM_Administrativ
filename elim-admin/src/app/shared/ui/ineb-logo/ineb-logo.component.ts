import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Fondo sobre el que se pinta: decide la tinta del nombre (no hay dos ficheros). */
export type InebLogoTone = 'light' | 'dark';

/**
 * Cómo se arma la marca:
 *  - `lockup`  — la completa: placa TECH sobre «IN», y «EB» a toda altura. Pide **32 px de alto
 *                como mínimo**; por debajo, «TECH» deja de leerse y estorba.
 *  - `compact` — la palabra en una línea, un solo tamaño y una sola tinta. Baja a 16 px sin
 *                romperse: es la que vale para favicon, firma de correo o barras estrechas.
 *  - `auto`    — la completa donde cabe y la compacta donde no. Se resuelve en CSS, sin JavaScript.
 */
export type InebLogoVariant = 'lockup' | 'compact' | 'auto';

/**
 * Marca de INEB, el mismo planteamiento que `app-brand-logo`: dibujo en el propio bundle en vez de
 * un PNG. El original (`logo-ineb.png`) solo servía sobre fondo oscuro —«IN» es blanco—, se veía
 * borroso al escalar y pesaba 6 kB de red.
 *
 * Geometría medida sobre el arte original a 6000×1875 (1 unidad = 50 px de aquel lienzo), así que
 * cada número de los trazados es una medida, no un tanteo. El `viewBox` va **a ras de tinta**: el
 * alto que pida el contexto es el alto del logotipo, sin aire por medio.
 *
 * Sobre esas medidas se corrige lo que pide un ojo entrenado y el arte no traía:
 *  - **desbordamiento óptico**: los cuencos de la B y la C de TECH sobresalen un poco de la línea
 *    de las letras planas, porque una forma redonda a la misma altura se ve más pequeña;
 * El rojo de marca, en cambio, se queda igual en todos los fondos: es lo que da vida a la marca y
 * el contraste que da (3,9 sobre el navy) sobra para un logotipo de este tamaño.
 */
@Component({
  selector: 'app-ineb-logo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'hostClass()' },
  template: `
    @if (variant() !== 'compact') {
      <svg class="ineb ineb--lockup" viewBox="0 0 118.2 35.5" fill="none" aria-hidden="true">
        <!-- Placa y «IN» comparten borde izquierdo y derecho (0 y 38,9), que es la intención del
             diseño original; en el arte bailaban una décima. -->
        <rect y="1.26" width="38.9" height="8.22" fill="var(--ineb-yellow)"/>

        <!-- TECH con los grosores del original medidos al píxel: astas de 1,76 y barras de 1,40
             (una barra horizontal se dibuja más fina que un asta vertical o se ve más pesada),
             altura 5,46 y la C desbordándola 0,08 arriba y abajo. Centrado en la placa —igual
             arriba que abajo— y con los tres huecos repartidos a partes iguales. -->
        <g fill="var(--ineb-navy)">
          <path d="M1.63 2.64h5.32v1.4H5.17v4.06H3.41V4.04H1.63z"/>
          <path d="M11.98 2.64h4.78v1.32h-3.02v.74h2.6v1.26h-2.6v.82h3.02v1.32h-4.78z"/>
          <path d="M31.83 2.64h1.76v2.03h1.92V2.64h1.76v5.46h-1.76V6.07h-1.92v2.03h-1.76z"/>
          <!-- La C es un anillo con los remates cortados en horizontal y una abertura estrecha:
               0,98 de alto, el 17 % de la letra, medido en el arte. Con la abertura ancha parecía
               un Pac-Man. El anillo es más grueso de lado que por arriba y abajo, igual que las
               astas frente a las barras. -->
          <path fill-rule="evenodd" clip-rule="evenodd"
                d="M26.81 4.88A2.53 2.81 0 1 0 26.81 5.86H25.01A.73 1.49 0 1 1 25.01 4.88z"/>
        </g>

        <!-- IN: mismo ancho que la placa y misma línea base que EB. -->
        <g fill="var(--ineb-ink)">
          <rect y="11.2" width="7.7" height="23.8"/>
          <path d="M15 11.2h7.1l9.8 12.5V11.2h7v23.8h-7l-9.8-11.6v11.6H15z"/>
        </g>

        <!-- EB. Las tres barras de la E y los dos contrapuntos de la B comparten alturas; la barra
             central es más corta y el cuenco de abajo, más ancho que el de arriba. La B desborda
             medio punto por arriba y por abajo la línea de la E. -->
        <path fill="var(--ineb-red)" d="M46.8 .5h29.8v8.3H57.8v4.8h16.1V21.5H57.8v5.3h19.1v8.2H46.8z"/>
        <path fill="var(--ineb-red)" fill-rule="evenodd" clip-rule="evenodd"
              d="M85 0h26.5a5.8 8.55 0 0 1 .2 17.1 6.95 9.2 0 0 1-.9 18.4H85zM96 8.8h7.7a2.4 2.4 0 0 1 0 4.8H96zM96 21.5h8.25a2.65 2.65 0 0 1 0 5.3H96z"/>
      </svg>
    }

    @if (variant() !== 'lockup') {
      <!-- Compacta: las mismas letras (la I y la N a escala 1,4375, para igualar la altura de E y B)
           con un tracking único de 8. Conserva los dos colores —son la marca—: lo que partía la
           palabra en la completa no era el color, sino la diferencia de altura y la placa encima.
           Aquí las cuatro comparten línea base y altura, y el bloque se lee entero.
           Si se cambia una letra, cambia en los dos bloques. -->
      <svg class="ineb ineb--compact" viewBox="0 0 132.7 35.5" fill="none" aria-hidden="true">
        <g fill="var(--ineb-ink)">
          <rect y=".5" width="11.07" height="34.5"/>
          <g transform="translate(-2.49,-15.6) scale(1.4375)">
            <path d="M15 11.2h7.1l9.8 12.5V11.2h7v23.8h-7l-9.8-11.6v11.6H15z"/>
          </g>
        </g>
        <g fill="var(--ineb-red)">
          <path transform="translate(14.63,0)" d="M46.8 .5h29.8v8.3H57.8v4.8h16.1V21.5H57.8v5.3h19.1v8.2H46.8z"/>
          <path transform="translate(14.53,0)" fill-rule="evenodd" clip-rule="evenodd"
                d="M85 0h26.5a5.8 8.55 0 0 1 .2 17.1 6.95 9.2 0 0 1-.9 18.4H85zM96 8.8h7.7a2.4 2.4 0 0 1 0 4.8H96zM96 21.5h8.25a2.65 2.65 0 0 1 0 5.3H96z"/>
        </g>
      </svg>
    }
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
    /* El rojo de marca no se toca en ningún fondo: es lo que le da vida. Sobre el navy contrasta
       3,9, y para un logotipo de este tamaño y peso sobra —el listón de WCAG para texto grande es
       3, y los logotipos están exentos—; apagarlo solo servía para cumplir un umbral que aquí no
       aplica. Lo único que cambia con el fondo es la tinta del nombre. */
    :host(.is-dark) { --ineb-ink: #ffffff; }
    :host(.is-light) { --ineb-ink: var(--ineb-navy); }
    .ineb { display: block; height: var(--ineb-size, 40px); width: auto; }

    /* En modo auto, la completa solo donde cabe con holgura. El corte va por ancho de ventana porque de
       él depende el alto disponible en el pie, que es donde se usa. */
    :host(.v-auto) .ineb--lockup { display: none; }
    @media (min-width: 600px) {
      :host(.v-auto) .ineb--lockup { display: block; }
      :host(.v-auto) .ineb--compact { display: none; }
    }
  `,
})
export class InebLogoComponent {
  readonly tone = input<InebLogoTone>('dark');
  readonly variant = input<InebLogoVariant>('lockup');

  protected readonly hostClass = computed(() => `is-${this.tone()} v-${this.variant()}`);
}
