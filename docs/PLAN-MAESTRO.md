# Plan maestro — Rediseño ELIM Admin (v2)

> Documento de trabajo del rediseño completo de la app `elim-admin`. Contiene la auditoría
> (estado de partida), las decisiones tomadas y el plan por fases con su estado.
> La guía visual vinculante está en [GUIA-ESTILOS.md](GUIA-ESTILOS.md) y la estructura de
> código en [ARQUITECTURA.md](ARQUITECTURA.md).

Fecha de la auditoría: 2026-09-12. Versión de partida: `v.1.0.15`.

---

## 1. Qué es la app (funcionalidad real, pestaña por pestaña)

PWA estática (Angular 17 en la auditoría, hoy Angular 22; sin backend, datos en `src/app/core/data/*.data.ts`) publicada
en GitHub Pages. Uso principal: **móvil** (instalada como PWA) por los coordinadores y jóvenes
del departamento de tineret de la iglesia ELIM Arganda. Idiomas: rumano (defecto) y español.

| Pestaña | Ruta | Qué hace de verdad |
|---|---|---|
| **Programare** | `/` | KPIs (próximas, este mes, equipos activos, finalizadas) · tarjeta "próximo evento" (equipo, coordinador, 3 horas: llegada jóvenes / inicio / comida padres, nº personas, roster de la equipa, padres de apoyo, countdown, .ics) · "În curând" (3 próximas, redundante con la lista) · lista completa de próximas agrupada por mes · resumen histórico de coordinadores (nº de veces) · histórico colapsable. Navegación cruzada a equipo/joven/padre. |
| **Echipe** | `/echipe` | 7 equipos activos; tarjeta por equipo (nº, nombre, coordinador, nº miembros, próxima fecha). Expandir → coordinador, miembros (enlazan al perfil), galería (siempre vacía), próximas programaciones, histórico de programaciones. Sección "Istoric echipe": composiciones cerradas (3) con sus miembros y programaciones. |
| **Tineri** | `/tineri` | 60 jóvenes. 3 KPIs, buscador por nombre, filtro Toți/Coordonatori/Membri, tarjeta por joven (iniciales, nombre, sexo, badge coordinador, próxima fecha). Expandir → miembro desde, equipos activos con countdown, equipos anteriores, próximas, histórico de participación, intereses, padres vinculados, notas. Sección "Foști membri" (archivados). |
| **Părinți** | `/parinti` | 13 madres. Tarjeta "próximo apoyo" (evento + padres asignados + countdown) · próximas con padres · histórico con padres · tarjeta por madre (iniciales, nombre, rol, disponibilidad, próxima fecha). Expandir → habilidades, hijos en el departamento, próximas, histórico, "miembro desde", notas. Archivados colapsables. |
| **Reguli** | `/reguli` | 5 secciones de texto (rol coordinador, organización, antes, después, padres) desde i18n. |

Transversal: cabecera (2 logos, título, selector de idioma, fecha de hoy), tabs sticky, footer con
3 logos y versión, swipe entre pestañas, banner de instalación PWA, auto-actualización del SW,
exportación `.ics` por evento/equipo/joven/padre.

## 2. Diagnóstico (por qué "parece una app para niños")

### 2.1 Visual
- **Color sin jerarquía**: 7 colores de equipo como *fondos degradados* de cabeceras, más un
  `accentColor` por persona (60 jóvenes + 13 padres) como cabecera degradada de cada tarjeta, más
  iconos de KPI en 3 colores distintos. Resultado: arcoíris; nada destaca porque todo destaca.
- **Todo es tarjeta**: 60 jóvenes = 60 tarjetas de 3 filas cada una. Densidad bajísima; en móvil
  se ven 3 personas por pantalla.
- **Cabecera y footer oscuros** con degradados radiales, patrón de puntos, 3 logos, barra de
  acento multicolor. Reguli con "hero" oscuro y pastillas decorativas.
- **Redundancia**: "În curând" repite las 3 primeras filas de "Toate programările"; cada fila
  muestra el icono `person`, `restaurant`, `schedule`, `restaurant_menu` aunque no aporten.
- **Estados vacíos inexistentes**: hoy (12-sep-2026) no hay programaciones futuras y la home
  muestra los títulos "În curând" y "Toate programările (0)" sin contenido.

### 2.2 CSS (`styles/app.css`, 6.030 líneas)
- 626 `!important`, 135 colores hex distintos, 63 gradientes, 123 sombras, ~50 tamaños de fuente
  distintos, 39 media queries. Capas sucesivas ("compact rebuild", "V3", "FIX DEFINITIVO") que
  sobrescriben capas anteriores en vez de sustituirlas. Los tokens `--ds-*` existen pero se
  aplican con `!important` sobre Material.
- Se cargan **Angular Material completo** (tema + tipografía) y **PrimeNG completo** (tema
  `lara-light-blue` + `primeng.min.css` + primeicons) para: Material → toolbar, tabs, tooltip,
  menú, card, chip, divider, ripple, snackbar; PrimeNG → **solo** la galería, cuyos datos están
  100 % comentados (`MOCK_GALLERY_DATA = {}`). Se lucha contra ambos con `!important`.
- Tres hojas de fuentes externas: Roboto, Material Symbols Rounded y Material Icons (legacy).

### 2.3 Código
- Arquitectura TS razonable (standalone, signals, OnPush, `DataService` con índices O(1),
  `NavigationService` para enlaces cruzados). Se conserva.
- **Código muerto**: `EventNotesDialogComponent` + `EventNotesService.open/close` (nunca se
  llama `openNotes` desde ningún template), `archiveYouth/restoreYouth/archiveParent/
  restoreParent` (sin UI), `getTeamsForParent/getParentsForTeam` (deprecated), `totalMealsServed`
  (UI comentada), galería completa (`atm-gallery`, 459 líneas SCSS + PrimeNG).
