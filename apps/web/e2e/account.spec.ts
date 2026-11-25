import { expect, test } from '@playwright/test';

test('parcours C8 : la cliente modifie son compte ; la suppression attend ses réservations', async ({
  page,
}) => {
  await page.goto('/connexion?retour=%2Fespace%2Fcompte');
  await page.getByRole('button', { name: 'Se connecter : Aïssatou, cliente' }).click();
  await expect(page.getByRole('heading', { name: 'Mon compte', exact: true })).toBeVisible();

  const firstName = page.getByLabel('Prénom', { exact: true });
  await firstName.fill('Aïssa');
  await page.getByRole('checkbox', { name: 'Nouveautés et bons plans par SMS' }).check();
  await page.getByRole('button', { name: 'Enregistrer' }).click();
  await expect(page.getByText('Modifications enregistrées')).toBeVisible();

  // Le nouveau prénom est gardé après un rechargement (données mockées persistées).
  await page.reload();
  await expect(page.getByLabel('Prénom', { exact: true })).toHaveValue('Aïssa');

  await page.getByRole('button', { name: 'Supprimer mon compte' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Confirmation').fill('SUPPRIMER');
  await dialog.getByRole('button', { name: 'Supprimer définitivement' }).click();
  await expect(dialog.getByRole('alert')).toContainText('réservations à venir');
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
