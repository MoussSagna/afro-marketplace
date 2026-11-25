import { describe, expect, it } from 'vitest';
import { accountFormSchema, toUpdateMeInput } from './accountForm';

const prefs = {
  quotes: { email: true, push: false, sms: false },
  messages: { email: true, push: false, sms: false },
  bookings: { email: true, push: false, sms: true },
  marketing: { email: false, push: false, sms: false },
};

describe('formulaire « Mon compte »', () => {
  it('accepte un téléphone vide, et le retire de l’envoi', () => {
    const values = accountFormSchema.parse({
      firstName: ' Awa ',
      lastName: 'Diop',
      phone: '',
      notificationPrefs: prefs,
    });
    expect(toUpdateMeInput(values)).toEqual({
      firstName: 'Awa',
      lastName: 'Diop',
      notificationPrefs: prefs,
    });
  });

  it('refuse un téléphone invalide et un prénom vide', () => {
    const result = accountFormSchema.safeParse({
      firstName: '',
      lastName: 'Diop',
      phone: '123',
      notificationPrefs: prefs,
    });
    expect(result.success).toBe(false);
    expect(result.error!.issues.map((i) => i.path[0])).toEqual(['firstName', 'phone']);
  });
});
