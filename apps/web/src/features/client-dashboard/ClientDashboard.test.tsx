import { toIsoDate } from '@afro/common';
import { mockDb } from '@afro/common/mocks';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { requestTab } from '@/features/quote-requests/lib/requestStatus';
import { renderRoute } from '@/test/renderRoute';
import { server } from '@/test/server';

const CLIENT = 'user-aissatou';

/** Les chiffres attendus, recalculés depuis la base de démo (jamais recopiés de la maquette). */
function expectedCounts() {
  const { quoteRequests, bookings, conversations } = mockDb.data;
  const today = toIsoDate(new Date());
  return {
    open: quoteRequests.filter((r) => r.clientId === CLIENT && requestTab(r.status) === 'open')
      .length,
    upcoming: bookings.filter(
      (b) => b.clientId === CLIENT && b.status === 'confirmed' && b.eventDate >= today,
    ).length,
    unread: conversations
      .filter((c) => c.clientId === CLIENT)
      .reduce((total, c) => total + c.unreadCountClient, 0),
  };
}

const twoDigits = (n: number) => String(n).padStart(2, '0');

describe('Tableau de bord client (C2)', () => {
  it('salue le client par son prénom (profil de la session)', async () => {
    renderRoute('/espace/demandes', { as: CLIENT });

    const banner = await screen.findByTestId('welcome-banner');
    expect(banner).toHaveTextContent('Bonjour Aïssatou');
    expect(banner).toHaveTextContent('Suivez vos demandes et l’organisation de vos événements.');
  });

  it('calcule les 3 chiffres depuis les données et mène à chaque section', async () => {
    renderRoute('/espace/demandes', { as: CLIENT });
    const counts = expectedCounts();
    const stats = await screen.findByRole('list', { name: 'Résumé de mon activité' });

    const open = within(stats).getByRole('link', { name: /Demandes en cours/ });
    await waitFor(() => expect(open).toHaveTextContent(twoDigits(counts.open)));
    expect(open).toHaveAttribute('href', '/espace/demandes?onglet=open');

    const bookings = within(stats).getByRole('link', { name: /Réservations à venir/ });
    await waitFor(() => expect(bookings).toHaveTextContent(twoDigits(counts.upcoming)));
    expect(bookings).toHaveAttribute('href', '/espace/reservations');

    const messages = within(stats).getByRole('link', { name: /Messages non lus/ });
    await waitFor(() => expect(messages).toHaveTextContent(twoDigits(counts.unread)));
    expect(messages).toHaveAttribute('href', '/espace/messages');
  });

  it('le chiffre « Demandes en cours » suit les données (annulation d’une demande)', async () => {
    const { router } = renderRoute('/espace/demandes', { as: CLIENT });
    const before = expectedCounts().open;
    const stat = () => screen.getByRole('link', { name: /Demandes en cours/ });
    await waitFor(() => expect(stat()).toHaveTextContent(twoDigits(before)));

    await userEvent.click(await screen.findByRole('link', { name: 'Saveurs de Dakar' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Annuler la demande' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Oui, annuler' }));
    expect(await screen.findByText('Annulée')).toBeInTheDocument();

    await router.navigate('/espace/demandes');
    await waitFor(() => expect(stat()).toHaveTextContent(twoDigits(before - 1)));
  });

  it('la carte « Réservations à venir » ouvre la page des réservations', async () => {
    const { router } = renderRoute('/espace/demandes', { as: CLIENT });

    await userEvent.click(await screen.findByRole('link', { name: /Réservations à venir/ }));

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Mes réservations' }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/espace/reservations');
  });

  it('filtre par statut sans changer de page, avec des compteurs dynamiques', async () => {
    const { router } = renderRoute('/espace/demandes', { as: CLIENT });

    const booked = await screen.findByRole('tab', { name: /^Réservations \(\d+\)$/ });
    await userEvent.click(booked);

    expect(booked).toHaveAttribute('aria-selected', 'true');
    expect(router.state.location.pathname).toBe('/espace/demandes');
    expect(router.state.location.search).toBe('?onglet=booked');
    const panel = screen.getByRole('tabpanel');
    expect(within(panel).getAllByText('Réservée').length).toBeGreaterThan(0);
  });

  it('montre la carte de demande complète : photo, badge vérifié, infos, statut', async () => {
    renderRoute('/espace/demandes', { as: CLIENT });

    const link = await screen.findByRole('link', { name: 'Saveurs de Dakar' });
    const card = link.closest('article')!;
    expect(within(card).getByText('Pro vérifié')).toBeInTheDocument();
    expect(card).toHaveTextContent('Mariage');
    expect(card).toHaveTextContent(/\d+ invités/);
    expect(within(card).getAllByText('En attente de réponse').length).toBeGreaterThan(0);
    expect(card.querySelector('img')).not.toBeNull();
  });

  it('« Nouvelle demande » mène à la recherche d’un prestataire (début du parcours existant)', async () => {
    renderRoute('/espace/demandes', { as: CLIENT });

    expect(await screen.findByRole('link', { name: 'Nouvelle demande' })).toHaveAttribute(
      'href',
      '/recherche',
    );
  });

  it('propose de faire une première demande quand il n’y en a aucune', async () => {
    server.use(http.get('*/api/quote-requests', () => HttpResponse.json([])));
    renderRoute('/espace/demandes', { as: CLIENT });

    expect(await screen.findByText('Pas encore de demande')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Faire une première demande/ })).toHaveAttribute(
      'href',
      '/recherche',
    );
    await waitFor(() =>
      expect(screen.getByRole('link', { name: /Demandes en cours/ })).toHaveTextContent('00'),
    );
  });

  it('affiche une erreur si les demandes ne se chargent pas', async () => {
    server.use(
      http.get('*/api/quote-requests', () =>
        HttpResponse.json({ code: 'oops', message: 'Erreur' }, { status: 500 }),
      ),
    );
    renderRoute('/espace/demandes', { as: CLIENT });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Impossible de charger les demandes',
    );
  });

  it('la navigation de l’espace garde ses 4 onglets et la pastille des messages', async () => {
    renderRoute('/espace/demandes', { as: CLIENT });

    const nav = await screen.findByRole('navigation', { name: 'Espace client' });
    const links = within(nav).getAllByRole('link');
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/espace/demandes',
      '/espace/reservations',
      '/espace/messages',
      '/espace/compte',
    ]);
    expect(links[0]).toHaveAttribute('aria-current', 'page');
    const unread = expectedCounts().unread;
    await waitFor(() =>
      expect(within(nav).getByRole('link', { name: /Messages/ })).toHaveTextContent(
        `${unread} non lu`,
      ),
    );
  });

  it('le côté prestataire garde sa page, sans bannière ni chiffres', async () => {
    renderRoute('/pro/demandes', { as: 'user-saveurs-de-dakar' });

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Demandes reçues' }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('welcome-banner')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Nouvelle demande' })).not.toBeInTheDocument();
  });
});
