import { Routes } from '@angular/router';
import { TAB_PATHS } from './core/constants';

export const routes: Routes = [
  {
    path: TAB_PATHS.schedule,
    title: 'tabs.schedule',
    pathMatch: 'full',
    loadComponent: () =>
      import('./features/schedule/schedule.component').then(m => m.ScheduleComponent),
  },
  {
    path: TAB_PATHS.teams,
    title: 'tabs.teams',
    loadComponent: () =>
      import('./features/teams/teams.component').then(m => m.TeamsComponent),
  },
  {
    path: TAB_PATHS.youths,
    title: 'tabs.youths',
    loadComponent: () =>
      import('./features/youths/youths.component').then(m => m.YouthsComponent),
  },
  {
    path: TAB_PATHS.parents,
    title: 'tabs.parents',
    loadComponent: () =>
      import('./features/parents/parents.component').then(m => m.ParentsComponent),
  },
  {
    path: TAB_PATHS.rules,
    title: 'tabs.rules',
    loadComponent: () =>
      import('./features/rules/rules.component').then(m => m.RulesComponent),
  },
  {
    // Panel de planificación: deliberadamente FUERA de `TAB_PATHS` (no sale en las pestañas, ni en
    // el gesto de deslizar, ni en ningún enlace). Quien mantiene los datos entra escribiendo /admin.
    path: 'admin',
    title: 'admin.title',
    loadComponent: () =>
      import('./features/admin/admin.component').then(m => m.AdminComponent),
  },
  { path: '**', redirectTo: '' },
];
