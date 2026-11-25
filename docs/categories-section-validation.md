# Section « Explorez nos univers » : intégration et validation visuelle

2ᵉ section de l'accueil, sous le hero. Même méthode que
[`hero-integration-validation.md`](hero-integration-validation.md) : **coder → capturer → comparer → corriger →
recapturer**, 3 cycles maximum (règle dans [`agents/conventions.md`](../agents/conventions.md)).

> Captures : prises dans `docs/screenshots/categories/` pendant le travail, **jamais commitées** et supprimées avant la PR
> (règle de Mouss, voir `agents/conventions.md`).
> Ce document garde les mesures, les écarts et les corrections.

## 1. Référence

| Élément                   | Valeur                                                                                            |
| ------------------------- | ------------------------------------------------------------------------------------------------- |
| Maquette                  | Image jointe par Mouss à sa demande du 25/11/2026 (non versionnée)                                |
| Résolution de comparaison | **1726 × 911** (taille exacte de la maquette) ; capture de la section seule                       |
| Autres formats vérifiés   | 1280 × 900, tablette 820 × 1180, mobile iPhone 13 (390 px)                                        |
| Design system             | `packages/config/tailwind/theme.css` + `agents/conventions.md` : aucune couleur ni police ajoutée |
| Outil                     | Script Playwright : capture + position et taille de chaque bloc et de chaque carte                |

### Analyse de la maquette

| Zone     | Mesures (px)                                                                                               |
| -------- | ---------------------------------------------------------------------------------------------------------- |
| Texte    | x 77 → 610 ; surtitre y ≈ 202 (filet + texte terre) ; titre 2 lignes y 260 → 380 ; description y 425 → 465 |
| Bouton   | Pilule terre 370 × 62 à y ≈ 513, flèche à droite                                                           |
| Mosaïque | x 637 → 1673, y 93 → 809 (1036 × 716) ; 3 colonnes égales (~335), écart ~14 ; lignes 257 / 260 / 170       |
| Carte DJ | Colonne 1, lignes 1 et 2 (343 × 531) : la carte dominante                                                  |
| Cartes   | Coins ~24 ; dégradé sombre en bas ; nom blanc en gras (~26) en bas à gauche                                |
| Décor    | Fond ivoire, grands cercles sable, motif géométrique clair en haut et en bas à gauche                      |

## 2. Développement

- **Données centralisées** : `features/home/lib/homeCategories.ts` (les 8 catégories : nom + slug du catalogue), utilisé
  par les raccourcis du hero (icônes) **et** par la mosaïque (`lib/categoryMosaic.ts` : photo, cadrage, place).
- **Composants** : `ExploreCategoriesSection` (texte + décor), `CategoryMosaic` (grille), `CategoryImageCard` (carte).
- **Grille** : téléphone 2 colonnes (DJ et Décoration sur toute la largeur) ; à partir de 768 px, 3 colonnes avec la
  carte DJ sur 2 lignes et des lignes proportionnelles à la maquette (`257fr 260fr 170fr`, rapport 1036/716).
- **Liens** : slugs réels du catalogue (`/recherche?categorie=dj`, `traiteurs`, `danse`, `beaute`,
  `location-de-tenues`, `speakers`, `spectacle`, `decoration`), comme les raccourcis du hero.
- **Images** : WebP, `loading="lazy"` (la section est sous le hero : rien ne ralentit le premier affichage),
  dimensions réelles, `srcset` quand il existe.

## 3. Cycles

### Cycle 1

| Mesure          | Maquette            | Rendu              |
| --------------- | ------------------- | ------------------ |
| Mosaïque        | 637,93 · 1036 × 716 | 635,93 · 996 × 689 |
| Cartes (lignes) | 257 / 260 / 170     | 247 / 250 / 163    |
| Texte (x)       | 77                  | 95                 |
| Titre           | 2 lignes            | **3 lignes**       |
| Surtitre (y)    | 202                 | 214                |
| Bouton          | 370 × 62            | 278 × 62           |

