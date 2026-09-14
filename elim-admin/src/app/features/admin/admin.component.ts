import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { HealthSectionComponent } from './sections/health-section.component';
import { ScheduleSectionComponent } from './sections/schedule-section.component';
import { ParentsSectionComponent } from './sections/parents-section.component';
import { TeamsSectionComponent } from './sections/teams-section.component';
import { PeopleSectionComponent } from './sections/people-section.component';
import { DataSectionComponent } from './sections/data-section.component';

type Section = 'health' | 'schedule' | 'parents' | 'teams' | 'people' | 'data';

/** Orden y símbolo de cada sección: del diagnóstico a los datos en crudo. */
const SECTIONS: readonly { id: Section; icon: string }[] = [
  { id: 'health', icon: 'checklist' },
  { id: 'schedule', icon: 'calendar_month' },
  { id: 'parents', icon: 'family_restroom' },
  { id: 'teams', icon: 'groups' },
  { id: 'people', icon: 'person' },
  { id: 'data', icon: 'database' },
];

const STORAGE_KEY = 'admin.section';

/**
 * Panel de planificación (`/admin`) — **no forma parte de la app pública**: no está en las
 * pestañas ni en el gesto de deslizar; al pie hay un icono discreto para quien lo mantiene.
 *
 * Es la herramienta de quien escribe los datos: propone turnos, reparte padres, da de alta
 * personas, recompone equipos y avisa de lo que no cuadra. Entrega el **texto exacto** que se
 * pega en `core/data/*.data.ts`: el cambio pasa por el repositorio, donde una persona lo revisa
 * antes de publicarlo. Cada sección es un componente propio; esto solo elige cuál se ve y lo
 * recuerda para la próxima visita.
 */
@Component({
  selector: 'app-admin',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslatePipe, HealthSectionComponent, ScheduleSectionComponent,
    ParentsSectionComponent, TeamsSectionComponent, PeopleSectionComponent, DataSectionComponent,
  ],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css',
})
export class AdminComponent {
  readonly sections = SECTIONS;
  readonly section = signal<Section>(readStored() ?? 'health');
  /** La explicación se enseña a quien pregunta; quien mantiene los datos ya la conoce. */
  readonly showInfo = signal(false);

  select(section: Section): void {
    this.section.set(section);
    try { localStorage.setItem(STORAGE_KEY, section); } catch { /* sin almacenamiento: dura la sesión */ }
  }
}

function readStored(): Section | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY) as Section | null;
    return value && SECTIONS.some(s => s.id === value) ? value : null;
  } catch {
    return null;
  }
}
