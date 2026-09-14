# ELIM Admin — contexto del proyecto

PWA Angular 22 zoneless (`elim-admin/`) para la programación de la preparación de la cena del departamento
de tineret de la iglesia ELIM Arganda: programaciones, equipos, jóvenes, padres de apoyo, reglas.
Sin backend: datos estáticos en `elim-admin/src/app/core/data/*.data.ts`. Idiomas ro/es.
Deploy automático a GitHub Pages al hacer push a `main`. La app se usa sobre todo en el móvil.

> Este fichero se carga siempre y es deliberadamente corto. Los documentos de `docs/` son
> **vinculantes** pero se leen **bajo demanda** (§ "Cuándo leer qué"), nunca "por si acaso".

## Cómo actuar (siempre)

- **Como senior**: antes de tocar nada, entender el problema y elegir la **arquitectura más
  recomendada** para este proyecto (Angular 22 zoneless, standalone, signals, OnPush, dominio puro
  en `ScheduleIndex`, i18n). Sin atajos ni sobre-ingeniería: lo que haría un programador senior
  experimentado en producción. Se sigue lo que ya existe; si hace falta un patrón nuevo, se
  añade donde corresponde (primitiva, servicio, doc) y se documenta, no se improvisa en sitio.
- **Como diseñador experto**: toda interfaz debe parecer diseñada por alguien que conoce Gmail
  compacto, Atlassian y LinkedIn: profesional, compacta, con vida pero sobria. Cada decisión
  visual sale de los tokens y primitivas existentes; nunca de un valor literal.
- **Autonomía con criterio**: decisiones rutinarias se toman y se explican en una línea;
  se pregunta solo cuando dos lecturas llevan a trabajos materialmente distintos.
- **Verificación**: `npx tsc -p tsconfig.app.json --noEmit` + `npm test` (Node + componentes)
  siempre; `npm run build` cuando se toca build/PWA/scripts. Lo que no se verifica se dice.

## Reglas base (siempre)

1. **UI = `docs/GUIA-ESTILOS.md`** (§0 basta para retoques). Tokens, primitivas `ui-*`, listas
   densas, un solo acento, sombra solo `--shadow-card`/`--shadow-overlay`, sin librerías de UI.
   Si un patrón no existe, se añade a `components.css` **y** a la guía.
2. **Código = `docs/ARQUITECTURA.md`.** Identificadores en inglés, comentarios en español, textos
   solo por i18n (**ro y es**; los contadores, con el pipe `plural` y su clave `_one`), fechas con
   el pipe `ldate`. Lo derivable se deriva en
   `ScheduleIndex`, no se escribe en los datos; los enumerados de los datos son **códigos**
   traducidos por la vista. Tocar `core/domain` o `core/utils` = actualizar o añadir su
   `.spec.ts`; tocar datos = `npm test` (hay un spec de integridad sobre los datos reales).
   Iconos = sprite SVG propio: tras usar uno nuevo, `npm run icons`. Componentes con lógica de
   interacción = test `*.dom.spec.ts` (`ng test`).
3. **No reintroducir** Angular Material, CDK, PrimeNG ni ninguna librería de componentes.
4. **Sin código muerto**: lo que deja de usarse se borra (CSS, claves i18n, métodos).
5. **No commitear ni hacer push**: dejar los cambios en el working tree y entregar el texto del
   commit; el usuario decide. Recordar que `src/version.ts` es generado (`git rm --cached` si
   quedó rastreado).
6. **Al cerrar un bloque relevante**: actualizar `docs/PLAN-MAESTRO.md` (§4 y §5) y subir
   `version` en `elim-admin/package.json` si hay cambios visibles.
