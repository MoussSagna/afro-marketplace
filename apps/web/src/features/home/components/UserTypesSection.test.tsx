import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderRoute } from '@/test/renderRoute';

async function findSection() {
  const title = await screen.findByRole('heading', {
    level: 2,
    name: 'Une plateforme pensée pour tous les acteurs de vos événements.',
  });
  return title.closest('section')!;
}

describe('Section « Deux façons d’utiliser Wenzee »', () => {
  it('affiche le surtitre et le titre, « vos événements » mis en valeur', async () => {
    renderRoute('/');

    const section = await findSection();
    expect(within(section).getByText('Deux façons d’utiliser Wenzee')).toBeInTheDocument();
    expect(within(section).getByText('vos événements.')).toHaveClass('text-title-accent');
  });

  it('carte prestataires : badge, titre, 5 avantages, inscription et connexion', async () => {
    renderRoute('/');

    const card = within(await findSection()).getByRole('article', {
      name: 'Développez votre activité.',
    });
    expect(within(card).getByText('Pour les prestataires')).toBeInTheDocument();
    expect(within(card).getByText('votre activité.')).toHaveClass('text-title-accent');
    expect(within(card).getAllByRole('listitem')).toHaveLength(5);
    expect(within(card).getByText('Recevez des demandes qualifiées')).toBeInTheDocument();
    expect(within(card).getByRole('link', { name: 'Référencer mon activité' })).toHaveAttribute(
      'href',
      '/devenir-prestataire',
    );
    expect(within(card).getByRole('link', { name: 'Déjà inscrit ? Se connecter' })).toHaveAttribute(
      'href',
      '/connexion?retour=%2Fpro',
    );
  });

  it('carte particuliers : badge, titre, 5 avantages, recherche et connexion', async () => {
    renderRoute('/');

    const card = within(await findSection()).getByRole('article', {
      name: 'Trouvez les bons prestataires.',
    });
    expect(within(card).getByText('Pour les particuliers')).toBeInTheDocument();
    expect(within(card).getAllByRole('listitem')).toHaveLength(5);
    expect(within(card).getByRole('link', { name: 'Organiser mon événement' })).toHaveAttribute(
      'href',
      '/recherche',
    );
    expect(within(card).getByRole('link', { name: 'Déjà inscrit ? Se connecter' })).toHaveAttribute(
      'href',
      '/connexion',
    );
  });

  it('aucune photo : seulement des illustrations vectorielles', async () => {
    renderRoute('/');

    const section = await findSection();
    expect(section.querySelector('img')).toBeNull();
    expect(section.querySelectorAll('article svg').length).toBeGreaterThan(0);
  });

  it('« Référencer mon activité » ouvre la page Devenir prestataire', async () => {
    const { router } = renderRoute('/');

    const card = within(await findSection()).getByRole('article', {
      name: 'Développez votre activité.',
    });
    await userEvent.click(within(card).getByRole('link', { name: 'Référencer mon activité' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/devenir-prestataire'));
  });
});
