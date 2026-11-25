import { DEMO_PROVIDER_ID, type MockDb } from '@afro/common/mocks';
import { act, fireEvent, waitFor } from '@testing-library/react-native';
import { renderRouter, screen } from 'expo-router/testing-library';
import ProLayout from '../../../../app/pro/_layout';
import ProOfferingRoute from '../../../../app/pro/formules/[id]';
import ProOfferingsRoute from '../../../../app/pro/formules/index';
import ProEditSectionRoute from '../../../../app/pro/modifier/[section]';
import ProProfileTab from '../../../../app/pro/(tabs)/profil';
import { useSessionStore } from '@/stores/session';
import { demoApi, testProviders } from '@/test/demoApi';
import { useTabBarStore } from '../../navigation/tabBarStore';
import { ProTabsLayout } from '../ProTabsLayout';

const Empty = () => null;
const routes = {
  'pro/_layout': ProLayout,
  'pro/(tabs)/_layout': ProTabsLayout,
  'pro/(tabs)/index': Empty,
  'pro/(tabs)/demandes': Empty,
  'pro/(tabs)/messages': Empty,
  'pro/(tabs)/agenda': Empty,
  'pro/(tabs)/profil': ProProfileTab,
  'pro/modifier/[section]': ProEditSectionRoute,
  'pro/formules/index': ProOfferingsRoute,
  'pro/formules/[id]': ProOfferingRoute,
};

/** Ouvre « Mon profil », puis la section `name` : on teste le vrai parcours, aller et retour. */
async function openSection(name: string | RegExp) {
  const ctx = demoApi();
  const user = ctx.db.data.users.find((u) => u.id === DEMO_PROVIDER_ID)!;
  await act(() => useSessionStore.getState().signIn({ user, token: `demo:${user.id}` }));
  await renderRouter(routes, { initialUrl: '/pro/profil', wrapper: testProviders(ctx.api) });
  await fireEvent.press(await screen.findByRole('button', { name }));
  return ctx;
}

const providerOf = (db: MockDb) => db.data.providers.find((p) => p.userId === DEMO_PROVIDER_ID)!;
const offeringsOf = (db: MockDb) =>
  db.data.offerings.filter((o) => o.providerId === providerOf(db).id);
const press = (name: string | RegExp) => fireEvent.press(screen.getByRole('button', { name }));
const save = () => press('Enregistrer');

afterEach(() => {
  useTabBarStore.setState({ collapsed: false });
  useSessionStore.setState({ user: null, token: null });
});

describe('Modifier son profil dans l’app (lot M15c)', () => {
  it('présentation : nom commercial exigé, puis enregistré avec la bio et les langues', async () => {
    const { db } = await openSection('Présentation et catégorie');
    expect(screen).toHavePathname('/pro/modifier/presentation');
    const name = await screen.findByLabelText('Nom commercial');
    expect(name).toHaveDisplayValue(providerOf(db).displayName);

    await fireEvent.changeText(name, 'A');
    await save();
    expect(screen.getByText('Le nom commercial est trop court')).toBeOnTheScreen();
    expect(providerOf(db).displayName).not.toBe('A');

    await fireEvent.changeText(name, 'Saveurs de Dakar Traiteur');
    await fireEvent.changeText(screen.getByLabelText('Présente-toi'), 'Cuisine sénégalaise.');
    const hadWolof = providerOf(db).languages.includes('wolof');
    await press('Wolof');
    await save();

    expect(await screen.findByText('Saveurs de Dakar Traiteur')).toBeOnTheScreen();
    expect(screen).toHavePathname('/pro/profil');
    const provider = providerOf(db);
    expect(provider.displayName).toBe('Saveurs de Dakar Traiteur');
    expect(provider.bio).toBe('Cuisine sénégalaise.');
    expect(provider.languages.includes('wolof')).toBe(!hadWolof);
  });

  it('zone et capacité : code postal à 5 chiffres, puis rayon et max par jour', async () => {
    const { db } = await openSection('Zone et capacité');
    await fireEvent.changeText(await screen.findByLabelText('Code postal'), '931');
    await save();
    expect(screen.getByText('Code postal à 5 chiffres')).toBeOnTheScreen();

    await fireEvent.changeText(screen.getByLabelText('Code postal'), '93100');
    await fireEvent.changeText(screen.getByLabelText('Ville'), 'Montreuil');
    await fireEvent.changeText(screen.getByLabelText('Jusqu’où te déplaces-tu ? (en km)'), '45');
    await fireEvent.changeText(
      screen.getByLabelText('Combien d’événements peux-tu assurer le même jour ?'),
      '4',
    );
    await save();
    expect(await screen.findByText('Mon profil')).toBeOnTheScreen();
    expect(providerOf(db)).toMatchObject({
      city: 'Montreuil',
      postalCode: '93100',
      travelRadiusKm: 45,
      maxBookingsPerDay: 4,
    });
  });

  it('annulation : choisit une autre politique', async () => {
    const { db } = await openSection('Annulation');
    const strict = await screen.findByRole('radio', { name: /^Annulation stricte, / });
    await fireEvent.press(strict);
    expect(strict).toBeChecked();
    await save();
    expect(await screen.findByText('Mon profil')).toBeOnTheScreen();
    expect(providerOf(db).cancellationPolicy).toBe('strict');
  });

  it('infos légales : SIRET à 14 chiffres (espaces tolérés) et statut', async () => {
    const { db } = await openSection('Informations légales (SIRET)');
    const siret = await screen.findByLabelText('SIRET (facultatif)');
    await fireEvent.changeText(siret, '123');
    await save();
    expect(screen.getByText('Le SIRET contient 14 chiffres')).toBeOnTheScreen();

    await fireEvent.changeText(siret, '123 456 789 00012');
    await fireEvent.press(screen.getByRole('radio', { name: 'Association' }));
    await save();
    expect(await screen.findByText('Mon profil')).toBeOnTheScreen();
    expect(providerOf(db)).toMatchObject({ siret: '12345678900012', legalType: 'association' });
  });
});

