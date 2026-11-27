# Maquette « Événements » : le planificateur d'événements

Maquettes HTML statiques, navigables et interactives (desktop et mobile, thème clair et sombre) de la nouvelle
page « Événements » de Wenzee. Depuis, la page est **intégrée dans le site** (`/evenements`, voir `docs/events-planner-validation.md`) ; cette maquette reste la référence visuelle (thème sombre compris).
Référence visuelle : la planche jointe par Mouss le 27/11/2026 (non versionnée).

## Objectif

Faire de « Événements » un **planificateur** : le client crée ses événements, y ajoute plusieurs prestataires,
leur envoie une demande de devis en une fois, compare les réponses et **retient** ceux qu'il veut.

Règle métier respectée partout : **pas de réservation directe ni de paiement**. Le mot « réservation » n'apparaît
jamais comme action ; « Retenu » ne veut pas dire « réservé » (rappel affiché sous les actions du détail).

## Ouvrir la maquette

```bash
cd maquette/evenements
python3 -m http.server 8765      # puis http://localhost:8765/index.html
```

`index.html` donne accès à chacun des 8 écrans (en clair et en sombre) et aux états complémentaires. Ouvrir
directement le fichier dans Chrome marche aussi. Seules les polices (Inter, Playfair Display) viennent de Google
Fonts, comme sur le site.

