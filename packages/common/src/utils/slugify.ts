/**
 * « Saveurs de Dakar » → « saveurs-de-dakar ».
 * Accents retirés, tout en minuscules, un tiret entre les mots.
 */
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Ajoute « -2 », « -3 »… tant que l'adresse est déjà prise. */
export function uniqueSlug(text: string, taken: ReadonlySet<string>): string {
  const base = slugify(text) || 'prestataire';
  let slug = base;
  for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`;
  return slug;
}
