import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { useFavoritesStore } from '@/stores/favorites';
import { useNavbarOverlayStore } from '@/stores/navbarOverlay';
import { renderRoute } from '@/test/renderRoute';

const URL = '/prestataires/saveurs-de-dakar';

/** Ouvre un onglet de la fiche et renvoie son contenu (`role="tabpanel"`). */
async function openTab(name: string) {
  await userEvent.click(await screen.findByRole('tab', { name }));
  return screen.getByRole('tabpanel', { name });
}

describe('Profil prestataire (P5)', () => {
  it('pose l’identité du prestataire sur la couverture', async () => {
    renderRoute(URL);

    const title = await screen.findByRole('heading', { level: 1, name: /Saveurs de Dakar/ });
    expect(title).toHaveTextContent('Pro vérifié');
    const cover = screen.getByTestId('profile-cover');
    expect(cover).toContainElement(title);
    const header = title.closest('header')!;
    expect(await within(header).findByText('Traiteur & boissons')).toBeInTheDocument();
    expect(within(header).getByRole('link', { name: 'Traiteurs' })).toHaveAttribute(
      'href',
      '/categories/traiteurs',
    );
    expect(within(header).getByText('Paris')).toBeInTheDocument();
    expect(within(header).getByRole('img', { name: 'Note : 4,8 sur 5, 8 avis' })).toBeVisible();
    expect(within(header).getByRole('link', { name: 'Contacter le prestataire' })).toHaveAttribute(
      'href',
      '/prestataires/saveurs-de-dakar/demande',
    );
    // La couverture est tout en haut : rien avant elle dans la fiche (ni fil d'Ariane, ni bloc).
    const article = cover.closest('article')!;
    expect([...article.children].filter((child) => child.tagName !== 'SCRIPT')[0]).toBe(cover);
    expect(screen.queryByRole('navigation', { name: /fil d’ariane|breadcrumb/i })).toBeNull();
  });

  it('demande la navbar transparente tant que la couverture est affichée', async () => {
    const { unmount } = renderRoute(URL);

    await screen.findByTestId('profile-cover');
    expect(useNavbarOverlayStore.getState().requests).toBe(1);
    unmount();
    expect(useNavbarOverlayStore.getState().requests).toBe(0);
  });

  it('affiche 4 onglets accessibles, Présentation ouvert par défaut', async () => {
    renderRoute(URL);

    const tablist = await screen.findByRole('tablist', { name: 'Sections du profil' });
    const tabs = within(tablist).getAllByRole('tab');
    expect(tabs.map((tab) => tab.textContent)).toEqual([
      'Présentation',
      'Prestations',
      'Galerie',
      'Avis',
    ]);
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(tabs.slice(1).every((tab) => tab.getAttribute('aria-selected') === 'false')).toBe(true);
    // Pas des liens d'ancrage : de vrais onglets reliés à leur contenu.
    expect(within(tablist).queryAllByRole('link')).toHaveLength(0);
    const panel = screen.getByRole('tabpanel', { name: 'Présentation' });
    expect(tabs[0]).toHaveAttribute('aria-controls', panel.id);
  });

  it('remplace le contenu au changement d’onglet, sans défiler, et garde le panneau de contact', async () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    const originalScrollIntoView = Element.prototype.scrollIntoView;
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    renderRoute(URL);

    await screen.findByRole('heading', { name: 'À propos de Saveurs de Dakar' });
    // Seul le changement d'onglet compte (pas un éventuel retour en haut à l'arrivée sur la page).
    scrollTo.mockClear();
    const prestations = await openTab('Prestations');
    expect(within(prestations).getByRole('heading', { name: 'Nos prestations' })).toBeVisible();
    expect(screen.queryByRole('heading', { name: 'À propos de Saveurs de Dakar' })).toBeNull();
    expect(screen.getAllByRole('tabpanel')).toHaveLength(1);
    expect(screen.getByRole('region', { name: 'Parlons de votre événement' })).toBeVisible();

    await openTab('Avis');
    expect(screen.queryByRole('heading', { name: 'Nos prestations' })).toBeNull();
    expect(screen.getByRole('region', { name: 'Parlons de votre événement' })).toBeVisible();
    expect(scrollTo).not.toHaveBeenCalled();
    expect(scrollIntoView).not.toHaveBeenCalled();
    scrollTo.mockRestore();
    Element.prototype.scrollIntoView = originalScrollIntoView;
  });

  it('se pilote au clavier avec les flèches', async () => {
    renderRoute(URL);

    const first = await screen.findByRole('tab', { name: 'Présentation' });
    first.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Prestations' })).toHaveFocus();
    expect(screen.getByRole('tab', { name: 'Prestations' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}');
    // Les flèches bouclent : avant Présentation, on revient sur Avis.
    expect(screen.getByRole('tab', { name: 'Avis' })).toHaveFocus();
    expect(screen.getByRole('tabpanel', { name: 'Avis' })).toBeInTheDocument();
  });

  it('présente le prestataire : spécialités et informations clés tirées du profil', async () => {
    renderRoute(URL);

    const panel = await screen.findByRole('tabpanel', { name: 'Présentation' });
    expect(panel).toHaveTextContent('Traiteur sénégalais depuis 2015');
    const tags = within(panel).getByRole('list', { name: 'Spécialités' });
    expect(await within(tags).findByText('Sénégal')).toBeInTheDocument();
    expect(within(tags).getByText('Français, Wolof')).toBeInTheDocument();
    expect(panel).toHaveTextContent('CapacitéJusqu’à 400 invités');
    expect(panel).toHaveTextContent('LocalisationParis · jusqu’à 60 km');
    expect(panel).toHaveTextContent('RéponseEn 3 h en moyenne');
    expect(panel).toHaveTextContent('AnnulationModérée');
  });

  it('montre les jours indisponibles dans le calendrier (onglet Présentation)', async () => {
    renderRoute(URL);

    const calendar = await screen.findByRole('region', { name: 'Disponibilités' });
    // Les blocages du seed sont à J+15 et J+16 : au moins l'un peut tomber le mois suivant.
    const blocked = await within(calendar)
      .findAllByLabelText(/indisponible/)
      .catch(async () => {
        await userEvent.click(within(calendar).getByRole('button', { name: 'Mois suivant' }));
        return within(calendar).findAllByLabelText(/indisponible/);
      });
    expect(blocked.length).toBeGreaterThan(0);
  });

  it('liste les prestations avec leur prix', async () => {
    renderRoute(URL);

    const offerings = await openTab('Prestations');
    expect(within(offerings).getByRole('heading', { name: 'Buffet mariage' })).toBeInTheDocument();
    expect(offerings).toHaveTextContent(/28\s€ \/ personne/);
    expect(offerings).toHaveTextContent('De 50 à 400 invités');
  });

  it('affiche « Sur devis » et la politique stricte pour une conférencière', async () => {
    renderRoute('/prestataires/awa-diallo-conferenciere');

    expect(
      await screen.findByRole('heading', { name: 'Annulation : stricte' }),
    ).toBeInTheDocument();
    const offerings = await openTab('Prestations');
    expect(within(offerings).getAllByText('Sur devis')).toHaveLength(2);
  });

  it('montre la galerie avec le nombre de photos et la visionneuse', async () => {
    renderRoute(URL);

    const gallery = await openTab('Galerie');
    expect(gallery).toHaveTextContent('6 photos');
    await userEvent.click(
      within(gallery).getByRole('button', { name: 'Agrandir la photo 1 sur 6' }),
    );
    const dialog = await screen.findByRole('dialog', { name: 'Photo 1 sur 6' });
    await userEvent.click(within(dialog).getByRole('button', { name: /Suivante/ }));
    expect(await screen.findByRole('dialog', { name: 'Photo 2 sur 6' })).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('ouvre la visionneuse depuis la couverture', async () => {
    renderRoute(URL);

    await userEvent.click(await screen.findByRole('button', { name: 'Voir toute la galerie (6)' }));
    expect(await screen.findByRole('dialog', { name: 'Photo 1 sur 6' })).toBeInTheDocument();
  });

  it('résume les avis puis les montre tous sur demande', async () => {
    renderRoute(URL);

    const reviews = await openTab('Avis');
    const distribution = await within(reviews).findByRole('list', {
      name: 'Répartition des notes',
    });
    expect(distribution).toHaveTextContent('5 étoiles : 6 avis (75 %)');
    expect(distribution).toHaveTextContent('4 étoiles : 2 avis (25 %)');

    const list = within(reviews).getByRole('list', { name: 'Avis' });
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent(/[A-ZÉ][a-zé-]+ [A-Z]\./);
    expect(within(items[0]!).getByRole('img', { name: /^Note : \d,\d sur 5$/ })).toBeVisible();
    expect(items[0]!.querySelector('time')).toHaveTextContent(
      /^il y a|hier|la semaine dernière|le mois dernier/,
    );

    const more = within(reviews).getByRole('button', { name: /Voir tous les avis \(8\)/ });
    expect(more).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(more);
    expect(within(list).getAllByRole('listitem')).toHaveLength(8);
  });

  it('ajoute et retire le prestataire des favoris', async () => {
    renderRoute(URL);

    const heart = await screen.findByRole('button', { name: 'Favori : Saveurs de Dakar' });
    expect(heart).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(heart);
    expect(heart).toHaveAttribute('aria-pressed', 'true');
    expect(useFavoritesStore.getState().ids).toContain('prov-saveurs-de-dakar');
    await userEvent.click(heart);
    expect(heart).toHaveAttribute('aria-pressed', 'false');
  });

  it('propose d’envoyer une demande depuis le panneau de contact', async () => {
    renderRoute(URL);

    const panel = await screen.findByRole('region', { name: 'Parlons de votre événement' });
    expect(within(panel).getByRole('link', { name: 'Envoyer une demande' })).toHaveAttribute(
      'href',
      '/prestataires/saveurs-de-dakar/demande',
    );
    expect(panel).toHaveTextContent('Répond en 3 h en moyenne');
    expect(panel).toHaveTextContent('Se déplace jusqu’à 60 km autour de Paris');
    expect(panel).toHaveTextContent('Annulation modérée');
  });

  it('« Afficher le numéro » explique que le numéro reste masqué avant réservation', async () => {
    renderRoute(URL);

    const button = await screen.findByRole('button', { name: 'Afficher le numéro' });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/communiqué une fois la réservation confirmée/)).toBeInTheDocument();
  });

  it('affiche une 404 pour un profil inconnu ou non publié, avec la navbar opaque', async () => {
    renderRoute('/prestataires/kompa-vibes-haiti');

    expect(await screen.findByRole('heading', { name: 'Page introuvable' })).toBeInTheDocument();
    expect(useNavbarOverlayStore.getState().requests).toBe(0);
  });
});
