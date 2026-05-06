import { Routes } from '@angular/router';
import { TAB_PATHS } from './core/constants';

export const routes: Routes = [
  {
    path: TAB_PATHS.schedule,
    pathMatch: 'full',
    loadComponent: () =>
      import('./features/schedule/schedule.component').then(m => m.ScheduleComponent),
  },
  {
    path: TAB_PATHS.teams,
    loadComponent: () =>
      import('./features/teams/teams.component').then(m => m.TeamsComponent),
  },
  {
    path: TAB_PATHS.youths,
    loadComponent: () =>
      import('./features/youths/youths.component').then(m => m.YouthsComponent),
  },
  {
    path: TAB_PATHS.parents,
    loadComponent: () =>
      import('./features/parents/parents.component').then(m => m.ParentsComponent),
  },
  {
    path: TAB_PATHS.rules,
    loadComponent: () =>
      import('./features/rules/rules.component').then(m => m.RulesComponent),
  },
  { path: '**', redirectTo: '' },
];
