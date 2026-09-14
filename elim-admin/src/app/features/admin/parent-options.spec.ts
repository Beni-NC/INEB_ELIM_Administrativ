import { describe, expect, it } from 'vitest';
import { sortParents } from './parent-options';
import { Parent } from '../../core/models';

const parent = (id: string, name: string): Parent => ({
  id, name, phone: '', email: '', role: '', skills: [], joinedDate: new Date(2026, 0, 1),
  notes: '', initials: name.slice(0, 2).toUpperCase(), tone: 0, available: true,
});
const stat = (id: string, name: string, total: number, last: Date | null) =>
  ({ parent: parent(id, name), total, upcoming: 0, last });

describe('sortParents', () => {
  const stats = [
    stat('p-1', 'Ana', 2, new Date(2026, 4, 1)),
    stat('p-2', 'Bogdan', 0, null),
    stat('p-3', 'Carmen', 2, new Date(2026, 0, 1)),
  ];

  it('por carga: menos apoyos primero y, a igualdad, quien lleva más sin ayudar', () => {
    expect(sortParents(stats, 'workload').map(s => s.parent.id)).toEqual(['p-2', 'p-3', 'p-1']);
  });

  it('por antigüedad: quien lleva más tiempo sin ayudar, antes', () => {
    expect(sortParents(stats, 'oldest').map(s => s.parent.id)).toEqual(['p-2', 'p-3', 'p-1']);
  });

  it('alfabético', () => {
    expect(sortParents(stats, 'name').map(s => s.parent.name)).toEqual(['Ana', 'Bogdan', 'Carmen']);
  });
});
