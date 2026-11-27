import { expect, test, type Page } from '@playwright/test';

/**
 * Back-office admin (refonte du 27/11/2026) : en-tête « application », menu latéral (tiroir sur
 * téléphone), 4 chiffres, tâches prioritaires, activité récente, accès rapides ; pages secondaires.
 */
async function signInAsAdmin(page: Page, retour = '/admin') {
  await page.goto(`/connexion?retour=${encodeURIComponent(retour)}`);
  await page.getByRole('button', { name: 'Se connecter : Admin' }).click();
  await expect(page).toHaveURL(retour);
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
}

test('vue d’ensemble : chiffres, tâches, activité, accès rapides, sans débordement', async ({
  page,
  isMobile,
}) => {
  await signInAsAdmin(page);
  await expect(page.getByRole('heading', { level: 1, name: 'Vue d’ensemble' })).toBeVisible();
  const stats = page.getByTestId('admin-stat');
  await expect(stats).toHaveCount(4);
  await expect(stats.first()).toContainText(/\d+profils à valider/);

  // Ordinateur : 4 chiffres sur une ligne et menu latéral visible ; téléphone : 2 par ligne, tiroir.
  const tops = await stats.evaluateAll((cards) =>
    cards.map((card) => Math.round(card.getBoundingClientRect().top)),
  );
  expect(new Set(tops).size).toBe(isMobile ? 2 : 1);
  await expect(page.getByRole('navigation', { name: 'Administration' })).toBeVisible({
    visible: !isMobile,
  });

  await expect(
    page.getByRole('list', { name: 'Tâches à traiter' }).getByRole('listitem'),
  ).toHaveCount(3);
  await expect(
    page.getByRole('list', { name: 'Derniers événements' }).getByRole('listitem'),
  ).toHaveCount(3);
  await expect(page.getByRole('link', { name: 'Gérer les utilisateurs' })).toBeVisible();
  await expect(page.getByRole('contentinfo')).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
});

test('menu : chaque entrée ouvre sa page (tiroir sur téléphone)', async ({ page, isMobile }) => {
  await signInAsAdmin(page);
  for (const [label, url, title] of [
    ['Profils à valider', '/admin/prestataires', 'Profils à valider'],
    ['Signalements', '/admin/signalements', 'Signalements'],
    ['Utilisateurs', '/admin/utilisateurs', 'Utilisateurs'],
    ['Vue d’ensemble', '/admin', 'Vue d’ensemble'],
  ] as const) {
    if (isMobile) {
      await page.getByRole('button', { name: 'Ouvrir le menu d’administration' }).click();
      await page.getByRole('dialog').getByRole('link', { name: label }).click();
      await expect(page.getByRole('dialog')).toHaveCount(0);
    } else {
      await page
        .getByRole('navigation', { name: 'Administration' })
        .getByRole('link', { name: label })
        .click();
    }
    await expect(page).toHaveURL(url);
    await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  }
});

test('« Examiner » un signalement amène sa carte à l’écran', async ({ page }) => {
  await signInAsAdmin(page);
  const tasks = page.getByRole('list', { name: 'Tâches à traiter' }).getByRole('listitem');
  await tasks
    .nth(2)
    .getByRole('link', { name: /^Examiner/ })
    .click();
  await expect(page).toHaveURL(/\/admin\/signalements#rep-/);
  const id = new URL(page.url()).hash.slice(1);
  const card = page.locator(`article[id="${id}"]`);
  await expect(card).toBeFocused();
  await expect(card).toBeInViewport();
});

test('notifications : la cloche liste ce qui reste à traiter', async ({ page }) => {
  await signInAsAdmin(page);
  await page.getByRole('button', { name: 'Notifications : 3 à traiter' }).click();
  await page.getByRole('menuitem', { name: '2 signalements à traiter' }).click();
  await expect(page).toHaveURL('/admin/signalements');
});

test('validation d’un profil : message, liste et chiffres à jour', async ({ page }) => {
  await signInAsAdmin(page, '/admin/prestataires');
  await page.getByRole('row').nth(1).getByRole('link', { name: 'Examiner' }).click();
  await page.getByRole('button', { name: 'Valider et publier' }).click();
  await expect(page).toHaveURL('/admin/prestataires');
  await expect(page.getByRole('status')).toContainText('est validé et publié');
  await expect(page.getByText('Rien à valider')).toBeVisible();

  await page.goto('/admin');
  await expect(page.getByTestId('admin-stat').first()).toContainText('0profils à valider');
  await expect(
    page.getByRole('list', { name: 'Derniers événements' }).getByRole('listitem').first(),
  ).toContainText('Profil validé');
});
