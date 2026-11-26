import { expect, test } from '@playwright/test';

test.describe('section « Prestataires à la une »', () => {
  test('4 cartes par ligne sur ordinateur, 1 sur téléphone, sans débordement', async ({
    page,
    isMobile,
  }) => {
    await page.goto('/');
    const section = page.locator('section[aria-labelledby="featured-title"]');
    await section.scrollIntoViewIfNeeded();
    const cards = section.getByRole('article');
    await expect(cards).toHaveCount(8);

    // On attend la fin de l'animation d'entrée (les cartes montent de 24 px en décalé).
    const gap = async () => {
      const first = (await cards.nth(0).boundingBox())!;
      const fourth = (await cards.nth(3).boundingBox())!;
      return isMobile ? fourth.y - (first.y + first.height) : Math.abs(fourth.y - first.y);
    };
    if (isMobile) {
      await expect.poll(gap).toBeGreaterThan(0); // empilées
    } else {
      await expect.poll(gap).toBeLessThan(1); // même ligne
    }

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBe(0);
  });

  test('une carte ouvre le profil du prestataire', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Saveurs de Dakar' }).click();
    await expect(page).toHaveURL('/prestataires/saveurs-de-dakar');
  });
});
