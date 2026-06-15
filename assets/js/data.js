// ETR — moteur de données fictives (déterministe).
// Toutes les données sont 100 % inventées. Aucun lien avec un patient ou un
// praticien réel. Cabinet, correspondants, association : fictifs.

/* ---------- RNG déterministe (mulberry32) ---------- */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20260615);
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const between = (a, b) => a + rnd() * (b - a);
const intBetween = (a, b) => Math.floor(between(a, b + 1));
const chance = (p) => rnd() < p;
const id = (() => { let n = 1; return (p) => `${p}-${String(n++).padStart(4, '0')}`; })();

/* ---------- Référentiels ---------- */
const VILLES = [
  'Nancy', 'Metz', 'Pont-à-Mousson', 'Toul', 'Lunéville', 'Thionville',
  'Épinal', 'Sarreguemines', 'Verdun', 'Saint-Dié-des-Vosges', 'Forbach',
  'Vandœuvre-lès-Nancy', 'Maxéville', 'Laxou', 'Briey', 'Dombasle',
  'Saint-Avold', 'Hayange', 'Bar-le-Duc', 'Lunéville', 'Commercy', 'Neuves-Maisons',
];
const PRENOMS = [
  'Antoine', 'Camille', 'Julien', 'Sophie', 'Mathieu', 'Claire', 'Nicolas',
  'Élodie', 'Vincent', 'Hélène', 'Florian', 'Marine', 'Damien', 'Aurélie',
  'Sébastien', 'Laure', 'Guillaume', 'Pauline', 'Romain', 'Charlotte',
  'Benoît', 'Sandrine', 'Olivier', 'Émilie', 'Cédric', 'Nadia', 'Thomas',
  'Mélanie', 'Pierre', 'Audrey', 'Maxime', 'Lucie', 'Hugo', 'Margaux',
];
const NOMS = [
  'Lefèvre', 'Marchal', 'Henry', 'Klein', 'Schmitt', 'Weber', 'Muller',
  'Perrin', 'Colin', 'Maréchal', 'Thiébault', 'Gérard', 'Aubry', 'Noël',
  'Antoine', 'Georges', 'Lemoine', 'Hubert', 'Renard', 'Masson', 'Brun',
  'Dumont', 'Rolland', 'Vincent', 'Bertrand', 'Adam', 'François', 'Simon',
  'Petit', 'Royer', 'Humbert', 'Claudon', 'Mougel', 'Villaume', 'Parmentier',
];

// Actes : libellé, code, prix (€), poids "complexité" (pour gros cas)
const ACTES = [
  { code: 'CS',  label: 'Consultation implantaire',        prix: 80,    cplx: 0 },
  { code: 'CB',  label: 'Cone beam / imagerie 3D',         prix: 120,   cplx: 0 },
  { code: 'EXT', label: 'Extraction chirurgicale',         prix: 220,   cplx: 1 },
  { code: 'ROG', label: 'Régénération osseuse guidée',     prix: 950,   cplx: 2 },
  { code: 'SIN', label: 'Élévation sinusienne (sinus lift)', prix: 1350, cplx: 3 },
  { code: 'IMP', label: 'Pose implant unitaire',           prix: 1250,  cplx: 1 },
  { code: 'IM2', label: 'Pose 2-3 implants',               prix: 3200,  cplx: 2 },
  { code: 'PMC', label: 'Pilier + mise en charge',         prix: 480,   cplx: 1 },
  { code: 'GG',  label: 'Greffe gingivale esthétique',     prix: 620,   cplx: 1 },
  { code: 'AO4', label: 'Réhabilitation complète (All-on-4)', prix: 11500, cplx: 5 },
  { code: 'AO6', label: 'Réhabilitation complète (All-on-6)', prix: 16500, cplx: 6 },
];
const actByCode = Object.fromEntries(ACTES.map((a) => [a.code, a]));

