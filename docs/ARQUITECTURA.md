# Arquitectura — ELIM Admin (`elim-admin`)

> Cómo está organizado el código y qué convenciones se siguen al ampliarlo. La parte visual
> está en [GUIA-ESTILOS.md](GUIA-ESTILOS.md); el historial de decisiones en
> [PLAN-MAESTRO.md](PLAN-MAESTRO.md).

## 1. Stack

- **Angular 22** (TypeScript 6) standalone, **zoneless** (`provideZonelessChangeDetection`, sin
  `zone.js`), signals, `@if/@for`, `OnPush` en todos los componentes, `input()` funcional. Sin
  NgModules. Requiere **Node ≥ 22.22** (campo `engines` de `package.json`; el workflow usa Node 22).
  Si la máquina tiene un Node más antiguo: `npx -y -p node@22 -p npm@11 -- npm start`.
- **Sin librería de UI**: CSS propio (tokens + primitivas `ui-*`). Sin Angular Material, CDK ni
  PrimeNG. No reintroducirlas.
- **i18n**: `@ngx-translate/core` 18 (`provideTranslateService` + `provideTranslateHttpLoader` en
  `app.config.ts`; los componentes importan `TranslatePipe`, no existe `TranslateModule`). JSON en
  `src/assets/i18n/{ro,es}.json`, idioma persistido en `localStorage` (`app.lang`). Fechas con
  `Intl.DateTimeFormat` vía pipe `ldate`.
- **Tests**: `vitest` (`npm test`) sobre el dominio puro (`core/domain`, `core/utils`), sin
  navegador ni TestBed. Los componentes se verifican en la app.
- **PWA**: `@angular/service-worker` (`ngsw-config.json`; los feeds `.ics` quedan fuera de la
  caché del SW), **auto-actualización sin preguntar** (`PwaUpdateService`: comprueba al arrancar,
  cada 15 min y al volver a primer plano; recarga en cuanto la versión nueva está lista — decisión
  del usuario: lo publicado debe verse siempre), banner de instalación (`PwaInstallPromptComponent`).
- **Datos estáticos** en TypeScript (`core/data/*.data.ts`, un fichero por tabla): no hay
  backend ni edición en la app; actualizar datos = editar el fichero que toque y desplegar.
- **Feeds de calendario** (`assets/calendars/*.ics`) generados en cada build/deploy por
  `scripts/generate-calendars.mjs` a partir de los mismos datos (no se versionan).
- **Deploy**: GitHub Actions → GitHub Pages (`.github/workflows/deploy.yml`), base-href
  `/INEB_ELIM_Administrativ/` (+ mirror `/ADM-TINERET/`).

## 2. Estructura de carpetas

