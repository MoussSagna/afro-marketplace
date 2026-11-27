import { addDays } from '@afro/common';
import { mockDb } from '@afro/common/mocks';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { renderRoute } from '@/test/renderRoute';
import { server } from '@/test/server';

const WEDDING = '/evenements/evt-mariage-aissatou';
const providerId = (slug: string) => mockDb.data.providers.find((p) => p.slug === slug)!.id;
const linksOf = (eventId: string) =>
  mockDb.data.eventProviders.filter((l) => l.eventId === eventId);
const today = () => mockDb.now().toISOString().slice(0, 10);

describe('Mes événements', () => {
  it('liste les événements du client, avec statut et compteurs calculés', async () => {
    renderRoute('/evenements', { as: 'user-aissatou' });
    const list = await screen.findByRole('list', { name: 'Mes événements' });
    const cards = within(list).getAllByRole('link');
    expect(cards).toHaveLength(2);
    expect(cards[0]).toHaveTextContent('Mariage de Aïssatou');
    expect(cards[0]).toHaveTextContent('En préparation');
    expect(cards[0]).toHaveTextContent('150 invités');
    expect(cards[0]).toHaveTextContent('4 prestataires');
    expect(cards[0]).toHaveTextContent('1 devis reçu');
    expect(cards[0]).toHaveAttribute('href', WEDDING);
    expect(screen.getByRole('link', { name: /Créer mon événement/ })).toHaveAttribute(
      'href',
      '/evenements/nouveau',
    );
  });

  it('état vide', async () => {
    renderRoute('/evenements', { as: 'user-ibrahim' });
    expect(
      await screen.findByRole('heading', { name: 'Aucun événement pour le moment' }),
    ).toBeVisible();
    expect(screen.getByRole('link', { name: 'Créer mon événement' })).toBeVisible();
  });

  it('erreur de chargement', async () => {
    server.use(
      http.get('*/api/events', () =>
        HttpResponse.json({ code: 'x', message: 'x' }, { status: 500 }),
      ),
    );
    renderRoute('/evenements', { as: 'user-aissatou' });
    expect(await screen.findByText('Impossible de charger vos événements.')).toBeVisible();
  });

  it('visiteur non connecté : renvoyé vers la connexion, puis ramené ici', async () => {
    const { router } = renderRoute('/evenements');
    await waitFor(() => expect(router.state.location.pathname).toBe('/connexion'));
    expect(router.state.location.search).toBe('?retour=%2Fevenements');
  });

  it('la navbar marque « Événements » comme page active', async () => {
    renderRoute('/evenements', { as: 'user-aissatou' });
    await screen.findByRole('list', { name: 'Mes événements' });
    const nav = screen.getByRole('navigation', { name: 'Navigation principale' });
    expect(within(nav).getByRole('link', { name: 'Événements' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });
});

describe('Créer un événement', () => {
  it('3 étapes, valeurs gardées en revenant en arrière, puis détail + toast', async () => {
    const { router } = renderRoute('/evenements/nouveau', { as: 'user-aissatou' });
    const next = () => userEvent.click(screen.getByRole('button', { name: /Suivant/ }));

    // Étape 1 : un type est obligatoire.
    await next();
    expect(await screen.findByText('Choisis un type d’événement')).toBeVisible();
    await userEvent.click(screen.getByRole('radio', { name: 'Anniversaire' }));
    await next();

    // Étape 2 : erreurs sous les champs, puis saisie.
    await screen.findByRole('heading', { name: 'Les informations de l’événement' });
    await next();
    expect(screen.getByText('Donne un nom à ton événement (3 caractères minimum)')).toBeVisible();
    expect(screen.getByText('Choisis la date de l’événement')).toBeVisible();
    expect(screen.getByLabelText(/Nom de l’événement/)).toHaveAttribute('aria-invalid', 'true');
    await userEvent.type(screen.getByLabelText(/Nom de l’événement/), 'Anniversaire de Moussa');
    await userEvent.type(screen.getByLabelText(/^Date/), addDays(today(), 60));
    await userEvent.type(screen.getByLabelText(/^Ville/), 'Montreuil');
    await userEvent.type(screen.getByLabelText(/Code postal/), '93100');
    await userEvent.type(screen.getByLabelText(/Nombre d’invités/), '60');
    await next();

    // Retour en arrière : rien n'est perdu.
    await userEvent.click(await screen.findByRole('button', { name: /Précédent/ }));
    expect(await screen.findByLabelText(/Nom de l’événement/)).toHaveValue(
      'Anniversaire de Moussa',
    );
    await next();

    // Étape 3 : budget et description facultatifs.
    await userEvent.selectOptions(await screen.findByLabelText(/Budget indicatif/), '3000_5000');
    await userEvent.click(screen.getByRole('button', { name: /Créer l’événement/ }));

    const created = await waitFor(() => {
      const event = mockDb.data.events.find((e) => e.name === 'Anniversaire de Moussa');
      expect(event).toBeDefined();
      return event!;
    });
    expect(created).toMatchObject({
      type: 'birthday',
      city: 'Montreuil',
      postalCode: '93100',
      guestCount: 60,
      budget: '3000_5000',
    });
    await waitFor(() => expect(router.state.location.pathname).toBe(`/evenements/${created.id}`));
    expect(await screen.findByText('Événement créé')).toBeVisible();
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Anniversaire de Moussa' }),
    ).toBeVisible();
  });

  it('refuse une date passée', async () => {
    renderRoute('/evenements/nouveau?etape=1', { as: 'user-aissatou' });
    await userEvent.click(await screen.findByRole('radio', { name: 'Mariage' }));
    await userEvent.click(screen.getByRole('button', { name: /Suivant/ }));
    await userEvent.type(await screen.findByLabelText(/^Date/), addDays(today(), -3));
    await userEvent.click(screen.getByRole('button', { name: /Suivant/ }));
    expect(await screen.findByText('Choisis une date à venir')).toBeVisible();
  });
});

describe('Modifier un événement', () => {
  it('même formulaire, pré-rempli, puis retour au détail', async () => {
    const { router } = renderRoute(`${WEDDING}/modifier`, { as: 'user-aissatou' });
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Modifier mon événement' }),
    ).toBeVisible();
    expect(screen.getByRole('radio', { name: 'Mariage' })).toBeChecked();
    await userEvent.click(screen.getByRole('button', { name: /Suivant/ }));
    const name = await screen.findByLabelText(/Nom de l’événement/);
    expect(name).toHaveValue('Mariage de Aïssatou');
    await userEvent.clear(name);
    await userEvent.type(name, 'Mariage de Aïssatou et Moussa');
    await userEvent.click(screen.getByRole('button', { name: /Suivant/ }));
    await userEvent.click(
      await screen.findByRole('button', { name: /Enregistrer les modifications/ }),
    );

    await waitFor(() => expect(router.state.location.pathname).toBe(WEDDING));
    expect(mockDb.data.events.find((e) => e.id === 'evt-mariage-aissatou')!.name).toBe(
      'Mariage de Aïssatou et Moussa',
    );
    expect(await screen.findByText('Modifications enregistrées')).toBeVisible();
  });
});

describe('Détail d’un événement', () => {
  it('indicateurs, prestataires groupés par famille, statuts tirés des demandes', async () => {
    renderRoute(WEDDING, { as: 'user-aissatou' });
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Mariage de Aïssatou' }),
    ).toBeVisible();
    const stats = screen.getByRole('list', { name: 'Indicateurs' });
    expect(stats).toHaveTextContent('4prestataires ajoutés');
    expect(stats).toHaveTextContent('2devis demandés');
    expect(stats).toHaveTextContent('1devis reçu');
    expect(stats).toHaveTextContent('0retenu');
    expect(screen.getByRole('heading', { name: 'Prestataires de l’événement (4)' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Traiteur & boissons (1)' })).toBeVisible();
    const saveurs = screen.getByRole('link', { name: 'Saveurs de Dakar' }).closest('li')!;
    expect(saveurs).toHaveTextContent('Devis demandé');
    const akwaba = screen.getByRole('link', { name: 'Compagnie Akwaba' }).closest('li')!;
    expect(akwaba).toHaveTextContent('Devis reçu');
  });

  it('« Complétez votre événement » : « Découvrir » ouvre la recherche filtrée', async () => {
    renderRoute(WEDDING, { as: 'user-aissatou' });
    const section = await screen.findByRole('region', { name: 'Complétez votre événement' });
    expect(
      within(section).getByRole('link', { name: 'Découvrir : Beauté & soins' }),
    ).toHaveAttribute('href', `${WEDDING}/ajouter?categorie=beaute-soins`);
  });

  it('retirer un prestataire : confirmation, seule l’association disparaît', async () => {
    renderRoute(WEDDING, { as: 'user-aissatou' });
    const requests = mockDb.data.quoteRequests.length;
    await userEvent.click(await screen.findByRole('button', { name: 'Retirer Saveurs de Dakar' }));
    const dialog = await screen.findByRole('dialog', { name: 'Retirer le prestataire ?' });
    expect(dialog).toHaveTextContent('« Saveurs de Dakar »');
    // Déjà contacté : on prévient que la demande reste dans « Mes demandes ».
    expect(dialog).toHaveTextContent('Sa demande de devis reste dans « Mes demandes »');
    expect(within(dialog).getByRole('button', { name: 'Annuler' })).toHaveFocus();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Retirer' }));

    expect(await screen.findByText('Prestataire retiré')).toBeVisible();
    expect(linksOf('evt-mariage-aissatou')).toHaveLength(3);
    expect(mockDb.data.quoteRequests.length).toBe(requests);
    expect(
      await screen.findByRole('heading', { name: 'Prestataires de l’événement (3)' }),
    ).toBeVisible();
  });

  it('supprimer puis « Annuler » restaure l’événement et ses prestataires', async () => {
    const { router } = renderRoute(WEDDING, { as: 'user-aissatou' });
    await userEvent.click(await screen.findByRole('button', { name: 'Supprimer' }));
    const dialog = await screen.findByRole('dialog', { name: 'Supprimer l’événement ?' });
    expect(dialog).toHaveTextContent('Les comptes des prestataires ne sont pas supprimés.');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Supprimer' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/evenements'));
    expect(await screen.findByText('Événement supprimé')).toBeVisible();
    const list = await screen.findByRole('list', { name: 'Mes événements' });
    await waitFor(() => expect(within(list).getAllByRole('link')).toHaveLength(1));

    await userEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(await screen.findByText('Événement restauré')).toBeVisible();
    await waitFor(() =>
      expect(
        within(screen.getByRole('list', { name: 'Mes événements' })).getAllByRole('link'),
      ).toHaveLength(2),
    );
    expect(linksOf('evt-mariage-aissatou')).toHaveLength(4);
  });

  it('retenir un prestataire après son devis (pas une réservation)', async () => {
    renderRoute(WEDDING, { as: 'user-aissatou' });
    const akwaba = (await screen.findByRole('link', { name: 'Compagnie Akwaba' })).closest('li')!;
    await userEvent.click(within(akwaba).getByRole('button', { name: 'Retenir' }));
    expect(await screen.findByText('Prestataire retenu')).toBeVisible();
    await waitFor(() => expect(akwaba).toHaveTextContent('Retenu'));
    expect(
      linksOf('evt-mariage-aissatou').find((l) => l.providerId === providerId('compagnie-akwaba'))!
        .retained,
    ).toBe(true);
    expect(
      mockDb.data.bookings.some(
        (b) => b.clientId === 'user-aissatou' && b.providerId === providerId('compagnie-akwaba'),
      ),
    ).toBe(false);
  });

  it('événement d’un autre client : page introuvable', async () => {
    renderRoute(WEDDING, { as: 'user-ibrahim' });
    expect(await screen.findByRole('heading', { name: /introuvable|n’existe pas/i })).toBeVisible();
  });
});

describe('Ajouter un prestataire', () => {
  it('ajoute depuis la recherche ; un prestataire déjà là affiche « Ajouté »', async () => {
    renderRoute(`${WEDDING}/ajouter?categorie=beaute-soins`, { as: 'user-aissatou' });
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Ajouter un prestataire' }),
    ).toBeVisible();
    await waitFor(() => expect(screen.getByLabelText('Catégorie')).toHaveValue('beaute-soins'));
    const button = await screen.findByRole('button', { name: 'Ajouter Glow by Aminata' });
    await userEvent.click(button);
    expect(await screen.findByText('Prestataire ajouté')).toBeVisible();
    expect(
      linksOf('evt-mariage-aissatou').some((l) => l.providerId === providerId('glow-by-aminata')),
    ).toBe(true);
    const row = screen.getByRole('link', { name: 'Glow by Aminata' }).closest('li')!;
    await waitFor(() => expect(within(row).getByRole('button', { name: /Ajouté/ })).toBeDisabled());
  });

  it('aucun résultat', async () => {
    renderRoute(`${WEDDING}/ajouter?q=zzzzzz`, { as: 'user-aissatou' });
    expect(await screen.findByRole('heading', { name: 'Aucun prestataire trouvé' })).toBeVisible();
  });
});

