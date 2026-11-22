# Étape 1 : Parcours utilisateurs

Marketplace de prestataires afro (traiteurs, danse, shows, speakers, DJ, coiffure événementielle, etc.), France d'abord.
Version 1, 22 novembre 2026. Ce document ne contient pas de code. Il sert de base à l'étape 2 (modèle de données).

---

## 0. Comment lire ce document

Un **parcours utilisateur** décrit, pas à pas, ce qu'une personne fait pour atteindre un objectif (« trouver un traiteur pour mon mariage »). Chaque étape d'un parcours fait apparaître un ou plusieurs **écrans**, et chaque écran manipule des **données** (un prestataire, une demande, un avis…). C'est pour ça qu'on commence par les parcours : ils dictent les écrans (étape 4) et les données (étape 2).

Les points marqués **🔶 Choix ouvert** sont des décisions que tu dois trancher. Ils sont tous regroupés en section 6 avec ma recommandation.

---

## 1. Les trois espaces

| Espace          | Qui                                                                                                       | Objectif principal                                                                         |
| --------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| **Client**      | Particulier (mariage, baptême, anniversaire) ou pro (entreprise, asso, mairie, organisateur d'événements) | Trouver un prestataire fiable, le contacter, réserver, payer, laisser un avis              |
| **Prestataire** | Indépendant ou petite structure (traiteur, troupe de danse, artiste, conférencier…)                       | Être visible, recevoir des demandes, gérer son agenda, être payé, construire sa réputation |
| **Admin**       | Toi (et plus tard une petite équipe)                                                                      | Valider les prestataires, modérer, gérer les litiges, suivre l'activité                    |

Un **visiteur** non connecté peut déjà chercher et consulter les profils. Il ne crée un compte qu'au moment de contacter un prestataire. C'est important : demander un compte trop tôt fait fuir les gens.

Une même personne peut être client **et** prestataire (une danseuse qui cherche un traiteur). 🔶 Choix ouvert n°1 : un seul compte avec deux « casquettes », ou deux comptes séparés.

---

## 2. Espace client

### 2.1 Découvrir et chercher

1. Le visiteur arrive sur l'**accueil** : barre de recherche (« Quoi ? » + « Où ? » + « Quand ? »), catégories mises en avant, prestataires populaires, comment ça marche.
2. Il tape une recherche ou clique sur une catégorie → **page de résultats**.
3. Il filtre :
   - **Catégorie / sous-catégorie** (ex. Nourriture › Traiteur sénégalais ; Spectacle › Danse coupé-décalé)
   - **Origine culturelle / pays** (Sénégal, Côte d'Ivoire, Cameroun, Congo, Antilles…) : c'est un filtre différenciant par rapport aux plateformes généralistes
   - **Zone** (ville + rayon de déplacement du prestataire)
   - **Date** (n'afficher que les prestataires disponibles)
   - **Budget** (fourchette de prix)
   - **Nombre d'invités** (utile pour les traiteurs)
   - **Note minimale**, **prestataire vérifié**
4. Il trie (pertinence, note, prix, distance) et bascule éventuellement en **vue carte**.
5. Il ajoute des prestataires en **favoris** (demande un compte, ou stockage local avant connexion).

### 2.2 Consulter un profil prestataire

La page profil est la page la plus importante du site : c'est elle qui convainc. Elle contient :

- Photo de couverture, nom, catégorie, ville, badge « vérifié », note moyenne
- Présentation, spécialités, langues parlées, zone de déplacement
- **Galerie** photos et vidéos (indispensable pour danse et shows)
- **Prestations / formules** avec prix indicatif (ex. « Buffet 50 pers. à partir de 900 € », « Show 30 min : 400 € »)
- **Disponibilités** (calendrier simplifié)
- **Avis** clients
- Bouton principal : « Demander un devis » ou « Réserver » (selon le choix n°2)

### 2.3 Contacter : devis ou réservation

🔶 Choix ouvert n°2 : c'est la décision la plus structurante. Voici les deux modèles.

**Modèle A : demande de devis (recommandé pour démarrer)**

1. Le client clique « Demander un devis ».
2. Il remplit un formulaire guidé : type d'événement, date, lieu, nombre d'invités, budget, prestation souhaitée, message libre.
3. S'il n'a pas de compte, on lui demande de s'inscrire ici (email ou Google/Apple).
4. La demande arrive chez le prestataire, et une **conversation** s'ouvre.
5. Le prestataire répond avec un **devis** (montant, détail, validité, conditions d'annulation).
6. Le client accepte, refuse, ou négocie dans la messagerie.
7. Devis accepté → **réservation confirmée** → paiement (voir 2.4).

**Modèle B : réservation directe**

1. Le client choisit une formule à prix fixe et un créneau libre.
2. Il paie immédiatement.
3. Le prestataire confirme (ou c'est automatique).

Pourquoi A d'abord : un traiteur ne peut pas donner un prix sans connaître le nombre d'invités et le menu, un show dépend du lieu et de la durée. Le modèle B convient à des prestations standardisées (cours de danse, atelier). On peut proposer **A pour tout le monde au lancement**, puis ajouter B en option pour les formules fixes.

Une option intermédiaire utile : le client peut envoyer la **même demande à plusieurs prestataires** (jusqu'à 3) pour comparer. Très apprécié des clients, mais les prestataires reçoivent plus de demandes « froides ». 🔶 Choix ouvert n°3.

### 2.4 Payer

🔶 Choix ouvert n°4 : est-ce que le paiement passe par la plateforme ?

- **Oui (paiement intégré, via Stripe Connect)** : le client paie un **acompte** (ex. 30 %) à la réservation, le solde avant ou après l'événement. L'argent est retenu, puis versé au prestataire après la prestation. Avantages : confiance, protection contre les arnaques, commission facile à prélever. Inconvénient : plus complexe (vérification d'identité des prestataires, remboursements, litiges).
- **Non (paiement hors plateforme)** : le client paie le prestataire directement. Plus simple, mais tu ne peux pas prendre de commission et tu ne protèges personne.

Parcours si paiement intégré :

1. Devis accepté → page de **paiement** (récapitulatif, conditions d'annulation, montant de l'acompte).
2. Paiement par carte (plus tard : paiement en plusieurs fois).
3. **Confirmation** + email + ajout dans « Mes réservations ».
4. Rappel automatique du solde, rappel J-7 et J-1 de l'événement.
5. Après l'événement : le montant est versé au prestataire (sauf litige ouvert sous 48 h).

**Annulation** : le client annule depuis « Mes réservations ». Le remboursement dépend de la politique d'annulation du prestataire (souple / modérée / stricte, choisie dans une liste fixe pour rester simple).

### 2.5 Messagerie

- Une conversation par demande (liée à la demande et à son devis).
- Texte, photos, pièces jointes (menu PDF, fiche technique).
- Notifications par email et, plus tard, push sur mobile.
- Recommandation : masquer les numéros de téléphone et emails dans les messages **avant** la réservation, pour éviter que tout se règle hors plateforme. 🔶 Choix ouvert n°5 (dépend du n°4).
- Bouton « Signaler » sur chaque conversation.

### 2.6 Avis

1. Le lendemain de l'événement, le client reçoit une invitation à noter.
2. Il donne une note (1 à 5) + éventuellement des sous-notes (qualité, ponctualité, rapport qualité-prix) + un commentaire + photos.
3. **Seul un client avec une réservation terminée peut laisser un avis** : c'est ce qui rend les avis crédibles.
4. Le prestataire peut répondre publiquement une fois.
5. Un avis abusif peut être signalé → modération admin.

### 2.7 Compte client

- Mes demandes en cours / Mes réservations (à venir, passées, annulées)
- Messages
- Favoris
- Mes avis
- Profil, moyens de paiement, notifications, suppression du compte (obligatoire RGPD)

---

## 3. Espace prestataire

### 3.1 Inscription et onboarding

1. Page « Devenir prestataire » (argumentaire, tarifs si abonnement, témoignages).
2. Création du compte (email / Google / Apple).
3. **Onboarding guidé en étapes**, avec une barre de progression :
   1. Type : indépendant ou entreprise, SIRET (obligatoire ou non ? 🔶 Choix ouvert n°6)
   2. Catégorie(s) et sous-catégories, origine(s) culturelle(s)
   3. Zone d'intervention (ville + rayon, ou départements)
   4. Présentation, photo, galerie (minimum 3 photos pour être publié)
   5. Prestations et prix indicatifs
   6. Disponibilités
   7. Politique d'annulation
   8. Informations de paiement (si paiement intégré : vérification d'identité Stripe)
4. Envoi en **validation** → statut « En attente ».
5. L'admin valide (ou demande des corrections) → le profil devient **publié** et apparaît dans la recherche.

Le prestataire peut sauvegarder et revenir plus tard : l'onboarding doit être reprenable.

### 3.2 Gérer son profil

- Modifier présentation, galerie, prestations, prix
- Prévisualiser le profil comme un client le voit
- Mettre le profil en pause (vacances, complet)

### 3.3 Recevoir et traiter les demandes

1. Nouvelle demande → notification (email, plus tard push et éventuellement SMS).
2. Le prestataire voit le détail : date, lieu, invités, budget, message.
3. Trois actions : **Répondre avec un devis**, **Poser une question**, **Décliner** (avec motif rapide).
4. Création du devis : lignes de prestation, montant total, acompte, validité, conditions.
5. Suivi : demande → devis envoyé → accepté / refusé / expiré → réservation → terminée.
6. Le **temps de réponse moyen** est affiché sur son profil : ça l'encourage à répondre vite.

### 3.4 Gérer son agenda

- Calendrier mois / semaine
- Les réservations confirmées bloquent automatiquement la date
- Il peut bloquer des dates manuellement (indisponible)
- Plus tard : synchronisation Google Calendar
- 🔶 Choix ouvert n°7 : un prestataire peut-il faire plusieurs prestations le même jour (un traiteur oui, un groupe de danse peut-être) ? Proposition simple : un réglage « nombre max de prestations par jour ».

### 3.5 Paiements et revenus (si paiement intégré)

- Liste des paiements reçus, à venir, versés
- Commission prélevée, factures
- Coordonnées bancaires (gérées par Stripe)

### 3.6 Avis et statistiques

- Liste des avis, répondre à un avis, signaler un avis
- Statistiques simples : vues du profil, nombre de demandes, taux de réponse, taux de conversion

### 3.7 Abonnement (selon modèle économique)

- Choix d'une offre, paiement mensuel, factures, résiliation
- Voir choix n°8

---

## 4. Espace admin

L'admin n'a pas besoin d'être beau, il doit être efficace. Au MVP, il peut même être très minimal.

### 4.1 Validation des prestataires

1. File « Prestataires en attente ».
2. L'admin ouvre un dossier : infos, photos, SIRET, pièces.
3. Actions : **Valider**, **Demander des corrections** (message au prestataire), **Refuser** (motif).

### 4.2 Modération

- File des **signalements** : profils, avis, messages, photos
- Actions : masquer un contenu, avertir, suspendre, bannir un compte
- Historique des actions de modération (qui a fait quoi, quand)

### 4.3 Litiges (si paiement intégré)

1. Le client ou le prestataire ouvre un litige depuis la réservation (dans les 48 h après l'événement).
2. Le versement est gelé.
3. L'admin lit la conversation, demande des éléments aux deux parties.
4. Décision : versement total, remboursement partiel, remboursement total.

### 4.4 Catalogue et contenu

- Gérer les catégories, sous-catégories et origines culturelles (sans toucher au code)
- Mettre en avant des prestataires sur l'accueil
- Pages statiques (CGU, FAQ, mentions légales)

### 4.5 Suivi

- Tableau de bord : inscriptions, prestataires actifs, demandes, réservations, chiffre d'affaires, commission
- Recherche d'utilisateur, consultation d'un compte, réinitialisation

---

## 5. Écrans qui en découlent

Légende : **MVP** = indispensable pour lancer ; **V2** = plus tard.

### Public (visiteur)

| #   | Écran                                                                                    | Priorité |
| --- | ---------------------------------------------------------------------------------------- | -------- |
| P1  | Accueil                                                                                  | MVP      |
| P2  | Résultats de recherche + filtres                                                         | MVP      |
| P3  | Vue carte des résultats                                                                  | V2       |
| P4  | Page catégorie (ex. « Traiteurs africains à Paris », utile pour le référencement Google) | MVP      |
| P5  | Profil prestataire                                                                       | MVP      |
| P6  | Devenir prestataire                                                                      | MVP      |
| P7  | Comment ça marche, FAQ, CGU, mentions légales                                            | MVP      |
| P8  | Connexion / inscription / mot de passe oublié                                            | MVP      |

### Client

| #   | Écran                                                       | Priorité                |
| --- | ----------------------------------------------------------- | ----------------------- |
| C1  | Formulaire de demande de devis                              | MVP                     |
| C2  | Mes demandes et réservations (liste)                        | MVP                     |
| C3  | Détail d'une demande / réservation (statut, devis, actions) | MVP                     |
| C4  | Messagerie (liste + conversation)                           | MVP                     |
| C5  | Paiement (acompte / solde) + confirmation                   | MVP si paiement intégré |
| C6  | Laisser un avis                                             | MVP                     |
| C7  | Favoris                                                     | V2                      |
| C8  | Mon compte (profil, notifications, suppression)             | MVP                     |

### Prestataire

| #   | Écran                                                                | Priorité                |
| --- | -------------------------------------------------------------------- | ----------------------- |
| S1  | Onboarding en étapes                                                 | MVP                     |
| S2  | Tableau de bord (demandes récentes, prochaines dates, stats rapides) | MVP                     |
| S3  | Demandes reçues (liste + détail)                                     | MVP                     |
| S4  | Créer / envoyer un devis                                             | MVP                     |
| S5  | Messagerie (partagée avec le client, même composant)                 | MVP                     |
| S6  | Agenda                                                               | MVP (simple)            |
| S7  | Modifier mon profil + prévisualisation                               | MVP                     |
| S8  | Avis reçus + réponse                                                 | MVP                     |
| S9  | Paiements et revenus                                                 | MVP si paiement intégré |
| S10 | Statistiques détaillées                                              | V2                      |
| S11 | Abonnement                                                           | selon choix n°8         |

### Admin

| #   | Écran                                         | Priorité                                       |
| --- | --------------------------------------------- | ---------------------------------------------- |
| A1  | Tableau de bord                               | V2 (au début, quelques chiffres suffisent)     |
| A2  | Prestataires en attente + fiche de validation | MVP                                            |
| A3  | Signalements / modération                     | MVP                                            |
| A4  | Utilisateurs (recherche, fiche, suspension)   | MVP                                            |
| A5  | Litiges                                       | MVP si paiement intégré                        |
| A6  | Catégories et origines                        | V2 (au début, en dur dans les données mockées) |

Au total, environ **25 écrans au MVP**, dont plusieurs réutilisent les mêmes composants (messagerie, cartes prestataire, calendrier). Sur mobile (Expo), on commencera par l'espace client + la gestion des demandes côté prestataire ; l'admin reste web uniquement.

---

## 6. Choix ouverts à trancher

> ✅ **Décidé le 22/11/2026 : Mouss valide toutes les recommandations ci-dessous.** La colonne « Ma recommandation » est donc la décision retenue.

| #   | Question                                       | Options                                                                                                                                                          | Ma recommandation                                                                                                                                                                                                                                             |
| --- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Client et prestataire : un ou deux comptes ?   | Un compte avec deux rôles / deux comptes séparés                                                                                                                 | **Un compte, deux rôles.** Plus simple pour l'utilisateur, et facile à modéliser                                                                                                                                                                              |
| 2   | Devis ou réservation directe ?                 | A devis / B réservation directe / les deux                                                                                                                       | **Devis au lancement**, réservation directe en V2 pour les formules à prix fixe                                                                                                                                                                               |
| 3   | Une demande envoyée à plusieurs prestataires ? | Non / oui jusqu'à 3                                                                                                                                              | **Non au début** : moins de demandes « froides », prestataires plus contents. À tester ensuite                                                                                                                                                                |
| 4   | Paiement via la plateforme ?                   | Intégré (Stripe Connect) / hors plateforme                                                                                                                       | **Hors plateforme pour le tout premier test**, puis intégré dès que le modèle par commission est retenu. Avec les données mockées, on peut quand même concevoir les écrans de paiement dès maintenant                                                         |
| 5   | Masquer téléphones/emails avant réservation ?  | Oui / non                                                                                                                                                        | **Oui** si commission, **non** si abonnement                                                                                                                                                                                                                  |
| 6   | SIRET obligatoire pour les prestataires ?      | Obligatoire / facultatif (badge « pro vérifié »)                                                                                                                 | **Facultatif + badge**, beaucoup d'artistes et de cuisinières démarrent sans statut                                                                                                                                                                           |
| 7   | Plusieurs prestations par jour ?               | Non / réglage « max par jour »                                                                                                                                   | **Réglage max par jour** (1 par défaut)                                                                                                                                                                                                                       |
| 8   | **Modèle économique**                          | Commission sur réservation (10 à 15 %) / abonnement prestataire (comme AFCOMZ, ~15 à 35 €/mois) / freemium (gratuit + options payantes de mise en avant) / mixte | **Gratuit pour les prestataires au lancement** (il faut d'abord remplir le catalogue), puis **commission** sur les réservations payées en ligne, avec une mise en avant payante en option. L'abonnement seul est risqué tant qu'il n'y a pas de trafic client |
| 9   | Clients pros (entreprises, mairies) au MVP ?   | Oui (facture, devis entreprise) / plus tard                                                                                                                      | **Plus tard**, mais garder un champ « particulier / professionnel » dans la demande                                                                                                                                                                           |
| 10  | Zone de lancement                              | Toute la France / une ville (ex. Île-de-France)                                                                                                                  | **Île-de-France d'abord** : plus facile d'avoir assez de prestataires dans chaque catégorie pour que la recherche ne paraisse pas vide                                                                                                                        |

Les choix **2, 4 et 8** sont liés et ont le plus d'impact sur le modèle de données. Si tu ne tranches que ceux-là avant l'étape 2, c'est suffisant.

---

## 7. Prochaine étape

Une fois les choix tranchés : **étape 2, modèle de données** (Utilisateur, Profil prestataire, Prestation, Catégorie, Demande, Devis, Réservation, Paiement, Conversation, Message, Avis, Signalement, Disponibilité) avec leurs relations et les statuts de chaque objet (par exemple : demande → devis envoyé → acceptée → payée → terminée → avis laissé).
