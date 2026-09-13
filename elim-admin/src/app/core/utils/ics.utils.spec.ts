import { describe, expect, it } from 'vitest';
import { IcsLabels, buildIcs, icsFileNameForEvent, slug } from './ics.utils';
import { ScheduleEntry } from '../models';
import { feedFileForParent, feedFileForTeam, feedFileForYouth, feedUrl } from './calendar-feeds';

const LABELS: IcsLabels = {
  calendarName: 'Programări Echipa 1',
  description: 'Programări tineret — Biserica ELIM',
  eventSummary: 'Program tineret — {{team}}',
  location: 'Biserica ELIM',
  fieldProgramType: 'Tip program',
  fieldCoordinator: 'Coordonator',
  fieldArrival: 'Sosire tineri',
  fieldProgramStart: 'Început program',
  fieldFood: 'Aducere mâncare (părinți)',
  fieldEstimated: 'Persoane estimate',
  fieldNotes: 'Observații',
};

const ENTRY: ScheduleEntry = {
  team: 'Echipa 1', coordinator: 'Halas Luigi', programType: 'Seară de tineret', estimatedPersons: 60,
  date: new Date(2026, 4, 8), observations: 'Aduceți farfurii, pahare; șervețele\nși fețe de masă', completed: false,
};

describe('buildIcs', () => {
  const ics = buildIcs([ENTRY], LABELS, new Date(Date.UTC(2026, 4, 1, 12, 0, 0)));
  const lines = ics.split('\r\n');

  it('produce un VCALENDAR válido con un VEVENT por programación', () => {
    expect(lines[0]).toBe('BEGIN:VCALENDAR');
    expect(lines.at(-2)).toBe('END:VCALENDAR');
    expect(ics.endsWith('\r\n')).toBe(true);
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(1);
    expect(ics).toContain('X-WR-CALNAME:Programări Echipa 1');
    expect(ics).toContain('DTSTAMP:20260501T120000Z');
  });

  it('usa hora local flotante: llegada de jóvenes → inicio + 2h30', () => {
    expect(ics).toContain('DTSTART:20260508T193000');
    expect(ics).toContain('DTEND:20260508T230000');
    expect(ics).toContain('UID:echipa-1-20260508@elim-admin');
    expect(ics).toContain('STATUS:TENTATIVE');
  });

  it('escapa comas, punto y coma y saltos de línea en los textos', () => {
    const unfolded = lines.reduce<string[]>((acc, l) => {
      if (l.startsWith(' ') && acc.length) acc[acc.length - 1] += l.slice(1); else acc.push(l);
      return acc;
    }, []);
    const description = unfolded.find(l => l.startsWith('DESCRIPTION:'))!;
    expect(description).toContain('Aduceți farfurii\\, pahare\\; șervețele\\nși fețe de masă');
    expect(description).toContain('Sosire tineri: 19:30\\nÎnceput program: 20:30\\nAducere mâncare (părinți): 20:00');
  });

  it('pliega las líneas a 75 caracteres (RFC 5545)', () => {
    expect(lines.every(l => l.length <= 75)).toBe(true);
  });
});

describe('nombres de fichero y feeds', () => {
  it('slug: sin acentos, minúsculas y guiones', () => {
    expect(slug('Istrătoaie Dina — programări')).toBe('istratoaie-dina-programari');
    expect(icsFileNameForEvent(ENTRY)).toBe('echipa-1-20260508.ics');
  });

  it('los feeds tienen nombres estables por equipo, joven y padre', () => {
    expect(feedFileForTeam('Echipa 4')).toBe('echipa-4.ics');
    expect(feedFileForYouth('y-halas-luigi')).toBe('tanar-halas-luigi.ics');
    expect(feedFileForParent('p-003')).toBe('parinte-p-003.ics');
  });

  it('la URL del feed respeta el base href del despliegue', () => {
    expect(feedUrl('https://beni-nc.github.io', '/INEB_ELIM_Administrativ/', 'echipa-1.ics'))
      .toBe('https://beni-nc.github.io/INEB_ELIM_Administrativ/assets/calendars/echipa-1.ics');
    expect(feedUrl('http://localhost:4200', '/', 'toate.ics')).toBe('http://localhost:4200/assets/calendars/toate.ics');
  });
});
