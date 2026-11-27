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

  it('garde un long message sans espace dans sa bulle (retour à la ligne forcé)', async () => {
    renderRoute('/espace/messages', { as: 'user-aissatou' });
    const list = await screen.findByRole('list', { name: 'Conversations' });
    await userEvent.click(within(list).getByRole('link', { name: /Saveurs de Dakar/ }));

    const long = 'kdjfmsdlkfjsmqldkfjsdqmofkjsdlmfjsdmfl'.repeat(4);
    const input = await screen.findByRole('textbox', { name: 'Ton message' });
    await userEvent.type(input, `${long}{Enter}`);

    const messages = screen.getByRole('list', { name: 'Messages' });
    const bubble = await within(messages).findByText(long);
    // jsdom ne calcule pas la mise en page : on vérifie les règles qui font revenir le texte à la ligne
    // (la vraie mesure est faite par Playwright, e2e/chat-mobile.spec.ts).
    expect(bubble).toHaveClass('whitespace-pre-wrap', '[overflow-wrap:anywhere]', 'max-w-full');
    expect(bubble.closest('li')).toHaveClass('min-w-0', 'max-w-[85%]');
  });

  it('passe d’une conversation à l’autre et montre l’en-tête de la demande', async () => {
    const { router } = renderRoute('/espace/messages', { as: 'user-aissatou' });
    const list = await screen.findByRole('list', { name: 'Conversations' });

    await userEvent.click(within(list).getByRole('link', { name: /Saveurs de Dakar/ }));
    const first = await screen.findByRole('region', { name: 'Conversation avec Saveurs de Dakar' });
    expect(await within(first).findByText('Pro vérifié')).toBeInTheDocument();
    expect(await within(first).findByText(/^Mariage · /)).toBeInTheDocument();
    expect(within(first).getByRole('link', { name: 'Voir la demande' })).toHaveAttribute(
      'href',
      expect.stringMatching(/^\/espace\/demandes\/qr-/),
    );
    const firstPath = router.state.location.pathname;

    await userEvent.click(within(list).getByRole('link', { name: /Compagnie Akwaba/ }));
    expect(
      await screen.findByRole('region', { name: 'Conversation avec Compagnie Akwaba' }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).not.toBe(firstPath);
    expect(
      screen.queryByRole('region', { name: 'Conversation avec Saveurs de Dakar' }),
    ).not.toBeInTheDocument();
  });

  it('envoie avec Entrée ; Maj + Entrée passe à la ligne', async () => {
    renderRoute('/espace/messages', { as: 'user-aissatou' });
    const list = await screen.findByRole('list', { name: 'Conversations' });
    await userEvent.click(within(list).getByRole('link', { name: /Saveurs de Dakar/ }));

    const input = await screen.findByRole('textbox', { name: 'Ton message' });
    expect(screen.getByRole('button', { name: 'Envoyer' })).toBeDisabled();
    await userEvent.type(input, 'Ligne 1{Shift>}{Enter}{/Shift}Ligne 2');
    expect(input).toHaveValue('Ligne 1\nLigne 2');
    await userEvent.click(screen.getByRole('button', { name: 'Envoyer' }));

    expect(
      await screen.findByText((_, element) => element?.textContent === 'Ligne 1\nLigne 2'),
    ).toBeInTheDocument();
    await waitFor(() => expect(input).toHaveValue(''));
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