// Marques d'implants pour la fiche de traçabilité
const IMPLANTS = [
  { marque: 'Straumann', gamme: 'BLX',        ref: 'SLA-Roxolid' },
  { marque: 'Straumann', gamme: 'BLT',        ref: 'SLActive' },
  { marque: 'Nobel Biocare', gamme: 'NobelActive', ref: 'TiUltra' },
  { marque: 'Anthogyr', gamme: 'Axiom BL',    ref: 'BCP' },
  { marque: 'Biotech Dental', gamme: 'Kontact S', ref: 'Surf. SLA' },
  { marque: 'Dentsply Sirona', gamme: 'Astra EV', ref: 'OsseoSpeed' },
];
const DIAMS = ['Ø3.3', 'Ø3.75', 'Ø4.1', 'Ø4.3', 'Ø4.8', 'Ø5.0'];
const LONGS = ['8 mm', '10 mm', '11.5 mm', '12 mm', '13 mm'];

// Les 8 phases du parcours (organigramme « temps réel »)
const PHASES = [
  { key: 'consult',  label: 'Consultation & bilan',     short: 'Bilan' },
  { key: 'plan',     label: 'Plan de traitement validé', short: 'Plan' },
  { key: 'chirurgie',label: 'Chirurgie / extractions',  short: 'Chirurgie' },
  { key: 'greffe',   label: 'Greffe osseuse',           short: 'Greffe' },
  { key: 'pose',     label: 'Pose des implants',        short: 'Pose' },
  { key: 'cicat',    label: 'Ostéo-intégration',        short: 'Cicatrisation' },
  { key: 'charge',   label: 'Mise en charge / pilier',  short: 'Mise en charge' },
  { key: 'retour',   label: 'Retour prescripteur (prothèse)', short: 'Prothèse' },
];

// Segments comportementaux des correspondants (vocabulaire Dr Claude)
const SEGMENTS = {
  complexe:    { key: 'complexe',    label: 'Gros cas',          desc: 'Adresse surtout des cas complexes (réhabilitations, greffes).', color: '#b4472f' },
  simple:      { key: 'simple',      label: 'Cas simples',       desc: 'Adresse surtout des cas unitaires simples.',                   color: '#2f7d8c' },
  bloque:      { key: 'bloque',      label: 'Envoie quand bloqué', desc: 'Adresse ponctuellement, quand il ne sait pas quoi faire.',  color: '#9a7b1f' },
  precis:      { key: 'precis',      label: 'Demandes précises', desc: 'Demandes ciblées et cadrées sur un acte donné.',              color: '#5a4b9a' },
  regulier:    { key: 'regulier',    label: 'Fidèle régulier',   desc: 'Flux régulier et diversifié, très fidélisé.',                 color: '#2e7d4f' },
};

const STATUTS = {
  adresse:   { key: 'adresse',   label: 'Adressé',        tone: 'neutral' },
  consult:   { key: 'consult',   label: 'En consultation', tone: 'info' },
  traitement:{ key: 'traitement',label: 'En traitement',  tone: 'progress' },
  cicat:     { key: 'cicat',     label: 'Cicatrisation',  tone: 'progress' },
  finalise:  { key: 'finalise',  label: 'Finalisé',       tone: 'success' },
  nontransf: { key: 'nontransf', label: 'Non transformé', tone: 'muted' },
};

/* ---------- Dates ---------- */
const TODAY = new Date('2026-06-15T08:00:00');
function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function iso(d) { return d.toISOString().slice(0, 10); }

/* ---------- Génération des correspondants ---------- */
function makeCorrespondants(n) {
  const used = new Set();
  const list = [];
  const segKeys = ['complexe', 'simple', 'bloque', 'precis', 'regulier'];
  for (let i = 0; i < n; i++) {
    let prenom, nom, full;
    do { prenom = pick(PRENOMS); nom = pick(NOMS); full = `${prenom} ${nom}`; } while (used.has(full));
    used.add(full);
    // distribution des segments un peu réaliste
    const r = rnd();
    const segment =
      r < 0.30 ? 'simple' :
      r < 0.50 ? 'regulier' :
      r < 0.68 ? 'bloque' :
      r < 0.86 ? 'complexe' : 'precis';
    const ville = pick(VILLES);
    list.push({
      id: id('COR'),
      prenom, nom,
      label: `Dr ${prenom} ${nom}`,
      ville,
      cabinet: `Cabinet dentaire ${pick(['du Centre', 'des Tilleuls', 'Saint-Georges', 'de la Gare', 'Pasteur', 'du Parc', 'Jeanne d’Arc', 'de la Cathédrale'])}`,
      email: `${prenom.toLowerCase().replace(/[éè]/g, 'e')}.${nom.toLowerCase().replace(/[éèà’ ]/g, '')}@dentiste-demo.fr`,
      tel: `03 ${intBetween(80, 89)} ${intBetween(10, 99)} ${intBetween(10, 99)} ${intBetween(10, 99)}`,
      code: `${nom.slice(0, 3).toUpperCase()}-${intBetween(1000, 9999)}`,
      segment,
      depuis: 2018 + intBetween(0, 7),
      adherent: chance(0.55), // adhérent au Cercle Implantaire (formation)
    });
  }
  return list;
}

