import { create } from 'zustand';

export interface Toast {
  id: number;
  title: string;
  description?: string;
  /** « info » pour un avertissement (demande refusée…), « success » sinon. */
  tone: 'success' | 'info';
  /** Une action dans le toast (« Annuler » après une suppression). */
  action?: { label: string; onClick: () => void };
}

interface ToastsState {
  toasts: Toast[];
  show(toast: Omit<Toast, 'id' | 'tone'> & { tone?: Toast['tone']; duration?: number }): number;
  dismiss(id: number): void;
}

let nextId = 1;
/** Le toast reste 5 s, 8 s s'il propose une action (le temps de cliquer « Annuler »). */
const DEFAULT_DURATION = 5000;
const ACTION_DURATION = 8000;

/**
 * Les messages éphémères (« toasts ») : un store global, pour qu'un message survive à une
 * navigation (« Événement supprimé » s'affiche sur la liste, après avoir quitté le détail).
 */
export const useToastStore = create<ToastsState>()((set, get) => ({
  toasts: [],
  show({ duration, tone = 'success', ...toast }) {
    const id = nextId++;
    // Un seul message à la fois : le plus récent remplace le précédent.
    set({ toasts: [{ id, tone, ...toast }] });
    const ms = duration ?? (toast.action ? ACTION_DURATION : DEFAULT_DURATION);
    if (ms > 0) setTimeout(() => get().dismiss(id), ms);
    return id;
  },
  dismiss(id) {
    set(({ toasts }) => ({ toasts: toasts.filter((t) => t.id !== id) }));
  },
}));

/** Raccourci : `toast({ title: 'Prestataire ajouté' })`. */
export const toast = (...args: Parameters<ToastsState['show']>) =>
  useToastStore.getState().show(...args);
