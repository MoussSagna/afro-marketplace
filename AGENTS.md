# Instructions pour les agents

Avant toute chose, lis [`agents/README.md`](agents/README.md) : contexte produit, décisions, architecture,
conventions, règles métier, données de démo et état d'avancement.

L'essentiel :

- Réponds à Mouss **en français**, de façon pédagogique (dev React, débutant en architecture).
- Suis le découpage en lots ([`agents/conception/4-decoupage-mvp.md`](agents/conception/4-decoupage-mvp.md)), une PR par lot.
- Tests unitaires **et** fonctionnels exigés ; Playwright pour les parcours clés.
- Montants en centimes, dates ISO en UTC, types déduits des schémas Zod.
- **Chaque PR met à jour les fichiers de `agents/`** concernés, au minimum `agents/avancement.md`.
