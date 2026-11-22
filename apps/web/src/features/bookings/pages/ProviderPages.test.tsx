import { mockDb } from '@afro/common/mocks';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderRoute } from '@/test/renderRoute';

describe('Mes réservations (client)', () => {
  it('sépare les réservations à venir des passées', async () => {
    renderRoute('/espace/reservations', { as: 'user-aissatou' });
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Mes réservations' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /À venir \(\d+\)/ })).toBeInTheDocument();
  });
});

describe('Tableau de bord (S2)', () => {
  it('affiche les 3 chiffres et les demandes récentes', async () => {
    renderRoute('/pro', { as: 'user-saveurs-de-dakar' });
    expect(await screen.findByText('demandes à traiter')).toBeInTheDocument();
    expect(screen.getByText('réservations à venir')).toBeInTheDocument();
    expect(screen.getByText(/note moyenne \(\d+ avis\)/)).toBeInTheDocument();
    const recent = screen.getByRole('region', { name: 'Demandes récentes' });
    expect(within(recent).getAllByRole('article').length).toBeGreaterThan(0);
  });
});

describe('Agenda (S6)', () => {
  it('bloque puis débloque un jour libre', async () => {
    renderRoute('/pro/agenda', { as: 'user-saveurs-de-dakar' });
    await userEvent.click(await screen.findByRole('button', { name: 'Mois suivant' }));
    const [free] = await screen.findAllByRole('button', { name: /libre, cliquer pour bloquer/ });
    const name = free!.getAttribute('aria-label')!.split(' : ')[0]!;

    await userEvent.click(free!);
    const blocked = await screen.findByRole('button', {
      name: `${name} : bloqué, cliquer pour débloquer`,
    });
    expect(blocked).toHaveAttribute('aria-pressed', 'true');

    await userEvent.click(blocked);
    expect(
      await screen.findByRole('button', { name: `${name} : libre, cliquer pour bloquer` }),
    ).toBeInTheDocument();
  });

  it('enregistre le maximum de réservations par jour', async () => {
    renderRoute('/pro/agenda', { as: 'user-saveurs-de-dakar' });
    const input = await screen.findByLabelText('Réservations maximum par jour');
    await waitFor(() => expect(input).not.toHaveValue(''));
    await userEvent.clear(input);
    await userEvent.type(input, '3');
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(await screen.findByText('Réglage enregistré.')).toBeInTheDocument();
    expect(
      mockDb.data.providers.find((p) => p.slug === 'saveurs-de-dakar')!.maxBookingsPerDay,
    ).toBe(3);
  });
});
