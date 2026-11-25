# Section « Deux façons d'utiliser Wenzee » : intégration et validation visuelle

3ᵉ section de l'accueil, sous « Explorez nos univers ». Même méthode que
[`hero-integration-validation.md`](hero-integration-validation.md) : **coder → capturer → comparer → corriger →
recapturer**, 3 cycles maximum (règle dans [`agents/conventions.md`](../agents/conventions.md)).

> Captures : prises dans `docs/screenshots/user-types/` pendant le travail, **jamais commitées** et supprimées avant
> la PR. Ce document garde les mesures, les écarts et les corrections.

## 1. Référence

| Élément                   | Valeur                                                                                            |
| ------------------------- | ------------------------------------------------------------------------------------------------- |
| Maquette                  | Image jointe par Mouss à sa demande du 25/11/2026 (non versionnée)                                |
| Résolution de comparaison | **1717 × 916** (taille exacte de la maquette) ; capture de la section seule                       |
| Autres formats vérifiés   | 1280 et 1024 px de large, tablette 820 × 1180, mobile iPhone 13 (390 px)                          |
| Design system             | `packages/config/tailwind/theme.css` + `agents/conventions.md` : aucune couleur ni police ajoutée |
| Contrainte                | **Aucune photo** : illustrations vectorielles uniquement                                          |

### Analyse de la maquette

| Zone    | Mesures (px)                                                                                                                   |
| ------- | ------------------------------------------------------------------------------------------------------------------------------ |
| En-tête | Centré ; surtitre y ≈ 40 avec un filet de chaque côté ; titre ~52 sur **2 lignes** (y 70 → 165), trait sous « vos événements » |
| Cartes  | x 122 → 845 et 875 → 1597 (≈ 723 de large, écart 30), y 230 → 840 (610 de haut)                                                |
| Carte 1 | Illustration boutique à gauche (x 155 → 305) sur un demi-cercle sable ; contenu à partir de x ≈ 333                            |
| Carte 2 | Contenu à partir de x ≈ 938 ; illustration calendrier à droite (x 1430 → 1565) sur un demi-cercle                              |
| Contenu | Badge (y 263, h 37), titre 2 lignes ~46, description 18, 5 coches (pas de 37), bouton 373 × 58 (y 707), lien (y 800)           |
| Décor   | Motifs géométriques clairs en haut à gauche et en bas à droite                                                                 |

## 2. Développement

- **Données** : `features/home/lib/userTypes.ts` (textes, avantages, liens, illustration et côté de chaque carte).
- **Composants** : `UserTypesSection` (en-tête + décor), `UserTypeCard` (une carte), `UserTypeIllustration`
  (boutique ou calendrier, à partir des icônes lucide `Store`, `CalendarDays`, `CircleCheck`, `Sparkle`, déjà installées).
- **Liens** (routes existantes) : « Référencer mon activité » → `/devenir-prestataire` (P6 puis l'onboarding) ;
  « Organiser mon événement » → `/recherche` ; « Déjà inscrit ? Se connecter » → `/connexion?retour=%2Fpro`
  (prestataire) et `/connexion` (particulier).
- **Mise en page** : boutons poussés en bas de carte (`mt-auto`) → alignés quand les cartes sont côte à côte.
  Colonne d'illustration de 211 px sur tablette et à partir de 1400 px ; entre 1024 et 1399 px et sur téléphone,
  l'illustration passe en petit en haut à droite (le texte garde toute la largeur).

## 3. Cycles

### Cycle 1

| Mesure              | Maquette  | Rendu         |
| ------------------- | --------- | ------------- |
| Titre               | 2 lignes  | **3 lignes**  |
| Haut des cartes (y) | 230       | 297           |
| Cartes              | 723 × 610 | 723 × 619     |
| Boutons (largeur)   | 373 / 388 | **263 / 286** |

**Écarts** :

1. Titre sur 3 lignes (en-tête limité à 896 px, trop étroit pour la 2ᵉ ligne) → cartes trop basses.
2. Boutons trop étroits : le bouton shadcn applique `has-[>svg]:px-3` dès qu'il contient une icône, ce qui écrase
   les marges demandées.
3. À 1280 px, la colonne d'illustration laissait ~290 px au texte : listes et titres sur plusieurs lignes, cartes de
   793 px de haut.
4. Sur la capture, l'en-tête était invisible : **artefact** du script (il masquait toutes les balises `<header>` pour
   cacher la navbar collée). Corrigé dans le script : seule la navbar est masquée.

### Cycle 2

Corrections : en-tête à 1024 px de large ; marges du bouton rétablies (`has-[>svg]:px-…`) ; colonne d'illustration
réservée aux écrans ≥ 1400 px.

