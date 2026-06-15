// ETR — store : état applicatif, persistance localStorage, CRUD, KPIs, insights.
import { generateSeed, REF } from './data.js';

const KEY = 'etr-demo-state-v2';
const listeners = new Set();
let state = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* ignore */ }
  const seed = generateSeed();
  persist(seed);
  return seed;
}
function persist(s) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* quota */ }
}
function commit() { persist(state); listeners.forEach((fn) => fn(state)); }

export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
export function getState() { return state; }
export function resetDemo() { localStorage.removeItem(KEY); state = generateSeed(); persist(state); listeners.forEach((fn) => fn(state)); }

/* ---------- Accès ---------- */
export const today = () => new Date(state.today + 'T08:00:00');
export const correspondants = () => state.correspondants;
export const patients = () => state.patients;
export const getCorrespondant = (cid) => state.correspondants.find((c) => c.id === cid);
export const getPatient = (pid) => state.patients.find((p) => p.id === pid);
export const patientsOf = (cid) => state.patients.filter((p) => p.correspondantId === cid);

let seq = 1000;
const newId = (p) => `${p}-N${seq++}`;

/* ---------- CRUD patients ---------- */
export function addPatient(data) {
  const acts = data.actes && data.actes.length ? data.actes : ['CS', 'CB', 'IMP', 'PMC'];
  const phases = phasePlan(acts);
  const caPlan = acts.reduce((s, c) => s + (REF.actByCode[c]?.prix || 0), 0);
  const p = {
    id: newId('PAT'),
    ref: `PAT-${state.today.slice(0, 4)}-N${seq}`,
    prenom: data.prenom || 'Nouveau',
    nom: data.nom || 'Patient',
    naissance: data.naissance || '1980',
    correspondantId: data.correspondantId,
    adresseLe: data.adresseLe || state.today,
    statut: 'adresse',
    transforme: true,
    complexite: data.complexite ?? 1,
    actes: acts,
    phases,
    phaseActuelle: phases[0],
    phaseIdx: 0,
    seances: [{ phase: phases[0], date: state.today, done: false, note: data.note || 'Patient adressé, à programmer.' }],
    prochainRdv: data.prochainRdv || null,
    finaliseLe: null,
    ca: 0,
    caPlan,
    materiels: [],
    maj: state.today,
    _new: true,
  };
  state.patients = [p, ...state.patients];
  commit();
  return p;
}
export function updatePatient(pid, patch) {
  const p = getPatient(pid); if (!p) return;
  Object.assign(p, patch, { maj: state.today });
  if (patch.actes) { p.phases = phasePlan(patch.actes); p.caPlan = patch.actes.reduce((s, c) => s + (REF.actByCode[c]?.prix || 0), 0); }
  commit();
}
export function deletePatient(pid) {
  state.patients = state.patients.filter((p) => p.id !== pid);
  commit();
}
export function advancePhase(pid) {
  const p = getPatient(pid); if (!p) return;
  if (p.statut === 'nontransf' || p.statut === 'finalise') return;
  if (p.phaseIdx < p.phases.length - 1) {
    // clôt la séance courante
    const cur = p.seances.find((s) => s.phase === p.phases[p.phaseIdx]);
    if (cur) cur.done = true;
    p.phaseIdx += 1;
    p.phaseActuelle = p.phases[p.phaseIdx];
    p.seances.push({ phase: p.phaseActuelle, date: state.today, done: false, note: 'Séance programmée.' });
    p.statut = p.phaseActuelle === 'cicat' ? 'cicat' : 'traitement';
    if (['pose', 'cicat', 'charge', 'retour'].includes(p.phaseActuelle) && p.materiels.length === 0) {
      p.materiels = makeMateriels(p.actes);
    }
    p.ca = Math.round((p.caPlan * (p.phaseIdx + 1) / p.phases.length) / 10) * 10;
  } else {
    p.statut = 'finalise';
    p.finaliseLe = state.today;
    p.prochainRdv = null;
    p.ca = p.caPlan;
    const cur = p.seances.find((s) => s.phase === p.phases[p.phaseIdx]);
    if (cur) cur.done = true;
  }
  p.maj = state.today;
  commit();
}
export function setRdv(pid, dateStr) { const p = getPatient(pid); if (p) { p.prochainRdv = dateStr || null; p.maj = state.today; commit(); } }

