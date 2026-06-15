// ETR — Cockpit Cabinet : intelligence réseau correspondants + pilotage.
import {
  globalKPIs, generateInsights, correspondants, patients, getCorrespondant,
  patientsOf, statsCorrespondant, deleteCorrespondant, daysFromNow, REF,
} from '../store.js';
import { icon, euro, euroK, pct, fmtDate, fmtDateShort, escapeHtml, confirmModal, toast, relDays } from '../ui.js';
import { statutPill, segmentPill, renderPatientDetail, openPatientForm, openCorrespondantForm, avatar, complexityTag } from './components.js';
import { lineCA, doughnut, ready, palette } from '../charts.js';

const ACT_COLORS = ['#0e5b61', '#6aa6a8', '#df573d', '#2f7d52', '#b07d1c', '#5a4b9a', '#b4472f', '#9ab8b6', '#e0a07a', '#7fae8e', '#caa64f'];
const SEG_ORDER = ['regulier', 'complexe', 'simple', 'bloque', 'precis'];

export function renderCabinet(container, page, ctx) {
  if (page === 'correspondants') return renderCorrespondants(container, ctx);
  if (page === 'patients') return renderPatients(container, ctx);
  return renderCockpit(container, ctx);
}

/* =================== COCKPIT =================== */
function renderCockpit(container, ctx) {
  const k = globalKPIs();
  const insights = generateInsights();
  const top = k.topCorrespondants.slice(0, 10);
  const maxCa = Math.max(1, ...top.map((t) => t.s.ca));
  const acts = Object.entries(k.caParActe).map(([c, v]) => ({ a: REF.actByCode[c], v })).filter((x) => x.a).sort((a, b) => b.v - a.v);

  container.innerHTML = `
    <div class="page-head">
      <div><div class="eyebrow">Cockpit cabinet · ${escapeHtml(stateCabinet().reseau)}</div>
        <h1>Intelligence du réseau</h1>
        <p>Lecture d'activité de vos correspondants : ce qu'ils génèrent, qui envoie quoi, et les actions à mener pour développer le réseau.</p>
      </div>
      <div class="live"><span class="pulse"></span> Données à jour · ${fmtDate(stateToday())}</div>
    </div>

    <div class="grid g-kpi">
      ${kpi("CA généré (réseau)", euroK(k.caTotal), 'briefcase', '', `${k.nbCorrespondantsActifs} correspondants actifs`)}
      ${kpi('Patients en cours', k.patientsEnCours, 'activity', 'accent-coral', `${k.rdvSemaine} RDV cette semaine`)}
      ${kpi('Taux de transformation', pct(k.tauxTransfoGlobal), 'trend', 'accent-green', 'consultations → traitements')}
      ${kpi('Panier moyen', euroK(k.panierMoyenGlobal), 'gauge', 'accent-amber', `${k.grosCas} gros cas suivis`)}
    </div>

    <div class="grid g-2 mt">
      <div class="card reveal"><div class="card-h"><h3>Activité adressée · 12 mois</h3><span class="sub">CA des patients reçus</span></div>
        <div style="padding:16px 18px"><div class="chart-box"><canvas id="cMois"></canvas></div></div></div>
      <div class="card reveal"><div class="card-h"><h3>CA par type d'acte</h3><span class="sub">répartition</span></div>
        <div style="padding:16px 18px"><div class="chart-box"><canvas id="cActes"></canvas></div>
          <div class="legend" style="margin-top:14px">${acts.slice(0, 6).map((x, i) => `<span><i style="background:${ACT_COLORS[i]}"></i>${escapeHtml(x.a.label)}</span>`).join('')}</div>
        </div></div>
    </div>

    <div class="grid g-2 mt">
      <div class="card reveal"><div class="card-h"><h3>Top 10 correspondants</h3><span class="sub">par CA généré</span></div>
        <div style="padding:14px 20px 18px"><div class="bars">
        ${top.map(({ c, s }, i) => `<div class="row" data-cid="${c.id}" style="cursor:pointer;grid-template-columns:26px 150px 1fr 64px">
            <span class="rank ${i < 3 ? 'top' : ''}">${i + 1}</span>
            <span style="display:flex;align-items:center;gap:7px;min-width:0"><span class="dot" style="width:8px;height:8px;border-radius:50%;background:${REF.SEGMENTS[c.segment].color};flex:none"></span><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(c.label.replace('Dr ', ''))}</span></span>
            <div class="track"><i style="width:${Math.round((s.ca / maxCa) * 100)}%;background:linear-gradient(90deg,var(--teal-300),var(--teal))"></i></div>
            <span class="v" style="font-size:13px">${euroK(s.ca)}</span>
          </div>`).join('')}
        </div></div></div>

      <div class="card reveal"><div class="card-h"><h3>Segmentation des correspondants</h3><span class="sub">${k.nbCorrespondants} au total</span></div>
        <div style="padding:16px 20px 18px">
          ${SEG_ORDER.map((key) => { const sg = REF.SEGMENTS[key]; const n = k.segCount[key] || 0; const wpct = Math.round((n / Math.max(1, k.nbCorrespondants)) * 100); return `
            <div style="margin-bottom:14px">
              <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:5px"><span style="font-weight:600"><span class="dot" style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${sg.color};margin-right:7px"></span>${sg.label}</span><span class="mono" style="color:var(--muted)">${n}</span></div>
              <div class="track" style="height:9px;border-radius:5px;background:var(--line-2)"><i style="display:block;height:100%;width:${wpct}%;background:${sg.color};border-radius:5px"></i></div>
              <div style="font-size:11.5px;color:var(--muted);margin-top:4px">${escapeHtml(sg.desc)}</div>
            </div>`; }).join('')}
        </div></div>
    </div>

    <div class="page-head" style="margin-top:34px;margin-bottom:16px"><div><div class="eyebrow">Recommandations</div><h1 style="font-size:24px">Ce que je ferais cette semaine</h1></div><span class="pill coral">${icon('sparkles')} ${insights.length} pistes</span></div>
    <div class="grid g-3">
      ${insights.map((it) => insightCard(it)).join('')}
    </div>
  `;

  ready(() => {
    lineCA(container.querySelector('#cMois'), k.parMois);
    doughnut(container.querySelector('#cActes'), acts.slice(0, 6).map((x) => x.a.label), acts.slice(0, 6).map((x) => Math.round(x.v)), ACT_COLORS);
  });
  container.querySelectorAll('[data-cid]').forEach((el) => el.addEventListener('click', () => renderCorrespondantDetail(container, el.dataset.cid, ctx)));
}

