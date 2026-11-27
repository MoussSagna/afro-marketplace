# Espace client : refonte de « Mon compte » et validation visuelle

> Les captures de chaque cycle ont servi à la comparaison mais **ne sont pas versionnées** (règle de Mouss) :
> elles sont dans `docs/screenshots/account/` le temps de la relecture, puis supprimées avant la PR.
> Ce document garde les mesures, les écarts relevés et les corrections.

Refonte de la page existante `/espace/compte` (C8, gabarit `ClientLayout`), selon la méthode **coder → capturer →
comparer → corriger → recapturer** (3 cycles maximum, [`agents/conventions.md`](../agents/conventions.md)).
Même route, même garde, mêmes hooks (`useUpdateMe`, `useDeleteMe`) ; aucune valeur de la maquette n'est codée en dur.

## 1. Référence

| Élément                   | Valeur                                                                                   |
| ------------------------- | ---------------------------------------------------------------------------------------- |
| Maquette                  | Image jointe par Mouss le 27/11/2026 (« Mon compte », Aïssatou Ndiaye, non versionnée)   |
| Résolution de comparaison | **1536 × 1024** (taille de la maquette), Chromium (Playwright 1.63), animations réduites |
| Autres formats vérifiés   | Tablette 820 × 1180 (tactile), mobile iPhone 13 (390 × 664, densité 3)                   |
| Compte de test            | Aïssatou (`user-aissatou`), données de démo                                              |
| Design system             | `packages/config/tailwind/theme.css` + `agents/conventions.md` : aucune couleur ajoutée  |

### Analyse de la maquette (avant de coder)

| Zone                | Mesures relevées sur la maquette (px)                                                                                 |
| ------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Onglets de l'espace | Inchangés (refonte du tableau de bord) ; « Mon compte » actif : fond terre cuite léger                                |
| Bannière            | x 55 → 1481, y 183 → 366 (**1426 × 181**), coins ~28 ; « Mon compte » ~44 ; photo de table dressée à droite ; arcs    |
| Menu des rubriques  | x 55 → 383 (**328**), y 390 → 765 ; lignes ~64 ; actif : fond terre cuite léger, texte terre, icône ~24               |
| Titre de rubrique   | x 432, y ~395 ; « Informations personnelles » ~30 gras ; description ~17                                              |
| Carte principale    | x 432 → 1480 (**1048**), y 473 → 953 ; avatar **96** ; « Changer la photo » en pilule à droite ; filet sous le profil |
| Champs              | 2 colonnes de ~485, hauteur **~42**, icône à gauche, libellé au-dessus, astérisque rouge                              |
| Boutons             | « Annuler » ~124 × 50 en contour ; « Enregistrer les modifications » ~290 × 50 brun, pilules, alignés à droite        |

### État initial (avant refonte)

Une seule colonne de 672 px : titre « Mon compte », carte « Mes informations » (prénom, nom, email grisé, téléphone),
tableau de cases à cocher des notifications (4 sujets × 3 canaux), un seul bouton « Enregistrer » pour les deux,
puis la zone « Supprimer mon compte ». Pas de photo, de ville, de mot de passe, de rubriques ni de déconnexion.

## 2. Ce qui a été fait

### Données (`packages/common`), décidé avec Mouss le 27/11/2026

| Décision                                   | Changement                                                                                                                                                                                                                    |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Ville** : oui ; **fuseau horaire** : non | `user.city` (facultatif), `updateMeInputSchema.city`, `accountFormSchema.city` ; handler `PATCH /me` : ville absente = retirée (comme le téléphone). Le fuseau n'aurait aucun effet (site en heure de Paris)                  |
| **Photo** : même mécanisme que la galerie  | `updateMeInputSchema.avatarUrl` (le champ existait sur `User`) ; image réduite à 400 px en data URL (`imageFileToDataUrl(file, AVATAR_MAX_SIZE)`), Supabase Storage au lot 10                                                 |
| **Mot de passe** : nouvelle opération      | `changePassword` (`POST /me/password`) : vérifie l'actuel (`wrong_password`), refuse un compte Google / Apple (`no_password`) ; `changePasswordInputSchema`, `changePasswordFormSchema`, `useChangePassword` ; textes fr / en |

### Site (`apps/web/src/…`)

