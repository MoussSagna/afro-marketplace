import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderRoute } from '@/test/renderRoute';

describe('Pied de page', () => {
  it('a les 4 rubriques et leurs liens', async () => {
    renderRoute('/faq');

    const footer = await screen.findByRole('contentinfo');
    const discover = within(footer).getByRole('navigation', { name: 'Découvrir' });
    expect(
      within(discover)
        .getAllByRole('link')
        .map((link) => link.getAttribute('href')),
    ).toEqual(['/', '/recherche', '/evenements', '/offres', '/comment-ca-marche']);
    const profiles = within(footer).getByRole('navigation', { name: 'Je suis' });
    expect(within(profiles).getByRole('link', { name: /Prestataire/ })).toHaveAttribute(
      'href',
      '/devenir-prestataire',
    );
    expect(within(profiles).getByRole('link', { name: /Particulier/ })).toHaveAttribute(
      'href',
      '/recherche',
    );
    const support = within(footer).getByRole('navigation', { name: 'Aide & Support' });
    expect(within(support).getByRole('link', { name: 'Contactez-nous' })).toHaveAttribute(
      'href',
      '/contact',
    );
    expect(within(footer).getByRole('heading', { name: 'Restez informé' })).toBeInTheDocument();
    expect(within(footer).getByText(/Wenzee\. Tous droits réservés\./)).toBeInTheDocument();
  });

  it('est le même dans les espaces (ici l’espace pro)', async () => {
    renderRoute('/pro', { as: 'user-saveurs-de-dakar' });

    await screen.findByRole('heading', { level: 1, name: 'Tableau de bord' });
    const footer = screen.getByRole('contentinfo');
    expect(
      within(footer).getByRole('navigation', { name: 'Informations légales' }),
    ).toBeInTheDocument();
    expect(within(footer).getByRole('link', { name: 'Wenzee, accueil' })).toHaveAttribute(
      'href',
      '/',
    );
  });

  it('les réseaux sociaux sans compte ne sont pas des liens', async () => {
    renderRoute('/faq');

    const socials = within(await screen.findByRole('contentinfo')).getByRole('list', {
      name: 'Réseaux sociaux',
    });
    expect(within(socials).getAllByRole('img')).toHaveLength(5);
    expect(within(socials).queryAllByRole('link')).toHaveLength(0);
  });

  it('lettre d’information : refuse une adresse invalide, puis répond honnêtement', async () => {
    renderRoute('/faq');

    const form = within(await screen.findByRole('contentinfo')).getByRole('form', {
      name: 'Lettre d’information',
    });
    const email = within(form).getByLabelText('Votre adresse e-mail');
    const submit = within(form).getByRole('button', {
      name: 'S’inscrire à la lettre d’information',
    });

    await userEvent.type(email, 'pas-une-adresse');
    await userEvent.click(submit);
    expect(email).toHaveAttribute('aria-invalid', 'true');
    expect(within(form).getByRole('status')).toHaveTextContent('Saisis une adresse e-mail valide');

    await userEvent.clear(email);
    await userEvent.type(email, 'awa@exemple.fr');
    await userEvent.click(submit);
    expect(email).toHaveAttribute('aria-invalid', 'false');
    expect(within(form).getByRole('status')).toHaveTextContent('pas encore été enregistrée');
  });

  it('« Contactez-nous » ouvre une page « bientôt disponible »', async () => {
    renderRoute('/contact');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Contactez-nous' }),
    ).toBeInTheDocument();
  });
});
