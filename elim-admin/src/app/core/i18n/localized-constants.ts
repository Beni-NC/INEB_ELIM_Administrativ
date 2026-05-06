/**
 * Constantes localizadas (días/meses) que se actualizan dinámicamente cuando
 * cambia el idioma activo en `LanguageService`. Las utilidades `date.utils.ts`
 * leen desde aquí para evitar reescribir todos los callers.
 *
 * Los arrays iniciales son los de rumano (idioma por defecto), por si se
 * accede antes de la inicialización de TranslateService.
 */
export const localizedConstants = {
  DAYS_LONG: ['Duminică', 'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă'],
  DAYS_SHORT: ['DUM', 'LUN', 'MAR', 'MIE', 'JOI', 'VIN', 'SÂM'],
  DAYS_LETTER: ['D', 'L', 'M', 'M', 'J', 'V', 'S'],
  MONTHS_LONG: [
    'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
    'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie',
  ],
  MONTHS_LONG_LOWER: [
    'ianuarie', 'februarie', 'martie', 'aprilie', 'mai', 'iunie',
    'iulie', 'august', 'septembrie', 'octombrie', 'noiembrie', 'decembrie',
  ],
  MONTHS_SHORT: ['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  MONTHS_SHORT_UPPER: ['IAN', 'FEB', 'MAR', 'APR', 'MAI', 'IUN', 'IUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'],
};

export type LocalizedConstantsKey = keyof typeof localizedConstants;
