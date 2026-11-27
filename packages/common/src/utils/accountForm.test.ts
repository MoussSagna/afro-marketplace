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
      city: '',
      avatarUrl: '',
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
      city: '',
      avatarUrl: '',
      notificationPrefs: prefs,
    });
    expect(result.success).toBe(false);
    expect(result.error!.issues.map((i) => i.path[0])).toEqual(['firstName', 'phone']);
  });

  it('garde la ville (nettoyée) et la photo', () => {
    const values = accountFormSchema.parse({
      firstName: 'Awa',
      lastName: 'Diop',
      phone: '',
      city: '  Paris ',
      avatarUrl: 'data:image/jpeg;base64,AAAA',
      notificationPrefs: prefs,
    });
    expect(toUpdateMeInput(values)).toMatchObject({
      city: 'Paris',
      avatarUrl: 'data:image/jpeg;base64,AAAA',
    });
  });

  it('refuse une ville trop longue', () => {
    const result = accountFormSchema.safeParse({
      firstName: 'Awa',
      lastName: 'Diop',
      phone: '',
      city: 'x'.repeat(81),
      avatarUrl: '',
      notificationPrefs: prefs,
    });
    expect(result.error?.issues[0]).toMatchObject({
      path: ['city'],
      message: '80 caractères maximum',
    });
  });
});
