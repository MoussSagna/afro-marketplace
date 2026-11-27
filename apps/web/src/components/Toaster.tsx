import { CircleCheck, Info, X } from 'lucide-react';
import { useToastStore } from '@/stores/toasts';
import { cn } from '@/lib/utils';

/**
 * L'affichage des toasts, une seule fois dans l'application (route racine) : en bas à droite sur
 * ordinateur, en bas sur téléphone (au-dessus des boutons collants). Lu par les lecteurs d'écran.
 */
export function Toaster() {
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-24 z-[60] flex flex-col items-end gap-3 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[400px]"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={cn(
            'pointer-events-auto flex w-full animate-in items-start gap-3 rounded-xl border border-l-4 bg-card p-4 pl-4 shadow-pop duration-300 fade-in slide-in-from-bottom-2 motion-reduce:animate-none',
            t.tone === 'success' ? 'border-l-success' : 'border-l-ochre',
          )}
        >
          <span
            aria-hidden
            className={cn(
              'flex size-8 shrink-0 items-center justify-center rounded-full',
              t.tone === 'success' ? 'bg-success text-white' : 'bg-muted text-primary',
            )}
          >
            {t.tone === 'success' ? (
              <CircleCheck className="size-5" />
            ) : (
              <Info className="size-5" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{t.title}</p>
            {t.description && <p className="text-sm text-muted-foreground">{t.description}</p>}
          </div>
          {t.action && (
            <button
              type="button"
              onClick={() => {
                dismiss(t.id);
                t.action!.onClick();
              }}
              className="rounded-md px-2 py-1 text-sm font-bold text-primary transition-colors outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring"
            >
              {t.action.label}
            </button>
          )}
          <button
            type="button"
            aria-label="Fermer la notification"
            onClick={() => dismiss(t.id)}
            className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      ))}
    </div>
  );
}
