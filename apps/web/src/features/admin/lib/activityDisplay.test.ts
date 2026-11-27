import type { AdminActivityItem } from '@afro/common';
import { describe, expect, it } from 'vitest';
import { describeActivity } from './activityDisplay';

const item = (patch: Partial<AdminActivityItem>): AdminActivityItem => ({
  id: 'x',
  type: 'account_created',
  at: '2026-11-27T10:00:00.000Z',
  subject: 'Aïssatou N.',
  ...patch,
});

describe('describeActivity', () => {
  it('donne un titre et une phrase pour chaque type d’événement', () => {
    expect(describeActivity(item({}))).toMatchObject({
      title: 'Compte créé',
      description: 'Aïssatou N. a créé un compte.',
    });
    expect(describeActivity(item({ type: 'provider_created', subject: 'Kompa' }))).toMatchObject({
      title: 'Nouvelle inscription prestataire',
      description: 'Profil créé : Kompa.',
    });
    expect(describeActivity(item({ type: 'provider_submitted', subject: 'Kompa' }))).toMatchObject({
      title: 'Profil envoyé en validation',
      description: 'Kompa attend votre validation.',
    });
    expect(
      describeActivity(item({ type: 'report_created', reason: 'spam', subject: 'Profil X' })),
    ).toMatchObject({ title: 'Nouveau signalement', description: 'Spam ou publicité · Profil X' });
    expect(
      describeActivity(item({ type: 'moderation', action: 'validate_profile', subject: 'Kompa' })),
    ).toMatchObject({ title: 'Profil validé', description: 'Kompa' });
  });

  it('chaque événement a une icône', () => {
    for (const type of [
      'account_created',
      'provider_created',
      'provider_submitted',
      'report_created',
      'moderation',
    ] as const) {
      expect(describeActivity(item({ type, action: 'ban_user' })).icon).toBeTruthy();
    }
  });
});
