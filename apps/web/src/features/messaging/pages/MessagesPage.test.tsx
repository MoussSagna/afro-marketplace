import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderRoute } from '@/test/renderRoute';

describe('Messagerie (C4 / S5)', () => {
  it('liste les conversations et ouvre un fil', async () => {
    const { router } = renderRoute('/espace/messages', { as: 'user-aissatou' });
    const list = await screen.findByRole('list', { name: 'Conversations' });
    await userEvent.click(within(list).getByRole('link', { name: /Saveurs de Dakar/ }));

    await waitFor(() =>
      expect(router.state.location.pathname).toMatch(/^\/espace\/messages\/conv-/),
    );
    const thread = await screen.findByRole('region', {
      name: 'Conversation avec Saveurs de Dakar',
    });
    expect(await within(thread).findByText(/thiéboudienne/)).toBeInTheDocument();
  });

  it('règle n° 7 : masque un numéro envoyé avant la réservation', async () => {
    renderRoute('/espace/messages', { as: 'user-aissatou' });
    const list = await screen.findByRole('list', { name: 'Conversations' });
    await userEvent.click(within(list).getByRole('link', { name: /Saveurs de Dakar/ }));

    const input = await screen.findByRole('textbox', { name: 'Ton message' });
    await userEvent.type(input, 'Mon numéro : 07 98 76 54 32{Enter}');

    expect(await screen.findByText('Mon numéro : [coordonnées masquées]')).toBeInTheDocument();
    expect(screen.getByText(/Coordonnées masquées : elles seront visibles/)).toBeInTheDocument();
    await waitFor(() => expect(input).toHaveValue(''));
  });

  it('affiche les non-lus du prestataire, puis les efface à la lecture', async () => {
    renderRoute('/pro/messages', { as: 'user-saveurs-de-dakar' });
    const [nav] = await screen.findAllByRole('navigation', { name: /Espace prestataire/ });
    const messagesLink = within(nav!).getByRole('link', { name: /Messages/ });
    await waitFor(() => expect(messagesLink).toHaveTextContent(/non lu/));

    const list = await screen.findByRole('list', { name: 'Conversations' });
    const unread = within(list)
      .getAllByRole('link')
      .find((link) => /non lu/.test(link.textContent ?? ''))!;
    await userEvent.click(unread);
    await waitFor(() => expect(unread).not.toHaveTextContent(/non lu/));
  });

  it('signale un message reçu', async () => {
    renderRoute('/pro/messages', { as: 'user-saveurs-de-dakar' });
    const list = await screen.findByRole('list', { name: 'Conversations' });
    await userEvent.click(within(list).getAllByRole('link')[0]!);

    const [reportButton] = await screen.findAllByRole('button', { name: 'Signaler ce message' });
    await userEvent.click(reportButton!);
    const dialog = await screen.findByRole('dialog');
    await userEvent.selectOptions(within(dialog).getByLabelText('Motif'), 'spam');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Envoyer le signalement' }));
    expect(await within(dialog).findByText(/bien été envoyé/)).toBeInTheDocument();
  });

  it('montre un état vide sans conversation', async () => {
    renderRoute('/espace/messages', { as: 'user-admin' });
    expect(await screen.findByText('Aucune conversation')).toBeInTheDocument();
  });
});
