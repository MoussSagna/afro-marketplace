import { scrollDecision } from './useCollapseOnScroll';

describe('scrollDecision : quand rétracter la barre d’onglets', () => {
  it('reste dépliée tout en haut de l’écran', () => {
    expect(scrollDecision(100, 20)).toBe('expand');
  });

  it('se rétracte quand on descend', () => {
    expect(scrollDecision(100, 160)).toBe('collapse');
  });

  it('revient quand on remonte', () => {
    expect(scrollDecision(400, 300)).toBe('expand');
  });

  it('ignore les tout petits mouvements', () => {
    expect(scrollDecision(100, 105)).toBeNull();
    expect(scrollDecision(100, 95)).toBeNull();
  });
});
