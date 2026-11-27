import { DEMO_OTP_CODE } from '@afro/common';
import { DEMO_PASSWORD, seedDemoAccounts } from '@afro/common/mocks';
import { act, fireEvent } from '@testing-library/react-native';
import { Stack } from 'expo-router';
import { renderRouter, screen } from 'expo-router/testing-library';
import { useSessionStore } from '@/stores/session';
import { demoApi, testProviders } from '@/test/demoApi';
import { ComingSoonScreen } from '../coming-soon/ComingSoonScreen';
import { ClientTabsLayout } from '../navigation/ClientTabsLayout';
import { useTabBarStore } from '../navigation/tabBarStore';
import { SearchScreen } from '../search/SearchScreen';
import { useAuthFlowStore } from './authFlowStore';
import { AccountScreen } from '../account/AccountScreen';
import { AuthWelcomeScreen } from './screens/AuthWelcomeScreen';
import { DemoAccountsScreen } from './screens/DemoAccountsScreen';
import { ForgotPasswordScreen } from './screens/ForgotPasswordScreen';
import { ResetPasswordScreen } from './screens/ResetPasswordScreen';
import { SignInScreen } from './screens/SignInScreen';
import { SignUpScreen } from './screens/SignUpScreen';
import { VerifiedScreen } from './screens/VerifiedScreen';
import { RESEND_DELAY_S, VerifyCodeScreen } from './screens/VerifyCodeScreen';
import { SignInRequired } from './SignInRequired';

/** Les mêmes écrans que dans app/, branchés à la main pour le test. */
const routes = {
  _layout: () => <Stack screenOptions={{ headerShown: false }} />,
  '(tabs)/_layout': ClientTabsLayout,
  '(tabs)/index': SearchScreen,
  '(tabs)/demandes': () => (
    <SignInRequired title="Demandes" reason="Connecte-toi pour suivre tes demandes de devis.">
      <ComingSoonScreen title="Demandes" lot="M10" description="Tes demandes" />
    </SignInRequired>
  ),
  '(tabs)/messages': () => <ComingSoonScreen title="Messages" lot="M10" description="…" />,
  '(tabs)/compte': () => (
    <SignInRequired title="Compte" reason="Connecte-toi pour retrouver ton compte.">
      <AccountScreen />
    </SignInRequired>
  ),
  '(auth)/bienvenue': AuthWelcomeScreen,
  '(auth)/inscription': SignUpScreen,
  '(auth)/verification': VerifyCodeScreen,
  '(auth)/connexion': SignInScreen,
  '(auth)/mot-de-passe-oublie': ForgotPasswordScreen,
  '(auth)/nouveau-mot-de-passe': ResetPasswordScreen,
  '(auth)/compte-verifie': VerifiedScreen,
  '(auth)/comptes-demo': DemoAccountsScreen,
};

const client = seedDemoAccounts.find((a) => a.roles.length === 1)!;

async function open(initialUrl: string) {
  const { db, api } = demoApi();
  await renderRouter(routes, { initialUrl, wrapper: testProviders(api) });
  return db;
}

const type = (label: string, value: string) =>
  fireEvent.changeText(screen.getByLabelText(label), value);
const press = (name: string | RegExp) => fireEvent.press(screen.getByRole('button', { name }));
const tapLink = (name: string) => fireEvent.press(screen.getByRole('link', { name }));

afterEach(() => {
  useSessionStore.setState({ user: null, token: null });
  useAuthFlowStore.setState({ redirectTo: null });
  useTabBarStore.setState({ collapsed: false });
  jest.useRealTimers();
});

