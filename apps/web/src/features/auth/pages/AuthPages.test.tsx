import { authMessages } from '@afro/common';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { useSessionStore } from '@/stores/session';
import { renderRoute } from '@/test/renderRoute';
import { server } from '@/test/server';

/** Le mot de passe des comptes de démo (voir agents/donnees-demo.md). */
const DEMO_PASSWORD = 'Wenzee2026';

describe('Connexion par email (simulée)', () => {
  it('affiche la page en écran partagé, sans navbar ni pied de page', async () => {
    renderRoute('/connexion');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Bon retour sur Wenzee' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Connectez-vous à votre compte pour continuer.')).toBeInTheDocument();
    expect(
      screen.getByText('Trouvez le prestataire idéal pour vos événements'),
    ).toBeInTheDocument();
    for (const tag of ['Mariages', 'Anniversaires', 'Événements privés']) {
      expect(screen.getByText(tag)).toBeInTheDocument();
    }
    // Le logo officiel (composant Logo), lien vers l'accueil.
    expect(screen.getByRole('link', { name: 'Wenzee, accueil' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('img', { name: 'Wenzee' })).toHaveAttribute('src', '/wenzee-logo.svg');
    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
    expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument();
  });

  it('valide les champs avant d’appeler le serveur', async () => {
    renderRoute('/connexion');

    await userEvent.click(await screen.findByRole('button', { name: 'Se connecter' }));

    expect(await screen.findByText(authMessages.emailInvalid)).toBeInTheDocument();
    expect(screen.getByText(authMessages.passwordRequired)).toBeInTheDocument();
    expect(screen.getByLabelText('Adresse e-mail')).toHaveAttribute('aria-invalid', 'true');
    expect(useSessionStore.getState().user).toBeNull();
  });

  it('connecte un compte de démo avec son email et son mot de passe', async () => {
    const { router } = renderRoute('/connexion');

    await userEvent.type(
      await screen.findByLabelText('Adresse e-mail'),
      'aissatou.ndiaye@example.com',
    );
    await userEvent.type(screen.getByLabelText('Mot de passe'), DEMO_PASSWORD);
    await userEvent.click(screen.getByRole('button', { name: 'Se connecter' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Mes demandes' })).toBeVisible();
    expect(router.state.location.pathname).toBe('/espace/demandes');
    expect(useSessionStore.getState().token).toBe('demo:user-aissatou');
  });

  it('revient à la page demandée (?retour=) après la connexion', async () => {
    const { router } = renderRoute('/connexion?retour=%2Fespace%2Fmessages');

    await userEvent.type(
      await screen.findByLabelText('Adresse e-mail'),
      'aissatou.ndiaye@example.com',
    );
    await userEvent.type(screen.getByLabelText('Mot de passe'), DEMO_PASSWORD);
    await userEvent.click(screen.getByRole('button', { name: 'Se connecter' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/espace/messages'));
  });

  it('affiche le message du serveur pour un mauvais mot de passe', async () => {
    renderRoute('/connexion');

    await userEvent.type(
      await screen.findByLabelText('Adresse e-mail'),
      'aissatou.ndiaye@example.com',
    );
    await userEvent.type(screen.getByLabelText('Mot de passe'), 'Mauvais2026');
    await userEvent.click(screen.getByRole('button', { name: 'Se connecter' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Email ou mot de passe incorrect.');
    expect(useSessionStore.getState().user).toBeNull();
  });

  it('montre un état de chargement pendant la connexion', async () => {
    let release = () => {};
    server.use(
      http.post('*/api/auth/sign-in', async () => {
        await new Promise<void>((resolve) => (release = resolve));
        return HttpResponse.json({ code: 'invalid_credentials', message: 'Non.' }, { status: 401 });
      }),
    );
    renderRoute('/connexion');

    await userEvent.type(await screen.findByLabelText('Adresse e-mail'), 'a@example.com');
    await userEvent.type(screen.getByLabelText('Mot de passe'), 'x');
    await userEvent.click(screen.getByRole('button', { name: 'Se connecter' }));

    const pending = await screen.findByRole('button', { name: 'Connexion…' });
    expect(pending).toBeDisabled();
    release();
    expect(await screen.findByRole('alert')).toHaveTextContent('Non.');
  });

  it('affiche et masque le mot de passe', async () => {
    renderRoute('/connexion');

    const input = await screen.findByLabelText('Mot de passe');
    const toggle = screen.getByRole('button', { name: 'Afficher le mot de passe' });
    expect(input).toHaveAttribute('type', 'password');
    expect(toggle).toHaveAttribute('aria-pressed', 'false');

    await userEvent.click(toggle);
    expect(input).toHaveAttribute('type', 'text');
    expect(toggle).toHaveAttribute('aria-pressed', 'true');

    await userEvent.click(toggle);
    expect(input).toHaveAttribute('type', 'password');
  });

  it('Google et Apple restent simulés : un message, pas de connexion', async () => {
    renderRoute('/connexion');

    await userEvent.click(await screen.findByRole('button', { name: 'Continuer avec Google' }));
    expect(screen.getByRole('status')).toHaveTextContent(
      'Bientôt disponible : la connexion avec Google',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Continuer avec Apple' }));
    expect(screen.getByRole('status')).toHaveTextContent('la connexion avec Apple');
    expect(useSessionStore.getState().user).toBeNull();
  });

  it('mène à la création de compte et au mot de passe oublié en gardant ?retour=', async () => {
    renderRoute('/connexion?retour=%2Fpro');

    expect(await screen.findByRole('link', { name: 'Créer un compte' })).toHaveAttribute(
      'href',
      '/inscription?retour=%2Fpro',
    );
    expect(screen.getByRole('link', { name: 'Mot de passe oublié ?' })).toHaveAttribute(
      'href',
      '/mot-de-passe-oublie?retour=%2Fpro',
    );
  });

  it('garde les comptes de démo en un clic', async () => {
    renderRoute('/connexion');

    const demo = await screen.findByRole('region', { name: 'Version de démonstration' });
    expect(demo).toHaveTextContent(DEMO_PASSWORD);
    expect(await within(demo).findAllByRole('button', { name: /^Se connecter : / })).toHaveLength(
      3,
    );
  });
});

describe('Création de compte (simulée)', () => {
  it('« Créer un compte » ouvre l’inscription', async () => {
    const { router } = renderRoute('/connexion');

    await userEvent.click(await screen.findByRole('link', { name: 'Créer un compte' }));

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Créer un compte' }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/inscription');
  });

  it('valide le formulaire et coche les règles du mot de passe en direct', async () => {
    renderRoute('/inscription');

    await userEvent.click(await screen.findByRole('button', { name: 'Créer mon compte' }));
    expect(await screen.findByText(authMessages.firstNameRequired)).toBeInTheDocument();
    expect(screen.getByText(authMessages.acceptTerms)).toBeInTheDocument();

    const rules = screen.getByRole('list', { name: 'Règles du mot de passe' });
    expect(rules).toHaveTextContent('Au moins 8 caractères : pas encore');
    await userEvent.type(screen.getByLabelText('Mot de passe'), 'Bonjour2026');
    expect(rules).toHaveTextContent('Au moins 8 caractères : oui');
    expect(rules).toHaveTextContent('Une majuscule et un chiffre : oui');
  });

  it('crée le compte avec le code de démo puis ouvre l’espace client', async () => {
    const { router } = renderRoute('/inscription');

    await userEvent.type(await screen.findByLabelText('Prénom'), 'Awa');
    await userEvent.type(screen.getByLabelText('Adresse e-mail'), 'awa.nouvelle@example.com');
    await userEvent.type(screen.getByLabelText('Mot de passe'), 'Bonjour2026');
    await userEvent.click(screen.getByRole('checkbox'));
    await userEvent.click(screen.getByRole('button', { name: 'Créer mon compte' }));

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Vérifiez votre e-mail' }),
    ).toBeInTheDocument();
    expect(screen.getByText('awa.nouvelle@example.com')).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Code à 6 chiffres'), '000000');
    await userEvent.click(screen.getByRole('button', { name: 'Confirmer' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Code incorrect');

    await userEvent.clear(screen.getByLabelText('Code à 6 chiffres'));
    await userEvent.type(screen.getByLabelText('Code à 6 chiffres'), '123456');
    await userEvent.click(screen.getByRole('button', { name: 'Confirmer' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/espace/demandes'));
    expect(useSessionStore.getState().user?.firstName).toBe('Awa');
  });

  it('signale sous le champ un email déjà inscrit', async () => {
    renderRoute('/inscription');

    await userEvent.type(await screen.findByLabelText('Prénom'), 'Aïssatou');
    await userEvent.type(screen.getByLabelText('Adresse e-mail'), 'aissatou.ndiaye@example.com');
    await userEvent.type(screen.getByLabelText('Mot de passe'), 'Bonjour2026');
    await userEvent.click(screen.getByRole('checkbox'));
    await userEvent.click(screen.getByRole('button', { name: 'Créer mon compte' }));

    expect(await screen.findByText(/Un compte existe déjà avec cet email/)).toBeInTheDocument();
    expect(screen.getByLabelText('Adresse e-mail')).toHaveAttribute('aria-invalid', 'true');
  });

  it('la navbar mène à l’inscription avec « S’inscrire »', async () => {
    renderRoute('/devenir-prestataire');

    const banner = await screen.findByRole('banner');
    expect(within(banner).getByRole('link', { name: 'S’inscrire' })).toHaveAttribute(
      'href',
      '/inscription?retour=%2Fdevenir-prestataire',
    );
  });
});

describe('Mot de passe oublié (simulé)', () => {
  it('envoie un code puis change le mot de passe et ouvre la session', async () => {
    const { router } = renderRoute('/connexion');

    await userEvent.click(await screen.findByRole('link', { name: 'Mot de passe oublié ?' }));
    await userEvent.type(
      await screen.findByLabelText('Adresse e-mail'),
      'aissatou.ndiaye@example.com',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Envoyer le code' }));

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Nouveau mot de passe' }),
    ).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Code à 6 chiffres'), '123456');
    await userEvent.type(screen.getByLabelText('Nouveau mot de passe'), 'Nouveau2026');
    await userEvent.type(screen.getByLabelText('Confirmez le mot de passe'), 'Autre2026');
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer et me connecter' }));
    expect(
      await screen.findByText('Les deux mots de passe ne sont pas identiques'),
    ).toBeInTheDocument();

    await userEvent.clear(screen.getByLabelText('Confirmez le mot de passe'));
    await userEvent.type(screen.getByLabelText('Confirmez le mot de passe'), 'Nouveau2026');
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer et me connecter' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/espace/demandes'));
    expect(useSessionStore.getState().token).toBe('demo:user-aissatou');
  });
});
