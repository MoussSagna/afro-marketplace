import { mockDb } from '@afro/common/mocks';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderRoute } from '@/test/renderRoute';

const kompa = () => mockDb.data.providers.find((p) => p.slug === 'kompa-vibes-haiti')!;

describe('Vue d’ensemble (A1)', () => {
  it('affiche les compteurs', async () => {
    renderRoute('/admin', { as: 'user-admin' });
    expect(await screen.findByText('profils à valider')).toBeInTheDocument();
    expect(screen.getByText('signalements à traiter')).toBeInTheDocument();
  });
});

describe('Profils à valider (A2)', () => {
  it('ouvre la fiche et valide le profil', async () => {
    const { router } = renderRoute('/admin/prestataires', { as: 'user-admin' });
    await userEvent.click(await screen.findByRole('link', { name: 'Kompa Vibes Haïti' }));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Kompa Vibes Haïti' }),
    ).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Valider et publier' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/admin/prestataires'));
    expect(kompa().status).toBe('published');
    expect(mockDb.data.moderationActions.at(-1)).toMatchObject({ action: 'validate_profile' });
  });

  it('demander des corrections exige un motif d’au moins 10 caractères', async () => {
    renderRoute(`/admin/prestataires/${kompa().id}`, { as: 'user-admin' });
    await userEvent.click(await screen.findByRole('button', { name: 'Demander des corrections' }));
    const dialog = await screen.findByRole('dialog');
    const send = within(dialog).getByRole('button', { name: 'Envoyer la demande' });
    await userEvent.type(within(dialog).getByLabelText(/Motif/), 'Court');
    expect(send).toBeDisabled();
    await userEvent.clear(within(dialog).getByLabelText(/Motif/));
    await userEvent.type(within(dialog).getByLabelText(/Motif/), 'Photos floues');
    await userEvent.click(send);
    await waitFor(() =>
      expect(kompa()).toMatchObject({
        status: 'changes_requested',
        rejectionReason: 'Photos floues',
      }),
    );
  });
});

describe('Signalements (A3)', () => {
  it('masque un avis signalé', async () => {
    renderRoute('/admin/signalements', { as: 'user-admin' });
    const item = (await screen.findAllByRole('article')).find((a) =>
      a.getAttribute('aria-label')!.startsWith('Signalement : Avis'),
    )!;
    await userEvent.click(within(item).getByRole('button', { name: 'Masquer le contenu' }));
    await waitFor(() =>
      expect(mockDb.data.moderationActions.at(-1)).toMatchObject({
        action: 'hide_content',
        targetType: 'review',
      }),
    );
    // Le signalement quitte la liste « À traiter ».
    await waitFor(() => expect(item).not.toBeInTheDocument());
  });

  it('filtre par statut', async () => {
    renderRoute('/admin/signalements', { as: 'user-admin' });
    await screen.findAllByRole('article');
    await userEvent.click(screen.getByRole('button', { name: 'Classé sans suite' }));
    expect(await screen.findByText(/^Compte de |^Profil /)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Classé sans suite' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});

describe('Utilisateurs (A4)', () => {
  it('recherche un compte puis le suspend avec un motif', async () => {
    renderRoute('/admin/utilisateurs', { as: 'user-admin' });
    await userEvent.type(await screen.findByLabelText('Rechercher (nom ou email)'), 'aissatou');
    expect(await screen.findByText('1 compte')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /^Suspendre Aïssatou/ }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.type(within(dialog).getByLabelText(/Motif/), 'Comportement abusif');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Suspendre le compte' }));

    expect(await screen.findByText('Suspendu')).toBeInTheDocument();
    expect(mockDb.data.users.find((u) => u.id === 'user-aissatou')!.status).toBe('suspended');
  });
});