- **Funcionalidad rota**: la opción "Abonare în direct (webcal)" copia una URL a
  `/assets/calendars/*.ics` que **no existe** (GitHub Pages no la genera) → 404 garantizado.
- **Bugs**:
  1. Etiquetas de mes de los grupos (`MonthGroup.label`) se calculan una vez con `MONTHS_LONG`
     en rumano → no cambian al pasar a español.
  2. Tineri/Părinți muestran "Fără echipă activă" / "Fără echipă alocată" cuando lo que ocurre es
     que **no hay programaciones futuras** (el joven sí tiene equipo activo).
  3. Al hacer clic en un equipo desde otro equipo (misma pestaña) no se expande el destino: los
     componentes leen el `expanded` pendiente solo en `ngOnInit` (Părinți lo arregló con un
     `effect`, Echipe/Tineri no).
  4. Duplicidad `constants.ts` (arrays ro fijos) vs `localized-constants.ts` (mutados al vuelo).
- Convención de idioma mezclada (comentarios ro/es/en). Modelos exportados desde el fichero de
  datos (dependencia invertida).

## 3. Decisiones de diseño y arquitectura (resumen; detalle en la guía)

| Decisión | Motivo |
|---|---|
| **Eliminar Angular Material y PrimeNG** (y CDK, primeicons, `custom-theme.scss`). | Se usa <5 % de cada librería y se combate su CSS con `!important`. Sin ellas: control total, bundle mucho menor, look compacto real. Los 2 menús desaparecen (idioma → control segmentado; calendario → acción única). |
| **Reescribir el CSS desde cero** con tokens (`styles/tokens.css`) + base + layout + primitivas `ui-*`; estilos de cada feature encapsulados en su componente. | Es la única forma de bajar de 6.030 líneas y 626 `!important` a un sistema mantenible. |
| **Superficie clara, un solo acento** (azul), neutros slate, sin sombras salvo overlays, sin gradientes. | Referencia Gmail compacto / Atlassian: claro, denso, sobrio. |
| **Color de equipo solo como marca pequeña** (badge numerado, barra de 3 px, punto). Paleta de 7 colores armonizada (misma luminosidad). | Conserva la función (reconocer el equipo de un vistazo) sin el arcoíris. |
| **Avatares neutros** (iniciales, gris). Se ignora `accentColor` de personas en la UI. | El color lo lleva el equipo, no la persona. |
| **Listas de filas** (Gmail) en vez de rejillas de tarjetas para personas y equipos; detalle expandible en línea. | Densidad ×3; 60 jóvenes caben en una pantalla de escritorio. |
| **Fechas vía `Intl.DateTimeFormat`** (pipe `ldate`) según idioma activo. | Elimina arrays de días/meses en JSON y constantes, y arregla el bug de los meses. |
| **Estado "expandido" vive en `NavigationService`** y los componentes lo leen directamente. | Un único origen de verdad; funciona la navegación cruzada dentro de la misma pestaña. |
| **Quitar**: "În curând", galería, diálogo de notas, webcal, icono de sexo, punto de disponibilidad (todo `available: true`), tercer logo, tooltips Material (se usa `title` nativo donde aporta). | Redundante, roto o sin datos detrás. |
| **Añadir**: estados vacíos, filas accesibles (`button`, `aria-expanded`), foco visible, impresión básica. | Calidad profesional mínima. |
| Fuente: **pila del sistema** (Segoe UI / SF / Roboto). Iconos: **Material Symbols Rounded, outlined (FILL 0), 18–20 px**, una sola hoja. | Sin red para tipografía; iconos finos y consistentes. |
| Footer solo texto (los logos ELIM e INEB son blancos, pensados para fondo oscuro). | Sobre superficie clara no se ven; hacer un footer oscuro solo para ellos rompe el sistema. Si se quieren, hacen falta versiones SVG monocromas para claro. |
| Versión `v.2.0.0`. | Rediseño completo = mayor. |

Fuera de alcance (deliberado): migrar Angular 17→20, backend/edición de datos, modo oscuro,
tests. Quedan como siguientes pasos en §5.

## 4. Plan por fases y estado

| Fase | Contenido | Estado |
|---|---|---|
| 0 | Auditoría, guía de estilos, arquitectura, plan (este documento), `CLAUDE.md` del proyecto | ✅ |
| 1 | Fundación: tokens + base + layout + primitivas CSS; quitar Material/PrimeNG; `index.html`; shell (header, tabs, footer, PWA prompt); pipe `ldate`; limpieza de constantes | ✅ |
| 2 | Primitivas Angular compartidas: `EventRowComponent`, `NextEventCardComponent`, `CalendarButtonComponent` (acción única) | ✅ |
| 3 | Pestañas: Programare, Echipe, Tineri, Părinți, Reguli | ✅ |
| 4 | Limpieza: código muerto, `models.ts` como fuente de interfaces, i18n (claves huérfanas), README, versión | ✅ |
| 5 | Verificación: build producción (budgets), `tsc` estricto, revisión visual desktop + móvil, bugs §2.3 | ✅ |

### Entregado (2026-09-12) — `v.2.0.0`, sin commitear (working tree)
- Sistema de diseño en `src/styles/` (tokens, base, layout, primitivas) + CSS encapsulado por
  componente: **≈1.000 líneas** frente a 6.500; **0 `!important`**, 0 hex fuera de tokens.
- Bundle de producción: **1,33 MB → 0,52 MB** (−61 %); CSS **399 KB → 17 KB** (−96 %).
  Dependencias eliminadas: `@angular/material`, `@angular/cdk`, `@angular/animations`,
  `primeng`, `primeicons`.
- Las cinco pestañas reescritas sobre `ui-*` con 3 componentes compartidos (`app-event-row`,
  `app-next-event-card`, `app-calendar-button`). Sin galería, sin diálogo de notas, sin webcal.
