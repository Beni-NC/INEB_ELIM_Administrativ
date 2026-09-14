import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ScheduleEntry } from '../../../core/models';
import { EventShareService } from '../../../core/services/event-share.service';

/**
 * "Trimite detaliile": botón que envía el mensaje de una programación (fecha, horas, coordinador,
 * padres, enlace al equipo) al grupo del equipo por la hoja nativa de compartir o WhatsApp Web.
 * Icono `send` para distinguirlo de compartir la app (`share`).
 */
@Component({
  selector: 'app-event-share-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe],
  template: `
    <button type="button" class="ui-btn ui-btn--ghost" [class.ui-btn--icon]="!withLabel()" (click)="share($event)"
            [attr.aria-label]="'event_share.button' | translate" [title]="'event_share.button' | translate">
      <svg class="icon" aria-hidden="true"><use href="assets/icons.svg#send"/></svg>
      @if (withLabel()) { <span>{{ 'event_share.button' | translate }}</span> }
    </button>
  `,
})
export class EventShareButtonComponent {
  readonly entry = input.required<ScheduleEntry>();
  readonly withLabel = input(false);
  private readonly service = inject(EventShareService);

  protected share(ev: Event): void {
    ev.stopPropagation();
    void this.service.share(this.entry());
  }
}
