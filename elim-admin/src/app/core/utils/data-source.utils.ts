import { Parent, ProgramType, Relationship, ScheduleEntry, Youth, YouthRecord, YouthRole } from '../models';
import { normalizeForSearch } from './text.utils';

/**
 * Generadores de código TypeScript para los ficheros de datos (`core/data/*.data.ts`), que se
 * escriben a mano. El módulo `/admin` compone aquí las líneas exactas que hay que pegar: el
 * formato (comillas simples, `new Date(año, mes0, día)`, orden de campos) es el del fichero, así
 * que se pega y ya está — sin reescribir nada a mano y sin erratas de tecleo.
 *
 * Puro y sin Angular: se prueba con vitest y se podría reutilizar desde Node.
 */

/** Escapa una cadena para una literal de comillas simples de TypeScript. */
function q(text: string): string {
  return `'${text.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

/** `new Date(2026, 8, 25)` — mes base 0, como en los ficheros de datos. */
export function dateLiteral(d: Date): string {
  return `new Date(${d.getFullYear()}, ${d.getMonth()}, ${d.getDate()})`;
}

/** Objeto en línea con solo los campos presentes: `{ phone: '…', email: '…' }` (o `{}`). */
function inlineObject(fields: readonly (readonly [string, string | undefined])[]): string {
  const parts = fields.filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => `${k}: ${v}`);
  return parts.length > 0 ? `{ ${parts.join(', ')} }` : '{}';
}

/* ═══════════════════════════ Programaciones ═══════════════════════════ */

/** Programación tal y como la compone el panel (existente o nueva). */
export interface DraftEntry {
  date: Date;
  teamName: string;
  coordinatorName: string;
  estimatedPersons: number;
  parentIds: readonly string[];
  observations?: string;
  programType?: ProgramType;
  /** Horas solo si se apartan de las de por defecto (`schedule.utils`). */
  programStartTime?: string;
  youthsArrivalTime?: string;
  parentsFoodArrivalTime?: string;
}

/** Una línea de `SCHEDULE_DATA`. */
export function scheduleLine(d: DraftEntry): string {
  const extras = [
    d.parentIds.length > 0 ? `parentSupporters: [${d.parentIds.map(q).join(', ')}]` : '',
    d.programStartTime ? `programStartTime: ${q(d.programStartTime)}` : '',
    d.youthsArrivalTime ? `youthsArrivalTime: ${q(d.youthsArrivalTime)}` : '',
    d.parentsFoodArrivalTime ? `parentsFoodArrivalTime: ${q(d.parentsFoodArrivalTime)}` : '',
  ].filter(Boolean);
  return `  { team: ${q(d.teamName)}, coordinator: ${q(d.coordinatorName)}, programType: ${q(d.programType ?? 'youth_evening')}, `
    + `estimatedPersons: ${d.estimatedPersons}, date: ${dateLiteral(d.date)}, observations: ${q(d.observations ?? '')}`
    + `${extras.length > 0 ? ', ' + extras.join(', ') : ''} },`;
}

export function scheduleLines(list: readonly DraftEntry[]): string {
  return list.map(scheduleLine).join('\n');
}

/** Cambios sobre una programación existente; lo que no se indica se conserva. */
export type EntryChanges = Partial<Omit<DraftEntry, 'parentIds'>> & { parentIds?: readonly string[] };

/** Convierte una programación existente en borrador editable. */
export function toDraft(entry: ScheduleEntry): DraftEntry {
  return {
    date: entry.date,
    teamName: entry.team,
    coordinatorName: entry.coordinator,
    estimatedPersons: entry.estimatedPersons,
    parentIds: entry.parentSupporters ?? [],
    observations: entry.observations,
    programType: entry.programType,
    programStartTime: entry.programStartTime,
    youthsArrivalTime: entry.youthsArrivalTime,
    parentsFoodArrivalTime: entry.parentsFoodArrivalTime ?? undefined,
  };
}

/** Línea de reemplazo para una programación que ya existe, con los cambios aplicados. */
export function scheduleLineFor(entry: ScheduleEntry, changes: EntryChanges = {}): string {
  return scheduleLine({ ...toDraft(entry), ...changes });
}

/* ═══════════════════════════ Jóvenes ═══════════════════════════ */

/** Id de joven con el patrón de los datos: `y-apellido-nombre`, sin diacríticos. */
export function youthId(firstName: string, lastName: string): string {
  const part = (s: string): string => normalizeForSearch(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return `y-${part(lastName)}-${part(firstName)}`;
}

export interface DraftYouth {
  firstName: string;
  lastName: string;
  gender: 'M' | 'F';
  birthDate: Date;
  joinedYear: number;
  phone?: string;
  email?: string;
  notes?: string;
  /** `false` = archivado; entonces se escriben también la fecha y el motivo. */
  active?: boolean;
  inactiveSince?: Date;
  inactiveReason?: string;
}

/** Una línea de `YOUTHS` (helper `youth(...)` del propio fichero). */
export function youthLine(d: DraftYouth): string {
  const extra = inlineObject([
    ['phone', d.phone?.trim() ? q(d.phone.trim()) : undefined],
    ['email', d.email?.trim() ? q(d.email.trim()) : undefined],
    ['notes', d.notes?.trim() ? q(d.notes.trim()) : undefined],
    ['active', d.active === false ? 'false' : undefined],
    ['inactiveSince', d.active === false && d.inactiveSince ? dateLiteral(d.inactiveSince) : undefined],
    ['inactiveReason', d.active === false && d.inactiveReason?.trim() ? q(d.inactiveReason.trim()) : undefined],
  ]);
  return `  youth(${q(youthId(d.firstName, d.lastName))}, ${q(d.firstName)}, ${q(d.lastName)}, ${q(d.gender)}, `
    + `${dateLiteral(d.birthDate)}, ${d.joinedYear}, ${extra}),`;
}

/** Borrador a partir de un joven ya existente (para editarlo o archivarlo). */
export function toYouthDraft(y: Youth | YouthRecord): DraftYouth {
  return {
    firstName: y.firstName, lastName: y.lastName, gender: y.gender, birthDate: y.birthDate,
    joinedYear: y.joinedYear, phone: y.phone, email: y.email, notes: y.notes,
    active: y.active, inactiveSince: y.inactiveSince, inactiveReason: y.inactiveReason,
  };
}

/** Línea de reemplazo de un joven existente con los cambios aplicados (p. ej. archivarlo). */
export function youthLineFor(y: Youth | YouthRecord, changes: Partial<DraftYouth> = {}): string {
  return youthLine({ ...toYouthDraft(y), ...changes });
}

/* ═══════════════════════════ Pertenencias ═══════════════════════════ */

/** Una línea de `YOUTH_TEAM_MEMBERSHIPS` (helper `membership(...)`). */
export function membershipLine(id: string, teamName: string, role: YouthRole = 'membru'): string {
  const roleArg = role === 'coordonator' ? `, ${q(role)}` : '';
  return `  membership(${q(id)}, ${q(teamName)}${roleArg}),`;
}

/** Cierre de una pertenencia: pasa a histórica con su fecha de fin. */
export function closeMembershipLine(id: string, teamName: string, end: Date, role: YouthRole = 'membru'): string {
  return `  membership(${q(id)}, ${q(teamName)}, ${q(role)}, false, ${dateLiteral(end)}),`;
}

/** Composición completa de un equipo, con su comentario de cabecera como en el fichero. */
export function membershipBlock(teamName: string, members: readonly { id: string; role: YouthRole }[], label = 'activă'): string {
  return [
    `  // ---- ${teamName} (${label}) ----`,
    ...members.map(m => membershipLine(m.id, teamName, m.role)),
  ].join('\n');
}