- Bugs 1–4 de §2.3 corregidos; estados vacíos; filas accesibles (`button` + `aria-expanded`);
  foco visible; impresión básica; anclas con `scroll-margin` bajo las tabs sticky.
- Pipe `ldate` (Intl) y `LanguageService` simplificado; `models.ts` como única fuente de tipos;
  `RULES` fuera del fichero de datos (viven en i18n); i18n reducido a las 129 claves en uso.
- Verificado en navegador (375 px y 800–1280 px, RO y ES) con la fecha congelada al
  06-05-2026 para ver el estado "con programaciones futuras", y con la fecha real (sin
  futuras → estados vacíos). Dos fallos del compilador de Angular 17 encontrados y esquivados
  (documentados en ARQUITECTURA §4.1).
- Documentación: `CLAUDE.md`, `docs/GUIA-ESTILOS.md`, `docs/ARQUITECTURA.md`, este plan,
  `README.md` actualizado.

### Entregado (2026-09-12, segundo bloque) — `v.2.1.0`
- **Marca**: `app-brand-logo` portado de MEDIA-ELIM (wordmark tipográfico, tokens de marca
  navy/oro, Playfair Display solo para él). Cabecera con wordmark + departamento; **footer en
  banda navy** con wordmark, emblema del departamento e INEB — los PNG blancos por fin se ven.
- **Suscripción de calendario real**: feeds `assets/calendars/*.ics` (global, 7 equipos, 60
  jóvenes, 13 padres) generados en `prestart`/`prebuild` y en el workflow; el botón de
  calendario ofrece *Descargar (.ics)* y *Suscribirse* (copia la URL https del feed, muestra el
  enlace webcal). Corregido de paso el `\\n` doble en las descripciones del .ics.
- **Dominio sin Angular**: `ScheduleIndex` (`core/domain`) + `ics.utils` + `calendar-feeds`,
  reutilizados por la app y por Node. `DataService` solo añade signals.
- **Datos** partidos en `core/data/*.data.ts` (+ `index.ts`), sin tocar contenido.
- **Modo oscuro** automático (solo tokens), verificado en Programare y Echipe.
- Reguli: índice de secciones por `scrollIntoView` (con `<base href>` de producción un
  `href="#id"` sacaba de la pestaña). Fecha oculta en la cabecera móvil. Scripts legacy
  duplicados eliminados (`pad_icon.js`, `fix-mojibake.js`).

**¿Afectó en algo quitar webcal en v2.0?** No: la opción antigua copiaba una URL a un fichero
que no existía (404), así que nadie pudo tenerla funcionando. En v2.1 la suscripción existe de
verdad (feeds publicados en el deploy); quien la añada a su calendario recibirá los cambios solos.

### Entregado (2026-09-12, tercer bloque) — `v.2.2.0`
- **Angular 17 → 22** (TypeScript 6, `@angular/build`, ngx-translate 18 con
  `provideTranslateService`/`TranslatePipe`) y **zoneless**: sin `zone.js` (−34 KB), sin
  `platform-browser-dynamic`. Verificado en navegador: idioma, filtros, expansión, navegación
  cruzada, menú de calendario. Requiere **Node ≥ 22.22**: `engines` en `package.json`, workflow
  con Node 22; en local, si no se quiere instalar Node 22, basta anteponer
  `npx -y -p node@22 -p npm@11 --` a los comandos.
- **Datos sin nada derivable**: `fullName`, iniciales y los equipos (activos e históricos) los
  deriva `ScheduleIndex` a partir de `DOMAIN_DATA` (inyectable → testeable). Fuera `accentColor`,
  `initials` manuales y `teams.derived.ts`; el histórico de equipos usa `TeamComposition`.
- **Tests** (`npm test`, vitest): 22 casos sobre `ScheduleIndex` (partición temporal, ventanas de
  pertenencia, composiciones, coordinadores, padres) e `ics.utils`/`calendar-feeds` (formato,
  escapado, plegado, nombres y URLs). Fixture propio, independiente de los datos reales.
- **Actualización del SW**: se descartó la barra "nueva versión" (decisión del usuario: lo
  publicado debe verse siempre). Se refuerza la recarga automática: comprueba al arrancar, cada
  15 min y **al volver a primer plano**. Los feeds `.ics` quedan fuera de la caché del SW.
  Registro del SW verificado con Chromium headless (el panel de vista previa no permite SW).
- Accesibilidad: `aria-controls` en todas las filas expandibles hacia el `id` de su detalle.
- Scripts legacy eliminados; `karma`/`jasmine` sustituidos por vitest.

### Entregado (2026-09-13, cuarto bloque) — `v.2.3.0`
- **Footer mínimo**: wordmark ELIM · dos líneas (departamento / iglesia © año + chip de versión
  con tooltip de build, revisión y fecha, generados por `scripts/generate-version.mjs` como en
  MEDIA-ELIM) · iconos compactos de WhatsApp y compartir · INEB; márgenes mínimos y logos fluidos
  (28–44 px). Franja alineada con la columna de contenido vía `ui-container`, contenedor único
  compartido por cabecera, tabs, main y footer. El
  footer "de sitio web" con columnas se probó y se descartó: la app es de uso móvil y repetía
  contenido al pie de las cinco pestañas. El contacto (WhatsApp al responsable para preguntas e
  implicarse — hijos u otros padres que quieran ayudar —, teléfono) y la distribución (compartir,
  instalar) van en **un bloque al final de Reguli** (`app-contact-card`) (logo INEB
  reescalado de 6000 px a 320 px; `logo-elim.png` y `logo_admin-trans-512.png` eliminados por no
  usarse).
- **Dock flotante** abajo-derecha (patrón MEDIA-ELIM): Compartir + WhatsApp siempre; Volver
  arriba tras 1,5 pantallas; se oculta mientras el footer o el bloque de contacto de Reguli
  están en pantalla. Sin desplegable (decisión de diseño:
  con ≤ 3 acciones un toque extra solo esconde lo que se busca).
