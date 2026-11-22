import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { useSessionStore } from '@/stores/session';
import { renderRoute } from '@/test/renderRoute';
import { server } from '@/test/server';

describe('Connexion de démo', () => {
  it('propose les 3 comptes de démo', async () => {
    renderRoute('/connexion');

    expect(
      await screen.findByRole('button', { name: 'Se connecter : Aïssatou, cliente' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Se connecter : Saveurs de Dakar, prestataire' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Se connecter : Admin' })).toBeInTheDocument();
  });

  it.each([
    ['Aïssatou, cliente', '/espace/demandes', 'Mes demandes'],
    ['Saveurs de Dakar, prestataire', '/pro', 'Tableau de bord'],
    ['Admin', '/admin', 'Vue d’ensemble'],
  ])('« %s » arrive dans son espace (%s)', async (label, url, title) => {
    const { router } = renderRoute('/connexion');

    await userEvent.click(await screen.findByRole('button', { name: `Se connecter : ${label}` }));

    expect(await screen.findByRole('heading', { level: 1, name: title })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(url);
  });

  it('garde la session (pour le rechargement de la page)', async () => {
    renderRoute('/connexion');
    await userEvent.click(
      await screen.findByRole('button', { name: 'Se connecter : Aïssatou, cliente' }),
    );

    await waitFor(() => expect(useSessionStore.getState().token).toBe('demo:user-aissatou'));
    expect(localStorage.getItem('afro-marketplace:session')).toContain('user-aissatou');
  });

  it('affiche le message du serveur si la connexion échoue', async () => {
    server.use(
      http.post('*/api/auth/demo-sign-in', () =>
        HttpResponse.json(
          { code: 'account_inactive', message: 'Ce compte est suspendu.' },
          { status: 403 },
        ),
      ),
    );
    renderRoute('/connexion');

    await userEvent.click(await screen.findByRole('button', { name: 'Se connecter : Admin' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Ce compte est suspendu.');
    expect(useSessionStore.getState().user).toBeNull();
  });
});

describe('Gardes de routes', () => {
  it('renvoie vers la connexion, puis vers la page demandée', async () => {
    const { router } = renderRoute('/espace/messages');

    await screen.findByRole('heading', { name: 'Connexion' });
    expect(router.state.location.pathname).toBe('/connexion');
    expect(router.state.location.search).toBe('?retour=%2Fespace%2Fmessages');

    await userEvent.click(
      await screen.findByRole('button', { name: 'Se connecter : Aïssatou, cliente' }),
    );

    expect(await screen.findByRole('heading', { level: 1, name: 'Messages' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/espace/messages');
  });

  it('ignore une adresse de retour vers un autre site', async () => {
    const { router } = renderRoute('/connexion?retour=//site-pirate.com');

    await userEvent.click(
      await screen.findByRole('button', { name: 'Se connecter : Aïssatou, cliente' }),
    );

    await waitFor(() => expect(router.state.location.pathname).toBe('/espace/demandes'));
  });

  it('envoie un client sans profil prestataire vers « Devenir prestataire »', async () => {
    const { router } = renderRoute('/pro/agenda', { as: 'user-aissatou' });

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Devenir prestataire' }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/devenir-prestataire');
  });

  it('refuse l’administration à un non-admin', async () => {
    renderRoute('/admin/signalements', { as: 'user-saveurs-de-dakar' });

    expect(await screen.findByRole('heading', { name: 'Accès refusé' })).toBeInTheDocument();
  });

  it('laisse un prestataire entrer dans son espace', async () => {
    renderRoute('/pro/agenda', { as: 'user-saveurs-de-dakar' });

    expect(await screen.findByRole('heading', { level: 1, name: 'Agenda' })).toBeInTheDocument();
  });
});

describe('Menu du compte et gabarits', () => {
  it('affiche « Connexion » quand personne n’est connecté', async () => {
    renderRoute('/');

    const link = await screen.findByRole('link', { name: 'Connexion' });
    // Depuis l'accueil : pas de retour, on arrivera dans son espace.
    expect(link).toHaveAttribute('href', '/connexion');
  });

  it('garde la page en cours dans le lien « Connexion »', async () => {
    renderRoute('/devenir-prestataire');

    const link = await screen.findByRole('link', { name: 'Connexion' });
    expect(link).toHaveAttribute('href', '/connexion?retour=%2Fdevenir-prestataire');
  });

  it('permet à un compte à deux rôles de basculer entre client et prestataire', async () => {
    const { router } = renderRoute('/espace/demandes', { as: 'user-saveurs-de-dakar' });

    await userEvent.click(await screen.findByRole('link', { name: 'Passer en mode prestataire' }));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Tableau de bord' }),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('link', { name: 'Passer en mode client' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/espace/demandes'));
  });

  it('ne propose pas le mode prestataire à une simple cliente', async () => {
    renderRoute('/espace/demandes', { as: 'user-aissatou' });

    await screen.findByRole('heading', { level: 1, name: 'Mes demandes' });
    expect(
      screen.queryByRole('link', { name: 'Passer en mode prestataire' }),
    ).not.toBeInTheDocument();
  });

  it('montre la page active dans le menu de l’espace pro', async () => {
    renderRoute('/pro/avis', { as: 'user-saveurs-de-dakar' });

    const nav = await screen.findByRole('navigation', { name: 'Espace prestataire' });
    expect(within(nav).getByRole('link', { name: 'Avis' })).toHaveAttribute('aria-current', 'page');
    expect(within(nav).getByRole('link', { name: 'Tableau de bord' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('se déconnecte depuis le menu du compte', async () => {
    const { router } = renderRoute('/espace/demandes', { as: 'user-aissatou' });

    await userEvent.click(await screen.findByRole('button', { name: 'Menu de Aïssatou' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Se déconnecter' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/'));
    expect(useSessionStore.getState().user).toBeNull();
    expect(await screen.findByRole('link', { name: 'Connexion' })).toBeInTheDocument();
  });

  it('propose l’administration seulement à l’admin', async () => {
    renderRoute('/', { as: 'user-admin' });

    await userEvent.click(await screen.findByRole('button', { name: 'Menu de Nadia' }));
    expect(await screen.findByRole('menuitem', { name: 'Administration' })).toBeInTheDocument();
    expect(
      screen.queryByRole('menuitem', { name: 'Mon espace prestataire' }),
    ).not.toBeInTheDocument();
  });
});

describe('Raccourci « Mon espace »', () => {
  it('ramène au dernier espace utilisé', async () => {
    const { router } = renderRoute('/pro/agenda', { as: 'user-saveurs-de-dakar' });
    await screen.findByRole('heading', { level: 1, name: 'Agenda' });

    await router.navigate('/');
    await userEvent.click(await screen.findByRole('link', { name: 'Mon espace' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/pro'));
  });
});
