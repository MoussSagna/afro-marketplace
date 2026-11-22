import type { ProviderProfile } from '@afro/common';
import { mockDb } from '@afro/common/mocks';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderRoute } from '@/test/renderRoute';
import { useSessionStore } from '@/stores/session';

/** Donne à Aïssatou (cliente) un profil prestataire brouillon, directement dans la base mockée. */
function draftFor(overrides: Partial<ProviderProfile> = {}) {
  const user = mockDb.data.users.find((u) => u.id === 'user-aissatou')!;
  user.roles.push('provider');
  const at = mockDb.now().toISOString();
  const profile: ProviderProfile = {
    id: 'prov-aissatou',
    userId: user.id,
    displayName: 'Aïssatou Ndiaye',
    slug: 'aissatou-ndiaye',
    bio: '',
    legalType: 'individual',
    isProVerified: false,
    categoryIds: [],
    culturalOriginIds: [],
    languages: ['fr'],
    city: '',
    postalCode: '',
    travelRadiusKm: 30,
    maxBookingsPerDay: 1,
    cancellationPolicy: 'moderate',
    status: 'draft',
    onboardingStep: 1,
    ratingAverage: 0,
    ratingCount: 0,
    createdAt: at,
    updatedAt: at,
    ...overrides,
  };
  mockDb.data.providers.push(profile);
  mockDb.save();
  return profile;
}

const profile = () => mockDb.data.providers.find((p) => p.userId === 'user-aissatou')!;
const next = () => userEvent.click(screen.getByRole('button', { name: 'Continuer' }));

describe('Devenir prestataire (P6)', () => {
  it('crée le profil, donne le rôle prestataire et ouvre l’onboarding', async () => {
    renderRoute('/devenir-prestataire', { as: 'user-aissatou' });
    expect(await screen.findByText('Gratuit au lancement')).toBeInTheDocument();
    const [cta] = screen.getAllByRole('button', { name: 'Créer mon profil gratuitement' });
    await userEvent.click(cta!);

    expect(await screen.findByRole('heading', { name: 'Qui es-tu ?' })).toBeInTheDocument();
    expect(useSessionStore.getState().user?.roles).toContain('provider');
    expect(profile()).toMatchObject({ status: 'draft', onboardingStep: 1 });
  });

  it('un visiteur est invité à se connecter d’abord', async () => {
    renderRoute('/devenir-prestataire');
    const [cta] = await screen.findAllByRole('link', { name: 'Créer mon profil gratuitement' });
    expect(cta).toHaveAttribute('href', '/connexion?retour=%2Fdevenir-prestataire');
  });
});