function insightCard(it) {
  const ic = { formation: 'award', fidelisation: 'heart', reengagement: 'phone', adhesion: 'users', process: 'target' }[it.type] || 'sparkles';
  const prio = it.priorite === 'haute' ? '<span class="pill coral prio">priorité</span>' : '';
  return `<div class="insight ${it.priorite} reveal">${prio}<div class="ico">${icon(ic)}</div>
    <h4>${escapeHtml(it.titre)}</h4><p>${escapeHtml(it.texte)}</p>
    <span class="cta">${escapeHtml(it.action)} ${icon('arrow')}</span></div>`;
}

/* =================== CORRESPONDANTS =================== */
function renderCorrespondants(container, ctx) {
  const rows = correspondants().map((c) => ({ c, s: statsCorrespondant(c.id) })).sort((a, b) => b.s.ca - a.s.ca);
  container.innerHTML = `
    <div class="page-head">
      <div><div class="eyebrow">Réseau</div><h1>Correspondants</h1><p>Vos prescripteurs : activité, segment et fidélisation. Cliquez pour le détail.</p></div>
      <button class="btn primary" data-add>${icon('plus')} Ajouter un correspondant</button>
    </div>
    <div class="card reveal"><div class="card-h"><h3>${rows.length} correspondants</h3><span class="sub">triés par CA</span></div>
    <table class="tbl"><thead><tr><th>Correspondant</th><th>Segment</th><th class="c">Adressés</th><th class="c">Transfo.</th><th class="r">Panier moy.</th><th class="r">CA généré</th><th></th></tr></thead><tbody>
    ${rows.map(({ c, s }) => `<tr data-cid="${c.id}">
      <td><div class="who">${avatar(c.prenom, c.nom)}<div class="meta"><b>${escapeHtml(c.label)} ${c.adherent ? `<span class="tag" style="color:var(--green)">membre</span>` : ''}</b><small>${escapeHtml(c.ville)} · depuis ${c.depuis}</small></div></div></td>
      <td>${segmentPill(c.segment)}</td>
      <td class="c">${s.adresses}</td>
      <td class="c">${pct(s.tauxTransfo)}</td>
      <td class="r num">${euro(s.panierMoyen)}</td>
      <td class="r"><b class="num">${euro(s.ca)}</b></td>
      <td class="r"><button class="x" data-edit="${c.id}" title="Modifier">${icon('edit')}</button></td>
    </tr>`).join('')}
    </tbody></table></div>`;

  const reload = () => renderCorrespondants(container, ctx);
  container.querySelector('[data-add]').addEventListener('click', () => openCorrespondantForm({ onDone: reload }));
  container.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); openCorrespondantForm({ correspondant: getCorrespondant(b.dataset.edit), onDone: reload }); }));
  container.querySelectorAll('tr[data-cid]').forEach((tr) => tr.addEventListener('click', () => renderCorrespondantDetail(container, tr.dataset.cid, ctx)));
}

