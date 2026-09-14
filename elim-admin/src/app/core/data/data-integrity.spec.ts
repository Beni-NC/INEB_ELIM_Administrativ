import { describe, expect, it } from 'vitest';
import { DOMAIN_DATA } from './index';
import { checkDomainData, errorsOf, warningsOf } from '../domain/data-health';

/**
 * Los DATOS REALES pasan por las mismas comprobaciones que muestra el panel `/admin`
 * (`checkDomainData`): un id mal escrito, una tilde distinta o una fecha repetida no fallan al
 * compilar, pero en la app se ven como vínculos que no aparecen o contadores incompletos. Aquí
 * rompen el build; los avisos solo se anotan (son planificación pendiente o erratas probables).
 */
const issues = checkDomainData(DOMAIN_DATA);
const describeIssue = (i: { id: string; items: readonly string[] }): string => `${i.id}: ${i.items.join(' · ')}`;

/** Avisos aceptables: dependen de cuánta planificación quede por hacer en cada momento. */
const KNOWN_WARNINGS = ['not_friday', 'team_without_upcoming', 'upcoming_without_parents', 'youth_without_team'];

describe('Datos reales (core/data)', () => {
  it('no tienen ningún error de integridad', () => {
    expect(errorsOf(issues).map(describeIssue)).toEqual([]);
  });

  it('solo producen avisos conocidos, y quedan anotados para revisarlos', () => {
    const warnings = warningsOf(issues);
    if (warnings.length > 0) console.warn(`[datos] Avisos (ver /admin → Stare date):\n  ${warnings.map(describeIssue).join('\n  ')}`);
    expect(warnings.map(w => w.id).filter(id => !KNOWN_WARNINGS.includes(id))).toEqual([]);
  });
});