- **Compartir**: hoja nativa del sistema en móvil; en escritorio `<dialog>` con WhatsApp,
  Telegram, e-mail y copiar enlace (sin QR, por indicación del propietario).
- Contacto **unificado**: se descartó repetir el botón de WhatsApp (tarjeta en Părinți + dos
  columnas del footer + dock) — mismo número, mismo destino. Regla: una sola entrada visible en
  cada momento (dock siempre; bloque de Reguli cuando se lee la guía).
- **Modo oscuro manual**: botón en la cabecera, guardado en el dispositivo, claro por defecto;
  eliminado el automático por `prefers-color-scheme`.
- Botón de calendario **global** ("Toate programările" → `toate.ics`) que faltaba.
- Verificado con Chromium headless: footer 375/700/1280, dock (aparición, ocultación en footer,
  volver arriba), diálogo de compartir, persistencia del tema tras recarga, sin errores de consola.

### Entregado (2026-09-14, quinto bloque) — `v.2.4.0`
- **Restyle "con vida" (referencia LinkedIn)** manteniendo densidad y sobriedad: lienzo neutro
  cálido (`--c-bg #f3f2ef`) con tarjetas blancas elevadas (radio 8 + `--shadow-card` de 1–2 px);
  **títulos dentro de la tarjeta** (`ui-card__header` 44 px con contador y acciones), texto de
  apoyo `ui-card__desc` y barra `ui-card__toolbar` (búsqueda + filtros de Tineri sobre fondo
  suave); **avatares con tono** (8 pastel derivados del `id` en `ScheduleIndex.toneOf`, aplicados
  por `data-tone` en filas y chips de personas); **KPIs con icono** en círculo primario; estado
  vacío con icono en círculo. `ui-section__head/__title` eliminados (muertos) y `ui-spacer`
  como separador de cabecera. Modo oscuro ajustado en tokens (tintes rgba .18 + tinta 300).
- Docs: guía con §0 "resumen esencial" y principios actualizados ("elevación sutil" en lugar de
  "plano"); `CLAUDE.md` reescrito con las reglas de actuación (senior + diseñador experto,
  arquitectura recomendada) y la **estrategia de ahorro de tokens** (reglas base siempre; docs
  por sección y solo cuando toca; capturas solo si el cambio es visual; sin subagentes).
- **Táctil**: todo `:hover` pasa a `@media (hover: hover)` (en el móvil la pestaña tocada antes
  seguía gris tras cambiar deslizando), `:active` como feedback de pulsación en pestañas y
  filas, y al deslizar se suelta el foco de la pestaña anterior (anillo azul en Chrome). El
  tooltip de versión se abre también con el toque (`:focus`).
- **Teclado**: flechas ←/→ cambian de pestaña (mismo `navigateTab` que el gesto); se ignoran
  con modificadores, en campos de texto y con diálogo abierto; el foco sigue a la pestaña nueva.
- **Wordmark de la cabecera**: el `clamp` fluido de `layout.css` nunca se aplicaba (perdía por
  especificidad ante `:host(.is-sm)` del componente) y el logo salía a 24 px fijos. El tamaño
  deja de ser input (`size` eliminado) y pasa a ser la propiedad `--brand-size` leída con
  fallback; cabecera 28 px móvil / 28–36 px escritorio, footer 28–36 px.
- Verificado: `tsc`, 23 tests (nuevo test de estabilidad del tono), build de producción y
  capturas headless de las cinco pestañas en 1240/375 px, claro y oscuro.

**Utilidades analizadas y descartadas** (no aportan en esta app): QR de compartir (descartado
por el propietario), enlaces a redes sociales (el departamento no tiene canales propios),
formulario de contacto (sin backend; WhatsApp lo cubre), notificaciones push (requieren
servidor; la suscripción al calendario ya avisa), modo presentación (no se proyecta), impresión
dedicada (el CSS de impresión básico ya existe), detección automática de idioma (rumano por
defecto es deliberado).

### Entregado (2026-09-14, sexto bloque) — `v.2.5.0` (plan de auditoría; A1 excluido por decisión del propietario)
- **Datos y calendarios**: `completed` eliminado (derivable) y feeds `.ics` con `STATUS:CONFIRMED`
  (antes todo lo futuro salía como provisional en Google/Apple Calendar). Enumerados como códigos
  + i18n (`program_type.youth_evening`, `relationship.mother|father|guardian`) también en la
  descripción del `.ics`. `data-integrity.spec.ts` valida los datos reales (16 comprobaciones);
  el deploy ejecuta `tsc` + `npm test` antes de construir.
- **Rotación de equipos** (`ScheduleIndex.teamRotation`, con tests): bloque "Rândul echipelor" en
  Programare (última vez, días de espera, próximo turno; los sin turno primero) y KPIs
  accionables (días hasta la próxima, este mes, futuras, equipos a la espera).
- **Búsqueda** sin diacríticos y por equipo (`normalizeForSearch`); "N sprijine" en cada padre;
  "Membru din" / "Din" ocultos mientras todos compartan fecha de alta.
- **Plataforma**: recarga al cambiar de día con la PWA abierta (`DayRolloverService`); título del
  documento por pestaña traducido (`I18nTitleStrategy`); enlaces profundos por fragmento
  (`#team:Echipa 4`…) con scroll por `afterNextRender` (sin temporizador).
- **Contraste AA**: `--c-text-3` #6b7585 (4,7:1); equipos 3/4/6 en tono 700 (≥ 5:1).
- **PWA / compartir**: fuente de iconos en subconjunto (`icon_names`, 31 glifos); Open Graph
  (título, descripción, imagen 512, URL; el mirror recibe la suya en el deploy); manifest con
  `id`, `shortcuts` (Echipe, Tineri, Părinți), `background_color` de marca y sin bloqueo de
  orientación.
