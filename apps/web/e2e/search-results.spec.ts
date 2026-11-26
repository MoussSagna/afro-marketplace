import { expect, test } from '@playwright/test';

/**
 * Page de résultats (refonte du 26/11/2026) : grille de cartes à grande photo, mode Liste,
 * favoris, pagination numérotée, filtres en colonne (ordinateur) ou en panneau (téléphone).
 */

test('grille par défaut, bascule Liste / Grille sans toucher à la recherche', async ({
  page,
  isMobile,
}) => {
  await page.goto('/recherche?origines=senegal');
  await expect(page.getByText('6 prestataires', { exact: true })).toBeVisible();
  const results = page.getByRole('region', { name: 'Résultats' }).getByRole('list').first();

  // Grille : 3 colonnes sur ordinateur (1280 px), 1 sur téléphone.
  const columns = await results.evaluate(
    (list) => getComputedStyle(list).gridTemplateColumns.split(' ').length,
  );
  expect(columns).toBe(isMobile ? 1 : 3);

  await page.getByRole('button', { name: 'Liste' }).click();
  await expect(results).toHaveAttribute('data-view', 'list');
  await expect(page).toHaveURL('/recherche?origines=senegal');

  // Le choix est retenu au rechargement.
  await page.reload();
  await expect(page.getByRole('button', { name: 'Liste' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Grille' }).click();
  await expect(results).toHaveAttribute('data-view', 'grid');
});

test('une carte : pas de prix, un cœur qui ne change pas de page, un clic qui ouvre le profil', async ({
  page,
}) => {
  await page.goto('/recherche?q=Dakar');
  const card = page.getByRole('article').filter({ hasText: 'Saveurs de Dakar' });
  await expect(card).toBeVisible();
  await expect(card).not.toContainText('€');

  const heart = card.getByRole('button', { name: 'Favori : Saveurs de Dakar' });
  await heart.click();
  await expect(heart).toHaveAttribute('aria-pressed', 'true');
  await expect(page).toHaveURL('/recherche?q=Dakar');

  // Clic sur la photo (pas sur le nom) : toute la carte mène au profil.
  await card.click({ position: { x: 120, y: 200 } });
  await expect(page).toHaveURL('/prestataires/saveurs-de-dakar');
});

test('clavier : Tab atteint le cœur puis le nom, Entrée ouvre le profil', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'Parcours clavier : ordinateur seulement');
  await page.goto('/recherche?q=Dakar');
  const link = page.getByRole('link', { name: 'Saveurs de Dakar' });
  await expect(link).toBeVisible();

  // Le cœur est en haut de la photo : il vient avant le nom, dans l'ordre de lecture.
  await page.getByRole('button', { name: 'Grille' }).focus();
  await page.keyboard.press('Tab');
  const heart = page.getByRole('button', { name: 'Favori : Saveurs de Dakar' });
  await expect(heart).toBeFocused();
  await page.keyboard.press('Space');
  await expect(heart).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Tab');
  await expect(link).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('/prestataires/saveurs-de-dakar');
});

test('pagination numérotée', async ({ page }) => {
  await page.goto('/recherche');
  await page.getByRole('button', { name: 'Page 3' }).click();
  await expect(page).toHaveURL('/recherche?page=3');
  await expect(page.getByRole('button', { name: 'Page 3' })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect(page.getByRole('button', { name: 'Suivant' })).toBeDisabled();
});

test('téléphone : filtres dans un panneau, sans débordement horizontal', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, 'Panneau de filtres : téléphone seulement');
  await page.goto('/recherche');
  await expect(page.getByText('33 prestataires', { exact: true })).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBe(0);

  await page.getByRole('button', { name: /^Filtres/ }).click();
  const panel = page.getByRole('dialog', { name: 'Filtres' });
  await panel.locator('label').filter({ hasText: '4,5 et plus' }).click();
  await expect(panel.getByRole('radio', { name: '4,5 et plus' })).toBeChecked();
  await expect(page).toHaveURL('/recherche?note=4.5');
  await panel.getByRole('button', { name: /^Voir \d+ résultats?$/ }).click();
  await expect(panel).toBeHidden();
  await expect(page.getByRole('button', { name: /^Filtres/ })).toContainText('1');
});

test('ordinateur : la colonne de filtres reste à l’écran pendant le défilement', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'Colonne de filtres : ordinateur seulement');
  await page.goto('/recherche');
  await expect(page.getByText('33 prestataires', { exact: true })).toBeVisible();
  const filters = page.getByRole('complementary');
  const before = (await filters.boundingBox())!.y;

  await page.mouse.wheel(0, 900);
  await expect.poll(async () => (await filters.boundingBox())!.y).toBe(96);
  expect(before).toBeGreaterThan(96);
  await expect(filters.getByRole('heading', { name: 'Filtres' })).toBeInViewport();
});

test('la recherche du haut est celle de l’accueil et garde les filtres', async ({
  page,
  isMobile,
}) => {
  await page.goto('/recherche?origines=senegal');
  await expect(page.getByText('6 prestataires', { exact: true })).toBeVisible();
  if (isMobile) await page.getByRole('button', { name: /Que recherchez-vous/ }).click();
  const search = isMobile
    ? page.getByRole('dialog', { name: 'Votre recherche' })
    : page.getByRole('search', { name: 'Rechercher un prestataire' });
  await search
    .getByRole('combobox', { name: isMobile ? 'Prestation recherchée' : 'Quoi ?' })
    .fill('Traiteurs');
  await search.getByRole('option', { name: /^Traiteurs/ }).click();
  await search.getByRole('button', { name: 'Rechercher' }).click();
  await expect(page).toHaveURL('/recherche?categorie=traiteurs&origines=senegal');
  await expect(page.getByText('1 prestataire', { exact: true })).toBeVisible();
});
