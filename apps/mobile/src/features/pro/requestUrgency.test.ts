import { requestsToHandle, requestUrgency } from './requestUrgency';

const now = new Date('2026-11-25T10:00:00Z');

describe('requestUrgency', () => {
  it('rouge quand la demande expire dans 2 jours ou moins', () => {
    expect(requestUrgency({ status: 'pending', expiresAt: '2026-11-27T09:00:00Z' }, now)).toEqual({
      label: 'Expire dans 2 j',
      tone: 'destructive',
    });
    expect(requestUrgency({ status: 'pending', expiresAt: '2026-11-25T18:00:00Z' }, now)).toEqual({
      label: 'Expire aujourd’hui',
      tone: 'destructive',
    });
  });

  it('« Nouveau » quand il reste du temps', () => {
    expect(requestUrgency({ status: 'pending', expiresAt: '2026-12-01T10:00:00Z' }, now)).toEqual({
      label: 'Nouveau',
      tone: 'sun',
    });
  });

  it('le badge habituel côté prestataire sinon', () => {
    expect(requestUrgency({ status: 'quoted', expiresAt: '2026-12-01T10:00:00Z' }, now).label).toBe(
      'Devis envoyé',
    );
  });

  it('garde les demandes en attente, la plus urgente d’abord', () => {
    const list = [
      { request: { status: 'pending' as const, expiresAt: '2026-12-01T00:00:00Z' } },
      { request: { status: 'quoted' as const, expiresAt: '2026-11-26T00:00:00Z' } },
      { request: { status: 'pending' as const, expiresAt: '2026-11-27T00:00:00Z' } },
    ];
    expect(requestsToHandle(list).map((s) => s.request.expiresAt)).toEqual([
      '2026-11-27T00:00:00Z',
      '2026-12-01T00:00:00Z',
    ]);
  });
});
