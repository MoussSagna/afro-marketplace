import { expect, test, type Page } from '@playwright/test';

/** « Se connecter » depuis la navbar de l'accueil (dans le menu sur téléphone). */
async function openLoginFromHome(page: Page, isMobile: boolean) {
  if (isMobile) await page.getByRole('button', { name: 'Ouvrir le menu' }).click();
  await page.getByRole('link', { name: 'Se connecter', exact: true }).click();
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
    await expect(page.getByRole('link', { name: 'Se connecter', exact: true })).toBeVisible();
  });
});

test.describe('page de connexion (refonte du 27/11/2026)', () => {
  test('écran partagé : photo sur toute la hauteur à gauche, formulaire à droite', async ({
    page,
    isMobile,
  }) => {
    await page.goto('/connexion');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Bon retour sur Wenzee' }),
    ).toBeVisible();
    const photo = (await page.getByRole('complementary', { name: 'Wenzee' }).boundingBox())!;
    const form = (await page
      .getByRole('form', { name: 'Se connecter avec un e-mail' })
      .boundingBox())!;
    const viewport = page.viewportSize()!;

    if (isMobile) {
      // Téléphone : la photo en bandeau, le formulaire dessous, sur toute la largeur.
      expect(photo.width).toBe(viewport.width);
      expect(photo.height).toBeLessThan(viewport.height / 2);
      expect(form.y).toBeGreaterThan(photo.y + photo.height);
    } else {
      expect(photo).toMatchObject({
        x: 0,
        y: 0,
        width: viewport.width / 2,
        height: viewport.height,
      });
      expect(form.x).toBeGreaterThan(viewport.width / 2);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
    await expect(page.getByRole('link', { name: 'Créer un compte' })).toBeVisible();
  });

  test('connexion par email et mot de passe (simulée)', async ({ page }) => {
    await page.goto('/connexion?retour=%2Fespace%2Fmessages');
    await page.getByRole('button', { name: 'Se connecter', exact: true }).click();
    await expect(page.getByText('Adresse email invalide')).toBeVisible();

    await page.getByLabel('Adresse e-mail').fill('aissatou.ndiaye@example.com');
    await page.getByLabel('Mot de passe', { exact: true }).fill('Faux2026');
    await page.getByRole('button', { name: 'Afficher le mot de passe' }).click();
    await expect(page.getByLabel('Mot de passe', { exact: true })).toHaveAttribute('type', 'text');
    await page.getByRole('button', { name: 'Se connecter', exact: true }).click();
    await expect(page.getByRole('alert')).toHaveText('Email ou mot de passe incorrect.');

    await page.getByLabel('Mot de passe', { exact: true }).fill('Wenzee2026');
    await page.getByRole('button', { name: 'Se connecter', exact: true }).click();
    await expect(page).toHaveURL('/espace/messages');
  });

  test('« Créer un compte » : inscription complète avec le code de démo', async ({ page }) => {
    await page.goto('/connexion');
    await page.getByRole('link', { name: 'Créer un compte' }).click();
    await expect(page).toHaveURL('/inscription');

    await page.getByLabel('Prénom').fill('Fatou');
    await page.getByLabel('Adresse e-mail').fill('fatou.e2e@example.com');
    await page.getByLabel('Mot de passe', { exact: true }).fill('Bonjour2026');
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: 'Créer mon compte' }).click();

    await expect(page.getByRole('heading', { name: 'Vérifiez votre e-mail' })).toBeVisible();
    await page.getByLabel('Code à 6 chiffres').fill('123456');
    await page.getByRole('button', { name: 'Confirmer' }).click();
    await expect(page).toHaveURL('/espace/demandes');
  });
});
