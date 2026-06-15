// ETR — Espace Correspondant : un correspondant suit ses patients adressés.
import { getCorrespondant, patientsOf, statsCorrespondant, daysFromNow } from '../store.js';
import { icon, euro, pct, fmtDate, fmtDateShort, escapeHtml, relDays, initials } from '../ui.js';
import { statutPill, phaseRail, renderPatientDetail, openPatientForm, avatar } from './components.js';
import { REF } from '../store.js';

const PHASE = Object.fromEntries(REF.PHASES.map((p) => [p.key, p]));

export function renderPraticien(container, ctx) {
  const cid = ctx.correspondantId;
  const list = () => renderList(container, cid, ctx);
  list();
}

function renderList(container, cid, ctx) {
  const cor = getCorrespondant(cid);
  if (!cor) { container.innerHTML = `<div class="empty">Correspondant introuvable.</div>`; return; }
  const ps = patientsOf(cid).slice().sort((a, b) => (a.prochainRdv || '9999').localeCompare(b.prochainRdv || '9999'));
  const s = statsCorrespondant(cid);
  const enCours = ps.filter((p) => ['adresse', 'consult', 'traitement', 'cicat'].includes(p.statut));
  const rdv7 = ps.filter((p) => p.prochainRdv && daysFromNow(p.prochainRdv) >= 0 && daysFromNow(p.prochainRdv) <= 7);

  container.innerHTML = `
    <div class="page-head">
      <div>
        <div class="eyebrow">Espace correspondant · ${escapeHtml(cor.ville)}</div>
        <h1>Bonjour ${escapeHtml(cor.label)}</h1>
        <p>Suivez en temps réel les patients que vous avez adressés au cabinet. Mise à jour à chaque séance.</p>
      </div>
      <button class="btn primary" data-add>${icon('plus')} Adresser un patient</button>
    </div>

    <div class="grid g-kpi">
      ${kpi('Patients en cours', enCours.length, 'activity')}
      ${kpi('RDV sous 7 jours', rdv7.length, 'calendar', 'accent-coral')}
      ${kpi('Taux de transformation', pct(s.tauxTransfo), 'trend', 'accent-green')}
      ${kpi('Patients adressés', s.adresses, 'users', 'accent-amber')}
    </div>

    <div class="card mt reveal">
      <div class="card-h"><h3>Mes patients adressés</h3><span class="sub">${ps.length} dossier(s) · cliquez pour le détail</span></div>
      ${ps.length ? `<table class="tbl"><thead><tr><th>Patient</th><th>Statut</th><th>Étape en cours</th><th>Prochain RDV</th><th class="r">Avancement</th></tr></thead><tbody>
        ${ps.map((p) => row(p)).join('')}
      </tbody></table>` : `<div class="empty">${icon('users')}<div>Aucun patient adressé pour l'instant.</div><button class="btn primary sm" data-add2 style="margin-top:14px">${icon('plus')} Adresser un patient</button></div>`}
    </div>
  `;

  const onChange = () => { ctx.onChange && ctx.onChange(); renderList(container, cid, ctx); };
  container.querySelector('[data-add]')?.addEventListener('click', () => openPatientForm({ correspondantId: cid, lockCorrespondant: true, onDone: onChange }));
  container.querySelector('[data-add2]')?.addEventListener('click', () => openPatientForm({ correspondantId: cid, lockCorrespondant: true, onDone: onChange }));
  container.querySelectorAll('[data-pid]').forEach((tr) => tr.addEventListener('click', () => {
    renderPatientDetail(container, tr.dataset.pid, { onBack: () => renderList(container, cid, ctx), onChange: ctx.onChange, lockCorrespondant: true });
  }));
}

function row(p) {
  const total = p.phases.length;
  const done = p.statut === 'finalise' ? total : p.phaseIdx;
  const ph = PHASE[p.phaseActuelle];
  const rdv = p.prochainRdv ? `${fmtDateShort(p.prochainRdv)} <span class="tag">${relDays(daysFromNow_(p.prochainRdv))}</span>` : '<span style="color:var(--muted)">—</span>';
  return `<tr data-pid="${p.id}">
    <td><div class="who">${avatar(p.prenom, p.nom)}<div class="meta"><b>${escapeHtml(p.prenom)} ${escapeHtml(p.nom)}</b><small class="mono">${escapeHtml(p.ref)}</small></div></div></td>
    <td>${statutPill(p.statut)}</td>
    <td><span style="font-weight:600">${p.statut === 'finalise' ? 'Traitement finalisé' : escapeHtml(ph?.label || '—')}</span></td>
    <td>${rdv}</td>
    <td class="r"><div style="display:flex;align-items:center;gap:9px;justify-content:flex-end"><span class="mono" style="font-size:12px;color:var(--muted)">${done}/${total}</span><div class="minibar" style="width:90px"><i style="width:${Math.round((done / total) * 100)}%"></i></div></div></td>
  </tr>`;
}

function daysFromNow_(s) { return daysFromNow(s); }
function kpi(label, val, ic, accent = '') {
  return `<div class="card kpi ${accent} reveal"><div class="label">${icon(ic)} ${label}</div><div class="val num">${val}</div></div>`;
}
