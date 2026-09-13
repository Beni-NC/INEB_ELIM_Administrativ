import { defineConfig } from 'vitest/config';

/**
 * Tests del dominio puro (core/domain, core/utils): sin Angular, sin navegador.
 * Los componentes no se testean aquí (se verifican en la app); ver docs/ARQUITECTURA.md §6.
 */
export default defineConfig({
  test: {
    include: ['src/**/*.spec.ts'],
    environment: 'node',
  },
});
