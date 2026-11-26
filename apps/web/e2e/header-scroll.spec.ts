import { expect, test, type Page } from '@playwright/test';

/** Haut de la navbar par rapport à l'écran : 0 si visible, négatif si elle a glissé hors de l'écran. */
const headerTop = (page: Page) =>
  page.getByRole('banner').evaluate((header) => header.getBoundingClientRect().top);

async function scrollToY(page: Page, y: number) {
  await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), y);
}

test.describe('navbar animée au défilement', () => {
  test('se compacte, se cache en descendant et revient en remontant', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const header = page.getByRole('banner');
    await expect(header).toHaveAttribute('data-scrolled', 'false');
    const tallHeight = (await header.boundingBox())!.height;

    await scrollToY(page, 200);
    await expect(header).toHaveAttribute('data-scrolled', 'true');
    // Plus basse une fois compactée (la hauteur s'anime en 300 ms).
    await expect.poll(async () => (await header.boundingBox())!.height).toBeLessThan(tallHeight);
    await expect(page.getByTestId('scroll-progress')).toHaveCSS('opacity', '1');

    await scrollToY(page, 600);
    await scrollToY(page, 1400);
    await expect(header).toHaveAttribute('data-hidden', 'true');
    await expect.poll(() => headerTop(page)).toBeLessThan(-40);

    await scrollToY(page, 1200);
    await expect(header).toHaveAttribute('data-hidden', 'false');
    await expect.poll(() => headerTop(page)).toBe(0);
  });

  test('reste visible si le clavier est dedans', async ({ page, isMobile }) => {
    test.skip(isMobile, 'les liens de la barre sont dans le menu latéral sur téléphone');
    await page.goto('/recherche');
    // On attend que les résultats aient allongé la page.
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollHeight))
      .toBeGreaterThan(2500);
    await scrollToY(page, 600);
    await scrollToY(page, 1400);
    const header = page.getByRole('banner');
    await expect(header).toHaveAttribute('data-hidden', 'true');

    await page.getByRole('banner').getByRole('link', { name: 'Accueil', exact: true }).focus();
    await expect.poll(() => headerTop(page)).toBe(0);
  });

  test('« réduire les animations » : la navbar ne se cache jamais', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await scrollToY(page, 600);
    await scrollToY(page, 1400);
    const header = page.getByRole('banner');
    await expect(header).toHaveAttribute('data-scrolled', 'true');
    await expect(header).toHaveAttribute('data-hidden', 'false');
    expect(await headerTop(page)).toBe(0);
  });
});
