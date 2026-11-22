import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderRoute } from '@/test/renderRoute';

describe('Mes demandes (C2 / C3)', () => {
  it('range les demandes du client par onglet', async () => {
    renderRoute('/espace/demandes', { as: 'user-aissatou' });

    expect(await screen.findByRole('tab', { name: /En cours \(\d+\)/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    const panel = screen.getByRole('tabpanel');
    expect(within(panel).getByRole('link', { name: 'Saveurs de Dakar' })).toBeInTheDocument();
    expect(within(panel).getAllByText('En attente de réponse').length).toBeGreaterThan(0);
  });

  it('ouvre le détail et permet d’annuler une demande en cours', async () => {
    const { router } = renderRoute('/espace/demandes', { as: 'user-aissatou' });
    await userEvent.click(await screen.findByRole('link', { name: 'Saveurs de Dakar' }));

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Saveurs de Dakar' }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toMatch(/^\/espace\/demandes\/qr-/);
    expect(screen.getByText('Mariage')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Annuler la demande' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Oui, annuler' }));
    expect(await screen.findByText('Annulée')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Annuler la demande' })).not.toBeInTheDocument();
  });

  it('cache la demande d’un autre client', async () => {
    renderRoute('/espace/demandes/qr-inexistante', { as: 'user-aissatou' });
    expect(await screen.findByRole('heading', { name: /introuvable/i })).toBeInTheDocument();
  });
});

describe('Demandes reçues (S3)', () => {
  it('le prestataire décline une demande avec un motif', async () => {
    renderRoute('/pro/demandes', { as: 'user-saveurs-de-dakar' });
    const panel = await screen.findByRole('tabpanel');
    const pending = within(panel).getAllByText('À traiter')[0]!.closest('article')!;
    await userEvent.click(within(pending).getByRole('link'));

    await userEvent.click(await screen.findByRole('button', { name: 'Décliner' }));
    const dialog = await screen.findByRole('dialog');
    // Motif vide : refusé.
    await userEvent.click(within(dialog).getByRole('button', { name: 'Décliner la demande' }));
    expect(await within(dialog).findByText('Indique un motif')).toBeInTheDocument();

    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Je ne suis pas disponible à cette date.' }),
    );
    await userEvent.click(within(dialog).getByRole('button', { name: 'Décliner la demande' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(await screen.findByText('Déclinée')).toBeInTheDocument();
    expect(screen.getByText(/Je ne suis pas disponible à cette date\./)).toBeInTheDocument();
  });

  it('propose « Poser une question », qui ouvre la conversation', async () => {
    const { router } = renderRoute('/pro/demandes', { as: 'user-saveurs-de-dakar' });
    const panel = await screen.findByRole('tabpanel');
    const pending = within(panel).getAllByText('À traiter')[0]!.closest('article')!;
    await userEvent.click(within(pending).getByRole('link'));

    await userEvent.click(await screen.findByRole('link', { name: 'Poser une question' }));
    await waitFor(() => expect(router.state.location.pathname).toMatch(/^\/pro\/messages\/conv-/));
  });
});
