import { expect, test } from '@playwright/test';

/**
 * Fiche prestataire (refonte du 27/11/2026) : couverture pleine largeur tout en haut, identité posée
 * dessus, 4 vrais onglets (sans défilement), panneau de contact toujours présent.
 */
const URL = '/prestataires/saveurs-de-dakar';

test('la couverture touche les deux bords et le haut de l’écran, l’identité est dessus', async ({
  page,
}) => {
  await page.goto(URL);
  const cover = page.getByTestId('profile-cover');
  await expect(cover.getByRole('heading', { level: 1, name: /Saveurs de Dakar/ })).toBeVisible();

  const box = (await cover.boundingBox())!;
  const viewport = page.viewportSize()!;
  expect(box.x).toBe(0);
  expect(box.y).toBe(0);
  expect(box.width).toBe(viewport.width);
  expect(box.height).toBeGreaterThan(450);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
  // Navbar transparente posée sur la photo.
  await expect(page.getByRole('banner')).toHaveCSS('position', 'fixed');
  await expect(cover.getByRole('link', { name: 'Contacter le prestataire' })).toBeVisible();
  await expect(cover.getByRole('button', { name: 'Favori : Saveurs de Dakar' })).toBeVisible();
});

test('les onglets remplacent le contenu sans faire défiler la page', async ({ page }) => {
  await page.goto(URL);
  const tablist = page.getByRole('tablist', { name: 'Sections du profil' });
  await expect(tablist).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 300));
  const contact = page.getByRole('region', { name: 'Parlons de votre événement' });

  const expected: [string, string][] = [
    ['Prestations', 'Nos prestations'],
    ['Galerie', 'Galerie'],
    ['Avis', 'Avis des clients'],
    ['Présentation', 'À propos de Saveurs de Dakar'],
  ];
  for (const [tab, heading] of expected) {
    await tablist.getByRole('tab', { name: tab }).click();
    await expect(tablist.getByRole('tab', { name: tab })).toHaveAttribute('aria-selected', 'true');
    await expect(
      page.getByRole('tabpanel', { name: tab }).getByRole('heading', { name: heading, level: 2 }),
    ).toBeVisible();
    await expect(page.getByRole('tabpanel')).toHaveCount(1);
    await expect(contact).toHaveCount(1);
    expect(await page.evaluate(() => window.scrollY)).toBe(300);
  }
  expect(page.url()).not.toContain('#');
});

test('clavier : les flèches passent d’un onglet à l’autre', async ({ page }) => {
  await page.goto(URL);
  const tablist = page.getByRole('tablist', { name: 'Sections du profil' });
  await tablist.getByRole('tab', { name: 'Présentation' }).focus();

  await page.keyboard.press('ArrowRight');
  await expect(tablist.getByRole('tab', { name: 'Prestations' })).toBeFocused();
  await expect(page.getByRole('heading', { name: 'Nos prestations' })).toBeVisible();
  await page.keyboard.press('End');
  await expect(tablist.getByRole('tab', { name: 'Avis' })).toHaveAttribute('aria-selected', 'true');
});

test('galerie : onglet en mosaïque et visionneuse depuis la couverture', async ({ page }) => {
  await page.goto(URL);
  await page.getByRole('tab', { name: 'Galerie' }).click();
  const gallery = page.getByRole('tabpanel', { name: 'Galerie' });
  await expect(gallery.getByText('6 photos')).toBeVisible();
  await gallery.getByRole('button', { name: 'Agrandir la photo 3 sur 6' }).click();
  await expect(page.getByRole('dialog', { name: 'Photo 3 sur 6' })).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('dialog', { name: 'Photo 4 sur 6' })).toBeVisible();
  await page.keyboard.press('Escape');

  await page.getByRole('button', { name: 'Voir toute la galerie (6)' }).click();
  await expect(page.getByRole('dialog', { name: 'Photo 1 sur 6' })).toBeVisible();
});

test('favori gardé au rechargement', async ({ page }) => {
  await page.goto(URL);
  const heart = page.getByRole('button', { name: 'Favori : Saveurs de Dakar' });
  await heart.click();
  await expect(heart).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect(page.getByRole('button', { name: 'Favori : Saveurs de Dakar' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

test('ordinateur : le panneau de contact reste visible, sans passer sur le pied de page', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'Sur téléphone, le panneau est dans le flux de la page.');
  await page.goto(URL);
  const panel = page.getByRole('region', { name: 'Parlons de votre événement' });
  await expect(panel).toBeVisible();
  await expect(page.getByRole('region', { name: 'Disponibilités' })).toBeVisible();

  // À droite du contenu.
  const content = (await page.getByRole('tabpanel').boundingBox())!;
  expect((await panel.boundingBox())!.x).toBeGreaterThan(content.x + content.width);

  await page.evaluate(() => window.scrollTo(0, 700));
  await expect.poll(async () => Math.round((await panel.boundingBox())!.y)).toBe(96);

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  const footerTop = (await page.getByRole('contentinfo').boundingBox())!.y;
  const panelBox = (await panel.boundingBox())!;
  expect(panelBox.y + panelBox.height).toBeLessThanOrEqual(footerTop);
});

test('téléphone : onglets sur une ligne, contact sous le contenu', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Disposition propre au téléphone.');
  await page.goto(URL);
  const tabs = await page
    .getByRole('tablist', { name: 'Sections du profil' })
    .getByRole('tab')
    .all();
  const boxes = await Promise.all(tabs.map(async (tab) => (await tab.boundingBox())!));
  for (const box of boxes) {
    expect(Math.round(box.y)).toBe(Math.round(boxes[0]!.y));
    expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  }

  const panel = (await page.getByRole('tabpanel').boundingBox())!;
  const contact = (await page
    .getByRole('heading', { name: 'Parlons de votre événement' })
    .boundingBox())!;
  expect(contact.y).toBeGreaterThan(panel.y + panel.height);

  await page.getByRole('link', { name: 'Envoyer une demande' }).click();
  await expect(page).toHaveURL(/\/connexion|\/demande/);
});
