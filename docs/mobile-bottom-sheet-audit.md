# App mobile : audit des panneaux du bas (@gorhom/bottom-sheet)

Demande de Mouss (28/11/2026) : refondre « Ajouter à un événement » avec `@gorhom/bottom-sheet`, et passer en revue
tout `apps/mobile` pour savoir **où le panneau du bas est le bon geste, et où il ne l'est pas**.
Seule la migration « Ajouter à un événement » est faite. **Le reste attend la validation de Mouss.**

## 1. Ce qui existe aujourd'hui

Deux systèmes de panneaux cohabitent :

| Système                               | Fichier                              | Construit sur                  | Utilisé par                                                                                                  |
| ------------------------------------- | ------------------------------------ | ------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| **AppBottomSheet** (le pattern cible) | `src/components/AppBottomSheet.tsx`  | `@gorhom/bottom-sheet` v5      | Filtres de la recherche (#77), **Ajouter à un événement** (cette PR)                                         |
| **BottomSheet** (ancien)              | `src/components/BottomSheet.tsx`     | `Modal` de React Native, animé | Accepter un devis, Décliner une demande (pro), Apparence / Langue / Mentions, date du formulaire d'événement |
| **FullScreenModal**                   | `src/components/FullScreenModal.tsx` | `Modal` plein écran            | Recherche plein écran, Signaler un profil, visionneuse de photos                                             |
| **ConfirmModal**                      | `src/components/ConfirmModal.tsx`    | `Modal` centré                 | Supprimer un événement, retirer un prestataire                                                               |

L'installation de gorhom est complète et unique : dépendance, `GestureHandlerRootView` et **un seul**
`BottomSheetModalProvider` dans `app/_layout.tsx`, Reanimated 4, Safe Area. Aucun provider à ajouter.

## 2. Le pattern Wenzee : quand utiliser quoi

Le panneau du bas n'est pas « une modale de plus ». C'est le geste pour **une décision courte, prise sans quitter
l'écran**, dont le résultat revient à l'écran d'origine.

| Besoin                                                                     | Pattern                                 | Exemples Wenzee                                               |
| -------------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------- |
| Choisir dans une liste, régler des options, une action contextuelle courte | **AppBottomSheet**                      | Ajouter à un événement, filtres, langue, motif de refus       |
| Un choix court qui en ouvre un autre (sous-écran)                          | **AppBottomSheet avec `onBack`**        | Filtres → Date → retour aux filtres                           |
| Parcours en plusieurs étapes, formulaire long, recherche avec saisie riche | **Écran dédié** (pile Expo Router)      | Créer un événement, demander un devis, ajouter un prestataire |
| Confirmation **destructive** simple (« Supprimer ? »)                      | **ConfirmModal** (centré), ou sur place | Supprimer un événement, refuser un devis                      |
| Contenu immersif plein écran                                               | **FullScreenModal**                     | Visionneuse de photos                                         |

Règles du composant (`AppBottomSheet`), à respecter pour chaque nouveau panneau :

1. **Ouverture par une ref** (`sheet.current?.present()`), contenu monté seulement à l'ouverture.
2. **En-tête dans la poignée** (`handleComponent`) : croix (ou flèche si sous-écran), titre centré, sous-titre
   facultatif. Il est compté dans la hauteur, et on peut l'attraper pour faire glisser le panneau.
3. **Hauteur** : `fitContent` pour les listes et choix courts (hauteur du contenu, 90 % au plus, puis défilement) ;
   92 % fixe pour les panneaux riches (filtres).
4. **Action principale collée en bas** (`footer` → `BottomSheetFooter`), au-dessus de la zone sûre.
5. **Fermeture** : glissement vers le bas, toucher le fond (opacité 0,45), la croix, ou le retour d'Android.
6. **Clavier** : `keyboardBehavior="interactive"`. Dans un panneau, utiliser `BottomSheetTextInput`
   (pas `TextInput`) pour que le panneau suive le clavier.
7. **Retour d'information dans le panneau**, pas en toast (voir 5.1).
8. **Avant de naviguer**, fermer le panneau (`dismiss()`). Sinon il reste affiché par-dessus l'écran suivant, car il
   vit dans le provider racine.

## 3. Recommandations

### 3.1 À migrer en priorité

| Composant                     | Fonction actuelle                                    | Recommandation              | Justification                                                                        | Priorité |
| ----------------------------- | ---------------------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------ | -------- |
| **Ajouter à un événement** ✅ | Choisir l'événement où ajouter le prestataire        | Bottom Sheet                | Liste courte + action contextuelle, on reste sur la fiche. **Fait dans cette PR**    | Haute    |
| Accepter le devis             | Adresse précise, conditions, case à cocher, réserver | Bottom Sheet                | Contenu long + champ texte : le clavier et le défilement sont mieux gérés par gorhom | Haute    |
| Décliner une demande (pro)    | 3 motifs à toucher ou un motif libre                 | Bottom Sheet                | Choix court + champ texte : clavier, glissement pour fermer                          | Haute    |
| Apparence / Langue / Mentions | Un choix parmi 2-3                                   | Bottom Sheet (`fitContent`) | Le cas d'école : panneau court, à la hauteur du contenu ; migration simple           | Haute    |

### 3.2 À migrer éventuellement

| Composant                                     | Fonction actuelle                    | Recommandation                 | Justification                                                                          | Priorité |
| --------------------------------------------- | ------------------------------------ | ------------------------------ | -------------------------------------------------------------------------------------- | -------- |
| Date du formulaire d'événement                | Calendrier + « Valider la date »     | Bottom Sheet (`fitContent`)    | Même geste que la date des filtres, pour la cohérence ; marche bien aujourd'hui        | Moyenne  |
| Signaler un profil                            | Motif + détails, en plein écran      | Bottom Sheet                   | Action secondaire courte : le plein écran est disproportionné. Mais action rare        | Moyenne  |
| Actions de l'événement (Modifier / Supprimer) | Deux boutons posés sur la couverture | Bottom Sheet d'actions (« … ») | Si d'autres actions arrivent (dupliquer, partager). Aujourd'hui deux boutons suffisent | Basse    |
| Déconnexion                                   | Immédiate, sans confirmation         | Petit panneau de confirmation  | Évite une déconnexion par erreur. Question produit plus que technique                  | Basse    |

### 3.3 À conserver en l'état

| Composant                                            | Fonction actuelle                     | Recommandation             | Justification                                                                                                                            |
| ---------------------------------------------------- | ------------------------------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Filtres de la recherche                              | Catégorie, lieu, date, budget, tri…   | Déjà en Bottom Sheet (#77) | Le modèle : sous-écrans avec flèche « retour » dans le même panneau                                                                      |
| Tri, lieu, date (dans les filtres)                   | Sous-écrans du panneau Filtres        | Garder dans le panneau     | Un second panneau par-dessus serait de trop                                                                                              |
| Recherche plein écran (« Que cherches-tu ? »)        | 4 étapes repliables, saisie de texte  | Plein écran                | Parcours en plusieurs étapes avec clavier : un écran (façon Airbnb) est le bon format                                                    |
| Créer / modifier un événement                        | Formulaire en 3 étapes                | Écran dédié                | Formulaire long, plusieurs étapes                                                                                                        |
| Demander un devis                                    | Formulaire en étapes                  | Écran dédié                | Idem, et c'est le parcours clé                                                                                                           |
| Ajouter un prestataire (depuis un événement)         | Recherche + liste                     | Écran dédié                | Recherche avec saisie et longue liste                                                                                                    |
| Demander les devis de l'événement                    | Cases à cocher + message              | Écran dédié                | Sélection multiple + message : trop riche pour un panneau                                                                                |
| Supprimer un événement, retirer un prestataire       | ConfirmModal centré                   | Garder                     | Confirmation destructive : une modale centrée attire l'attention sur la conséquence                                                      |
| Refuser un devis                                     | Confirmation sur place, sous le devis | Garder                     | Le contexte (le devis) reste visible ; rien à gagner                                                                                     |
| Visionneuse de photos                                | Plein écran noir                      | Garder                     | Contenu immersif                                                                                                                         |
| Calendrier des disponibilités (fiche), date du devis | Calendrier dans la page               | Garder                     | Information à lire en place, pas un choix à faire à part                                                                                 |
| Messagerie                                           | Composer, bulles, carte de devis      | Rien à migrer              | Pas d'actions secondaires aujourd'hui. Si des actions arrivent sur un message (copier, signaler), un panneau d'actions sera le bon geste |

## 4. Détail par migration recommandée

| Composant                     | Fichier                                         | Fonctionnement actuel                                                       | Amélioration attendue                                                                        | Difficulté | Dépendances                                              | Risque de régression                                                             |
| ----------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ---------- | -------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Accepter le devis             | `src/features/bookings/QuoteActions.tsx`        | `BottomSheet` (Modal) : adresse, conditions, case, « Accepter et réserver » | Glissement pour fermer, clavier mieux suivi (`BottomSheetTextInput`), même look que le reste | Moyenne    | AppBottomSheet ; tests `bookings.test.tsx` (faux gorhom) | **Moyen** : parcours de réservation (règle n° 5). Tests existants à garder verts |
| Décliner une demande (pro)    | `src/features/pro/DeclineRequestSheet.tsx`      | `BottomSheet` : motifs + motif libre                                        | Idem, avec `fitContent`                                                                      | Faible     | AppBottomSheet ; `proRequests.test.tsx`                  | Faible                                                                           |
| Apparence / Langue / Mentions | `src/features/account/ChoiceSheet.tsx`          | `BottomSheet` + liste de choix                                              | `fitContent` : panneau court, pas de grand vide                                              | Faible     | AppBottomSheet ; `account.test.tsx`                      | Faible                                                                           |
| Date du formulaire            | `src/features/events/EventFormScreen.tsx`       | `BottomSheet` + `Calendar`                                                  | Même geste que la date des filtres                                                           | Faible     | AppBottomSheet                                           | Faible                                                                           |
| Signaler un profil            | `src/features/provider-profile/ReportSheet.tsx` | `FullScreenModal` : motifs + détails                                        | Action courte, on garde la fiche visible derrière                                            | Faible     | AppBottomSheet, `BottomSheetTextInput`                   | Faible                                                                           |

Quand les quatre premières seront faites, `src/components/BottomSheet.tsx` pourra être **supprimé** : un seul système
de panneaux dans l'app.

## 5. Points transverses trouvés pendant l'audit

1. **Les toasts passent sous les panneaux.** `BottomSheetModalProvider` dessine les panneaux après ses enfants, donc
   par-dessus le `Toaster` (vérifié dans le code de `@gorhom/portal`). Un toast lancé panneau ouvert est caché. D'où la
   règle 7 : confirmation **dans** le panneau (c'est ce que fait « Ajouter à un événement »). Piste si besoin plus
   tard : afficher le `Toaster` dans un portail au-dessus.
2. **Bouton « retour » d'Android (corrigé dans cette PR).** `BottomSheetModal` ne le gère pas tout seul :
   le retour quittait l'écran en laissant le panneau. `AppBottomSheet` le gère maintenant pour tous ses panneaux,
   filtres compris (test ajouté).
3. **En-tête et hauteur automatique (corrigé dans cette PR).** Avec `enableDynamicSizing`, gorhom ne compte pas un
   en-tête posé à côté de la liste : la fin passait sous le pied. L'en-tête est maintenant dans `handleComponent`.
4. **Tests** : le faux gorhom (`src/test/bottomSheetMock.tsx`) ouvre et ferme vraiment, et affiche la poignée et le
   pied. Les gestes ne sont pas testables dans Jest : à vérifier au doigt.

## 6. Ordre proposé (à valider)

1. Apparence / Langue / Mentions (simple, valide `fitContent` sur un deuxième cas).
2. Décliner une demande (pro).
3. Accepter le devis (avec Mouss, parcours sensible).
4. Date du formulaire d'événement, puis suppression de `components/BottomSheet.tsx`.
5. Signaler un profil (si Mouss le veut).
