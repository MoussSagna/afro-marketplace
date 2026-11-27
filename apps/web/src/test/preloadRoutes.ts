import type { RouteObject } from 'react-router';

/**
 * Charge d'avance toutes les pages « lazy » du routeur, pour les tests Vitest.
 *
 * Pourquoi ? Dans l'application, chaque page est chargée à la demande (`lazy`) : le routeur
 * télécharge son code au moment de la navigation, puis l'affiche. En test, ce chargement passe par
 * Vitest, qui compile les fichiers à la volée. Sur la CI (petite machine, qui fait tourner le lint,
 * les types et le build en même temps), compiler une page peut prendre plus de 5 secondes : un test
 * qui clique sur « Rechercher » attend alors la page de résultats en vain (l'accueil reste affiché),
 * et échoue au hasard.
 *
 * En chargeant les pages une fois avant les tests (`beforeAll` de `setup.ts`), la navigation ne
 * dépend plus de la vitesse de la machine. Le vrai chargement à la demande reste vérifié par
 * Playwright, sur le site construit.
 *
 * Les routes sont modifiées sur place : `lazy` est remplacé par ce qu'il renvoie (`Component`, `element`…).
 */
export async function preloadLazyRoutes(routes: RouteObject[]): Promise<void> {
  await Promise.all(
    routes.map(async (route) => {
      if (typeof route.lazy === 'function') {
        const loaded = await route.lazy();
        Object.assign(route, loaded);
        delete route.lazy;
      }
      if (route.children) await preloadLazyRoutes(route.children);
    }),
  );
}
