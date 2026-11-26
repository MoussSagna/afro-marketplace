import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderRoute } from '@/test/renderRoute';

async function findSection() {
  return screen.findByRole('region', { name: 'Trois étapes, zéro prise de tête.' });
}

describe('Section « Comment ça marche »', () => {
  it('affiche le surtitre et le titre (« zéro prise de tête » mis en valeur)', async () => {
    renderRoute('/');

    const section = await findSection();
    expect(within(section).getByText('Comment ça marche')).toBeInTheDocument();
    expect(within(section).getByText('zéro prise de tête.')).toHaveClass('text-title-accent');
  });

  it('liste les 3 étapes dans l’ordre, numérotées pour les lecteurs d’écran', async () => {
    renderRoute('/');

    const steps = within(within(await findSection()).getByRole('list')).getAllByRole('listitem');
    expect(steps).toHaveLength(3);
    expect(
      steps.map((step) => within(step).getByRole('heading', { level: 3 }).textContent),
    ).toEqual(['Étape 1 : Cherchez', 'Étape 2 : Demandez un devis', 'Étape 3 : Célébrez']);
    // Le grand numéro « 01 » est décoratif : déjà dit par « Étape 1 ».
    expect(within(steps[0]!).getByText('01')).toHaveAttribute('aria-hidden', 'true');
    expect(within(steps[1]!).getByText(/une offre claire/)).toBeInTheDocument();
  });

  it('« Commencer ma recherche » mène à la recherche', async () => {
    const { router } = renderRoute('/');

    await userEvent.click(
      within(await findSection()).getByRole('link', { name: 'Commencer ma recherche' }),
    );
    await waitFor(() => expect(router.state.location.pathname).toBe('/recherche'));
  });
});
