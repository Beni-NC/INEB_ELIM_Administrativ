// Genera el icono de la app y todos sus derivados a partir del sello institucional
// (scripts/assets-src/logo_admin.png, 970×970 con fondo transparente).
//
// El sello no se toca: lo que se perfecciona es cómo se sirve en cada sitio.
//  - Launcher / Apple / aviso: el sello sobre baldosa navy de marca, al 78 % del lado. Como el sello es
//    circular, cabe entero en el círculo de seguridad de los iconos "maskable" (80 %), así que un mismo
//    fichero sirve para `any` y `maskable`. Antes iba al 62 %: un 26 % más grande, que a 48 px se nota.
//  - Favicon (16–32 px): el anillo de texto es ilegible a ese tamaño y se lleva un tercio del diámetro.
//    Se recorta el disco interior —emblema + filete dorado— y se sirve al 84 % de la baldosa: el
//    símbolo sale el doble de grande.
//  - Todo se rasteriza desde el original de 970 px, no desde un PNG ya reescalado.
//  - La baldosa es el navy de la marca (--c-brand-surface), el mismo del splash y del pie.
//
// Cómo se ejecuta (necesita Playwright para rasterizar; no es dependencia del proyecto):
//   npm i -D playwright && npx playwright install chromium     (una vez)
//   npm run app-icon
// O, si Playwright vive en otra carpeta:  PLAYWRIGHT=<ruta a node_modules/playwright> npm run app-icon
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ASSETS = join(ROOT, 'src', 'assets');
const { chromium } = await import(process.env.PLAYWRIGHT ? pathToFileURL(join(process.env.PLAYWRIGHT, 'index.mjs')).href : 'playwright');

const NAVY = '#1a365d';                 // --c-brand-surface: baldosa, splash y pie, un solo navy
const SELLO = 'data:image/png;base64,' + readFileSync(join(ROOT, 'scripts', 'assets-src', 'logo_admin.png')).toString('base64');
/** Medidas del sello, sobre 970 px: el disco interior (hasta el filete dorado) es el 69,5 % del diámetro. */
const DISCO_INTERIOR = 0.695;

/** Baldosa navy con el sello centrado al 78 % del lado. */
const sello = (size) => `
  <div style="width:${size}px;height:${size}px;background:${NAVY};display:grid;place-items:center">
    <img src="${SELLO}" style="width:${(size * 0.78).toFixed(2)}px;height:${(size * 0.78).toFixed(2)}px">
  </div>`;

/** Baldosa navy con solo el disco interior del sello (emblema + filete dorado) al 84 % del lado. */
const emblema = (size) => {
  const disco = size * 0.84;                 // diámetro del disco en la baldosa
  const img = disco / DISCO_INTERIOR;        // el sello entero, escalado para que su disco mida eso
  const off = (size - img) / 2;
  return `
  <div style="width:${size}px;height:${size}px;background:${NAVY};position:relative;overflow:hidden">
    <div style="position:absolute;inset:${((size - disco) / 2).toFixed(2)}px;border-radius:50%;overflow:hidden">
      <img src="${SELLO}" style="position:absolute;left:${(off - (size - disco) / 2).toFixed(2)}px;top:${(off - (size - disco) / 2).toFixed(2)}px;width:${img.toFixed(2)}px;height:${img.toFixed(2)}px">
    </div>
  </div>`;
};

/** Atajo del manifiesto: la baldosa con un icono del propio sprite de la app, en blanco. */
function atajo(iconId, size) {
  const sprite = readFileSync(join(ASSETS, 'icons.svg'), 'utf8');
  const m = new RegExp(`id="${iconId}" viewBox="([^"]+)"><path d="([^"]+)"`).exec(sprite);
  if (!m) throw new Error(`El sprite no tiene el icono "${iconId}"`);
  return `
  <div style="width:${size}px;height:${size}px;background:${NAVY};display:grid;place-items:center">
    <svg width="${size * 0.56}" height="${size * 0.56}" viewBox="${m[1]}"><path fill="#fff" d="${m[2]}"/></svg>
  </div>`;
}

const browser = await chromium.launch();
async function png(html, size) {
  const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
  await page.setContent(`<body style="margin:0">${html}</body>`);
  await page.evaluate(() => Promise.all([...document.images].map(i => i.decode())));
  const buf = await page.screenshot({ clip: { x: 0, y: 0, width: size, height: size } });
  await page.close();
  return buf;
}

const salidas = [
  ['app-icon-512.png', sello(512)],
  ['app-icon-192.png', sello(192)],
  ['app-icon-180.png', sello(180)],       // apple-touch-icon
  ['app-icon-72.png', sello(72)],         // aviso de instalación (36 px a 2×)
  ['favicon-32.png', emblema(32)],
  ['shortcut-teams-192.png', atajo('groups', 192)],
  ['shortcut-youths-192.png', atajo('person', 192)],
  ['shortcut-parents-192.png', atajo('family_restroom', 192)],
];
for (const [nombre, html] of salidas) {
  const size = +/\d+/.exec(nombre)[0];
  const buf = await png(html, size);
  writeFileSync(join(ASSETS, nombre), buf);
  console.log(`${nombre.padEnd(26)} ${String(size).padStart(3)} px  ${(buf.length / 1024).toFixed(1)} kB`);
}

// favicon.ico con tres tamaños (PNG dentro del contenedor ICO, que todo navegador entiende).
const frames = await Promise.all([16, 32, 48].map(s => png(emblema(s), s)));
const icoBuf = ico(frames, [16, 32, 48]);
writeFileSync(join(ROOT, 'src', 'favicon.ico'), icoBuf);
console.log(`favicon.ico                16/32/48  ${(icoBuf.length / 1024).toFixed(1)} kB`);

await browser.close();

/** Contenedor ICO: cabecera + directorio + los PNG tal cual. */
function ico(pngs, sizes) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(pngs.length, 4);
  const dir = Buffer.alloc(16 * pngs.length);
  let offset = 6 + dir.length;
  pngs.forEach((p, i) => {
    const o = i * 16;
    dir[o] = sizes[i]; dir[o + 1] = sizes[i]; dir[o + 2] = 0; dir[o + 3] = 0;
    dir.writeUInt16LE(1, o + 4); dir.writeUInt16LE(32, o + 6);
    dir.writeUInt32LE(p.length, o + 8); dir.writeUInt32LE(offset, o + 12);
    offset += p.length;
  });
  return Buffer.concat([header, dir, ...pngs]);
}
