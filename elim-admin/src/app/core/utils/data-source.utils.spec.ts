import { describe, expect, it } from 'vitest';
import {
  closeMembershipLine, dateLiteral, membershipLine, nextParentId, parentBlock, parentYouthLinkLine,
  scheduleLine, scheduleLineFor, withHeader, youthId, youthLine,
} from './data-source.utils';
import { ScheduleEntry } from '../models';

/**
 * Lo que genera el panel `/admin` se pega tal cual en los ficheros de datos: el formato debe
 * coincidir con el que ya está escrito a mano (comillas simples, mes base 0, orden de campos).
 */
describe('data-source.utils — programaciones', () => {
  it('genera la línea de una programación con el formato de schedule.data.ts', () => {
    expect(scheduleLine({
      date: new Date(2026, 8, 25), teamName: 'Echipa 6', coordinatorName: 'Halas Noemi',
      estimatedPersons: 60, parentIds: [],
    })).toBe("  { team: 'Echipa 6', coordinator: 'Halas Noemi', programType: 'youth_evening', estimatedPersons: 60, date: new Date(2026, 8, 25), observations: '' },");
  });

  it('añade los padres de apoyo solo si los hay', () => {
    const line = scheduleLine({
      date: new Date(2026, 8, 25), teamName: 'Echipa 6', coordinatorName: 'Halas Noemi',
      estimatedPersons: 45, parentIds: ['p-001', 'p-004'],
    });
    expect(line).toContain("parentSupporters: ['p-001', 'p-004']");
  });

  it('regenera una programación existente conservando sus datos y observaciones', () => {
    const entry: ScheduleEntry = {
      team: 'Echipa 2', coordinator: "O'Neil Ana", programType: 'youth_evening', estimatedPersons: 50,
      date: new Date(2026, 0, 9), observations: 'Aduceți farfurii',
    };
    const line = scheduleLineFor(entry, { parentIds: ['p-007'] });
    // El apóstrofo del nombre se escapa para no romper la literal de TypeScript.
    expect(line).toContain("coordinator: 'O\\'Neil Ana'");
    expect(line).toContain("observations: 'Aduceți farfurii'");
    expect(line).toContain("parentSupporters: ['p-007']");
  });

  it('escribe las fechas como en los datos (mes base 0)', () => {
    expect(dateLiteral(new Date(2026, 11, 31))).toBe('new Date(2026, 11, 31)');
  });
});

describe('data-source.utils — personas', () => {
  it('deriva el id del joven con el patrón y-apellido-nombre, sin diacríticos', () => {
    expect(youthId('Tania', 'Bîrle')).toBe('y-birle-tania');
    expect(youthId('Ana Maria', 'Mitoșeriu')).toBe('y-mitoseriu-ana-maria');
  });

  it('genera la línea del joven y la de su pertenencia', () => {
    expect(youthLine({
      firstName: 'Tania', lastName: 'Bîrle', gender: 'F', birthDate: new Date(2005, 9, 17), joinedYear: 2026, phone: '611 22 33 44',
    })).toBe("  youth('y-birle-tania', 'Tania', 'Bîrle', 'F', new Date(2005, 9, 17), 2026, { phone: '611 22 33 44' }),");
    expect(membershipLine('y-birle-tania', 'Echipa 2')).toBe("  membership('y-birle-tania', 'Echipa 2'),");
    expect(membershipLine('y-halas-luigi', 'Echipa 1', 'coordonator')).toBe("  membership('y-halas-luigi', 'Echipa 1', 'coordonator'),");
  });

  it('cierra una pertenencia con su fecha de fin', () => {
    expect(closeMembershipLine('y-halas-luigi', 'Echipa 1', new Date(2026, 1, 27), 'coordonator'))
      .toBe("  membership('y-halas-luigi', 'Echipa 1', 'coordonator', false, new Date(2026, 1, 27)),");
  });

  it('calcula el siguiente id de padre libre', () => {
    expect(nextParentId([{ id: 'p-001' }, { id: 'p-013' }, { id: 'p-002' }])).toBe('p-014');
    expect(nextParentId([])).toBe('p-001');
  });

  it('genera el bloque del padre y el vínculo familiar', () => {
    const block = parentBlock({ id: 'p-014', name: 'Maria Bîrle', phone: '', email: '', joinedDate: new Date(2026, 8, 1) });
    expect(block.split('\n')[1]).toBe("    id: 'p-014',");
    expect(block).toContain('joinedDate: new Date(2026, 8, 1),');
    expect(parentYouthLinkLine('p-014', 'y-birle-tania', 'mother'))
      .toBe("  { parentId: 'p-014', youthId: 'y-birle-tania', relationship: 'mother' },");
  });

  it('encabeza cada bloque con el fichero al que va', () => {
    expect(withHeader('src/app/core/data/youths.data.ts', 'x')).toBe('// → src/app/core/data/youths.data.ts\nx\n');
  });
});
