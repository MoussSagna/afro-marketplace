import { act, fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { renderRoute } from '@/test/renderRoute';

function scrollTo(y: number) {
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true });
  fireEvent.scroll(window);
}

describe("Navbar de l'accueil", () => {
  afterEach(() => scrollTo(0));

  it('remplace l’en-tête classique sur l’accueil, avec tous ses liens', async () => {
    renderRoute('/');

    await screen.findByRole('heading', { level: 1, name: /Trouvez les talents/ });
    const header = screen.getByRole('banner');
    const nav = within(header).getAllByRole('navigation', { name: 'Navigation principale' })[0]!;
    expect(within(nav).getByRole('link', { name: 'Accueil' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(nav).getByRole('button', { name: 'Prestataires' })).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: 'Événements' })).toHaveAttribute(
      'href',
      '/evenements',
    );
    expect(within(nav).getByRole('link', { name: 'Offres & Deals' })).toHaveAttribute(
      'href',
      '/offres',
    );
    expect(within(nav).getByRole('link', { name: 'Notre mission' })).toHaveAttribute(
      'href',
      '/comment-ca-marche',
    );
    // Pas de cœur « Favoris » dans la barre (retiré à la demande de Mouss) : seulement dans le menu mobile.
    expect(within(header).queryByRole('link', { name: 'Favoris' })).not.toBeInTheDocument();
    expect(within(header).getByRole('link', { name: 'Se connecter' })).toHaveAttribute(
      'href',
      '/connexion',
    );
    expect(within(header).getByRole('link', { name: 'S’inscrire' })).toBeInTheDocument();
  });

  it('transparente au chargement, fond flouté après le défilement', async () => {
    renderRoute('/');

    await screen.findByRole('heading', { level: 1, name: /Trouvez les talents/ });
    const header = screen.getByRole('banner');
    expect(header).toHaveAttribute('data-scrolled', 'false');
    expect(header).toHaveClass('fixed', 'bg-transparent');

    await act(async () => {
      scrollTo(300);
      await new Promise((resolve) => requestAnimationFrame(resolve));
    });
    expect(header).toHaveAttribute('data-scrolled', 'true');
    expect(header).toHaveClass('backdrop-blur-md');
    expect(header).not.toHaveClass('bg-transparent');
  });

  it('le menu « Prestataires » liste les catégories', async () => {
    renderRoute('/');

    await userEvent.click(await screen.findByRole('button', { name: 'Prestataires' }));
    const menu = await screen.findByRole('menu');
    expect(within(menu).getByRole('menuitem', { name: 'Tous les prestataires' })).toHaveAttribute(
      'href',
      '/recherche',
    );
    expect(await within(menu).findByRole('menuitem', { name: 'Beauté' })).toHaveAttribute(
      'href',
      '/categories/beaute',
    );
  });

  it('le menu mobile s’ouvre, mène à une page et se referme', async () => {
    const { router } = renderRoute('/');

    await userEvent.click(await screen.findByRole('button', { name: 'Ouvrir le menu' }));
    const dialog = await screen.findByRole('dialog', { name: 'Menu' });
    await userEvent.click(within(dialog).getByRole('link', { name: 'Favoris' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Favoris' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/favoris');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('connecté : « Mon espace » et le menu du compte à la place des boutons', async () => {
    renderRoute('/', { as: 'user-aissatou' });

    await screen.findByRole('heading', { level: 1, name: /Trouvez les talents/ });
    const header = screen.getByRole('banner');
    expect(within(header).getByRole('link', { name: 'Mon espace' })).toBeInTheDocument();
    expect(within(header).queryByRole('link', { name: 'Se connecter' })).not.toBeInTheDocument();
  });

  it('les autres pages ont la même navbar, collée en haut avec son fond', async () => {
    renderRoute('/faq');

    await screen.findByRole('heading', { level: 1, name: 'Questions fréquentes' });
    // La FAQ a son propre <header> dans un <article> : on part du logo de la navbar.
    const header = screen.getByRole('link', { name: 'Wenzee, accueil' }).closest('header')!;
    expect(header).not.toHaveAttribute('data-scrolled'); // jamais transparente hors de l'accueil
    expect(header).toHaveClass('sticky', 'bg-foreground/95');
    expect(within(header).getByRole('link', { name: 'Notre mission' })).toBeInTheDocument();
    // Se connecter ramène à la page en cours.
    expect(within(header).getByRole('link', { name: 'Se connecter' })).toHaveAttribute(
      'href',
      '/connexion?retour=%2Ffaq',
    );
  });

  it('« Prestataires » est souligné sur la recherche', async () => {
    renderRoute('/recherche');

    await screen.findByRole('heading', { level: 1, name: 'Rechercher un prestataire' });
    const header = screen.getByRole('banner');
    expect(within(header).getByRole('button', { name: 'Prestataires' })).toHaveClass(
      'font-semibold',
    );
    expect(within(header).getByRole('link', { name: 'Accueil' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('dans un espace : badge de l’espace, bascule de mode et menu du compte', async () => {
    renderRoute('/pro', { as: 'user-saveurs-de-dakar' });

    await screen.findByRole('heading', { level: 1, name: 'Tableau de bord' });
    const header = screen.getByRole('banner');
    expect(within(header).getByText('Espace pro')).toBeInTheDocument();
    expect(within(header).getByRole('link', { name: 'Passer en mode client' })).toBeInTheDocument();
    expect(within(header).getByRole('button', { name: 'Menu de Mamadou' })).toBeInTheDocument();
    // « Mon espace » est réservé aux pages publiques.
    expect(within(header).queryByRole('link', { name: 'Mon espace' })).not.toBeInTheDocument();
    expect(within(header).getByRole('button', { name: 'Prestataires' })).toBeInTheDocument();
  });
});
