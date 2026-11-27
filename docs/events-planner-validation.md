# Planificateur d'événements (page « Événements ») : intégration et validation visuelle

> Les captures de chaque cycle ont servi à la comparaison mais **ne sont pas versionnées** (règle de Mouss).
> Ce document garde les mesures, les écarts relevés et les corrections.

Intégration dans le site de la page « Événements » maquettée dans `maquette/evenements/` (planche de Mouss du
27/11/2026). Méthode : **coder → capturer → comparer → corriger → recapturer**, 3 cycles maximum
([`agents/conventions.md`](../agents/conventions.md)).

## 1. Référence

| Élément                | Valeur                                                                                                                                                    |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Planche                | Jointe par Mouss le 27/11/2026 (non versionnée) ; maquette HTML : `maquette/evenements/`                                                                  |
| Formats de comparaison | Ordinateur 1440 × 900, téléphone 390 × 844 (densité 2), Chromium (Playwright 1.63)                                                                        |
| Compte de test         | Aïssatou (`user-aissatou`), données de démo (seed neuf)                                                                                                   |
| Écrans                 | 01 liste, 02 création (+ erreurs), 03 détail, 04 ajout, 05 retrait, 06 devis, 07 modification, 08 suppression (+ toast), fiche « Ajouter à un événement » |

**Avant** : `/evenements` = page publique « Bientôt disponible » (événements de la communauté).
**Après** : `/evenements` = « Mes événements », connexion exigée, gabarit `EventsLayout` (navbar du site, sans badge ni onglets de l'espace client, à la demande de Mouss).

## 2. Ce qui a été fait

Voir [`agents/avancement.md`](../agents/avancement.md) (section « planificateur d'événements ») : entité et règles
dans `@afro/common`, statuts calculés à partir des **vraies demandes de devis**, « Demander les devis » qui crée une
demande par prestataire avec les règles existantes, 6 pages dans `features/events/`, « Ajouter à un événement » sur
la fiche, toasts et fenêtre de confirmation partagés.

## 3. Cycles de comparaison

### Cycle 1 : première intégration

Contrôle automatique (erreurs JavaScript, débordement horizontal) sur 11 écrans × 2 formats, puis comparaison :

| #   | Écart                                                                                                                                                                    | Priorité |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| 1   | Téléphone, « Ajouter un prestataire » : **209 px de débordement** (grille sans colonne déclarée, noms tronqués qui l'élargissaient ; bouton « Ajouter » hors de l'écran) | Haute    |
| 2   | Après une suppression, le détail se rechargeait avant le retour à la liste : **appel en 404** (console)                                                                  | Haute    |
| 3   | Téléphone : noms de prestataires coupés (« Saveurs de D… »)                                                                                                              | Basse    |

Le reste suit la planche : en-tête du détail (photo, nom, statut, méta, Modifier / Supprimer), 4 indicateurs,
groupes par famille, « Complétez votre événement », actions collantes sur téléphone, stepper, modales.

### Cycle 2 : corrections 1 à 3

1. `grid-cols-1` sur la grille des résultats (et des squelettes).
2. `useDeleteEvent` : `invalidateQueries(…, { refetchType: 'none' })` ; la liste se recharge en s'affichant.
3. Nom sur 2 lignes (`line-clamp-2`) au lieu d'être tronqué.

Recapture : aucune erreur, aucun débordement. Les tests d'écran ont révélé en plus deux bugs, corrigés :
« Annuler » restaurait bien l'événement mais le toast « Événement restauré » ne s'affichait pas (`onSuccess` de
`mutate` ignoré une fois la page quittée → `mutateAsync().then()`) ; le filtre « Catégorie » venu de « Découvrir »
n'était pas sélectionné quand la liste se remplissait après coup (`key` sur la liste).

### Cycle 3 : validation finale

11 écrans × 2 formats : aucune erreur JavaScript, aucun débordement. Le défaut restant de la maquette (écran 06 sur
téléphone, noms coupés par le badge) est réglé dans le site : le badge passe sous le nom.

## 4. Écarts assumés (avec la planche et la maquette)

- **Code postal** ajouté à l'étape 2 : obligatoire pour une demande de devis (`eventPostalCode`).
- **Statuts supplémentaires** « Réservé » (devis accepté) et « Sans suite » (demande déclinée, expirée ou
  annulée) : les vraies demandes peuvent finir ainsi. « Retenir » n'existe qu'après un devis reçu.
- **Familles** du catalogue (Traiteur & boissons, Musique & animation…) au lieu des catégories fictives de la
  maquette ; photos des prestataires : celles du seed (`picsum.photos`).
- **Pas de thème sombre** dans le site (la maquette en a un) ; **pas de barre d'onglets en bas** sur téléphone
  (« Événements » est dans le menu ☰ ; pas d'onglets de l'espace client sur ces pages).
- **Date** : le jour de la semaine est calculé (le seed place le mariage à J+75).
- **Erreurs au tutoiement** (convention du site), textes de l'interface au vouvoiement (planche).
- **« Demande »** : lien vers la demande de devis créée, sur chaque prestataire contacté (pas dans la planche).

## 5. Points ouverts

Question ouverte n° 27 ([`agents/questions-ouvertes.md`](../agents/questions-ouvertes.md)) : hypothèses métier à
confirmer, changement de sens de « Événements », onglet de l'app mobile, tables Supabase au lot 10.