- **Estado "fără programare" en toda la app** (patrón de tres niveles, guía §5): badge ámbar en
  las filas de Echipe sin turno y contador en su cabecera; en Tineri y Părinți badge neutro por
  fila + contador ámbar en la cabecera ("50 fără programare", "11 fără sprijin programat"),
  detalle con la causa y enlace "Vezi rândul echipelor" (`NavigationService.goToRotation`,
  fragmento `#rotation`); sub-filas de equipo del joven con "Fără programare"; contadores
  `youthStats.withoutUpcoming` y `parentStats` en el dominio (con tests). Singular/plural de
  "sprijin".
- **Lint de iconos** (`icons.spec.ts`): tras el subconjunto de iconos, `sticky_note_2` (nota de
  una programación) quedó fuera y se pintaba como texto; el spec extrae los iconos usados en
  plantillas/componentes y exige que coincidan exactamente con `icon_names` y en orden alfabético.
- Verificado: `tsc`, 44 tests, build de producción, capturas de Programare (1240/375), enlace
  profundo `/echipe#team:Echipa%204` (expande y hace scroll), fragmento al expandir/contraer,
  búsqueda "birle" → Bîrle Filip/Tania, "echipa 7" → 8 miembros, títulos por pestaña.

### Entregado (2026-09-14, séptimo bloque) — `v.2.6.0` (auditoría 2 completa salvo U3)
- **Planificación**: propuesta automática de turnos (`ScheduleIndex.proposedSchedule`: siguiente
  viernes libre para cada equipo sin turno, en orden de rotación) con "Copiază pentru
  schedule.data.ts" (`toDataSourceLines`); "fără părinți" en programaciones futuras sin padres
  (fila, tarjeta, contador en cabecera) y sugerencia de los menos solicitados en Părinți
  (`suggestParents`); turnos por temporada (sept→ago, `seasonStartOf`) en la rotación; aviso en
  `npm test` de programaciones que no caen en viernes (hay una: Echipa 1 · 10-03-2025, lunes).
- **Participantes**: "Echipa mea" (`MyTeamService`, marcador en Echipe, tarjeta en Programare,
  filtro en Tineri); "Trimite detaliile" (`EventShareService` + `app-event-share-button`, hoja
  nativa o WhatsApp Web, con enlace profundo al equipo); impresión (`@media print` + botón);
  "Mâine" (`until` pipe); segundo recordatorio 2 días antes en los feeds de padres
  (`PARENT_ALARMS`); "Copiază linkul acestei pagini" en el diálogo de compartir.
- **Plataforma**: sin Google Fonts — Playfair 600 (latino, 23 KB) alojada y **sprite SVG de
  iconos** (`assets/icons.svg`, 39 glifos, `npm run icons`, `build-icons.mjs`), con `icons.spec.ts`
  plantillas ↔ sprite; skip link + `aria-live`; tests de componente (`*.dom.spec.ts`, 9 tests:
  fila de programación, Echipe, NavigationService con router real) vía `ng test`;
  `APP_TODAY`/`APP_DATA` como costuras; **Lighthouse CI** (job aparte, informa sin bloquear;
  informe como artefacto); capturas en el manifest; `isCoordinator` y `ParentTeamAssignment`
  eliminados; original de 1,3 MB del icono fuera de `assets/`.
- **Lo que enseñó Lighthouse** (móvil emulado, antes → después): LCP **9,2 s → 3,0 s** al
  empaquetar el rumano (la primera pantalla esperaba a `ro.json`); accesibilidad 0,92 → **1,0**
  (banner con nombre, enlaces sin `aria-label` contradictorio, contraste de ámbar y oro);
  rendimiento 0,64 → 0,89. Umbrales: rendimiento ≥ 0,85, accesibilidad ≥ 0,95.
- Verificado: `tsc`, 54 tests de Node + 9 de componente, build de producción, Lighthouse local,
  capturas (Programare con "Echipa mea", rotación con propuesta, Echipe con marcador, Tineri con
  filtro, iconos SVG en claro/oscuro, 1240/375).

### Entregado (2026-09-14, octavo bloque) — `v.2.7.0` (separación público / administración)
- **La planificación sale de la app pública**: fuera el bloque "Rândul echipelor" con su propuesta,
  el KPI de equipos a la espera (vuelve "Echipe active"), el aviso "fără părinți" de filas y
  tarjeta y la barra de sugerencias de Părinți. Los participantes ven *qué hay programado*; quién
  decide, dónde decide (regla nueva en `CLAUDE.md`). Se mantienen los estados "fără programare"
  de Echipe/Tineri/Părinți, que sí les afectan.
- **Nuevo módulo `/admin`** (ruta oculta: fuera de `TAB_PATHS`, sin enlaces, sin dock ni banner de
  instalación), con cuatro secciones:
  · **Stare date** — `checkDomainData` (lógica única compartida con el spec de integridad): 23
    comprobaciones, errores en rojo y avisos en ámbar con el detalle de cada caso.
  · **Programări** — rotación con días de espera y turnos por temporada, y **generador de turnos**:
    N programaciones desde una fecha, equipo editable por fila, reparto automático de padres por
    carga y el código listo para `schedule.data.ts`.
  · **Părinți** — programaciones futuras sin padres, sugerencia de los menos solicitados,
    líneas de reemplazo, y la carga real de cada padre.
  · **Persoane** — alta de joven (línea de `youths` + pertenencia), alta de padre (bloque +
    vínculo familiar) y **cierre de composición** de un equipo con su fecha.
- **`data-source.utils.ts`**: generadores puros del formato exacto de los ficheros de datos
  (comillas simples, `new Date(año, mes0, día)`, escape de apóstrofos) con sus tests.
- `ScheduleIndex.proposeSchedule(count, from)` (antes solo la propuesta fija) y
  `parentsByWorkload()` (sustituye a `suggestParents`).
