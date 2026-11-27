# Fiche prestataire : refonte et validation visuelle

> Les captures de chaque cycle ont servi à la comparaison mais **ne sont pas versionnées** (règle de Mouss) :
> elles sont dans `docs/screenshots/vendor-profile/` le temps de la relecture, puis supprimées avant la PR.
> Ce document garde les mesures, les écarts relevés et les corrections.

Refonte de la page existante `/prestataires/:slug` (P5, `ProviderProfilePage`) selon la méthode
**coder → capturer → comparer → corriger → recapturer** (3 cycles maximum par maquette,
[`agents/conventions.md`](../agents/conventions.md)). Même route, mêmes hooks (`useProvider`, `useProviderReviews`,
`useUnavailableDates`), même JSON-LD, aucune API modifiée.

Deux maquettes successives le 27/11/2026 :

- **Version 1** (section 6, résumé) : identité au-dessus d'une photo arrondie dans le conteneur, onglets d'**ancre**.
- **Version 2** (la version actuelle, sections 1 à 5) : **couverture pleine largeur tout en haut** avec l'identité
  posée dessus, et **4 vrais onglets** dont le contenu se remplace sans défilement.

## 1. Référence (version 2)

| Élément                   | Valeur                                                                                                   |
| ------------------------- | -------------------------------------------------------------------------------------------------------- |
| Maquette                  | Image jointe par Mouss le 27/11/2026 (« Maison Naya », couverture + onglets, non versionnée)             |
| Résolution de comparaison | **1200 × 1312** (taille de la maquette), Chromium (Playwright 1.63), animations réduites                 |
| Autres formats vérifiés   | Tablette 820 × 1180 (tactile), mobile iPhone 13 (390 × 664, densité 3)                                   |
| Page de test              | `/prestataires/saveurs-de-dakar` (6 photos, 3 formules, 8 avis)                                          |
| Design system             | `packages/config/tailwind/theme.css` + `agents/conventions.md` (section Design) : aucune couleur ajoutée |

### Analyse de la maquette (avant de coder)

| Zone         | Mesures relevées sur la maquette (px)                                                                                                                        |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Couverture   | x 0 → 1200 (**bord à bord**), y 0 → **517**, aucun espace au-dessus ; dégradé sombre en bas ; « Voir toute la galerie (24) » à droite, au-dessus des boutons |
| Identité     | Logo 104 (x 42, y 370) bordé de blanc ; nom ~36 blanc + badge ; famille ; pastille sable, ville, ★ note ; à droite cœur blanc 52 + bouton crème 286 × 48     |
| Onglets      | x 36 → 858 (**~820**), y 558 → 612 (**54**) ; icône + libellé ; actif plein brun                                                                             |
| Colonnes     | Contenu (carte blanche) x 26 → 800 (**774**) ; contact x 830 → 1171 (**341**) ; tous deux à y 650                                                            |
| Présentation | Titre ~30 ; texte ; 4 pastilles ; encadré à 4 blocs séparés par des filets (icône, titre gras, valeur)                                                       |
| Contact      | Inchangé (version 1)                                                                                                                                         |

## 2. Ce qui a été fait

| Composant                                              | Rôle                                                                                                                           |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `provider-profile/pages/ProviderProfilePage.tsx`       | Assemble couverture + onglets + contact ; état React `tab` (`presentation` par défaut, `avis` après C6)                        |
| `components/ProfileCover.tsx` (remplace `ProfileHero`) | Photo plein écran (`object-cover`, `fetchPriority="high"`), 2 dégradés, « Voir toute la galerie »                              |
| `components/ProviderIdentity.tsx`                      | Version sur fond sombre, posée en bas de la couverture                                                                         |
| `components/ProfileTabs.tsx` + `lib/profileTabs.ts`    | Tabs Radix (shadcn) : `tablist` / `tab` / `tabpanel`, flèches, Début / Fin ; grille contenu + contact                          |
| `components/AboutSection.tsx`                          | Onglet Présentation : texte, spécialités, encadré « Capacité / Localisation / Réponse / Annulation », calendrier et annulation |
| `components/Gallery.tsx`                               | Onglet Galerie : mosaïque (1re photo en grand), nombre de photos, état vide                                                    |
| `components/OfferingList.tsx`, `ReviewList.tsx`        | Onglets Prestations et Avis (sans les ancres de la version 1)                                                                  |
| `stores/navbarOverlay.ts` (nouveau)                    | La couverture demande la navbar transparente tant qu'elle est affichée (`useOverlayNavbar`)                                    |
| `components/layout/Navbar.tsx`, `PublicLayout.tsx`     | `overlay` aussi sur la fiche ; la recherche compacte de l'en-tête passe dans `withSearch` (accueil seul)                       |
| Supprimés                                              | `SectionNav.tsx`, `useActiveSection.ts` (ancres et défilement), `ProfileHero.tsx`                                              |

## 3. Cycles de comparaison (version 2)

### Cycle 1 : première intégration

**Conforme** : couverture **1200 × 540** à x 0, y 0 (maquette 1200 × 517) ; navbar transparente posée dessus ;
identité en bas (logo à y 376, maquette 370) ; colonnes **776 / 344** (maquette 774 / 341) ; encadré à 4 blocs ;
changer d'onglet ne fait pas défiler ; **0 px** de débordement.

**Écarts relevés (par priorité)** :

