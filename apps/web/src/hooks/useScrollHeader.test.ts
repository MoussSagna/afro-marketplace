import { act, fireEvent, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useScrollHeader } from './useScrollHeader';

/** Fait défiler la page jusqu'à `y` et attend l'image suivante (le hook calcule une fois par image). */
async function scrollTo(y: number) {
  await act(async () => {
    Object.defineProperty(window, 'scrollY', { value: y, configurable: true });
    fireEvent.scroll(window);
    await new Promise((resolve) => requestAnimationFrame(resolve));
  });
}

describe('useScrollHeader', () => {
  afterEach(() => scrollTo(0));

  it('en haut de page : ni compacte, ni cachée', () => {
    const { result } = renderHook(() => useScrollHeader());
    expect(result.current).toEqual({ scrolled: false, hidden: false });
  });

  it('compacte dès qu’on quitte le haut, sans se cacher avant `hideAfter`', async () => {
    const { result } = renderHook(() => useScrollHeader());
    await scrollTo(200);
    expect(result.current).toEqual({ scrolled: true, hidden: false });
  });

  it('se cache en descendant, revient dès qu’on remonte', async () => {
    const { result } = renderHook(() => useScrollHeader());
    await scrollTo(400);
    await scrollTo(800);
    expect(result.current.hidden).toBe(true);
    await scrollTo(700);
    expect(result.current.hidden).toBe(false);
    expect(result.current.scrolled).toBe(true);
  });

  it('ignore les tout petits mouvements (pas de clignotement)', async () => {
    const { result } = renderHook(() => useScrollHeader());
    await scrollTo(400);
    await scrollTo(800);
    await scrollTo(797); // 3 px vers le haut : sous la tolérance de 6 px
    expect(result.current.hidden).toBe(true);
  });

  it('réapparaît toujours en revenant en haut de page', async () => {
    const { result } = renderHook(() => useScrollHeader());
    await scrollTo(400);
    await scrollTo(900);
    await scrollTo(100);
    expect(result.current).toEqual({ scrolled: true, hidden: false });
  });

  it('ne se cache jamais si `canHide` est faux (« réduire les animations »)', async () => {
    const { result } = renderHook(() => useScrollHeader({ canHide: false }));
    await scrollTo(400);
    await scrollTo(1200);
    expect(result.current).toEqual({ scrolled: true, hidden: false });
  });
});