- Verificado: `tsc`, 56 tests de Node + 14 de componente (5 nuevos del panel), build de
  producción, y en el navegador: `/admin` genera 6 turnos correctos desde el 25-09, la app pública
  ya no muestra rotación ni avisos de planificación, y el panel funciona en móvil.

### Entregado (2026-09-14, noveno bloque) — `v.2.8.0` (panel /admin completo)
- **Todo lo que se editaba a mano ya se genera desde el panel**, con cinco secciones y un
  componente por sección (`features/admin/sections/`):
  · **Programări** — la propuesta pasa a ser una lista **editable fila a fila**: fecha (también un
    día que no sea viernes, p. ej. una conferencia), equipo, coordinador (cualquiera de la
    composición, para invitados), personas, observaciones, horas propias y dos padres; añadir
    fila, **quitar fila** y **aplazar desde una** cuando un viernes no hay programa. Cada fila
    avisa de lo que no cuadra (`draft-checks`, 10 comprobaciones: fecha ocupada o repetida, sin
    coordinador, padres duplicados, no es viernes, fecha pasada, coordinador de otro equipo…) y la
    cabecera resume cuántas filas tienen error o aviso. Debajo, **editor de una programación ya
    publicada** (mismos campos → línea de reemplazo, o línea a borrar si se anula).
  · **Părinți** — reparto con el criterio a la vista: cada opción dice **"nombre · Nx · última
    vez"**, con orden configurable (menos solicitados / más tiempo sin ayudar / alfabético),
    filtro "solo las que no tienen padres", reparto automático y solo se genera lo que cambia.
  · **Echipe** — componer la plantilla marcando miembros (con buscador) y coordinador, cerrar la
    composición con su fecha y **mover a alguien de equipo** (líneas a quitar y a añadir).
  · **Persoane** — alta de joven (con teléfono, correo, notas, equipo, rol y **varios padres**),
    **edición y archivo** de un joven (cierra también sus pertenencias), alta de padre **con
    varios hijos de una vez**, edición/archivo de padre y **vincular personas que ya existen**
    (el caso "el joven ya estaba y ahora aparece su madre"), con los hijos ya vinculados
    desactivados.
  · **Stare date** — sin cambios de fondo (23 comprobaciones), ahora en su propio componente.
- **Icono discreto en el pie** (`tune`, opacidad 0.35) que lleva al panel, a petición del propietario.
- Primitivas nuevas: `ui-form-grid`, `ui-field`, `ui-control`, `ui-check`, `ui-code` y el
  componente `app-admin-code` (bloque + copiar). `data-source.utils.ts` ampliado: horas y
  observaciones en las líneas, edición/archivo de joven y padre, bloques de composición.
- Verificado: `tsc`, 67 tests de Node (14 nuevos de generadores y avisos) y 26 de componente
  (17 nuevos: propuesta, aplazar, quitar fila, fecha en otro día, equipo → coordinador, edición de
  una publicada, altas, archivo, vínculos, composición, mover, reparto), build de producción y el
  panel probado en el navegador (quitar fila, jueves con aviso, horas, código regenerado) en 1280 y 390 px.

### Entregado (2026-09-14, décimo bloque) — `v.2.9.0` (generar siempre, publicar solo y repaso de detalle)
- **La estructura se genera en cualquier momento**, aunque falten datos: los formularios ya no se
  quedan en blanco. Lo que falta se lista en pantalla (varios avisos a la vez, no solo el primero)
  y queda escrito dentro del código como `// TODO: …`.
- **Repaso de detalle**: pipe `plural` para que no salga "1 avertismente" ni "acum 1 zile" (claves
  `…_one` en ro y es); las cinco secciones caben sin scroll lateral en 390 px; el texto de la
  cabecera ya no dice que no hay ningún enlace (lo hay, discreto, en el pie); `ui-input__field`
  (buscador) se sustituye por `ui-control` en los 36 campos del panel, que era lo que estiraba las
  fechas y los números a todo el ancho.
- **Composición de equipo compacta**: equipo, coordinador y buscador en una sola fila, y los 60
  jóvenes en una **rejilla responsive** (`ui-choice-grid`, 5 columnas en escritorio, 2 en tablet,
  1 en móvil) con avatar, nombre, badge del equipo actual y estrella del coordinador: la tarjeta
  pasa de ~2.900 px de alto a 870 px. Atajos "Toți / Niciunul" sobre lo que filtra el buscador.
- Verificado: `tsc`, 67 tests de Node y 26 de componente, build de producción, y en el navegador:
  plurales, navegación en móvil, aviso de fecha ocupada, la app pública sin scroll horizontal y sin
  dock ni banner en /admin.

### Entregado (2026-09-14, undécimo bloque) — `v.2.10.0` (sección "Datele" y barra del panel)
- **Nueva sección "Datele"**: las cinco tablas de `core/data` tal y como están (programaciones,
  jóvenes, padres, pertenencias y vínculos), con buscador y contador. Cada registro se abre en una
  fila expandible con **todos sus campos editables** (fechas, horas, textos, números, selects,
  archivado…) y da la **línea exacta de reemplazo**; con "Șterge" da en cambio lo que hay que
  eliminar, **incluidas las filas que dependen de él** (las pertenencias y los vínculos de un
  joven, los `parentSupporters` de un padre), que es justo lo que se olvida al borrar a mano.
- **Barra del panel** en lugar de la tarjeta con segmentado: **una sola línea de 39 px** (las seis
  secciones como pestañas con icono + botón `info` que despliega la explicación, que antes ocupaba
  tres líneas siempre). Va **a sangre**, pegada justo bajo las pestañas de la app y **alineada al
  píxel con ellas** por los dos lados: sin hueco entre ambas barras ni contenido asomando por los
  costados al hacer scroll.
