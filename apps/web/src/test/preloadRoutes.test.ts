import type { RouteObject } from 'react-router';
import { describe, expect, it } from 'vitest';
import { routes } from '@/app/routes';
import { preloadLazyRoutes } from './preloadRoutes';

describe('preloadLazyRoutes (outil de test)', () => {
  it('remplace « lazy » par ce qu’il renvoie, y compris dans les routes enfants', async () => {
    const Page = () => null;
    const Child = () => null;
    const tree: RouteObject[] = [
      {
        path: '/',
        lazy: async () => ({ Component: Page }),
        children: [{ path: 'enfant', lazy: async () => ({ Component: Child }) }],
      },
      { path: 'sans-lazy', Component: Page },
    ];

    await preloadLazyRoutes(tree);

    expect(tree[0]).toMatchObject({ path: '/', Component: Page });
    expect(tree[0]).not.toHaveProperty('lazy');
    expect(tree[0]!.children![0]).toMatchObject({ path: 'enfant', Component: Child });
    expect(tree[0]!.children![0]).not.toHaveProperty('lazy');
    expect(tree[1]).toEqual({ path: 'sans-lazy', Component: Page });
  });

  it('a déjà chargé toutes les pages de l’application avant les tests (setup.ts)', () => {
    const stillLazy: string[] = [];
    const visit = (list: RouteObject[]) =>
      list.forEach((route) => {
        if (route.lazy) stillLazy.push(route.path ?? '(index)');
        if (route.children) visit(route.children);
      });
    visit(routes);

    expect(stillLazy).toEqual([]);
  });
});
