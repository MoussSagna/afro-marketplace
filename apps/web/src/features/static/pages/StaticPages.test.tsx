import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderRoute } from '@/test/renderRoute';

describe('Pages de contenu (P7)', () => {
  it.each([
    ['/comment-ca-marche', 'Comment ça marche'],
    ['/faq', 'Questions fréquentes'],
    ['/cgu', 'Conditions générales d’utilisation'],
    ['/mentions-legales', 'Mentions légales'],
    ['/confidentialite', 'Politique de confidentialité'],
  ])('%s affiche son titre et le titre de l’onglet', async (path, title) => {
    renderRoute(path);
    expect(await screen.findByRole('heading', { level: 1, name: title })).toBeInTheDocument();
    await waitFor(() => expect(document.title).toBe(`${title} · Wenzee`));
  });

  it('les textes juridiques sont marqués comme provisoires', async () => {
    renderRoute('/cgu');
    expect(await screen.findByRole('note')).toHaveTextContent(/relecture juridique/);
  });

  it('la FAQ s’ouvre question par question', async () => {
    renderRoute('/faq');
    const question = await screen.findByText('Est-ce que c’est payant ?');
    const details = question.closest('details')!;
    expect(details.open).toBe(false);
    await userEvent.click(question);
    expect(details.open).toBe(true);
  });

  it('le pied de page mène aux pages légales', async () => {
    renderRoute('/');
    const footer = await screen.findByRole('contentinfo');
    for (const [name, href] of [
      ['FAQ', '/faq'],
      ['Conditions d’utilisation', '/cgu'],
      ['Mentions légales', '/mentions-legales'],
      ['Politique de confidentialité', '/confidentialite'],
    ]) {
      expect(within(footer).getByRole('link', { name })).toHaveAttribute('href', href);
    }
  });
});
