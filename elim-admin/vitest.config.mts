import { defineConfig } from 'vitest/config';

/**
 * Tests del dominio puro (core/domain, core/utils, datos, iconos): sin Angular, sin navegador.
 * Los tests de componente (`*.dom.spec.ts`) corren con `ng test` (builder unit-test de Angular,
 * vitest + jsdom); `npm test` ejecuta los dos.
 */
export default defineConfig({
  test: {
    include: ['src/**/*.spec.ts'],
    // Los tests de componente (*.dom.spec.ts) los ejecuta `ng test` (TestBed + jsdom).
    exclude: ['src/**/*.dom.spec.ts', 'node_modules/**'],
    environment: 'node',
    // Sin el modo resumen: así se ven los avisos (console.warn) de los tests que pasan, p. ej. el
    // de programaciones que no caen en viernes en data-integrity.spec.ts.
    reporters: [['default', { summary: false }]],
  },
});
