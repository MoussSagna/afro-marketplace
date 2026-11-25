# Navbar unique pour toute l'application : validation visuelle

Demande de Mouss (25/11/2026) : la navbar du hero devient celle de **toutes** les pages. Méthode : capturer →
comparer → corriger (3 cycles maximum, règle de [`agents/conventions.md`](../agents/conventions.md)). Captures prises
dans `docs/screenshots/navbar/` pendant le travail, **jamais commitées** et supprimées avant la PR.

## Référence et mesure

- Référence : la navbar de l'accueil après défilement (fond brun, mêmes liens, mêmes boutons).
- Script Playwright : 6 pages × 5 largeurs (1024, 1280, 1440, 1717, mobile 390). Pages : `/recherche`, `/faq`,
  `/connexion`, `/espace/demandes` et `/pro` (compte à deux rôles « Saveurs de Dakar »), `/admin`.
  Mesures : hauteur, position, fond, nombre de lignes, bord droit, chevauchements, débordement horizontal.

## Ce qui a changé

- `Navbar` reçoit `overlay` (accueil seulement : fixe et transparente sur le hero), `spaceLabel` (badge « Espace
  client », « Espace pro », « Admin ») et `children` (bascule client ↔ prestataire). Ailleurs : `sticky`, fond brun
  `foreground` à 95 %, flou.
- Gardé de l'ancien en-tête : « Se connecter » ramène à la page en cours (`/connexion?retour=…`, sauf depuis
  l'accueil) ; « Mon espace » seulement sur les pages publiques ; menu du compte visible aussi sur téléphone.
- `AppHeader` est supprimé ; les 4 gabarits (public, client, pro, admin) utilisent `Navbar`.

## Cycles

**Cycle 1** : navbar collée et brune partout, 72 px (64 sur mobile), aucun passage à la ligne.
Écart : espaces client et pro à 1024 px, **3 à 5 px de débordement** (badge + « Mode pro » + avatar + prénom).
Remarque : aucun lien n'était souligné sur la recherche (seul « Accueil » peut l'être).

**Cycle 2** : prénom du menu du compte affiché à partir de 1280 px (avatar et nom accessible « Menu de … »
inchangés) ; « Prestataires » souligné sur `/recherche`, `/categories/…` et `/prestataires/…`.
Bilan : **30 combinaisons sur 30** sans débordement ni chevauchement, une seule ligne, bord droit dans l'écran.

## Vérifications

| Point                 | Résultat                                                                                 |
| --------------------- | ---------------------------------------------------------------------------------------- |
| Accueil               | ✅ inchangé : transparente puis floutée (tests du hero)                                  |
| Autres pages          | ✅ même navbar, `sticky`, jamais transparente (tests Vitest)                             |
| Espaces               | ✅ badge, bascule de mode, menu du compte (tests Vitest + parcours Playwright existants) |
| Connexion avec retour | ✅ `/connexion?retour=%2Ffaq`, `/connexion?retour=%2Fdevenir-prestataire`                |
| Accessibilité         | ✅ axe-core (pages publiques, espace client), contrastes sur fond brun                   |

## Points restants

- Les boutons « Passer en mode… » affichent le texte court (« Mode pro », « Mode client ») jusqu'à 1280 px.
- Le logo de la navbar est la version claire partout (fond brun) ; le pied de page garde la version foncée.
