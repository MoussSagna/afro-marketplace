import { requestStatus } from './requestStatus';

const now = new Date('2026-11-25T10:00:00Z');
const later = '2026-12-01T10:00:00Z';

describe('requestStatus', () => {
  it('dit où en est une demande, selon qui la regarde', () => {
    expect(requestStatus({ status: 'pending', expiresAt: later }, 'client', now)).toEqual({
      label: 'En attente de réponse',
      tone: 'muted',
    });
    expect(requestStatus({ status: 'pending', expiresAt: later }, 'provider', now).label).toBe(
      'À traiter',
    );
    expect(requestStatus({ status: 'quoted', expiresAt: later }, 'client', now)).toEqual({
      label: 'Devis reçu',
      tone: 'sun',
    });
    expect(requestStatus({ status: 'quoted', expiresAt: later }, 'provider', now).label).toBe(
      'Devis envoyé',
    );
    expect(requestStatus({ status: 'accepted', expiresAt: later }, 'client', now).tone).toBe(
      'success',
    );
    expect(requestStatus({ status: 'cancelled', expiresAt: later }, 'client', now).label).toBe(
      'Annulée',
    );
  });

  it('prévient quand une demande expire dans moins d’un jour', () => {
    const soon = '2026-11-25T20:00:00Z';
    expect(requestStatus({ status: 'pending', expiresAt: soon }, 'client', now)).toEqual({
      label: 'Expire bientôt',
      tone: 'warning',
    });
  });
});
