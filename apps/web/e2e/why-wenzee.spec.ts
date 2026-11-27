import { expect, test } from '@playwright/test';

test.describe('section « Pourquoi Wenzee »', () => {
  test('photo et texte côte à côte sur ordinateur, empilés sur téléphone', async ({
    page,
    isMobile,
  }) => {
    await page.goto('/');
    const section = page.locator('section[aria-labelledby="why-title"]');
    await section.scrollIntoViewIfNeeded();
    const photo = section.getByRole('img');
    await expect(photo).toBeVisible();
    await expect
      .poll(() => photo.evaluate((img: HTMLImageElement) => img.naturalWidth))
      .toBeGreaterThan(0);

    const image = (await photo.boundingBox())!;
    const title = (await section.getByRole('heading', { level: 2 }).boundingBox())!;
    if (isMobile) {
      expect(title.y).toBeGreaterThan(image.y + image.height); // texte sous la photo
    } else {
      expect(title.x).toBeGreaterThan(image.x + image.width); // texte à droite
    }

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBe(0);
  });
});
