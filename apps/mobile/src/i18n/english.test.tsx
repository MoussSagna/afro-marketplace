import { seedDemoAccounts } from '@afro/common/mocks';
import { fireEvent } from '@testing-library/react-native';
import { Stack } from 'expo-router';
import { renderRouter, screen } from 'expo-router/testing-library';
import { SignInRequired } from '@/features/auth/SignInRequired';
import { AuthWelcomeScreen } from '@/features/auth/screens/AuthWelcomeScreen';
import { SignUpScreen } from '@/features/auth/screens/SignUpScreen';

import { ClientTabsLayout } from '@/features/navigation/ClientTabsLayout';
import { useTabBarStore } from '@/features/navigation/tabBarStore';
import { SearchScreen } from '@/features/search/SearchScreen';
import { useAuthFlowStore } from '@/features/auth/authFlowStore';
import { demoApi, testProviders } from '@/test/demoApi';
import { i18n } from './index';

/*
 * Parcours fonctionnels en anglais (lot M6b) : un téléphone réglé en anglais voit toute l'app
 * en anglais, y compris les erreurs des formulaires (écrites en français dans common).
 */
const Empty = () => null;
const routes = {
  _layout: () => <Stack screenOptions={{ headerShown: false }} />,
  '(tabs)/_layout': ClientTabsLayout,
  '(tabs)/index': SearchScreen,
  demandes: () => (
    <SignInRequired title={i18n.t('tabs.requests')} reason={i18n.t('requests.signIn')}>
      <Empty />
    </SignInRequired>
  ),
  '(tabs)/messages': Empty,
  '(tabs)/compte': Empty,
  '(auth)/bienvenue': AuthWelcomeScreen,
  '(auth)/inscription': SignUpScreen,
};

async function open(initialUrl: string) {
  const { db, api } = demoApi();
  const featured = await api.listFeaturedProviders(); // avant renderRouter (faux minuteurs)
  await renderRouter(routes, { initialUrl, wrapper: testProviders(api) });
  return { db, featured };
}

const type = (label: string, value: string) =>
  fireEvent.changeText(screen.getByLabelText(label), value);
const press = (name: string | RegExp) => fireEvent.press(screen.getByRole('button', { name }));

beforeEach(async () => {
  await i18n.changeLanguage('en');
});

afterEach(() => {
  useTabBarStore.setState({ collapsed: false });
  useAuthFlowStore.setState({ redirectTo: null });
  jest.useRealTimers();
});

describe('L’app en anglais (lot M6b)', () => {
  it('affiche l’accueil de la Recherche en anglais : pilule, à la une, catégories et prix', async () => {
    const { featured } = await open('/');

    expect(screen.getByRole('search', { name: /^What are you looking for\?/ })).toBeOnTheScreen();
    // Les catégories viennent des données (en français) : on les traduit par leur slug.
    expect(await screen.findByRole('button', { name: 'Food & drink' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Beauty & grooming' })).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Traiteur & boissons' })).toBeNull();

    const withPrice = featured.find((p) => p.priceFrom !== undefined)!;
    expect(
      await screen.findByLabelText(new RegExp(`^${withPrice.displayName}, .*, from €`)),
    ).toBeOnTheScreen();
  });

  it('demande de se connecter en anglais, puis ouvre l’accueil de connexion', async () => {
    await open('/demandes');
    expect(screen.getByRole('header', { name: 'Sign in' })).toBeOnTheScreen();
    await press('Sign in');
    expect(screen).toHavePathname('/bienvenue');
    expect(screen.getByRole('button', { name: 'Continue with Google' })).toBeOnTheScreen();
  });

  it('traduit les erreurs du formulaire d’inscription', async () => {
    await open('/inscription');
    expect(screen.getByRole('header', { name: 'Create your account' })).toBeOnTheScreen();

    await type('Password', 'abc');
    expect(screen.getByLabelText('At least 8 characters: not yet')).toBeOnTheScreen();
    expect(screen.getByLabelText('Weak password')).toBeOnTheScreen();
    await type('Email', 'not-an-email');
    await press('Create my account');

    expect(await screen.findByText('Enter your first name')).toBeOnTheScreen();
    expect(screen.getByText('Invalid email address')).toBeOnTheScreen();
    expect(screen.getByText('Accept the terms to continue')).toBeOnTheScreen();
    expect(screen.queryByText('Adresse email invalide')).toBeNull();
  });

  it('traduit l’erreur du serveur « email déjà pris »', async () => {
    const { db } = await open('/inscription');
    const client = seedDemoAccounts.find((a) => a.roles.length === 1)!;
    const existing = db.data.users.find((u) => u.id === client.userId)!;
    await type('First name', 'Awa');
    await type('Email', existing.email);
    await type('Password', 'Bissap2026');
    await fireEvent.press(screen.getByRole('checkbox'));
    await press('Create my account');

    expect(
      await screen.findByText('An account already exists with this email. Sign in.'),
    ).toBeOnTheScreen();
  });

  it('affiche la Recherche en anglais : pilule, catégories, nombre de résultats, filtres', async () => {
    const { api } = demoApi();
    const { total } = await api.searchProviders({}); // avant renderRouter (faux minuteurs)
    await renderRouter(routes, { initialUrl: '/?vue=resultats', wrapper: testProviders(api) });
    expect(screen.getByRole('search', { name: /^What are you looking for\?/ })).toBeOnTheScreen();
    expect(await screen.findByText(`${total} providers`)).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Food & drink' })).toBeOnTheScreen();
    await press('Filters');
    expect(
      await screen.findByRole('button', { name: `Show ${total} providers` }),
    ).toBeOnTheScreen();
    expect(screen.getByRole('adjustable', { name: 'Maximum budget' })).toHaveAccessibilityValue({
      text: 'No limit',
    });
  });
});
