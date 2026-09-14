import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

/** Fondo sobre el que se pinta: decide tinta y acento (no hay dos ficheros). */
export type BrandLogoTone = 'light' | 'dark';

/**
 * Marca de la iglesia ELIM — el mismo wordmark tipográfico que usa MEDIA-ELIM, portado a los
 * tokens de esta app. Es texto real (pesa 0 kB, escala sin perder nitidez, lo leen los lectores
 * de pantalla y hereda el tono claro/oscuro), por eso sustituye a los PNG blancos que solo se
 * veían sobre fondo oscuro.
 *
 * La localidad se justifica al ancho exacto de «ELIM»: la rejilla tiene una sola columna
 * `max-content` fijada por el nombre; el `letter-spacing` del nombre se compensa con un margen
 * negativo, y la localidad no aporta ancho (`width: 0; min-width: 100%`) y reparte la holgura
 * con `text-align-last: justify`. Su tamaño deriva del nombre, así la proporción es fija.
 *
 * El tamaño no es un input: lo decide el contexto con la propiedad `--brand-size` (cabecera y
 * footer usan un `clamp` fluido en `layout.css`); sin ella, 24 px.
 */
@Component({
    selector: 'app-brand-logo',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [RouterLink, TranslatePipe],
    host: { '[class]': 'hostClass()' },
    template: `
    @if (link(); as href) {
      <a class="brand" [routerLink]="href" [title]="'brand.name' | translate">
        <span class="brand__name">{{ 'brand.short' | translate }}</span>
        <span class="brand__city">{{ 'brand.location' | translate }}</span>
      </a>
    } @else {
      <span class="brand" role="img" [attr.aria-label]="'brand.name' | translate">
        <span class="brand__name">{{ 'brand.short' | translate }}</span>
        <span class="brand__city">{{ 'brand.location' | translate }}</span>
      </span>
    }
  `,
    styleUrl: './brand-logo.component.css'
})
export class BrandLogoComponent {
  readonly tone = input<BrandLogoTone>('light');
  /** Ruta interna del enlace; `null` la pinta como imagen no navegable. */
  readonly link = input<string | null>('/');

  protected readonly hostClass = computed(() => `is-${this.tone()}`);
}
