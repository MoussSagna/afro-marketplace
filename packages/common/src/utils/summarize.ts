/**
 * Une phrase courte tirée d'un long texte (la bio d'un prestataire), pour les cartes des résultats :
 * - la première phrase si elle tient dans `max` caractères ;
 * - sinon, le texte coupé au dernier mot entier, suivi de « … ».
 * Renvoie `undefined` pour un texte vide (la carte n'affiche alors rien).
 */
export function summarize(text: string | undefined, max = 140): string | undefined {
  const clean = text?.replace(/\s+/g, ' ').trim();
  if (!clean) return undefined;

  const firstSentence = /^.+?[.!?](?=\s|$)/.exec(clean)?.[0];
  if (firstSentence && firstSentence.length <= max) return firstSentence;
  if (clean.length <= max) return clean;

  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  const words = lastSpace > max / 2 ? cut.slice(0, lastSpace) : cut;
  return `${words.replace(/[\s,;:.–-]+$/, '')}…`;
}