| Fichier                                                                                                             | Rôle                                                                                                                                                          |
| ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `features/account/pages/AccountPage.tsx`                                                                            | Assemble bannière, menu et rubrique (`?rubrique=`, « Informations personnelles » par défaut)                                                                  |
| `features/account/components/AccountNavigation.tsx` (nv.)                                                           | Colonne de 330 px dès 1024 px ; pastilles qui défilent en dessous (la rubrique active est ramenée à l'écran) ; Déconnexion                                    |
| `features/account/components/PersonalInformation.tsx` (nv.)                                                         | Profil + formulaire 2 colonnes ; validation `accountFormSchema` ; Annuler / Enregistrer ; chargement, réussite, erreur                                        |
| `features/account/components/ProfilePhotoEditor.tsx` (nv.)                                                          | Avatar ou initiales, « Membre depuis… », « Changer la photo » (aperçu avant enregistrement), « Retirer la photo »                                             |
| `features/account/components/NotificationSettings.tsx` (nv.)                                                        | 3 groupes, un interrupteur par sujet et par canal (E-mail, Application, SMS)                                                                                  |
| `features/account/components/SecuritySettings.tsx` (nv.)                                                            | Mot de passe (règles cochées en direct) + « Supprimer mon compte » (code existant, déplacé ici)                                                               |
| `features/account/components/AccountPreferences.tsx` (nv.)                                                          | Affichage des résultats (Grille / Liste), favoris (vider), lien vers les notifications, langue (information)                                                  |
| `features/account/components/AccountPanel.tsx`, `IconInput.tsx` (nv.)                                               | Carte, titre de bloc, barre d'actions ; champ à icône, astérisque                                                                                             |
| `features/account/lib/` (`accountSections.ts`, `accountForm.ts`, `useSaveAccount.ts`, `useUnsavedChangesGuard.tsx`) | Rubriques et adresses ; groupes de notifications ; enregistrement **partiel** à partir du compte à jour ; garde « Quitter sans enregistrer ? » (`useBlocker`) |
| `components/layout/SpaceBanner.tsx` (nv.)                                                                           | Bannière partagée, extraite de `WelcomeBanner` (qui l'utilise, rendu inchangé)                                                                                |
| `components/ui/switch.tsx` (nv.)                                                                                    | Interrupteur accessible (`role="switch"`), sans nouvelle dépendance                                                                                           |
| `features/provider-onboarding/lib/imageFile.ts`                                                                     | Taille maximale en paramètre (`AVATAR_MAX_SIZE` = 400)                                                                                                        |

**Pourquoi un enregistrement partiel ?** `PATCH /me` reçoit le compte entier. Chaque rubrique part donc du compte
**à jour dans la session** et n'y change que ses champs : enregistrer les notifications ne remet pas l'ancien prénom.

## 3. Cycles de comparaison

### Cycle 1 : première intégration

**Conforme** : bannière **1426 × 184** à x 55 (maquette 1426 × 181) ; menu **330** de large à x 55 (maquette 328) ;
titre et carte à **x 433** (maquette 432), carte de **1048** (identique) ; champs **483 × 44** (maquette ~485 × 42) ;
bouton principal 278 × 48 ; **0 px** de débordement sur les 3 formats.

**Écarts relevés (par priorité)** :

1. Téléphone : la pastille de la rubrique active pouvait être hors de l'écran (« Notifications » coupée).
2. Téléphone : les 3 interrupteurs passaient sur 2 lignes (SMS seul en dessous).
3. Sécurité : le champ « Confirmation » 7 px plus bas que « Nouveau mot de passe » (la grille étirait la cellule).
4. Astérisque trop loin du libellé (espacement du `FormLabel`).
5. Initiales en Playfair ; la maquette a une linéale.
6. « Paris » en exemple dans Ville : se lit comme une vraie valeur alors que le compte n'a pas de ville.
7. « Annuler » désactivé trop pâle ; pastille de l'icône « Supprimer » sans fond (couleur inexistante).

### Cycle 2 : corrections 1 à 7

- La rangée de pastilles règle son `scrollLeft` sur la rubrique active (sans faire défiler la page).
- Interrupteurs : 3 colonnes égales sur téléphone, interrupteur au-dessus de son canal.
- `content-start` sur les cellules du mot de passe ; `gap-1` sur les libellés ; initiales en Inter ;
  exemple « Votre ville » ; `disabled:opacity-60` ; fond `bg-red-50` (comme `ConfirmDialog`).

**Bilan** : les 7 écarts sont corrigés. **Reste** : carte de 536 px de haut (maquette ~480), le bouton descend à
y 1004 sur 1024 (voir section 5).

### Cycle 3 : correction finale

- Espacements verticaux resserrés (formulaire `gap-5`, lignes de champs `gap-y-4`).

**Bilan** : carte de 516 px, boutons à y 936 → 984 : toute la carte tient dans l'écran de la maquette.
Captures finales des 4 rubriques sur les 3 formats.

## 4. Résultat final

| Point                  | Résultat                                                                                                                   |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Ordinateur 1536 × 1024 | Bannière 1426 × 184 ; menu 330 × 338 ; carte 1048 × 516 ; champs 483 × 44 ; boutons de 48                                  |
| Tablette 820           | Bannière 788 × 185 ; rubriques en pastilles défilantes ; formulaire sur 2 colonnes ; 0 px de débordement                   |
| Téléphone 390          | Bannière compacte ; pastilles défilantes ; 1 colonne ; boutons pleine largeur (principal au-dessus) ; 0 px de débordement  |
| Rubriques              | ✅ liens `?rubrique=` (partageables, « retour » fonctionne), `aria-current`, fondu discret                                 |
| Informations           | ✅ préremplies, validées près des champs, Annuler, chargement, réussite seulement si le serveur répond OK, erreur affichée |
| Photo                  | ✅ aperçu avant enregistrement, refus d'un fichier non image ou > 10 Mo, retrait ; la navbar suit (session)                |
| Notifications          | ✅ 4 sujets × 3 canaux enregistrés dans `notificationPrefs`, Annuler                                                       |
| Sécurité               | ✅ mot de passe (actuel vérifié) ; suppression du compte (inchangée, déplacée)                                             |
| Déconnexion            | ✅ confirmation puis `/deconnexion` (même mécanisme que le menu du compte)                                                 |
| Garde                  | ✅ « Quitter sans enregistrer ? » en quittant une rubrique modifiée                                                        |
| Tests                  | Vitest : commun 421, web 347 (dont 18 pour « Mon compte » + 4 unitaires), mobile 307 ; Playwright 186 réussis, 12 ignorés  |

## 5. Écarts assumés et points non résolus

| Écart                                                 | Pourquoi                                                                                                                                                           |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Pas de « Fuseau horaire »                             | Choix de Mouss : il ne changerait aucun affichage                                                                                                                  |
| La ville est un champ libre, pas une liste            | Pas de base de villes pour les comptes (voir `questions-ouvertes.md` n° 21)                                                                                        |
| Photo de la bannière **floue**                        | Seule photo de table dressée des assets : `categories/decoration.webp`, **320 × 320** px, agrandie environ 2,5 fois. À remplacer par une version ≥ 1600 px (n° 28) |
| Deux textes d'aide sous E-mail et Téléphone           | Déjà présents : e-mail non modifiable ici, téléphone jamais affiché ; ils allongent la carte de ~40 px                                                             |
| E-mail en lecture seule                               | Comme avant : pas d'opération de changement d'e-mail (il faudrait le revérifier)                                                                                   |
| Pas de sessions actives ni de double authentification | Non gérées par le MVP : rien d'affiché plutôt qu'une fausse fonction                                                                                               |
| Langue : information seulement                        | Le site n'est pas traduit ; un sélecteur serait décoratif                                                                                                          |
| Préférences gardées sur l'appareil                    | Affichage des résultats et favoris sont dans le `localStorage` (stores existants, n° 23)                                                                           |
| Pas de cloche dans la navbar                          | Pas de système de notifications au MVP (déjà noté pour le tableau de bord)                                                                                         |
| Titres en Playfair Display                            | Design system (h1–h3) ; la maquette utilise une linéale grasse                                                                                                     |
| « Enregistrer les préférences » (Notifications)       | Un enregistrement par rubrique, avec Annuler, plutôt qu'un envoi à chaque interrupteur : pas d'envois concurrents, et le même geste que les informations           |
| App mobile non mise à jour                            | Demande de Mouss : reports listés dans [`agents/reports-mobile.md`](../agents/reports-mobile.md)                                                                   |
