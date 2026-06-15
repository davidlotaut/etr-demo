// ETR — composants partagés : pills, frise temps réel, détail patient, formulaires CRUD.
import {
  REF, getPatient, getCorrespondant, statsCorrespondant,
  addPatient, updatePatient, deletePatient, advancePhase, setRdv,
  correspondants,
} from '../store.js';
import { icon, euro, fmtDate, fmtDateShort, initials, escapeHtml, relDays, openModal, closeModal, confirmModal, toast, frag } from '../ui.js';

const PHASE_LABEL = Object.fromEntries(REF.PHASES.map((p) => [p.key, p]));

export function statutPill(statut) {
  const s = REF.STATUTS[statut] || REF.STATUTS.adresse;
  return `<span class="pill ${s.tone}"><span class="dot" style="background:currentColor"></span>${s.label}</span>`;
}
export function segmentPill(segKey) {
  const s = REF.SEGMENTS[segKey] || REF.SEGMENTS.simple;
  return `<span class="pill neutral" title="${escapeHtml(s.desc)}"><span class="dot" style="background:${s.color}"></span>${s.label}</span>`;
}
export function complexityTag(level) {
  const labels = ['Simple', 'Standard', 'Complexe', 'Gros cas'];
  const l = labels[Math.min(level, 3)];
  return `<span class="tag">${l}</span>`;
}
export function avatar(prenom, nom, alt = false) {
  return `<div class="avatar ${alt ? 'c2' : ''}">${initials(prenom, nom)}</div>`;
}

/* ---------- Frise temps réel (organigramme signature) ---------- */
export function phaseRail(p) {
  const dateOf = (key) => { const s = p.seances.find((x) => x.phase === key); return s ? fmtDateShort(s.date) : ''; };
  const nodes = p.phases.map((key, i) => {
    const cls = p.statut === 'finalise' ? 'done' : i < p.phaseIdx ? 'done' : i === p.phaseIdx ? 'current' : '';
    const ph = PHASE_LABEL[key];
    const mark = (cls === 'done') ? icon('check') : `<span style="font-family:var(--mono);font-size:11px">${i + 1}</span>`;
    return `<div class="node ${cls}">
      <div class="bead">${mark}</div>
      <div class="lab">${ph.short}</div>
      <div class="when">${dateOf(key)}</div>
    </div>`;
  }).join('');
  return `<div class="rail">${nodes}</div>`;
}

