import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderRoute } from '@/test/renderRoute';

/** Ouvre la première demande « À traiter » de Saveurs de Dakar. */
async function openPendingRequestAsPro() {
  const result = renderRoute('/pro/demandes', { as: 'user-saveurs-de-dakar' });
  const panel = await screen.findByRole('tabpanel');
  const pending = within(panel).getAllByText('À traiter')[0]!.closest('article')!;
  await userEvent.click(within(pending).getByRole('link'));
  return result;
}

describe('Envoyer un devis (S4)', () => {
  it('calcule le total en direct et envoie le devis', async () => {
    const { router } = await openPendingRequestAsPro();
    await userEvent.click(await screen.findByRole('link', { name: 'Envoyer un devis' }));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Envoyer un devis' }),
    ).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Libellé de la ligne 1'), 'Buffet sénégalais');
    await userEvent.clear(screen.getByLabelText('Quantité ligne 1'));
    await userEvent.type(screen.getByLabelText('Quantité ligne 1'), '150');
    await userEvent.type(screen.getByLabelText('Prix unitaire ligne 1'), '28,50');
    await userEvent.click(screen.getByRole('button', { name: 'Ajouter une ligne' }));
    await userEvent.type(screen.getByLabelText('Libellé de la ligne 2'), 'Service en salle');
    await userEvent.type(screen.getByLabelText('Prix unitaire ligne 2'), '300');

    // 150 × 28,50 € + 300 € = 4 575 € ; acompte 30 % = 1 372,50 €
    expect(screen.getByText(/^4\s575\s€$/)).toBeInTheDocument();
    expect(screen.getByText(/Soit 1\s372,50\s€ à la réservation/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Envoyer le devis' }));
    await waitFor(() =>
      expect(router.state.location.pathname).toMatch(/^\/pro\/demandes\/qr-[^/]+$/),
    );
    const card = await screen.findByRole('article', { name: 'Devis n° 1' });
    expect(within(card).getByText('En attente de réponse')).toBeInTheDocument();
    expect(screen.getByText('Devis envoyé')).toBeInTheDocument();
  });

  it('refuse une ligne incomplète', async () => {
    await openPendingRequestAsPro();
    await userEvent.click(await screen.findByRole('link', { name: 'Envoyer un devis' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Envoyer le devis' }));
    expect(await screen.findByText('Décris la ligne')).toBeInTheDocument();
    expect(screen.getByText('Prix invalide (ex. : 28,50)')).toBeInTheDocument();
  });
});

describe('Accepter un devis (C3, règle n° 5)', () => {
  /** La demande d'Aïssatou chez Compagnie Akwaba a un devis v2 en attente. */
  async function openAkwaba() {
    renderRoute('/espace/demandes', { as: 'user-aissatou' });
    await userEvent.click(await screen.findByRole('link', { name: 'Compagnie Akwaba' }));
    await screen.findByRole('heading', { level: 1, name: 'Compagnie Akwaba' });
  }

  it('montre les versions : la v2 est acceptable, la v1 remplacée', async () => {
    await openAkwaba();
    const v2 = await screen.findByRole('article', { name: 'Devis n° 2' });
    const v1 = screen.getByRole('article', { name: 'Devis n° 1' });
    expect(within(v1).getByText('Remplacé')).toBeInTheDocument();
    expect(within(v1).queryByRole('button', { name: 'Accepter le devis' })).not.toBeInTheDocument();
    expect(within(v2).getByRole('button', { name: 'Refuser' })).toBeInTheDocument();
  });

  it('demande l’adresse, puis confirme la réservation', async () => {
    await openAkwaba();
    const v2 = await screen.findByRole('article', { name: 'Devis n° 2' });
    await waitFor(() =>
      expect(within(v2).getByRole('button', { name: 'Accepter le devis' })).toBeEnabled(),
    );
    await userEvent.click(within(v2).getByRole('button', { name: 'Accepter le devis' }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Conditions d’annulation')).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Confirmer la réservation' }));
    expect(await within(dialog).findByText('Indique l’adresse de l’événement')).toBeInTheDocument();

    await userEvent.type(
      within(dialog).getByLabelText('Adresse de l’événement'),
      '8 allée des Baobabs, 93200 Saint-Denis',
    );
    await userEvent.click(within(dialog).getByRole('button', { name: 'Confirmer la réservation' }));

    expect(
      await screen.findByRole('heading', { name: 'Réservation confirmée' }),
    ).toBeInTheDocument();
    expect(screen.getByText('8 allée des Baobabs, 93200 Saint-Denis')).toBeInTheDocument();
    expect(screen.getByText('Réservée')).toBeInTheDocument();
    expect(
      within(screen.getByRole('article', { name: 'Devis n° 2' })).getByText('Accepté'),
    ).toBeInTheDocument();
  });

  it('annule ensuite la réservation, avec le remboursement prévu affiché', async () => {
    await openAkwaba();
    const v2 = await screen.findByRole('article', { name: 'Devis n° 2' });
    await waitFor(() =>
      expect(within(v2).getByRole('button', { name: 'Accepter le devis' })).toBeEnabled(),
    );
    await userEvent.click(within(v2).getByRole('button', { name: 'Accepter le devis' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.type(
      within(dialog).getByLabelText('Adresse de l’événement'),
      '8 allée des Baobabs, Saint-Denis',
    );
    await userEvent.click(within(dialog).getByRole('button', { name: 'Confirmer la réservation' }));

    await userEvent.click(await screen.findByRole('button', { name: 'Annuler la réservation' }));
    const cancelDialog = await screen.findByRole('dialog');
    expect(within(cancelDialog).getByText(/de l’acompte te sera remboursé/)).toBeInTheDocument();
    await userEvent.type(within(cancelDialog).getByLabelText('Motif'), 'Mariage reporté');
    await userEvent.click(
      within(cancelDialog).getByRole('button', { name: 'Confirmer l’annulation' }),
    );
    expect(await screen.findByRole('heading', { name: 'Réservation annulée' })).toBeInTheDocument();
  });
});
