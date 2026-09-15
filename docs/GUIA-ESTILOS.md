# Guía de estilos — ELIM Admin

> **Vinculante** para cualquier cambio de interfaz (humano o IA). Si algo no está aquí, se
> resuelve con el criterio "¿qué haría Gmail en modo compacto, Atlassian o LinkedIn en su última
> versión?": claro, denso, sobrio, un solo acento, superficies blancas ligeramente elevadas sobre
> un lienzo cálido. Antes de inventar un patrón nuevo, buscar uno existente en §6. Todos los
> valores viven en `src/styles/tokens.css`; **nunca** se escriben colores, tamaños o radios
> literales en componentes.
>
> **Economía de lectura**: para un retoque pequeño basta el §0; el resto de la guía se lee solo
> cuando se crea un patrón, una pestaña o se toca `tokens.css`/`components.css`.

## 0. Resumen esencial (lo mínimo para tocar UI sin leer el resto)

- **Dos superficies**: la app pública (participantes) y el panel `/admin` (quien mantiene los
  datos). Lo que sirve para *planificar* no se enseña en la pública. El panel usa las mismas
  primitivas, más `ui-select` y el bloque de código `admin__code`.

- **Lienzo cálido + tarjetas elevadas**: fondo `--c-bg` (#f3f2ef), tarjetas blancas `ui-card`
  con radio 8 y `--shadow-card`. Nada más lleva sombra salvo `ui-kpis`, `ui-disclosure` y los
  overlays (`--shadow-overlay`).
- **Título dentro de la tarjeta**: toda lista o bloque empieza con `ui-card__header` (título
  15/600 en frase + `ui-count` + `ui-spacer` + acciones a la derecha). No hay títulos sueltos
  fuera de la tarjeta; `ui-section` solo apila tarjetas.
- **Personas** = `ui-avatar` con `[attr.data-tone]="p.tone"` (8 tonos pastel derivados del id
  en `ScheduleIndex`); **equipos** = `ui-team-badge` con `--team-color`. Nada más lleva color.
- **Filas** `ui-row` de 36 px, 2 líneas máximo, chevron como `button.ui-btn--icon` en `__trail`.
- **Textos** por i18n (ro **y** es), fechas con `ldate`, un acento (`--c-primary`), tokens
  siempre, `!important` nunca, sin librerías de UI.

## 1. Principios

1. **Un acento, muchos neutros.** El color transmite significado (equipo, estado, persona),
   nunca decora. Superficie blanca sobre un lienzo cálido (`#f3f2ef`, como LinkedIn); texto
   slate; un azul de acción. Los tonos pastel de avatar identifican personas y no se usan para
   nada más.
2. **Denso pero respirable.** Filas de 36 px, texto de 13 px, rejilla de 4 px. Se muestra más
   información por pantalla, no menos; el espacio en blanco se usa para agrupar, no para rellenar.
3. **Elevación sutil, no decoración.** Sin gradientes. Las tarjetas se separan del lienzo con
   borde 1 px + `--shadow-card` (1–2 px, casi imperceptible); nada más lleva sombra salvo los
   overlays. Radios 4 (controles) y 8 (tarjetas).
4. **La jerarquía la hace la tipografía**, no el color ni el tamaño de las cajas: peso 600 para
   lo primario, 400 secundario en gris, 11 px para metadatos.
5. **Listas, no rejillas de tarjetas**, para colecciones (personas, equipos, eventos). Una fila =
   una entidad; el detalle se expande en línea.
6. **Nada decorativo sin función**: cada icono, badge o chip debe aportar información que no
   esté ya en el texto. Un icono por fila como máximo en la zona de texto.
7. **Accesible por defecto**: lo clicable es `<button>` o `<a>`, foco visible, `aria-expanded`,
   contraste AA (texto ≥ 4.5:1).

## 2. Tokens (`src/styles/tokens.css`)

### 2.1 Color

| Token | Valor | Uso |
|---|---|---|
| `--c-bg` | `#f3f2ef` | Lienzo de la app (neutro cálido) |
| `--c-surface` | `#ffffff` | Tarjetas, cabecera, filas |
| `--c-surface-2` | `#f5f4f1` | Hover de filas, chips neutros, `ui-card__toolbar`, detalle expandido |
| `--c-surface-3` | `#ebeae6` | Fondo activo / pressed |
| `--c-border` | `#e4e2dd` | Bordes por defecto |
| `--c-border-strong` | `#cfcbc3` | Bordes de controles (input, botón) |
| `--c-text` | `#1b2433` | Texto primario |
| `--c-text-2` | `#4b5565` | Texto secundario |
| `--c-text-3` | `#6b7585` | Metadatos, iconos inactivos, placeholders (4,7:1 sobre blanco: AA en 11 px) |
| `--c-primary` | `#0b57d0` | Acción, enlace, tab activo, foco |
| `--c-primary-hover` | `#0947ab` | Hover de acción |
| `--c-primary-soft` | `#e7effc` | Fondo de badge/selección primaria |
| `--c-on-primary` | `#ffffff` | Texto sobre primario |
| `--c-success` / `--c-success-soft` | `#1a7f37` / `#e3f5e8` | Completado, hoy (positivo) |
| `--c-warning` / `--c-warning-soft` | `#9a6700` / `#fff4d6` | Aviso, comida padres |
| `--c-danger` / `--c-danger-soft` | `#b42318` / `#fde8e6` | Error, inactivo con énfasis |
| `--c-focus` | `var(--c-primary)` | Anillo de foco |
| `--c-brand-ink` / `--c-brand-ink-hover` | `#1a365d` / `#122844` | Tinta del wordmark ELIM sobre superficie clara |
| `--c-brand-gold` / `--c-brand-gold-deep` | `#d4af37` / `#9c7a1e` | Acento oro del wordmark (oscuro / claro, AA) |
| `--c-brand-surface` / `--c-on-brand` / `--c-on-brand-muted` | `#1a365d` / `#faf9f6` / `#b9cbe6` | Banda navy del footer y su texto |
| `--tone-0-bg`…`--tone-7-bg` / `--tone-N-fg` | azul, violeta, verde, naranja, rosa, teal, ámbar, slate (pastel 100 / tinta 700) | **Solo** en `ui-avatar[data-tone]`. En oscuro: tinte rgba .18 + tinta 300 |

Los tokens de **marca** son los de MEDIA-ELIM (navy 700 / oro 500) y solo se usan en el wordmark
y el footer; **nunca** como color de acción (eso es `--c-primary`).

**Modo oscuro**: **manual**. Se activa con el botón de la cabecera (`ThemeService`), se guarda en
el dispositivo (`localStorage`, clave `app.theme`) y por defecto la app es siempre clara; **no** se
sigue `prefers-color-scheme`. `tokens.css` redefine solo tokens bajo `:root[data-theme="dark"]`
(superficies, texto, primario más claro, semánticos, equipos en tono 400 con tinta oscura
`--team-badge-ink`). Ningún componente lleva reglas propias de modo oscuro: si algo se ve mal en
oscuro, se arregla en el token, no en el componente. `index.html` aplica el tema guardado con un
script inline antes del primer pintado.

**Colores de terceros**: `--c-whatsapp` (#25d366) y el azul de Telegram solo en su propio glifo
(botón de WhatsApp, opciones de compartir). Nunca como fondo ni como acento de la app.

**Tonos de persona** (`--tone-0` … `--tone-7`): cada joven y cada padre recibe un `tone` (0–7)
derivado de su `id` en `ScheduleIndex` (`toneOf`), estable entre sesiones e idiomas. Se aplica
con `[attr.data-tone]="y.tone"` en `ui-avatar`; el avatar sin `data-tone` sigue siendo neutro.
Nunca se usa el tono para nada que no sea el avatar de esa persona.

**Colores de equipo** (`--team-1` … `--team-7`): `#2563eb`, `#7c3aed`, `#047857`, `#c2410c`,
`#dc2626`, `#0e7490`, `#db2777` (todos ≥ 4,6:1 con número blanco). Se usan **solo** en: badge numerado (`ui-team-badge`), barra
lateral de 3 px de una fila, punto de leyenda. Nunca como fondo de un área mayor que un badge.
Fondo suave derivado: `color-mix(in srgb, var(--team-color) 12%, white)`.

Prohibido: gradientes, `accentColor` de personas como color de UI, hex literales en componentes.

### 2.2 Tipografía

- Familia: `--font: -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`.
  Números tabulares en fechas y contadores: `font-variant-numeric: tabular-nums`.
- Única excepción: `--font-brand` (Playfair Display 600, Google Fonts) **solo** en el wordmark
  `app-brand-logo`. No se usa en títulos ni en ningún otro texto.
- Escala (solo estos valores):

| Token | px | Uso |
|---|---|---|
| `--fs-xs` | 11 | Metadatos, etiquetas de sección en mayúsculas (`letter-spacing: .04em`), badges |
| `--fs-sm` | 12 | Texto secundario de fila, chips |
| `--fs-md` | 13 | **Base**: cuerpo, texto primario de fila, controles |
| `--fs-lg` | 15 | Título de tarjeta / entidad expandida |
| `--fs-xl` | 18 | Título de página (solo uno por vista) |
| `--fs-2xl` | 24 | Cifra destacada (día del mes en tarjeta de próximo evento, KPI) |

Pesos: 400 normal, 500 medio (labels de tab, nombre en fila), 600 seminegrita (títulos, cifras).
Nunca 700+. Interlineado 1.4 (1.2 en cifras). Mayúsculas solo en `ui-eyebrow`, `ui-group-head` y
`ui-subsection__title`. Sin cursivas salvo estados vacíos.

### 2.3 Espaciado, tamaños, radios

- Rejilla 4 px: `--sp-1: 4px` `--sp-2: 8px` `--sp-3: 12px` `--sp-4: 16px` `--sp-6: 24px` `--sp-8: 32px`.
- Alturas: `--h-header: 48px` (64 px desde 600 px) `--h-nav: 40px` `--h-row: 36px` `--h-control: 28px`.
- Iconos: `--icon-sm: 16px` `--icon: 18px` `--icon-lg: 20px`. Avatar `--avatar: 24px`
  (`--avatar-lg: 32px` solo en tarjeta de próximo evento).
- Radios: `--r-sm: 4px` (chips, badges, inputs, botones) `--r-md: 8px` (tarjetas, KPIs,
  disclosure, diálogos) `--r-full: 999px` (avatares, contador circular, icono de KPI).
- Ancho máximo de contenido `--content-max: 1080px`; padding lateral de página `--sp-4`
  (`--sp-3` en < 600 px).
- Sombras: `--shadow-card` (0 1px 2px .06 + anillo 1 px .02) **solo** en `ui-card`, `ui-kpis`
  y `ui-disclosure`; `--shadow-overlay` en menús/diálogos/banner/dock. Ninguna otra.
- Movimiento: `--dur: 120ms` `--ease: cubic-bezier(.2, 0, 0, 1)`; solo `background-color`,
  `border-color`, `color`, `opacity`. Sin `transform` en hover, sin animaciones de entrada.

## 3. Layout

```
┌ header (48px móvil / 64px escritorio, blanco, borde inferior) ──────────────────────────────┐
│ ELIM│ Departament de Tineret · subtítulo         SÂM 12 SEP [RO|ES] │
│ ARGANDA DEL REY (wordmark)                                          │
├ tabs (40px, sticky, subrayado 2px primario) ────────────────────────┤
│ ▣ Programare   Echipe   Tineri   Părinți   Reguli                    │
├ main (bg --c-bg, padding 16, max 1080 centrado) ────────────────────┤
│  secciones apiladas con gap 16                                      │
├ footer (banda navy de marca) ───────────────────────────────────────┤
│ ELIM (tone dark)  [emblema] Departament… © año · versión   [INEB]   │
```

- **Header**: `ui-header`. Wordmark `app-brand-logo` (28–40 px según el ancho, `clamp`) + divisor
  1 px + texto en **dos filas**: título 15/600 y, debajo, subtítulo 12 gris (oculto < 600 px).
  Derecha: fecha de hoy (solo ≥ 600 px), control segmentado de idioma y botón de tema. Sin
  imágenes, sin degradados.
- **Marca** (`app-brand-logo`): el mismo wordmark tipográfico de MEDIA-ELIM ("ELIM" en
  `--font-brand`, tracking 0.22em; "ARGANDA DEL REY" en oro, justificado al ancho del nombre).
  Es la **única** representación de la iglesia; los PNG blancos (`logo-elim.png`) no se usan en
  la UI. `tone="light"` sobre claro, `tone="dark"` sobre la banda navy. El **tamaño no es un
  input**: lo fija el contexto con `--brand-size` (24 px por defecto): cabecera 28 px en móvil y
  `clamp(28px, 3vw, 36px)` desde 600 px (debe caber con aire en los 64 px: nombre + 0.14em +
  ciudad ≈ 1.43 × tamaño); footer `clamp(28px, 3vw, 36px)`.
- **Tabs**: `ui-tabs` con `<a>` por pestaña; icono 18 + label 13/500; activo = texto primario
  y subrayado 2 px; en < 600 px icono sobre label (11 px). Además del toque/clic, se cambia de
  pestaña **deslizando** sobre el contenido (móvil) y con las **flechas ←/→** (teclado; no
  actúan con modificadores, dentro de un campo de texto ni con un diálogo abierto). Con
  teclado el foco pasa a la pestaña nueva.
- **Secciones** (`ui-section`): título en mayúsculas 11/600 gris con contador opcional
  (`ui-count`) y acción a la derecha; contenido en `ui-card` o lista.
- **Footer** (`ui-footer`): **franja mínima** en `--c-brand-surface` (misma banda que
  MEDIA-ELIM), alineada con la columna de contenido (`ui-container`) y con **márgenes mínimos**
  (8 px): wordmark `tone="dark"` (28–44 px según el ancho, `clamp`) · dos líneas de texto
  ("Departament Administrativ Tineret" / "Biserica ELIM — Arganda del Rey © año" + chip de
  versión) · acciones compactas (WhatsApp y compartir como `ui-btn--icon ui-btn--on-dark`) ·
  separador · logo INEB (24–44 px, mismo `clamp`); las acciones compactas son volver arriba,
  WhatsApp y compartir. Los logos son lo que más se ve del pie:
  escalan con el espacio disponible, el texto no. El **chip de versión** muestra el semver y, al
  pasar el ratón o enfocarlo, un tooltip con build, revisión y fecha de publicación (mismo sistema
  que MEDIA-ELIM; `src/version.ts` lo genera `scripts/generate-version.mjs`). Nada más: la app es de uso móvil y todo lo que no sea
  identidad y esas dos acciones sobra al pie de las cinco pestañas. El PNG de INEB es para fondo
  oscuro: vive aquí y en ningún otro sitio.
- **Contacto y distribución** (`app-contact-card`): un solo bloque, al final de **Reguli** (donde
  se acaba de leer cómo funciona todo y surgen las dudas): texto de preguntas/implicación,
  botón de WhatsApp con mensaje preescrito, teléfono; compartir e instalar la app. Regla: **una
  única entrada de contacto visible en cada momento** — el dock mientras se navega; se esconde
  cuando el footer o este bloque están en pantalla (`DockOverlapService`). No se añaden CTAs de
  contacto en otras pestañas.
- **Dock flotante** (`ui-dock`, `app-floating-dock`): pastilla fija abajo a la derecha, como en
  MEDIA-ELIM, con **Compartir** y **WhatsApp** siempre, y **Volver arriba** solo tras bajar más de
  1,5 pantallas. Se esconde mientras el footer o el bloque de contacto de Reguli están en
  pantalla (repiten sus acciones) y se eleva sobre el banner de instalación. Sin desplegable: tres acciones como máximo, un toque cada una.
  Si alguna vez hiciera falta una cuarta, se sustituye por otra; no se apilan.
- **Columna de contenido**: `ui-container` (máx. `--content-max`, padding `--page-pad`,
  border-box) la comparten cabecera, tabs, `main` y footer, así quedan alineados al píxel: las
  bandas (fondo, bordes) van a ancho completo y su contenido dentro del contenedor. Ningún bloque
  define su propio `max-width`.
- Responsive: mobile-first; puntos de corte `600px` y `900px`. Las listas ocupan siempre el
  ancho completo; en ≥ 900 px los bloques de texto de alturas distintas van en dos columnas tipo
  periódico (`ui-columns-2`, CSS `columns`), nunca en una rejilla por filas: la rejilla estira cada
  fila a la tarjeta más alta y deja huecos (Reguli es el caso).

## 4. Iconografía

Material Symbols Rounded, **outlined**, 20 px, como **sprite SVG propio** (`assets/icons.svg`,
sin Google Fonts): `<svg class="icon" aria-hidden="true"><use href="assets/icons.svg#nombre"/></svg>`.
Tamaño con `.icon` (18 px), `.icon--sm` (16), `.icon--lg` (20) — es `font-size`, por eso los
contextos lo ajustan igual que antes; color por `currentColor`. La variante rellena es otro
símbolo: `#star-fill`, `#bookmark-fill`. Icono dinámico:
`<use [attr.href]="'assets/icons.svg#' + (cond ? 'a' : 'b')"/>`. **Al usar un icono nuevo,
ejecutar `npm run icons`** (descarga el glifo y regenera el sprite); `icons.spec.ts` falla si
plantillas y sprite no coinciden. Vocabulario fijo (no añadir sinónimos):

| Concepto | Icono |
|---|---|
| Programare / fecha | `calendar_month`, `event` |
| Equipo | `groups` |
| Joven / persona | `person` |
| Padres | `family_restroom` |
| Reglas (pestaña) | `menu_book` |
| Reglas — secciones | `star`, `checklist`, `schedule`, `cleaning_services`, `family_restroom` (en ese orden) |
| Coordinador | `star-fill` (`.ui-star`, ámbar). Es la **única** marca de coordinador en filas y chips; el badge de texto "Coordonator" no se usa. |
| Echipa mea | `bookmark` / `bookmark-fill` (primario cuando está marcado) |
| Enviar detalles de una programación | `send` (distinto de `share`, que es compartir la app) |
| Propuesta / copiar | `content_copy` → `check` al copiar; sugerencia `lightbulb`; imprimir `print` |
| Hora | `schedule` |
| Comida (padres) | `restaurant` |
| Personas estimadas | `group` |
| Completado | `check_circle` |
| Histórico / archivado | `history` |
| Nota | `sticky_note_2` |
| Expandir / contraer | `expand_more` / `expand_less` |
| Ir a (enlace cruzado) | `chevron_right` |
| Buscar / limpiar | `search` / `close` |
| Calendario (menú descargar / suscribirse) | `event_available` |
| Descargar .ics | `download` |
| Compartir | `share` |
| Volver arriba | `arrow_upward` |
| Tema claro / oscuro | `light_mode` / `dark_mode` |
| Instalar la app | `install_mobile` |
| Implicarse (voluntariado) | `volunteer_activism` |
| WhatsApp | glifo SVG propio de `app-whatsapp-button` (no hay símbolo en Material) |
| Suscripción / sincronizar | `sync` |
| Información / vacío | `info` |

## 5. Estados

- **Hover** de fila/botón: `background: var(--c-surface-2)`, **siempre dentro de
  `@media (hover: hover)`**: en pantallas táctiles el hover se queda pegado al último elemento
  tocado (la pestaña anterior seguía gris tras deslizar). **Pulsado** (`:active`, el feedback
  táctil): `--c-surface-3`.
- **Foco**: `outline: 2px solid var(--c-focus); outline-offset: 2px` en `:focus-visible`.
- **Seleccionado / expandido**: borde izquierdo 3 px `--c-primary` en la fila cabecera.
- **Hoy**: badge `ui-badge--success` con texto "Azi". **Esta semana**: fondo `--c-primary-soft`
  del badge de días. **Completado**: icono `check_circle` en `--c-success`. **Inactivo /
  archivado**: `opacity: .7` en la fila + badge neutro "Inactiv".
- **Vacío** (`ui-empty`): icono 20 px gris dentro de un círculo de 36 px `--c-surface-2` + una
  frase 13 px `--c-text-2`. Siempre que una lista pueda quedar vacía, tiene su `ui-empty`.
  Dentro de un detalle expandido, la variante `ui-empty--inline` (una línea, sin círculo).
- **Sin programación** (patrón en tres niveles, para no convertir la lista en un muro ámbar):
  (1) en la **entidad a la que le toca actuar** (equipo en Echipe y en la rotación) el badge es
  `ui-badge--warning` "Fără programare"; (2) en las **personas** (joven, padre) la fila lleva un
  `ui-badge` neutro — es un estado, no una alarma — y la alerta agregada va **una sola vez** en la
  cabecera de la tarjeta como badge ámbar con contador ("50 fără programare"); (3) el **detalle
  expandido** explica la causa con `ui-empty--inline` y, si procede, enlaza con `ui-link` a la
  rotación ("Vezi rândul echipelor"). Texto único: `common.no_schedule`; padres:
  `parents.no_support_scheduled`.
- **Deshabilitado**: `opacity: .5; pointer-events: none`.

## 6. Catálogo de primitivas (`src/styles/components.css`)

Todas globales, prefijo `ui-`, BEM ligero (`bloque__elemento--modificador`). Los componentes
de feature solo componen estas clases y añaden CSS encapsulado para su disposición.

| Clase | Qué es | Reglas |
|---|---|---|
| `ui-card` | Superficie blanca, borde 1 px, radio 8, `--shadow-card`. `ui-card__header` (mín. 44 px: `ui-card__title` 15/600 en frase + `ui-count` + acciones a la derecha), `ui-card__desc` opcional (13 gris, una frase de contexto bajo la cabecera), `ui-card__toolbar` opcional (fondo `--c-surface-2`: búsqueda + segmentado), `ui-card__body` (padding 12) o una `ui-list` directa. | Una tarjeta = un bloque de sección; **el título va siempre dentro**, nunca encima de la tarjeta. Tarjeta destacada (`--accent`): borde izquierdo 3 px `--c-danger`. |
| `ui-list` | Contenedor de filas; separador 1 px entre filas (`ui-list > * + *`). | Dentro de `ui-card` sin padding. |
| `ui-list--grid` | Variante de `ui-list` para listas largas de fichas cortas (el directorio de Tineri y **todos los históricos**): desde 700 px reparte en columnas de `--list-col` (320 px por defecto; el ancho se elige **midiendo cuántos nombres se cortan** en esa lista concreta: 260–300 en filas cortas, 340–420 donde hay nombre de coordinador, hijos o chips de padres). La separación pasa a ir **debajo** de cada ficha —un borde superior solo en "la siguiente" dejaría sin línea a la primera de cada columna—, y `.ui-group-head` (los meses) y `.is-open` (la ficha abierta) ocupan `grid-column: 1 / -1`. | Una columna sola desperdicia medio ancho y estira la página (Tineri: 3.329 px → 1.245 px). El detalle o la cabecera de mes necesitan el ancho entero; las fichas, no. |
| `ui-row` | Fila de 36 px mín.: `ui-row__lead` (badge/avatar/fecha), zona principal y `ui-row__trail` (badges, acciones, chevron). La zona principal es **o bien** `div.ui-row__main` (no clicable) **o bien** `button.ui-row__btn` que contiene opcionalmente un avatar/badge y un `span.ui-row__text`. Tanto `__main` como `__text` son la columna `ui-row__title` (13/500) + `ui-row__meta` (12 gris). `ui-row--expandable` (hover), `ui-row--expanded` (fondo gris + barra izquierda primaria), `ui-row--muted` (pasado/inactivo). | Máx. 2 líneas de texto. Acciones secundarias como hijos de `__trail`, nunca dentro del botón. El `button` lleva `aria-expanded` si despliega. |
| `ui-row-detail` | Bloque de detalle bajo una fila expandida: fondo `--c-surface-2`, padding 12, borde izquierdo 3 px primario. Contiene `ui-subsection` (`ui-subsection__title` 11 mayúsculas + contenido). Si el título despliega su contenido es un `<button class="ui-subsection__title" aria-expanded>`. Las `ui-list` internas van con fondo blanco y borde. | Un nivel de anidación como máximo. |
| `ui-kv` | Par clave/valor compacto (`ui-kv__k` 96 px gris, `ui-kv__v`). | Datos de ficha ("Membru din 2026"). |
| `ui-group-head` | Cabecera de grupo dentro de una `ui-list` (p. ej. mes): 28 px, fondo gris, 11 mayúsculas + `ui-count`. | |
| `ui-star` | Estrella ámbar de coordinador (`icon icon--sm icon--fill ui-star`, con `title`). | Ver §4. |
| `ui-date` | Bloque de fecha de 40 px: `ui-date__dow` (11 mayúsculas gris) sobre `ui-date__day` (15/600 tabular) y `ui-date__mon` opcional (11). | Alineado al inicio de la fila. |
| `ui-team-badge` | Cuadrado 20×20, radio 4, fondo `--team-color`, número blanco 11/600. `--lg` 28 px (fila de equipo y tarjeta de próximo evento), `--muted` para composiciones históricas. Recibe el color por `[style.--team-color]="getTeamColor(team)"`. | Única forma de mostrar el color de un equipo. |
| `ui-avatar` | Círculo 24 px, iniciales 10/600. Con `[attr.data-tone]="p.tone"` (0–7) toma `--tone-N-bg/fg`; sin atributo es neutro (`--c-surface-3` / `--c-text-2`). `--lg` 32 px. | Una persona = siempre el mismo tono (viene del índice). Los chips de persona (`ui-chip`) incluyen su avatar con tono. |
| `ui-badge` | Etiqueta 11/500, altura 18, radio 4, padding 0 6. Variantes `--primary` (esta semana), `--success` (hoy), `--warning`, `--danger` (indisponible), `--team` (tinte del equipo), neutro por defecto. | Estados y contadores cortos ("Azi!", "5 zile", "8 mai · 2z", "istoric"). |
| `ui-chip` | Como badge pero 24 px con icono opcional; clicable (`<button>`) para enlaces cruzados (p. ej. padre en una fila). | Máx. una fila de chips; si hay más de 4, "+N". |
| `ui-count` | Contador numérico neutro junto a un título (`ui-badge--neutral`). | |
| `ui-btn` | Botón 28 px, radio 6, 13/500. Variantes `--primary` (relleno), `--ghost` (texto, hover gris), `--icon` (28×28 solo icono, `aria-label` obligatorio). | Sin sombras. Acción primaria única por vista. |
| `ui-segmented` | Grupo de botones pegados (idioma, filtros): 28 px, borde 1 px, activo con `--c-primary-soft` y texto primario, `aria-pressed`. | Sustituye a chips de filtro y a menús de 2–3 opciones. |
| `ui-input` | Campo 28 px, borde `--c-border-strong`, radio 4, icono `search` a la izquierda. | Foco = borde primario. |
| `ui-toolbar` | Barra de sección: búsqueda + segmentado + contador, `gap 8`, `flex-wrap`. | Encima de una lista. |
| `ui-kpis` | Tarjeta de KPIs (radio 8, `--shadow-card`): cada `ui-kpi` = `ui-kpi__icon` (círculo 32 px `--c-primary-soft` con icono 18 primario) + `ui-kpi__meta` (cifra 18/600 tabular sobre label 11 gris); separados por borde; 2×2 en móvil, 4 en fila desde 600 px. | Un icono por KPI, siempre en primario. Solo cifras **accionables** (cuándo, cuántas, a quién le toca); nada de totales históricos. Label ≤ 16 caracteres (en 375 px se trunca). |
| `ui-section` | Bloque de página: apila tarjetas/disclosures con `gap 8`. Sin cabecera propia: el título va en `ui-card__header`. | |
| `ui-spacer` | `flex: 1` entre el título y las acciones de una cabecera. | |
| `ui-disclosure` | Botón de fila completa "Istoric echipe (3) ▾" que abre una sección colapsada; superficie blanca con borde, radio 8 y `--shadow-card`; `aria-expanded`. | Para históricos y archivos a nivel de página. Dentro de un detalle, el desplegable es `button.ui-subsection__title`. |
| `ui-times` | Trío inline de horas: `🕒 19:30 → 20:30 🍴 20:00`; la de comida con `ui-times__food-icon` + `ui-times__food` (ámbar). | Los dos únicos iconos permitidos dentro de la meta de una fila. |
| `ui-note` | Nota en línea bajo una fila: icono `sticky_note_2` + texto 12 gris, fondo `--c-warning-soft` suave. | Solo si `observations` no está vacío. |
| `ui-empty` | Estado vacío; `--inline` para una línea compacta dentro de un detalle. | Ver §5. |
| `ui-select` | Desplegable nativo con el aspecto de `ui-input` (28 px, borde `--c-border-strong`, foco primario). | Panel `/admin`; en la app pública se prefiere `ui-segmented`. |
| `ui-form-grid` + `ui-field` | Rejilla fluida de campos etiquetados (`minmax(150px, 1fr)`) con su etiqueta 11 px en mayúsculas; `--wide` ocupa la fila entera, `--inline` pone etiqueta y control en línea. | Formularios del panel. La app pública no tiene formularios. |
| `ui-control` | Campo de formulario suelto (input de texto, fecha, hora o número): 28 px, borde, radio 4. `--xs` para números cortos. | No confundir con `ui-input__field`, que es el buscador (ocupa todo su contenedor). |
| `ui-check` | Casilla + etiqueta en línea. | |
| `admin-bar` (panel) | Barra de secciones del panel en **una sola línea**: las secciones como `ui-tab` (icono + texto) + botón `info` que despliega la explicación. Por debajo de 600 px toma la forma de las pestañas de la app —icono sobre texto— pero al mínimo (40 px de alto, texto de 10 px, `flex: 1 1 0`), para que las seis entren sin desplazamiento horizontal. Sticky **a sangre** justo bajo las pestañas de la app (`top: 48px`, `--h-nav + 1` desde 600 px; `margin-inline: calc(50% - 50vw)` + `padding-inline: calc(50vw - 50%)`, que deja su primera pestaña alineada al píxel con la primera de la app). | Solo en `/admin`. Una barra sticky debe cubrir todo el ancho: si se queda dentro de la columna, el contenido se ve pasar por los lados. |
| `rota` (panel) | **Tabla** real para datos tabulares (la rotación): cabeceras 11 px en mayúsculas alineadas con sus valores, filas de 30 px, cifras tabulares a la derecha y una barra proporcional muy tenue (color del equipo al 14 %) que hace visible el orden de espera. Columnas de texto (`coordinador`, `padres`) con `max-width: 0` + `truncate`; las demás, `width: 1%`. | Cuando cada fila es el mismo conjunto de campos, una tabla se lee mejor que siete frases. Si la cabecera de una columna va a la derecha, su valor también. |
| `agenda` (panel) | Resumen de apoyo: rejilla densa (`auto-fill, minmax(280px, 1fr)`) de una línea por programación (fecha · badge de equipo · padres), con lo que se está preparando marcado por una barra primaria y `max-height` con scroll propio. Quien ayuda demasiado seguido va en ámbar y **es un botón** (`agenda__fix`) que lo cambia por el recambio aconsejado. Cada nombre se recorta por su cuenta —no la línea entera—, o la parte visible de un nombre-botón no coincidiría con su caja y el clic no llegaría. | En el planificador, para repartir sin cargar siempre a los mismos. Es consulta: nunca crece hasta empujar los controles. El aviso y su arreglo van juntos: quien ve el problema no debe buscar la solución en otra parte. |
| `edits` (panel) | Desplegable bajo el código del planificador con los cambios hechos sobre programaciones **ya publicadas**: una línea por programación (fecha · equipo · padres nuevos), el bloque de código con las líneas que las reemplazan y "anula los cambios". Solo existe si hay algún cambio. | Lo que se añade y lo que se reemplaza no se pegan igual: mezclarlos en un solo bloque lleva a duplicar líneas. |
| `row-edit__slot` (panel) | Hueco de padre de una programación: el `ui-select` y, pegado a él (2 px), un `ui-btn--icon` `sync` que propone quién iría mejor ahí; el hueco siguiente va 4 px más allá, para que el botón se lea con **su** desplegable. Si quien está puesto vuelve a ayudar antes de cuatro semanas, el borde pasa a ámbar y el botón se convierte en una pastilla `--warning` con el nombre del recambio (máx. 152 px, `truncate`); sin recambio posible, un icono `warning`. El `title` del hueco dice los días y a quién propone. | El aviso y su arreglo, en el mismo sitio: quien ve el problema no tiene que buscar la solución en otra parte. En el editor, el campo va con `field-parent` (dos columnas de la rejilla), porque es el que más texto lleva. |
| `next` (tarjeta destacada) | La tarjeta del próximo evento/apoyo pesa más que las demás de la página: sombra de overlay, borde teñido y filo de 4 px del color del equipo, cabecera con un lavado del mismo color (8 %) e icono `event_upcoming` a juego. El evento en sí se queda en la superficie limpia y sus bloques de apoyo (equipo, tiras) van sobre `--c-surface-2`. | Es la respuesta a "¿qué toca ahora?": tiene que ganar sin gritar. La jerarquía se hace con superficie y color, no con tamaño: la tarjeta no crece ni un píxel. |
| `app-ineb-logo` | La marca de INEB dibujada en SVG dentro del bundle, como el wordmark de ELIM: `viewBox` de 120×38 —la retícula del arte original, así cada número es una medida—, colores de marca en variables propias (`--ineb-yellow/red/navy`) y `--ineb-in` según el tono (blanco sobre oscuro, tinta de marca sobre claro). El alto lo fija el contexto con `--ineb-size` y el `viewBox` va a ras de tinta, así que ese alto es el del logotipo. Dos variantes: `lockup` (placa + palabra a dos alturas, **mínimo 32 px de alto**) y `compact` (la palabra en una línea, a un solo tamaño y **conservando los dos colores**, baja a 16 px); `auto` elige por ancho de ventana, que es de lo que depende el alto disponible. El rojo de marca (#ff3131) es el mismo en todos los fondos: lo único que cambia con el tono es la tinta del nombre. Todo lo que en el arte bailaba está regularizado: TECH centrado en la placa y con tracking uniforme, placa y «IN» al mismo borde, «IN» y «EB» sobre la misma línea base. | El PNG solo servía sobre fondo oscuro, se veía borroso al escalar y costaba 6 kB de red. Un logotipo debe verse igual en todos los dispositivos: por eso SVG y no tipografía del sistema, que cambia de forma en cada SO. |
| `strip` (público) | Tira de "lo que viene" al pie de la tarjeta destacada: rejilla de líneas de 22 px (fecha · badge de equipo · equipo o padres), columnas de 180 px en modo equipos y de 280 px en modo padres, `max-height` con scroll propio y la programación de la tarjeta marcada con barra primaria. Cada nombre se recorta por su cuenta y es un enlace a su ficha. | La pregunta de siempre es "¿cuándo me toca?": contestarla arriba evita recorrer la lista larga. Solo lectura: la planificación vive en `/admin`. |
| `ui-choice-grid` + `ui-choice` | Selección múltiple entre muchos elementos: rejilla fluida (`auto-fill, minmax(180px, 1fr)`) de casillas compactas de 32 px con avatar, nombre y un badge; la casilla nativa queda oculta (accesible) y el estado se ve por el fondo primario suave y el icono `check_circle`. | Cuando una lista de una línea por elemento ocuparía pantallas enteras (60 jóvenes). Con menos de ~10 opciones, `ui-list`. |
| `ui-code` | Bloque de código generado: monoespaciado, fondo `--c-surface-2`, scroll horizontal propio. | Solo en `/admin`; se usa con `app-admin-code` (añade el botón de copiar). |
| `ui-chip--person` | Persona señalada: pastilla de 34 px con avatar de 26, nombre a 15/600 y relleno primario suave. | Los padres de apoyo de la tarjeta destacada: quien entra en Părinți tiene que ver de un vistazo si le toca. Junto a los chips pequeños del equipo preparador salta a la vista sin gritar; el nombre va al mismo cuerpo que el del equipo, que es el otro dato que se busca. |
| `ui-chip[aria-pressed]` | Chip conmutable (filtro "Echipa mea"): activo = primario suave + borde primario. | Un solo chip conmutable por barra; para 2–3 opciones excluyentes, `ui-segmented`. |
| `ui-banner` | Barra flotante inferior (fija, máx. 520 px, sombra overlay): `ui-banner__img`/`__icon` + `ui-banner__text` (título 13/600 + `ui-banner__hint` 12 gris) + acciones `ui-btn`. | Solo para el aviso de instalación de la PWA. No hay barra de "nueva versión": la app se actualiza sola. |
| `ui-dock` | Pastilla fija abajo-derecha con `ui-btn--icon` redondos de 36 px y `ui-dock__sep`; `--hidden` la oculta. | Ver §3. |
| `ui-dialog` | `<dialog>` abierto con `showModal()`: `ui-dialog__panel` (máx. 520 px, sombra overlay) con `__header` (título 15/600 + cerrar), `__text`. Velo en `::backdrop`. Se cierra con Escape y clic en el velo. | Único patrón de modal. Contenido corto (compartir); un flujo largo es una pantalla. |
| `ui-btn--on-dark` | Variante de `ui-btn` para la banda navy: contorno y texto claros; con `--icon`, transparente con glifo claro. | Solo sobre `--c-brand-surface` (footer). |
| `ui-menu` | Menú mínimo anclado a un botón: `ui-menu__panel` (260–320 px, sombra overlay, abajo-derecha) con `ui-menu__item` (icono + `ui-menu__title` 13/500 + `ui-menu__desc` 11 gris) y `ui-menu__note` opcional. Cierra con clic fuera y Escape. | Solo para 2–3 acciones (calendario). Más opciones = otra pantalla, no un menú. |
| `ui-eyebrow` | Texto 11 mayúsculas gris con `letter-spacing`. | Etiquetas encima de un valor. |
| `ui-eyebrow--marked` | Etiqueta de sección con una barrita de 3 px del color del equipo (`--team-color`, primario como respaldo). Sin altura extra: va dentro de la propia etiqueta. | Solo dentro de la tarjeta destacada: ata cada bloque al evento del que habla. |
| `ui-link` | Enlace/botón de texto primario sin subrayado; subrayado en hover. | Enlaces cruzados en texto corrido. |

**Patrones compuestos (componentes Angular en `shared/ui/`)**: `app-event-row` (fila de
programación en cualquier contexto), `app-next-event-card` (tarjeta destacada del próximo
evento/apoyo), `app-calendar-button` (descarga `.ics`). Ver [ARQUITECTURA.md](ARQUITECTURA.md).

## 7. Reglas de escritura de CSS

1. Tokens siempre (`var(--…)`); prohibido `!important` (si "hace falta", el selector está mal).
2. Global: solo `tokens.css`, `base.css`, `layout.css`, `components.css`. Todo lo demás en el
   `styleUrl` del componente (encapsulado), y solo para **disposición** de las primitivas.
3. Un componente no redefine una primitiva `ui-*`; si necesita una variante, se añade en
   `components.css` como modificador documentado aquí.
4. Mobile-first: estilos base para móvil, `@media (min-width: 600px)` y `(min-width: 900px)`.
5. Sin `px` mágicos: alturas y anchos salen de tokens; anchos de columna con `grid` y `minmax`.
6. Nombres en inglés (`ui-row__title`), comentarios en español, breves y explicando el porqué.
7. Un elemento `position: sticky` debe ser el **host** del componente (o hijo directo de
   `app-root`): un sticky solo se pega dentro de su padre. `TabsNavComponent` aplica `ui-tabs`
   con `host: { class }` por eso.
8. Los destinos de scroll (`[id]`) llevan `scroll-margin-top: var(--sticky-offset)` (en
   `base.css`) para no quedar bajo las tabs.
9. Ningún `:hover` fuera de `@media (hover: hover) { … }` (una línea por regla, junto a la
   primitiva). Lo que deba abrirse también con el dedo (tooltip de versión) usa `:focus`.

### 7.1 Impresión

`@media print` al final de `base.css`, `layout.css` y `components.css`: fondo blanco, sin
cabecera derecha, tabs, footer, dock, banner, botones (`ui-btn`), toolbars, KPIs ni disclosures;
tarjetas sin sombra y con `break-inside: avoid`. Pensado para el tablón: Programare imprime la
próxima programación, la lista por mes y la rotación. El botón `print` de "Toate programările"
llama a `window.print()`.

### 7.2 Accesibilidad de teclado y lector de pantalla

Skip link "Sari la conținut" (primer elemento del DOM, visible solo con foco), `<main id="main"
tabindex="-1">`, región `aria-live="polite"` con el nombre de la pestaña activa; flechas ←/→
cambian de pestaña. Los enlaces con texto visible **no** llevan `aria-label` que lo contradiga
(Lighthouse `label-content-name-mismatch`): usar `title`.

## 8. Textos e i18n

- Toda cadena visible pasa por `translate` (`assets/i18n/ro.json` y `es.json`, **ambos**).
- Fechas: pipe `ldate` (`'full' | 'short' | 'dayMonth' | 'monthYear' | 'dow' | 'dowLetter' |
  'mon'`). Nunca formatear fechas a mano ni con arrays de meses.
- Tono: neutro y corto. Títulos en frase (no Title Case), sin signos de exclamación salvo "Azi!".
- Números: `12 persoane`, `în 5 zile`, `acum 3 zile`; contadores como badge, no entre paréntesis.
- **Singular y plural**: todo contador visible pasa por el pipe `plural`
  (`{{ n | plural:'admin.health_warnings' }}`), con una clave `…_one` para el 1. "1 avertismente"
  o "acum 1 zile" delatan una interfaz descuidada.

## 9. No hacer (lista negra)

- Gradientes, sombras distintas de `--shadow-card`/`--shadow-overlay`, `transform` en hover,
  animaciones de entrada.
- Cabeceras de tarjeta coloreadas; fondos de color detrás de nombres de personas (el tono va
  solo en el avatar); títulos de sección fuera de la tarjeta.
- Tarjetas para listar colecciones; más de 2 líneas de texto por fila.
- Iconos junto a cada dato de una fila; pastillas ("pills") con icono + texto para metadatos que
  caben como texto gris.
- Mayúsculas fuera de `ui-eyebrow` / `ui-group-head` / `ui-subsection__title`; negritas 700.
- `<div (click)>` para acciones: usar `<button>` / `<a>`.
- Reintroducir librerías de UI (Material, PrimeNG, Bootstrap…). Las primitivas de §6 bastan;
  si falta una, se añade a `components.css` y a esta guía.
- Modo oscuro automático o avisos de "nueva versión": el tema lo elige el usuario y la app se
  actualiza sola (decisiones del propietario).
- Mostrar un dato que en los datos siempre está vacío (p. ej. `role`, `skills`, `available`)
  sin condicional.
