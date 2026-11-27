import { DEMO_PASSWORD } from '@afro/common/mocks';
import { mockDb } from '@afro/common/mocks';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { useResultsView } from '@/features/search/lib/resultsView';
import { useFavoritesStore } from '@/stores/favorites';
import { useSessionStore } from '@/stores/session';
import { renderRoute } from '@/test/renderRoute';
import { server } from '@/test/server';

const CLIENT = 'user-aissatou';
const savedUser = () => mockDb.data.users.find((u) => u.id === CLIENT)!;

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

const nav = () => screen.getByRole('navigation', { name: 'Rubriques du compte' });

describe('Mon compte (C8) : mise en page et navigation', () => {
  it('affiche la bannière, le menu et « Informations personnelles » par défaut', async () => {
    renderRoute('/espace/compte', { as: CLIENT });
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Mon compte' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Mon compte' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(nav()).getByRole('link', { name: 'Informations personnelles' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(
      screen.getByRole('heading', { level: 2, name: 'Informations personnelles' }),
    ).toBeInTheDocument();
    // Les données réelles du compte préremplissent le formulaire.
    const user = savedUser();
    expect(screen.getByRole('textbox', { name: /Prénom/ })).toHaveValue(user.firstName);
    expect(screen.getByRole('textbox', { name: /^Nom/ })).toHaveValue(user.lastName);
    expect(screen.getByRole('textbox', { name: /Adresse e-mail/ })).toHaveValue(user.email);
    expect(screen.getByRole('textbox', { name: /Adresse e-mail/ })).toHaveAttribute('readonly');
    expect(screen.getByText(/^Membre depuis \p{L}+ \d{4}$/u)).toBeInTheDocument();
  });

  it('change de rubrique par l’adresse (?rubrique=), sans ancre', async () => {
    const { router } = renderRoute('/espace/compte', { as: CLIENT });
    await screen.findByRole('heading', { level: 2, name: 'Informations personnelles' });

    for (const [label, query] of [
      ['Notifications', 'notifications'],
      ['Sécurité', 'securite'],
      ['Préférences', 'preferences'],
    ] as const) {
      await userEvent.click(within(nav()).getByRole('link', { name: label }));
      expect(await screen.findByRole('heading', { level: 2, name: label })).toBeInTheDocument();
      expect(router.state.location.search).toBe(`?rubrique=${query}`);
      expect(within(nav()).getByRole('link', { name: label })).toHaveAttribute(
        'aria-current',
        'page',
      );
    }
  });

  it('une rubrique inconnue revient aux informations personnelles', async () => {
    renderRoute('/espace/compte?rubrique=inconnue', { as: CLIENT });
    expect(
      await screen.findByRole('heading', { level: 2, name: 'Informations personnelles' }),
    ).toBeInTheDocument();
  });

  it('se déconnecte après confirmation', async () => {
    const { router } = renderRoute('/espace/compte', { as: CLIENT });
    await userEvent.click(await within(nav()).findByRole('button', { name: 'Déconnexion' }));
    const dialog = await screen.findByRole('dialog', { name: 'Se déconnecter ?' });
    // « Annuler » garde la session.
    await userEvent.click(within(dialog).getByRole('button', { name: 'Annuler' }));
    expect(useSessionStore.getState().user?.id).toBe(CLIENT);

    await userEvent.click(within(nav()).getByRole('button', { name: 'Déconnexion' }));
    await userEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Se déconnecter' }),
    );
    await waitFor(() => expect(useSessionStore.getState().user).toBeNull());
    await waitFor(() => expect(router.state.location.pathname).toBe('/'));
  });
});

describe('Mon compte : informations personnelles', () => {
  it('valide les champs près de chacun, puis enregistre prénom, téléphone et ville', async () => {
    renderRoute('/espace/compte', { as: CLIENT });
    const firstName = await screen.findByRole('textbox', { name: /Prénom/ });
    const phone = screen.getByRole('textbox', { name: 'Téléphone' });
    const save = screen.getByRole('button', { name: 'Enregistrer les modifications' });

    await userEvent.clear(firstName);
    await userEvent.clear(phone);
    await userEvent.type(phone, '123');
    await userEvent.click(save);
    expect(await screen.findByText('Indique ton prénom')).toBeInTheDocument();
    expect(screen.getByText(/numéro de téléphone invalide/i)).toBeInTheDocument();
    expect(firstName).toHaveAttribute('aria-invalid', 'true');
    expect(savedUser().firstName).toBe('Aïssatou');

    await userEvent.type(firstName, 'Aïssa');
    await userEvent.clear(phone);
    await userEvent.type(phone, '06 12 34 56 78');
    await userEvent.type(screen.getByRole('textbox', { name: 'Ville' }), 'Lyon');
    await userEvent.click(save);

    expect(await screen.findByText('Modifications enregistrées')).toBeInTheDocument();
    expect(savedUser()).toMatchObject({
      firstName: 'Aïssa',
      phone: '06 12 34 56 78',
      city: 'Lyon',
    });
    // L'en-tête suit : la session est mise à jour avec la réponse du serveur.
    expect(useSessionStore.getState().user?.firstName).toBe('Aïssa');
  });

  it('« Annuler » remet les valeurs enregistrées', async () => {
    renderRoute('/espace/compte', { as: CLIENT });
    const cancel = await screen.findByRole('button', { name: 'Annuler' });
    expect(cancel).toBeDisabled();
    const lastName = screen.getByRole('textbox', { name: /^Nom/ });
    await userEvent.clear(lastName);
    await userEvent.type(lastName, 'Autre');
    expect(cancel).toBeEnabled();

    await userEvent.click(cancel);
    expect(lastName).toHaveValue('Ndiaye');
    expect(savedUser().lastName).toBe('Ndiaye');
  });

  it('n’annonce pas de réussite si l’enregistrement échoue', async () => {
    server.use(
      http.patch('*/api/me', () =>
        HttpResponse.json({ code: 'oops', message: 'Serveur indisponible' }, { status: 500 }),
      ),
    );
    renderRoute('/espace/compte', { as: CLIENT });
    const city = await screen.findByRole('textbox', { name: 'Ville' });
    await userEvent.type(city, 'Lille');
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer les modifications' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Serveur indisponible');
    expect(screen.queryByText('Modifications enregistrées')).not.toBeInTheDocument();
    expect(city).toHaveValue('Lille');
  });

  it('change la photo : aperçu, puis enregistrement ; et la retire', async () => {
    renderRoute('/espace/compte', { as: CLIENT });
    const file = new File(['photo'], 'portrait.png', { type: 'image/png' });
    await userEvent.upload(await screen.findByLabelText('Fichier de la photo de profil'), file);

    expect(await screen.findByRole('img', { name: 'Aperçu de la nouvelle photo' })).toBeVisible();
    expect(savedUser().avatarUrl).toBeUndefined();
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer les modifications' }));
    await screen.findByText('Modifications enregistrées');
    expect(savedUser().avatarUrl).toMatch(/^data:image\/png;base64,/);
    expect(useSessionStore.getState().user?.avatarUrl).toBe(savedUser().avatarUrl);
    expect(screen.getByRole('img', { name: 'Votre photo de profil' })).toBeVisible();

    await userEvent.click(screen.getByRole('button', { name: 'Retirer la photo' }));
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer les modifications' }));
    await waitFor(() => expect(savedUser().avatarUrl).toBeUndefined());
  });

  it('refuse un fichier qui n’est pas une image', async () => {
    renderRoute('/espace/compte', { as: CLIENT });
    const input = await screen.findByLabelText('Fichier de la photo de profil');
    const pdf = new File(['%PDF'], 'devis.pdf', { type: 'application/pdf' });
    await userEvent.upload(input, pdf, { applyAccept: false });
    expect(await screen.findByRole('alert')).toHaveTextContent('Choisissez une image');
  });

  it('prévient avant de quitter la rubrique avec des modifications non enregistrées', async () => {
    const { router } = renderRoute('/espace/compte', { as: CLIENT });
    await userEvent.type(await screen.findByRole('textbox', { name: 'Ville' }), 'Nantes');
    await userEvent.click(within(nav()).getByRole('link', { name: 'Sécurité' }));

    const dialog = await screen.findByRole('dialog', { name: 'Quitter sans enregistrer ?' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Annuler' }));
    expect(router.state.location.search).toBe('');
    expect(screen.getByRole('textbox', { name: 'Ville' })).toHaveValue('Nantes');

    await userEvent.click(within(nav()).getByRole('link', { name: 'Sécurité' }));
    await userEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Quitter' }),
    );
    expect(await screen.findByRole('heading', { level: 2, name: 'Sécurité' })).toBeInTheDocument();
    expect(savedUser().city).toBeUndefined();
  });
});

describe('Mon compte : notifications', () => {
  it('enregistre un interrupteur sans toucher aux autres informations', async () => {
    renderRoute('/espace/compte?rubrique=notifications', { as: CLIENT });
    const marketingSms = await screen.findByRole('switch', {
      name: 'Nouveautés et offres par sms',
    });
    const before = savedUser().notificationPrefs.marketing.sms;
    expect(marketingSms).toHaveAttribute('aria-checked', String(before));
    const firstName = savedUser().firstName;

    await userEvent.click(marketingSms);
    expect(marketingSms).toHaveAttribute('aria-checked', String(!before));
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer les préférences' }));

    expect(await screen.findByText('Préférences enregistrées')).toBeInTheDocument();
    expect(savedUser().notificationPrefs.marketing.sms).toBe(!before);
    expect(savedUser().firstName).toBe(firstName);
  });

  it('« Annuler » remet les préférences enregistrées', async () => {
    renderRoute('/espace/compte?rubrique=notifications', { as: CLIENT });
    const messagesEmail = await screen.findByRole('switch', {
      name: 'Nouveaux messages par e-mail',
    });
    const before = messagesEmail.getAttribute('aria-checked');
    await userEvent.click(messagesEmail);
    await userEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(messagesEmail).toHaveAttribute('aria-checked', before);
  });
});

describe('Mon compte : sécurité', () => {
  const fill = async (current: string, next: string, confirm = next) => {
    await userEvent.type(await screen.findByLabelText(/Mot de passe actuel/), current);
    await userEvent.type(screen.getByLabelText(/^Nouveau mot de passe/), next);
    await userEvent.type(screen.getByLabelText(/Confirmation du nouveau/), confirm);
    await userEvent.click(screen.getByRole('button', { name: 'Modifier le mot de passe' }));
  };
  const credential = () => mockDb.data.credentials.find((c) => c.userId === CLIENT)!;

  it('modifie le mot de passe après vérification de l’actuel', async () => {
    renderRoute('/espace/compte?rubrique=securite', { as: CLIENT });
    await fill('Mauvais2026', 'Nouveau2027');
    expect(await screen.findByText('Mot de passe actuel incorrect.')).toBeInTheDocument();
    expect(credential().password).toBe(DEMO_PASSWORD);

    await userEvent.clear(screen.getByLabelText(/Mot de passe actuel/));
    await userEvent.type(screen.getByLabelText(/Mot de passe actuel/), DEMO_PASSWORD);
    await userEvent.click(screen.getByRole('button', { name: 'Modifier le mot de passe' }));
    expect(await screen.findByText('Mot de passe modifié')).toBeInTheDocument();
    expect(credential().password).toBe('Nouveau2027');
    expect(screen.getByLabelText(/Mot de passe actuel/)).toHaveValue('');
  });

  it('vérifie la confirmation sans rien envoyer', async () => {
    renderRoute('/espace/compte?rubrique=securite', { as: CLIENT });
    await fill(DEMO_PASSWORD, 'Nouveau2027', 'Nouveau2028');
    expect(
      await screen.findByText('Les deux mots de passe ne sont pas identiques'),
    ).toBeInTheDocument();
    expect(credential().password).toBe(DEMO_PASSWORD);
  });

  it('refuse la suppression tant qu’il reste une réservation à venir', async () => {
    renderRoute('/espace/compte?rubrique=securite', { as: CLIENT });
    await userEvent.click(await screen.findByRole('button', { name: 'Supprimer mon compte' }));
    const dialog = await screen.findByRole('dialog');
    const confirm = within(dialog).getByRole('button', { name: 'Supprimer définitivement' });
    expect(confirm).toBeDisabled();

    await userEvent.type(within(dialog).getByLabelText('Confirmation'), 'supprimer');
    await userEvent.click(confirm);
    expect(await within(dialog).findByRole('alert')).toHaveTextContent(/réservations à venir/);
    expect(useSessionStore.getState().user?.id).toBe(CLIENT);
  });

  it('supprime le compte, déconnecte et revient à l’accueil', async () => {
    const userId = deletableUserId();
    const { router } = renderRoute('/espace/compte?rubrique=securite', { as: userId });
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

describe('Mon compte : préférences', () => {
  it('règle l’affichage des résultats et vide les favoris', async () => {
    useResultsView.setState({ view: 'grid' });
    useFavoritesStore.setState({ ids: ['prov-a', 'prov-b'] });
    renderRoute('/espace/compte?rubrique=preferences', { as: CLIENT });

    await userEvent.click(await screen.findByRole('radio', { name: 'Liste' }));
    expect(useResultsView.getState().view).toBe('list');
    expect(screen.getByRole('radio', { name: 'Liste' })).toHaveAttribute('aria-checked', 'true');

    expect(screen.getByText('2 prestataires en favori sur cet appareil.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Vider mes favoris' }));
    await userEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Vider' }),
    );
    expect(useFavoritesStore.getState().ids).toEqual([]);
    expect(screen.getByRole('button', { name: 'Vider mes favoris' })).toBeDisabled();
  });

  it('mène aux notifications', async () => {
    const { router } = renderRoute('/espace/compte?rubrique=preferences', { as: CLIENT });
    await userEvent.click(await screen.findByRole('link', { name: 'Gérer mes notifications' }));
    expect(router.state.location.search).toBe('?rubrique=notifications');
  });
});
