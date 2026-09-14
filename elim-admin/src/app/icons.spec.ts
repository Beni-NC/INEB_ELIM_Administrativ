import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Los iconos son un sprite SVG propio (`assets/icons.svg`, generado con `npm run icons`). Un
 * `<use href="assets/icons.svg#nombre">` sin su <symbol> no pinta nada y no avisa. Este spec
 * extrae los nombres usados en plantillas y componentes y exige que coincidan exactamente con
 * los símbolos del sprite (ni falta ni sobra ninguno).
 */
const SRC = join(__dirname, '..');

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(html|ts)$/.test(name) && !name.endsWith('.spec.ts')) out.push(p);
  }
  return out;
}

function usedIcons(): Set<string> {
  const names = new Set<string>();
  for (const file of walk(join(SRC, 'app'))) {
    const text = readFileSync(file, 'utf8');
    for (const m of text.matchAll(/icons\.svg#([a-z0-9_]+(?:-fill)?)/g)) names.add(m[1]);                 // estático
    for (const m of text.matchAll(/'assets\/icons\.svg#' \+ \((.*?)\)"/g)) {                              // dinámico
      for (const lit of m[1].matchAll(/[?:]\s*'([a-z0-9_]+(?:-fill)?)'/g)) names.add(lit[1]);
    }
    for (const m of text.matchAll(/\bicon:\s*'([a-z0-9_]+)'/g)) names.add(m[1]);                           // icon: '…'
  }
  return names;
}

function spriteIcons(): string[] {
  const sprite = readFileSync(join(SRC, 'assets', 'icons.svg'), 'utf8');
  return [...sprite.matchAll(/<symbol id="([^"]+)"/g)].map(m => m[1]);
}

describe('Iconos — sprite assets/icons.svg', () => {
  const used = usedIcons();
  const sprite = spriteIcons();

  it('todos los iconos usados en la app están en el sprite (si falta alguno: npm run icons)', () => {
    expect([...used].filter(n => !sprite.includes(n)).sort()).toEqual([]);
  });

  it('el sprite no lleva iconos que la app no usa', () => {
    expect(sprite.filter(n => !used.has(n))).toEqual([]);
  });

  it('los símbolos del sprite son únicos', () => {
    expect(sprite).toEqual([...new Set(sprite)]);
  });

  it('las plantillas ya no usan ligaduras de la fuente de iconos ni la clase icon--fill', () => {
    for (const file of walk(join(SRC, 'app'))) {
      const text = readFileSync(file, 'utf8');
      expect(/<span class="icon[^"]*"[^>]*>\s*[a-z0-9_{]/.test(text), file).toBe(false);
      expect(text.includes('icon--fill'), file).toBe(false);
    }
  });
});
