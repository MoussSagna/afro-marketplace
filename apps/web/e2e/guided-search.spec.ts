import { expect, test, type Page } from '@playwright/test';

/** Descend sous le hero puis remonte un peu (la navbar, cachée en descendant, réapparaît). */
async function scrollPastHero(page: Page) {
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollHeight))
    .toBeGreaterThan(2500);
  await page.evaluate(() => window.scrollTo({ top: 1400, behavior: 'instant' }));
  await page.waitForTimeout(100);
  await page.evaluate(() => window.scrollTo({ top: 1200, behavior: 'instant' }));
}

test.describe('recherche guidée (inspirée d’Airbnb)', () => {
  test('ordinateur : pilule Quoi → Où → Quand, puis résultats', async ({ page, isMobile }) => {
    test.skip(isMobile, 'sur téléphone, voir le test plein écran');
    await page.goto('/');
    const pill = page.getByRole('search', { name: 'Rechercher un prestataire' });

    await pill.getByLabel('Quoi ?').click();
    await expect(pill.getByRole('listbox', { name: 'Prestations proposées' })).toBeVisible();
    await pill.getByLabel('Quoi ?').fill('dj');
    await pill.getByRole('option', { name: /^DJ/ }).first().click();

    await expect(pill.getByLabel('Où ?')).toBeFocused();
    await pill.getByRole('option', { name: /Paris/ }).click();

    const calendar = pill.getByRole('dialog', { name: 'Choisir la date de l’événement' });
    await expect(calendar).toBeVisible();
    await calendar.getByRole('button', { name: 'Mois suivant' }).click();
    await calendar
      .getByRole('button', { name: /^samedi/ })
      .first()
      .click();
    await expect(pill.getByLabel('Quand ?')).toContainText('sam.');

    await pill.getByRole('button', { name: 'Rechercher' }).click();
    await expect(page).toHaveURL(/\/recherche\?categorie=dj&ville=Paris&date=\d{4}-\d{2}-\d{2}$/);
  });

  test('ordinateur : clic dehors referme le panneau', async ({ page, isMobile }) => {
    test.skip(isMobile, 'pilule réservée aux grands écrans');
    await page.goto('/');
    const pill = page.getByRole('search', { name: 'Rechercher un prestataire' });
    await pill.getByLabel('Où ?').click();
    await expect(pill.getByRole('listbox', { name: 'Villes proposées' })).toBeVisible();
    await page.getByRole('heading', { level: 1 }).click();
    await expect(pill.getByRole('listbox')).toHaveCount(0);
  });

  test('ordinateur : après le hero, la recherche compacte de l’en-tête se déplie', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'sur téléphone, c’est une loupe');
    await page.goto('/');
    const header = page.getByRole('banner');
    await expect(header.getByRole('group', { name: 'Recherche rapide' })).toHaveCount(0);

    await scrollPastHero(page);
    const compact = header.getByRole('group', { name: 'Recherche rapide' });
    await expect(compact).toBeVisible();
    await expect(header.getByRole('link', { name: 'Événements' })).toBeHidden();

    await compact.getByRole('button', { name: 'Quand : N’importe quand' }).click();
    const expanded = header.getByRole('search', { name: 'Rechercher un prestataire' });
    await expect(
      expanded.getByRole('dialog', { name: 'Choisir la date de l’événement' }),
    ).toBeVisible();
    await expect(page.getByTestId('search-backdrop')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByTestId('search-backdrop')).toHaveCount(0);
    await expect(compact).toBeVisible();
  });

  test('téléphone : recherche plein écran par étapes', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'plein écran réservé aux téléphones');
    await page.goto('/');
    await page.getByRole('button', { name: /Que recherchez-vous/ }).click();
    const dialog = page.getByRole('dialog', { name: 'Votre recherche' });
    await expect(dialog.getByRole('heading', { name: 'Que recherchez-vous ?' })).toBeVisible();

    await dialog.getByRole('option', { name: 'Beauté & soins' }).click();
    await expect(dialog.getByRole('heading', { name: 'Où se passe l’événement ?' })).toBeVisible();
    await dialog.getByRole('option', { name: /Créteil/ }).click();
    await expect(dialog.getByRole('heading', { name: 'Quand a lieu l’événement ?' })).toBeVisible();
    await dialog.getByRole('button', { name: 'Samedi prochain' }).click();

    await dialog.getByRole('button', { name: 'Rechercher' }).click();
    await expect(page).toHaveURL(/\/recherche\?categorie=beaute-soins&ville=Cr%C3%A9teil&date=/);

    // Pas de débordement horizontal pendant la recherche.
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBe(0);
  });

  test('téléphone : après le hero, une loupe dans l’en-tête rouvre la recherche', async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, 'loupe réservée aux petits écrans');
    await page.goto('/');
    await scrollPastHero(page);
    const loupe = page
      .getByRole('banner')
      .getByRole('button', { name: 'Rechercher un prestataire' });
    await expect(loupe).toBeVisible();
    await loupe.click();
    await expect(page.getByRole('dialog', { name: 'Votre recherche' })).toBeVisible();
  });
});
