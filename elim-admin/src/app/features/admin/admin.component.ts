import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { HealthSectionComponent } from './sections/health-section.component';
import { ScheduleSectionComponent } from './sections/schedule-section.component';
import { ParentsSectionComponent } from './sections/parents-section.component';
import { TeamsSectionComponent } from './sections/teams-section.component';
import { PeopleSectionComponent } from './sections/people-section.component';

type Section = 'health' | 'schedule' | 'parents' | 'teams' | 'people';

const STORAGE_KEY = 'admin.section';

/**
 * Panel de planificación (`/admin`) — **no forma parte de la app pública**: no está en las
 * pestañas ni en el gesto de deslizar; al pie hay un icono discreto para quien lo mantiene.
 *
 * Es la herramienta de quien escribe los datos: propone turnos, reparte padres, da de alta
 * personas, recompone equipos y avisa de lo que no cuadra. No guarda nada (la app no tiene
 * backend): entrega el **texto exacto** que se pega en `core/data/*.data.ts`. Cada sección es un
 * componente propio; esto solo elige cuál se ve y lo recuerda para la próxima visita.
 */
@Component({
  selector: 'app-admin',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslatePipe, HealthSectionComponent, ScheduleSectionComponent,
    ParentsSectionComponent, TeamsSectionComponent, PeopleSectionComponent,
  ],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css',
})
export class AdminComponent {
  readonly sections: Section[] = ['health', 'schedule', 'parents', 'teams', 'people'];
  readonly section = signal<Section>(readStored() ?? 'health');

  select(section: Section): void {
    this.section.set(section);
    try { localStorage.setItem(STORAGE_KEY, section); } catch { /* sin almacenamiento: dura la sesión */ }
  }
}

function readStored(): Section | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY) as Section | null;
    return value && ['health', 'schedule', 'parents', 'teams', 'people'].includes(value) ? value : null;
  } catch {
    return null;
  }
}
