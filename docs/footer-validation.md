# Pied de page unique : intégration et validation visuelle

Demande de Mouss (25/11/2026) : le même pied de page sur toutes les pages, d'après sa maquette. Méthode :
**coder → capturer → comparer → corriger** (3 cycles maximum, [`agents/conventions.md`](../agents/conventions.md)).
Captures prises dans `docs/screenshots/footer/` pendant le travail, **jamais commitées** et supprimées avant la PR.

## 1. Référence

| Élément                   | Valeur                                                                |
| ------------------------- | --------------------------------------------------------------------- |
| Maquette                  | Image jointe par Mouss le 25/11/2026 (non versionnée)                 |
| Résolution de comparaison | **2167 × 726** (taille de la maquette), capture du pied de page seul  |
| Autres formats            | 1440, 1280, tablette 820, mobile 390                                  |
| Design system             | Jetons du thème uniquement (`foreground`, `cta`, blancs translucides) |

### Analyse (pixels réels)

| Zone             | Mesures                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------ |
| Contenu          | x 135 → 2033 ; 5 colonnes à partir de y ≈ 165 ; filets verticaux à x 614, 906, 1299        |
| Marque           | Logo, description 3 lignes (~21 px), 5 pastilles sociales (~52 px) à y ≈ 400               |
| Découvrir / Aide | Titre 23 px gras, liens 21 px, pas de ~43 px                                               |
| Je suis          | 2 entrées : icône orange, titre gras, sous-titre 18 px (pas de ~100 px)                    |
| Restez informé   | Carte translucide x 1615 → 2033, y 164 → 445 ; champ e-mail en pilule + bouton rond orange |
| Barre légale     | Filet à y ≈ 538 ; copyright à gauche, 3 liens séparés par «                                | » à droite ; hauteur totale 726 |

## 2. Développement

- `components/layout/SiteFooter.tsx` dans les **4 gabarits** (public, client, pro, admin) ; l'ancien pied de page
  (public seulement) est remplacé.
- Données : `components/layout/footerContent.ts` (liens, parcours, réseaux sociaux) ; `NewsletterForm.tsx` ;
  `SocialIcon.tsx` (pictogrammes simples : lucide ne fournit plus les icônes de marques).
- Tailles en `clamp()` à partir de 1280 px : elles retrouvent celles de la maquette à 2167 px.
- Liens : Découvrir → `/`, `/recherche`, `/evenements`, `/offres`, `/comment-ca-marche` ; Je suis → `/devenir-prestataire`,
  `/recherche` ; Aide → `/comment-ca-marche`, `/contact` (nouvelle page « bientôt disponible »), `/faq` ; légal →
  `/mentions-legales`, `/confidentialite`, `/cgu`.

## 3. Cycles

**Cycle 1** — conformes : positions des colonnes et des filets (599 / 894 / 1290 contre 614 / 906 / 1299), titres
(y 165, 23 px), liens (21 px), carte newsletter, barre légale, mobile ; aucun débordement.
Écarts : listes trop aérées (pas de 55 px contre 43, 1er lien 98 px sous le titre contre 67) ; « Je suis » (111 contre 100) ; description trop basse et trop étroite ; pictogrammes sociaux petits ; d'où une carte newsletter de 344 px
(280) et un filet à y 601 (538).

**Cycle 2** — espacements resserrés, description élargie et remontée, pictogrammes 24 px.
Bilan à 2167 px : hauteur **718** (726), colonnes 292 (280), filet **y 550** (538), réseaux sociaux y 404 (400).
Écart : à 1280 px, 5 colonnes trop serrées (sous-titres sur 2 lignes, « Aide & Support » contre la carte).

**Cycle 3** — 5 colonnes à partir de 1400 px ; en dessous, la disposition tablette. Résultat : à 2167 px le footer
restait en 3 colonnes (`min-[1400px]:` est généré avant `md:` et perd).

**Correction après le cycle 3** (assumée et signalée) : disposition tablette limitée à une plage
(`md:max-[1399px]:`). Vérifiée par mesure : 5 colonnes à 2167 et 1440 px (identiques au cycle 2), disposition
tablette à 1280 et 820 px, 2 colonnes puis 1 sur mobile, aucun débordement.

## 4. Vérifications

| Point                     | Résultat                                                                                   |
| ------------------------- | ------------------------------------------------------------------------------------------ |
| Même pied de page partout | ✅ tests Vitest (FAQ, espace pro) et Playwright (`/`, `/faq`, `/recherche`, espace client) |
| Liens                     | ✅ tests (Découvrir, Je suis, Aide, légal)                                                 |
| Lettre d'information      | ✅ adresse invalide refusée ; message honnête (rien n'est enregistré)                      |
| Réseaux sociaux           | ✅ pastilles non cliquables tant qu'il n'y a pas de compte                                 |
| Accessibilité             | ✅ axe-core (pages publiques, espace client)                                               |
| Débordement horizontal    | ✅ aucun (5 formats)                                                                       |

## 5. Écarts assumés et points restants

| Point                        | Détail                                                                                                     |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Logo                         | Logo existant (version claire) : la maquette montre un autre logo (« wenzee » en minuscules).              |
| Fond                         | Brun uni, sans halos ni motifs géométriques (dernière consigne de Mouss : fonds unis, sans petits décors). |
| Réseaux sociaux              | Pas encore de comptes : pastilles non cliquables (adresses à renseigner dans `footerContent.ts`).          |
| Lettre d'information         | Pas de back-end : rien n'est enregistré (lot Supabase / emails).                                           |
| « Contactez-nous »           | Page « bientôt disponible ».                                                                               |
| Mention « données fictives » | Ajoutée discrètement à côté du copyright (le site en ligne utilise des données de démonstration).          |
| Description                  | Passe à la ligne après « en » au lieu de « France » (police Inter un peu plus large que la maquette).      |
