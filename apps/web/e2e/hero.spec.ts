import { expect, test } from '@playwright/test';

test.describe("hero plein écran de l'accueil", () => {
  test('occupe tout l’écran, sans débordement horizontal', async ({ page }) => {
    await page.goto('/');
    const hero = page.locator('section[aria-labelledby="hero-title"]');
    await expect(hero).toBeVisible();

    const viewport = page.viewportSize()!;
    const box = (await hero.boundingBox())!;
    expect(box.y).toBe(0);
    expect(box.height).toBeGreaterThanOrEqual(viewport.height - 1);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBe(0);
  });

  test('la navbar est transparente puis floutée et collée en haut au défilement', async ({
    page,
  }) => {
    await page.goto('/');
    const header = page.getByRole('banner');
    await expect(header).toHaveAttribute('data-scrolled', 'false');
    expect(await header.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(
      'rgba(0, 0, 0, 0)',
    );

    // 250 px : assez pour passer en fond brun, pas assez pour que la barre se cache (voir header-scroll.spec.ts).
    await page.mouse.wheel(0, 250);
    await expect(header).toHaveAttribute('data-scrolled', 'true');
    await expect(header).toHaveCSS('position', 'fixed');
    expect((await header.boundingBox())!.y).toBe(0);
    await expect
      .poll(() => header.evaluate((el) => getComputedStyle(el).backdropFilter))
      .toContain('blur');
  });

  test('une catégorie populaire mène à la recherche filtrée', async ({ page }) => {
    await page.goto('/');
    await page
      .getByRole('navigation', { name: 'Catégories populaires' })
      .getByRole('link', { name: 'Danse' })
      .click();
    await expect(page).toHaveURL('/recherche?categorie=danse');
  });

  test('pas de pagination ; les photos défilent toutes seules', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('group', { name: 'Choisir une ambiance' })).toHaveCount(0);
    const active = page.locator('[data-active="true"]');
    await expect(active).toHaveAttribute('data-slide', 'mariage');
    await expect(active).toHaveAttribute('data-slide', 'soiree', { timeout: 9000 });
  });

  test('« réduire les animations » : pas de défilement automatique', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto('/');
    await page.waitForTimeout(6500);
    await expect(page.locator('[data-active="true"]')).toHaveAttribute('data-slide', 'mariage');
    await context.close();
  });
});