describe('Onboarding en étapes (S1)', () => {
  it('valide chaque étape avant de passer à la suivante et enregistre la progression', async () => {
    draftFor();
    renderRoute('/pro/onboarding', { as: 'user-aissatou' });

    // Étape 1 : identité.
    const siret = await screen.findByLabelText('SIRET (facultatif)');
    await userEvent.type(siret, '123');
    await next();
    expect(await screen.findByText('Le SIRET contient 14 chiffres')).toBeInTheDocument();
    await userEvent.clear(siret);
    const name = screen.getByLabelText('Nom commercial');
    await userEvent.clear(name);
    await userEvent.type(name, 'Les Délices d’Aïssatou');
    await next();

    // Étape 2 : catégories.
    expect(await screen.findByRole('heading', { name: 'Ce que tu proposes' })).toBeInTheDocument();
    expect(profile()).toMatchObject({ onboardingStep: 2, slug: 'les-delices-daissatou' });
    await next();
    expect(await screen.findByText('Choisis au moins une catégorie')).toBeInTheDocument();
    const categories = screen.getByRole('group', { name: 'Catégories' });
    const [firstCategory] = within(categories).getAllByRole('checkbox');
    await userEvent.click(firstCategory!);
    await next();

    // Étape 3 : zone.
    expect(await screen.findByRole('heading', { name: 'Où interviens-tu ?' })).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Ville'), 'Montreuil');
    await userEvent.type(screen.getByLabelText('Code postal'), '931');
    await next();
    expect(await screen.findByText('Code postal à 5 chiffres')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Code postal'), '00');
    await next();

    expect(
      await screen.findByRole('heading', { name: 'Présentation et photos' }),
    ).toBeInTheDocument();
    expect(profile()).toMatchObject({ city: 'Montreuil', postalCode: '93100', onboardingStep: 4 });

    // Retour arrière : les valeurs enregistrées sont là.
    await userEvent.click(screen.getByRole('button', { name: 'Retour' }));
    expect(await screen.findByLabelText('Ville')).toHaveValue('Montreuil');
  });

  it('reprend là où on s’était arrêté', async () => {
    draftFor({ onboardingStep: 5 });
    renderRoute('/pro/onboarding', { as: 'user-aissatou' });
    expect(await screen.findByRole('heading', { name: 'Tes formules' })).toBeInTheDocument();
    expect(screen.getByText('Étape 5 sur 8')).toBeInTheDocument();
  });

  it('ajoute des photos et une formule', async () => {
    draftFor({ onboardingStep: 4, categoryIds: [mockDb.data.categories[0]!.id] });
    renderRoute('/pro/onboarding', { as: 'user-aissatou' });
    const sample = await screen.findByRole('button', { name: 'Ajouter une photo d’exemple' });
    await userEvent.click(sample);
    expect(await screen.findByRole('img', { name: 'Photo 1' })).toBeInTheDocument();
    expect(screen.getByText(/encore 2 pour atteindre le minimum de 3/)).toBeInTheDocument();
    await next();

    await screen.findByRole('heading', { name: 'Tes formules' });
    await userEvent.click(screen.getByRole('button', { name: 'Ajouter une formule' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.type(within(dialog).getByLabelText('Titre de la formule'), 'Buffet mariage');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Enregistrer la formule' }));
    expect(
      await within(dialog).findByText('Indique un prix (ou choisis « sur devis »)'),
    ).toBeInTheDocument();
    await userEvent.type(within(dialog).getByLabelText('Prix (€)'), '25');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Enregistrer la formule' }));

    expect(await screen.findByText('Buffet mariage')).toBeInTheDocument();
    expect(screen.getByText(/^.+ · 25\s€ par personne$/)).toBeInTheDocument();
    expect(profile().priceFrom).toBe(2500);
  });

  it('règle n° 2 : l’envoi en validation attend un profil complet', async () => {
    const categoryId = mockDb.data.categories[0]!.id;
    const draft = draftFor({ onboardingStep: 8, categoryIds: [categoryId], city: 'Montreuil' });
    renderRoute('/pro/onboarding', { as: 'user-aissatou' });
    const submit = await screen.findByRole('button', { name: 'Envoyer mon profil en validation' });
    expect(submit).toBeDisabled();
    expect(screen.getByText('Au moins 3 photos')).toBeInTheDocument();
    expect(screen.getAllByText(': à faire')).toHaveLength(2);

    // On complète directement dans la base, puis on revient sur la page.
    const at = mockDb.now().toISOString();
    for (const order of [0, 1, 2]) {
      mockDb.data.media.push({
        id: `media-test-${order}`,
        providerId: draft.id,
        type: 'image',
        url: `https://picsum.photos/seed/test-${order}/1200/800`,
        order,
        createdAt: at,
        updatedAt: at,
      });
    }
    mockDb.data.offerings.push({
      id: 'off-test',
      providerId: draft.id,
      categoryId,
      title: 'Buffet',
      description: '',
      pricingType: 'on_quote',
      isActive: true,
      createdAt: at,
      updatedAt: at,
    });
    mockDb.save();
    await userEvent.click(screen.getByRole('button', { name: 'Retour' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Continuer' }));

    const ready = await screen.findByRole('button', { name: 'Envoyer mon profil en validation' });
    await waitFor(() => expect(ready).toBeEnabled());
    await userEvent.click(ready);
    expect(await screen.findByText('Ton profil est envoyé !')).toBeInTheDocument();
    expect(profile().status).toBe('pending_review');
  });
});

describe('Modifier mon profil (S7)', () => {
  it('enregistre un onglet et met le profil en pause', async () => {
    renderRoute('/pro/profil', { as: 'user-saveurs-de-dakar' });
    expect(await screen.findByText('Publié')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: 'Où interviens-tu ?' }));
    const radius = await screen.findByLabelText('Jusqu’où te déplaces-tu ? (en km)');
    await userEvent.clear(radius);
    await userEvent.type(radius, '80');
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(await screen.findByText('Modifications enregistrées.')).toBeInTheDocument();
    const saveurs = () => mockDb.data.providers.find((p) => p.slug === 'saveurs-de-dakar')!;
    expect(saveurs().travelRadiusKm).toBe(80);

    await userEvent.click(screen.getByRole('button', { name: 'Mettre en pause' }));
    expect(await screen.findByText('En pause')).toBeInTheDocument();
    expect(saveurs().status).toBe('paused');
    expect(screen.getByRole('button', { name: 'Réactiver mon profil' })).toBeInTheDocument();
  });
});
