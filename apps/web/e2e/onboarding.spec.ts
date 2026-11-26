import { expect, test, type Page } from '@playwright/test';

async function signInAs(page: Page, account: string, retour: string) {
  await page.goto('/deconnexion');
  await page.goto(`/connexion?retour=${encodeURIComponent(retour)}`);
  await page.getByRole('button', { name: `Se connecter : ${account}` }).click();
  await expect(page).toHaveURL(retour);
}

test('parcours 5 : une cliente devient prestataire et envoie son profil en validation', async ({
  page,
}) => {
  await signInAs(page, 'Aïssatou, cliente', '/devenir-prestataire');
  await page.getByRole('button', { name: 'Créer mon profil gratuitement' }).first().click();
  await expect(page).toHaveURL('/pro/onboarding');
  const next = page.getByRole('button', { name: 'Continuer' });

  // 1. Identité
  await page.getByLabel('Nom commercial').fill('Les Délices d’Aïssatou');
  await next.click();
  // 2. Catégories
  await expect(page.getByRole('heading', { name: 'Ce que tu proposes' })).toBeVisible();
  await page
    .getByRole('group', { name: 'Catégories' })
    .getByText('Traiteurs', { exact: true })
    .click();
  await next.click();
  // 3. Zone
  await expect(page.getByRole('heading', { name: 'Où interviens-tu ?' })).toBeVisible();
  await page.getByLabel('Ville', { exact: true }).fill('Montreuil');
  await page.getByLabel('Code postal').fill('93100');
  await next.click();
  // 4. Photos et présentation
  await expect(page.getByRole('heading', { name: 'Présentation et photos' })).toBeVisible();
  for (let i = 1; i <= 3; i++) {
    await page.getByRole('button', { name: 'Ajouter une photo d’exemple' }).click();
    await expect(page.getByRole('img', { name: `Photo ${i}` })).toBeVisible();
  }
  await page.getByLabel('Présente-toi').fill('Cuisine sénégalaise faite maison, depuis 10 ans.');
  await next.click();
  // 5. Formules
  await page.getByRole('button', { name: 'Ajouter une formule' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Titre de la formule').fill('Buffet thiéboudienne');
  await dialog.getByLabel('Prix (€)').fill('22,50');
  await dialog.getByLabel('Invités minimum').fill('30');
  await dialog.getByRole('button', { name: 'Enregistrer la formule' }).click();
  await expect(page.getByText('Buffet thiéboudienne')).toBeVisible();
  await next.click();
  // 6. Disponibilités, 7. Annulation
  await expect(page.getByRole('heading', { name: 'Tes disponibilités' })).toBeVisible();
  await next.click();
  await page.getByText('Souple', { exact: true }).click();
  await next.click();

  // 8. Récapitulatif (règle n° 2) puis envoi
  await expect(page.getByText('Étape 8 sur 8')).toBeVisible();
  await page.getByRole('button', { name: 'Envoyer mon profil en validation' }).click();
  await expect(page.getByRole('heading', { name: 'Ton profil est envoyé !' })).toBeVisible();

  // Le tableau de bord rappelle que la validation est en cours.
  await page.goto('/pro');
  await expect(page.getByText(/en cours de validation/)).toBeVisible();
});