/* ---------- Génération du plan de traitement d'un patient ---------- */
function planForComplexity(level) {
  // level: 0 (simple) .. 3 (très complexe)
  const acts = ['CS', 'CB'];
  if (level === 0) { acts.push('IMP', 'PMC'); return acts; }
  if (level === 1) { acts.push('EXT', 'IMP', 'PMC'); if (chance(0.4)) acts.push('GG'); return acts; }
  if (level === 2) { acts.push('EXT', 'ROG', 'IM2', 'PMC'); if (chance(0.5)) acts.push('SIN'); return acts; }
  // level 3 : gros cas
  acts.push('EXT', 'SIN', 'ROG', chance(0.5) ? 'AO6' : 'AO4', 'PMC');
  return acts;
}

function phasePlanFromActs(actCodes) {
  const set = new Set();
  set.add('consult'); set.add('plan');
  if (actCodes.includes('EXT')) set.add('chirurgie');
  if (actCodes.includes('ROG') || actCodes.includes('SIN')) set.add('greffe');
  set.add('pose'); set.add('cicat'); set.add('charge'); set.add('retour');
  // ordonner selon PHASES
  return PHASES.filter((p) => set.has(p.key)).map((p) => p.key);
}

function makeMateriels(actCodes) {
  const out = [];
  const nb = actCodes.includes('AO6') ? 6 : actCodes.includes('AO4') ? 4 : actCodes.includes('IM2') ? intBetween(2, 3) : actCodes.includes('IMP') ? 1 : 0;
  for (let i = 0; i < nb; i++) {
    const im = pick(IMPLANTS);
    out.push({
      pos: `${pick(['11', '12', '13', '14', '16', '21', '24', '26', '36', '37', '44', '46'])}`,
      marque: im.marque, gamme: im.gamme,
      dim: `${pick(DIAMS)} × ${pick(LONGS)}`,
      lot: `LOT-${intBetween(100000, 999999)}`,
      ref: im.ref,
    });
  }
  return out;
}

