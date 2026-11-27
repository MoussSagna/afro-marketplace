# Page de résultats des prestataires : refonte et validation visuelle

> Les captures de chaque cycle ont servi à la comparaison mais **ne sont pas versionnées** (règle de Mouss) :
> elles étaient dans `docs/screenshots/vendor-search/` le temps de la relecture, puis ont été supprimées avant la PR.
> Ce document garde les mesures, les écarts relevés et les corrections.

Refonte de la page existante `/recherche` (P2), partagée avec les pages catégorie `/categories/:slug` (P4), selon la
méthode **coder → capturer → comparer → corriger → recapturer** (3 cycles maximum,
[`agents/conventions.md`](../agents/conventions.md)). Aucune nouvelle logique de recherche : les filtres, le tri et la
pagination passent toujours par l'adresse (`useSearchFilters`).

## 1. Référence

| Élément                   | Valeur                                                                                                   |
| ------------------------- | -------------------------------------------------------------------------------------------------------- |
| Maquette                  | Image jointe par Mouss le 26/11/2026 (« 42 DJs trouvés », non versionnée)                                |
| Résolution de comparaison | **1536 × 1024** (taille de la maquette), Chromium (Playwright 1.63), animations réduites                 |
| Autres formats vérifiés   | Tablette 820 × 1180 (tactile), mobile iPhone 13 (390 × 664, densité 3)                                   |
| Page de test              | `/recherche?categorie=musique-animation` (10 prestataires, données de démo)                              |
| Design system             | `packages/config/tailwind/theme.css` + `agents/conventions.md` (section Design) : aucune couleur ajoutée |

### Analyse de la maquette (avant de coder)

| Zone             | Mesures relevées sur la maquette (px)                                                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Barre du haut    | (remplacée par la recherche de l’accueil, section 6) 3 pilules blanches de 53 de haut (395, 347 et 335 de large) + bouton orange 210 × 53 ; ombre douce |
| Colonne filtres  | x 50 → 350 (**300** de large), carte blanche arrondie ; « Filtres » + « Réinitialiser », sections séparées par des filets                               |
| En-tête résultat | « 42 DJs trouvés » (~32 px, gras, brun) ; « Trier par » + liste en pilule ; Liste / Grille (actif plein, brun)                                          |
| Cartes           | 3 colonnes x 373 → 1486, écart ~21 ; carte **360 × 635** ; photo intérieure **338 × 372** (marge ~10), coins ~22                                        |
| Sur la photo     | Pastille de catégorie en haut à gauche (crème) ; cœur dans un rond en haut à droite                                                                     |
| Sous la photo    | Nom ~26 px gras + badge vérifié ; ville (~17 px, épingle) ; ★ note (n avis) ; 2 lignes de description ; pastilles + « +2 »                              |
| Pagination       | Ronds de 40 : ←, 1 (actif plein brun), 2…5, →, centrés                                                                                                  |

### État initial (avant refonte)

Capture `0-initial-*` : filtres en longue colonne de champs (catégorie, ville, date, budget, invités, note, pros
vérifiés, 14 origines groupées par région), cartes à **photo de 160 px de haut**, **prix** (« Dès 350 € » / « Sur
devis »), note en 5 étoiles, pagination « Précédent / Page 1 sur 3 / Suivant », pas de mode Liste, pas de favoris.

## 2. Ce qui a été fait

| Composant                                                                     | Rôle                                                                                        |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `search/components/ResultsSearchBar.tsx` (nouveau)                            | Barre du haut : prestation, ville (suggestions `POPULAR_CITIES`), date, « Rechercher »      |
| `search/components/SearchFilters.tsx`                                         | Colonne de filtres réorganisée en sections ; « Réinitialiser » ; « Voir plus » des origines |
| `search/components/SearchResults.tsx`                                         | Assemblage, en-tête des résultats, panneau de filtres mobile (Dialog), grille / liste       |
| `search/components/ProviderCard.tsx`                                          | Carte verticale à grande photo (grille) ou horizontale (liste) ; sans prix ni bouton        |
| `search/components/FavoriteButton.tsx` (nouveau)                              | Cœur bascule (`aria-pressed`), au-dessus du lien de la carte                                |
| `search/components/ViewToggle.tsx` (nouveau)                                  | Liste / Grille                                                                              |
| `search/components/Pagination.tsx` (nouveau)                                  | Flèches + numéros (« … » au-delà de 7 pages)                                                |
| `search/lib/resultsView.ts`, `pageRange.ts`, `stores/favorites.ts` (nouveaux) | Mode d'affichage retenu, numéros de page, favoris (localStorage)                            |
| `components/Rating.tsx`                                                       | Variante `compact` : « ★ 4,9 (127 avis) »                                                   |
| `common` : `summarize`, `providerCardSchema.summary`                          | Une phrase de la bio sur la carte (seul ajout côté données, facultatif)                     |