describe('Demander les devis', () => {
  it('coche les prestataires « Ajouté », envoie une vraie demande à chacun', async () => {
    const { router } = renderRoute(`${WEDDING}/devis`, { as: 'user-aissatou' });
    expect(await screen.findByText('2 prestataires sélectionnés')).toBeVisible();
    // Déjà contactés : grisés.
    expect(screen.getByRole('checkbox', { name: /Saveurs de Dakar/ })).toBeDisabled();
    const recap = screen.getByRole('list', { name: 'Prestataires choisis' });
    expect(recap).toHaveTextContent('Wax & Wedding Déco');
    expect(recap).toHaveTextContent('Studio Sankofa');

    await userEvent.click(screen.getByRole('checkbox', { name: /Studio Sankofa/ }));
    expect(screen.getByText('1 prestataire sélectionné')).toBeVisible();
    await userEvent.click(screen.getByRole('checkbox', { name: /Studio Sankofa/ }));

    const before = mockDb.data.quoteRequests.length;
    await userEvent.click(
      screen.getAllByRole('button', { name: /Envoyer les demandes de devis/ })[0]!,
    );
    await waitFor(() => expect(router.state.location.pathname).toBe(WEDDING));
    expect(mockDb.data.quoteRequests.length).toBe(before + 2);
    expect(await screen.findByText('Demandes de devis envoyées')).toBeVisible();
    const stats = await screen.findByRole('list', { name: 'Indicateurs' });
    await waitFor(() => expect(stats).toHaveTextContent('4devis demandés'));
  });

  it('dit clairement ce que les règles ont refusé', async () => {
    const event = mockDb.data.events.find((e) => e.id === 'evt-mariage-aissatou')!;
    mockDb.update((data) => {
      data.unavailabilities.push({
        id: 'unav-test',
        providerId: providerId('studio-sankofa'),
        date: event.date,
        reason: 'manual',
        createdAt: mockDb.now().toISOString(),
        updatedAt: mockDb.now().toISOString(),
      });
    });
    renderRoute(`${WEDDING}/devis`, { as: 'user-aissatou' });
    await screen.findByText('2 prestataires sélectionnés');
    await userEvent.click(
      screen.getAllByRole('button', { name: /Envoyer les demandes de devis/ })[0]!,
    );
    expect(
      await screen.findByText(
        /Pas envoyée à Studio Sankofa \(ce prestataire n’est pas disponible à cette date\)/,
      ),
    ).toBeVisible();
  });
});

