import { expect, test, type Page } from '@playwright/test';

/**
 * Planificateur d'événements (page « Événements », 27/11/2026) : créer un événement, y ajouter un
 * prestataire, lui demander un devis (une vraie demande), supprimer puis annuler.
 */
async function signInAsClient(page: Page, retour = '/evenements') {
  await page.goto(`/connexion?retour=${encodeURIComponent(retour)}`);
  await page.getByRole('button', { name: 'Se connecter : Aïssatou, cliente' }).click();
  await expect(page).toHaveURL(retour);
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
}

/** Une date à 3 mois, au format des champs date (AAAA-MM-JJ). */
const inThreeMonths = () => new Date(Date.now() + 90 * 86_400_000).toISOString().slice(0, 10);

test('« Événements » de la navbar ouvre « Mes événements » (connexion demandée)', async ({
  page,
  isMobile,
}) => {
  await page.goto('/evenements');
  await expect(page).toHaveURL('/connexion?retour=%2Fevenements');
  await page.getByRole('button', { name: 'Se connecter : Aïssatou, cliente' }).click();
  await expect(page).toHaveURL('/evenements');
  await expect(page.getByRole('heading', { level: 1, name: 'Mes événements' })).toBeVisible();
  await expect(page.getByRole('list', { name: 'Mes événements' }).getByRole('link')).toHaveCount(2);
  if (!isMobile) {
    await expect(
      page
        .getByRole('navigation', { name: 'Navigation principale' })
        .getByRole('link', { name: 'Événements' }),
    ).toHaveAttribute('aria-current', 'page');
  }
  await expectNoHorizontalOverflow(page);
});

test('créer un événement, ajouter un prestataire, lui demander un devis', async ({ page }) => {
  await signInAsClient(page);
  await page.getByRole('link', { name: /Créer/ }).first().click();
  await expect(page).toHaveURL('/evenements/nouveau');

  await page.getByRole('radio', { name: 'Anniversaire' }).check();
  await page.getByRole('button', { name: /Suivant/ }).click();
  await page.getByLabel(/Nom de l’événement/).fill('Anniversaire de Moussa');
  await page.getByLabel(/^Date/).fill(inThreeMonths());
  await page.getByLabel(/Nombre d’invités/).fill('60');
  await page.getByLabel(/^Ville/).fill('Montreuil');
  await page.getByLabel(/Code postal/).fill('93100');
  await page.getByRole('button', { name: /Suivant/ }).click();
  await page.getByLabel(/Budget indicatif/).selectOption('3000_5000');
  await page.getByRole('button', { name: /Créer l’événement/ }).click();

  await expect(
    page.getByRole('heading', { level: 1, name: 'Anniversaire de Moussa' }),
  ).toBeVisible();
  await expect(page.getByText('Événement créé')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Aucun prestataire pour l’instant' }),
  ).toBeVisible();
  await expectNoHorizontalOverflow(page);

  // Ajouter un prestataire depuis la recherche.
  await page.getByRole('link', { name: 'Ajouter un prestataire' }).first().click();
  await page.getByLabel('Rechercher').fill('Douceurs');
  await page.getByRole('button', { name: 'Ajouter Douceurs Créoles' }).click();
  await expect(page.getByText('Prestataire ajouté')).toBeVisible();
  await expect(
    page
      .getByRole('listitem')
      .filter({ hasText: 'Douceurs Créoles' })
      .getByRole('button', { name: /Ajouté/ }),
  ).toBeDisabled();
  await expectNoHorizontalOverflow(page);

  // Demander le devis : une vraie demande, visible dans « Mes demandes ».
  await page.getByRole('link', { name: 'Retour à l’événement' }).click();
  await page.getByRole('link', { name: 'Demander les devis' }).first().click();
  await expect(page.getByText('1 prestataire sélectionné')).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.getByRole('button', { name: 'Envoyer les demandes de devis' }).first().click();
  await expect(page.getByText('Demande de devis envoyée')).toBeVisible();
  await expect(
    page.getByRole('listitem').filter({ hasText: 'Douceurs Créoles' }).getByText('Devis demandé'),
  ).toBeVisible();

  await page.goto('/espace/demandes');
  await expect(page.getByRole('link', { name: /Douceurs Créoles/ }).first()).toBeVisible();
});

test('supprimer un événement, puis « Annuler »', async ({ page }) => {
  await signInAsClient(page, '/evenements/evt-anniversaire-30-ans');
  await page.getByRole('button', { name: 'Supprimer' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Supprimer' }).click();
  await expect(page).toHaveURL('/evenements');
  await expect(page.getByRole('list', { name: 'Mes événements' }).getByRole('link')).toHaveCount(1);
  await page.getByRole('button', { name: 'Annuler' }).click();
  await expect(page.getByText('Événement restauré')).toBeVisible();
  await expect(page.getByRole('list', { name: 'Mes événements' }).getByRole('link')).toHaveCount(2);
});

test('depuis une fiche prestataire : « Ajouter à un événement »', async ({ page }) => {
  await signInAsClient(page, '/prestataires/glow-by-aminata');
  await page.getByRole('button', { name: 'Ajouter à un événement' }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Ajouter à Mariage de Aïssatou' })
    .click();
  await expect(page.getByText('Prestataire ajouté')).toBeVisible();

  await page.goto('/evenements/evt-mariage-aissatou');
  await expect(page.getByRole('link', { name: 'Glow by Aminata' })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});
