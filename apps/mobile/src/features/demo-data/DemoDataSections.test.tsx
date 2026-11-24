import { ApiError, type ApiClient } from '@afro/common';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { View } from 'react-native';
import { mainCategories } from '@/lib/categories';
import { demoApi, testProviders } from '@/test/demoApi';
import { DemoDataSections } from './DemoDataSections';

function renderScreen(api: ApiClient) {
  return render(
    <View>
      <DemoDataSections />
    </View>,
    { wrapper: testProviders(api) },
  );
}

describe('Données de démo : catégories et prestataires à la une (lot M3)', () => {
  it('affiche le chargement, puis les catégories et les prestataires à la une', async () => {
    const { db, api } = demoApi();
    await renderScreen(api);

    expect(screen.getByLabelText('Chargement des catégories')).toBeOnTheScreen();

    for (const category of mainCategories(db.data.categories)) {
      expect(await screen.findByText(category.name)).toBeOnTheScreen();
    }
    const featured = await api.listFeaturedProviders();
    expect(await screen.findByText(featured[0]!.displayName)).toBeOnTheScreen();
    expect(screen.queryByLabelText('Chargement des catégories')).not.toBeOnTheScreen();
  });

  it('affiche une erreur, puis réessaie avec succès', async () => {
    const { db, api } = demoApi();
    const listCategories = jest
      .fn<ReturnType<ApiClient['listCategories']>, []>()
      .mockRejectedValueOnce(new ApiError(500, 'Serveur indisponible'))
      .mockImplementation(() => api.listCategories());
    await renderScreen({ ...api, listCategories });

    expect(await screen.findByText('Oups, ça n’a pas chargé')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Réessayer' }));
    const first = mainCategories(db.data.categories)[0]!;
    expect(await screen.findByText(first.name)).toBeOnTheScreen();
    expect(listCategories).toHaveBeenCalledTimes(2);
  });
});

describe('mainCategories', () => {
  it('garde les catégories principales, triées par ordre', () => {
    const categories = [
      { id: 'b', name: 'B', slug: 'b', order: 2 },
      { id: 'b1', name: 'B1', slug: 'b1', order: 1, parentId: 'b' },
      { id: 'a', name: 'A', slug: 'a', order: 1 },
    ];
    expect(mainCategories(categories).map((c) => c.id)).toEqual(['a', 'b']);
  });
});
