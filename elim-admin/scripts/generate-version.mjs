// Genera src/version.ts (mismo sistema que MEDIA-ELIM):
//  - manual:     `version` de package.json — la única cifra que decide una persona (semver).
//  - automático: número de commits de la rama (build), hash corto, marca "dirty" si se compiló con
//                cambios sin commitear y fecha de compilación. Así el pie puede decir exactamente
//                qué código está publicado sin que nadie tenga que recordar subir nada.
// Se ejecuta en postinstall, prestart y prebuild (y en el deploy): el fichero nunca falta ni queda
// obsoleto, por eso está en .gitignore.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT = join(ROOT, 'src', 'version.ts');

/** Ejecuta git y devuelve '' si falla (sin .git, CI sin historial…). */
function git(...args) {
  try {
    return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
}

const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
const release = pkg.version;
const build = Number(git('rev-list', '--count', 'HEAD')) || 0;
const commit = git('rev-parse', '--short=7', 'HEAD') || 'local';
const dirty = git('status', '--porcelain') !== '';
const builtAt = new Date().toISOString();

writeFileSync(OUTPUT, `/**
 * FICHERO GENERADO — no editar a mano. Lo escribe scripts/generate-version.mjs en postinstall,
 * prestart y prebuild. Para cambiar el número visible, edita "version" en package.json.
 */
export interface AppVersion {
  /** Semver manual de package.json: lo que ve el usuario. */
  readonly release: string;
  /** Número de commits de la rama: contador automático y monótono. */
  readonly build: number;
  /** Hash corto del commit publicado. */
  readonly commit: string;
  /** true si se compiló con cambios sin commitear. */
  readonly dirty: boolean;
  /** Fecha de compilación (ISO 8601). */
  readonly builtAt: string;
}

export const APP_VERSION: AppVersion = {
  release: '${release}',
  build: ${build},
  commit: '${commit}',
  dirty: ${dirty},
  builtAt: '${builtAt}',
};
`, 'utf8');

console.log(`version.ts — v${release} · build ${build} · ${commit}${dirty ? ' (dirty)' : ''}`);
