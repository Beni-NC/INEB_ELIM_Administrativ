import type { YouthTeamMembership } from '../models';

/* ===================== TABEL INTERMEDIAR TÂNĂR ↔ ECHIPĂ ===================== */

/** Helper pentru a crea apartenențe rapid. */
function membership(youthId: string, teamName: string, role: 'coordonator' | 'membru' = 'membru', active = true, endDate?: Date): YouthTeamMembership {
  return { youthId, teamName, role, active, endDate };
}

export const YOUTH_TEAM_MEMBERSHIPS: YouthTeamMembership[] = [
  // ---- Echipa 1 (activă) ----
  membership('y-pintilei-david',    'Echipa 1'),
  membership('y-halas-timotei',     'Echipa 1'),
  membership('y-mitoseriu-kevin',   'Echipa 1'),
  membership('y-birle-filip',       'Echipa 1'),
  membership('y-toth-sara',         'Echipa 1'),
  membership('y-muresan-naomi',     'Echipa 1'),
  membership('y-halas-luigi',       'Echipa 1', 'coordonator'),

  // ---- Echipa 2 (activă) ----
  membership('y-birle-tania',       'Echipa 2'),
  membership('y-halas-noemi',       'Echipa 2'),
  membership('y-dobre-irene',       'Echipa 2'),
  membership('y-mitoseriu-miriam',  'Echipa 2'),
  membership('y-zagrean-jesica',    'Echipa 2'),
  membership('y-halas-damaris',     'Echipa 2'),
  membership('y-marcu-nereea',      'Echipa 2'),
  membership('y-dobre-david',       'Echipa 2', 'coordonator'),

  // ---- Echipa 3 (activă) ----
  membership('y-les-fineas',        'Echipa 3'),
  membership('y-copran-david',      'Echipa 3'),
  membership('y-dulca-daniel',      'Echipa 3'),
  membership('y-dulca-david',       'Echipa 3'),
  membership('y-apalaghiei-samuel', 'Echipa 3'),
  membership('y-apalaghiei-sara',   'Echipa 3'),
  membership('y-gherasim-sara',     'Echipa 3'),
  membership('y-istratoaie-ruben',  'Echipa 3'),
  membership('y-istratoaie-dina',   'Echipa 3', 'coordonator'),


  // ---- Echipa 4 (activă, coordonator nou Mic Karina / Tania Birle) ----
  membership('y-barba-levi',        'Echipa 4'),
  membership('y-barba-rebeca',      'Echipa 4'),
  membership('y-biris-sara',        'Echipa 4'),
  membership('y-biris-david',       'Echipa 4'),
  membership('y-jescu-marco',       'Echipa 4'),
  membership('y-albu-gabriel',      'Echipa 4'),
  membership('y-copran-matias',     'Echipa 4'),
  membership('y-tot-aaron',         'Echipa 4'),
  membership('y-filimon-sara',      'Echipa 4'),
  membership('y-negrusier-rut',     'Echipa 4'),
  membership('y-mic-karina',        'Echipa 4', 'coordonator'),
  

  // ---- Echipa 5 (activă) ----
  membership('y-valean-noelia',     'Echipa 5'),
  membership('y-valean-vlad',       'Echipa 5'),
  membership('y-valean-naomi',      'Echipa 5'),
  membership('y-dragan-abel',       'Echipa 5'),
  membership('y-baleanu-samuel',    'Echipa 5'),
  membership('y-muresan-denisa',    'Echipa 5'),
  membership('y-toader-carla',      'Echipa 5'),
  membership('y-toader-ainhoa',     'Echipa 5'),
  membership('y-toader-irene',      'Echipa 5'),
  membership('y-toader-noemi',      'Echipa 5', 'coordonator'),

  // ---- Echipa 6 (activă, coordonator nou Halas Noemi) ----
  membership('y-blejusca-david',    'Echipa 6'),
  membership('y-rus-miriam',        'Echipa 6'),
  membership('y-romosan-david',     'Echipa 6'),
  membership('y-romosan-iosif',     'Echipa 6'),
  membership('y-bosancu-amalia',    'Echipa 6'),
  membership('y-istratoaie-rebeca', 'Echipa 6'),
  membership('y-istratoaie-david',  'Echipa 6'),
  membership('y-halas-noemi',       'Echipa 6', 'coordonator'),

  // ---- Echipa 7 (activă) ----
  membership('y-filimon-natanael',  'Echipa 7'),
  membership('y-suciu-sara',        'Echipa 7'),
  membership('y-stulianec-sara',    'Echipa 7'),
  membership('y-stulianec-david',   'Echipa 7'),
  membership('y-pop-naomi',         'Echipa 7'),
  membership('y-mihalca-darius',    'Echipa 7'),
  membership('y-bereza-eduard',     'Echipa 7'),
  membership('y-bereza-ionatan',    'Echipa 7', 'coordonator'),

  // ---- ISTORIC ----
  membership('y-biris-sara',        'Echipa 4', 'membru',     false, new Date(2026, 1, 27)),
  membership('y-biris-david',       'Echipa 4', 'membru',     false, new Date(2026, 1, 27)),
  membership('y-jescu-marco',       'Echipa 4', 'membru',     false, new Date(2026, 1, 27)),
  membership('y-albu-gabriel',      'Echipa 4', 'membru',     false, new Date(2026, 1, 27)),
  membership('y-ivascu-simona',     'Echipa 4', 'coordonator',false, new Date(2026, 1, 27)),

  membership('y-blejusca-david',    'Echipa 6', 'membru',     false, new Date(2026, 1, 27)),
  membership('y-rus-miriam',        'Echipa 6', 'membru',     false, new Date(2026, 1, 27)),
  membership('y-romosan-david',     'Echipa 6', 'membru',     false, new Date(2026, 1, 27)),
  membership('y-romosan-iosif',     'Echipa 6', 'membru',     false, new Date(2026, 1, 27)),
  membership('y-istratoaie-rebeca', 'Echipa 6', 'membru',     false, new Date(2026, 1, 27)),
  membership('y-istratoaie-david',  'Echipa 6', 'membru',     false, new Date(2026, 1, 27)),
  membership('y-bosancu-amalia',    'Echipa 6', 'coordonator',false, new Date(2026, 1, 27)),

  membership('y-les-fineas',    'Echipa 3', 'membru',     false, new Date(2026, 3, 17)),
  membership('y-copran-david',        'Echipa 3', 'membru',     false, new Date(2026, 3, 17)),
  membership('y-dulca-daniel',     'Echipa 3', 'membru',     false, new Date(2026, 3, 17)),
  membership('y-dulca-david',        'Echipa 3', 'membru',     false, new Date(2026, 3, 17)),
  membership('y-gherasim-sara',  'Echipa 3', 'membru',     false, new Date(2026, 3, 17)),
  membership('y-istratoaie-dina',  'Echipa 3', 'membru',     false, new Date(2026, 3, 17)),
  membership('y-istratoaie-ruben',    'Echipa 3', 'coordonator', false, new Date(2026, 3, 17)),

  // ---- Foști membri (arhivați) — apartenențe istorice care au generat istoric de programări ----
  /* 
  membership('y-arhiva-andrei',     'Echipa 1', 'membru', false, new Date(2025, 5, 30)),
  membership('y-arhiva-elena',      'Echipa 5', 'membru', false, new Date(2025, 11, 15)),
  membership('y-arhiva-mihai',      'Echipa 7', 'membru', false, new Date(2024, 8, 1)), 
  */
];
