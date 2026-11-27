# Page de connexion : refonte et validation visuelle

> Les captures de chaque cycle ont servi à la comparaison mais **ne sont pas versionnées** (règle de Mouss) :
> elles sont dans `docs/screenshots/auth/` le temps de la relecture, puis supprimées avant la PR.
> Ce document garde les mesures, les écarts relevés et les corrections.

Refonte de la page existante `/connexion` (P8) selon la méthode **coder → capturer → comparer → corriger →
recapturer** (3 cycles maximum, [`agents/conventions.md`](../agents/conventions.md)).
**Aucune vraie authentification** : tout passe par le faux serveur MSW déjà en place (`mocks/handlers/auth.ts`),
pas de Firebase, Supabase, Auth0 ni OAuth.

## 1. Référence

| Élément                   | Valeur                                                                                        |
| ------------------------- | --------------------------------------------------------------------------------------------- |
| Maquette                  | Image jointe par Mouss le 27/11/2026 (DJ à gauche, « Bon retour sur Wenzee », non versionnée) |
| Résolution de comparaison | **1536 × 1024** (taille de la maquette), Chromium (Playwright 1.63), animations réduites      |
| Autres formats vérifiés   | Tablette 820 × 1180 (tactile), mobile iPhone 13 (390 × 664, densité 3)                        |
| Design system             | `packages/config/tailwind/theme.css` + `agents/conventions.md` : aucune couleur ajoutée       |

### Analyse de la maquette (avant de coder)

| Zone       | Mesures relevées sur la maquette (px)                                                                                            |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Partage    | Photo x 0 → 728 (≈ moitié), toute la hauteur ; formulaire sur fond ivoire à droite                                               |
| Photo      | Titre blanc 2 lignes (~40, gras) à x 52, y 750 → 840 ; filet orange 76 × 4 ; 3 pastilles sombres translucides (h ~50)            |
| Logo       | Centré, y 65 → 125 (~60 de haut)                                                                                                 |
| En-tête    | Titre ~48 à y 180 ; sous-titre ~20 à y 256                                                                                       |
| Formulaire | x 844 → 1425 (**581**) ; libellés gras ; champs **57** de haut, coins ~12, icône à gauche ; œil à droite (mot de passe)          |
| Actions    | « Mot de passe oublié ? » à droite ; bouton plein brun **58** de haut, en pilule ; « ou » ; Google et Apple en pilule blanche 58 |
| Bas        | « Pas encore de compte ? **Créer un compte** » centré, y 918                                                                     |

### État initial (avant refonte)