## 3. Cycles de comparaison

### Cycle 1 : première intégration

**Conforme** : barre (pilules 392 / 341 / 341 + bouton 212, hauteur 52 contre 53) ; colonne x 48 → 348 (300 de
large) ; 3 colonnes x 370 → 1488 ; **photo 338 × 372** (identique) ; pastille et cœur sur la photo ; Liste / Grille ;
aucun débordement horizontal sur les 3 formats.

**Écarts relevés (par priorité)** :

1. **Bug** : la prestation de l'adresse n'était pas présélectionnée (« Toutes les prestations » affiché) : la liste
   déroulante se montait avant l'arrivée des catégories, sa valeur par défaut était perdue.
2. Colonne : double filet sous « Filtres » ; le filet des sections à `<fieldset>` était coupé par la `<legend>`.
3. Cartes plus courtes : 591 contre 635 (nom 22 px contre ~26, ville et note 15 contre ~17, pastilles plus petites).
4. « Note minimale » sur 2 lignes (une seule sur la maquette).
5. Mobile : barre du haut sur 4 lignes et barre d'outils sur 2 lignes → 1re carte à 496 px du haut.

### Cycle 2 : corrections 1 à 5

- Formulaire recréé une fois les catégories chargées (clé `categories.isSuccess`) + test « présélectionne la prestation ».
- Filet porté par un `<div>` autour de chaque section ; plus de filet sous l'en-tête.
- Nom 26 px, ville et note 17 px, pastille de catégorie et pastilles agrandies, cœur 48 px.
- Note minimale en sélecteur segmenté sur une ligne (Toutes / ★ 4+ / ★ 4,5+, libellés complets pour les lecteurs d'écran).
- Mobile : ville et date côte à côte, bouton 44 px ; barre d'outils sur une ligne (libellé « Trier par » masqué
  visuellement, Liste / Grille en icônes).

**Bilan** : carte **634 × 358** (maquette 635 × 360) ; mobile : 1re carte à 380 px (au lieu de 496).
**Restent** : badge vérifié rejeté à droite quand le nom passe sur 2 lignes ; pas d'espace entre « Origine culturelle »
et la 1re case ; mobile : texte d'aide de la ville coupé.

### Cycle 3 : corrections finales

