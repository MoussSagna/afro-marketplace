import { addDays, toIsoDate } from '@afro/common';
import { mockDb } from '@afro/common/mocks';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderRoute } from '@/test/renderRoute';

/** Une date libre pour ce prestataire, entre 40 et 100 jours. */
function freeDateFor(slug: string) {
  const provider = mockDb.data.providers.find((p) => p.slug === slug)!;
  const taken = new Set(
    mockDb.data.unavailabilities.filter((u) => u.providerId === provider.id).map((u) => u.date),
  );
  for (let offset = 40; offset < 100; offset++) {
    const date = addDays(toIsoDate(new Date()), offset);
    if (!taken.has(date)) return date;
  }
  throw new Error('Aucune date libre');
}

const URL = '/prestataires/chez-tantie-adjoua/demande';

describe('Demande de devis (C1)', () => {
  it('envoie d’abord un visiteur vers la connexion, avec retour au formulaire', async () => {
    const { router } = renderRoute(URL);
    await waitFor(() => expect(router.state.location.pathname).toBe('/connexion'));
    expect(router.state.location.search).toBe(`?retour=${encodeURIComponent(URL)}`);
  });

  it('formulaire vide : affiche une erreur sous chaque champ obligatoire', async () => {
    renderRoute(URL, { as: 'user-aissatou' });
    await userEvent.click(await screen.findByRole('button', { name: 'Envoyer ma demande' }));

    expect(await screen.findByText('Choisis le type d’événement')).toBeInTheDocument();
    expect(screen.getByText('Choisis la date de l’événement')).toBeInTheDocument();
    expect(screen.getByText('Indique la ville de l’événement')).toBeInTheDocument();
    expect(screen.getByText('Code postal à 5 chiffres')).toBeInTheDocument();
    expect(screen.getByText(/20 caractères minimum/)).toBeInTheDocument();
    // Le champ en erreur est signalé aux lecteurs d'écran.
    expect(screen.getByLabelText('Ville')).toHaveAttribute('aria-invalid', 'true');
  });

  it('formulaire rempli : envoie la demande et ouvre la conversation', async () => {
    const { router } = renderRoute(URL, { as: 'user-aissatou' });
    const user = userEvent.setup();

    await user.selectOptions(await screen.findByLabelText('Type d’événement'), 'birthday');
    fireEvent.change(screen.getByLabelText('Date'), {
      target: { value: freeDateFor('chez-tantie-adjoua') },
    });
    await user.type(screen.getByLabelText('Ville'), 'Créteil');
    await user.type(screen.getByLabelText('Code postal'), '94000');
    await user.type(screen.getByLabelText('Nombre d’invités (facultatif)'), '60');
    await user.type(
      screen.getByLabelText('Ton message'),
      'Bonjour, je fête mes 40 ans. Appelez-moi au 06 12 34 56 78 !',
    );
    await user.click(screen.getByRole('button', { name: 'Envoyer ma demande' }));

    await waitFor(() =>
      expect(router.state.location.pathname).toMatch(/^\/espace\/messages\/conv-/),
    );
    expect(await screen.findByText(/Ta demande est envoyée/)).toBeInTheDocument();
    // Règle n° 7 : le numéro n'apparaît pas dans la conversation.
    const thread = await screen.findByRole('region', { name: /Conversation avec/ });
    expect(await within(thread).findByText(/\[coordonnées masquées\]/)).toBeInTheDocument();
    expect(within(thread).queryByText(/06 12 34 56 78/)).not.toBeInTheDocument();
    expect(
      within(thread).getByText(/Coordonnées masquées : elles seront visibles/),
    ).toBeInTheDocument();
  });

  it('règle n° 4 : un prestataire ne peut pas se demander un devis', async () => {
    renderRoute('/prestataires/saveurs-de-dakar/demande', { as: 'user-saveurs-de-dakar' });
    expect(await screen.findByText(/C’est ton propre profil/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Envoyer ma demande' })).toBeDisabled();
  });
});
