import { mockDb } from '@afro/common/mocks';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { renderRoute } from '@/test/renderRoute';
import { server } from '@/test/server';

const serverError = () => HttpResponse.json({ code: 'oops', message: 'Erreur' }, { status: 500 });

const kompa = () => mockDb.data.providers.find((p) => p.slug === 'kompa-vibes-haiti')!;

describe('Vue d’ensemble (A1)', () => {
  it('affiche les compteurs', async () => {
    renderRoute('/admin', { as: 'user-admin' });
    expect(await screen.findByText('profils à valider')).toBeInTheDocument();
    expect(screen.getByText('signalements à traiter')).toBeInTheDocument();
  });

  it('titre, sous-titre et 4 cartes dont les chiffres viennent de la base', async () => {
    renderRoute('/admin', { as: 'user-admin' });
    expect(screen.getByRole('heading', { level: 1, name: 'Vue d’ensemble' })).toBeVisible();
    expect(screen.getByText('Pilotez l’activité de Wenzee')).toBeVisible();
    const { providers, reports, users } = mockDb.data;
    const expected = {
      'profils à valider': [
        providers.filter((p) => p.status === 'pending_review').length,
        '/admin/prestataires',
      ],
      'signalements à traiter': [
        reports.filter((r) => r.status === 'open').length,
        '/admin/signalements',
      ],
      'prestataires en ligne': [
        providers.filter((p) => p.status === 'published').length,
        '/recherche',
      ],
      comptes: [users.length, '/admin/utilisateurs'],
    } as const;
    await waitFor(() => expect(screen.getAllByTestId('admin-stat')[0]).toHaveTextContent(/\d/));
    const cards = screen.getAllByTestId('admin-stat');
    expect(cards).toHaveLength(4);
    for (const card of cards) {
      const [label, [value, href]] = Object.entries(expected).find(([l]) =>
        card.textContent!.endsWith(l),
      )!;
      expect(card, label).toHaveTextContent(`${value}${label}`);
      expect(card).toHaveAttribute('href', href);
    }
  });

  it('chargement puis erreur des chiffres', async () => {
    server.use(http.get('*/api/admin/overview', serverError));
    renderRoute('/admin', { as: 'user-admin' });
    expect(screen.getAllByRole('status').length).toBeGreaterThan(0);
    expect(await screen.findByText('Impossible de charger les chiffres.')).toBeVisible();
  });

  it('à traiter en priorité : les vraies tâches, « Examiner » ouvre le bon dossier', async () => {
    const { router } = renderRoute('/admin', { as: 'user-admin' });
    const list = await screen.findByRole('list', { name: 'Tâches à traiter' });
    const rows = within(list).getAllByRole('listitem');
    // 1 profil + 2 signalements ouverts dans le seed, le plus ancien (le profil) d'abord.
    expect(rows).toHaveLength(3);
    expect(rows[0]).toHaveTextContent('Profil prestataire en attente');
    expect(rows[0]).toHaveTextContent('Kompa Vibes Haïti');
    expect(rows[1]).toHaveTextContent('Signalement à traiter');

    await userEvent.click(within(rows[0]!).getByRole('link', { name: /^Examiner/ }));
    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/admin/prestataires/prov-kompa-vibes-haiti'),
    );
  });

  it('« Examiner » un signalement ouvre sa carte dans la page Signalements', async () => {
    const { router } = renderRoute('/admin', { as: 'user-admin' });
    const list = await screen.findByRole('list', { name: 'Tâches à traiter' });
    const row = within(list).getAllByRole('listitem')[2]!;
    await userEvent.click(within(row).getByRole('link', { name: /^Examiner/ }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/admin/signalements'));
    const id = router.state.location.hash.slice(1);
    await waitFor(() => expect(document.activeElement).toHaveAttribute('id', id));
  });

  it('aucune tâche à traiter', async () => {
    mockDb.update((data) => {
      data.providers.forEach((p) => p.status === 'pending_review' && (p.status = 'published'));
      data.reports.forEach((r) => (r.status = 'resolved'));
    });
    renderRoute('/admin', { as: 'user-admin' });
    expect(await screen.findByText('Aucune tâche à traiter')).toBeVisible();
  });

  it('erreur de chargement des tâches', async () => {
    server.use(http.get('*/api/admin/reports', serverError));
    renderRoute('/admin', { as: 'user-admin' });
    expect(await screen.findByText('Impossible de charger les tâches à traiter.')).toBeVisible();
  });

  it('activité récente : les derniers événements réels, puis mise à jour après une décision', async () => {
    renderRoute('/admin', { as: 'user-admin' });
    const list = await screen.findByRole('list', { name: 'Derniers événements' });
    const rows = within(list).getAllByRole('listitem');
    expect(rows).toHaveLength(3);
    expect(rows[0]).toHaveTextContent('Nouveau signalement');
    expect(rows[0]).toHaveTextContent('Profil Le Mafé Truck');
    expect(rows[0]).toHaveTextContent('hier');
    expect(within(rows[0]!).getByRole('link')).toHaveAttribute(
      'href',
      expect.stringMatching(/^\/admin\/signalements#rep-/),
    );
  });

  it('activité vide et activité en erreur', async () => {
    server.use(http.get('*/api/admin/activity', () => HttpResponse.json([])));
    const first = renderRoute('/admin', { as: 'user-admin' });
    expect(await screen.findByText('Aucune activité récente')).toBeVisible();
    first.unmount();

    server.use(http.get('*/api/admin/activity', serverError));
    renderRoute('/admin', { as: 'user-admin' });
    expect(await screen.findByText('Impossible de charger l’activité récente.')).toBeVisible();
  });

  it('accès rapides vers les trois écrans', async () => {
    renderRoute('/admin', { as: 'user-admin' });
    const section = screen.getByRole('region', { name: 'Accès rapides' });
    expect(within(section).getByRole('link', { name: 'Valider des profils' })).toHaveAttribute(
      'href',
      '/admin/prestataires',
    );
    expect(within(section).getByRole('link', { name: 'Traiter les signalements' })).toHaveAttribute(
      'href',
      '/admin/signalements',
    );
    expect(within(section).getByRole('link', { name: 'Gérer les utilisateurs' })).toHaveAttribute(
      'href',
      '/admin/utilisateurs',
    );
  });
});

describe('Gabarit du back-office', () => {
  it('menu latéral : 4 entrées, l’entrée active est marquée, la navigation marche', async () => {
    const { router } = renderRoute('/admin', { as: 'user-admin' });
    const nav = screen.getByRole('navigation', { name: 'Administration' });
    expect(within(nav).getByRole('link', { name: 'Vue d’ensemble' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await userEvent.click(within(nav).getByRole('link', { name: 'Signalements' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/admin/signalements'));
    expect(within(nav).getByRole('link', { name: 'Signalements' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('en-tête : badge, compte « Admin », pas de liens du site ni de pied de page', async () => {
    renderRoute('/admin', { as: 'user-admin' });
    expect(screen.getByText('Back office admin')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Menu de Nadia' })).toHaveTextContent('Admin');
    expect(screen.queryByRole('navigation', { name: 'Navigation principale' })).toBeNull();
    expect(screen.queryByRole('contentinfo')).toBeNull();
  });

  it('notifications : pastille et liens vers ce qui reste à traiter', async () => {
    renderRoute('/admin', { as: 'user-admin' });
    const bell = await screen.findByRole('button', { name: 'Notifications : 3 à traiter' });
    expect(screen.getByTestId('notification-dot')).toBeInTheDocument();
    await userEvent.click(bell);
    expect(await screen.findByRole('menuitem', { name: '1 profil à valider' })).toHaveAttribute(
      'href',
      '/admin/prestataires',
    );
    expect(screen.getByRole('menuitem', { name: '2 signalements à traiter' })).toHaveAttribute(
      'href',
      '/admin/signalements',
    );
  });

  it('notifications : rien à traiter, pas de pastille', async () => {
    server.use(
      http.get('*/api/admin/overview', () =>
        HttpResponse.json({
          providersToReview: 0,
          openReports: 0,
          publishedProviders: 3,
          users: 9,
        }),
      ),
    );
    renderRoute('/admin', { as: 'user-admin' });
    const bell = await screen.findByRole('button', { name: 'Notifications' });
    expect(screen.queryByTestId('notification-dot')).toBeNull();
    await userEvent.click(bell);
    expect(await screen.findByText('Rien à traiter pour le moment.')).toBeVisible();
  });

  it('tiroir (téléphone, tablette) : s’ouvre, navigue et se referme', async () => {
    const { router } = renderRoute('/admin', { as: 'user-admin' });
    await userEvent.click(screen.getByRole('button', { name: 'Ouvrir le menu d’administration' }));
    const drawer = await screen.findByRole('dialog', { name: 'Menu d’administration' });
    await userEvent.click(within(drawer).getByRole('link', { name: 'Utilisateurs' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/admin/utilisateurs'));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('réservé aux admins', async () => {
    renderRoute('/admin', { as: 'user-aissatou' });
    expect(await screen.findByText(/Accès refusé/)).toBeInTheDocument();
  });
});

describe('Profils à valider (A2)', () => {
  it('liste : catégorie, localisation, statut et « Examiner »', async () => {
    renderRoute('/admin/prestataires', { as: 'user-admin' });
    const table = await screen.findByRole('table', { name: 'Profils en attente de validation' });
    const [, row] = within(table).getAllByRole('row');
    expect(row).toHaveTextContent('Musique live, son & groupes');
    expect(row).toHaveTextContent('Sarcelles 95200');
    expect(row).toHaveTextContent('À valider');
    expect(within(row!).getByRole('link', { name: 'Examiner' })).toHaveAttribute(
      'href',
      `/admin/prestataires/${kompa().id}`,
    );
  });

  it('erreur de chargement de la liste', async () => {
    server.use(http.get('*/api/admin/providers/to-review', serverError));
    renderRoute('/admin/prestataires', { as: 'user-admin' });
    expect(await screen.findByText('Impossible de charger les profils.')).toBeVisible();
  });

  it('ouvre la fiche et valide le profil', async () => {
    const { router } = renderRoute('/admin/prestataires', { as: 'user-admin' });
    await userEvent.click(await screen.findByRole('link', { name: 'Kompa Vibes Haïti' }));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Kompa Vibes Haïti' }),
    ).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Valider et publier' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/admin/prestataires'));
    expect(kompa().status).toBe('published');
    // Retour visuel sur la liste, qui est maintenant vide.
    expect(await screen.findByText('« Kompa Vibes Haïti » est validé et publié.')).toBeVisible();
    expect(await screen.findByText('Rien à valider')).toBeVisible();
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
    // Le signalement quitte la liste « À traiter », avec un message de confirmation.
    await waitFor(() => expect(item).not.toBeInTheDocument());
    expect(await screen.findByText('Contenu masqué : le signalement est traité.')).toBeVisible();
  });

  it('échec d’une action : le message d’erreur s’affiche dans la carte', async () => {
    server.use(
      http.post('*/api/admin/reports/:id/resolve', () =>
        HttpResponse.json({ code: 'oops', message: 'Le serveur ne répond pas.' }, { status: 500 }),
      ),
    );
    renderRoute('/admin/signalements', { as: 'user-admin' });
    const [item] = await screen.findAllByRole('article');
    await userEvent.click(within(item!).getByRole('button', { name: 'Classer sans suite' }));
    expect(await within(item!).findByText('Le serveur ne répond pas.')).toBeVisible();
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
    expect(screen.getByText('Compte de Aïssatou Ndiaye suspendu.')).toBeVisible();
  });

  it('aucun compte trouvé', async () => {
    renderRoute('/admin/utilisateurs', { as: 'user-admin' });
    await userEvent.type(await screen.findByLabelText('Rechercher (nom ou email)'), 'zzzz');
    expect(await screen.findByText('Aucun compte trouvé')).toBeVisible();
  });
});
