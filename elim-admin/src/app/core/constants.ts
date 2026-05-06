/* Centralized localization & theming constants. Frozen for safety. */

export const DAYS_LONG = Object.freeze(
  ['Duminică', 'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă']
);
export const DAYS_SHORT = Object.freeze(
  ['DUM', 'LUN', 'MAR', 'MIE', 'JOI', 'VIN', 'SÂM']
);
export const DAYS_LETTER = Object.freeze(['D', 'L', 'M', 'M', 'J', 'V', 'S']);

export const MONTHS_LONG = Object.freeze([
  'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
  'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie',
]);
export const MONTHS_LONG_LOWER = Object.freeze([
  'ianuarie', 'februarie', 'martie', 'aprilie', 'mai', 'iunie',
  'iulie', 'august', 'septembrie', 'octombrie', 'noiembrie', 'decembrie',
]);
export const MONTHS_SHORT = Object.freeze(
  ['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
);
export const MONTHS_SHORT_UPPER = Object.freeze(
  ['IAN', 'FEB', 'MAR', 'APR', 'MAI', 'IUN', 'IUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
);

export const TEAM_COLORS: Readonly<Record<string, string>> = Object.freeze({
  'Echipa 1': '#1565c0',
  'Echipa 2': '#6a1b9a',
  'Echipa 3': '#2e7d32',
  'Echipa 4': '#e65100',
  'Echipa 5': '#c62828',
  'Echipa 6': '#00838f',
  'Echipa 7': '#ad1457',
});

export const TEAM_ICONS: Readonly<Record<string, string>> = Object.freeze({
  'Echipa 1': 'looks_one',
  'Echipa 2': 'looks_two',
  'Echipa 3': 'looks_3',
  'Echipa 4': 'looks_4',
  'Echipa 5': 'looks_5',
  'Echipa 6': 'looks_6',
  'Echipa 7': 'filter_7',
});

export const RULE_ICONS = Object.freeze(
  ['person', 'checklist', 'schedule', 'cleaning_services']
);

export const MS_PER_DAY = 1000 * 60 * 60 * 24;

export const TAB_PATHS = Object.freeze({
  schedule: '',
  teams: 'echipe',
  youths: 'tineri',
  parents: 'parinti',
  rules: 'reguli',
});

export const TAB_ORDER = Object.freeze(
  ['', 'echipe', 'tineri', 'parinti', 'reguli'] as const
);
