import { TEAM_COLORS, TEAM_ICONS, RULE_ICONS } from '../constants';

export function getTeamColor(teamName: string): string {
  return TEAM_COLORS[teamName] ?? '#546e7a';
}

export function getTeamIcon(teamName: string): string {
  return TEAM_ICONS[teamName] ?? 'group';
}

export function getTeamNumber(teamName: string): string {
  return teamName.replace('Echipa ', '');
}

export function getRuleIcon(index: number): string {
  return RULE_ICONS[index] ?? 'info';
}

export function getPhoneHref(phone: string): string {
  return 'tel:+34' + phone.split(' ').join('');
}

export function getEmailHref(email: string): string {
  return 'mailto:' + email;
}
