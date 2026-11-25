import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useCarousel } from './useCarousel';

const options = { interval: 6000, autoplay: true, paused: false };

describe('useCarousel', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('passe à la slide suivante toutes les 6 secondes et revient au début', () => {
    const { result } = renderHook(() => useCarousel(3, options));
    expect(result.current.index).toBe(0);

    act(() => vi.advanceTimersByTime(5999));
    expect(result.current.index).toBe(0);
    act(() => vi.advanceTimersByTime(1));
    expect(result.current.index).toBe(1);
    act(() => vi.advanceTimersByTime(6000));
    expect(result.current.index).toBe(2);
    act(() => vi.advanceTimersByTime(6000));
    expect(result.current.index).toBe(0);
  });

  it('navigation manuelle : suivante, précédente (en boucle) et aller à', () => {
    const { result } = renderHook(() => useCarousel(3, options));

    act(() => result.current.previous());
    expect(result.current.index).toBe(2);
    act(() => result.current.next());
    expect(result.current.index).toBe(0);
    act(() => result.current.goTo(1));
    expect(result.current.index).toBe(1);
  });

  it('une action manuelle relance le minuteur', () => {
    const { result } = renderHook(() => useCarousel(3, options));

    act(() => vi.advanceTimersByTime(5000));
    act(() => result.current.goTo(2));
    act(() => vi.advanceTimersByTime(5000));
    expect(result.current.index).toBe(2); // pas encore 6 s depuis le clic
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.index).toBe(0);
  });

  it('ne défile pas pendant une pause (interaction, onglet masqué)', () => {
    const { result, rerender } = renderHook((props) => useCarousel(3, props), {
      initialProps: { ...options, paused: true },
    });

    act(() => vi.advanceTimersByTime(20000));
    expect(result.current.index).toBe(0);

    rerender({ ...options, paused: false });
    act(() => vi.advanceTimersByTime(6000));
    expect(result.current.index).toBe(1);
  });

  it('« réduire les animations » : aucun défilement automatique', () => {
    const { result } = renderHook(() => useCarousel(3, { ...options, autoplay: false }));

    act(() => vi.advanceTimersByTime(20000));
    expect(result.current.index).toBe(0);
  });
});
