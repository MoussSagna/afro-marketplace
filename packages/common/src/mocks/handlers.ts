import { delay, http, HttpResponse } from 'msw';
import { seedCategories, seedProviders } from './seed';

/*
 * Les « faux serveurs » MSW : ils interceptent les requêtes vers /api
 * et répondent avec les données mockées.
 * Les mêmes handlers servent dans le navigateur (dev), dans les tests Vitest
 * (Node) et plus tard dans l'app mobile.
 */
export const handlers = [
  http.get('*/api/categories', async () => {
    await delay(); // petit délai réaliste pour voir les états de chargement
    return HttpResponse.json(seedCategories);
  }),

  http.get('*/api/providers/featured', async () => {
    await delay();
    const featured = [...seedProviders].sort((a, b) => b.ratingAverage - a.ratingAverage);
    return HttpResponse.json(featured);
  }),
];
