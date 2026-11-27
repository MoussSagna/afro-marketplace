import { expect, test } from '@playwright/test';

test('un visiteur cherche, filtre et ouvre un profil', async ({ page, isMobile }) => {
  await page.goto('/');
  await expect(
    page.getByRole('banner').getByRole('link', { name: 'Wenzee, accueil' }),
  ).toBeVisible();

  // Accueil : recherche « Quoi ? » (pilule sur ordinateur, plein écran sur téléphone)
  if (isMobile) await page.getByRole('button', { name: /Que recherchez-vous/ }).click();
  const search = isMobile
    ? page.getByRole('dialog', { name: 'Votre recherche' })
    : page.getByRole('search', { name: 'Rechercher un prestataire' });
  await search
    .getByRole('combobox', { name: isMobile ? 'Prestation recherchée' : 'Quoi ?' })
    .fill('Traiteurs');
  await search.getByRole('option', { name: /^Traiteurs/ }).click();
  await search.getByRole('button', { name: 'Rechercher' }).click();
  await expect(page).toHaveURL('/recherche?categorie=traiteurs');
  await expect(page.getByText('5 prestataires')).toBeVisible();

  // Filtre « Sénégal » (sur téléphone, il faut d'abord ouvrir les filtres)
  if (isMobile) await page.getByRole('button', { name: /^Filtres/ }).click();
  const senegal = page.getByRole('checkbox', { name: 'Sénégal' });
  await senegal.click();
  await expect(senegal).toBeChecked();
  await expect(page).toHaveURL('/recherche?categorie=traiteurs&origines=senegal');
  // Sur téléphone, le panneau de filtres se ferme avec son bouton « Voir 1 résultat ».
  if (isMobile) await page.getByRole('button', { name: 'Voir 1 résultat' }).click();
  await expect(page.getByText('1 prestataire', { exact: true })).toBeVisible();

  // Profil
  await page.getByRole('link', { name: 'Saveurs de Dakar' }).click();
  await expect(page).toHaveURL('/prestataires/saveurs-de-dakar');
  await expect(page.getByRole('heading', { level: 1, name: 'Saveurs de Dakar' })).toBeVisible();
  await page.getByRole('tab', { name: 'Prestations' }).click();
  await expect(page.getByRole('heading', { name: 'Nos prestations' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Contacter le prestataire' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Envoyer une demande' })).toBeVisible();
});

test('une page catégorie a son titre pour Google', async ({ page }) => {
  await page.goto('/categories/dj');

  await expect(
    page.getByRole('heading', { level: 1, name: 'DJ afro en Île-de-France' }),
  ).toBeVisible();
  await expect(page).toHaveTitle('DJ afro en Île-de-France · Wenzee');
});

test('un nouveau groupe de catégories montre ses sous-catégories et ses prestataires', async ({
  page,
}) => {
  await page.goto('/categories/photo-video');

  await expect(
    page.getByRole('heading', { level: 1, name: 'Photo & vidéo afro en Île-de-France' }),
  ).toBeVisible();
  const subCategories = page.getByRole('list', { name: 'Sous-catégories' });
  await expect(subCategories.getByRole('link', { name: 'Photographes' })).toBeVisible();
  await expect(subCategories.getByRole('link', { name: 'Photobooths' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Studio Sankofa' })).toBeVisible();
});
