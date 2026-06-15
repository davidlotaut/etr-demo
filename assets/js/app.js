// ETR — orchestrateur : session, shell, navigation, switch de rôle.
import { getState, subscribe, resetDemo, correspondants, getCorrespondant, patients, patientsOf } from './store.js';
import { icon, escapeHtml, confirmModal, toast } from './ui.js';
import { renderLogin } from './views/login.js';
import { renderPraticien } from './views/praticien.js';
import { renderCabinet } from './views/cabinet.js';

const root = document.getElementById('root');
const SKEY = 'etr-session-v1';
let session = loadSession();

function loadSession() { try { return JSON.parse(localStorage.getItem(SKEY)) || {}; } catch { return {}; } }
function saveSession() { localStorage.setItem(SKEY, JSON.stringify(session)); }

function syncGlobals() { const s = getState(); window.__ETR_TODAY__ = s.today; window.__ETR_CABINET__ = s.cabinet; }

/* ---------- Boot ---------- */
syncGlobals();
mount();

function mount() {
  if (!session.role) return renderLogin(root, enter);
  renderShell();
}
function enter(role, corId) {
  session = { role, corId: corId || session.corId, page: role === 'cabinet' ? 'cockpit' : 'praticien' };
  saveSession(); mount();
}
function logout() { session = {}; saveSession(); mount(); }

/* ---------- Shell ---------- */
function renderShell() {
  syncGlobals();
  const cab = getState().cabinet;
  root.innerHTML = `
    <div id="app">
      <aside class="sidebar" id="sidebar">
        <div class="brand"><div class="logo">e<span class="dot"></span></div><div><b>ETR</b><small>Espace temps réel</small></div></div>
        <nav class="nav" id="nav"></nav>
        <div class="foot">
          <button class="btn ghost sm" data-reset style="color:#bfe0dc;border-color:rgba(255,255,255,.2);width:100%;margin-bottom:8px">${icon('refresh')} Réinitialiser la démo</button>
          <button class="btn ghost sm" data-logout style="color:#bfe0dc;border-color:rgba(255,255,255,.2);width:100%">${icon('logout')} Quitter</button>
        </div>
      </aside>
      <div class="scrim-side" id="scrimSide"></div>
      <div class="main">
        <header class="topbar">
          <button class="menu-btn" id="menuBtn">${icon('menu')}</button>
          <div><div class="crumb" id="crumb"></div><h2 id="ptitle"></h2></div>
          <div class="spacer"></div>
          <div class="search"><span>${icon('search')}</span><input id="globalSearch" placeholder="Rechercher…"></div>
          <div class="role-switch" id="roleSwitch">
            <button data-r="cabinet" class="${session.role === 'cabinet' ? 'active' : ''}">${icon('gauge')} <span class="rs-lab">Cabinet</span></button>
            <button data-r="praticien" class="${session.role === 'praticien' ? 'active' : ''}">${icon('user')} <span class="rs-lab">Correspondant</span></button>
          </div>
        </header>
        <main class="content" id="content"></main>
      </div>
    </div>`;

  renderNav();
  bindShell();
  renderContent();
}

