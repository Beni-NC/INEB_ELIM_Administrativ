import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { DataService } from '../../core/services/data.service';
import { NavigationService } from '../../core/services/navigation.service';
import { Parent } from '../../core/models';
import { LDatePipe } from '../../core/i18n/ldate.pipe';
import { entryKey } from '../../core/utils/schedule.utils';
import { daysBetween, isSameDay } from '../../core/utils/date.utils';
import { EventRowComponent } from '../../shared/ui/event-row/event-row.component';
import { NextEventCardComponent } from '../../shared/ui/next-event-card/next-event-card.component';
import { CalendarButtonComponent } from '../../shared/ui/calendar-button/calendar-button.component';
import { WhatsappButtonComponent } from '../../shared/ui/whatsapp-button/whatsapp-button.component';

/** Părinți: próximo apoyo, programaciones con padres y directorio de padres con perfil expandible. */
@Component({
    selector: 'app-parents',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgTemplateOutlet, TranslatePipe, LDatePipe, EventRowComponent, NextEventCardComponent, CalendarButtonComponent, WhatsappButtonComponent],
    templateUrl: './parents.component.html',
    styleUrl: './parents.component.css'
})
export class ParentsComponent {
  protected readonly data = inject(DataService);
  protected readonly nav = inject(NavigationService);

  readonly expanded = this.nav.expandedParentId;
  readonly showArchived = signal(false);
  readonly archivedOpen = computed(() => {
    const id = this.expanded();
    return this.showArchived() || (!!id && this.data.inactiveParents.some(p => p.id === id));
  });
  readonly showPastGlobal = signal(false);
  readonly pastOpen = signal<Set<string>>(new Set());

  protected readonly entryKey = entryKey;

  toggle(p: Parent): void { this.nav.toggle('parent', p.id); }

  togglePast(id: string): void {
    const next = new Set(this.pastOpen());
    if (next.has(id)) next.delete(id); else next.add(id);
    this.pastOpen.set(next);
  }
  isPastOpen(id: string): boolean { return this.pastOpen().has(id); }

  /** Nombres de los hijos en el departamento, para la línea secundaria de la fila. */
  childrenNames(p: Parent): string {
    return this.data.getYouthsForParent(p.id).map(l => l.youth.fullName).join(', ');
  }

  daysUntil(date: Date): number { return daysBetween(date, this.data.today); }
  isToday(date: Date): boolean { return isSameDay(date, this.data.today); }
}
