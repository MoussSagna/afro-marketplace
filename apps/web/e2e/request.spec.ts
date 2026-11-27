import { expect, test, type Page } from '@playwright/test';

/** « AAAA-MM-JJ » dans `days` jours. */
const inDays = (days: number) =>
  new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);

/** Remplit la date ; si le prestataire est pris ce jour-là, essaie le jour suivant. */
async function fillFreeDate(page: Page) {
  for (let offset = 45; offset < 60; offset++) {
    await page.getByLabel('Date').fill(inDays(offset));
    await page.getByRole('button', { name: 'Envoyer ma demande' }).click();
    const taken = page.getByText('Ce prestataire n’est pas disponible à cette date.');
    if (!(await taken.isVisible({ timeout: 500 }).catch(() => false))) return;
  }
  throw new Error('Aucune date libre trouvée');
}

test('parcours 1 : un visiteur demande un devis depuis un profil', async ({ page }) => {
  await page.goto('/prestataires/chez-tantie-adjoua');
  await page.getByRole('link', { name: 'Demander un devis' }).first().click();

  // Pas encore connecté : la connexion de démo, puis retour au formulaire.
  await expect(page).toHaveURL(/\/connexion\?retour=/);
  await page.getByRole('button', { name: 'Se connecter : Aïssatou, cliente' }).click();
  await expect(page).toHaveURL('/prestataires/chez-tantie-adjoua/demande');

  await page.getByLabel('Type d’événement').selectOption('birthday');
  await page.getByLabel('Ville').fill('Créteil');
  await page.getByLabel('Code postal').fill('94000');
  await page.getByLabel('Nombre d’invités (facultatif)').fill('60');
  await page
    .getByLabel('Ton message')
    .fill('Bonjour, je fête mes 40 ans et j’aimerais un buffet ivoirien pour 60 personnes.');
  await fillFreeDate(page);

  await expect(page).toHaveURL(/\/espace\/messages\/conv-.+\?envoyee=1/);
  await expect(page.getByText(/Ta demande est envoyée/)).toBeVisible();

  // La demande apparaît dans « Mes demandes ».
  await page
    .getByRole('link', { name: /Mes demandes/ })
    .first()
    .click();
  await expect(page.getByRole('link', { name: 'Chez Tantie Adjoua' })).toBeVisible();
});

test('parcours 7 : un numéro de téléphone est masqué avant la réservation', async ({ page }) => {
  await page.goto('/connexion?retour=%2Fespace%2Fmessages');
  await page.getByRole('button', { name: 'Se connecter : Aïssatou, cliente' }).click();
  await page
    .getByRole('list', { name: 'Conversations' })
    .getByRole('link', { name: /Saveurs de Dakar/ })
    .click();

  const input = page.getByRole('textbox', { name: 'Ton message' });
  await input.fill('Appelez-moi au 06 12 34 56 78 ou sur awa@mail.fr');
  await input.press('Enter');

  const thread = page.getByRole('region', { name: 'Conversation avec Saveurs de Dakar' });
  await expect(
    thread.getByText('Appelez-moi au [coordonnées masquées] ou sur [coordonnées masquées]'),
  ).toBeVisible();
  await expect(thread.getByText('06 12 34 56 78')).toHaveCount(0);

  // Côté prestataire, le numéro n'apparaît pas non plus.
  await page.goto('/deconnexion');
  await page.goto('/connexion?retour=%2Fpro%2Fmessages');
  await page.getByRole('button', { name: 'Se connecter : Saveurs de Dakar, prestataire' }).click();
  await page
    .getByRole('list', { name: 'Conversations' })
    .getByRole('link', { name: /Aïssatou/ })
    .first()
    .click();
  // On cible le fil ouvert : sur mobile, l'aperçu de la liste (masquée) contient le même texte.
  const proThread = page.getByRole('region', { name: /Conversation avec Aïssatou/ });
  await expect(proThread.getByText(/Appelez-moi au \[coordonnées masquées\]/)).toBeVisible();
});
