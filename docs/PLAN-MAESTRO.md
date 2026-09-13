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

**Utilidades analizadas y descartadas** (no aportan en esta app): QR de compartir (descartado
por el propietario), enlaces a redes sociales (el departamento no tiene canales propios),
formulario de contacto (sin backend; WhatsApp lo cubre), notificaciones push (requieren
servidor; la suscripción al calendario ya avisa), modo presentación (no se proyecta), impresión
dedicada (el CSS de impresión básico ya existe), detección automática de idioma (rumano por
defecto es deliberado).

## 5. Siguientes pasos recomendados (no hechos)

1. **Instalar Node 22 LTS** en la máquina de desarrollo para no depender del prefijo
   `npx -p node@22` (el workflow ya usa Node 22).
2. **Signal Forms** (Angular 22) para el buscador de Tineri en vez de `ngModel`: hoy funciona;
   solo tiene sentido si crece el número de formularios.
3. **Lector de pantalla**: prueba manual con NVDA/TalkBack de las filas expandibles (los nombres
   salen del contenido; el panel de vista previa no los expone, pero es su limitación).
4. **Feeds**: si se quieren notificaciones por cambio de programación, el mismo `ScheduleIndex`
   puede alimentar un aviso (p. ej. Telegram) desde el workflow al detectar cambios en los datos.
