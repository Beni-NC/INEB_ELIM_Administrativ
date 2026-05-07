/* eslint-disable */
/**
 * Genera los iconos PWA desde src/assets/logo_admin.png.
 *
 * Estrategia "diseñador":
 *  - Lienzo cuadrado con el color de marca #1e3a5f (= background_color y
 *    theme_color del manifest). Así el splash screen es continuo y el icono
 *    queda igual de bien con cualquier máscara que aplique el sistema
 *    (círculo, squircle, rounded square...). Igual que WhatsApp/Spotify.
 *  - Variante "any":      logo ocupa ~78% del lienzo (margen amplio).
 *  - Variante "maskable": logo ocupa ~62% (queda dentro de la safe zone del
 *    80% que recorta Android para iconos adaptativos).
 *
 * Ejecutar:  node scripts/generate-icons.js
 */
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const SRC = path.resolve(__dirname, '..', 'src', 'assets', 'logo_admin.png');
const OUT_DIR = path.resolve(__dirname, '..', 'src', 'assets');
const BG = { r: 0x1e, g: 0x3a, b: 0x5f, alpha: 1 };

const TARGETS = [
  { name: 'logo_admin-192.png',           size: 192, ratio: 0.78 },
  { name: 'logo_admin-512.png',           size: 512, ratio: 0.78 },
  { name: 'logo_admin-192-maskable.png',  size: 192, ratio: 0.62 },
  { name: 'logo_admin-512-maskable.png',  size: 512, ratio: 0.62 },
];

// Variantes con fondo transparente para usar DENTRO de la app (header,
// footer, etc.) sobre cualquier color. Se recortan al contenido visible
// para que ocupen el 100% del <img> sin ese padding navy del PWA icon.
const TRANSPARENT_TARGETS = [
  { name: 'logo_admin-trans-192.png', size: 192 },
  { name: 'logo_admin-trans-512.png', size: 512 },
];

(async () => {
  if (!fs.existsSync(SRC)) throw new Error('Source not found: ' + SRC);

  for (const t of TARGETS) {
    const inner = Math.round(t.size * t.ratio);
    const logo = await sharp(SRC)
      .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    const out = path.join(OUT_DIR, t.name);
    await sharp({
      create: { width: t.size, height: t.size, channels: 4, background: BG },
    })
      .composite([{ input: logo, gravity: 'center' }])
      .png({ compressionLevel: 9 })
      .toFile(out);

    console.log('✓', t.name);
  }

  // Transparente: recortamos el alpha para eliminar márgenes vacíos
  // del PNG original y luego lo encajamos exacto en el lienzo.
  const trimmed = await sharp(SRC).trim().png().toBuffer();
  for (const t of TRANSPARENT_TARGETS) {
    const out = path.join(OUT_DIR, t.name);
    await sharp(trimmed)
      .resize(t.size, t.size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png({ compressionLevel: 9 })
      .toFile(out);
    console.log('✓', t.name, '(transparent)');
  }
})();
