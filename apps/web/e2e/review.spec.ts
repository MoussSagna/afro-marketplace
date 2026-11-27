import { expect, test, type Page } from '@playwright/test';

async function signInAs(page: Page, account: string, retour: string) {
  await page.goto('/deconnexion');
  await page.goto(`/connexion?retour=${encodeURIComponent(retour)}`);
  await page.getByRole('button', { name: `Se connecter : ${account}` }).click();
  await expect(page).toHaveURL(retour);
}

/** « Note : 4,7 sur 5, 12 avis » (en-tête de la fiche) → { average: 4.7, count: 12 } */
async function readRating(page: Page) {
  const label = await page
    .locator('article header')
    .getByRole('img', { name: /^Note : / })
    .first()
    .getAttribute('aria-label');
  const [, average, count] = label!.match(/^Note : ([\d,]+) sur 5, (\d+) avis$/)!;
  return { average: Number(average!.replace(',', '.')), count: Number(count) };
}

test('parcours 4 : la cliente laisse un avis, la note du prestataire change', async ({ page }) => {
  await signInAs(page, 'Aïssatou, cliente', '/espace/reservations');
  const card = page.getByRole('article').filter({ hasText: 'Douceurs Créoles' });
  await expect(card.getByText('Terminée')).toBeVisible();

  // Note de départ, lue sur le profil public.
  await page.goto('/prestataires/douceurs-creoles');
  const before = await readRating(page);

  await page.goto('/espace/reservations');
  await card.getByRole('link', { name: 'Laisser un avis' }).click();
  await expect(page.getByRole('heading', { name: 'Ton avis sur Douceurs Créoles' })).toBeVisible();

  // Une note basse : la moyenne baisse forcément (sauf si elle était déjà à 1).
  await page
    .getByRole('radiogroup', { name: 'Note générale' })
    .getByRole('radio', { name: '1 étoile' })
    .check({ force: true });
  await page.getByLabel('Ton commentaire (facultatif)').fill('Le gâteau est arrivé en retard.');
  await page.getByRole('button', { name: 'Publier mon avis' }).click();

  await expect(page).toHaveURL(/\/prestataires\/douceurs-creoles/);
  await expect(page.getByText('Merci ! Ton avis est publié.')).toBeVisible();
  await expect(page.getByText('Le gâteau est arrivé en retard.')).toBeVisible();
  const after = await readRating(page);
  expect(after.count).toBe(before.count + 1);
  expect(after.average).toBeLessThan(before.average);

  // Plus de bouton sur la réservation : un seul avis (règle n° 6).
  await page.goto('/espace/reservations');
  await expect(card.getByRole('img', { name: 'Note : 1,0 sur 5' })).toBeVisible();
  await expect(card.getByRole('link', { name: 'Laisser un avis' })).toHaveCount(0);
});
