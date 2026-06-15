// ETR — wrappers Chart.js thématisés (Chart est global, chargé via CDN).
const reg = new Map();
const C = {
  teal: '#0e5b61', teal3: '#6aa6a8', coral: '#df573d', green: '#2f7d52',
  amber: '#b07d1c', violet: '#5a4b9a', rose: '#b4472f', line: '#e3ded3', ink: '#46544f',
};

function base() {
  if (window.Chart) {
    Chart.defaults.font.family = "'Hanken Grotesk', system-ui, sans-serif";
    Chart.defaults.font.size = 12;
    Chart.defaults.color = C.ink;
  }
}
function destroy(id) { if (reg.has(id)) { reg.get(id).destroy(); reg.delete(id); } }

export function lineCA(canvas, months) {
  base(); const id = canvas.id; destroy(id);
  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 240);
  grad.addColorStop(0, 'rgba(14,91,97,.22)');
  grad.addColorStop(1, 'rgba(14,91,97,0)');
  const ch = new Chart(ctx, {
    type: 'line',
    data: {
      labels: months.map((m) => m.label),
      datasets: [{
        data: months.map((m) => Math.round(m.ca)),
        borderColor: C.teal, backgroundColor: grad, fill: true, tension: .38,
        borderWidth: 2.5, pointRadius: 0, pointHoverRadius: 5, pointHoverBackgroundColor: C.coral, pointHoverBorderColor: '#fff', pointHoverBorderWidth: 2,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: tooltip((v) => euro(v)) },
      scales: {
        x: { grid: { display: false }, border: { display: false }, ticks: { color: '#9aa39e' } },
        y: { grid: { color: C.line }, border: { display: false }, ticks: { color: '#9aa39e', callback: (v) => (v >= 1000 ? v / 1000 + 'k' : v) } },
      },
    },
  });
  reg.set(id, ch); return ch;
}

export function doughnut(canvas, labels, data, colors) {
  base(); const id = canvas.id; destroy(id);
  const ch = new Chart(canvas.getContext('2d'), {
    type: 'doughnut',
    data: { labels, datasets: [{ data, backgroundColor: colors, borderColor: '#fff', borderWidth: 2.5, hoverOffset: 6 }] },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '64%',
      plugins: { legend: { display: false }, tooltip: tooltip((v) => euro(v)) },
    },
  });
  reg.set(id, ch); return ch;
}

export function barH(canvas, labels, data, color = C.teal) {
  base(); const id = canvas.id; destroy(id);
  const ch = new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: { labels, datasets: [{ data, backgroundColor: color, borderRadius: 6, barThickness: 14 }] },
    options: {
      indexAxis: 'y', responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: tooltip((v) => euro(v)) },
      scales: { x: { grid: { color: C.line }, border: { display: false }, ticks: { color: '#9aa39e', callback: (v) => (v >= 1000 ? v / 1000 + 'k' : v) } }, y: { grid: { display: false }, border: { display: false } } },
    },
  });
  reg.set(id, ch); return ch;
}

function tooltip(fmt) {
  return {
    backgroundColor: '#16201e', padding: 11, cornerRadius: 9, titleColor: '#fff', bodyColor: '#cfe0dd',
    titleFont: { family: "'Fraunces', serif", size: 13 }, bodyFont: { family: "'IBM Plex Mono', monospace", size: 12 },
    displayColors: false, callbacks: { label: (c) => fmt(c.parsed.y ?? c.parsed.x ?? c.parsed) },
  };
}
function euro(v) { return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v); }
export const palette = C;
export function destroyAll() { reg.forEach((c) => c.destroy()); reg.clear(); }

// attend que Chart.js (chargé en defer) soit disponible avant de tracer
export function ready(cb) {
  if (window.Chart) return cb();
  const t = setInterval(() => { if (window.Chart) { clearInterval(t); cb(); } }, 30);
  setTimeout(() => clearInterval(t), 5000);
}
