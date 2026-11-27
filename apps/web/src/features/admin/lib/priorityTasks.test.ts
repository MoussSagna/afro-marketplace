import { buildSeed } from '@afro/common/mocks';
import type { AdminReport, ProviderProfile } from '@afro/common';
import { describe, expect, it } from 'vitest';
import { buildPriorityTasks } from './priorityTasks';

const seed = buildSeed(new Date('2026-11-27T12:00:00Z'));
const provider = (updatedAt: string): ProviderProfile => ({
  ...seed.providers.find((p) => p.status === 'pending_review')!,
  updatedAt,
});
const report = (id: string, createdAt: string, status: AdminReport['status'] = 'open') =>
  ({
    ...seed.reports[0]!,
    id,
    reason: 'fake_review',
    status,
    createdAt,
    reporter: { id: 'user-claire', firstName: 'Claire', lastNameInitial: 'D.' },
    target: { label: 'Avis de Grace M.', hidden: false },
  }) as AdminReport;

describe('buildPriorityTasks', () => {
  it('mélange profils et signalements, les plus anciens d’abord', () => {
    const tasks = buildPriorityTasks(
      [provider('2026-11-20T10:00:00.000Z')],
      [report('rep-a', '2026-11-25T10:00:00.000Z'), report('rep-b', '2026-11-10T10:00:00.000Z')],
    );
    expect(tasks.map((t) => t.id)).toEqual(['rep-b', 'prov-kompa-vibes-haiti', 'rep-a']);
    expect(tasks[1]).toMatchObject({
      kind: 'provider',
      title: 'Profil prestataire en attente',
      description: 'Kompa Vibes Haïti · Sarcelles',
      status: 'À valider',
      href: '/admin/prestataires/prov-kompa-vibes-haiti',
    });
    expect(tasks[0]).toMatchObject({
      kind: 'report',
      title: 'Signalement à traiter',
      description: 'Faux avis · Avis de Grace M.',
      status: 'À traiter',
      href: '/admin/signalements#rep-b',
    });
  });

  it('ignore les signalements déjà traités et ne crée rien sans données', () => {
    expect(
      buildPriorityTasks([], [report('rep-c', '2026-11-25T10:00:00.000Z', 'resolved')]),
    ).toEqual([]);
    expect(buildPriorityTasks([], [])).toEqual([]);
  });
});