**Écarts** : titre sur 3 lignes (trop grand pour la colonne) ; conteneur trop étroit (texte trop à droite, mosaïque
trop petite) ; bloc texte centré verticalement alors qu'il est un peu plus haut sur la maquette ; bouton trop petit.
Sur mobile : composition conforme ; deux cartes vides sur la capture (voir cycle 2).

### Cycle 2

Corrections : conteneur 1660 px ; titre `clamp(2rem, 2.8vw, 3.15rem)` et « univers événementiels » sans retour à la
ligne sur desktop ; bloc texte remonté (`pb-[120px]`) ; bouton en gras.

| Mesure          | Maquette            | Rendu                   |
| --------------- | ------------------- | ----------------------- |
| Mosaïque        | 637,93 · 1036 × 716 | 625,93 · **1036 × 716** |
| Cartes (lignes) | 257 / 260 / 170     | **257 / 260 / 170**     |
| Surtitre (y)    | 202                 | **202**                 |
| Titre           | 2 lignes            | **2 lignes**            |
| Bouton (y)      | 513                 | 518                     |

Cartes Danse et Mode vides sur la capture mobile : **artefact de capture**, pas un bug. Les images sont chargées
(`complete`, bon fichier) et s'affichent sur une capture d'écran normale ; c'est la capture d'un élément de
5 493 px de haut en densité ×3 qui ne les peint pas. Captures mobiles suivantes en densité ×1.

### Cycle 3

Bouton : texte 19 px, marges 40 px → 301 × 62 (maquette ~370 : la police de la maquette est plus large qu'Inter).

**Résultat** : composition, dimensions de la mosaïque et des cartes, alignements et rythme conformes à la maquette ;
tablette (texte au-dessus, mosaïque 3 colonnes) et mobile (DJ en grand, cartes par deux, Décoration en large)
recomposés ; aucun débordement horizontal (4 formats).

## 4. Vérifications

| Point                    | Résultat                                                                                      |
| ------------------------ | --------------------------------------------------------------------------------------------- |
| Liens des 8 cartes       | ✅ tests fonctionnels + Playwright (« Mode » → `/recherche?categorie=location-de-tenues`)     |
| Carte DJ dominante       | ✅ Playwright (hauteur ≥ 1,5 × une carte ; toute la largeur sur mobile)                       |
| Pas d'icône de catégorie | ✅ test : aucune icône dans la mosaïque                                                       |
| Accessibilité            | ✅ axe-core sur l'accueil (desktop et mobile) ; focus visible ; photos décoratives (`alt=""`) |
| Survol                   | ✅ carte soulevée + zoom de la photo ; rien ne bouge avec « réduire les animations »          |
| Images                   | ✅ chargement différé, WebP ; ~350 Ko au total sous la ligne de flottaison                    |
| Hero                     | ✅ aucun changement visuel ; ses tests passent (les catégories viennent de la même source)    |

## 5. Points restants

| Point                              | Détail                                                                                                                                                                                                                                    |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Photos provisoires**             | Aucune photo de **DJ** ni de **mode** dans le projet : « Musique & DJ » utilise la photo de soirée du hero, « Mode » la photo de célébration recadrée sur les tenues wax. À remplacer (une ligne par photo dans `lib/categoryMosaic.ts`). |
| Photos en 320 px                   | Traiteur, Beauté, Speaker, Show, Décoration : vignettes de l'app (320 × 320), un peu floues sur écran haute densité. Prévoir ~700 px de large (1 000 px pour la carte DJ).                                                                |
| « Voir toutes les catégories »     | Il n'existe pas de page listant toutes les catégories : le bouton mène à `/recherche` (tous les prestataires).                                                                                                                            |
| Bouton plus étroit que la maquette | 301 px contre ~370 : police Inter (design system) plus étroite que celle de la maquette.                                                                                                                                                  |

## 6. Ajustement du 25/11/2026 : fond uni

À la demande de Mouss, la section n'a plus de décor (cercles sable, motifs losanges) : fond ivoire uni
(`bg-background`). La section suivante, « Deux façons d'utiliser Wenzee », a un fond sable clair pour s'en distinguer
(voir `user-types-section-validation.md`, section 6).