/* ---------- Génération des patients ---------- */
function makePatients(correspondants) {
  const list = [];
  const nb = 218;
  for (let i = 0; i < nb; i++) {
    // probabilité pondérée vers les correspondants "réguliers/complexes"
    let cor = pick(correspondants);
    if (chance(0.45)) {
      const heavy = correspondants.filter((c) => c.segment === 'regulier' || c.segment === 'complexe');
      cor = pick(heavy.length ? heavy : correspondants);
    }
    // complexité selon segment du correspondant
    let level;
    const s = cor.segment;
    if (s === 'complexe') level = chance(0.6) ? 3 : 2;
    else if (s === 'simple') level = chance(0.7) ? 0 : 1;
    else if (s === 'precis') level = pick([1, 1, 2]);
    else if (s === 'bloque') level = pick([0, 1, 2, 3]);
    else level = pick([0, 1, 1, 2, 2, 3]); // regulier : diversifié

    const actCodes = planForComplexity(level);
    const phases = phasePlanFromActs(actCodes);

    // date d'adressage : étalée sur ~30 mois, plus dense récemment
    const ageDays = Math.floor(Math.pow(rnd(), 1.7) * 900); // biais récent
    const addressed = addDays(TODAY, -ageDays);

    // avancement : plus c'est ancien, plus c'est avancé
    let progress = Math.min(1, (ageDays / 240) + between(-0.1, 0.15));
    progress = Math.max(0, progress);
    let currentPhaseIdx = Math.min(phases.length - 1, Math.floor(progress * phases.length));

    // statut
    let statut, transforme = true, nextRdv = null, finishedAt = null;
    if (chance(0.12) && ageDays > 20) { statut = 'nontransf'; transforme = false; currentPhaseIdx = 0; }
    else if (currentPhaseIdx >= phases.length - 1 && progress > 0.96) { statut = 'finalise'; finishedAt = addDays(addressed, intBetween(120, 240)); }
    else if (phases[currentPhaseIdx] === 'cicat') statut = 'cicat';
    else if (currentPhaseIdx === 0) statut = chance(0.5) ? 'adresse' : 'consult';
    else statut = 'traitement';

    if (statut !== 'finalise' && statut !== 'nontransf') {
      nextRdv = addDays(TODAY, intBetween(1, 45));
    }

    // construire l'historique de séances (phases franchies)
    const seances = [];
    let cursor = new Date(addressed);
    for (let p = 0; p <= currentPhaseIdx && p < phases.length; p++) {
      const pk = phases[p];
      const done = p < currentPhaseIdx || statut === 'finalise';
      cursor = addDays(cursor, intBetween(12, 38));
      seances.push({
        phase: pk,
        date: iso(cursor),
        done,
        note: pk === 'pose' ? 'Pose implantaire sous anesthésie locale, suites simples.'
            : pk === 'greffe' ? 'Comblement osseux, membrane résorbable posée.'
            : pk === 'chirurgie' ? 'Avulsion(s) réalisée(s), cicatrisation surveillée.'
            : pk === 'consult' ? 'Bilan clinique + cone beam, plan présenté.'
            : '',
      });
    }

    // valeur du dossier (CA) = somme des actes réalisés (proportion d'avancement)
    const actObjs = actCodes.map((c) => actByCode[c]);
    const totalPlan = actObjs.reduce((s, a) => s + a.prix, 0);
    const realiseRatio = statut === 'finalise' ? 1 : statut === 'nontransf' ? 0.04 : Math.min(1, (currentPhaseIdx + 1) / phases.length);
    const ca = Math.round((totalPlan * realiseRatio) / 10) * 10;

    const prenom = pick(PRENOMS);
    const nom = pick(NOMS);
    list.push({
      id: id('PAT'),
      ref: `PAT-${addressed.getFullYear()}-${String(1000 + i).slice(1)}`,
      prenom, nom,
      naissance: `19${intBetween(45, 99)}`,
      correspondantId: cor.id,
      adresseLe: iso(addressed),
      statut,
      transforme,
      complexite: level,
      actes: actCodes,
      phases,
      phaseActuelle: phases[currentPhaseIdx],
      phaseIdx: currentPhaseIdx,
      seances,
      prochainRdv: nextRdv ? iso(nextRdv) : null,
      finaliseLe: finishedAt ? iso(finishedAt) : null,
      ca,
      caPlan: totalPlan,
      materiels: ['pose', 'cicat', 'charge', 'retour'].includes(phases[currentPhaseIdx]) || statut === 'finalise' ? makeMateriels(actCodes) : [],
      maj: iso(addDays(TODAY, -intBetween(0, 9))),
    });
  }
  return list;
}

/* ---------- Praticiens du cabinet (fictifs) ---------- */
const PRATICIENS_CABINET = [
  { id: 'DR1', label: 'Dr Julien Aubert', role: 'Implantologie & chirurgie orale', titulaire: true },
  { id: 'DR2', label: 'Dr Camille Roy',   role: 'Chirurgie orale', titulaire: false },
];

export function generateSeed() {
  const correspondants = makeCorrespondants(40);
  const patients = makePatients(correspondants);
  return {
    version: 1,
    generatedFor: 'ETR — démo',
    today: iso(TODAY),
    cabinet: {
      nom: 'Cabinet d’Implantologie & Chirurgie Orale',
      reseau: 'Cercle Implantaire',
      ville: 'Lorraine',
      praticiens: PRATICIENS_CABINET,
    },
    correspondants,
    patients,
  };
}

export const REF = { ACTES, actByCode, PHASES, SEGMENTS, STATUTS, IMPLANTS, PRATICIENS_CABINET };
