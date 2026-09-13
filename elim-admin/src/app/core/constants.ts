/** Constantes de la aplicación (rutas, colores de equipo, iconos). Congeladas. */

export const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** Rutas de las pestañas (el orden define el swipe y la barra de navegación). */
export const TAB_PATHS = Object.freeze({
  schedule: '',
  teams: 'echipe',
  youths: 'tineri',
  parents: 'parinti',
  rules: 'reguli',
});

export const TAB_ORDER: readonly string[] = Object.freeze([
  TAB_PATHS.schedule, TAB_PATHS.teams, TAB_PATHS.youths, TAB_PATHS.parents, TAB_PATHS.rules,
]);

/**
 * Color de identidad de cada equipo. Se resuelve al token CSS (`--team-N` en tokens.css)
 * para que la paleta viva en un único sitio; la UI lo aplica vía `[style.--team-color]`.
 */
export const TEAM_COLORS: Readonly<Record<string, string>> = Object.freeze({
  'Echipa 1': 'var(--team-1)',
  'Echipa 2': 'var(--team-2)',
  'Echipa 3': 'var(--team-3)',
  'Echipa 4': 'var(--team-4)',
  'Echipa 5': 'var(--team-5)',
  'Echipa 6': 'var(--team-6)',
  'Echipa 7': 'var(--team-7)',
});

export const TEAM_COLOR_DEFAULT = 'var(--team-default)';
