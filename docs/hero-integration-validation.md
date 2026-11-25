# Hero plein écran de l'accueil : intégration et validation visuelle

> Les captures de chaque cycle ont servi à la comparaison mais **ne sont pas versionnées** (choix de Mouss) :
> ce document garde les mesures, les écarts relevés et les corrections.

Ce document trace l'intégration du hero de l'accueil Wenzee (P1) selon la méthode
**coder → capturer → comparer → corriger → recapturer**, limitée à **3 cycles**.
Aucun document de méthodologie visuelle n'existait avant celui-ci ; la règle générale est désormais
résumée dans [`agents/conventions.md`](../agents/conventions.md) (section « Validation visuelle »).

## 1. Référence

| Élément                    | Valeur                                                                                                                                |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Maquette                   | Image jointe par Mouss à sa demande du 25/11/2026 (non versionnée)                                                                    |
| Résolution de comparaison  | **1671 × 941** (taille exacte de la maquette), Chromium (Playwright 1.63)                                                             |
| Autres formats vérifiés    | Tablette 820 × 1180 (tactile), mobile iPhone 13 (390 × 664, densité 3)                                                                |
| Design system              | `packages/config/tailwind/theme.css` + `agents/conventions.md` (section Design) : aucune couleur ni police ajoutée                    |
| Captures (non versionnées) | Prises avec « réduire les animations » pour figer le cadrage (pas de zoom lent en cours) ; le bouton pause n'apparaît donc pas dessus |

### Analyse de la maquette (avant de coder)

| Zone        | Mesures relevées sur la maquette (px)                                                                                        |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Navbar      | ~80 de haut ; logo à x ≈ 70 ; liens centrés (x 370 → 1095) ; cœur, « Se connecter » (contour blanc), « S'inscrire » (soleil) |
| Texte       | Aligné à x ≈ 157 ; surtitre y ≈ 165 avec filet orange ; titre serif sur 3 lignes (interligne ~65) ; description 2 lignes     |
| Mot accent  | « vos événements. » en orange, trait manuscrit dessous                                                                       |
| Recherche   | Pilule blanche x 140 → 1532 (1392 de large), y 525 → 622 ; 3 champs séparés par des traits ; bouton soleil 270 × 68          |
| Catégories  | 8 tuiles ~120 × 85 en verre brun (y 655 → 740), libellé dessous (y ≈ 759)                                                    |
| Pagination  | y ≈ 824, centrée : pilule active + 2 points                                                                                  |
| Bas de page | Vague ivoire (~80 au centre) + bandes de motif géométrique sur les côtés ; losanges discrets à gauche (y 100 → 400)          |
| Photo       | Couple cadré à droite, dégradé brun chaud vers la gauche                                                                     |

## 2. Étapes de développement

