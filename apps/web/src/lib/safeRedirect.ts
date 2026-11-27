/**
 * Valide l'adresse de retour après connexion (`/connexion?retour=/espace/demandes`).
 *
 * On n'accepte qu'un chemin INTERNE : sinon, un lien piégé comme
 * `/connexion?retour=https://site-pirate.com` renverrait l'utilisateur, tout juste
 * connecté, vers un faux site. C'est une faille classique (« open redirect »).
 */
/** Les pages d'authentification : jamais une destination après connexion. */
const AUTH_PAGES = ['/connexion', '/inscription', '/mot-de-passe-oublie'];

export function safeRedirect(target: string | null | undefined, fallback: string): string {
  if (!target) return fallback;
  // Un chemin interne commence par « / » mais pas par « // » (qui veut dire « autre site »),
  // et ne contient pas de « \ » (que certains navigateurs lisent comme « / »).
  if (!target.startsWith('/') || target.startsWith('//') || target.includes('\\')) {
    return fallback;
  }
  // On ne renvoie pas vers les pages de connexion elles-mêmes (connexion, inscription, mot de passe).
  const path = target.split(/[?#]/)[0];
  if (AUTH_PAGES.includes(path!)) return fallback;
  return target;
}
