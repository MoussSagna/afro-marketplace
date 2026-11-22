import { render, screen } from '@testing-library/react';
import { Inbox } from 'lucide-react';
import { describe, expect, it } from 'vitest';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('affiche le titre, l’explication et l’action', () => {
    render(
      <EmptyState
        icon={Inbox}
        title="Aucune demande"
        description="Tes demandes de devis apparaîtront ici."
        action={<a href="/recherche">Trouver un prestataire</a>}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Aucune demande' })).toBeInTheDocument();
    expect(screen.getByText('Tes demandes de devis apparaîtront ici.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Trouver un prestataire' })).toHaveAttribute(
      'href',
      '/recherche',
    );
  });
});
