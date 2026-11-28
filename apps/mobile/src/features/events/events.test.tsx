import { DEMO_CLIENT_ID, type MockDb } from '@afro/common/mocks';
import { act, fireEvent, waitFor } from '@testing-library/react-native';
import { Stack } from 'expo-router';
import { renderRouter, screen } from 'expo-router/testing-library';
import EventsTab from '../../../app/(tabs)/evenements';
import EventScreensLayout from '../../../app/evenements/_layout';
import EventDetailRoute from '../../../app/evenements/[eventId]/index';
import AddProviderRoute from '../../../app/evenements/[eventId]/ajouter';
import RequestQuotesRoute from '../../../app/evenements/[eventId]/devis';
import EditEventRoute from '../../../app/evenements/[eventId]/modifier';
import NewEventRoute from '../../../app/evenements/nouveau';
import ProviderProfileRoute from '../../../app/prestataires/[slug]/index';
import { isoDay, longDay } from '@/lib/dates';
import { useSessionStore } from '@/stores/session';
import { useToastStore } from '@/stores/toasts';
import { demoApi, testProviders } from '@/test/demoApi';
import { ClientTabsLayout } from '../navigation/ClientTabsLayout';
import { useTabBarStore } from '../navigation/tabBarStore';

const WEDDING = 'evt-mariage-aissatou';
const BIRTHDAY = 'evt-anniversaire-30-ans';

/** La pile racine, comme app/_layout.tsx (la fiche prestataire s'ouvre par-dessus les onglets). */
function RootStack() {
  return <Stack screenOptions={{ headerShown: false }} />;
}

const Empty = () => null;
const routes = {
  _layout: RootStack,
  '(tabs)/_layout': ClientTabsLayout,
  '(tabs)/index': Empty,
  '(tabs)/favoris': Empty,
  '(tabs)/messages': Empty,
  '(tabs)/compte': Empty,
  '(tabs)/evenements': EventsTab,
  // Les écrans d'un événement : par-dessus les onglets, sans la barre (app/evenements/).
  'evenements/_layout': EventScreensLayout,
  'evenements/nouveau': NewEventRoute,
  'evenements/[eventId]/index': EventDetailRoute,
  'evenements/[eventId]/modifier': EditEventRoute,
  'evenements/[eventId]/ajouter': AddProviderRoute,
  'evenements/[eventId]/devis': RequestQuotesRoute,
  'prestataires/[slug]/index': ProviderProfileRoute,
};

/** Ouvre l'app connectée (Aïssatou par défaut) sur une adresse, avec une base de démo neuve. */
async function open(initialUrl: string, userId = DEMO_CLIENT_ID, prepare?: (db: MockDb) => void) {
  const ctx = demoApi();
  prepare?.(ctx.db);
  const user = ctx.db.data.users.find((u) => u.id === userId)!;
  await act(() => useSessionStore.getState().signIn({ user, token: `demo:${user.id}` }));
  await renderRouter(routes, { initialUrl, wrapper: testProviders(ctx.api) });
  return ctx;
}

const press = (name: string | RegExp) => fireEvent.press(screen.getByRole('button', { name }));
const lastToast = () => useToastStore.getState().toasts[0];

/** Le 14 du mois prochain : toujours dans le futur. */
function nextMonth14() {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return isoDay(next.getFullYear(), next.getMonth(), 14);
}

afterEach(() => {
  useSessionStore.setState({ user: null, token: null });
  useToastStore.setState({ toasts: [] });
  useTabBarStore.setState({ collapsed: false });
  jest.useRealTimers(); // renderRouter laisse les faux minuteurs actifs
});

