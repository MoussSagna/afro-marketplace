import { formatPrice } from '@afro/common';

/** Le prix « dès 25 € », ou « Sur devis » quand le prestataire n'affiche pas de prix. */
export function priceLabel(priceFrom: number | undefined): string {
  return priceFrom === undefined ? 'Sur devis' : `dès ${formatPrice(priceFrom)}`;
}
