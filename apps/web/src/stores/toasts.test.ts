import { afterEach, describe, expect, it, vi } from 'vitest';
import { toast, useToastStore } from './toasts';

afterEach(() => {
  vi.useRealTimers();
  useToastStore.setState({ toasts: [] });
});

describe('toasts', () => {
  it('un message à la fois, qui disparaît seul (5 s, 8 s avec une action)', () => {
    vi.useFakeTimers();
    toast({ title: 'Premier' });
    toast({ title: 'Événement supprimé', action: { label: 'Annuler', onClick: () => undefined } });
    expect(useToastStore.getState().toasts.map((t) => t.title)).toEqual(['Événement supprimé']);
    vi.advanceTimersByTime(5000);
    expect(useToastStore.getState().toasts).toHaveLength(1);
    vi.advanceTimersByTime(3000);
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it('« success » par défaut, fermeture à la main', () => {
    const id = toast({ title: 'Ok' });
    expect(useToastStore.getState().toasts[0]).toMatchObject({ tone: 'success' });
    useToastStore.getState().dismiss(id);
    expect(useToastStore.getState().toasts).toEqual([]);
  });
});