describe('Garde des onglets (lot M5)', () => {
  it('demande de se connecter pour voir ses demandes', async () => {
    await open('/demandes');
    expect(screen.getByRole('header', { name: 'Connecte-toi' })).toBeOnTheScreen();
    expect(screen.getByText('Connecte-toi pour suivre tes demandes de devis.')).toBeOnTheScreen();
    expect(screen.queryByText('Lot M10')).toBeNull();

    await press('Se connecter');
    expect(screen).toHavePathname('/bienvenue');
    expect(useAuthFlowStore.getState().redirectTo).toBe('/demandes');
  });

  it('montre le compte quand on est connecté, et permet de se déconnecter', async () => {
    const db = await open('/');
    const user = db.data.users.find((u) => u.id === client.userId)!;
    await act(() => useSessionStore.getState().signIn({ user, token: `demo:${user.id}` }));
    await fireEvent.press(screen.getByRole('tab', { name: 'Profil' }));
    expect(await screen.findByText(user.email)).toBeOnTheScreen();

    await press('Se déconnecter');
    expect(useSessionStore.getState().user).toBeNull();
    expect(screen.getByRole('header', { name: 'Connecte-toi' })).toBeOnTheScreen();
  });
});

describe('Inscription par email', () => {
  it('parcours complet : onglet Demandes → inscription → code → compte vérifié → retour aux Demandes', async () => {
    const db = await open('/demandes');
    await press('Créer un compte');
    expect(screen).toHavePathname('/inscription');

    await type('Prénom', 'Aminata');
    await type('Email', '  Aminata.Ba@Email.fr ');
    await type('Mot de passe', 'Bissap2026');
    expect(screen.getByLabelText('Au moins 8 caractères : oui')).toBeOnTheScreen();
    expect(screen.getByLabelText('Une majuscule et un chiffre : oui')).toBeOnTheScreen();
    expect(screen.getByLabelText('Mot de passe correct')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('checkbox'));
    await press('Créer mon compte');

    expect(await screen.findByRole('header', { name: 'Vérifie ton email' })).toBeOnTheScreen();
    expect(screen).toHavePathname('/verification');
    expect(screen.getByText('aminata.ba@email.fr')).toBeOnTheScreen();

    // Un mauvais code : message d'erreur, on reste sur l'écran.
    await type('Code à 6 chiffres', '000000');
    expect(
      await screen.findByText('Code incorrect. Vérifie le code reçu par email.'),
    ).toBeOnTheScreen();
    expect(useSessionStore.getState().user).toBeNull();

    // Le bon code (123456 en démo) : la session s'ouvre.
    await type('Code à 6 chiffres', DEMO_OTP_CODE);
    expect(await screen.findByText(/Bienvenue chez Wenzee, Aminata/)).toBeOnTheScreen();
    expect(screen).toHavePathname('/compte-verifie');
    expect(useSessionStore.getState().user?.email).toBe('aminata.ba@email.fr');
    expect(db.data.users.some((u) => u.email === 'aminata.ba@email.fr')).toBe(true);

    await press('Continuer');
    expect(screen).toHavePathname('/demandes');
    expect(await screen.findByText('Lot M10')).toBeOnTheScreen();
  });

  it('affiche les erreurs du schéma sous chaque champ', async () => {
    await open('/inscription');
    await type('Mot de passe', 'court');
    expect(screen.getByLabelText('Au moins 8 caractères : pas encore')).toBeOnTheScreen();
    expect(screen.getByLabelText('Mot de passe faible')).toBeOnTheScreen();
    await type('Email', 'pas-un-email');
    await press('Créer mon compte');

    expect(await screen.findByText('Indique ton prénom')).toBeOnTheScreen();
    expect(screen.getByText('Adresse email invalide')).toBeOnTheScreen();
    expect(screen.getByText('Accepte les conditions pour continuer')).toBeOnTheScreen();
    expect(screen).toHavePathname('/inscription');
  });

  it('prévient quand l’email a déjà un compte', async () => {
    const db = await open('/inscription');
    const existing = db.data.users.find((u) => u.id === client.userId)!;
    await type('Prénom', 'Aïssatou');
    await type('Email', existing.email);
    await type('Mot de passe', 'Bissap2026');
    await fireEvent.press(screen.getByRole('checkbox'));
    await press('Créer mon compte');

    expect(
      await screen.findByText('Un compte existe déjà avec cet email. Connecte-toi.'),
    ).toBeOnTheScreen();
    expect(screen).toHavePathname('/inscription');
  });

  it('renvoie le code après le compte à rebours', async () => {
    await open('/verification?email=aminata.ba%40email.fr&purpose=sign-up');
    expect(screen.getByText(`Pas reçu ? Renvoyer dans 0:${RESEND_DELAY_S}`)).toBeOnTheScreen();
    expect(screen.getByText(/le code est 123456/)).toBeOnTheScreen();

    for (let i = 0; i < RESEND_DELAY_S; i++) {
      await act(() => jest.advanceTimersByTime(1000));
    }
    await tapLink('Renvoyer le code');
    expect(await screen.findByText('Nouveau code envoyé.')).toBeOnTheScreen();
    expect(screen.getByText(`Pas reçu ? Renvoyer dans 0:${RESEND_DELAY_S}`)).toBeOnTheScreen();
  });
});

