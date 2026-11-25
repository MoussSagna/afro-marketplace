/**
 * « 28,50 » ou « 28.5 » ou « 1 200 » → 2850 / 2850 / 120000 centimes.
 * Renvoie undefined si ce n'est pas un montant valable.
 */
export function eurosToCents(value: string): number | undefined {
  const normalized = value.replace(/\s/g, '').replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return undefined;
  return Math.round(Number(normalized) * 100);
}

/** 2850 → « 28,50 » ; 120000 → « 1200 » (pour pré-remplir un champ). */
export function centsToEuros(cents: number): string {
  return cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2).replace('.', ',');
}