function renderCorrespondantDetail(container, cid, ctx) {
  const c = getCorrespondant(cid);
  if (!c) return renderCorrespondants(container, ctx);
  const s = statsCorrespondant(cid);
  const ps = patientsOf(cid).slice().sort((a, b) => (b.adresseLe).localeCompare(a.adresseLe));
  const acts = Object.entries(s.caParActe).map(([code, v]) => ({ a: REF.actByCode[code], v })).filter((x) => x.a).sort((a, b) => b.v - a.v).slice(0, 6);
  const maxA = Math.max(1, ...acts.map((x) => x.v));

  container.innerHTML = `
    <div class="page-head">
      <div><button class="btn ghost sm" data-back>${icon('chevron')} Correspondants</button>
        <div style="display:flex;align-items:center;gap:14px;margin-top:12px">${avatar(c.prenom, c.nom)}<div>
          <h1 style="font-size:28px">${escapeHtml(c.label)}</h1>
          <p style="margin:2px 0 0">${segmentPill(c.segment)} <span class="tag">${escapeHtml(c.ville)}</span> ${c.adherent ? '<span class="tag" style="color:var(--green)">membre du Cercle</span>' : '<span class="tag">non-adhérent</span>'}</p>
        </div></div>
      </div>
      <div class="btn-row">
        <button class="btn" data-edit>${icon('edit')} Modifier</button>
        <button class="btn danger" data-del>${icon('trash')}</button>
      </div>
    </div>

    <div class="grid g-kpi">
      ${kpi('CA généré', euro(s.ca), 'briefcase')}
      ${kpi('Patients adressés', s.adresses, 'users', 'accent-amber')}
      ${kpi('Taux de transfo.', pct(s.tauxTransfo), 'trend', 'accent-green')}
      ${kpi('Gros cas', s.grosCas, 'award', 'accent-coral')}
    </div>

    <div class="grid g-2 mt">
      <div class="card pad reveal"><h3 style="margin-bottom:6px">Coordonnées</h3>
        <dl class="kv" style="margin-top:10px">
          <dt>Email</dt><dd>${escapeHtml(c.email || '—')}</dd>
          <dt>Téléphone</dt><dd class="mono">${escapeHtml(c.tel || '—')}</dd>
          <dt>Cabinet</dt><dd>${escapeHtml(c.cabinet || '—')}</dd>
          <dt>Code accès</dt><dd class="mono">${escapeHtml(c.code)}</dd>
          <dt>Panier moyen</dt><dd class="num">${euro(s.panierMoyen)}</dd>
        </dl>
      </div>
      <div class="card pad reveal"><h3 style="margin-bottom:14px">Répartition de son CA par acte</h3>
        <div class="bars">${acts.length ? acts.map((x) => `<div class="row" style="grid-template-columns:150px 1fr 64px"><span style="font-size:12.5px">${escapeHtml(x.a.label)}</span><div class="track"><i style="width:${Math.round((x.v / maxA) * 100)}%;background:var(--teal)"></i></div><span class="v" style="font-size:12.5px">${euroK(x.v)}</span></div>`).join('') : '<div style="color:var(--muted)">Pas encore d\'activité.</div>'}</div>
      </div>
    </div>

    <div class="card mt reveal"><div class="card-h"><h3>Patients adressés</h3><span class="sub">${ps.length} dossier(s)</span></div>
      ${ps.length ? `<table class="tbl"><thead><tr><th>Patient</th><th>Statut</th><th>Étape</th><th class="r">CA</th></tr></thead><tbody>
      ${ps.map((p) => `<tr data-pid="${p.id}"><td><div class="who">${avatar(p.prenom, p.nom)}<div class="meta"><b>${escapeHtml(p.prenom)} ${escapeHtml(p.nom)}</b><small class="mono">${escapeHtml(p.ref)}</small></div></div></td><td>${statutPill(p.statut)}</td><td>${escapeHtml(REF.PHASES.find((x) => x.key === p.phaseActuelle)?.label || '—')}</td><td class="r num">${euro(p.ca)}</td></tr>`).join('')}
      </tbody></table>` : '<div class="empty">Aucun patient.</div>'}
    </div>`;

  container.querySelector('[data-back]').addEventListener('click', () => renderCorrespondants(container, ctx));
  container.querySelector('[data-edit]').addEventListener('click', () => openCorrespondantForm({ correspondant: c, onDone: () => renderCorrespondantDetail(container, cid, ctx) }));
  container.querySelector('[data-del]').addEventListener('click', () => confirmModal('Supprimer ce correspondant ?', `${c.label} et ses dossiers liés seront retirés de la démonstration.`, () => { deleteCorrespondant(cid); toast('Correspondant supprimé.'); ctx.onChange && ctx.onChange(); renderCorrespondants(container, ctx); }));
  container.querySelectorAll('tr[data-pid]').forEach((tr) => tr.addEventListener('click', () => renderPatientDetail(container, tr.dataset.pid, { onBack: () => renderCorrespondantDetail(container, cid, ctx), onChange: ctx.onChange })));
}

