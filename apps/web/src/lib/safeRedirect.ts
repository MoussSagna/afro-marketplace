/**
 * Valide l'adresse de retour après connexion (`/connexion?retour=/espace/demandes`).
 *
 * On n'accepte qu'un chemin INTERNE : sinon, un lien piégé comme
 * `/connexion?retour=https://site-pirate.com` renverrait l'utilisateur, tout juste
 * connecté, vers un faux site. C'est une faille classique (« open redirect »).
 */
export function safeRedirect(target: string | null | undefined, fallback: string): string {
  if (!target) return fallback;
  // Un chemin interne commence par « / » mais pas par « // » (qui veut dire « autre site »),
  // et ne contient pas de « \ » (que certains navigateurs lisent comme « / »).
  if (!target.startsWith('/') || target.startsWith('//') || target.includes('\\')) {
    return fallback;
  }
  // On ne renvoie pas vers la page de connexion elle-même.
  if (target === '/connexion' || target.startsWith('/connexion?')) return fallback;
  return target;
}