/* ---------- CRUD correspondants ---------- */
export function addCorrespondant(data) {
  const c = {
    id: newId('COR'),
    prenom: data.prenom || '', nom: data.nom || '',
    label: `Dr ${data.prenom || ''} ${data.nom || ''}`.trim(),
    ville: data.ville || 'Nancy',
    cabinet: data.cabinet || 'Cabinet dentaire',
    email: data.email || '', tel: data.tel || '',
    code: `${(data.nom || 'COR').slice(0, 3).toUpperCase()}-${1000 + Math.floor(Math.random() * 8999)}`,
    segment: data.segment || 'simple',
    depuis: Number(state.today.slice(0, 4)),
    adherent: !!data.adherent,
    _new: true,
  };
  state.correspondants = [c, ...state.correspondants];
  commit();
  return c;
}
export function updateCorrespondant(cid, patch) {
  const c = getCorrespondant(cid); if (!c) return;
  Object.assign(c, patch);
  c.label = `Dr ${c.prenom} ${c.nom}`.trim();
  commit();
}
export function deleteCorrespondant(cid) {
  state.correspondants = state.correspondants.filter((c) => c.id !== cid);
  state.patients = state.patients.filter((p) => p.correspondantId !== cid);
  commit();
}

/* ---------- Helpers parcours ---------- */
function phasePlan(actCodes) {
  const set = new Set(['consult', 'plan']);
  if (actCodes.includes('EXT')) set.add('chirurgie');
  if (actCodes.includes('ROG') || actCodes.includes('SIN')) set.add('greffe');
  set.add('pose'); set.add('cicat'); set.add('charge'); set.add('retour');
  return REF.PHASES.filter((p) => set.has(p.key)).map((p) => p.key);
}
function makeMateriels(actCodes) {
  const brands = REF.IMPLANTS;
  const nb = actCodes.includes('AO6') ? 6 : actCodes.includes('AO4') ? 4 : actCodes.includes('IM2') ? 2 : actCodes.includes('IMP') ? 1 : 0;
  const out = [];
  for (let i = 0; i < nb; i++) {
    const im = brands[Math.floor(Math.random() * brands.length)];
    out.push({ pos: ['11', '14', '16', '21', '24', '36', '46'][Math.floor(Math.random() * 7)], marque: im.marque, gamme: im.gamme, dim: 'Ø4.1 × 10 mm', lot: `LOT-${100000 + Math.floor(Math.random() * 899999)}`, ref: im.ref });
  }
  return out;
}

/* ---------- KPIs correspondant ---------- */
export function statsCorrespondant(cid) {
  const ps = patientsOf(cid);
  const transformes = ps.filter((p) => p.transforme && p.statut !== 'nontransf');
  const ca = ps.reduce((s, p) => s + p.ca, 0);
  const grosCas = ps.filter((p) => p.complexite >= 3).length;
  const caParActe = {};
  ps.forEach((p) => p.actes.forEach((code) => {
    const a = REF.actByCode[code]; if (!a) return;
    const share = a.prix * (p.ca / (p.caPlan || 1));
    caParActe[code] = (caParActe[code] || 0) + share;
  }));
  const dates = ps.map((p) => p.adresseLe).sort();
  return {
    adresses: ps.length,
    transformes: transformes.length,
    tauxTransfo: ps.length ? transformes.length / ps.length : 0,
    ca,
    panierMoyen: transformes.length ? ca / transformes.length : 0,
    grosCas,
    enCours: ps.filter((p) => ['adresse', 'consult', 'traitement', 'cicat'].includes(p.statut)).length,
    caParActe,
    derniereActivite: dates.length ? dates[dates.length - 1] : null,
  };
}

/* ---------- KPIs globaux (cockpit) ---------- */
export function globalKPIs() {
  const ps = state.patients;
  const transformes = ps.filter((p) => p.transforme && p.statut !== 'nontransf');
  const ca = ps.reduce((s, p) => s + p.ca, 0);
  const enCours = ps.filter((p) => ['adresse', 'consult', 'traitement', 'cicat'].includes(p.statut));
  // CA par mois (12 derniers mois) basé sur date d'adressage
  const months = [];
  const now = today();
  for (let i = 11; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); months.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: d.toLocaleDateString('fr-FR', { month: 'short' }), ca: 0, nb: 0 }); }
  const mMap = Object.fromEntries(months.map((m) => [m.key, m]));
  ps.forEach((p) => { const k = p.adresseLe.slice(0, 7); if (mMap[k]) { mMap[k].ca += p.ca; mMap[k].nb += 1; } });
  // CA par acte
  const caParActe = {};
  ps.forEach((p) => p.actes.forEach((code) => { const a = REF.actByCode[code]; if (!a) return; caParActe[code] = (caParActe[code] || 0) + a.prix * (p.ca / (p.caPlan || 1)); }));
  // segments
  const segCount = {}; Object.keys(REF.SEGMENTS).forEach((k) => segCount[k] = 0);
  state.correspondants.forEach((c) => segCount[c.segment] = (segCount[c.segment] || 0) + 1);
  // top correspondants
  const top = state.correspondants.map((c) => ({ c, s: statsCorrespondant(c.id) })).sort((a, b) => b.s.ca - a.s.ca);
  return {
    caTotal: ca,
    nbCorrespondants: state.correspondants.length,
    nbCorrespondantsActifs: state.correspondants.filter((c) => statsCorrespondant(c.id).enCours > 0).length,
    patientsEnCours: enCours.length,
    nbPatients: ps.length,
    tauxTransfoGlobal: ps.length ? transformes.length / ps.length : 0,
    panierMoyenGlobal: transformes.length ? ca / transformes.length : 0,
    grosCas: ps.filter((p) => p.complexite >= 3).length,
    parMois: months,
    caParActe,
    segCount,
    topCorrespondants: top,
    rdvSemaine: ps.filter((p) => p.prochainRdv && daysFromNow(p.prochainRdv) >= 0 && daysFromNow(p.prochainRdv) <= 7).length,
  };
}