**Bilan** : titre sur 2 lignes, cartes à y 245 (maquette 230), boutons 363 et 387 px (maquette 373 et 388).
**Écarts restants** : à 1717 px la colonne d'illustration ne s'appliquait pas (contenu à x 153 au lieu de 333) ;
sur mobile, la carte faisait 364 px pour 358 disponibles (bouton « Organiser mon événement » trop large).

### Cycle 3

Corrections : plage `lg:max-[1399px]:` pour le petit format ; marges du bouton réduites sur téléphone (24 px).

**Bilan** : mobile corrigé (358 px, aucun débordement). La colonne d'illustration ne s'appliquait toujours pas à
1717 px : la vraie cause est `lg:p-8` dans les classes de base de la carte (le raccourci réécrit les 4 marges dès
1024 px et efface `md:pl-[211px]`).

**Correction après le cycle 3** (assumée et signalée) : suppression de `lg:p-8`, redondant avec `sm:p-8`.
Vérifiée par mesure et capture de contrôle : contenu de la carte 1 à **x 332** (maquette 333), boutons alignés
(y 735 pour les deux), aucun débordement sur les 5 formats.

## 4. Résultat final (mesures à 1717 px)

| Mesure              | Maquette         | Rendu                   |
| ------------------- | ---------------- | ----------------------- |
| Surtitre (y)        | 40               | 51                      |
| Titre               | 2 lignes         | 2 lignes                |
| Cartes              | 723 × 610, y 230 | 723 × 619, y 245        |
| Contenu carte 1 (x) | 333              | 332                     |
| Contenu carte 2 (x) | 938              | 906                     |
| Boutons             | 373 / 388 × 58   | 363 / 387 × 58, alignés |

| Point                  | Résultat                                                                                                    |
| ---------------------- | ----------------------------------------------------------------------------------------------------------- |
| Aucune photo           | ✅ tests (pas d'`img` dans la section)                                                                      |
| Liens et boutons       | ✅ tests fonctionnels + Playwright                                                                          |
| Boutons alignés        | ✅ Playwright (même hauteur sur grand écran, cartes empilées sur mobile)                                    |
| Accessibilité          | ✅ axe-core sur l'accueil (desktop et mobile) ; illustrations `aria-hidden` ; cartes nommées par leur titre |
| Débordement horizontal | ✅ aucun (1717, 1280, 1024, tablette, mobile)                                                               |
| Sections précédentes   | ✅ aucun changement ; tous les tests existants passent                                                      |

## 5. Points restants

| Point                                    | Détail                                                                                                                                                                                       |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Contenu de la carte 2 (x 906)            | 32 px plus à gauche que la maquette (938) : même conflit de marges que la carte 1 (`sm:p-8` passe avant `min-[1400px]:pl-[63px]`). Détail mineur, laissé pour respecter la limite de cycles. |
| Coins des cartes                         | 24 px (`rounded-2xl`, le plus grand rayon du design system) contre ~32 sur la maquette.                                                                                                      |
| Couleur des mots mis en valeur           | `title-accent` (rouille, règle du design system pour les grands titres sur fond clair) au lieu de l'orange de la maquette.                                                                   |
| Illustrations                            | Icônes lucide recomposées (boutique + étincelle, calendrier + validation + rayons) : proches de la maquette, pas identiques.                                                                 |
| « Enregistrez vos prestataires favoris » | Les favoris ne sont pas encore construits (page « bientôt disponible », question n° 15).                                                                                                     |
| Bouton de « Explorez nos univers »       | Même piège `has-[>svg]:px-3` : il est plus étroit que prévu (301 px contre ~370). Non modifié ici (autre section).                                                                           |

## 6. Ajustement du 25/11/2026 : fonds unis

Demande de Mouss : un fond différent de la section du dessus, uni, sans les petits motifs en arrière-plan (ici et
dans « Explorez nos univers »).

- « Deux façons d'utiliser Wenzee » : fond **sable clair uni** (`bg-muted`, `#F6ECE1`) ; motifs losanges des coins
  supprimés. Les demi-cercles derrière la boutique et le calendrier restent : ils font partie des illustrations des
  cartes, pas du fond de la section.
- « Explorez nos univers » : fond **ivoire uni** (`bg-background`, `#FDF7F0`) ; cercles sable et motifs losanges
  supprimés.
- Alternance obtenue : hero (sombre) → ivoire → sable clair → ivoire (« Prestataires à la une »).
- Vérifié par capture et mesure (couleur de fond calculée de chaque section, aucun débordement, desktop et mobile).