describe('Connexion', () => {
  it('refuse un mauvais mot de passe, puis connecte et ouvre la Recherche', async () => {
    const db = await open('/bienvenue');
    const user = db.data.users.find((u) => u.id === client.userId)!;
    await tapLink('Se connecter');
    expect(screen).toHavePathname('/connexion');

    await type('Email', user.email);
    await type('Mot de passe', 'mauvais');
    await press('Se connecter');
    expect(await screen.findByText('Email ou mot de passe incorrect.')).toBeOnTheScreen();

    await press('Afficher le mot de passe');
    expect(screen.getByLabelText('Mot de passe')).toHaveProp('secureTextEntry', false);
    await type('Mot de passe', DEMO_PASSWORD);
    await press('Se connecter');
    expect(await screen.findByTestId('search-state-home')).toBeOnTheScreen();
    expect(screen).toHavePathname('/');
    expect(useSessionStore.getState().user?.id).toBe(user.id);
  });

  it('Google et Apple : bientôt disponibles', async () => {
    await open('/connexion');
    await press('Continuer avec Apple');
    expect(screen.getByText(/Bientôt disponible : la connexion avec Apple/)).toBeOnTheScreen();
  });

  it('se connecte en un geste avec un compte de démo', async () => {
    await open('/bienvenue');
    await tapLink('Essayer un compte de démo');
    await fireEvent.press(
      await screen.findByRole('button', { name: `Se connecter : ${client.label}` }),
    );
    expect(await screen.findByTestId('search-state-home')).toBeOnTheScreen();
    expect(useSessionStore.getState().user?.id).toBe(client.userId);
  });
});

describe('Mot de passe oublié', () => {
  it('code, nouveau mot de passe, puis connecté avec le nouveau', async () => {
    const db = await open('/connexion');
    const user = db.data.users.find((u) => u.id === client.userId)!;
    await tapLink('Mot de passe oublié ?');
    await type('Email', user.email);
    await press('Envoyer le code');

    expect(await screen.findByText(/Si un compte existe/)).toBeOnTheScreen();
    await type('Code à 6 chiffres', DEMO_OTP_CODE);
    expect(await screen.findByRole('header', { name: 'Nouveau mot de passe' })).toBeOnTheScreen();
    expect(useSessionStore.getState().user).toBeNull(); // pas encore connecté

    await type('Nouveau mot de passe', 'Thieboudienne7');
    await type('Confirme le mot de passe', 'Thieboudienne8');
    expect(
      screen.getByLabelText('Les deux mots de passe sont identiques : pas encore'),
    ).toBeOnTheScreen();
    await press('Enregistrer');
    expect(
      await screen.findByText('Les deux mots de passe ne sont pas identiques'),
    ).toBeOnTheScreen();

    await type('Confirme le mot de passe', 'Thieboudienne7');
    await press('Enregistrer');
    expect(await screen.findByText(/Ton mot de passe est changé/)).toBeOnTheScreen();
    expect(useSessionStore.getState().user?.id).toBe(user.id);
    expect(db.data.credentials.find((c) => c.userId === user.id)?.password).toBe('Thieboudienne7');

    await press('Découvrir les prestataires');
    expect(screen).toHavePathname('/');
  });
});
