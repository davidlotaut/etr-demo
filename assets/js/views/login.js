// ETR — écran de connexion (choix du rôle).
import { correspondants, statsCorrespondant } from '../store.js';
import { icon, escapeHtml, openModal, closeModal } from '../ui.js';

export function renderLogin(root, onEnter) {
  root.innerHTML = `
  <div class="login-wrap">
    <div class="login-hero">
      <div class="lh-brand">
        <div class="logo" style="width:42px;height:42px;border-radius:12px">e<span class="dot" style="margin-left:1px"></span></div>
        <div><b style="font-size:22px;color:#fff;font-family:var(--serif)">ETR</b><small style="display:block;font-family:var(--mono);font-size:9.5px;letter-spacing:.18em;color:#9ed0cc">ESPACE TEMPS RÉEL</small></div>
      </div>
      <div>
        <h1>Le suivi en temps réel qui fidélise vos correspondants.</h1>
        <p>Une seule plateforme : vos correspondants suivent leurs patients étape par étape, et le cabinet lit son réseau d'adressage comme jamais.</p>
        <div class="pts">
          <div class="pt">${icon('activity')}<div><b>Suivi patient vivant</b><span>Chaque correspondant voit où en est son patient, à la séance près, depuis son téléphone.</span></div></div>
          <div class="pt">${icon('gauge')}<div><b>Intelligence réseau</b><span>CA par correspondant, transformation, segments, et recommandations d'actions.</span></div></div>
          <div class="pt">${icon('heart')}<div><b>Effet de rétention</b><span>Un correspondant équipé, informé et formé reste un correspondant fidèle.</span></div></div>
        </div>
      </div>
      <div style="font-family:var(--mono);font-size:11px;color:#8fc1bd">Démonstration · données 100 % fictives</div>
    </div>

    <div class="login-card">
      <div class="login-box">
        <div class="eyebrow">Connexion</div>
        <h2>Bienvenue sur ETR</h2>
        <p class="sub">Choisissez votre espace pour découvrir la démonstration.</p>
        <div class="who-pick">
          <button class="who-opt" data-role="praticien">
            <div class="ic t">${icon('user')}</div>
            <div><b>Espace Correspondant</b><small>Suivre mes patients adressés en temps réel</small></div>
            <div class="arr">${icon('arrow')}</div>
          </button>
          <button class="who-opt" data-role="cabinet">
            <div class="ic c">${icon('gauge')}</div>
            <div><b>Cockpit Cabinet</b><small>Piloter le réseau de correspondants &amp; l'activité</small></div>
            <div class="arr">${icon('arrow')}</div>
          </button>
        </div>
        <div class="login-sep">démonstration</div>
        <p style="font-size:12.5px;color:var(--muted);margin:0;text-align:center">Aucun mot de passe. Tout est simulé et modifiable :<br>vous pouvez créer, modifier et supprimer librement.</p>
      </div>
    </div>
  </div>`;

  root.querySelector('[data-role="cabinet"]').addEventListener('click', () => onEnter('cabinet'));
  root.querySelector('[data-role="praticien"]').addEventListener('click', () => pickCorrespondant(onEnter));
}

function pickCorrespondant(onEnter) {
  const top = correspondants().map((c) => ({ c, s: statsCorrespondant(c.id) })).sort((a, b) => b.s.enCours - a.s.enCours).slice(0, 8);
  openModal({
    title: 'Entrer comme correspondant', width: 480,
    bodyHTML: `<p style="margin:-4px 0 4px;color:var(--ink-soft);font-size:13.5px">Sélectionnez un correspondant pour voir son espace de suivi (ses patients adressés).</p>
      <div class="who-pick">
        ${top.map(({ c, s }) => `<button class="who-opt" data-cid="${c.id}">
          <div class="ic t" style="font-family:var(--serif);font-weight:600">${escapeHtml((c.prenom[0] || '') + (c.nom[0] || ''))}</div>
          <div><b>${escapeHtml(c.label)}</b><small>${escapeHtml(c.ville)} · ${s.enCours} patient(s) en cours</small></div>
          <div class="arr">${icon('arrow')}</div>
        </button>`).join('')}
      </div>`,
    onMount: (sc) => sc.querySelectorAll('[data-cid]').forEach((b) => b.addEventListener('click', () => { closeModal(); onEnter('praticien', b.dataset.cid); })),
  });
}
