import { expect, test } from '@playwright/test';

test("un visiteur voit les prestataires à la une sur l'accueil", async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', { level: 1, name: /Trouvez les talents qui subliment/ }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Saveurs de Dakar' })).toBeVisible();
  await expect(page.getByText('Pro vérifié').first()).toBeVisible();
});

test('une URL inconnue affiche la page 404', async ({ page }) => {
  await page.goto('/cette-page-n-existe-pas');

  await expect(page.getByRole('heading', { name: 'Page introuvable' })).toBeVisible();
  await page.getByRole('link', { name: 'Retour à l’accueil' }).click();
  await expect(page).toHaveURL('/');
});