- **La rotación pasa a ser una tabla**: siete frases de 53 px se convierten en filas de 30 px con
  columnas alineadas (equipo · coordinador · última · espera · turnos de la temporada · próxima ·
  **padres de ese turno**), cifras tabulares y una barra tenue proporcional a la espera que hace
  visible el orden. En móvil se ocultan coordinador y temporada.
- **Resumen "Cine ajută și când"** dentro del planificador: una línea por programación (fecha ·
  equipo · padres) mezclando lo publicado con lo que se está preparando (marcado con barra
  primaria), en rejilla densa con scroll propio; los padres que salen más de una vez van en ámbar
  y la cabecera lo resume. Es lo que se mira para repartir sin cargar siempre a los mismos.
- **Reparto justo de los padres** (`parent-fairness.ts`, puro y con 14 tests): el problema no es
  ayudar muchas veces al año, sino que a alguien le toque dos viernes seguidos mientras otros
  llevan meses sin salir. La sugerencia ordena por (1) no quedar a menos de **4 semanas** de otro
  apoyo suyo, (2) menos apoyos en total —contando pasado, futuro y lo que se está preparando—,
  (3) mayor separación y (4) el criterio elegido en el desplegable. Si no hay alternativa,
  propone igualmente y **avisa**: el resumen marca en ámbar a quien ayuda demasiado seguido y la
  cabecera dice cuántos son y con qué separación. Lo usan el generador, "Adaugă o programare",
  "rellenar los que falten" y el reparto automático de la sección Părinți.
- **Consejo en cada hueco de padre** (`adviseSlot`): al lado de cada desplegable, un botón propone
  quién iría mejor **ahí**, contando el historial y el resto de la tanda y descartando a quien ya
  ocupa el otro hueco de esa programación; pulsándolo repetidamente se recorren las alternativas de
  mejor a peor (no hace falta recordar nada entre clic y clic: el orden es el mismo). Si quien está
  puesto vuelve a ayudar **antes de cuatro semanas**, el hueco se marca en ámbar y el botón enseña
  ya el nombre del recambio —un clic lo aplica y el aviso desaparece—; si no hay a quien proponer,
  avisa igualmente con un icono. Está en las filas en preparación y en el editor de una
  programación publicada (ahí, la propia programación no cuenta como carga de sus padres).
- **El aviso y su arreglo, en el mismo sitio**: en el resumen "Cine ajută și când", el nombre en
  ámbar de quien ayuda demasiado seguido **es el botón que lo cambia** (`clashes()` da la fecha
  exacta del apoyo que conviene mover, no solo el nombre). Si esa programación se está preparando,
  se cambia en su fila; si **ya está publicada**, el cambio se anota aparte y abajo aparece un
  desplegable —solo cuando hace falta— con las **líneas que la reemplazan** y un "anula los
  cambios". El editor de abajo parte de ese cambio pendiente, y la programación que esté abierta
  ahí no se repite en el desplegable: nunca hay dos líneas para la misma fecha.
- Solo se avisa de lo que aún se puede arreglar: los choques cuyo segundo apoyo ya pasó no se
  marcan (cambiar el pasado no es una opción).
- **La columna de padres de la rotación** dice ahora de qué fecha habla: `Părinți (următoarea)`.
  Eran los padres de la **próxima** programación —lo que hace falta para planificar—, pero puesta
  al lado de "Ultima" se leía como si fueran los de aquella.
- **Cât a ajutat fiecare părinte** pasa de "última vez · N programados" a la ficha completa en una
  línea: última vez, **días esperando** (el criterio real del reparto), desde cuándo participa,
  sus hijos, y en la derecha la **próxima fecha** que ya tiene y el total de apoyos.
- **La fila añadida a mano ya viene repartida**: con "Repartizează și părinți" activo, "Adaugă o
  programare" asigna los padres que tocan según el criterio elegido y **contando lo ya repartido**
  en esa tanda, así no repite a quien acaba de salir; al activar el reparto o
  cambiar de criterio se rellenan solo las filas vacías, sin tocar lo elegido a mano.
- De paso, `router-outlet { display: none }`: como elemento de un contenedor flex, el marcador del
  router contaba para el `gap` y metía **16 px fantasma** al principio de todas las pestañas.
- **Datos comprimidos**: cada registro de la sección Datele en **una línea de 36 px** (fecha ·
  equipo · coordinador · personas · padres; nombre · equipos · id; padre → hijo · parentesco…),
  en vez de dos líneas por fila.
- El panel pasa a leer los datos por la costura `APP_DATA` (`AdminDataService.raw`) en vez del
  fichero real: enseña exactamente lo que ve la app y se puede probar con el fixture.
- Verificado: `tsc`, 82 tests de Node (orden de padres, reparto justo, consejo por hueco y choques con su fecha) y **35 de componente** (8 nuevos de la sección de datos, del reparto al añadir fila, del aviso en el hueco y del cambio sobre una programación publicada:
  listado y filtro por tabla, edición de campos, borrado con dependencias, activar/cerrar una
  pertenencia, vínculos), build de producción y el panel probado en el navegador.

## 5. Pendiente (no hecho, por decisión o por alcance)

- **A1 — Datos personales en el bundle público** (fecha de nacimiento, teléfono y e-mail de los
  jóvenes, sin uso en la UI): el propietario decidió **no tocarlo** en v2.5.0. Sigue siendo la
  recomendación nº 1 si en algún momento se revisa la privacidad.
- **D1** Instalar Node 22 LTS en la máquina de desarrollo (el workflow ya lo usa).
- **D2** Signal Forms para el buscador (solo si crece el número de formularios).
- **D4** Prueba manual con lector de pantalla (NVDA/TalkBack).
- **D5** Aviso por cambio de programación (Telegram) desde el workflow; requiere un bot y un
  secreto en el repo.
