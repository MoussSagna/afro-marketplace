import { expect, test } from '@playwright/test';

test.describe('pied de page', () => {
  for (const path of ['/', '/faq', '/recherche']) {
    test(`même pied de page sur ${path}`, async ({ page }) => {
      await page.goto(path);
      const footer = page.getByRole('contentinfo');
      await footer.scrollIntoViewIfNeeded();
      await expect(footer.getByRole('heading', { name: 'Restez informé' })).toBeVisible();
      await expect(footer.getByRole('navigation', { name: 'Découvrir' })).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow).toBe(0);
    });
  }

  test('aussi dans l’espace client', async ({ page }) => {
    await page.goto('/connexion?retour=%2Fespace%2Fdemandes');
    await page.getByRole('button', { name: 'Se connecter : Aïssatou, cliente' }).click();
    await expect(page).toHaveURL('/espace/demandes');
    await expect(
      page.getByRole('contentinfo').getByRole('navigation', { name: 'Informations légales' }),
    ).toBeAttached();
  });

  test('« Je suis prestataire » mène à Devenir prestataire', async ({ page }) => {
    await page.goto('/faq');
    await page
      .getByRole('contentinfo')
      .getByRole('navigation', { name: 'Je suis' })
      .getByRole('link', { name: /Prestataire/ })
      .click();
    await expect(page).toHaveURL('/devenir-prestataire');
  });
});