describe('Mes événements', () => {
  it('liste les événements du client, avec l’onglet Événements actif', async () => {
    await open('/evenements');
    expect(await screen.findByRole('header', { name: 'Mes événements' })).toBeOnTheScreen();
    expect(screen.getByRole('tab', { name: 'Événements' })).toBeSelected();
    expect(screen.getByTestId('glass-tab-bar')).toBeOnTheScreen();
    const wedding = screen.getByRole('link', { name: /^Mariage de Aïssatou, / });
    expect(wedding.props.accessibilityLabel).toMatch(/150 invités, 4 prestataires/);
    expect(screen.getByRole('link', { name: /^Anniversaire 30 ans, / })).toBeOnTheScreen();

    await fireEvent.press(wedding);
    expect(screen).toHavePathname(`/evenements/${WEDDING}`);
    expect(await screen.findByRole('header', { name: 'Mariage de Aïssatou' })).toBeOnTheScreen();
    // Consulter un événement : par-dessus les onglets, sans la barre ; « retour » revient à la liste.
    expect(screen.queryByTestId('glass-tab-bar')).toBeNull();
    await press('Retour');
    expect(screen).toHavePathname('/evenements');
    expect(screen.getByTestId('glass-tab-bar')).toBeOnTheScreen();
  });

  it('sans événement : l’état vide illustré, puis « Créer mon événement »', async () => {
    await open('/evenements', DEMO_CLIENT_ID, (db) => {
      db.update((data) => {
        data.events = data.events.filter((e) => e.clientId !== DEMO_CLIENT_ID);
      });
    });
    expect(await screen.findByText('Aucun événement pour le moment')).toBeOnTheScreen();
    await press('Créer mon événement');
    expect(screen).toHavePathname('/evenements/nouveau');
    // Créer un événement : sans la barre d'onglets.
    expect(await screen.findByRole('progressbar', { name: /Étape 1 sur 3/ })).toBeOnTheScreen();
    expect(screen.queryByTestId('glass-tab-bar')).toBeNull();
  });

  it('sans compte : demande de se connecter', async () => {
    await renderRouter(routes, {
      initialUrl: '/evenements',
      wrapper: testProviders(demoApi().api),
    });
    expect(screen.getByText('Connecte-toi pour planifier tes événements.')).toBeOnTheScreen();
  });
});

describe('Créer un événement', () => {
  it('valide chaque étape, garde les valeurs, puis crée l’événement', async () => {
    const { db } = await open('/evenements/nouveau');
    const date = nextMonth14();
    expect(
      await screen.findByRole('progressbar', { name: 'Étape 1 sur 3 : Type' }),
    ).toBeOnTheScreen();

    // Étape 1 : un type est obligatoire.
    await press('Suivant');
    expect(screen.getByText('Choisis un type d’événement')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('radio', { name: 'Mariage' }));
    await press('Suivant');

    // Étape 2 : un message sous chaque champ incomplet.
    expect(screen.getByRole('progressbar', { name: /Étape 2 sur 3/ })).toBeOnTheScreen();
    await press('Suivant');
    expect(
      screen.getByText('Donne un nom à ton événement (3 caractères minimum)'),
    ).toBeOnTheScreen();
    expect(screen.getByText('Choisis la date de l’événement')).toBeOnTheScreen();
    expect(screen.getByText('Entre 1 et 5 000 invités')).toBeOnTheScreen();

    await fireEvent.changeText(screen.getByLabelText('Nom de l’événement'), 'Mariage de Awa');
    await press(/^Date, /);
    await press('Mois suivant');
    await press(longDay(date, 'fr-FR'));
    await press('Valider la date');
    await fireEvent.changeText(screen.getByLabelText('Ville'), 'Lyon');
    await fireEvent.changeText(screen.getByLabelText('Code postal'), '69001');
    await fireEvent.changeText(screen.getByLabelText('Nombre d’invités'), '120');
    await press('Suivant');

    // Étape 3, puis « Précédent » : rien n'est perdu.
    expect(screen.getByRole('progressbar', { name: /Étape 3 sur 3/ })).toBeOnTheScreen();
    await press('Précédent');
    expect(screen.getByLabelText('Nom de l’événement')).toHaveProp('value', 'Mariage de Awa');
    await press('Suivant');
    await press('10 000 – 20 000 €');
    await fireEvent.changeText(screen.getByLabelText('Description (facultative)'), 'Afro-chic');
    await press('Créer l’événement');

    const created = await (async () => {
      await screen.findByRole('header', { name: 'Mariage de Awa' });
      return db.data.events.find((e) => e.name === 'Mariage de Awa')!;
    })();
    expect(created).toMatchObject({
      type: 'wedding',
      date,
      city: 'Lyon',
      postalCode: '69001',
      guestCount: 120,
      budget: '10000_20000',
      description: 'Afro-chic',
      clientId: DEMO_CLIENT_ID,
    });
    expect(screen).toHavePathname(`/evenements/${created.id}`);
    expect(lastToast()?.title).toBe('Événement créé');
  });
});

