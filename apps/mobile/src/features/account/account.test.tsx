import { DEMO_CLIENT_ID, type MockDb } from '@afro/common/mocks';
import { act, fireEvent, waitFor } from '@testing-library/react-native';
import { renderRouter, screen } from 'expo-router/testing-library';
import { Linking } from 'react-native';
import AccountTab from '../../../app/(tabs)/compte';
import InfoRoute from '../../../app/mon-compte/informations';
import NotificationsRoute from '../../../app/mon-compte/notifications';
import { i18n } from '@/i18n';
import { useLanguageStore } from '@/i18n/languageStore';
import { resetDemoData } from '@/lib/demoData';
import { siteUrl } from '@/lib/site';
import { useSessionStore } from '@/stores/session';
import { demoApi, testProviders } from '@/test/demoApi';
import { useThemeStore } from '@/theme/themeStore';
import { ClientTabsLayout } from '../navigation/ClientTabsLayout';
import { useTabBarStore } from '../navigation/tabBarStore';

jest.mock('@/lib/demoData', () => ({ resetDemoData: jest.fn(() => true) }));

const Empty = () => null;
const routes = {
  '(tabs)/_layout': ClientTabsLayout,
  '(tabs)/index': Empty,
  '(tabs)/demandes': Empty,
  '(tabs)/messages': Empty,
  '(tabs)/compte': AccountTab,
  'mon-compte/informations': InfoRoute,
  'mon-compte/notifications': NotificationsRoute,
};

async function open(initialUrl: string, prepare?: (db: MockDb) => void) {
  const ctx = demoApi();
  prepare?.(ctx.db);
  const user = ctx.db.data.users.find((u) => u.id === DEMO_CLIENT_ID)!;
  await act(() => useSessionStore.getState().signIn({ user, token: `demo:${user.id}` }));
  await renderRouter(routes, { initialUrl, wrapper: testProviders(ctx.api) });
  return { ...ctx, user };
}

const press = (name: string | RegExp) => fireEvent.press(screen.getByRole('button', { name }));

afterEach(async () => {
  useTabBarStore.setState({ collapsed: false });
  useSessionStore.setState({ user: null, token: null });
  useThemeStore.setState({ preference: 'system' });
  useLanguageStore.setState({ preference: 'system' });
  await act(() => i18n.changeLanguage('fr'));
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('Compte (lot M12b)', () => {
  it('montre qui je suis, et « Devenir pro » ouvre le site', async () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    const { user } = await open('/compte');
    expect(await screen.findByText(user.email)).toBeOnTheScreen();
    expect(screen.getByText('Tu es prestataire ?')).toBeOnTheScreen();
    await press('Devenir pro');
    expect(openURL).toHaveBeenCalledWith(siteUrl('/devenir-prestataire'));
    await press('Aide et FAQ');
    expect(openURL).toHaveBeenLastCalledWith(siteUrl('/faq'));
  });

  it('change l’apparence et la langue', async () => {
    await open('/compte');
    await press('Apparence, Automatique');
    await fireEvent.press(screen.getByRole('radio', { name: 'Sombre' }));
    expect(useThemeStore.getState().preference).toBe('dark');
    expect(screen.getByRole('button', { name: 'Apparence, Sombre' })).toBeOnTheScreen();

    await press('Langue, Automatique');
    await fireEvent.press(screen.getByRole('radio', { name: 'English' }));
    expect(useLanguageStore.getState().preference).toBe('en');
    expect(await screen.findByRole('button', { name: 'Language, English' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeOnTheScreen();
  });

  it('réinitialise les données de démo après confirmation', async () => {
    await open('/compte');
    await press('Réinitialiser les données de démo');
    expect(screen.getByText('Réinitialiser les données de démo ?')).toBeOnTheScreen();
    await press('Oui, réinitialiser');
    expect(resetDemoData).toHaveBeenCalled();
    expect(screen.getByText('Les données de démo sont comme au premier jour.')).toBeOnTheScreen();
    expect(useSessionStore.getState().user).not.toBeNull();
  });

  it('modifie mes informations (téléphone vérifié)', async () => {
    const { db } = await open('/compte');
    await press('Mes informations');
    const phone = await screen.findByLabelText('Téléphone (facultatif)');
    await fireEvent.changeText(screen.getByLabelText('Prénom'), 'Aïcha');
    await fireEvent.changeText(phone, '12');
    await press('Enregistrer');
    expect(screen.getByText('Numéro de téléphone invalide')).toBeOnTheScreen();

    await fireEvent.changeText(phone, '06 12 34 56 78');
    await press('Enregistrer');
    expect(await screen.findByText('C’est enregistré.')).toBeOnTheScreen();
    expect(db.data.users.find((u) => u.id === DEMO_CLIENT_ID)).toMatchObject({
      firstName: 'Aïcha',
      phone: '06 12 34 56 78',
    });
    expect(useSessionStore.getState().user?.firstName).toBe('Aïcha');
  });

  it('règle les notifications', async () => {
    const { db } = await open('/mon-compte/notifications');
    const sms = await screen.findByLabelText('Messages, SMS');
    const before = db.data.users.find((u) => u.id === DEMO_CLIENT_ID)!.notificationPrefs.messages
      .sms;
    await fireEvent(sms, 'valueChange', !before);
    await press('Enregistrer');
    expect(await screen.findByText('C’est enregistré.')).toBeOnTheScreen();
    expect(db.data.users.find((u) => u.id === DEMO_CLIENT_ID)!.notificationPrefs.messages.sms).toBe(
      !before,
    );
  });

  it('refuse de supprimer le compte avec une réservation à venir', async () => {
    await open('/mon-compte/informations');
    await fireEvent.press(await screen.findByRole('button', { name: 'Supprimer mon compte' }));
    await press('Oui, supprimer');
    expect(
      await screen.findByText(
        'Tu as encore des réservations à venir : annule-les avant de supprimer ton compte.',
      ),
    ).toBeOnTheScreen();
    expect(useSessionStore.getState().user).not.toBeNull();
  });

  it('supprime le compte après confirmation, et déconnecte', async () => {
    const { db } = await open('/mon-compte/informations', (db) => {
      db.data.bookings = db.data.bookings.filter((b) => b.clientId !== DEMO_CLIENT_ID);
    });
    await fireEvent.press(await screen.findByRole('button', { name: 'Supprimer mon compte' }));
    expect(screen.getByText('Supprimer ton compte ?')).toBeOnTheScreen();
    await press('Garder mon compte');
    expect(screen.queryByText('Supprimer ton compte ?')).toBeNull();

    await press('Supprimer mon compte');
    await press('Oui, supprimer');
    await waitFor(() => expect(useSessionStore.getState().user).toBeNull());
    expect(db.data.users.find((u) => u.id === DEMO_CLIENT_ID)!.status).toBe('deleted');
    expect(screen).toHavePathname('/');
  });
});