| Paramètre (avant le `#`) | Effet                                                   |
| ------------------------ | ------------------------------------------------------- |
| `?theme=light` / `dark`  | Force le thème (sinon : le dernier choisi, ou clair)    |
| `?reset=1`               | Remet les données de démo (puis disparaît de l'adresse) |
| `?vide=1`                | Aucun événement : état vide                             |

## Avant / après

**Avant** (`apps/web`, route `/evenements`, composant `EventsPage` de `features/static/pages/ComingSoonPages.tsx`) :
une page **« Bientôt disponible »** publique : titre « Événements », la phrase « Les événements de la communauté
afro et caribéenne en Île-de-France. », « Cette rubrique arrive bientôt sur Wenzee » et un bouton « Voir les
prestataires ». Le lien « Événements » est dans la navbar (et dans le pied de page) ; l'app mobile n'a pas
d'onglet Événements (Accueil, Recherche, Demandes, Messages, Compte).

**Après** : la même entrée « Événements » de la navbar ouvre « Mes événements » (planificateur personnel, dans
l'espace client) ; sur téléphone, un onglet **Événements** dans la barre du bas (Demandes, Réservations, Messages,
Événements, comme la planche). Capture : `screenshots/avant-apres/avant-apres.png`.

Ce qui change : la page ne parle plus d'événements **publics** de la communauté mais des événements **du
client**. Elle demande donc d'être connecté (voir la question ouverte n° 9).

## Parcours

```
Navbar « Événements » / onglet « Événements » (mobile)
 └─ 01 Mes événements ──┬─ « + Créer mon événement » → 02 Type → Informations → Détails → 03 Détail (toast)
                        └─ carte → 03 Détail d'un événement
                              ├─ Modifier → 07 (même formulaire, pré-rempli) → 03 (toast)
                              ├─ Supprimer → 08 modale → 01 + toast « Événement supprimé » [Annuler]
                              ├─ Ajouter un prestataire / Découvrir (catégorie) → 04 → 03
                              ├─ ✕ sur un prestataire → 05 modale « Retirer » → 03 (toast)
                              ├─ Retenir / Ne plus retenir (devis reçu) → 03 (toast)
                              └─ Demander les devis → 06 → 03 (statuts « Devis demandé », toast)
Fiche prestataire → « Ajouter à un événement » → modale (événement existant, ou « + Nouvel événement »
                    → 02 → retour à la fiche, prestataire déjà ajouté)
```

## Écrans

| #   | Écran                  | Adresse (`app.html…`)                                                 | Points clés                                                                                                                                                                                                                                                               |
| --- | ---------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01  | Mes événements         | `#/evenements`                                                        | Titre, sous-titre, « + Créer mon événement » (« + Créer » sur téléphone). Cartes : photo, nom, statut, date, ville, invités, prestataires, devis reçus, flèche. Tri par date. État vide : illustration calendrier, texte et bouton de la mission.                         |
| 02  | Créer un événement     | `#/evenements/nouveau?etape=1`                                        | Stepper Type / Informations / Détails. 1 : 6 cartes, une seule sélection. 2 : Nom*, Date*, Ville*, Invités* (placeholders de la mission). 3 : budget (liste de la mission) et description facultatifs. Valeurs gardées en revenant en arrière. Erreurs sous chaque champ. |
| 03  | Détail d'un événement  | `#/evenements/mariage-aissatou`                                       | En-tête (photo, nom, statut, type, date, ville, invités, budget, description, Modifier, Supprimer). 4 indicateurs calculés. Prestataires groupés par catégorie. « Complétez votre événement ». Actions ; « Demander les devis » collant sur téléphone.                    |
| 04  | Ajouter un prestataire | `#/evenements/mariage-aissatou/ajouter`                               | Recherche texte, filtres Catégorie et Ville (dans l'adresse), cartes avec photo, nom, badge vérifié, catégorie, ville, note, avis. « Ajouter », ou « Ajouté » désactivé (pas de doublon). Résultat vide géré.                                                             |
| 05  | Retirer un prestataire | `#/evenements/mariage-aissatou?modale=retirer&prestataire=dj-kizomba` | Modale « Retirer le prestataire ? », Annuler / Retirer. Seule l'association est supprimée. Avertissement si un devis a déjà été demandé.                                                                                                                                  |
| 06  | Demander les devis     | `#/evenements/mariage-aissatou/devis`                                 | Cases à cocher (prestataires « Ajouté » cochés au départ ; ceux déjà contactés grisés), compteur, tout (dé)sélectionner, message facultatif, récapitulatif (événement, date, ville, invités, budget, prestataires choisis), envoi groupé.                                 |
| 07  | Modifier un événement  | `#/evenements/mariage-aissatou/modifier?etape=1`                      | **Le même composant que 02** (`formView`), pré-rempli, titre « Modifier mon événement », bouton « Enregistrer les modifications ».                                                                                                                                        |
| 08  | Supprimer un événement | `#/evenements/mariage-aissatou?modale=supprimer`                      | Modale avec le texte de la mission, puis retour à 01 et toast « Événement supprimé » avec « Annuler » (8 s) qui restaure l'événement **et** ses prestataires, à sa place.                                                                                                 |
| +   | Fiche prestataire      | `#/prestataires/studio-sankofa?modale=ajouter`                        | Fiche simplifiée + « Ajouter à un événement » : modale listant mes événements (nom, date, ville, nombre de prestataires), « Ajouter » / « Ajouté », « + Nouvel événement ».                                                                                               |

## Interactions (toutes en JavaScript, sans back-end)

- Navigation par l'adresse (`#…`) : chaque écran, chaque modale et chaque filtre a son URL (retour du navigateur OK).
- Création, modification, suppression avec annulation, ajout (sans doublon), retrait, « Retenir » / « Ne plus
  retenir », recherche (frappe), filtres, sélection multiple, demande de devis groupée, modales, toasts.
- État persistant : `localStorage` (`wenzee-maquette-evenements-v1`) ; brouillon du formulaire en
  `sessionStorage` ; thème en `localStorage` (`wenzee-maquette-theme`).
- Accessibilité : vrais boutons et liens, `aria-current`, modales `role="dialog"` avec focus sur « Annuler »,
  Échap, focus piégé ; toasts `role="status"` ; statuts avec couleur **+ icône + texte** ; cibles ≥ 44 px ;
  `prefers-reduced-motion` respecté. Liens hors périmètre (Accueil, Messages…) : toast « Hors de cette maquette ».

### Règles calculées

| Élément                   | Règle                                                                                                                                                                                        |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Statut d'un prestataire   | `Ajouté` → (Demander les devis) `Devis demandé` → (réponse) `Devis reçu` → (Retenir) `Retenu`                                                                                                |
| Statut d'un événement     | `Passé` si la date est dépassée ; `Devis en cours` si des devis sont demandés et plus aucun prestataire seulement « Ajouté » ; sinon `En préparation`                                        |
| Devis demandés / reçus    | demandés = tout sauf « Ajouté » ; reçus = « Devis reçu » + « Retenu »                                                                                                                        |
| Complétez votre événement | Catégories conseillées pour le type (mariage : traiteur, DJ, déco, photo, beauté, pâtisserie, danse) moins celles déjà présentes, 4 au plus ; « Découvrir » ouvre 04 filtré sur la catégorie |
| Date                      | « Aujourd'hui » figé au 27/11/2026 pour que les captures restent identiques ; date passée refusée                                                                                            |

## Thème

- Clair : les variables de `packages/config/tailwind/theme.css`, copiées telles quelles (mêmes noms).
- Sombre : `packages/config/tailwind/tokens.json → colorDark` (le thème sombre validé pour l'app mobile, lot M6c),
  mêmes noms de variables. Navbar sombre : la teinte `sidebar` du thème sombre.
- Bouton soleil / lune dans la navbar (et dans le menu du téléphone). Aucune nouvelle couleur, police ni logo :
  logos officiels copiés de `apps/web/public/`, icônes lucide (celles du site) générées dans `js/icons.js`.
- Contrastes : texte sur `cta` en `cta-foreground` (brun, 8:1) ; textes secondaires en `muted-foreground`
  (7,4:1 en clair) ; badges sur fonds `-muted` des tokens.

## Données fictives

| Événement           | Type         | Date                  | Ville       | Invités | Prestataires (statut)                                                                                                                                              |
| ------------------- | ------------ | --------------------- | ----------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Mariage de Aïssatou | Mariage      | 10 févr. 2027 (merc.) | Paris       | 150     | Saveurs de Dakar (Devis reçu), Douceurs Créoles (Devis reçu), DJ Kizomba (Devis demandé), Décor Afrik (Ajouté) → 4 prestataires, 2 devis reçus, « En préparation » |
| Anniversaire 30 ans | Anniversaire | lun. 24 mai 2027      | Saint-Denis | 80      | DJ Kizomba (Devis demandé), Décor Afrik (Devis demandé), Douceurs Créoles (Devis reçu) → 3 prestataires, 1 devis reçu, « Devis en cours »                          |

Catalogue : 11 prestataires fictifs (Saveurs de Dakar, DJ Kizomba, Décor Afrik, Douceurs Créoles, Belle Afro,
Studio Sankofa, Ndombolo Dance Crew, Kompa Vibes Haïti, Awa Diallo, Jour J by Mariama, Teranga Traiteur),
10 catégories, 8 villes d'Île-de-France. Photos : les 8 images du site (`public/images`), réutilisées.

## Fichiers

```
maquette/evenements/
├── index.html          accès rapide aux écrans (clair / sombre), réinitialisation
├── app.html            l'application (navbar, onglets client, barre du bas, modales, toasts)
├── css/styles.css      tokens + composants + responsive (≥ 1024, 768–1023, < 768 px)
├── js/app.js           données, routeur, écrans, modales, toasts, persistance
├── js/icons.js         icônes lucide générées depuis lucide-react (licence ISC)
├── assets/             logos officiels, photos du site
└── (screenshots/)      captures générées localement, jamais commitées (règle du projet)
```

## Captures

Les 58 captures (32 demandées + états complémentaires + 430 px + avant / après) ont été prises par Playwright
dans les vraies pages et montrées à Mouss. Elles **ne sont pas versionnées** (règle du projet : aucune capture
dans le dépôt) ; elles se régénèrent en rejouant les adresses du tableau « Écrans » à 1440 × 900 et 390 × 844.

## Validation visuelle (3 cycles)

À chaque cycle : 14 écrans × 2 thèmes × 2 formats, plus 430 px ; contrôle automatique des erreurs JavaScript et
du débordement horizontal ; comparaison à la planche.

**Cycle 1** : aucun débordement ni erreur après deux corrections bloquantes (le menu caché recouvrait la page :
`display: flex` l'emportait sur `hidden`). Écarts relevés :

1. Téléphone : contenu collé aux bords (la marge de `.page` écrasait celle de `.container`) ; même cause sur
   ordinateur (contenu 48 px trop large).
2. Onglets de l'espace client non alignés sur le contenu.
3. Liens de la navbar non centrés (le site les centre).
4. Question de l'étape 1 trop légère.
5. Message proposé avec le nom en minuscules ; aide sur les coordonnées qui liait leur affichage à « retenu »
   (faux : retenir n'est pas réserver).
6. Téléphone : en-tête de 01 sur 3 lignes (planche : titre + « + Créer ») ; indicateurs du détail trop hauts ;
   photo du détail trop haute.

**Cycle 2** : 1 à 6 corrigés (marges haut/bas seulement, `margin: 0 auto`, bouton court « Créer », indicateurs en
4 colonnes sans icône, photo 140 px). Restaient : interligne des libellés d'indicateurs, navbar toujours pas
centrée (`margin: auto` sans effet sur une liste en pleine largeur). Corrigés.

**Cycle 3** (final) : corrections confirmées, aucune erreur, aucun débordement (390, 430, 1440 px). Problème
restant ci-dessous.

## Écarts avec la planche (assumés)

- **Date** : le 10 février 2027 est un **mercredi** ; la planche écrit « Sam. ». La maquette calcule le jour
  (« Mer. 10 févr. 2027 »). Pour un samedi : 13 février 2027.
- **Texte des boutons orange** en brun (`cta-foreground`, 8:1), pas en blanc comme sur la planche (blanc sur
  `#F0A422` ≈ 2:1, illisible) : règle de la charte.
- **Titres** en Playfair Display (charte : h1–h3) ; la planche en montre certains en sans-serif.
- **« Retenir »** : bouton ajouté sur les prestataires « Devis reçu » (la planche affiche le statut « Retenu »
  mais pas comment y arriver). Indicateur « retenus » dans le détail.
- **« Complétez votre événement »** calculé (la planche propose « Traiteur » alors qu'un traiteur est déjà
  ajouté).
- **Indicateurs** du détail (4 cartes) : demandés par la mission, absents de la planche.
- **Messages d'erreur** au vouvoiement, comme la planche, alors que le site tutoie dans ses erreurs
  (`agents/conventions.md`) : à harmoniser à l'intégration.
- **Photos** : les 8 photos du site sont réutilisées (deux prestataires peuvent partager une image) ; pas de logos
  de prestataires (non fournis).
- **Fiche prestataire** simplifiée (la vraie fiche du site garde ses onglets) : elle ne sert qu'à montrer
  « Ajouter à un événement ».

## Problèmes restants

- **Téléphone, écran 06** : dans les lignes à cocher, le badge de statut prend de la place et les noms se coupent
  (« DJ / Kizomba », « Saveurs / de Dakar »). Correction proposée : badge sous le nom en dessous de 768 px. Non
  faite (limite de 3 cycles).
- Le badge « Vérifié » est une icône seule (texte pour les lecteurs d'écran) : à aligner sur le badge du site.

## Hypothèses (non validées)

- Un prestataire peut être dans plusieurs événements (DJ Kizomba est dans les deux).
- Pas de nouvelle demande de devis au même prestataire pour le même événement (case grisée « déjà contacté »).
- On peut retirer un prestataire après lui avoir demandé un devis (avertissement dans la modale) ; le devis reste
  dans la messagerie mais n'est plus suivi dans l'événement.
- Le budget indicatif est envoyé aux prestataires (il figure dans le récapitulatif de la demande).
- On peut retenir plusieurs prestataires de la même catégorie.
- Un événement passé reste visible avec le statut « Passé ».
- La suppression d'un événement ne prévient pas les prestataires (rien n'est envoyé).
- Aucune coordonnée n'est transmise : les échanges passent par la messagerie (règle n° 7 du projet).

## Questions ouvertes

1. Un prestataire peut-il être dans plusieurs événements ?
2. Peut-on redemander un devis au même prestataire pour le même événement ?
3. Peut-on retirer un prestataire après lui avoir demandé un devis ?
4. Que devient un devis reçu si le prestataire est retiré ?
5. Le budget indicatif est-il visible par les prestataires ?
6. Peut-on retenir plusieurs prestataires d'une même catégorie ?
7. Comment gérer les événements passés ?
8. Supprimer un événement doit-il prévenir les prestataires déjà contactés ?
9. **« Événements » change de sens** (événements publics de la communauté → planificateur personnel). Que voit
   un visiteur non connecté qui clique sur « Événements » : la connexion, ou une page de présentation du
   planificateur ?
10. **Barre du bas mobile** : la planche montre Demandes / Réservations / Messages / Événements ; l'app actuelle a
    Accueil / Recherche / Demandes / Messages / Compte. Lequel garder (5 onglets max) ?
11. Une demande de devis groupée crée-t-elle **une demande par prestataire** (le modèle actuel :
    `QuoteRequest` par prestataire), rattachées à l'événement ? Il faudra une entité `Event` et un lien
    `EventProvider` dans `packages/common` (schémas, mocks, règles, tests).
12. Le 10 février 2027 de la planche est un mercredi : garder la date ou passer au samedi 13 ?
13. **Captures** : retirées avant le commit (règle du projet), à régénérer si besoin.