describe('Détail d’un événement', () => {
  it('montre les infos, les prestataires par famille et « Complète ton événement »', async () => {
    await open(`/evenements/${WEDDING}`);
    expect(await screen.findByRole('header', { name: 'Mariage de Aïssatou' })).toBeOnTheScreen();
    expect(screen.getByText('Paris (75011)')).toBeOnTheScreen();
    expect(screen.getByText('150 invités')).toBeOnTheScreen();
    expect(
      screen.getByRole('header', { name: 'Prestataires de l’événement (4)' }),
    ).toBeOnTheScreen();
    expect(screen.getByText('Saveurs de Dakar')).toBeOnTheScreen();
    // Une demande a été envoyée à Saveurs de Dakar : son statut n'est plus « Ajouté ».
    expect(screen.getAllByText(/Devis demandé|Devis reçu/).length).toBeGreaterThan(0);
    // La section attend les catégories (familles conseillées).
    expect(await screen.findByRole('header', { name: 'Complète ton événement' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Demander les devis' })).toBeEnabled();
  });

  it('retire un prestataire après confirmation', async () => {
    const { db } = await open(`/evenements/${BIRTHDAY}`);
    const before = db.data.eventProviders.filter((l) => l.eventId === BIRTHDAY).length;
    await fireEvent.press(await screen.findByRole('button', { name: /^Retirer DJ Makossa/ }));
    expect(screen.getByText('Retirer le prestataire ?')).toBeOnTheScreen();
    await press('Retirer');

    expect(
      await screen.findByRole('header', { name: 'Prestataires de l’événement (2)' }),
    ).toBeOnTheScreen();
    expect(db.data.eventProviders.filter((l) => l.eventId === BIRTHDAY)).toHaveLength(before - 1);
    expect(lastToast()?.title).toBe('Prestataire retiré');
  });

  it('supprime l’événement, revient à la liste, et « Annuler » le restaure', async () => {
    const { db } = await open('/evenements');
    await fireEvent.press(await screen.findByRole('link', { name: /^Anniversaire 30 ans, / }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Supprimer l’événement' }));
    expect(screen.getByText('Supprimer l’événement ?')).toBeOnTheScreen();
    expect(screen.getByText(/Cette action est définitive/)).toBeOnTheScreen();
    await press('Supprimer');

    expect(await screen.findByRole('header', { name: 'Mes événements' })).toBeOnTheScreen();
    expect(screen).toHavePathname('/evenements');
    expect(screen.getByTestId('glass-tab-bar')).toBeOnTheScreen();
    expect(db.data.events.find((e) => e.id === BIRTHDAY)?.deletedAt).toBeDefined();
    const toast = lastToast()!;
    expect(toast.title).toBe('Événement supprimé');

    await act(async () => toast.action!.onPress());
    await waitFor(() =>
      expect(db.data.events.find((e) => e.id === BIRTHDAY)?.deletedAt).toBeUndefined(),
    );
    await waitFor(() => expect(lastToast()?.title).toBe('Événement restauré'));
  });

  it('affiche « Événement introuvable » pour une adresse inconnue', async () => {
    await open('/evenements/evt-inconnu');
    expect(await screen.findByText('Événement introuvable')).toBeOnTheScreen();
  });
});

describe('Modifier un événement', () => {
  it('reprend le formulaire prérempli et enregistre', async () => {
    const { db } = await open(`/evenements/${BIRTHDAY}/modifier`);
    expect(await screen.findByRole('header', { name: 'Modifier l’événement' })).toBeOnTheScreen();
    expect(screen.getByRole('radio', { name: 'Anniversaire', checked: true })).toBeOnTheScreen();
    await press('Suivant');
    expect(screen.getByLabelText('Nom de l’événement')).toHaveProp('value', 'Anniversaire 30 ans');
    await fireEvent.changeText(screen.getByLabelText('Nom de l’événement'), 'Mes 30 ans');
    await press('Suivant');
    await press('Enregistrer les modifications');

    await waitFor(() =>
      expect(db.data.events.find((e) => e.id === BIRTHDAY)?.name).toBe('Mes 30 ans'),
    );
    expect(lastToast()?.title).toBe('Modifications enregistrées');
  });
});

describe('Ajouter un prestataire', () => {
  it('« Ajouter » pour un nouveau prestataire, « Ajouté » pour ceux déjà dans l’événement', async () => {
    const { db } = await open(`/evenements/${BIRTHDAY}/ajouter`);
    expect(await screen.findByRole('header', { name: 'Ajouter un prestataire' })).toBeOnTheScreen();
    expect(
      await screen.findByRole('button', { name: 'Douceurs Créoles, déjà ajouté' }),
    ).toBeDisabled();

    const linked = new Set(
      db.data.eventProviders.filter((l) => l.eventId === BIRTHDAY).map((l) => l.providerId),
    );
    const candidate = db.data.providers.find(
      (p) => p.status === 'published' && !linked.has(p.id) && p.displayName === 'Saveurs de Dakar',
    )!;
    await press(`Ajouter ${candidate.displayName}`);
    expect(
      await screen.findByRole('button', { name: `${candidate.displayName}, déjà ajouté` }),
    ).toBeOnTheScreen();
    expect(
      db.data.eventProviders.some((l) => l.eventId === BIRTHDAY && l.providerId === candidate.id),
    ).toBe(true);
    expect(lastToast()?.title).toBe('Prestataire ajouté');
  });

  it('filtre par catégorie depuis « Complète ton événement »', async () => {
    await open(`/evenements/${BIRTHDAY}/ajouter?categorie=traiteur-boissons`);
    expect(
      await screen.findByRole('button', { name: 'Traiteur & boissons', selected: true }),
    ).toBeOnTheScreen();
  });
});

describe('Demander les devis', () => {
  it('envoie une vraie demande de devis par prestataire coché', async () => {
    const { db } = await open(`/evenements/${BIRTHDAY}`);
    const requestsBefore = db.data.quoteRequests.length;
    await fireEvent.press(await screen.findByRole('button', { name: 'Demander les devis' }));
    expect(screen).toHavePathname(`/evenements/${BIRTHDAY}/devis`);
    expect(await screen.findByText('3 prestataires sélectionnés')).toBeOnTheScreen();
    // Décocher un prestataire.
    await fireEvent.press(screen.getByRole('checkbox', { name: /^Douceurs créoles/i }));
    expect(screen.getByText('2 prestataires sélectionnés')).toBeOnTheScreen();
    await press('Tout sélectionner');
    expect(screen.getByText('3 prestataires sélectionnés')).toBeOnTheScreen();
    await press('Tout désélectionner');
    expect(screen.getByRole('button', { name: 'Envoyer les demandes de devis' })).toBeDisabled();
    await press('Tout sélectionner');

    await press('Envoyer les demandes de devis');
    await screen.findByRole('header', { name: 'Anniversaire 30 ans' });
    const links = db.data.eventProviders.filter((l) => l.eventId === BIRTHDAY);
    const sent = links.filter((l) => l.quoteRequestId).length;
    expect(db.data.quoteRequests.length - requestsBefore).toBe(sent);
    expect(sent).toBeGreaterThan(0);
    expect(lastToast()?.title).toMatch(/Demandes? de devis envoyées?|Aucune demande envoyée/);
  });
});

describe('Ajouter à un événement (fiche prestataire)', () => {
  it('ajoute le prestataire à un événement depuis le panneau', async () => {
    const { db } = await open('/prestataires/saveurs-de-dakar');
    const provider = db.data.providers.find((p) => p.slug === 'saveurs-de-dakar')!;
    await fireEvent.press(await screen.findByRole('button', { name: 'Ajouter à un événement' }));
    // Saveurs de Dakar est déjà dans le mariage, pas dans l'anniversaire.
    expect(
      await screen.findByRole('button', { name: 'Déjà dans Mariage de Aïssatou' }),
    ).toBeDisabled();
    await press('Ajouter à Anniversaire 30 ans');
    expect(
      await screen.findByRole('button', { name: 'Déjà dans Anniversaire 30 ans' }),
    ).toBeOnTheScreen();
    expect(
      db.data.eventProviders.some((l) => l.eventId === BIRTHDAY && l.providerId === provider.id),
    ).toBe(true);
  });

  it('« Nouvel événement » ouvre le formulaire avec le prestataire', async () => {
    const { db } = await open('/prestataires/saveurs-de-dakar');
    const provider = db.data.providers.find((p) => p.slug === 'saveurs-de-dakar')!;
    await fireEvent.press(await screen.findByRole('button', { name: 'Ajouter à un événement' }));
    await press('Nouvel événement');
    expect(screen).toHavePathname('/evenements/nouveau');
    expect(screen).toHaveSearchParams({
      prestataire: provider.id,
      retour: '/prestataires/saveurs-de-dakar',
    });
  });

  it('le panneau : sous-titre, et pour chaque événement type, date, ville, invités, prestataires', async () => {
    const { db } = await open('/prestataires/saveurs-de-dakar');
    await fireEvent.press(await screen.findByRole('button', { name: 'Ajouter à un événement' }));
    expect(
      screen.getByText('Choisis l’événement auquel tu veux associer ce prestataire.'),
    ).toBeOnTheScreen();
    const birthday = db.data.events.find((e) => e.id === BIRTHDAY)!;
    const card = await screen.findByRole('button', { name: 'Ajouter à Anniversaire 30 ans' });
    expect(card.props.accessibilityHint).toMatch(
      new RegExp(
        `^Anniversaire, .+, ${birthday.city}, ${birthday.guestCount} invités, \\d+ prestataires?$`,
      ),
    );
    expect(screen.getByRole('button', { name: 'Nouvel événement' })).toBeOnTheScreen();
  });

  it('toucher une carte ajoute le prestataire, puis le confirme dans le panneau', async () => {
    await open('/prestataires/saveurs-de-dakar');
    await fireEvent.press(await screen.findByRole('button', { name: 'Ajouter à un événement' }));
    await fireEvent.press(
      await screen.findByRole('button', { name: 'Ajouter à Anniversaire 30 ans' }),
    );
    expect(
      await screen.findByText('Saveurs de Dakar est ajouté à « Anniversaire 30 ans ».'),
    ).toBeOnTheScreen();
    expect(screen.getByRole('alert')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Déjà dans Anniversaire 30 ans' })).toBeDisabled();
  });

  it('si l’ajout échoue : le panneau reste ouvert et affiche la raison', async () => {
    const { db } = await open('/prestataires/saveurs-de-dakar');
    await fireEvent.press(await screen.findByRole('button', { name: 'Ajouter à un événement' }));
    const card = await screen.findByRole('button', { name: 'Ajouter à Anniversaire 30 ans' });
    // L'événement disparaît entre-temps (supprimé depuis un autre appareil) : l'API refuse l'ajout.
    db.update((data) => {
      data.events = data.events.filter((e) => e.id !== BIRTHDAY);
    });
    await fireEvent.press(card);
    expect(await screen.findByText('Ajout impossible')).toBeOnTheScreen();
    expect(screen.getByRole('alert')).toBeOnTheScreen();
    const provider = db.data.providers.find((p) => p.slug === 'saveurs-de-dakar')!;
    expect(
      db.data.eventProviders.some((l) => l.eventId === BIRTHDAY && l.providerId === provider.id),
    ).toBe(false);
  });

  it('si les événements ne se chargent pas : « Réessayer »', async () => {
    const ctx = await open('/prestataires/saveurs-de-dakar');
    const listEvents = jest.spyOn(ctx.api, 'listEvents').mockRejectedValueOnce(new Error('réseau'));
    await fireEvent.press(await screen.findByRole('button', { name: 'Ajouter à un événement' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Réessayer' }));
    expect(
      await screen.findByRole('button', { name: 'Ajouter à Anniversaire 30 ans' }),
    ).toBeOnTheScreen();
    expect(listEvents).toHaveBeenCalledTimes(2);
  });

  it('sans événement : l’état vide, puis « Créer mon événement » ouvre le formulaire', async () => {
    const { db } = await open('/prestataires/saveurs-de-dakar', DEMO_CLIENT_ID, (mock) => {
      mock.update((data) => {
        data.events = data.events.filter((e) => e.clientId !== DEMO_CLIENT_ID);
      });
    });
    const provider = db.data.providers.find((p) => p.slug === 'saveurs-de-dakar')!;
    await fireEvent.press(await screen.findByRole('button', { name: 'Ajouter à un événement' }));
    expect(await screen.findByText('Tu n’as pas encore d’événement')).toBeOnTheScreen();
    expect(
      screen.getByText('Crée ton premier événement pour y ajouter ce prestataire.'),
    ).toBeOnTheScreen();
    // Pas de doublon : le pied « Nouvel événement » disparaît quand il n'y a aucun événement.
    expect(screen.queryByRole('button', { name: 'Nouvel événement' })).toBeNull();
    await press('Créer mon événement');
    expect(screen).toHavePathname('/evenements/nouveau');
    expect(screen).toHaveSearchParams({
      prestataire: provider.id,
      retour: '/prestataires/saveurs-de-dakar',
    });
  });

  it('la croix ferme le panneau sans rien ajouter', async () => {
    const { db } = await open('/prestataires/saveurs-de-dakar');
    const before = db.data.eventProviders.length;
    await fireEvent.press(await screen.findByRole('button', { name: 'Ajouter à un événement' }));
    await screen.findByRole('button', { name: 'Ajouter à Anniversaire 30 ans' });
    await press('Fermer');
    expect(screen.queryByRole('button', { name: 'Ajouter à Anniversaire 30 ans' })).toBeNull();
    expect(db.data.eventProviders.length).toBe(before);
  });

  it('créer un événement depuis le panneau : retour sur la fiche, panneau rouvert, prestataire ajouté', async () => {
    const { db } = await open('/prestataires/saveurs-de-dakar');
    const provider = db.data.providers.find((p) => p.slug === 'saveurs-de-dakar')!;
    const date = nextMonth14();
    await fireEvent.press(await screen.findByRole('button', { name: 'Ajouter à un événement' }));
    await press('Nouvel événement');
    await fireEvent.press(await screen.findByRole('radio', { name: 'Soirée' }));
    await press('Suivant');
    await fireEvent.changeText(screen.getByLabelText('Nom de l’événement'), 'Soirée de gala');
    await press(/^Date, /);
    await press('Mois suivant');
    await press(longDay(date, 'fr-FR'));
    await press('Valider la date');
    await fireEvent.changeText(screen.getByLabelText('Ville'), 'Paris');
    await fireEvent.changeText(screen.getByLabelText('Code postal'), '75011');
    await fireEvent.changeText(screen.getByLabelText('Nombre d’invités'), '80');
    await press('Suivant');
    await press('Créer l’événement');

    expect(
      await screen.findByText('« Soirée de gala » est créé, et Saveurs de Dakar y est ajouté.'),
    ).toBeOnTheScreen();
    expect(screen).toHavePathname('/prestataires/saveurs-de-dakar');
    expect(screen.getByRole('button', { name: 'Déjà dans Soirée de gala' })).toBeDisabled();
    const created = db.data.events.find((e) => e.name === 'Soirée de gala')!;
    expect(
      db.data.eventProviders.some((l) => l.eventId === created.id && l.providerId === provider.id),
    ).toBe(true);
  });
});
