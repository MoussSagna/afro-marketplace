import { mockDb } from '@afro/common/mocks';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderRoute } from '@/test/renderRoute';

/** Scénario de démo n° 4 : Aïssatou, réservation terminée chez Douceurs Créoles, sans avis. */
const completedBooking = () => {
  const provider = mockDb.data.providers.find((p) => p.slug === 'douceurs-creoles')!;
  return mockDb.data.bookings.find(
    (b) => b.clientId === 'user-aissatou' && b.providerId === provider.id,
  )!;
};

describe('Laisser un avis (C6, règle n° 6)', () => {
  it('le bouton n’apparaît que sur la réservation terminée sans avis', async () => {
    renderRoute('/espace/reservations', { as: 'user-aissatou' });
    const upcoming = await screen.findByRole('region', { name: /À venir/ });
    expect(within(upcoming).queryByRole('link', { name: 'Laisser un avis' })).toBeNull();

    const past = screen.getByRole('region', { name: /Passées/ });
    const buttons = within(past).getAllByRole('link', { name: 'Laisser un avis' });
    expect(buttons).toHaveLength(1);
    expect(buttons[0]).toHaveAttribute('href', `/espace/avis/${completedBooking().id}`);
  });

  it('pas de formulaire pour une réservation pas encore terminée', async () => {
    const upcoming = mockDb.data.bookings.find(
      (b) => b.clientId === 'user-aissatou' && b.status === 'confirmed',
    )!;
    renderRoute(`/espace/avis/${upcoming.id}`, { as: 'user-aissatou' });
    expect(
      await screen.findByText('Tu pourras laisser un avis après l’événement.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Publier mon avis' })).toBeNull();
  });

  it('exige une note, puis publie l’avis et recalcule la note (règle n° 8)', async () => {
    const booking = completedBooking();
    renderRoute(`/espace/avis/${booking.id}`, { as: 'user-aissatou' });
    const submit = await screen.findByRole('button', { name: 'Publier mon avis' });

    await userEvent.click(submit);
    expect(await screen.findByText('Choisis une note de 1 à 5 étoiles')).toBeInTheDocument();

    const general = screen.getByRole('radiogroup', { name: 'Note générale' });
    await userEvent.click(within(general).getByRole('radio', { name: '5 étoiles' }));
    const quality = screen.getByRole('radiogroup', { name: 'Qualité de la prestation' });
    await userEvent.click(within(quality).getByRole('radio', { name: '5 étoiles' }));
    await userEvent.click(submit);
    expect(await screen.findByText('Note les trois critères, ou aucun')).toBeInTheDocument();

    for (const name of ['Ponctualité', 'Rapport qualité-prix']) {
      const group = screen.getByRole('radiogroup', { name });
      await userEvent.click(within(group).getByRole('radio', { name: '4 étoiles' }));
    }
    await userEvent.type(
      screen.getByLabelText('Ton commentaire (facultatif)'),
      'Un gâteau magnifique !',
    );
    await userEvent.click(submit);

    expect(await screen.findByText('Merci ! Ton avis est publié.')).toBeInTheDocument();
    const review = mockDb.data.reviews.find((r) => r.bookingId === booking.id)!;
    expect(review).toMatchObject({
      rating: 5,
      subRatings: { quality: 5, punctuality: 4, value: 4 },
      comment: 'Un gâteau magnifique !',
    });
    expect(await screen.findByText('Un gâteau magnifique !')).toBeInTheDocument();
  });
});

describe('Avis reçus (S8)', () => {
  it('répond une seule fois à un avis', async () => {
    renderRoute('/pro/avis', { as: 'user-saveurs-de-dakar' });
    expect(await screen.findByRole('heading', { level: 1, name: 'Avis reçus' })).toBeVisible();

    const [field] = screen.getAllByLabelText(/^Répondre à /);
    const author = field!.closest('article')!.getAttribute('aria-label')!;
    await userEvent.type(field!, 'Merci beaucoup pour votre confiance !');
    await userEvent.click(
      within(field!.closest('article')!).getByRole('button', { name: 'Publier la réponse' }),
    );

    const article = screen.getByRole('article', { name: author });
    await waitFor(() => expect(within(article).getByText('Ta réponse')).toBeInTheDocument());
    expect(within(article).getByText('Merci beaucoup pour votre confiance !')).toBeInTheDocument();
    expect(within(article).queryByRole('button', { name: 'Publier la réponse' })).toBeNull();
  });

  it('signale un avis comme faux', async () => {
    renderRoute('/pro/avis', { as: 'user-saveurs-de-dakar' });
    const [report] = await screen.findAllByRole('button', { name: /^Signaler l’avis de / });
    await userEvent.click(report!);
    expect(screen.getByRole('combobox', { name: 'Motif' })).toHaveValue('fake_review');
    await userEvent.click(screen.getByRole('button', { name: 'Envoyer le signalement' }));
    expect(await screen.findByText('Merci, ton signalement a bien été envoyé.')).toBeVisible();
    await waitFor(() =>
      expect(mockDb.data.reports.at(-1)).toMatchObject({
        targetType: 'review',
        reason: 'fake_review',
      }),
    );
  });
});