- **U3 Aniversări** (cumpleaños del mes; usa fechas de nacimiento): excluido por el propietario.
- **Errata probable en los datos**: Echipa 1 · 10 mar 2025 cae en lunes (todo lo demás, viernes).
  Aparece como aviso en `/admin` → Stare date.
- **Protección de `/admin`**: es una ruta con un acceso discreto en el pie (la app es estática y no
  hay backend, así que no hay contraseña posible). Si algún día molesta que sea accesible, lo
  razonable es un despliegue aparte.
- **Aplicar los cambios sin copiar y pegar** (idea guardada, no se hará por ahora): el panel podría
  escribir en el repositorio con la API de GitHub y un token personal guardado en el dispositivo.
  Se descartó a propósito: se prefiere que **una persona revise el cambio** antes de publicarlo.

## 6. Auditoría 2 (2026-09-14): qué se podría **añadir** — HECHO en v2.6.0 (todo salvo U3)

Segunda pasada, esta vez buscando funcionalidad nueva que aporte al uso real (coordinador
general que planifica, coordinadores de equipo, jóvenes y padres en el móvil). Impacto A/M/B ·
esfuerzo S/M/L. Nada de esto está hecho.

### Planificación (coordinador general)

| # | Idea | Por qué | Imp. | Esf. |
|---|---|---|---|---|
| P1 | **Propunere de programare**: bloque en la rotación que lista las próximas vineri sin programación y les asigna equipo en el orden de la rotación; botón "Copiază" que genera las líneas listas para pegar en `schedule.data.ts` (con el coordinador de la composición activa). | Hoy se decide a mano y se escribe a mano (fuente de erratas que ahora caza el spec). | A | M |
| P2 | **Fără părinți**: en cada programación futura sin `parentSupporters`, badge ámbar "fără părinți" (rotación, lista y tarjeta), y en Părinți una sugerencia ordenada por menos apoyos y más tiempo sin ayudar (ya existe el contador). | Cierra el ciclo "a quién le toca" también para los padres. | M | S |
| P3 | **Turnuri în sezon**: contador "N turnuri în sezonul 2026–27" en la fila de la rotación (temporada sept–jun). | Equidad visible de un vistazo; septiembre reinicia la cuenta. | M | S |
| P4 | **Vineri check**: aviso (no error) en el spec de integridad cuando una programación no cae en vineri. Hoy hay una: **Echipa 1 · 10 mar 2025 es luni** — probablemente errata. | Las erratas de fecha son las más difíciles de ver en la app. | M | S |

### Para los participantes (móvil)

| # | Idea | Por qué | Imp. | Esf. |
|---|---|---|---|---|
| U1 | **Echipa mea**: el usuario elige su equipo una vez (guardado en el dispositivo, como el tema) y la app le destaca su próximo turno (KPI "Următorul tău turn"), filtra Tineri por su equipo y marca sus programaciones en la lista. | 60 jóvenes abren la app con una sola pregunta: "¿cuándo me toca?". | A | M |
| U2 | **Trimite detaliile**: en cada programación, acción que compone el mensaje (fecha, horas, coordinador, echipa, părinți, observații) y lo abre en la hoja de compartir / WhatsApp para pegarlo en el grupo del equipo. | Es lo que el coordinador escribe a mano cada semana. | A | S |
| U3 | **Aniversări**: "Zile de naștere luna aceasta" (día y mes, sin año) en Tineri. Los datos ya están (decisión del propietario mantenerlos). | Los grupos de jóvenes celebran cumpleaños; hoy el dato no se usa para nada. | M | S |
| U4 | **Imprimă programul**: hoja de estilos de impresión (hoy **no existe**) + acción "Imprimă" en Programare: A4 con las próximas por mes, sin cabecera/dock/footer. | Tablón de anuncios de la iglesia. | M | S |
| U5 | **"Mâine"**: cuando falta 1 día, mostrar "Mâine" en vez de "1 zi" (tarjeta, badges). | Lenguaje natural; coste nulo. | B | S |
| U6 | **Alarmă pentru părinți**: segundo recordatorio en los feeds de padres 2 días antes (compras), además del de 12 h. | El de 12 h llega tarde para comprar. | M | S |
| U7 | **Compartir "această pagină"** en el diálogo de compartir (los enlaces profundos ya existen). | Mandar "mira tu equipo" con un toque. | B | S |

### Plataforma, accesibilidad y calidad

| # | Idea | Por qué | Imp. | Esf. |
|---|---|---|---|---|
| Q1 | **Skip link** "Sari la conținut" y anuncio `aria-live` del cambio de pestaña. | Teclado y lector de pantalla; hoy no hay. | B | S |
| Q2 | **Fuentes propias**: Playfair (1 peso, subconjunto latino) e iconos como sprite SVG. Adiós a Google Fonts: 100 % offline, sin terceros, sin destello. | Privacidad y arranque sin red. | M | L |
| Q3 | **Tests de componente** (vitest + TestBed) para filas expandibles, navegación cruzada y fragmentos. | Lo único no cubierto por tests. | M | L |
| Q4 | **Lighthouse CI** en el workflow con presupuesto (rendimiento ≥ 95, accesibilidad 100). | Evita regresiones silenciosas. | B | M |
| Q5 | **Capturas en el manifest** (`screenshots`) para la ficha de instalación enriquecida en Android. | Instalación más clara para padres. | B | S |
| Q6 | **`isCoordinator` en `youths.data.ts`** no lo lee nadie (el coordinador sale de las composiciones): quitarlo cuando se toque ese fichero. | Dato muerto que invita a confusión. | B | S |

### Recomendación

Bloque v2.6: **P1 + P2 + P4 + U1 + U2 + U4 + U5 + U6 + Q1** (todo S/M, valor directo para quien
planifica y para quien consulta). U3 solo si el propietario lo aprueba (usa fechas de
nacimiento). Q2/Q3/Q4 como bloque técnico aparte.
