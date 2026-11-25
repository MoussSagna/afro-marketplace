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

    await page.mouse.wheel(0, 800);
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

  test('la pagination change de photo', async ({ page }) => {
    await page.goto('/');
    const dots = page.getByRole('group', { name: 'Choisir une ambiance' });
    const second = dots.getByRole('button', { name: /^2 sur 3/ });
    await second.click();
    await expect(second).toHaveAttribute('aria-current', 'true');
  });

  test('« réduire les animations » : pas de défilement automatique', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.getByRole('button', { name: /diaporama/ })).toHaveCount(0);
    await page.waitForTimeout(6500);
    await expect(
      page.getByRole('group', { name: 'Choisir une ambiance' }).getByRole('button').first(),
    ).toHaveAttribute('aria-current', 'true');
    await context.close();
  });
});
