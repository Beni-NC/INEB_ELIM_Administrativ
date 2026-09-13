# ELIM Admin — contexto del proyecto

PWA Angular 22 zoneless (`elim-admin/`) para la programación de la preparación de la cena del departamento
de tineret de la iglesia ELIM Arganda: programaciones, equipos, jóvenes, padres de apoyo, reglas.
Sin backend: datos estáticos en `elim-admin/src/app/core/data/*.data.ts`. Idiomas ro/es.
Deploy automático a GitHub Pages al hacer push a `main`.

## Reglas (siempre)

1. **UI = seguir `docs/GUIA-ESTILOS.md` al pie de la letra.** Tokens, primitivas `ui-*`, listas
   densas, un solo acento, sin gradientes/sombras/librerías de UI. Si un patrón no existe, se
   añade a `components.css` **y** a la guía; no se improvisa en el componente.
2. **Código = seguir `docs/ARQUITECTURA.md`.** Angular 22 zoneless, standalone + signals + OnPush;
   identificadores en inglés, comentarios en español, textos solo por i18n (**ro y es**); fechas
   con el pipe `ldate`. Lo derivable se deriva en `ScheduleIndex`, no se escribe en los datos.
   Tocar `core/domain` o `core/utils` = actualizar o añadir su `.spec.ts` (`npm test`).
3. **No reintroducir** Angular Material, CDK, PrimeNG ni ninguna librería de componentes.
4. **Sin código muerto**: lo que deja de usarse se borra.
5. No commitear ni hacer push: dejar los cambios en el working tree; el usuario decide.
6. Al terminar un bloque de trabajo relevante, actualizar el estado en `docs/PLAN-MAESTRO.md`
   (§4 y §5) y subir `version` en `elim-admin/package.json` si hay cambios visibles
   (`src/version.ts` se genera solo; no editarlo).
7. **La app se actualiza sola** (recarga automática al detectar versión nueva): no añadir avisos
   ni confirmaciones de actualización; el usuario quiere ver siempre lo último publicado.
8. **Modo oscuro solo manual** (botón de la cabecera, guardado en el dispositivo; claro por
   defecto). Nunca automático por `prefers-color-scheme`.
9. Contacto y textos de WhatsApp: `core/contact.config.ts` + claves `contact.*` de i18n; una sola
   entrada visible (dock flotante; bloque `app-contact-card` al final de Reguli). El footer es una
   franja mínima: no añadirle contenido. El dock sigue el patrón de MEDIA-ELIM
   (`C:\workspace\iglesia-redes`); ante una duda de diseño, mirar primero esa app hermana.

## Dónde mirar

| Necesito… | Lee |
|---|---|
| Diseñar / tocar cualquier interfaz | `docs/GUIA-ESTILOS.md` |
| Estructura, convenciones, cómo añadir pestaña/primitiva/dato | `docs/ARQUITECTURA.md` |
| Qué se decidió y por qué; qué queda pendiente | `docs/PLAN-MAESTRO.md` |
| Datos (jóvenes, equipos, programaciones, padres) | `elim-admin/src/app/core/data/*.data.ts` (reglas: en los JSON de i18n) |
| Textos | `elim-admin/src/assets/i18n/ro.json`, `es.json` |

## Comandos

```bash
# Requiere Node ≥ 22.22. Si la máquina tiene otro Node: npx -y -p node@22 -p npm@11 -- <comando>
cd elim-admin && npm start          # genera feeds .ics + dev en http://localhost:4200
cd elim-admin && npm run build      # genera feeds .ics + producción
cd elim-admin && npm test           # vitest (dominio puro)
```