describe('Formules et prix (lot M15c)', () => {
  it('ajoute une formule : prix exigé, saisi en euros, enregistré en centimes', async () => {
    const { db } = await openSection(/^Formules et prix, \d+$/);
    const before = offeringsOf(db).length;
    await fireEvent.press(await screen.findByRole('button', { name: 'Ajouter une formule' }));
    expect(screen).toHavePathname('/pro/formules/nouvelle');

    await fireEvent.changeText(
      await screen.findByLabelText('Titre de la formule'),
      'Buffet anniversaire',
    );
    await press('Enregistrer la formule');
    expect(screen.getByText('Indique un prix (ou choisis « sur devis »)')).toBeOnTheScreen();

    await fireEvent.changeText(screen.getByLabelText('Prix (€)'), '28,50');
    await fireEvent.changeText(screen.getByLabelText('Invités minimum'), '20');
    await press('Enregistrer la formule');

    expect(await screen.findByText('Buffet anniversaire')).toBeOnTheScreen();
    expect(screen).toHavePathname('/pro/formules');
    expect(offeringsOf(db)).toHaveLength(before + 1);
    expect(offeringsOf(db).find((o) => o.title === 'Buffet anniversaire')).toMatchObject({
      price: 2850,
      pricingType: 'per_person',
      minGuests: 20,
      isActive: true,
    });
  });

  it('modifie une formule, en « sur devis » (sans prix)', async () => {
    const { db } = await openSection(/^Formules et prix, \d+$/);
    const first = offeringsOf(db)[0]!;
    await fireEvent.press(await screen.findByRole('button', { name: `Modifier ${first.title}` }));
    const title = await screen.findByLabelText('Titre de la formule');
    expect(title).toHaveDisplayValue(first.title);

    await fireEvent.changeText(title, 'Formule revue');
    await press('Sur devis');
    expect(screen.queryByLabelText('Prix (€)')).toBeNull();
    await press('Enregistrer la formule');

    expect(await screen.findByText('Formule revue')).toBeOnTheScreen();
    const updated = offeringsOf(db).find((o) => o.id === first.id)!;
    expect(updated).toMatchObject({ title: 'Formule revue', pricingType: 'on_quote' });
    expect(updated.price).toBeUndefined();
  });

  it('supprime une formule, après confirmation', async () => {
    const { db } = await openSection(/^Formules et prix, \d+$/);
    const first = offeringsOf(db)[0]!;
    await fireEvent.press(await screen.findByRole('button', { name: `Supprimer ${first.title}` }));
    expect(screen.getByText(`Supprimer « ${first.title} » ?`)).toBeOnTheScreen();

    await press('Annuler');
    expect(offeringsOf(db).some((o) => o.id === first.id)).toBe(true);

    await press(`Supprimer ${first.title}`);
    await press('Oui, supprimer');
    await waitFor(() => expect(screen.queryByText(first.title)).toBeNull());
    expect(offeringsOf(db).some((o) => o.id === first.id)).toBe(false);
  });
});
