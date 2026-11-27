# Reports à faire dans l'app mobile

Demande de Mouss (27/11/2026) : **les nouveautés du site ne sont pas reportées tout de suite dans l'app mobile.**
On les note ici, et on les fera dans l'app plus tard, en lots dédiés (voir [`sprint-mobile.md`](sprint-mobile.md)).

> **À tenir à jour dans chaque PR du site** : toute fonctionnalité, tout champ ou tout changement de comportement
> qui existe sur le site mais pas dans l'app est ajouté ici. Quand un report est fait, on le coche avec la date et le
> numéro de PR.

Rappels pour l'app : textes dans `packages/common/src/i18n/fr.ts` **et** `en.ts` ; tests Jest + Testing Library
React Native ; les schémas, hooks et le faux serveur de `@afro/common` sont **déjà partagés** (rien à refaire côté
données, seulement les écrans).

## Refonte de « Mon compte » (site, 27/11/2026)

Détail côté site : [`docs/account-redesign-validation.md`](../docs/account-redesign-validation.md).
Écrans mobiles concernés : `apps/mobile/src/features/account/` (`AccountInfoScreen`, `NotificationsScreen`,
`useSaveAccount`).

| #   | Report                                                                                                                                                                                          | Déjà prêt dans `@afro/common`                                                                        | Fait |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ---- |
| M-1 | **Ville** du compte : champ facultatif dans « Mes informations »                                                                                                                                | `user.city`, `accountFormSchema.city`, `accountDefaults`, `toUpdateMeInput`, `PATCH /me`             | ☐    |
| M-2 | **Photo de profil** : choisir une image (expo-image-picker), aperçu, enregistrer, retirer ; l'afficher dans l'en-tête du compte                                                                 | `user.avatarUrl`, `accountFormSchema.avatarUrl` (data URL au MVP, Supabase Storage au lot 10)        | ☐    |
| M-3 | **Changer son mot de passe** (actuel, nouveau, confirmation, règles cochées en direct) ; message pour un compte Google / Apple                                                                  | `useChangePassword`, `changePasswordFormSchema`, erreurs `wrong_password` / `no_password` traduites  | ☐    |
| M-4 | « Membre depuis {mois année} » sous le nom                                                                                                                                                      | `user.createdAt` (le site formate en UTC avec `Intl`, voir `memberSince` dans `accountSections.ts`)  | ☐    |
| M-5 | Notifications **regroupées** (Messages / Demandes et réservations / Actualités) avec une description par sujet et des interrupteurs ; « Annuler » qui remet les valeurs enregistrées            | Mêmes `notificationPrefs` ; libellés du site dans `apps/web/src/features/account/lib/accountForm.ts` | ☐    |
| M-6 | Avertir avant de quitter un écran du compte avec des modifications non enregistrées                                                                                                             | —                                                                                                    | ☐    |
| M-7 | Rubrique **Préférences** : affichage des résultats (grille / liste) et « Vider mes favoris », seulement quand l'app aura ces réglages (aujourd'hui : pas de favoris ni de vue liste dans l'app) | —                                                                                                    | ☐    |

**Important avant M-1 et M-2** : l'app renvoie déjà la ville et la photo telles quelles quand elle enregistre le
compte (elle part de `accountDefaults(user)`), donc **elle ne les efface pas**. Ne pas casser ce comportement en
construisant l'envoi à la main.

## Plus tard

Les autres nouveautés du site déjà absentes de l'app sont suivies dans
[`questions-ouvertes.md`](questions-ouvertes.md) (par exemple n° 27 : pas d'onglet Événements dans l'app) ;
elles pourront être rangées ici au fil des prochaines PR.