7. **Público ≠ administración.** La app que ven los participantes muestra *qué hay programado*;
   todo lo que sea **planificar** (a quién le toca, propuestas, reparto de padres, avisos de datos,
   generadores de código) vive **solo** en `/admin`, una ruta oculta: no está en `TAB_PATHS`, ni en
   las pestañas, ni en el gesto de deslizar, ni enlazada desde ningún sitio. Al añadir algo,
   preguntarse siempre a cuál de los dos pertenece. El panel tiene un componente por sección; el
   formato del código que genera vive en `core/utils/data-source.utils.ts` (con test), nunca en la
   plantilla.
8. **La app se actualiza sola** (recarga automática al detectar versión nueva): no añadir avisos
   ni confirmaciones de actualización.
9. **Modo oscuro solo manual** (botón de la cabecera, guardado en el dispositivo; claro por
   defecto). Nunca automático por `prefers-color-scheme`.
10. Contacto y textos de WhatsApp: `core/contact.config.ts` + claves `contact.*`; una sola
   entrada visible (dock flotante; `app-contact-card` al final de Reguli). El footer es una franja
   mínima: no añadirle contenido. El dock sigue el patrón de MEDIA-ELIM
   (`C:\workspace\iglesia-redes`); ante una duda de diseño, mirar primero esa app hermana.

## Economía de tokens (siempre)

- **Leer lo justo**: este fichero + el fichero que se va a tocar. Los `docs/` se abren solo según
  la tabla de abajo, y por secciones (`grep`/`sed -n`), no completos.
- **Retoque pequeño** (texto, color, orden, un estilo): no se abre ningún doc; basta el §0 de la
  guía si es UI. **Patrón/pestaña/dato nuevo o cambio de arquitectura**: entonces sí, el doc
  correspondiente.
- **Capturas de pantalla: por defecto NO.** Solo si el usuario las pide o el cambio es visual y no
  se puede validar de otra forma (layout, tema oscuro, responsive). Nunca para textos,
  traducciones u orden de campos. Si no se verifica en pantalla, se dice.
- **Sin subagentes** salvo petición expresa; verificar en línea (tsc/test/build).
- **Ediciones quirúrgicas**: `Edit` o scripts cortos sobre el fragmento, no reescribir ficheros
  enteros ni volver a leer lo que ya se tiene en contexto.
- **Respuestas concisas**: qué se hizo, qué se verificó, qué queda; sin recapitular.

## Cuándo leer qué (bajo demanda)

| Voy a… | Leo |
|---|---|
| Retocar UI existente | `docs/GUIA-ESTILOS.md` §0 (10 líneas) |
| Crear patrón/primitiva, pestaña o tocar `tokens.css`/`components.css` | `docs/GUIA-ESTILOS.md` completa (§2, §6, §9) |
| Tocar dominio, servicios, estructura, build/PWA, añadir dato o feed | `docs/ARQUITECTURA.md` (la sección que toque) |
| Retomar trabajo, saber qué se decidió y por qué, qué queda | `docs/PLAN-MAESTRO.md` §4–§5 |
| Cambiar datos (jóvenes, equipos, programaciones, padres) | `elim-admin/src/app/core/data/*.data.ts` (reglas: JSON de i18n) |
| Cambiar textos | `elim-admin/src/assets/i18n/ro.json` **y** `es.json` |
| Añadir/editar datos sin teclear TypeScript | abrir `/admin` en la app (propuestas, padres, personas, estado de los datos) |

## Comandos

```bash
# Requiere Node ≥ 22.22. Si la máquina tiene otro Node: npx -y -p node@22 -p npm@11 -- <comando>
cd elim-admin && npm start          # genera version.ts + feeds .ics + dev en http://localhost:4200
cd elim-admin && npm run build      # producción (GitHub Pages)
cd elim-admin && npm test           # vitest (dominio, datos, iconos) + ng test (componentes, jsdom)
cd elim-admin && npm run icons      # regenera assets/icons.svg con los iconos usados
cd elim-admin && npx tsc -p tsconfig.app.json --noEmit   # comprobación rápida de tipos
```