1. Bande grise sous les onglets : l'ombre de la barre était coupée par son conteneur défilant (tous formats).
2. Téléphone : 4 onglets trop larges, « Galerie » et « Avis » coupés (défilement horizontal).
3. Tablette (820) : boutons à droite du nom → nom tassé, badge vérifié seul sur une ligne.
4. Ordinateur : barre d'onglets 727 × 62 contre ~820 × 54.
5. Téléphone : logo centré sur un long bloc de texte (sous le nom).

### Cycle 2 : corrections 1 à 5

- Plus de conteneur défilant : la barre est en entier à l'écran à tous les formats.
- Téléphone : icônes masquées, libellés en 14 px ; ordinateur : onglets à 52 px de marge, 44 px de haut.
- Identité : boutons à droite seulement à partir de 1024 px ; logo aligné en haut sur téléphone.

**Bilan** : barre d'onglets **819 × 54** ; tablette : nom et badge sur une ligne, boutons dessous.
**Reste** : téléphone, onglets en 4 colonnes égales → « Présentation » touche les bords de sa pastille active.

### Cycle 3 : correction finale

- Onglets du téléphone en largeurs libres (`flex-auto`) plutôt qu'en 4 colonnes égales.

**Bilan** : les 4 onglets tiennent sur une ligne en 358 px ; captures finales des 4 onglets (ordinateur et
téléphone). Défilement mesuré avant / après chaque changement d'onglet : **480 → 480 px** dans les 8 cas, panneau
de contact présent à chaque fois.

## 4. Résultat final

| Point                     | Résultat                                                                                                                                            |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ordinateur 1200 px        | Couverture 1200 × 540 bord à bord ; onglets 776 × 54 (largeur du contenu) ; contenu 776, contact 344 collant (y = 96), arrêté avant le pied de page |
| Tablette 820 px           | Couverture 820 × 500 ; identité sur 2 lignes (nom, puis boutons) ; une colonne, contact sous le contenu (2 colonnes internes)                       |
| Téléphone 390 px          | Couverture 390 × 560 ; identité empilée en bas de la photo ; 4 onglets sur une ligne ; contact sous le contenu ; **0 px** de débordement            |
| Onglets                   | ✅ vrais onglets (pas de lien, pas de `#`), un seul `tabpanel` rendu, flèches ← → / Début / Fin, pas de défilement                                  |
| Favoris, galerie, contact | ✅ cœur (gardé au rechargement) ; visionneuse depuis la couverture et l'onglet Galerie ; demande de devis inchangée                                 |
| Avis                      | ✅ résumé, répartition, « Voir tous les avis » ; après « Publier mon avis », la fiche s'ouvre sur l'onglet Avis                                     |
| Navbar                    | ✅ transparente sur la couverture, brune au défilement ; brune sur une 404 ou une erreur (pas de photo dessous)                                     |
| Accessibilité             | ✅ axe-core sans violation sérieuse sur la fiche                                                                                                    |
| Tests                     | Vitest `web` 39 fichiers / 241 tests ; Playwright : toute la suite verte (desktop + mobile)                                                         |

## 5. Écarts assumés et points non résolus

| Écart                                                   | Pourquoi                                                                                                                         |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Navbar sur la couverture                                | La maquette ne la montre pas ; la navbar commune reste (une seule navbar), transparente comme sur l'accueil                      |
| « Afficher le numéro » n'affiche pas de numéro          | Téléphone absent des données publiques, coordonnées masquées avant réservation (règle n° 7) : le bouton explique. Question n° 24 |
| Monogramme au lieu d'un logo                            | Le profil n'a pas de champ logo                                                                                                  |
| Pas de « Mariages / Anniversaires / Événements privés » | Les types d'événements n'existent pas dans les données ; pastilles = catégories, origines, langues (question n° 24)              |
| Encadré : Capacité, Localisation, Réponse, Annulation   | Données réelles ; « Salle modulable » et « Disponibilité : toute l'année » de la maquette n'existent pas                         |
| Calendrier et annulation dans l'onglet Présentation     | Fonctionnalités existantes gardées (« informations pratiques ») ; le panneau de contact reste compact                            |
| Prix sur les cartes de prestations                      | Ils existent dans les données ; « Sur devis » sinon                                                                              |
| Titres en Playfair Display                              | Design system (h1–h3) ; la maquette utilise une linéale grasse                                                                   |
| Photos                                                  | Photos de démo aléatoires (picsum, question n° 19)                                                                               |
| Activation des onglets aux flèches                      | Automatique (comportement de Radix) : la flèche sélectionne l'onglet ; contenu léger, pas d'attente                              |
| L'onglet choisi n'est pas dans l'adresse                | Consigne : état React, pas d'ancre ; un rechargement revient sur Présentation                                                    |

## 6. Ajustement du 27/11/2026 (retour de Mouss)

« La barre de menu doit être de la même taille que la section en dessous » : la barre d'onglets est placée dans la
même grille que le contenu (`minmax(0,1fr) 344px`) et prend toute la largeur de la colonne ; les 4 onglets se
partagent la largeur à parts égales. Mesuré : barre **776 × 54**, carte du contenu **776** (ordinateur 1200 px) ;
788 / 788 sur tablette ; 358 / 358 sur téléphone. Écart assumé avec la maquette (barre ~820, plus large que la carte).

## 7. Version 1 (remplacée)

Première maquette du 27/11/2026 : identité au-dessus d'une photo panoramique arrondie (1168 × 389, maquette
1172 × 391), onglets d'ancre avec défilement doux et onglet actif au défilement, contenu en sections successives.
Trois cycles (écarts : prix non alignés, onglets trop hauts, panneau trop large sur tablette), tous corrigés.
Remplacée par la version 2 à la demande de Mouss (couverture plein écran, vrais onglets sans défilement).