- Badge vérifié en ligne avec le texte du nom (il suit le dernier mot).
- Marge propre sous les `<legend>` (elles ignorent l'écart de la grille).
- Texte d'aide de la ville raccourci (« Ville »).

**Bilan** : composition, alignements et dimensions conformes à quelques pixels près. Captures complémentaires :
mode Liste (ordinateur et téléphone), panneau de filtres (téléphone), favori actif, pagination.

## 4. Résultat final

| Point                      | Résultat                                                                                            |
| -------------------------- | --------------------------------------------------------------------------------------------------- |
| Mesures ordinateur 1536 px | Barre 1344 × 52 ; colonne 300 ; cartes 358 × 634 ; photos 338 × 372 ; 3 colonnes                    |
| Tablette 820 px            | 2 colonnes (photos 356 × 392), filtres en panneau, barre sur 3 lignes                               |
| Téléphone 390 px           | 1 colonne, photo 338 × 372, filtres en panneau latéral, barre sur 3 lignes, **0 px** de débordement |
| Recherche, filtres, tri    | ✅ inchangés (adresse) ; la barre du haut garde les autres filtres (test)                           |
| Liste / Grille             | ✅ instantané, ne touche pas à l'adresse, retenu au rechargement (tests Vitest + Playwright)        |
| Favoris                    | ✅ cœur bascule, n'ouvre pas le profil, gardé au rechargement                                       |
| Navigation vers le profil  | ✅ toute la carte est cliquable (un seul lien, sur le nom)                                          |
| Pagination                 | ✅ mêmes `?page=` ; numéros, page active `aria-current="page"`                                      |
| Accessibilité              | ✅ axe-core sans violation sérieuse sur `/recherche` ; parcours clavier testé (cœur → nom → Entrée) |
| Tests                      | Vitest `common` 38 fichiers, `web` 37 fichiers ; Playwright 115 réussis (desktop + mobile)          |

## 5. Écarts assumés et points non résolus

| Écart                                                        | Pourquoi                                                                                                                                       |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Pas de Distance, Budget min, Styles musicaux                 | Absents du modèle de données : on n'invente pas de faux filtres. Question n° 22 dans `agents/questions-ouvertes.md`                            |
| Pas de « Localisation » dans la colonne                      | La ville est dans la barre du haut : un 2ᵉ champ ville ferait doublon                                                                          |
| Pas de compteurs « (42) » à côté des cases                   | L'API ne renvoie pas de comptage par filtre                                                                                                    |
| Pastilles = origines culturelles                             | Pas de « styles musicaux » dans les données ; les origines sont les spécialités disponibles pour toutes les catégories                         |
| Titre « 10 prestataires trouvés » en Playfair                | Les titres h1–h3 sont en Playfair Display (design system) ; la maquette utilise une linéale grasse                                             |
| Cœur blanc à icône brune (maquette : rond sable, cœur blanc) | Un cœur blanc sur sable ne fait pas 3:1 de contraste (WCAG 1.4.11) ; plein quand il est actif                                                  |
| Barre de navigation au-dessus                                | La maquette ne la montre pas ; la navbar commune reste (règle : une seule navbar)                                                              |
| Titre h1 « Rechercher un prestataire »                       | Gardé pour les lecteurs d'écran et Google, masqué visuellement (la maquette n'a pas de titre au-dessus de la barre)                            |
| Date au format du navigateur                                 | Champ date natif (accessible, calendrier du système) : pas de texte « Date de l'événement » dedans                                             |
| Photos                                                       | Photos de démo aléatoires (picsum, question n° 19) : pas de portraits de DJ comme sur la maquette                                              |
| Motifs décoratifs dans les coins                             | Non repris (décor de la maquette, aucun asset)                                                                                                 |
| Ordre clavier : cœur puis nom                                | Le cœur est en haut de la photo, donc lu avant le nom ; testé                                                                                  |
| Description sur une ligne pour beaucoup de profils           | La phrase vient de la 1re phrase de la bio de démo, souvent courte                                                                             |
| Nom très long                                                | Le badge vérifié peut passer seul à la ligne quand le nom remplit exactement la largeur (rare, vu sur « Awa Diallo, conférencière » à 1536 px) |

## 6. Ajustements du 26/11/2026 (retours de Mouss)

1. **« Reprends la searchbar de la homepage, je veux la même »** : la barre en 3 pilules séparées (maquette) est
   remplacée par la recherche guidée de l'accueil (`SearchPill` + `MobileSearch`, mêmes composants, même largeur
   1120 px). Seule l'action de « Rechercher » change sur la page de résultats (`GuidedSearchActionContext`) : la page
   se met à jour et garde origines, note, budget et tri. Le brouillon reprend les filtres de l'adresse
   (`draftFromFilters`). Écart assumé avec la maquette, à la demande de Mouss.
2. **« La partie filtre doit être statique au scroll »** : colonne `sticky` à 96 px du haut (place de la navbar quand
   elle réapparaît). Mesuré : la colonne reste à y = 96 en défilant de 600 et 1 500 px (1536 × 1024), ne remonte qu'en
   arrivant au pied de page ; en 1280 × 720, elle fait 600 px de haut et défile en interne (contenu 718 px).
   Test Playwright ajouté.

Vérifications après ajustements : Vitest `web` 214 tests, Playwright 118 réussis, aucun débordement horizontal sur
téléphone.
