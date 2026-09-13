// Genera los feeds .ics de suscripción en src/assets/calendars/ (ver calendars.entry.ts).
// Se ejecuta antes de `ng serve` / `ng build` (scripts prestart/prebuild) y en el deploy.
// Empaqueta el punto de entrada TypeScript con esbuild (dependencia ya presente vía Angular CLI)
// para reutilizar el dominio de la app (ScheduleIndex, ics.utils) sin duplicarlo en JS.
import { build } from 'esbuild';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const tmp = mkdtempSync(join(tmpdir(), 'elim-calendars-'));
const outfile = join(tmp, 'calendars.mjs');

try {
  await build({
    entryPoints: [join(root, 'scripts/calendars.entry.ts')],
    outfile,
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node20',
    logLevel: 'error',
  });
  process.argv[2] = root;
  await import(pathToFileURL(outfile).href);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
