import { expect, test } from '@playwright/test';

test.describe('section « Comment ça marche »', () => {
  test('3 cartes côte à côte sur ordinateur, empilées sur téléphone', async ({
    page,
    isMobile,
  }) => {
    await page.goto('/');
    const section = page.locator('section[aria-labelledby="how-title"]');
    await section.scrollIntoViewIfNeeded();
    const steps = section.getByRole('listitem');
    await expect(steps).toHaveCount(3);
    // Les cartes montent en fondu à l'arrivée à l'écran : on attend la dernière.
    await steps.nth(2).scrollIntoViewIfNeeded();
    await expect(steps.nth(2)).toHaveCSS('opacity', '1');

    const [first, second] = [
      (await steps.nth(0).boundingBox())!,
      (await steps.nth(1).boundingBox())!,
    ];
    if (isMobile) {
      expect(second.y).toBeGreaterThan(first.y + first.height); // l'une sous l'autre
    } else {
      expect(Math.abs(second.y - first.y)).toBeLessThan(2); // même ligne
      expect(second.x).toBeGreaterThan(first.x + first.width);
    }

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBe(0);
  });

  test('« Commencer ma recherche » ouvre la recherche', async ({ page }) => {
    await page.goto('/');
    await page
      .locator('section[aria-labelledby="how-title"]')
      .getByRole('link', { name: 'Commencer ma recherche' })
      .click();
    await expect(page).toHaveURL('/recherche');
  });

  test('« réduire les animations » : les cartes sont là tout de suite', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const step = page.locator('section[aria-labelledby="how-title"]').getByRole('listitem').first();
    await step.scrollIntoViewIfNeeded();
    expect(await step.evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
  });
});