/** Composición cerrada: las mismas personas con la fecha de fin. */
export function closedMembershipBlock(teamName: string, members: readonly { id: string; role: YouthRole }[], end: Date): string {
  return [
    `  // ---- ${teamName} (închisă ${dateLiteral(end)}) ----`,
    ...members.map(m => closeMembershipLine(m.id, teamName, end, m.role)),
  ].join('\n');
}

/* ═══════════════════════════ Padres ═══════════════════════════ */

/** Siguiente id de padre libre con el patrón `p-001`. */
export function nextParentId(existing: readonly { id: string }[]): string {
  const max = existing.reduce((acc, p) => {
    const n = Number(/^p-(\d+)$/.exec(p.id)?.[1] ?? 0);
    return Number.isFinite(n) && n > acc ? n : acc;
  }, 0);
  return `p-${String(max + 1).padStart(3, '0')}`;
}

export interface DraftParent {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  joinedDate: Date;
  available?: boolean;
  active?: boolean;
  inactiveSince?: Date;
  inactiveReason?: string;
}

/** Bloque de `PARENTS` (objeto multilínea, como en el fichero). */
export function parentBlock(d: DraftParent): string {
  const lines = [
    '  {',
    `    id: ${q(d.id)},`,
    `    name: ${q(d.name)},`,
    `    phone: ${q(d.phone ?? '')},`,
    `    email: ${q(d.email ?? '')},`,
    "    role: '',",
    '    skills: [],',
    `    joinedDate: ${dateLiteral(d.joinedDate)},`,
    "    notes: '',",
    `    available: ${d.available === false ? 'false' : 'true'},`,
  ];
  if (d.active === false) {
    lines.push('    active: false,');
    if (d.inactiveSince) lines.push(`    inactiveSince: ${dateLiteral(d.inactiveSince)},`);
    if (d.inactiveReason?.trim()) lines.push(`    inactiveReason: ${q(d.inactiveReason.trim())},`);
  }
  lines.push('  },');
  return lines.join('\n');
}

