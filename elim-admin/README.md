# ELIM Arganda — Programare Tineret

PWA pentru programarea pregătirii mesei la departamentul de tineret al Bisericii ELIM —
Arganda del Rey. Angular 22, fără backend (datele sunt în cod), publicată pe GitHub Pages.

## Funcționalități

- **Programare** — următorul eveniment (echipă, coordonator, ore, tineri, părinți de sprijin),
  toate programările viitoare grupate pe luni, rezumat coordonatori și istoric.
- **Echipe** — echipele active cu membri, programări viitoare și istoric; compozițiile istorice.
- **Tineri** — director cu căutare și filtru; profil cu echipe, programări și părinți.
- **Părinți** — următorul sprijin, programările cu părinți și profilul fiecărui părinte.
- **Reguli** — ghidul pentru pregătirea mesei.
- Calendar: descărcare `.ics` sau **abonare** (feed care se actualizează singur) pentru orice
  programare, echipă, tânăr sau părinte. Română / Español. Mod întunecat automat.
- Instalabilă ca aplicație (PWA) pe telefon; se actualizează automat.

## Dezvoltare locală

Necesită **Node ≥ 22.22** (dacă ai altă versiune: `npx -y -p node@22 -p npm@11 -- npm start`).

```bash
cd elim-admin
npm install
npm start          # http://localhost:4200
npm test           # teste (vitest)
```

## Actualizare date

Toate datele sunt în `elim-admin/src/app/core/data/`: `schedule.data.ts` (programări),
`youths.data.ts` + `memberships.data.ts` (tineri și echipe), `parents.data.ts` (părinți).
Nu se scrie nimic derivabil (nume complet, inițiale, echipe): se calculează automat.
Feed-urile de calendar (`assets/calendars/*.ics`) se generează automat la build din aceste date. Textele (inclusiv regulile) sunt în
`elim-admin/src/assets/i18n/ro.json` și `es.json`. După modificare: crește `APP_VERSION` în
`elim-admin/src/version.ts` și fă push pe `main` — workflow-ul publică automat.

## Publicare

Push pe `main` → `.github/workflows/deploy.yml` construiește și publică pe GitHub Pages
(`--base-href /INEB_ELIM_Administrativ/`) și, dacă există `MIRROR_PAT`, și pe mirror
(`beni-cioarba/ADM-TINERET`).

## Documentație pentru dezvoltare

- `docs/GUIA-ESTILOS.md` — sistemul de design (obligatoriu pentru orice schimbare de interfață).
- `docs/ARQUITECTURA.md` — structura codului și convențiile.
- `docs/PLAN-MAESTRO.md` — deciziile luate și pașii următori.
