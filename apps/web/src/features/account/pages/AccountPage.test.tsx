import { mockDb } from '@afro/common/mocks';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { useSessionStore } from '@/stores/session';
import { renderRoute } from '@/test/renderRoute';

/** Un client de la démo sans réservation à venir : son compte peut être supprimé. */
function deletableUserId() {
  const today = mockDb.now().toISOString().slice(0, 10);
  return mockDb.data.users.find(
    (u) =>
      u.roles.length === 1 &&
      u.roles[0] === 'client' &&
      !mockDb.data.bookings.some(
        (b) => b.clientId === u.id && b.status === 'confirmed' && b.eventDate >= today,
      ),
  )!.id;
}

describe('Mon compte (C8)', () => {
  it('modifie le prénom, le téléphone et les notifications', async () => {
    renderRoute('/espace/compte', { as: 'user-aissatou' });
    const firstName = await screen.findByLabelText('Prénom');
    expect(screen.getByLabelText('Email')).toHaveValue('aissatou.ndiaye@example.com');

    await userEvent.clear(firstName);
    await userEvent.type(firstName, 'Aïssa');
    const phone = screen.getByLabelText('Téléphone (facultatif)');
    await userEvent.clear(phone);
    await userEvent.type(phone, '123');
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(await screen.findByText(/numéro de téléphone/i)).toBeInTheDocument();

    await userEvent.clear(phone);
    await userEvent.type(phone, '06 12 34 56 78');
    const marketingEmail = screen.getByRole('checkbox', {
      name: 'Nouveautés et bons plans par email',
    });
    const wasChecked = (marketingEmail as HTMLInputElement).checked;
    await userEvent.click(marketingEmail);
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(await screen.findByText('Modifications enregistrées')).toBeInTheDocument();
    const saved = mockDb.data.users.find((u) => u.id === 'user-aissatou')!;
    expect(saved).toMatchObject({ firstName: 'Aïssa', phone: '06 12 34 56 78' });
    expect(saved.notificationPrefs.marketing.email).toBe(!wasChecked);
    // L'en-tête suit : la session est mise à jour avec la réponse du serveur.
    expect(useSessionStore.getState().user?.firstName).toBe('Aïssa');
  });

  it('refuse la suppression tant qu’il reste une réservation à venir', async () => {
    renderRoute('/espace/compte', { as: 'user-aissatou' });
    await userEvent.click(await screen.findByRole('button', { name: 'Supprimer mon compte' }));
    const dialog = await screen.findByRole('dialog');
    const confirm = within(dialog).getByRole('button', { name: 'Supprimer définitivement' });
    expect(confirm).toBeDisabled();

    await userEvent.type(within(dialog).getByLabelText('Confirmation'), 'supprimer');
    await userEvent.click(confirm);
    expect(await within(dialog).findByRole('alert')).toHaveTextContent(/réservations à venir/);
    expect(useSessionStore.getState().user?.id).toBe('user-aissatou');
  });

  it('supprime le compte, déconnecte et revient à l’accueil', async () => {
    const userId = deletableUserId();
    const { router } = renderRoute('/espace/compte', { as: userId });
    await userEvent.click(await screen.findByRole('button', { name: 'Supprimer mon compte' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.type(within(dialog).getByLabelText('Confirmation'), 'SUPPRIMER');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Supprimer définitivement' }));

    expect(
      await screen.findByText('Ton compte a bien été supprimé.', { exact: false }),
    ).toBeInTheDocument();
    await waitFor(() => expect(router.state.location.pathname).toBe('/'));
    expect(useSessionStore.getState().user).toBeNull();
    expect(mockDb.data.users.find((u) => u.id === userId)).toMatchObject({
      status: 'deleted',
      lastName: 'supprimé',
    });
  });
});