/** Borrador a partir de un padre existente (para editarlo o archivarlo). */
export function toParentDraft(p: Parent): DraftParent {
  return {
    id: p.id, name: p.name, phone: p.phone, email: p.email, joinedDate: p.joinedDate,
    available: p.available, active: p.active, inactiveSince: p.inactiveSince, inactiveReason: p.inactiveReason,
  };
}

/** Bloque de reemplazo de un padre existente con los cambios aplicados. */
export function parentBlockFor(p: Parent, changes: Partial<DraftParent> = {}): string {
  return parentBlock({ ...toParentDraft(p), ...changes });
}

/* ═══════════════════════════ Vínculos familiares ═══════════════════════════ */

/** Una línea de `PARENT_YOUTH_LINKS`. */
export function parentYouthLinkLine(parentId: string, id: string, relationship: Relationship): string {
  return `  { parentId: ${q(parentId)}, youthId: ${q(id)}, relationship: ${q(relationship)} },`;
}

/** Varios hijos de un mismo padre, en el orden en que se han añadido. */
export function parentYouthLinkLines(parentId: string, children: readonly { youthId: string; relationship: Relationship }[]): string {
  return children.filter(c => c.youthId).map(c => parentYouthLinkLine(parentId, c.youthId, c.relationship)).join('\n');
}

/* ═══════════════════════════ Presentación ═══════════════════════════ */

/** Bloque listo para pegar con un encabezado que dice dónde va. */
export function withHeader(file: string, body: string): string {
  return body.trim() ? `// → ${file}\n${body}\n` : '';
}

/**
 * Línea de TODO con lo que falta por completar. La estructura se genera igualmente —a veces se
 * quiere el esqueleto para rellenarlo luego—, pero queda escrito en el propio código lo que hay
 * que revisar antes de publicarlo.
 */
export function todoComment(pending: readonly string[]): string {
  return pending.length > 0 ? `// TODO: ${pending.join(' · ')}\n` : '';
}

/** Une varios bloques ya encabezados, separados por una línea en blanco. */
export function joinBlocks(...blocks: readonly string[]): string {
  return blocks.filter(b => b.trim()).join('\n');
}

/** Instrucción para algo que hay que BORRAR a mano (no se puede generar como línea nueva). */
export function removeHint(file: string, what: string): string {
  return `// → ${file}\n// ELIMINĂ / ELIMINA: ${what}\n`;
}
