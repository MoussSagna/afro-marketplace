import { expect, test } from '@playwright/test';

test.describe('section « Explorez nos univers »', () => {
  test('la mosaïque est asymétrique : la carte DJ domine', async ({ page, isMobile }) => {
    await page.goto('/');
    const mosaic = page.getByRole('list', { name: 'Univers Wenzee' });
    await mosaic.scrollIntoViewIfNeeded();

    const dj = (await mosaic.getByRole('link', { name: 'Musique & DJ' }).boundingBox())!;
    const traiteur = (await mosaic.getByRole('link', { name: 'Traiteur' }).boundingBox())!;
    expect(dj.height).toBeGreaterThan(traiteur.height * 1.5);
    if (isMobile) expect(dj.width).toBeGreaterThan(traiteur.width * 1.8); // toute la largeur

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBe(0);
  });

  test('une carte mène à la recherche de sa catégorie', async ({ page }) => {
    await page.goto('/');
    await page
      .getByRole('list', { name: 'Univers Wenzee' })
      .getByRole('link', { name: 'Mode' })
      .click();
    await expect(page).toHaveURL('/recherche?categorie=location-de-tenues');
  });

  test('les photos se chargent', async ({ page }) => {
    await page.goto('/');
    const mosaic = page.getByRole('list', { name: 'Univers Wenzee' });
    await mosaic.scrollIntoViewIfNeeded();
    await page.mouse.wheel(0, 2500);
    await expect
      .poll(() =>
        mosaic.evaluate((list) =>
          [...list.querySelectorAll('img')].every((img) => img.complete && img.naturalWidth > 0),
        ),
      )
      .toBe(true);
  });
});
