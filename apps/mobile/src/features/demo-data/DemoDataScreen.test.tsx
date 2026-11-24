import { ApiError, createHttpApiClient, type ApiClient } from '@afro/common';
import { createHandlers, createMockDb } from '@afro/common/mocks';
import { QueryClient } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { createMockFetch } from '@/lib/api/mockFetch';
import { mainCategories } from '@/lib/categories';
import { AppProviders } from '@/providers/AppProviders';
import { DemoDataScreen } from './DemoDataScreen';

// L'écran utilise useRouter (bouton Retour) : on n'a pas besoin de vraie navigation ici.
jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useRouter: () => ({ back: jest.fn() }),
}));

/** Un client API branché sur une base de démo neuve (comme dans l'app). */
function demoApi() {
  const db = createMockDb({ now: () => new Date('2026-11-23T10:00:00Z') });
  return { db, api: createHttpApiClient({ fetchFn: createMockFetch(createHandlers(db)) }) };
}

function renderScreen(api: ApiClient) {
  // Pas de nouvel essai automatique : on veut voir l'erreur tout de suite.
  const queryClient = new QueryClient({
    // gcTime infini : pas de minuteur de nettoyage qui garderait Jest ouvert après les tests.
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  return render(
    <AppProviders apiClient={api} queryClient={queryClient}>
      <DemoDataScreen />
    </AppProviders>,
  );
}

describe('Écran « Données de démo » (lot M3)', () => {
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
