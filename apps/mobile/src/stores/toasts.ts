import { create } from 'zustand';

export interface Toast {
  id: number;
  title: string;
  description?: string;
  /** « info » pour un avertissement (envoi refusé…), « success » sinon. */
  tone: 'success' | 'info';
  /** Une action dans le toast (« Annuler » après une suppression). */
  action?: { label: string; onPress: () => void };
}

type ShowToast = Omit<Toast, 'id' | 'tone'> & { tone?: Toast['tone']; duration?: number };

interface ToastsState {
  toasts: Toast[];
  show(toast: ShowToast): number;
  dismiss(id: number): void;
}

let nextId = 1;
/** Le toast reste 5 s, 8 s s'il propose une action (le temps de toucher « Annuler »). */
const DEFAULT_DURATION = 5000;
const ACTION_DURATION = 8000;

/**
 * Les messages éphémères de l'app (comme `stores/toasts.ts` du site) : un store global, pour qu'un
 * message survive à un changement d'écran (« Événement supprimé » s'affiche sur la liste).
 * Un seul à la fois : le plus récent remplace le précédent.
 */
export const useToastStore = create<ToastsState>()((set, get) => ({
  toasts: [],
  show({ duration, tone = 'success', ...toast }) {
    const id = nextId++;
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
export const toast = (options: ShowToast) => useToastStore.getState().show(options);