`/connexion` était une page de **démo** dans le gabarit public (navbar + pied de page) : titre « Connexion », phrase
« aucun mot de passe n'est nécessaire », 3 cartes de comptes de démo (« Se connecter : Aïssatou, cliente »…).
Pas de formulaire, pas d'inscription, pas de mot de passe oublié **sur le site** — alors que le faux serveur sait
déjà tout faire (lot M5 de l'app mobile) : `signIn`, `signUp` + code, `forgotPassword`, `resetPassword`.

## 2. Ce qui a été fait

| Fichier (`apps/web/src/…`)                                      | Rôle                                                                                                   |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `features/auth/components/AuthLayout.tsx` (nouveau)             | Gabarit écran partagé, sans navbar ni pied de page ; photo collée (`sticky`, `h-dvh`) ; logo → accueil |
| `features/auth/pages/LoginPage.tsx` (refondu)                   | Formulaire email + mot de passe (`useSignIn`), Google / Apple simulés, lien d'inscription, démo        |
| `features/auth/pages/SignUpPage.tsx` (nouveau)                  | `/inscription` : prénom, email, mot de passe (règles en direct), conditions → code `123456`            |
| `features/auth/pages/ForgotPasswordPage.tsx` (nouveau)          | `/mot-de-passe-oublie` : email → code + nouveau mot de passe (`useResetPassword`)                      |
| `features/auth/components/AuthInput.tsx`                        | Champ à icône ; `PasswordInput` avec l'œil (bouton bascule `aria-pressed`)                             |
| `features/auth/components/SocialButtons.tsx`                    | « Continuer avec Google / Apple » : message « bientôt disponible » (comme l'app mobile)                |
| `features/auth/components/DemoAccounts.tsx`                     | Les 3 comptes de démo en un clic (mêmes libellés qu'avant), + rappel du mot de passe `Wenzee2026`      |
| `features/auth/components/AuthHeading.tsx`, `PasswordRules.tsx` | Titre + sous-titre, séparateur « ou », alerte ; règles du mot de passe cochées                         |
| `features/auth/lib/useCompleteSignIn.ts`                        | Après toute connexion : vider le cache, ranger la session, `?retour=` ou l'espace du compte            |
| `app/routes.tsx`                                                | Route parente `AuthLayout` (lazy) : `/connexion`, `/inscription`, `/mot-de-passe-oublie`               |
| `lib/safeRedirect.ts`                                           | Ne renvoie jamais vers une page d'authentification après connexion                                     |
| `components/layout/Navbar.tsx`                                  | « S'inscrire » mène à `/inscription` (avant : `/connexion`)                                            |
| `packages/common/src/utils/authForms.ts` (nouveau)              | Schémas des formulaires (case « conditions » décochée au départ, code, confirmation du mot de passe)   |

## 3. Cycles de comparaison

### Cycle 1 : première intégration

**Conforme** : partage **768 / 768** à 1536 px, photo **768 × 1024** (toute la hauteur, `object-cover`) ;
formulaire **580** de large (maquette 581) ; champs et bouton **56** de haut (maquette 57-58) ; « ou », Google,
Apple, « Créer un compte » ; logo officiel (`Logo`, 209 × 56) ; **0 px** de débordement sur les 3 formats.

**Écarts relevés (par priorité)** :

1. Tablette (820) : colonne photo de 342 px → pastilles empilées, photo écrasée, titre « Bon retour sur Wenzee »
   sur 2 lignes.
2. Ordinateur : titre de la photo sur 3 lignes (maquette : 2 lignes, ~510 px de large).
3. Ordinateur : rythme vertical plus serré que la maquette (logo → titre 32 contre ~55 ; titre → champs ~55 contre ~70).
4. Téléphone : titre de la photo sur 3 lignes en 30 px, qui écrase le bandeau.

### Cycle 2 : corrections 1 à 4

- Écran partagé à partir de **1024 px** ; en dessous (téléphone, tablette en portrait), photo en bandeau
  (224 / 320 px) au-dessus du formulaire, pastilles visibles dès 640 px.
- Titre de la photo jusqu'à 540 px de large en 42 px (2 lignes) ; 22 px sur téléphone (2 lignes).
- Écarts verticaux 40 px sur ordinateur (au lieu de 32), marges haut / bas de 64 px.

**Bilan** : tablette avec formulaire de 580 px centré ; ordinateur logo à y 64 et titre à y 160 (maquette 65 / 180).
**Reste** : téléphone, beaucoup d'espace entre bandeau, logo et titre → premier champ à 502 px (écran de 664).

### Cycle 3 : correction finale

- Téléphone : marges et écarts réduits (28 / 24 px), logo 40 px de haut.

**Bilan** : premier champ à **462 px** sur téléphone. Captures finales de `/connexion`, `/inscription` et
`/mot-de-passe-oublie` aux 3 formats.

## 4. Résultat final

| Point                  | Résultat                                                                                             |
| ---------------------- | ---------------------------------------------------------------------------------------------------- |
| Ordinateur 1536 × 1024 | Photo 768 × 1024 collée au défilement ; formulaire 580 ; champs / boutons 56 ; logo 209 × 56         |
| Tablette 820           | Bandeau photo 820 × 320 (titre, filet, pastilles) ; formulaire 580 centré                            |
| Téléphone 390          | Bandeau 390 × 224 ; formulaire pleine largeur (350) ; boutons de 56 ; **0 px** de débordement        |
| Connexion simulée      | ✅ email + mot de passe (`Wenzee2026` pour les comptes de démo) ; erreurs du serveur ; chargement    |
| Validation             | ✅ messages des schémas partagés (« Adresse email invalide », « Indique ton mot de passe »…)         |
| Afficher / masquer     | ✅ bouton œil, `aria-pressed`                                                                        |
| Redirection            | ✅ `?retour=` gardé entre connexion, inscription et mot de passe oublié ; sinon l'espace du compte   |
| Création de compte     | ✅ `/inscription` → code `123456` → session → espace client                                          |
| Mot de passe oublié    | ✅ `/mot-de-passe-oublie` → code + nouveau mot de passe → session                                    |
| Google / Apple         | ✅ simulés : message « bientôt disponible », aucune connexion                                        |
| Comptes de démo        | ✅ toujours en un clic (mêmes libellés : les parcours Playwright existants n'ont pas changé)         |
| Accessibilité          | ✅ axe-core sans violation sérieuse sur les 3 pages                                                  |
| Tests                  | Vitest `web` 40 fichiers / 258 tests, `common` 386 tests ; Playwright 140 réussis (desktop + mobile) |

## 5. Écarts assumés et points non résolus

| Écart                                                | Pourquoi                                                                                                       |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Photo : soirée (danseuse) au lieu d'un DJ            | Aucune photo de DJ dans les assets ; `hero/soiree.webp` a la même ambiance (lumières chaudes). Question n° 25  |
| Logo : le logo officiel                              | Consigne : pas le logo généré de la maquette (`Logo`, `/wenzee-logo.svg`)                                      |
| Titres en Playfair Display                           | Design system (h1–h3) ; la maquette utilise une linéale grasse                                                 |
| « Créer un compte » en brun souligné (pas orange)    | L'orange rouille (`title-accent`) ne fait 3,9:1 qu'à partir de 24 px ; le lien fait 17 px (WCAG AA)            |
| Bloc « Version de démonstration » sous le lien       | Absent de la maquette, gardé : c'est l'ancienne connexion de démo (et les parcours e2e s'en servent)           |
| Pas de navbar ni de pied de page                     | Comme la maquette ; le logo ramène à l'accueil                                                                 |
| Pages inscription et mot de passe oublié en 2 étapes | Même parcours simulé que l'app mobile (code de vérification)                                                   |
| Motif décoratif du coin bas droit                    | Non repris (aucun asset)                                                                                       |
| Tablette en portrait : photo en bandeau              | Un 50/50 à 820 px donnait une colonne photo de 342 px illisible ; écran partagé dès 1024 px (tablette paysage) |