function navItems() {
  if (session.role === 'cabinet') {
    return [
      { page: 'cockpit', label: 'Cockpit', ic: 'gauge' },
      { page: 'correspondants', label: 'Correspondants', ic: 'users', count: correspondants().length },
      { page: 'patients', label: 'Patients', ic: 'activity', count: patients().length },
    ];
  }
  const cor = getCorrespondant(session.corId);
  return [
    { page: 'praticien', label: 'Mes patients', ic: 'user', count: cor ? patientsOf(cor.id).length : 0 },
  ];
}
function renderNav() {
  const nav = document.getElementById('nav');
  const grp = session.role === 'cabinet' ? 'Pilotage réseau' : 'Suivi';
  const items = navItems();
  const who = session.role === 'praticien' && getCorrespondant(session.corId)
    ? `<div style="padding:8px 11px;margin-bottom:6px"><div style="font-size:11px;color:#9ed0cc;font-family:var(--mono);letter-spacing:.1em;text-transform:uppercase">Connecté</div><div style="color:#fff;font-weight:600;font-size:13.5px;margin-top:2px">${escapeHtml(getCorrespondant(session.corId).label)}</div></div>` : '';
  nav.innerHTML = who + `<div class="grp">${grp}</div>` + items.map((it) => `
    <a href="#" data-page="${it.page}" class="${session.page === it.page ? 'active' : ''}">${icon(it.ic)} <span>${it.label}</span>${it.count != null ? `<span class="badge-n">${it.count}</span>` : ''}</a>`).join('');
  nav.querySelectorAll('[data-page]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); session.page = a.dataset.page; saveSession(); closeSide(); renderNav(); renderContent(); }));
}

function bindShell() {
  document.querySelectorAll('#roleSwitch [data-r]').forEach((b) => b.addEventListener('click', () => {
    const r = b.dataset.r;
    if (r === session.role) return;
    if (r === 'praticien') {
      const cid = session.corId || correspondants().sort((a, b) => patientsOf(b.id).length - patientsOf(a.id).length)[0].id;
      enter('praticien', cid);
    } else enter('cabinet');
  }));
  document.querySelector('[data-reset]').addEventListener('click', () => confirmModal('Réinitialiser la démonstration ?', 'Toutes vos modifications (créations, suppressions) seront effacées et les données fictives d\'origine restaurées.', () => { resetDemo(); syncGlobals(); toast('Démo réinitialisée.'); renderNav(); renderContent(); }, false));
  document.querySelector('[data-logout]').addEventListener('click', logout);
  document.getElementById('menuBtn').addEventListener('click', () => { document.getElementById('sidebar').classList.add('open'); document.getElementById('scrimSide').classList.add('show'); });
  document.getElementById('scrimSide').addEventListener('click', closeSide);
  const search = document.getElementById('globalSearch');
  search.addEventListener('keydown', (e) => { if (e.key === 'Enter') runSearch(search.value); });
}
function closeSide() { document.getElementById('sidebar')?.classList.remove('open'); document.getElementById('scrimSide')?.classList.remove('show'); }

const TITLES = { cockpit: ['Cockpit', 'Intelligence du réseau'], correspondants: ['Réseau', 'Correspondants'], patients: ['Suivi', 'Patients du cabinet'], praticien: ['Espace correspondant', 'Mes patients'] };
function renderContent() {
  const content = document.getElementById('content');
  const t = TITLES[session.page] || ['', ''];
  document.getElementById('crumb').textContent = t[0];
  document.getElementById('ptitle').textContent = t[1];
  const ctx = { onChange: refreshCounts };
  if (session.role === 'praticien') renderPraticien(content, { correspondantId: session.corId, onChange: refreshCounts });
  else renderCabinet(content, session.page, ctx);
}
function refreshCounts() { renderNav(); }

/* recherche globale simple */
function runSearch(q) {
  q = (q || '').trim().toLowerCase(); if (!q) return;
  if (session.role === 'cabinet') {
    const c = correspondants().find((x) => x.label.toLowerCase().includes(q) || x.ville.toLowerCase().includes(q));
    if (c) { session.page = 'correspondants'; saveSession(); renderNav(); renderContent(); toast(`Correspondant trouvé : ${c.label}`); return; }
  }
  const p = patients().find((x) => (`${x.prenom} ${x.nom} ${x.ref}`).toLowerCase().includes(q));
  if (p) toast(`Patient trouvé : ${p.prenom} ${p.nom}`); else toast('Aucun résultat.');
}

subscribe(() => { /* persistance gérée dans le store ; on rafraîchit les compteurs */ if (document.getElementById('nav')) renderNav(); });
