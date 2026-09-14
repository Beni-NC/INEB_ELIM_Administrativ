// Genera src/assets/icons.svg: un sprite SVG con SOLO los iconos que usa la app.
//
// Por qué: la fuente Material Symbols completa pesa cientos de KB, depende de Google en cada
// arranque y los iconos parpadean hasta que carga. Un sprite propio con ~40 glifos pesa unos
// KB, se sirve desde la propia app (offline con el resto) y no tiene terceros.
//
// Cómo: recorre plantillas y componentes buscando `icons.svg#<nombre>` (y `-fill` para la
// variante rellena), descarga cada glifo de material-design-icons (Material Symbols Rounded,
// 20 px, peso 400) y los junta en <symbol id="…">. Se ejecuta A MANO al añadir un icono:
//   npm run icons
// El sprite se versiona en git; el deploy no descarga nada. `icons.spec.ts` comprueba que el
// sprite y las plantillas están sincronizados.
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const APP = join(ROOT, 'src', 'app');
const OUT = join(ROOT, 'src', 'assets', 'icons.svg');
const SOURCE = 'https://raw.githubusercontent.com/google/material-design-icons/master/symbols/web';

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(html|ts)$/.test(name) && !name.endsWith('.spec.ts')) out.push(p);
  }
  return out;
}

/** Nombres usados en la app (incluye variantes `-fill`), ordenados. */
export function usedIcons() {
  const names = new Set();
  for (const file of walk(APP)) {
    const text = readFileSync(file, 'utf8');
    // Estático: href="assets/icons.svg#nombre"
    for (const m of text.matchAll(/icons\.svg#([a-z0-9_]+(?:-fill)?)/g)) names.add(m[1]);
    // Dinámico: [attr.href]="'assets/icons.svg#' + (cond ? 'a' : 'b')" → los literales de las ramas del ternario
    for (const m of text.matchAll(/'assets\/icons\.svg#' \+ \((.*?)\)"/g)) {
      for (const lit of m[1].matchAll(/[?:]\s*'([a-z0-9_]+(?:-fill)?)'/g)) names.add(lit[1]);
    }
    // Datos de la propia app: icon: 'nombre' (pestañas, secciones de Reguli)
    for (const m of text.matchAll(/\bicon:\s*'([a-z0-9_]+)'/g)) names.add(m[1]);
  }
  return [...names].sort();
}

async function fetchGlyph(name) {
  const fill = name.endsWith('-fill');
  const base = fill ? name.slice(0, -'-fill'.length) : name;
  const url = `${SOURCE}/${base}/materialsymbolsrounded/${base}${fill ? '_fill1' : ''}_20px.svg`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`No existe el icono "${name}" (${res.status}) → ${url}`);
  const svg = await res.text();
  const path = /<path d="([^"]+)"/.exec(svg)?.[1];
  const viewBox = /viewBox="([^"]+)"/.exec(svg)?.[1] ?? '0 -960 960 960';
  if (!path) throw new Error(`SVG inesperado para "${name}"`);
  return `  <symbol id="${name}" viewBox="${viewBox}"><path d="${path}"/></symbol>`;
}

const names = usedIcons();
const symbols = await Promise.all(names.map(fetchGlyph));
writeFileSync(OUT, `<svg xmlns="http://www.w3.org/2000/svg">\n${symbols.join('\n')}\n</svg>\n`, 'utf8');
console.log(`icons.svg — ${names.length} iconos: ${names.join(', ')}`);
