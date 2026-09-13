import { ChangeDetectionStrategy, Component, ElementRef, HostListener, computed, inject, input, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { CalendarScope, CalendarService } from '../../../core/services/calendar.service';
import { ScheduleEntry } from '../../../core/models';

/**
 * Botón "calendario" con dos acciones en un menú mínimo:
 *  1. Descargar un .ics con las programaciones futuras del ámbito.
 *  2. Suscribirse: copia la URL del feed publicado (`assets/calendars/*.ics`), que el calendario
 *     del móvil vuelve a leer periódicamente, así los cambios llegan solos.
 *
 * Se configura con UNO de: `all` | `event` | `team` | `youthId`(+`youthName`) | `parentId`(+`parentName`).
 * No se pinta si no hay nada que exportar (p. ej. joven sin programaciones futuras).
 */
@Component({
    selector: 'app-calendar-button',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [TranslatePipe],
    templateUrl: './calendar-button.component.html',
    styleUrl: './calendar-button.component.css'
})
export class CalendarButtonComponent {
  /** Todas las programaciones futuras (feed global). */
  readonly all = input(false);
  readonly event = input<ScheduleEntry | null>(null);
  readonly team = input<string | null>(null);
  readonly youthId = input<string | null>(null);
  readonly youthName = input<string | null>(null);
  readonly parentId = input<string | null>(null);
  readonly parentName = input<string | null>(null);
  /** Muestra texto junto al icono (solo en la tarjeta destacada). */
  readonly withLabel = input(false);

  private readonly cal = inject(CalendarService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly open = signal(false);
  /** URL copiada tras "suscribirse"; muestra la confirmación con el enlace webcal alternativo. */
  protected readonly copiedUrl = signal<string | null>(null);

  protected readonly scope = computed<CalendarScope | null>(() => {
    if (this.all()) return { kind: 'all' };
    const e = this.event();
    if (e) return { kind: 'event', entry: e };
    if (this.team()) return { kind: 'team', team: this.team()! };
    if (this.youthId()) return { kind: 'youth', id: this.youthId()!, name: this.youthName() ?? this.youthId()! };
    if (this.parentId()) return { kind: 'parent', id: this.parentId()!, name: this.parentName() ?? this.parentId()! };
    return null;
  });

  /** Nº de eventos que se descargarían. */
  protected readonly count = computed(() => {
    const s = this.scope();
    return s ? this.cal.upcomingEvents(s).length : 0;
  });
  /** Sin eventos no hay nada que ofrecer… salvo en el feed global, al que conviene suscribirse antes de que se publiquen. */
  protected readonly visible = computed(() => this.scope()?.kind === 'all' || this.count() > 0);

  protected readonly webcalUrl = computed(() => {
    const url = this.copiedUrl();
    return url ? this.cal.toWebcal(url) : null;
  });

  protected toggle(ev: Event): void {
    ev.stopPropagation();
    this.copiedUrl.set(null);
    this.open.update(v => !v);
  }

  protected download(ev: Event): void {
    ev.stopPropagation();
    const s = this.scope();
    if (s) this.cal.download(s);
    this.open.set(false);
  }

  protected async subscribe(ev: Event): Promise<void> {
    ev.stopPropagation();
    const s = this.scope();
    if (!s) return;
    const url = this.cal.subscriptionUrl(s);
    await this.cal.copyToClipboard(url);
    // Aunque el portapapeles falle, el enlace queda visible para copiarlo a mano.
    this.copiedUrl.set(url);
  }

  protected stop(ev: Event): void { ev.stopPropagation(); }

  /* Cierre por clic fuera o Escape (el menú no captura el foco). */
  @HostListener('document:click', ['$event'])
  onDocumentClick(ev: Event): void {
    if (this.open() && !this.host.nativeElement.contains(ev.target as Node)) this.open.set(false);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void { this.open.set(false); }
}