1. Lecture de `agents/` (produit, architecture, conventions, commandes) et du thème.
2. Inventaire des assets : 2 photos grand format au départ (photo du mariage fournie par Mouss, `banniere-accueil.webp`
   de l'app ; la 3ᵉ, « célébration », a été fournie lors de l'ajustement de la section 6), le logo (versions claire et foncée déjà présentes dans l'app mobile), **aucun motif ni icône SVG de
   catégorie** dans le projet → icônes `lucide-react` (déjà installé) et motifs dessinés en SVG avec les couleurs du thème.
3. Optimisation des photos en WebP (encodées par Chromium) : 270 Ko (1536 px) et 128 Ko (900 px, téléphones).
4. Composants : `Navbar`, `HeroSection`, `HeroCarousel`, `CarouselControls`, `SearchBar`, `CategoryShortcuts`, `HeroDecor`
   (détail dans [`agents/architecture.md`](../agents/architecture.md)).
5. Trois cycles de capture et correction (ci-dessous), puis tests unitaires, fonctionnels et Playwright.

## 3. Cycles de comparaison

### Cycle 1 : première intégration

**Conforme** : navbar transparente et positions des liens ; surtitre (y 161 / 165) ; titre (157 → 760 contre 157 → 757) ;
description ; recherche (y 532 → 628 contre 525 → 622) ; pagination (y 825 / 824) ; navbar collée et floutée au
défilement ; aucun débordement horizontal (vérifié sur les 3 formats).

**Écarts relevés (par priorité)** :

1. Vague du bas : bande ivoire trop fine (~20 px contre ~80) et motif géométrique trop massif.
2. Catégories 10 px trop bas, icônes plus petites (40 contre ~50 px), libellés trop loin des tuiles.
3. Mobile et tablette : cassure horizontale visible à la fin de la photo (le voile chaud ne couvrait pas la même zone
   que le dégradé).
4. Mobile : surtitre sur 2 lignes.

### Cycle 2 : corrections 1 à 4

- Catégories : marge haute 32 → 24 px, écart tuile / libellé 14 → 10 px, icônes 40 → 48 px.
- Voile chaud déplacé dans le conteneur de la photo (même zone que le dégradé).
- Surtitre mobile : 11 px, interlettrage réduit.
- Vague : bandes de motif en biseau, ivoire plus haut.

**Bilan** : catégories alignées (tuiles y 657 → 742, libellés y 761 contre 655 → 740 / 759) ; cassure disparue ;
surtitre mobile sur une ligne. **Restent** : ivoire encore trop bas au centre (~55 px) et qui se creuse à droite ;
sur tablette, la bande de catégories colle au bord gauche (l'aimantation du défilement ignorait la marge).

### Cycle 3 : corrections finales

- Vague redessinée à partir des points mesurés sur la maquette (ivoire ~80 px au centre, bandes effilées à gauche et
  à droite).
- Catégories : `scroll-padding` égal à la marge de page.

**Bilan** : composition, alignements et dimensions conformes à la maquette à quelques pixels près. Les écarts
restants sont listés en section 5.

## 4. Résultat final

Vérifications :

| Point                             | Résultat                                                                                                      |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Navbar transparente au chargement | ✅ fond `rgba(0, 0, 0, 0)` (test Playwright `hero.spec.ts`)                                                   |
| Sticky + flou au défilement       | ✅ `position: fixed`, `backdrop-filter: blur(…)`, transition de 300 ms                                        |
| Hero plein écran                  | ✅ hauteur ≥ hauteur de l'écran (`min-h-svh`), desktop et mobile                                              |
| Carrousel                         | ✅ 3 ambiances, fondu 1,2 s, zoom lent 5 s, auto toutes les 6 s, points, flèches clavier, balayage au doigt   |
| Pause                             | ✅ survol ou focus sur la recherche / catégories / pagination, onglet masqué, bouton pause / lecture          |
| `prefers-reduced-motion`          | ✅ ni défilement automatique, ni zoom, ni fondu (test Playwright)                                             |
| Recherche                         | ✅ mène à `/recherche?categorie=…&ville=…&date=…` (tests fonctionnels)                                        |
| Catégories                        | ✅ 8 liens vers la recherche filtrée                                                                          |
| Débordement horizontal            | ✅ 0 px sur les 3 formats                                                                                     |
| Accessibilité                     | ✅ axe-core sans violation sérieuse (desktop et mobile), focus visibles, cibles tactiles ≥ 44 px sur mobile   |
| Performance                       | ✅ 1re photo prioritaire (`fetchpriority="high"`, `srcset`), les 2 autres chargées après elle ; motifs en SVG |

## 5. Écarts assumés et points non résolus

| Écart                                                                                      | Pourquoi                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Texte foncé sur les boutons soleil (« S'inscrire », « Rechercher »), blanc sur la maquette | Le design system impose `cta-foreground` (8:1) : le blanc sur `#F0A422` ne fait que ~2:1 (illisible, refusé par l'audit d'accessibilité)                                    |
| Police du titre                                                                            | Playfair Display (police de titre du design system) ; la maquette utilise un autre serif, plus massif                                                                       |
| Cadrage de la photo                                                                        | La maquette est plus serrée sur le couple (arrière-plan flou) ; la photo fournie est plus large : invités et drapeau visibles à droite                                      |
| Icônes de catégories                                                                       | Aucune icône SVG de catégorie dans les assets : icônes `lucide-react` les plus proches (pas de danseur, de tête enrubannée ni de robe chez lucide)                          |
| Motifs                                                                                     | Aucun motif dans les assets : losanges (repris du losange du logo) et bande géométrique dessinés en SVG avec les couleurs du thème                                          |
| Bouton pause à côté de la pagination                                                       | Absent de la maquette, mais exigé par l'accessibilité (WCAG 2.2.2) pour un contenu qui défile seul                                                                          |
| Événements, Offres & Deals, Favoris                                                        | Hors du MVP : pages « bientôt disponible » (`/evenements`, `/offres`, `/favoris`). « S'inscrire » mène à la connexion de démo (pas d'inscription au MVP)                    |
| Mobile                                                                                     | Pas de maquette mobile : composition portrait conçue ici (photo en haut, texte dessous, recherche verticale) ; la recherche est sous la ligne de flottaison sur petit écran |

## 6. Ajustement du 25/11/2026 : navbar et barre de recherche

Retour de Mouss après la 1re livraison : textes de la navbar trop grands (tout doit tenir sur une ligne), barre de
recherche trop large. Il a aussi fourni une **3ᵉ photo** (couple enlacé, invités qui applaudissent) pour l'ambiance
« Célébration », qui recadrait jusque-là la photo du mariage. Même méthode, **2 cycles** (sur 3 autorisés).

### Mesures avant correction

Un script Playwright mesure, à 5 largeurs, les éléments de la navbar (retour à la ligne, chevauchement, bord droit)
et la recherche.

| Largeur | Navbar                                                                                         | Recherche                   |
| ------- | ---------------------------------------------------------------------------------------------- | --------------------------- |
| 1024    | « Offres & Deals » et « Notre mission » sur 2 lignes ; **sort de l'écran** (bord droit à 1080) | 1024 × 97, collée aux bords |
| 1280    | « Offres & Deals » et « Notre mission » sur 2 lignes                                           | 1280 × 97, collée aux bords |
| 1440    | « Offres & Deals » et « Notre mission » sur 2 lignes                                           | 1392 × 97                   |
| 1671    | une ligne, mais textes 17–18 px et boutons de 48 px de haut, très présents                     | 1392 × 97                   |

### Cycle 1

- **Navbar**, tailles par palier d'écran, sans rien retirer : liens 14 px (≥ 1024), 15 px (≥ 1280), 16 px (≥ 1536),
  sans retour à la ligne ; écarts 16 → 28 → 36 px ; boutons « Se connecter » / « S'inscrire » 40 px de haut (44 px dès 1280) ; logo 40 px (48 px dès 1536).
- **Recherche** : 1120 px maximum (au lieu de 1392), hauteur 84 px (au lieu de 97), alignée à gauche sur le bloc de
  texte ; champs plus serrés (icônes 24 px, marges 20–24 px), bouton 28–36 px de marge ; marges latérales de 32 px
  en desktop (elle touchait les bords sous 1392 px).

**Bilan** : navbar sur une ligne à toutes les largeurs. **Écarts** : « Que recherchez-vous ? » passe sur 2 lignes
(le « ? » tombe seul) ; à 1280 px, le motif losanges passe sous le surtitre et le titre.

### Cycle 2

- Libellés des champs sur une ligne (`truncate`), 1er champ un peu plus large (`flex-[1.25]`) ; chevrons masqués
  entre 1024 et 1279 px pour laisser la place au texte.
- Motif losanges affiché seulement à partir de 1600 px (en dessous, il passait sous le texte).

Mesures finales :

| Largeur | Navbar                      | Recherche              | Textes des champs        |
| ------- | --------------------------- | ---------------------- | ------------------------ |
| 1024    | une ligne, bord droit à 992 | 32 → 992 (960 × 84)    | une ligne, aucun tronqué |
| 1280    | une ligne                   | 32 → 1152 (1120 × 84)  | une ligne, aucun tronqué |
| 1440    | une ligne                   | 32 → 1152 (1120 × 84)  | une ligne                |
| 1671    | une ligne                   | 140 → 1260 (1120 × 84) | une ligne, aucun tronqué |
| 1920    | une ligne                   | 264 → 1384 (1120 × 84) | une ligne                |

Tablette et mobile : aucun débordement horizontal, rendu identique à la 1re livraison.

### Nouvelle 3ᵉ photo

`public/images/hero/celebration.webp` (1600 px, 162 Ko) et `celebration-900.webp` (56 Ko) ; cadrage sur le couple.
Le fonctionnement du carrousel n'a pas changé.

### Écart restant

La recherche (1120 px, alignée sur le texte) était plus étroite que la rangée des catégories : réglé par la section 7
(texte et recherche centrés).

## 7. Ajustement du 25/11/2026 : texte et recherche centrés

Demande de Mouss : « place le texte et la barre de recherche au centre de l'écran ». **2 cycles** (sur 3).
Mesure : écart entre le centre de chaque bloc et le centre de l'écran.

### Cycle 1

Surtitre (avec un filet de chaque côté), titre, description et recherche centrés, sur tous les formats ; voile brun
radial derrière le bloc central (couleur `foreground` du thème).

**Bilan** : centrage exact (0 px d'écart pour les 4 blocs, sur les 4 formats). **Écart** : sur desktop, la photo
commençait à 30 % de la largeur (composition asymétrique d'origine) : grand aplat brun vide à gauche et cassure
verticale nette vers x = 500, composition déséquilibrée.

### Cycle 2

Sur desktop, la photo occupe toute la largeur (mêmes photos, mêmes cadrages) ; le dégradé de gauche est remplacé
par un voile général léger (`foreground` à 25 %) + le voile radial central.

**Bilan** : composition symétrique et équilibrée, centrage exact, aucun débordement, texte lisible.
**Écart restant** : les mariés sont au centre des photos, donc en partie derrière le titre sur desktop (le voile
garde le texte lisible). Si tu veux les voir davantage, on peut décaler le cadrage de chaque photo (`HERO_SLIDES`).

## 8. Cœur « Favoris » retiré (25/11/2026)

À la demande de Mouss, l'icône cœur (lien `/favoris`) est retirée de la barre de navigation. La page « bientôt
disponible » `/favoris` reste dans le menu mobile. Contrôle : plus de lien `/favoris` dans la barre, navbar toujours
sur une ligne (bord droit à 992 px en 1024, 1601 px en 1671).

## 9. Contrôles du carrousel retirés (25/11/2026)

À la demande de Mouss, la pagination (points) et le bouton pause sont retirés (`CarouselControls` supprimé).
Le carrousel continue : défilement automatique toutes les 6 s, pause quand on survole ou utilise la recherche et les
catégories, pause quand l'onglet est masqué, balayage au doigt, rien ne bouge avec « réduire les animations ».
Contrôle : hero toujours plein écran (941 px à 1671 × 941), aucun débordement.

**À savoir (accessibilité)** : sans bouton pause, un utilisateur au clavier ne peut plus arrêter le défilement
autrement qu'en mettant le focus dans le hero (critère WCAG 2.2.2) ; les photos étant décoratives, l'impact reste
limité, mais à garder en tête pour un audit.

## 10. Refaire les captures

```sh
pnpm --filter @afro/web exec vite --port 5179     # dans un terminal
# puis un script Playwright : contexte { reducedMotion: 'reduce', viewport: { width: 1671, height: 941 } },
# page.goto('http://localhost:5179/'), page.screenshot(...) ; idem en 820 × 1180 et devices['iPhone 13'].
```
