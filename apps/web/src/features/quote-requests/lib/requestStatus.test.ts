import { describe, expect, it } from 'vitest';
import { requestStatusDisplay, requestTab } from './requestStatus';

const now = new Date('2026-12-01T12:00:00Z');
const inDays = (days: number) => new Date(now.getTime() + days * 86_400_000).toISOString();

describe('statut affiché d’une demande', () => {
  it('dépend du côté : en attente pour le client, à traiter pour le prestataire', () => {
    const request = { status: 'pending' as const, expiresAt: inDays(5) };
    expect(requestStatusDisplay(request, 'client', now).label).toBe('En attente de réponse');
    expect(requestStatusDisplay(request, 'provider', now)).toEqual({
      label: 'À traiter',
      tone: 'warning',
    });
  });

  it('prévient quand la demande expire dans moins de 24 h', () => {
    const request = { status: 'pending' as const, expiresAt: inDays(0.5) };
    expect(requestStatusDisplay(request, 'client', now).label).toBe('Expire bientôt');
  });

  it('nomme le devis selon le côté', () => {
    const request = { status: 'quoted' as const, expiresAt: inDays(5) };
    expect(requestStatusDisplay(request, 'client', now).label).toBe('Devis reçu');
    expect(requestStatusDisplay(request, 'provider', now).label).toBe('Devis envoyé');
  });

  it('range chaque statut dans un onglet', () => {
    expect(requestTab('pending')).toBe('open');
    expect(requestTab('quoted')).toBe('open');
    expect(requestTab('accepted')).toBe('booked');
    expect(['declined', 'expired', 'cancelled'].map((s) => requestTab(s as never))).toEqual([
      'closed',
      'closed',
      'closed',
    ]);
  });
});
