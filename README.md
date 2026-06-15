# ETR — Espace Temps Réel

Démonstration interactive d'une plateforme pour cabinet d'implantologie et de chirurgie orale.
**Toutes les données sont fictives.** Aucun lien avec un patient, un praticien ou un cabinet réel.

Deux espaces :

- **Espace Correspondant** — un dentiste correspondant suit en temps réel les patients qu'il a
  adressés : statut, organigramme des phases (jusqu'à 8 mois), dernier acte, prochain rendez-vous,
  fiche de traçabilité des matériaux.
- **Cockpit Cabinet** — tableau de bord d'intelligence réseau : CA par correspondant et par acte,
  panier moyen, taux de transformation, classements, segmentation des correspondants, et
  recommandations d'actions.

Tout est **modifiable** : création, modification et suppression de patients, rendez-vous et
correspondants, avec persistance locale (localStorage). Bouton « Réinitialiser la démo » pour
revenir aux données d'origine.

## Lancer en local

Site statique, sans dépendance ni build. Servir le dossier via un serveur HTTP (les modules ES
ne se chargent pas en `file://`) :

```bash
python3 -m http.server 8099
# puis ouvrir http://localhost:8099
```

## Stack

HTML / CSS / JavaScript (modules ES), [Chart.js](https://www.chartjs.org/) (self-hébergé dans
`assets/vendor/`). Polices : Fraunces, Hanken Grotesk, IBM Plex Mono.

```
index.html
assets/
  css/styles.css
  js/
    data.js        données fictives (déterministe)
    store.js       état, CRUD, persistance, KPIs, recommandations
    ui.js          icônes, format, toasts, modale
    charts.js      graphiques (Chart.js)
    app.js         shell, navigation, rôles
    views/         login · praticien · cabinet · composants partagés
  vendor/          Chart.js
```
