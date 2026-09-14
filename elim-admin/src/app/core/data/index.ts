/* ============================================================
   ELIM ADMIN — Sursa unică de date
   ============================================================
   Structură normalizată, un fișier per tabel:
     • schedule.data.ts     → SCHEDULE_DATA (programarea)
     • youths.data.ts       → YOUTHS (tabela unică „tineri")
     • memberships.data.ts  → YOUTH_TEAM_MEMBERSHIPS (tânăr ↔ echipă, activ/istoric)
     • parents.data.ts      → PARENTS, PARENT_YOUTH_LINKS (el apoyo es por programación: `parentSupporters`)
   Echipele (active și istorice), `fullName`/`initials` se derivă în `ScheduleIndex`.
   Interfețele trăiesc în `../models.ts`. Importă `DOMAIN_DATA` din `./index`.
   ============================================================ */

import type { DomainData } from '../models';
import { SCHEDULE_DATA } from './schedule.data';
import { YOUTHS } from './youths.data';
import { YOUTH_TEAM_MEMBERSHIPS } from './memberships.data';
import { PARENTS, PARENT_YOUTH_LINKS } from './parents.data';

/** Todo el dominio en un objeto: es lo que consume `ScheduleIndex` por defecto. */
export const DOMAIN_DATA: DomainData = {
  schedule: SCHEDULE_DATA,
  youths: YOUTHS,
  memberships: YOUTH_TEAM_MEMBERSHIPS,
  parents: PARENTS,
  parentYouthLinks: PARENT_YOUTH_LINKS,
};
