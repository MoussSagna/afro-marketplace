import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderRoute } from '@/test/renderRoute';

describe('Profil prestataire (P5)', () => {
  it('affiche les informations principales', async () => {
    renderRoute('/prestataires/saveurs-de-dakar');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Saveurs de Dakar' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Pro vérifié')).toBeInTheDocument();
    expect(screen.getByText(/Paris · se déplace jusqu’à 60 km/)).toBeInTheDocument();
    expect(screen.getByText('Français, Wolof')).toBeInTheDocument();
    expect(await screen.findByText('Sénégal')).toBeInTheDocument();
  });

  it('liste les formules avec leur prix', async () => {
    renderRoute('/prestataires/saveurs-de-dakar');

    const offerings = await screen.findByRole('region', { name: 'Formules et prix' });
    expect(within(offerings).getByRole('heading', { name: 'Buffet mariage' })).toBeInTheDocument();
    expect(offerings).toHaveTextContent(/28\s€ \/ personne/);
    expect(offerings).toHaveTextContent('De 50 à 400 invités');
  });

  it('affiche les avis avec le prénom et l’initiale de l’auteur', async () => {
    renderRoute('/prestataires/saveurs-de-dakar');

    const reviews = await screen.findByRole('region', { name: /Avis/ });
    const items = await within(reviews).findAllByRole('listitem');
    expect(items).toHaveLength(8);
    expect(items[0]).toHaveTextContent(/^[A-ZÉ][a-zé-]+ [A-Z]\./);
  });

  it('ouvre la visionneuse de photos et passe à la suivante', async () => {
    renderRoute('/prestataires/saveurs-de-dakar');

    await userEvent.click(await screen.findByRole('button', { name: 'Agrandir la photo 1 sur 6' }));
    const dialog = await screen.findByRole('dialog', { name: 'Photo 1 sur 6' });
    await userEvent.click(within(dialog).getByRole('button', { name: /Suivante/ }));
    expect(await screen.findByRole('dialog', { name: 'Photo 2 sur 6' })).toBeInTheDocument();

    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('montre les jours indisponibles dans le calendrier', async () => {
    renderRoute('/prestataires/saveurs-de-dakar');

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

  it('propose de demander un devis', async () => {
    renderRoute('/prestataires/saveurs-de-dakar');

    const links = await screen.findAllByRole('link', { name: 'Demander un devis' });
    expect(links[0]).toHaveAttribute('href', '/prestataires/saveurs-de-dakar/demande');
  });

  it('affiche « Sur devis » et la politique stricte pour une conférencière', async () => {
    renderRoute('/prestataires/awa-diallo-conferenciere');

    const offerings = await screen.findByRole('region', { name: 'Formules et prix' });
    expect(within(offerings).getAllByText('Sur devis')).toHaveLength(2);
    expect(screen.getByRole('heading', { name: 'Annulation : stricte' })).toBeInTheDocument();
  });

  it('affiche une 404 pour un profil inconnu ou non publié', async () => {
    renderRoute('/prestataires/kompa-vibes-haiti');

    expect(await screen.findByRole('heading', { name: 'Page introuvable' })).toBeInTheDocument();
  });
});