/* =================== PATIENTS (global) =================== */
function renderPatients(container, ctx, filter = 'all') {
  let ps = patients().slice();
  if (filter === 'encours') ps = ps.filter((p) => ['adresse', 'consult', 'traitement', 'cicat'].includes(p.statut));
  else if (filter === 'finalise') ps = ps.filter((p) => p.statut === 'finalise');
  else if (filter === 'gros') ps = ps.filter((p) => p.complexite >= 3);
  ps.sort((a, b) => (a.prochainRdv || '9999').localeCompare(b.prochainRdv || '9999'));
  const total = patients().length;
  const seg = (key, lab) => `<button class="btn sm ${filter === key ? 'primary' : 'ghost'}" data-flt="${key}">${lab}</button>`;

  container.innerHTML = `
    <div class="page-head">
      <div><div class="eyebrow">Suivi</div><h1>Patients</h1><p>Tous les dossiers du cabinet. Créez, modifiez, faites avancer le parcours.</p></div>
      <button class="btn primary" data-add>${icon('plus')} Nouveau patient</button>
    </div>
    <div class="btn-row" style="margin-bottom:16px">${seg('all', `Tous (${total})`)}${seg('encours', 'En cours')}${seg('gros', 'Gros cas')}${seg('finalise', 'Finalisés')}</div>
    <div class="card reveal">
      <table class="tbl"><thead><tr><th>Patient</th><th>Correspondant</th><th>Statut</th><th>Étape</th><th>Prochain RDV</th><th class="r">CA</th></tr></thead><tbody>
      ${ps.map((p) => { const c = getCorrespondant(p.correspondantId); return `<tr data-pid="${p.id}">
        <td><div class="who">${avatar(p.prenom, p.nom)}<div class="meta"><b>${escapeHtml(p.prenom)} ${escapeHtml(p.nom)}</b><small class="mono">${escapeHtml(p.ref)}</small></div></div></td>
        <td>${c ? escapeHtml(c.label.replace('Dr ', 'Dr ')) : '—'}</td>
        <td>${statutPill(p.statut)}</td>
        <td>${escapeHtml(REF.PHASES.find((x) => x.key === p.phaseActuelle)?.label || '—')}</td>
        <td>${p.prochainRdv ? `${fmtDateShort(p.prochainRdv)} <span class="tag">${relDays(daysFromNow(p.prochainRdv))}</span>` : '<span style="color:var(--muted)">—</span>'}</td>
        <td class="r num">${euro(p.ca)}</td></tr>`; }).join('')}
      </tbody></table>
      ${ps.length ? '' : '<div class="empty">Aucun patient pour ce filtre.</div>'}
    </div>`;

  container.querySelector('[data-add]').addEventListener('click', () => openPatientForm({ onDone: () => renderPatients(container, ctx, filter) }));
  container.querySelectorAll('[data-flt]').forEach((b) => b.addEventListener('click', () => renderPatients(container, ctx, b.dataset.flt)));
  container.querySelectorAll('tr[data-pid]').forEach((tr) => tr.addEventListener('click', () => renderPatientDetail(container, tr.dataset.pid, { onBack: () => renderPatients(container, ctx, filter), onChange: ctx.onChange })));
}

/* helpers */
function kpi(label, val, ic, accent = '', sub = '') {
  return `<div class="card kpi ${accent} reveal"><div class="label">${icon(ic)} ${label}</div><div class="val num">${val}</div>${sub ? `<div class="delta">${escapeHtml(sub)}</div>` : ''}</div>`;
}
function stateCabinet() { return (window.__ETR_CABINET__ || { reseau: 'Cercle Implantaire' }); }
function stateToday() { return window.__ETR_TODAY__ || '2026-06-15'; }
