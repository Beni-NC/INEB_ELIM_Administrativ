import { MS_PER_DAY } from '../constants';
import { localizedConstants } from '../i18n/localized-constants';

/** Stateless date helpers. `today` is passed in to avoid coupling to clock state. */
export function formatDate(date: Date): string {
  return `${localizedConstants.DAYS_LONG[date.getDay()]}, ${date.getDate()} ${localizedConstants.MONTHS_LONG[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatDateShort(date: Date): string {
  return `${date.getDate()} ${localizedConstants.MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatBirthDate(date: Date): string {
  return `${date.getDate()} ${localizedConstants.MONTHS_LONG_LOWER[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatJoinedDate(date: Date): string {
  return `${localizedConstants.MONTHS_LONG_LOWER[date.getMonth()]} ${date.getFullYear()}`;
}

export function getMonthShort(date: Date): string {
  return localizedConstants.MONTHS_SHORT_UPPER[date.getMonth()];
}

export function getWeekdayShort(date: Date): string {
  return localizedConstants.DAYS_SHORT[date.getDay()];
}

export function daysBetween(target: Date, ref: Date): number {
  return Math.ceil((target.getTime() - ref.getTime()) / MS_PER_DAY);
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

export function getAge(birthDate: Date, ref: Date): number {
  return Math.floor((ref.getTime() - birthDate.getTime()) / (MS_PER_DAY * 365.25));
}

export function startOfDay(d = new Date()): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}
