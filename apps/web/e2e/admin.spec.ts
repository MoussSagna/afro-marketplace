import { expect, test, type Page } from '@playwright/test';

async function signInAs(page: Page, account: string, retour: string) {
  await page.goto('/deconnexion');
  await page.goto(`/connexion?retour=${encodeURIComponent(retour)}`);
  await page.getByRole('button', { name: `Se connecter : ${account}` }).click();
  await expect(page).toHaveURL(retour);
}

test('parcours 6 : l’admin valide un profil, qui apparaît dans la recherche', async ({ page }) => {
  // Avant : le profil en attente n'est pas visible.
  await page.goto('/recherche?q=Kompa');
  await expect(page.getByText(/^\d+ prestataires?$/)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Kompa Vibes Haïti' })).toHaveCount(0);

  await signInAs(page, 'Admin', '/admin/prestataires');
  await page.getByRole('link', { name: 'Kompa Vibes Haïti' }).click();
  await page.getByRole('button', { name: 'Valider et publier' }).click();
  await expect(page).toHaveURL('/admin/prestataires');
  await expect(page.getByRole('link', { name: 'Kompa Vibes Haïti' })).toHaveCount(0);

  await page.goto('/recherche?q=Kompa');
  await expect(page.getByRole('link', { name: 'Kompa Vibes Haïti' })).toBeVisible();
});
