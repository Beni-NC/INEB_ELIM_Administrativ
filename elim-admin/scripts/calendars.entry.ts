/**
 * Punto de entrada (TypeScript) del generador de feeds de calendario. Lo empaqueta y ejecuta
 * `generate-calendars.mjs` con esbuild; no forma parte del bundle de la app.
 *
 * Escribe en `src/assets/calendars/` un .ics por equipo, joven y padre, más uno global, con
 * TODAS sus programaciones (pasadas y futuras): así el calendario del usuario refleja también el
 * histórico y cualquier cambio publicado se propaga en la siguiente sincronización.
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ScheduleIndex } from '../src/app/core/domain/schedule-index';
import { IcsLabels, buildIcs } from '../src/app/core/utils/ics.utils';
import {
  CALENDAR_FEEDS_DIR, feedFileForAll, feedFileForParent, feedFileForTeam, feedFileForYouth,
} from '../src/app/core/utils/calendar-feeds';

const ROOT = process.argv[2] ?? process.cwd();
const OUT = join(ROOT, 'src', CALENDAR_FEEDS_DIR);

/* Los feeds publicados van en rumano (idioma por defecto de la app). */
const ro = JSON.parse(readFileSync(join(ROOT, 'src/assets/i18n/ro.json'), 'utf8')) as {
  calendar: Record<string, string>;
};
const c = ro.calendar;
const interpolate = (s: string, params: Record<string, string>): string =>
  s.replace(/\{\{(\w+)\}\}/g, (_, k: string) => params[k] ?? '');

function labels(calendarName: string): IcsLabels {
  return {
    calendarName,
    description: c['calendar_description'],
    eventSummary: c['event_summary'],
    location: c['location_default'],
    fieldProgramType: c['field_program_type'],
    fieldCoordinator: c['field_coordinator'],
    fieldArrival: c['field_arrival'],
    fieldProgramStart: c['field_program_start'],
    fieldFood: c['field_food'],
    fieldEstimated: c['field_estimated'],
    fieldNotes: c['field_notes'],
  };
}

const index = new ScheduleIndex(new Date());
const now = new Date();
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

let count = 0;
const write = (file: string, name: string, events: Parameters<typeof buildIcs>[0]): void => {
  writeFileSync(join(OUT, file), buildIcs(events, labels(name), now), 'utf8');
  count++;
};

write(feedFileForAll(), c['calendar_description'], index.sortedSchedule);
for (const team of index.teams) {
  write(feedFileForTeam(team.teamName), interpolate(c['team_calendar_name'], { team: team.teamName }), index.getAllEventsForTeam(team.teamName));
}
for (const y of index.youths) {
  const events = index.getAllEventsForYouth(y.id).map(x => x.entry);
  if (events.length > 0) write(feedFileForYouth(y.id), interpolate(c['youth_calendar_name'], { name: y.fullName }), events);
}
for (const p of index.parents) {
  const events = index.getAllEventsForParent(p.id);
  if (events.length > 0) write(feedFileForParent(p.id), interpolate(c['parent_calendar_name'], { name: p.name }), events);
}

console.log(`calendars: ${count} feeds → ${OUT}`);
