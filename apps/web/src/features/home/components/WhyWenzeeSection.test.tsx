import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderRoute } from '@/test/renderRoute';

async function findSection() {
  return screen.findByRole('region', { name: 'Le lien entre nos talents et vos moments.' });
}

describe('Section « Pourquoi Wenzee »', () => {
  it('affiche le surtitre, le titre (« nos talents » mis en valeur), le texte et la citation', async () => {
    renderRoute('/');

    const section = await findSection();
    expect(within(section).getByText('Pourquoi Wenzee')).toBeInTheDocument();
    expect(within(section).getByText('nos talents')).toHaveClass('text-title-accent');
    expect(within(section).getByText(/Wenzee les réunit/)).toBeInTheDocument();
    expect(section.querySelector('blockquote')).toHaveTextContent('d’où l’on vient');
  });

  it('la photo a un texte alternatif', async () => {
    renderRoute('/');

    expect(within(await findSection()).getByRole('img')).toHaveAccessibleName(/couple danse/);
  });

  it('« Découvrir notre mission » mène à la page Notre mission', async () => {
    const { router } = renderRoute('/');

    const link = within(await findSection()).getByRole('link', {
      name: 'Découvrir notre mission',
    });
    expect(link).toHaveAttribute('href', '/comment-ca-marche');
    await userEvent.click(link);
    await waitFor(() => expect(router.state.location.pathname).toBe('/comment-ca-marche'));
  });
});