describe('Depuis une fiche prestataire', () => {
  it('« Ajouter à un événement » liste mes événements et ajoute le prestataire', async () => {
    renderRoute('/prestataires/glow-by-aminata', { as: 'user-aissatou' });
    await userEvent.click(await screen.findByRole('button', { name: 'Ajouter à un événement' }));
    const dialog = await screen.findByRole('dialog', { name: 'Ajouter à un événement' });
    await userEvent.click(
      await within(dialog).findByRole('button', { name: 'Ajouter à Mariage de Aïssatou' }),
    );
    expect(await screen.findByText('Prestataire ajouté')).toBeVisible();
    expect(
      linksOf('evt-mariage-aissatou').some((l) => l.providerId === providerId('glow-by-aminata')),
    ).toBe(true);
  });

  it('déjà dans un événement : « Ajouté » ; « Nouvel événement » garde le prestataire', async () => {
    renderRoute('/prestataires/studio-sankofa', { as: 'user-aissatou' });
    await userEvent.click(await screen.findByRole('button', { name: 'Ajouter à un événement' }));
    const dialog = await screen.findByRole('dialog', { name: 'Ajouter à un événement' });
    const wedding = (await within(dialog).findByText('Mariage de Aïssatou')).closest('li')!;
    expect(within(wedding).getByRole('button', { name: /Ajouté/ })).toBeDisabled();
    expect(within(dialog).getByRole('link', { name: 'Nouvel événement' })).toHaveAttribute(
      'href',
      `/evenements/nouveau?prestataire=${providerId('studio-sankofa')}&retour=%2Fprestataires%2Fstudio-sankofa`,
    );
  });

  it('visiteur : le bouton mène à la connexion', async () => {
    renderRoute('/prestataires/studio-sankofa');
    expect(await screen.findByRole('link', { name: 'Ajouter à un événement' })).toHaveAttribute(
      'href',
      '/connexion?retour=%2Fprestataires%2Fstudio-sankofa',
    );
  });
});