/* ---------- Vue détail patient ---------- */
export function renderPatientDetail(container, pid, ctx = {}) {
  const p = getPatient(pid);
  if (!p) { container.innerHTML = `<div class="empty">Patient introuvable.</div>`; return; }
  const cor = getCorrespondant(p.correspondantId);
  const phaseNow = PHASE_LABEL[p.phaseActuelle];
  const back = ctx.onBack ? `<button class="btn ghost sm" data-back>${icon('chevron')} Retour</button>` : '';
  const canAdvance = p.statut !== 'finalise' && p.statut !== 'nontransf';

  const mat = p.materiels.length ? `
    <div class="card mt"><div class="card-h"><h3>Fiche de traçabilité des matériaux</h3><span class="sub">Obligation implantaire</span></div>
    <div style="padding:4px 6px 10px"><table class="trace"><thead><tr><th>Dent</th><th>Marque / gamme</th><th>Dimensions</th><th>Référence</th><th>N° de lot</th></tr></thead><tbody>
    ${p.materiels.map((m) => `<tr><td class="mono">${escapeHtml(m.pos)}</td><td><b>${escapeHtml(m.marque)}</b> · ${escapeHtml(m.gamme)}</td><td class="mono">${escapeHtml(m.dim)}</td><td>${escapeHtml(m.ref)}</td><td class="mono">${escapeHtml(m.lot)}</td></tr>`).join('')}
    </tbody></table></div></div>` : '';

  const timeline = `<div class="card mt"><div class="card-h"><h3>Journal des séances</h3><span class="sub">${p.seances.length} séance(s)</span></div>
    <div style="padding:6px 20px 16px"><div class="timeline">
    ${[...p.seances].reverse().map((s) => `<div class="ev"><div class="d">${fmtDateShort(s.date)}</div><div><b>${PHASE_LABEL[s.phase]?.label || s.phase}</b>${s.done ? ' <span class="pill success" style="transform:scale(.85)">terminé</span>' : ' <span class="pill progress" style="transform:scale(.85)">en cours</span>'}${s.note ? `<p>${escapeHtml(s.note)}</p>` : ''}</div></div>`).join('')}
    </div></div></div>`;

  const acts = p.actes.map((c) => REF.actByCode[c]).filter(Boolean);

  container.innerHTML = `
    <div class="page-head">
      <div>${back}
        <div class="eyebrow" style="margin-top:10px">${escapeHtml(p.ref)}</div>
        <h1>${escapeHtml(p.prenom)} ${escapeHtml(p.nom)}</h1>
        <p>Adressé par <b>${cor ? escapeHtml(cor.label) : '—'}</b>${cor ? ` · ${escapeHtml(cor.ville)}` : ''}</p>
      </div>
      <div class="btn-row">
        ${canAdvance ? `<button class="btn primary" data-advance>${icon('check')} Valider l'étape</button>` : ''}
        <button class="btn" data-edit>${icon('edit')} Modifier</button>
        <button class="btn danger" data-del>${icon('trash')}</button>
      </div>
    </div>

    <div class="card pad reveal">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:18px">
        <div style="display:flex;gap:10px;align-items:center">${statutPill(p.statut)}${complexityTag(p.complexite)}
          <span class="tag">${euro(p.ca)} facturé / ${euro(p.caPlan)} planifié</span></div>
        <div class="live"><span class="pulse"></span> Étape en cours : <b style="color:var(--coral);margin-left:4px">${phaseNow?.label || '—'}</b></div>
      </div>
      ${phaseRail(p)}
    </div>

    <div class="grid g-2 mt">
      <div class="card pad reveal">
        <h3 style="margin-bottom:14px">Plan de traitement</h3>
        <div class="bars">
        ${acts.map((a) => `<div class="row"><span>${escapeHtml(a.label)}</span><div class="track"><i style="width:${Math.min(100, a.prix / 180)}%;background:var(--teal)"></i></div><span class="v">${euro(a.prix)}</span></div>`).join('')}
        </div>
      </div>
      <div class="card pad reveal">
        <h3 style="margin-bottom:14px">Suivi</h3>
        <dl class="kv">
          <dt>Prochain RDV</dt><dd>${p.prochainRdv ? `${fmtDate(p.prochainRdv)} <span class="tag">${relDays(daysTo(p.prochainRdv))}</span>` : '<span style="color:var(--muted)">à programmer</span>'} <button class="btn ghost sm" data-rdv style="margin-left:6px">${icon('calendar')}</button></dd>
          <dt>Dernière MAJ</dt><dd class="mono">${fmtDate(p.maj)}</dd>
          <dt>Né(e)</dt><dd>${escapeHtml(p.naissance)}</dd>
          <dt>Correspondant</dt><dd>${cor ? escapeHtml(cor.label) : '—'}</dd>
        </dl>
      </div>
    </div>
    ${mat}
    ${timeline}
  `;

  if (ctx.onBack) container.querySelector('[data-back]').addEventListener('click', ctx.onBack);
  const refresh = () => renderPatientDetail(container, pid, ctx);
  const adv = container.querySelector('[data-advance]');
  if (adv) adv.addEventListener('click', () => { advancePhase(pid); toast('Étape validée, suivi mis à jour.'); ctx.onChange && ctx.onChange(); refresh(); });
  container.querySelector('[data-edit]').addEventListener('click', () => openPatientForm({ patient: p, lockCorrespondant: ctx.lockCorrespondant, onDone: () => { ctx.onChange && ctx.onChange(); refresh(); } }));
  container.querySelector('[data-del]').addEventListener('click', () => confirmModal('Supprimer ce dossier ?', `${p.prenom} ${p.nom} sera définitivement retiré de la démonstration.`, () => { deletePatient(pid); toast('Dossier supprimé.'); ctx.onChange && ctx.onChange(); ctx.onBack ? ctx.onBack() : refresh(); }));
  container.querySelector('[data-rdv]').addEventListener('click', () => openRdvForm(p, () => { ctx.onChange && ctx.onChange(); refresh(); }));
}
function daysTo(s) { const d = new Date(s + 'T08:00:00'); return Math.round((d - new Date(REF_today())) / 86400000); }
function REF_today() { return (window.__ETR_TODAY__ || '2026-06-15') + 'T08:00:00'; }

/* ---------- Formulaire patient (création / édition) ---------- */
export function openPatientForm({ patient, correspondantId, lockCorrespondant, onDone }) {
  const edit = !!patient;
  const cors = correspondants();
  const corId = patient ? patient.correspondantId : (correspondantId || cors[0]?.id);
  const selectedActs = new Set(patient ? patient.actes : ['CS', 'CB', 'IMP', 'PMC']);
  const corOptions = cors.map((c) => `<option value="${c.id}" ${c.id === corId ? 'selected' : ''}>${escapeHtml(c.label)} — ${escapeHtml(c.ville)}</option>`).join('');
  const actChips = REF.ACTES.map((a) => `<label class="${selectedActs.has(a.code) ? 'on' : ''}"><input type="checkbox" value="${a.code}" ${selectedActs.has(a.code) ? 'checked' : ''}>${escapeHtml(a.label)}</label>`).join('');

  openModal({
    title: edit ? 'Modifier le dossier patient' : 'Adresser un patient',
    width: 580,
    bodyHTML: `
      <div class="field-row">
        <div class="field"><label>Prénom</label><input data-f="prenom" value="${escapeHtml(patient?.prenom || '')}" placeholder="Camille"></div>
        <div class="field"><label>Nom</label><input data-f="nom" value="${escapeHtml(patient?.nom || '')}" placeholder="Lefèvre"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Année de naissance</label><input data-f="naissance" value="${escapeHtml(patient?.naissance || '')}" placeholder="1972"></div>
        <div class="field"><label>Correspondant adresseur</label><select data-f="correspondantId" ${lockCorrespondant ? 'disabled' : ''}>${corOptions}</select></div>
      </div>
      <div class="field"><label>Plan de traitement envisagé</label><div class="chips" data-acts>${actChips}</div></div>
      <div class="field"><label>Note clinique</label><textarea data-f="note" rows="2" placeholder="Motif d'adressage, contexte…">${escapeHtml(patient?.seances?.[0]?.note || '')}</textarea></div>
    `,
    footerHTML: `<button class="btn ghost" data-close>Annuler</button><button class="btn primary" data-save>${icon('check')} ${edit ? 'Enregistrer' : 'Adresser le patient'}</button>`,
    onMount: (s) => {
      s.querySelectorAll('[data-acts] label').forEach((lab) => lab.addEventListener('click', () => setTimeout(() => lab.classList.toggle('on', lab.querySelector('input').checked))));
      s.querySelector('[data-save]').addEventListener('click', () => {
        const get = (f) => s.querySelector(`[data-f="${f}"]`).value.trim();
        const acts = [...s.querySelectorAll('[data-acts] input:checked')].map((i) => i.value);
        const data = { prenom: get('prenom') || 'Patient', nom: get('nom') || 'Démo', naissance: get('naissance'), correspondantId: get('correspondantId') || corId, actes: acts.length ? acts : ['CS', 'CB', 'IMP'], note: get('note') };
        if (edit) { updatePatient(patient.id, data); toast('Dossier mis à jour.'); }
        else { addPatient(data); toast('Patient adressé, suivi ouvert.'); }
        closeModal(); onDone && onDone();
      });
    },
  });
}

function openRdvForm(p, onDone) {
  openModal({
    title: 'Prochain rendez-vous', width: 420,
    bodyHTML: `<div class="field"><label>Date du prochain RDV</label><input type="date" data-f="rdv" value="${p.prochainRdv || ''}"></div>`,
    footerHTML: `<button class="btn ghost" data-close>Annuler</button><button class="btn primary" data-save>${icon('check')} Enregistrer</button>`,
    onMount: (s) => s.querySelector('[data-save]').addEventListener('click', () => { setRdv(p.id, s.querySelector('[data-f="rdv"]').value); toast('Rendez-vous mis à jour.'); closeModal(); onDone && onDone(); }),
  });
}

/* ---------- Formulaire correspondant ---------- */
export function openCorrespondantForm({ correspondant, onDone }) {
  const edit = !!correspondant;
  const segs = Object.values(REF.SEGMENTS).map((sg) => `<option value="${sg.key}" ${correspondant?.segment === sg.key ? 'selected' : ''}>${sg.label}</option>`).join('');
  openModal({
    title: edit ? 'Modifier le correspondant' : 'Ajouter un correspondant', width: 560,
    bodyHTML: `
      <div class="field-row">
        <div class="field"><label>Prénom</label><input data-f="prenom" value="${escapeHtml(correspondant?.prenom || '')}"></div>
        <div class="field"><label>Nom</label><input data-f="nom" value="${escapeHtml(correspondant?.nom || '')}"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Ville</label><input data-f="ville" value="${escapeHtml(correspondant?.ville || '')}" placeholder="Nancy"></div>
        <div class="field"><label>Segment</label><select data-f="segment">${segs}</select></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Email</label><input data-f="email" value="${escapeHtml(correspondant?.email || '')}"></div>
        <div class="field"><label>Téléphone</label><input data-f="tel" value="${escapeHtml(correspondant?.tel || '')}"></div>
      </div>
      <label class="chips" style="margin-top:2px"><label class="${correspondant?.adherent ? 'on' : ''}"><input type="checkbox" data-f="adherent" ${correspondant?.adherent ? 'checked' : ''}> Adhérent au Cercle Implantaire</label></label>
    `,
    footerHTML: `<button class="btn ghost" data-close>Annuler</button><button class="btn primary" data-save>${icon('check')} ${edit ? 'Enregistrer' : 'Ajouter'}</button>`,
    onMount: (s) => {
      const chip = s.querySelector('.chips label'); chip.addEventListener('click', () => setTimeout(() => chip.classList.toggle('on', chip.querySelector('input').checked)));
      s.querySelector('[data-save]').addEventListener('click', () => {
        const get = (f) => { const el = s.querySelector(`[data-f="${f}"]`); return el.type === 'checkbox' ? el.checked : el.value.trim(); };
        const data = { prenom: get('prenom'), nom: get('nom'), ville: get('ville'), segment: get('segment'), email: get('email'), tel: get('tel'), adherent: get('adherent') };
        if (edit) { updateCorrespondantSafe(correspondant.id, data); toast('Correspondant mis à jour.'); }
        else { addCorrespondantSafe(data); toast('Correspondant ajouté.'); }
        closeModal(); onDone && onDone();
      });
    },
  });
}
// petits wrappers pour import dynamique propre
import { addCorrespondant, updateCorrespondant } from '../store.js';
function addCorrespondantSafe(d) { return addCorrespondant(d); }
function updateCorrespondantSafe(id, d) { return updateCorrespondant(id, d); }
