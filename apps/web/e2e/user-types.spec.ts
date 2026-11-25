import { expect, test } from '@playwright/test';

test.describe('section « Deux façons d’utiliser Wenzee »', () => {
  test('deux cartes, sans photo, boutons alignés sur grand écran', async ({ page, isMobile }) => {
    await page.goto('/');
    const section = page.locator('section[aria-labelledby="user-types-title"]');
    await section.scrollIntoViewIfNeeded();
    await expect(section.getByRole('article')).toHaveCount(2);
    await expect(section.locator('img')).toHaveCount(0);

    const provider = (await section
      .getByRole('link', { name: 'Référencer mon activité' })
      .boundingBox())!;
    const client = (await section
      .getByRole('link', { name: 'Organiser mon événement' })
      .boundingBox())!;
    if (isMobile) {
      expect(client.y).toBeGreaterThan(provider.y + provider.height); // cartes empilées
    } else {
      expect(Math.abs(client.y - provider.y)).toBeLessThan(1); // même hauteur
    }

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBe(0);
  });

  test('« Organiser mon événement » mène à la recherche', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Organiser mon événement' }).click();
    await expect(page).toHaveURL('/recherche');
  });

  test('« Déjà inscrit ? Se connecter » (prestataire) revient vers l’espace pro', async ({
    page,
  }) => {
    await page.goto('/');
    await page
      .getByRole('article', { name: 'Développez votre activité.' })
      .getByRole('link', { name: 'Déjà inscrit ? Se connecter' })
      .click();
    await expect(page).toHaveURL('/connexion?retour=%2Fpro');
  });
});
