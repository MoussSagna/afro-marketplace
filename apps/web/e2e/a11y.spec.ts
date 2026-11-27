import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/**
 * Accessibilité : axe-core analyse chaque page clé (contrastes, libellés, titres, rôles ARIA…).
 * On vise zéro violation « serious » ou « critical » (WCAG 2.1 AA).
 */
async function expectNoSeriousViolations(page: Page) {
  // On attend la fin des fondus d'apparition (motion) : en plein fondu, axe mesurerait
  // des contrastes trop faibles qui n'existent pas une fois la page affichée.
  // (Écrit en texte : ce code s'exécute dans le navigateur, pas dans Node.)
  await page.waitForFunction("document.getAnimations().every((a) => a.playState !== 'running')");
  await page.waitForTimeout(600);
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  const serious = results.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical',
  );
  expect(
    serious.map(
      (v) => `${v.id} : ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`,
    ),
  ).toEqual([]);
}

const PUBLIC_PAGES: [string, string][] = [
  ['/', 'Trouvez les talents qui subliment'],
  ['/recherche', 'Rechercher un prestataire'],
  ['/prestataires/saveurs-de-dakar', 'Saveurs de Dakar'],
  ['/connexion', 'Bon retour sur Wenzee'],
  ['/inscription', 'Créer un compte'],
  ['/mot-de-passe-oublie', 'Mot de passe oublié'],
  ['/faq', 'Questions fréquentes'],
  ['/devenir-prestataire', 'ton talent'],
];

for (const [path, heading] of PUBLIC_PAGES) {
  test(`accessibilité : ${path}`, async ({ page }) => {
    await page.goto(path);
    await expect(
      page.getByRole('heading', { level: 1, name: new RegExp(heading, 'i') }),
    ).toBeVisible();
    await expectNoSeriousViolations(page);
  });
}

test('accessibilité : espace client (Mon compte, réservations)', async ({ page }) => {
  await page.goto('/connexion?retour=%2Fespace%2Fcompte');
  await page.getByRole('button', { name: 'Se connecter : Aïssatou, cliente' }).click();
  await expect(page.getByRole('heading', { name: 'Mon compte', exact: true })).toBeVisible();
  await expectNoSeriousViolations(page);

  await page.goto('/espace/reservations');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expectNoSeriousViolations(page);
});
