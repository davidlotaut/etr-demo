// ETR — helpers UI : icônes, DOM, format, toasts, modale.

/* ---------- Icônes (stroke, style Lucide) ---------- */
const I = {
  activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
  gauge: '<path d="M12 14l4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  plus: '<path d="M5 12h14M12 5v14"/>',
  trash: '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
  award: '<circle cx="12" cy="8" r="6"/><path d="M15.5 13.5 17 22l-5-3-5 3 1.5-8.5"/>',
  trend: '<path d="M22 7 13.5 15.5 8.5 10.5 2 17"/><path d="M16 7h6v6"/>',
  alert: '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  menu: '<path d="M4 12h16M4 6h16M4 18h16"/>',
  building: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01"/>',
  implant: '<path d="M12 2c-1.5 0-2.5 1-2.5 2.5 0 1 .5 1.8.5 3 0 1-1 1.5-1 3 0 2 1 2.5 1.5 5 .3 1.6.5 4 1.5 4s1.2-2.4 1.5-4c.5-2.5 1.5-3 1.5-5 0-1.5-1-2-1-3 0-1.2.5-2 .5-3C14.5 3 13.5 2 12 2Z"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  sparkles: '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16M8 16H3v5"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 5L2 7"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  layers: '<path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 17l9 5 9-5"/>',
  filter: '<path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>',
  briefcase: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
};
export function icon(name, cls = '') {
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[name] || ''}</svg>`;
}

/* ---------- DOM ---------- */
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export function frag(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }
export function setHTML(el, html) { el.innerHTML = html; return el; }

/* ---------- Format ---------- */
export const euro = (n) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(Math.round(n || 0));
export const euroK = (n) => (Math.abs(n) >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace('.', ',') + ' k€' : Math.round(n) + ' €');
export const pct = (n) => Math.round(n * 100) + ' %';
export const initials = (a, b) => `${(a || '?')[0]}${(b || '')[0] || ''}`.toUpperCase();
export function fmtDate(s, opts = { day: 'numeric', month: 'short', year: 'numeric' }) {
  if (!s) return '—';
  return new Date(s + 'T08:00:00').toLocaleDateString('fr-FR', opts);
}
export function fmtDateShort(s) { return fmtDate(s, { day: '2-digit', month: '2-digit', year: '2-digit' }); }
export function relDays(n) {
  if (n === null || n === undefined) return '';
  if (n === 0) return "aujourd'hui";
  if (n === 1) return 'demain';
  if (n === -1) return 'hier';
  if (n > 0) return `dans ${n} j`;
  return `il y a ${-n} j`;
}
export function escapeHtml(s) { return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

/* ---------- Toast ---------- */
let toastWrap;
export function toast(msg, kind = 'ok') {
  if (!toastWrap) { toastWrap = frag('<div class="toasts"></div>'); document.body.appendChild(toastWrap); }
  const t = frag(`<div class="toast ${kind}">${icon(kind === 'ok' ? 'check' : 'activity')}<span>${escapeHtml(msg)}</span></div>`);
  toastWrap.appendChild(t);
  setTimeout(() => { t.style.transition = 'opacity .3s, transform .3s'; t.style.opacity = '0'; t.style.transform = 'translateX(20px)'; setTimeout(() => t.remove(), 320); }, 2600);
}

/* ---------- Modal ---------- */
export function openModal({ title, bodyHTML, footerHTML, onMount, width }) {
  closeModal();
  const scrim = frag(`<div class="scrim"><div class="modal" style="${width ? `width:min(${width}px,100%)` : ''}">
    <div class="modal-h"><h3>${escapeHtml(title)}</h3><button class="x" data-close>${icon('x')}</button></div>
    <div class="modal-b">${bodyHTML}</div>
    ${footerHTML ? `<div class="modal-f">${footerHTML}</div>` : ''}
  </div></div>`);
  scrim.addEventListener('click', (e) => { if (e.target === scrim || e.target.closest('[data-close]')) closeModal(); });
  document.addEventListener('keydown', escClose);
  document.body.appendChild(scrim);
  document.body.style.overflow = 'hidden';
  if (onMount) onMount(scrim);
  return scrim;
}
function escClose(e) { if (e.key === 'Escape') closeModal(); }
export function closeModal() {
  const s = $('.scrim'); if (s) s.remove();
  document.removeEventListener('keydown', escClose);
  document.body.style.overflow = '';
}

/* confirm helper */
export function confirmModal(title, message, onYes, danger = true) {
  openModal({
    title,
    bodyHTML: `<p style="margin:0;color:var(--ink-soft)">${escapeHtml(message)}</p>`,
    footerHTML: `<button class="btn ghost" data-close>Annuler</button><button class="btn ${danger ? 'danger' : 'primary'}" data-yes>Confirmer</button>`,
    onMount: (s) => s.querySelector('[data-yes]').addEventListener('click', () => { closeModal(); onYes(); }),
  });
}
