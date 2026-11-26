/** Un trou dans la suite des numéros de page (affiché « … »). */
export type PageGap = 'gap';

/**
 * Les numéros de page à afficher dans la pagination :
 * - 7 pages ou moins : toutes ;
 * - sinon : la première, la dernière, la page courante et ses voisines, avec « … » entre les trous.
 *   On garde toujours 7 éléments, pour que la barre ne change pas de largeur en avançant.
 *
 * pageRange(5, 10) → [1, 'gap', 4, 5, 6, 'gap', 10]
 */
export function pageRange(current: number, total: number): (number | PageGap)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  let pages: number[];
  if (current <= 4) pages = [1, 2, 3, 4, 5, total];
  else if (current >= total - 3) pages = [1, total - 4, total - 3, total - 2, total - 1, total];
  else pages = [1, current - 1, current, current + 1, total];

  const result: (number | PageGap)[] = [];
  pages.forEach((page, index) => {
    const previous = pages[index - 1];
    if (previous !== undefined && page - previous > 1) result.push('gap');
    result.push(page);
  });
  return result;
}
