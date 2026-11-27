import { expect, test, type Page } from '@playwright/test';

/**
 * Tableau de bord client (refonte du 27/11/2026) : bannière, 3 chiffres cliquables, filtres,
 * cartes de demandes ; les 4 onglets de l'espace gardent leurs pages.
 */
async function signInAsClient(page: Page, retour = '/espace/demandes') {
  await page.goto(`/connexion?retour=${encodeURIComponent(retour)}`);
  await page.getByRole('button', { name: 'Se connecter : Aïssatou, cliente' }).click();
  await expect(page).toHaveURL(retour);
}

test('mise en page : bannière, 3 chiffres, demandes, sans débordement', async ({
  page,
  isMobile,
}) => {
  await signInAsClient(page);
  // Arrivée en haut de la page, même si la connexion avait défilé (ScrollRestoration).
  expect(await page.evaluate(() => window.scrollY)).toBe(0);

  await expect(page.getByTestId('welcome-banner')).toContainText('Bonjour Aïssatou');
  const stats = page.getByTestId('stat-card');
  await expect(stats).toHaveCount(3);
  // Les 3 chiffres sur une seule ligne, sur ordinateur comme sur téléphone.
  const tops = await stats.evaluateAll((cards) =>
    cards.map((card) => Math.round(card.getBoundingClientRect().top)),
  );
  expect(new Set(tops).size).toBe(1);
  await expect(page.getByRole('heading', { level: 1, name: 'Mes demandes' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Saveurs de Dakar' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
  if (isMobile) {
    // Téléphone : le statut reste visible sous les infos de la carte.
    const card = page.getByRole('article').filter({ hasText: 'Saveurs de Dakar' });
    await expect(card.getByText('En attente de réponse').filter({ visible: true })).toBeVisible();
  }
});

test('les chiffres et les onglets mènent aux bonnes pages', async ({ page }) => {
  await signInAsClient(page);

  await page.getByRole('link', { name: /Messages non lus/ }).click();
  await expect(page).toHaveURL('/espace/messages');
  await expect(page.getByRole('heading', { level: 1, name: 'Messages' })).toBeVisible();

  await page
    .getByRole('navigation', { name: 'Espace client' })
    .getByRole('link', { name: 'Mes demandes' })
    .click();
  await page.getByRole('link', { name: /Réservations à venir/ }).click();
  await expect(page).toHaveURL('/espace/reservations');
  await expect(page.getByRole('heading', { level: 1, name: 'Mes réservations' })).toBeVisible();

  await page
    .getByRole('navigation', { name: 'Espace client' })
    .getByRole('link', { name: 'Mon compte' })
    .click();
  await expect(page.getByRole('heading', { level: 1, name: 'Mon compte' })).toBeVisible();
});

test('filtrer par statut puis ouvrir le détail d’une demande', async ({ page }) => {
  await signInAsClient(page);

  await page.getByRole('tab', { name: /^Terminées/ }).click();
  await expect(page).toHaveURL('/espace/demandes?onglet=closed');
  await page.getByRole('tab', { name: /^En cours/ }).click();

  await page.getByRole('link', { name: 'Saveurs de Dakar' }).click();
  await expect(page).toHaveURL(/\/espace\/demandes\/qr-/);
  await expect(page.getByRole('heading', { level: 1, name: 'Saveurs de Dakar' })).toBeVisible();
});

test('« Nouvelle demande » ouvre la recherche d’un prestataire', async ({ page }) => {
  await signInAsClient(page);
  await page.getByRole('link', { name: 'Nouvelle demande' }).click();
  await expect(page).toHaveURL('/recherche');
});
