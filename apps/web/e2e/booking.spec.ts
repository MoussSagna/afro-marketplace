import { expect, test, type Page } from '@playwright/test';

async function signInAs(page: Page, account: string, retour: string) {
  await page.goto('/deconnexion');
  await page.goto(`/connexion?retour=${encodeURIComponent(retour)}`);
  await page.getByRole('button', { name: `Se connecter : ${account}` }).click();
  await expect(page).toHaveURL(retour);
}

test('parcours 2 et 3 : devis envoyé, accepté, date bloquée dans l’agenda', async ({ page }) => {
  // Parcours 2 : le prestataire reçoit la demande (seed) et envoie un devis.
  await signInAs(page, 'Saveurs de Dakar, prestataire', '/pro/demandes');
  const pending = page
    .getByRole('article')
    .filter({ hasText: 'À traiter' })
    .filter({ hasText: 'Aïssatou' })
    .first();
  await pending.getByRole('link').click();
  const eventDateText = await page
    .getByText(/^(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche) \d+ \S+ \d{4}$/)
    .first()
    .textContent();
  await page.getByRole('link', { name: 'Envoyer un devis' }).click();

  await page.getByLabel('Libellé de la ligne 1').fill('Buffet sénégalais');
  await page.getByLabel('Quantité ligne 1').fill('150');
  await page.getByLabel('Prix unitaire ligne 1').fill('28');
  await expect(page.getByText(/^4\s200\s€$/).last()).toBeVisible();
  await page.getByRole('button', { name: 'Envoyer le devis' }).click();
  await expect(page.getByRole('article', { name: 'Devis n° 1' })).toBeVisible();

  // Parcours 3 : la cliente accepte le devis.
  await signInAs(page, 'Aïssatou, cliente', '/espace/demandes');
  await page.getByRole('link', { name: 'Saveurs de Dakar' }).first().click();
  const quote = page.getByRole('article', { name: 'Devis n° 1' });
  await quote.getByRole('button', { name: 'Accepter le devis' }).click();
  await page.getByLabel('Adresse de l’événement').fill('8 allée des Baobabs, 93200 Saint-Denis');
  await page.getByRole('button', { name: 'Confirmer la réservation' }).click();
  await expect(page.getByRole('heading', { name: 'Réservation confirmée' })).toBeVisible();

  // La date est bloquée dans l'agenda du prestataire.
  await signInAs(page, 'Saveurs de Dakar, prestataire', '/pro/agenda');
  const [, day, monthName, year] = eventDateText!.match(/(\d+) (\S+) (\d{4})$/)!;
  for (let i = 0; i < 24; i++) {
    if (await page.getByText(`${monthName} ${year}`, { exact: true }).isVisible()) break;
    await page.getByRole('button', { name: 'Mois suivant' }).click();
  }
  await expect(
    page.getByRole('link', { name: new RegExp(`^\\S+ ${day} ${monthName} : réservé`) }),
  ).toBeVisible();
});