/* ---------- Insights / recommandations (heuristiques) ---------- */
export function generateInsights() {
  const out = [];
  const enriched = state.correspondants.map((c) => ({ c, s: statsCorrespondant(c.id) }));
  const top = [...enriched].sort((a, b) => b.s.ca - a.s.ca);

  // 1. Cas simples sans complexe → cible formation
  enriched.filter((e) => e.s.adresses >= 4 && e.c.segment === 'simple' && e.s.grosCas === 0)
    .slice(0, 2).forEach((e) => out.push({
      type: 'formation', priorite: 'haute',
      titre: `${e.c.label} : que des cas simples`,
      texte: `${e.s.adresses} patients adressés, 0 gros cas. Il confie probablement ses réhabilitations ailleurs. Cible idéale d'une session « gestion des cas complexes » du Cercle Implantaire pour capter ses gros cas.`,
      action: 'Inviter à la prochaine session',
    }));

  // 2. Gros cas → fidéliser en priorité
  const grosEnvoyeurs = enriched.filter((e) => e.s.grosCas >= 2).sort((a, b) => b.s.grosCas - a.s.grosCas).slice(0, 3);
  if (grosEnvoyeurs.length) out.push({
    type: 'fidelisation', priorite: 'haute',
    titre: `Top ${grosEnvoyeurs.length} « gros cas » à choyer`,
    texte: `${grosEnvoyeurs.map((e) => e.c.label.replace('Dr ', '')).join(', ')} envoient vos dossiers les plus lourds. À inviter en priorité au prochain groupe restreint (6-10) pour sécuriser la relation.`,
    action: 'Programmer un déjeuner / groupe restreint',
  });

  // 3. Baisse d'activité (en cours faible vs historique)
  enriched.filter((e) => e.s.adresses >= 6 && e.s.enCours === 0)
    .slice(0, 2).forEach((e) => out.push({
      type: 'reengagement', priorite: 'moyenne',
      titre: `${e.c.label} : silencieux ce trimestre`,
      texte: `Historique solide (${e.s.adresses} patients) mais aucun dossier en cours actuellement. Risque de bascule vers un concurrent. Relance personnalisée recommandée.`,
      action: 'Appel de réengagement',
    }));

  // 4. Non-adhérents performants → convertir
  enriched.filter((e) => !e.c.adherent && e.s.ca > 8000)
    .sort((a, b) => b.s.ca - a.s.ca).slice(0, 2).forEach((e) => out.push({
      type: 'adhesion', priorite: 'moyenne',
      titre: `${e.c.label} : performant mais non-adhérent`,
      texte: `${fmtEuro(e.s.ca)} de CA généré et pas encore membre du Cercle Implantaire. Conversion à fort levier de rétention.`,
      action: 'Proposer l’adhésion',
    }));

  // 5. Taux de transfo faible → friction
  enriched.filter((e) => e.s.adresses >= 5 && e.s.tauxTransfo < 0.55)
    .slice(0, 1).forEach((e) => out.push({
      type: 'process', priorite: 'basse',
      titre: `${e.c.label} : transformation à améliorer`,
      texte: `Seulement ${Math.round(e.s.tauxTransfo * 100)} % des patients adressés sont transformés. À creuser : délai de prise en charge ? clarté des plans de traitement ?`,
      action: 'Diagnostiquer le parcours',
    }));

  return out.slice(0, 6);
}

/* ---------- utils ---------- */
export function daysFromNow(dateStr) { const d = new Date(dateStr + 'T08:00:00'); return Math.round((d - today()) / 86400000); }
export function fmtEuro(n) { return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(Math.round(n)); }
export { REF };
