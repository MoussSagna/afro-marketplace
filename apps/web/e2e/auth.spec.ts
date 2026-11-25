import { expect, test, type Page } from '@playwright/test';

/** « Se connecter » depuis la navbar de l'accueil (dans le menu sur téléphone). */
async function openLoginFromHome(page: Page, isMobile: boolean) {
  if (isMobile) await page.getByRole('button', { name: 'Ouvrir le menu' }).click();
  await page.getByRole('link', { name: 'Se connecter' }).click();
}

test.describe('connexion de démo', () => {
  for (const { account, url, title } of [
    { account: 'Aïssatou, cliente', url: '/espace/demandes', title: 'Mes demandes' },
    { account: 'Saveurs de Dakar, prestataire', url: '/pro', title: 'Tableau de bord' },
    { account: 'Admin', url: '/admin', title: 'Vue d’ensemble' },
  ]) {
    test(`« ${account} » arrive dans son espace`, async ({ page, isMobile }) => {
      await page.goto('/');
      await openLoginFromHome(page, isMobile);
      await page.getByRole('button', { name: `Se connecter : ${account}` }).click();

      await expect(page).toHaveURL(url);
      await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
    });
  }

  test('une page protégée renvoie vers la connexion puis revient', async ({ page }) => {
    await page.goto('/espace/messages');
    await expect(page).toHaveURL('/connexion?retour=%2Fespace%2Fmessages');

    await page.getByRole('button', { name: 'Se connecter : Aïssatou, cliente' }).click();
    await expect(page).toHaveURL('/espace/messages');

    // La session survit au rechargement de la page.
    await page.reload();
    await expect(page.getByRole('heading', { level: 1, name: 'Messages' })).toBeVisible();
  });

  test('se déconnecter ramène à l’accueil', async ({ page, isMobile }) => {
    await page.goto('/connexion');
    await page.getByRole('button', { name: 'Se connecter : Aïssatou, cliente' }).click();
    await expect(page).toHaveURL('/espace/demandes');

    await page.getByRole('button', { name: 'Menu de Aïssatou' }).click();
    await page.getByRole('menuitem', { name: 'Se déconnecter' }).click();

    await expect(page).toHaveURL('/');
    if (isMobile) await page.getByRole('button', { name: 'Ouvrir le menu' }).click();
    await expect(page.getByRole('link', { name: 'Se connecter' })).toBeVisible();
  });
});