```
src/
  index.html                 una sola hoja externa (Material Symbols); fuente del sistema
  styles.css                 entrada: importa las 4 capas globales
  styles/
    tokens.css               variables de diseño (única fuente de valores)
    base.css                 reset, tipografía, .icon, foco, utilidades mínimas, print
    layout.css               shell: ui-header, ui-tabs, ui-main, ui-footer
    components.css           primitivas ui-* (catálogo en la guía §6)
  app/
    app.component.ts         shell + swipe entre pestañas
    app.config.ts            providers (router, http, translate, SW, idioma)
    app.routes.ts            rutas lazy por pestaña
    core/
      models.ts              TODAS las interfaces de dominio y tipos de UI
      constants.ts           rutas de tabs, colores de equipo, constantes numéricas
      contact.config.ts      WhatsApp del responsable, web de INEB, `whatsappUrl(texto)`
      data/                  datos crudos (importan modelos; nunca al revés)
        index.ts             DOMAIN_DATA: el objeto que consume ScheduleIndex
        schedule.data.ts     SCHEDULE_DATA
        youths.data.ts       YOUTHS (YouthRecord: sin fullName/initials/tone, se derivan)
        memberships.data.ts  YOUTH_TEAM_MEMBERSHIPS (activas e históricas)
        parents.data.ts      PARENTS (ParentRecord: sin initials/tone), PARENT_YOUTH_LINKS
      domain/
        schedule-index.ts    ScheduleIndex(today, data = DOMAIN_DATA): TODA la lógica de dominio
                             (índices O(1), ventanas de pertenencia, composiciones activas e
                             históricas = `teams` / `teamsHistory`, agregados, derivación de
                             fullName/iniciales/tone de avatar). Sin Angular: app, Node y tests
        schedule-index.spec.ts  tests con un fixture propio (no con los datos reales)
      i18n/
        ldate.pipe.ts        pipe de fechas dependiente del idioma activo
        translate-loader.factory.ts
      services/
        data.service.ts      `extends ScheduleIndex` + signals de búsqueda/filtro de jóvenes
        navigation.service.ts estado "expandido" por entidad + navegación cruzada + scroll/flash
        language.service.ts  idioma activo (signal) + persistencia
        theme.service.ts     tema claro/oscuro MANUAL (signal + localStorage + data-theme)
        pwa-install.service.ts estado de instalación PWA (prompt nativo, iOS, aplazamiento)
        calendar.service.ts  descarga .ics (vía ics.utils) y URL de suscripción a los feeds
        pwa-update.service.ts
      utils/
        date.utils.ts        aritmética de fechas pura (daysBetween, isSameDay, startOfDay…)
        schedule.utils.ts    horas efectivas de una programación, entryKey, hasNotes
        ics.utils.ts         iCalendar RFC 5545 puro (buildIcs, slug) — app y Node (+ .spec.ts)
        calendar-feeds.ts    nombres/URL de los feeds publicados — app y Node
        team.utils.ts        getTeamColor / getTeamNumber
    layout/
      header.component.ts    wordmark, título, fecha, idioma (segmentado), tema (botón)
      tabs-nav.component.ts  tabs con routerLink
      footer.component.*     pie institucional en columnas (implicarse, preguntas, compartir)
      floating-dock.component.ts  dock flotante: compartir, WhatsApp, volver arriba
      pwa-install-prompt.component.ts  banner de instalación (estado en PwaInstallService)
    shared/ui/
      brand-logo/            app-brand-logo: wordmark ELIM (portado de MEDIA-ELIM)
      whatsapp-button/       app-whatsapp-button: enlace wa.me con mensaje preescrito
      share-button/          app-share-button: Web Share API o <dialog> (WhatsApp, Telegram, e-mail, copiar)
      event-row/             app-event-row: fila de programación reutilizable
      next-event-card/       app-next-event-card: tarjeta destacada (próximo evento / apoyo)
      calendar-button/       app-calendar-button: menú descargar .ics / suscribirse (ámbitos: all, event, team, youth, parent)
    features/
      schedule/  teams/  youths/  parents/  rules/
        <x>.component.ts + .html + .css   (CSS encapsulado, solo disposición)
scripts/
  generate-version.mjs       src/version.ts: semver + build (commits) + commit + dirty + fecha
  generate-calendars.mjs     empaqueta con esbuild y ejecuta calendars.entry.ts
  calendars.entry.ts         genera assets/calendars/*.ics (global, por equipo, joven y padre)
  generate-icons.js          iconos PWA desde logo_admin.png
```

Regla de dependencias: `features → shared/ui → core`; `layout → core`. `core` no importa de
`features` ni `shared`. `data/` importa de `models.ts`, nunca al revés. `core/domain` y
`core/utils` **no importan Angular** (se ejecutan también en Node).

## 3. Flujo de datos

1. `core/data` exporta `DOMAIN_DATA` con las colecciones crudas normalizadas: `schedule`,
   `youths`, `memberships`, `parents`, `parentYouthLinks`. En los datos **no se escribe nada
   derivable**: ni `fullName`, ni iniciales, ni equipos, ni el `tone` del avatar (hash estable
   del `id` → 0–7, `toneOf`; así una persona conserva su color en cualquier vista, idioma o
   sesión sin que nadie lo elija a mano). Las reglas (Reguli) son texto y viven solo en los JSON
   de i18n.
2. `ScheduleIndex` (`core/domain`) deriva jóvenes y padres completos, construye las composiciones
   de equipo (activas → `teams`, cerradas → `teamsHistory`, ambas `TeamComposition`), ordena,
   particiona (pasado/futuro respecto a `today`) e indexa todo en `Map`s en el constructor.
   Expone métodos O(1) (`getYouthsForTeam`, `getNextEventForYouth`, `getCompositionForEvent`,
   `getAllEventsForYouth`…). `DataService` lo extiende con `today = hoy` y añade las signals de
   UI (`youthSearch`, `youthFilter`, `filteredYouths`). El generador de calendarios y los tests
   instancian `ScheduleIndex` directamente (los tests con un `DomainData` de fixture).
3. Los componentes de feature **no calculan dominio**: leen de `DataService` y componen
   primitivas. Lo único que guardan es estado de UI local (secciones colapsadas).
4. **Expandido** (qué equipo/joven/padre está abierto) vive en `NavigationService`
   (`expandedTeam`, `expandedYouthId`, `expandedParentId`, `expandedHistoryKey`) para que la
   navegación cruzada (clic en un coordinador desde Programare → se abre su perfil en Tineri)
   funcione también dentro de la misma pestaña. `goTo(target, id)` navega, expande, hace scroll
   al ancla `card-<target>-<id>` y la resalta 1,6 s.

## 4. Convenciones de código

- **Idioma**: identificadores y nombres de clase en inglés; comentarios, docs y commits en
  español; textos de UI solo vía i18n (ro + es).
- Componentes: standalone (es el valor por defecto; no se escribe), `changeDetection: OnPush`,
  `inject()` en campos, sin constructores con lógica (salvo `effect`). Templates > 40 líneas en
  `.html` propio; CSS en `.css` propio (sin SCSS: no hace falta).
