import { getResponse, type RequestHandler } from 'msw';

/**
 * Un faux `fetch` qui répond avec les handlers MSW de `common`, sans réseau.
 *
 * Sur le site, MSW intercepte les requêtes dans un Service Worker. Un téléphone
 * n'en a pas : on donne donc directement ce `fetch` au client API. Chaque appel
 * construit une `Request`, cherche le handler qui correspond (« GET /api/categories »)
 * et renvoie sa réponse. Le jour du vrai back-end, on enlève ce fichier et le
 * client API utilisera le vrai `fetch`.
 */
export function createMockFetch(handlers: readonly RequestHandler[]): typeof fetch {
  return async (input, init) => {
    const url = input instanceof URL ? input.toString() : input;
    const request = new Request(url, init);
    const response = await getResponse([...handlers], request);
    if (response) return response;
    // Aucun handler pour cette route : comme un serveur, on répond 404 au format de l'API.
    const body = {
      code: 'not_found',
      message: `Route de démo inconnue : ${request.method} ${request.url}`,
    };
    return new Response(JSON.stringify(body), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  };
}
