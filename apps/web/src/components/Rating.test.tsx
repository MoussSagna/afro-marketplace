import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Rating } from './Rating';

describe('Rating', () => {
  it('annonce la note et le nombre d’avis aux lecteurs d’écran', () => {
    render(<Rating value={4.5} count={12} />);
    expect(screen.getByRole('img', { name: 'Note : 4,5 sur 5, 12 avis' })).toBeInTheDocument();
  });

  it('fonctionne sans nombre d’avis', () => {
    render(<Rating value={5} />);
    expect(screen.getByRole('img', { name: 'Note : 5,0 sur 5' })).toBeInTheDocument();
  });

  it('affiche « Nouveau » quand il n’y a aucun avis', () => {
    render(<Rating value={0} count={0} />);
    expect(screen.getByText('Nouveau')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