- **Zoneless**: nada de `setTimeout`/`Promise` para "forzar" repintados; si algo no se refresca es
  porque el estado no es una signal. `ChangeDetectorRef.markForCheck` solo como último recurso.
- Estado: `signal`/`computed`; nada de `BehaviorSubject` nuevo. `effect` solo para sincronizar
  con el DOM o con `NavigationService`.
- Templates: `@if/@for` con `track` estable (`id`, o `date.getTime() + '|' + team` para
  eventos). Sin `*ngIf`/`*ngFor`. Sin estilos inline (`style="…"`) — se usa una clase.
  Excepción única: `[style.--team-color]` para pasar el color del equipo a una primitiva.
- Accesibilidad: filas expandibles = `<button type="button" aria-expanded aria-controls>`
  apuntando al `id` del `ui-row-detail`; acciones = `<button>`/`<a>` con `aria-label` si solo
  hay icono; `title` nativo para pistas de escritorio.
- Fechas: solo `ldate` en templates y `date.utils.ts` en TS. Prohibidos los arrays de meses.
- Colores de equipo: `getTeamColor(team)` → `[style.--team-color]`. Nunca hex en templates.
- Nada de código muerto: si una función deja de usarse se borra (git guarda la historia).
- Versión: `src/version.ts` es **generado** (`scripts/generate-version.mjs`, en postinstall /
  prestart / prebuild / pretest y en el deploy; está en .gitignore) a partir de `version` de
  `package.json` (semver manual: la única cifra que decide una persona) más git: nº de commits
  (build), hash corto, marca `dirty` y fecha. Para cambiar la versión visible: `package.json`.

### 4.1 Notas de template (heredadas de Angular 17, siguen siendo buena práctica)

- Las expresiones de `track` y los alias `@if (…; as x)` anidados en `ng-template` dieron
  problemas en 17.x (`tmp_x_0 is not defined`). Aunque Angular 22 lo tolera y ofrece `@let`, se
  mantiene el criterio: lo derivado se calcula en TS (`activeTeams(y)`, `historyTrack(h)`) y el
  template solo lee. Un template no calcula.
- `*ngTemplateOutlet` exige importar `NgTemplateOutlet` en el componente.

## 5. Cómo añadir cosas

**Una nueva pestaña**: (1) ruta en `TAB_PATHS` + `app.routes.ts` + `tabOrder` de
`AppComponent` + `tabs` de `TabsNavComponent` (icono del vocabulario de la guía §4);
(2) componente en `features/<nombre>/` con `.html` y `.css`; (3) claves i18n en **ambos** JSON;
(4) usar `ui-section` + `ui-card` + `ui-list`/`ui-row` — sin CSS nuevo salvo disposición.

**Una nueva primitiva visual**: solo si ninguna de la guía §6 sirve. Añadirla a
`components.css` con prefijo `ui-`, documentarla en la guía (tabla §6) y usarla en ≥ 2 sitios.

**Un nuevo dato de dominio**: interfaz en `models.ts` → datos en `core/data/<tabla>.data.ts`
(y en `DomainData` si es una colección nueva) → índice o método en `ScheduleIndex` **con su test**
en `schedule-index.spec.ts` → uso en la feature. Mostrarlo solo si puede no estar vacío
(condicional). Si es derivable de otro dato, no se escribe: se deriva en el índice.

**Calendario**: los feeds se regeneran solos (`prestart`/`prebuild` y paso del workflow). Si se
añade un tipo de feed: nombre en `calendar-feeds.ts`, generación en `scripts/calendars.entry.ts`
y ámbito (`CalendarScope`) en `CalendarService`.

**Contacto / textos de WhatsApp**: número y enlaces en `core/contact.config.ts`; los mensajes
preescritos son claves i18n (`contact.*_message`) para que salgan en el idioma del usuario.

**Tema**: solo `ThemeService.toggle()/set()`. No leer `prefers-color-scheme` en ningún sitio.

## 6. Comandos

```bash
cd elim-admin                # Node ≥ 22.22 (o anteponer: npx -y -p node@22 -p npm@11 --)
npm install
npm start                    # genera feeds + http://localhost:4200
npm run build                # genera feeds + build de producción
npm test                     # vitest: dominio puro (22 tests, < 2 s)
npm run generate             # version.ts + feeds .ics (ambos generados, no versionados)
npx tsc -p tsconfig.app.json --noEmit   # comprobación estricta rápida
```

Nota: el workflow llama a `npx ng build` directamente, por eso ejecuta antes `npm run generate`
como paso propio (con `fetch-depth: 0` para que el recuento de commits sea real). La verificación mínima antes de entregar es: `npm test` verde, build de
producción sin avisos, Programare / Tineri en 375 px y 1280 px, RO↔ES.

Verificación mínima antes de entregar: build de producción sin warnings de budget, revisar
Programare / Tineri en 375 px y 1280 px, cambiar idioma RO↔ES y comprobar fechas.
