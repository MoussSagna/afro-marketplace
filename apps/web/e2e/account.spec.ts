import { expect, test } from '@playwright/test';

test('parcours C8 : la cliente modifie son compte ; la suppression attend ses réservations', async ({
  page,
}) => {
  await page.goto('/connexion?retour=%2Fespace%2Fcompte');
  await page.getByRole('button', { name: 'Se connecter : Aïssatou, cliente' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Mon compte' })).toBeVisible();
  await expect(
    page.getByRole('heading', { level: 2, name: 'Informations personnelles' }),
  ).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);

  await page.getByRole('textbox', { name: /Prénom/ }).fill('Aïssa');
  await page.getByRole('textbox', { name: 'Ville' }).fill('Lyon');
  await page.getByRole('button', { name: 'Enregistrer les modifications' }).click();
  await expect(page.getByText('Modifications enregistrées')).toBeVisible();

  // Le nouveau prénom et la ville sont gardés après un rechargement (données mockées persistées).
  await page.reload();
  await expect(page.getByRole('textbox', { name: /Prénom/ })).toHaveValue('Aïssa');
  await expect(page.getByRole('textbox', { name: 'Ville' })).toHaveValue('Lyon');

  // Notifications : un interrupteur, enregistré.
  const nav = page.getByRole('navigation', { name: 'Rubriques du compte' });
  await nav.getByRole('link', { name: 'Notifications' }).click();
  await expect(page).toHaveURL(/rubrique=notifications/);
  const sms = page.getByRole('switch', { name: 'Nouveautés et offres par sms' });
  await sms.click();
  await expect(sms).toHaveAttribute('aria-checked', 'true');
  await page.getByRole('button', { name: 'Enregistrer les préférences' }).click();
  await expect(page.getByText('Préférences enregistrées')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);

  // Sécurité : la suppression du compte attend la fin des réservations.
  await nav.getByRole('link', { name: 'Sécurité' }).click();
  await page.getByRole('button', { name: 'Supprimer mon compte' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Confirmation').fill('SUPPRIMER');
  await dialog.getByRole('button', { name: 'Supprimer définitivement' }).click();
  await expect(dialog.getByRole('alert')).toContainText('réservations à venir');
});

test('C8 : changer son mot de passe, puis se reconnecter avec', async ({ page }) => {
  await page.goto('/connexion?retour=%2Fespace%2Fcompte%3Frubrique%3Dsecurite');
  await page.getByRole('button', { name: 'Se connecter : Aïssatou, cliente' }).click();
  await expect(page.getByRole('heading', { level: 2, name: 'Sécurité' })).toBeVisible();

  await page.getByLabel(/Mot de passe actuel/).fill('Wenzee2026');
  await page.getByLabel(/^Nouveau mot de passe/).fill('Nouveau2027');
  await page.getByLabel(/Confirmation du nouveau/).fill('Nouveau2027');
  await page.getByRole('button', { name: 'Modifier le mot de passe' }).click();
  await expect(page.getByText('Mot de passe modifié')).toBeVisible();

  // Déconnexion depuis le menu du compte, avec confirmation.
  await page
    .getByRole('navigation', { name: 'Rubriques du compte' })
    .getByRole('button', { name: 'Déconnexion' })
    .click();
  await page.getByRole('dialog').getByRole('button', { name: 'Se déconnecter' }).click();
  await expect(page).toHaveURL('/');

  await page.goto('/connexion');
  await page.getByLabel('Adresse e-mail').fill('aissatou.ndiaye@example.com');
  await page.getByLabel('Mot de passe', { exact: true }).fill('Nouveau2027');
  await page.getByRole('button', { name: 'Se connecter', exact: true }).click();
  await expect(page).not.toHaveURL(/connexion/);
});

test('les pages légales sont accessibles depuis le pied de page', async ({ page }) => {
  await page.goto('/');
  const footer = page.getByRole('navigation', { name: 'Informations légales' });
  await footer.getByRole('link', { name: 'Mentions légales' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Mentions légales' })).toBeVisible();
  await expect(page.getByRole('note')).toContainText('relecture juridique');
});

test('SEO : un profil publie ses données structurées', async ({ page }) => {
  await page.goto('/prestataires/saveurs-de-dakar');
  await expect(page.getByRole('heading', { level: 1, name: 'Saveurs de Dakar' })).toBeVisible();
  const jsonLd = await page.locator('script[type="application/ld+json"]').textContent();
  expect(JSON.parse(jsonLd!)).toMatchObject({ '@type': 'LocalBusiness', name: 'Saveurs de Dakar' });
});
