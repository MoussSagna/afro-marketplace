import { expect, test, type Page } from '@playwright/test';

/**
 * Messagerie responsive (correction du 27/11/2026) : aucun onglet coupé, aucune bulle qui dépasse,
 * zone d'écriture toujours visible, aux tailles d'écran courantes.
 */
const LONG_WORD = 'kdjfmsdlkfjsmqldkfjsdqmofkjsdlmfjsdmflqsdkjfhqsdkjfhqskdjfhsqdkjfh';
const LONG_URL =
  'https://www.exemple-de-traiteur-senegalais.fr/menus/mariage/2027/formule-prestige-avec-dessert';

async function openSaveursDeDakar(page: Page) {
  await page.goto('/connexion?retour=%2Fespace%2Fmessages');
  await page.getByRole('button', { name: 'Se connecter : Aïssatou, cliente' }).click();
  await expect(page).toHaveURL('/espace/messages');
  await page
    .getByRole('list', { name: 'Conversations' })
    .getByRole('link', { name: /Saveurs de Dakar/ })
    .click();
  await expect(
    page.getByRole('region', { name: 'Conversation avec Saveurs de Dakar' }),
  ).toBeVisible();
}

/** Mesures dans le navigateur : bulles hors du fil, onglets coupés, débordement de la page. */
function measure(page: Page) {
  return page.evaluate(() => {
    const thread = document
      .querySelector('section[aria-label^="Conversation avec"]')!
      .getBoundingClientRect();
    const bubbles = [
      ...document.querySelectorAll('ol[aria-label="Messages"] > li > div:first-child'),
    ];
    const tabs = [...document.querySelectorAll('nav[aria-label="Espace client"] a')];
    return {
      pageOverflow: document.documentElement.scrollWidth - window.innerWidth,
      bubblesOut: bubbles.filter((bubble) => {
        const box = bubble.getBoundingClientRect();
        return (
          box.left < thread.left - 0.5 ||
          box.right > thread.right + 0.5 ||
          bubble.scrollWidth > bubble.clientWidth + 1
        );
      }).length,
      tabsOut: tabs.filter(
        (tab) =>
          tab.getBoundingClientRect().right > window.innerWidth ||
          tab.scrollWidth > tab.clientWidth + 1,
      ).length,
    };
  });
}

for (const [width, height] of [
  [375, 812],
  [390, 844],
  [430, 932],
  [768, 1024],
  [1440, 900],
] as const) {
  test(`${width} × ${height} : longs messages dans leur bulle, onglets entiers, saisie visible`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    await openSaveursDeDakar(page);

    const input = page.getByRole('textbox', { name: 'Ton message' });
    for (const text of [LONG_WORD, `Voici le lien : ${LONG_URL}`]) {
      await input.fill(text);
      await page.getByRole('button', { name: 'Envoyer' }).click();
      await expect(page.getByRole('list', { name: 'Messages' }).getByText(text)).toBeVisible();
    }

    expect(await measure(page)).toEqual({ pageOverflow: 0, bubblesOut: 0, tabsOut: 0 });
    // Le dernier message et la zone d'écriture sont à l'écran, sans faire défiler la page.
    await expect(
      page.getByRole('list', { name: 'Messages' }).getByText(`Voici le lien : ${LONG_URL}`),
    ).toBeInViewport();
    await expect(input).toBeInViewport();
    await expect(page.getByRole('button', { name: 'Envoyer' })).toBeInViewport();
  });
}

test('clavier ouvert (écran réduit) : la zone d’écriture reste visible', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openSaveursDeDakar(page);
  const input = page.getByRole('textbox', { name: 'Ton message' });
  await input.click();
  // Android, `interactive-widget=resizes-content` : le clavier réduit la zone visible.
  await page.setViewportSize({ width: 390, height: 480 });
  await input.focus();
  await expect(input).toBeInViewport();
  await expect(page.getByRole('button', { name: 'Envoyer' })).toBeInViewport();
});

test('téléphone : changer de conversation par le bouton retour', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await openSaveursDeDakar(page);

  await page.getByRole('link', { name: 'Retour aux conversations' }).click();
  await expect(page).toHaveURL('/espace/messages');
  await page
    .getByRole('list', { name: 'Conversations' })
    .getByRole('link', { name: /Compagnie Akwaba/ })
    .click();
  await expect(
    page.getByRole('region', { name: 'Conversation avec Compagnie Akwaba' }),
  ).toBeVisible();
  expect((await measure(page)).pageOverflow).toBe(0);
});

test('onglets : icônes seules sur téléphone si un libellé passerait sur 2 lignes', async ({
  page,
}) => {
  for (const [width, iconsOnly] of [
    [375, true],
    [600, false],
  ] as const) {
    await page.setViewportSize({ width, height: 800 });
    await openSaveursDeDakar(page);
    const nav = page.getByRole('navigation', { name: 'Espace client' });
    const state = await nav.evaluate((element) => ({
      iconsOnly: element.querySelector('[data-icons-only]') !== null,
      // Nombre de lignes de chaque libellé visible.
      lines: [...element.querySelectorAll<HTMLElement>('[data-label]:not(.sr-only)')].map((label) =>
        Math.round(
          label.getBoundingClientRect().height / parseFloat(getComputedStyle(label).lineHeight),
        ),
      ),
    }));
    expect(state.iconsOnly).toBe(iconsOnly);
    if (iconsOnly) expect(state.lines).toEqual([]);
    else expect(state.lines.every((n) => n === 1)).toBe(true);
    // Les libellés restent les noms accessibles des onglets.
    await expect(nav.getByRole('link', { name: 'Mes demandes' })).toBeVisible();
    await expect(nav.getByRole('link', { name: /Messages/ })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());
  }
});
