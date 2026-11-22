import { describe, expect, it } from 'vitest';
import {
  MASKED_CONTACT_PLACEHOLDER as MASK,
  maskContactDetails,
  shouldMaskContactDetails,
} from './contactMasking';

describe('règle n° 7 : maskContactDetails', () => {
  it.each([
    '06 12 34 56 78',
    '06.12.34.56.78',
    '06-12-34-56-78',
    '0612345678',
    '+33 6 12 34 56 78',
    '+33612345678',
    '0033 6 12 34 56 78',
  ])('masque le téléphone « %s »', (phone) => {
    expect(maskContactDetails(`Appelle-moi au ${phone} !`)).toEqual({
      text: `Appelle-moi au ${MASK} !`,
      hasMaskedContent: true,
    });
  });

  it.each(['awa.diallo@mail.fr', 'contact+devis@saveurs-dakar.com'])(
    'masque l’email « %s »',
    (email) => {
      expect(maskContactDetails(`Écris-moi : ${email}`).text).toBe(`Écris-moi : ${MASK}`);
    },
  );

  it.each(['awa at mail point fr', 'awa (arobase) mail.fr', 'awa arobase mail dot com'])(
    'masque l’email déguisé « %s »',
    (email) => {
      expect(maskContactDetails(`Mon mail : ${email}`)).toMatchObject({ hasMaskedContent: true });
    },
  );

  it('masque plusieurs coordonnées dans le même message', () => {
    const { text } = maskContactDetails('Tel 0612345678 ou mail awa@mail.fr');
    expect(text).toBe(`Tel ${MASK} ou mail ${MASK}`);
  });

  it.each([
    'Bonjour, nous serons 80 invités le 12/06/2027.',
    'Le buffet est à 1 500 € pour 50 personnes.',
    'Rendez-vous à 18h30, code postal 93200.',
  ])('laisse intact un message normal : « %s »', (message) => {
    expect(maskContactDetails(message)).toEqual({ text: message, hasMaskedContent: false });
  });
});

describe('shouldMaskContactDetails', () => {
  it('masque tant qu’il n’y a pas de réservation', () => {
    expect(shouldMaskContactDetails(undefined)).toBe(true);
  });

  it.each(['confirmed', 'deposit_paid', 'fully_paid', 'completed'] as const)(
    'lève le masquage pour une réservation « %s »',
    (status) => {
      expect(shouldMaskContactDetails(status)).toBe(false);
    },
  );

  it('masque à nouveau si la réservation est annulée', () => {
    expect(shouldMaskContactDetails('cancelled')).toBe(true);
  });
});
