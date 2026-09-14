import { Injectable, inject } from '@angular/core';
import { DataService } from './data.service';
import { startOfDay } from '../utils/date.utils';

/**
 * "Hoy" se congela al arrancar (`ScheduleIndex.today`): todo el índice (próximo evento, días
 * restantes, "Azi") se deriva de esa fecha. En el móvil la PWA queda abierta durante días, así
 * que al volver a primer plano se comprueba si ha cambiado el día y, si es así, se recarga: los
 * datos son estáticos y una recarga es lo más simple y seguro para recomputar todo.
 */
@Injectable({ providedIn: 'root' })
export class DayRolloverService {
  private readonly data = inject(DataService);

  init(): void {
    const check = (): void => {
      if (document.visibilityState !== 'visible') return;
      if (startOfDay().getTime() !== this.data.today.getTime()) document.location.reload();
    };
    document.addEventListener('visibilitychange', check);
    window.addEventListener('focus', check);
  }
}
