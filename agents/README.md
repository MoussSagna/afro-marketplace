# Dossier `agents/` : la mémoire du projet

Ce dossier rassemble tout ce qu'un agent (ou un humain) doit savoir avant de toucher au code.
Il est lu en premier : `AGENTS.md` et `CLAUDE.md` à la racine y renvoient.

> **Règle d'or : ces fichiers sont tenus à jour dans la même PR que le code.**
> Une PR qui change une décision, une convention, une commande ou l'avancement d'un lot
> met à jour le fichier concerné. Au minimum, chaque PR met à jour [`avancement.md`](avancement.md).

## Par où commencer

| Fichier                                          | Contenu                                                                           | Quand le lire                                   |
| ------------------------------------------------ | --------------------------------------------------------------------------------- | ----------------------------------------------- |
| [`produit.md`](produit.md)                       | Le projet, les décisions produit validées, le périmètre du MVP, le vocabulaire    | Toujours                                        |
| [`avancement.md`](avancement.md)                 | État des lots, PR ouvertes, prochaines étapes, questions en suspens               | Toujours                                        |
| [`architecture.md`](architecture.md)             | Monorepo, `packages/common`, app web, mocks, comment ajouter une route            | Avant de coder                                  |
| [`conventions.md`](conventions.md)               | Langue, nommage, montants, dates, tests exigés, Git et PR                         | Avant de coder                                  |
| [`questions-ouvertes.md`](questions-ouvertes.md) | Décisions reportées et questions à impact : choix actuel, impact, échéance        | Avant de toucher à une fonctionnalité concernée |
| [`regles-metier.md`](regles-metier.md)           | Les 9 règles métier et la fonction qui implémente chacune                         | Avant de toucher à `rules/` ou aux handlers     |
| [`donnees-demo.md`](donnees-demo.md)             | Comptes de démo, scénarios du seed, comment réinitialiser                         | Pour tester ou écrire un test                   |
| [`commandes.md`](commandes.md)                   | Commandes utiles et pièges de l'environnement                                     | Pour lancer, tester, déboguer                   |
| [`conception/`](conception/)                     | Les 4 documents de conception validés (parcours, modèle, architecture, découpage) | Pour le détail d'un écran ou d'une entité       |

## Qui est Mouss

Le porteur du projet. Développeur React (TypeScript, Vite, Tailwind), plus débutant sur l'architecture
d'application : **explique tes choix de façon pédagogique**, en français, sans jargon inutile.
Il veut des tests unitaires **et** fonctionnels pour chaque fonctionnalité.

## Les documents de conception

Ils sont copiés dans `conception/` (source : les fichiers du projet, `etape-1` à `etape-4`).
S'ils sont modifiés côté projet, recopie-les ici. Ils décrivent la cible ; quand le code s'en écarte
volontairement, note l'écart dans `avancement.md` (section « Écarts assumés »).
