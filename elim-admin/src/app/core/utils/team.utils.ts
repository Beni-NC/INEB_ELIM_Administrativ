import { TEAM_COLORS, TEAM_COLOR_DEFAULT } from '../constants';

/** Color CSS (token) del equipo, para `[style.--team-color]`. */
export function getTeamColor(teamName: string): string {
  return TEAM_COLORS[teamName] ?? TEAM_COLOR_DEFAULT;
}

/** "Echipa 4" → "4". */
export function getTeamNumber(teamName: string): string {
  return teamName.replace('Echipa ', '');
}
