import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange(open: boolean): void;
  icon: LucideIcon;
  title: string;
  description: ReactNode;
  /** Une précision sous la description (avertissement). */
  note?: ReactNode;
  confirmLabel: string;
  onConfirm(): void;
  pending?: boolean;
  error?: string | null;
}

/**
 * Confirmer une action sensible (retirer un prestataire, supprimer un événement).
 * Le focus arrive sur « Annuler » : le choix le moins risqué. Échap et clic à côté ferment.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  icon: Icon,
  title,
  description,
  note,
  confirmLabel,
  onConfirm,
  pending,
  error,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md gap-5 rounded-2xl p-7 text-center sm:max-w-md"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          (event.currentTarget as HTMLElement)
            .querySelector<HTMLButtonElement>('[data-cancel]')
            ?.focus();
        }}
      >
        <DialogHeader className="items-center gap-3 text-center sm:text-center">
          <span
            aria-hidden
            className="flex size-16 items-center justify-center rounded-full bg-red-50 text-destructive"
          >
            <Icon className="size-8" strokeWidth={1.7} />
          </span>
          <DialogTitle className="font-display text-2xl font-bold">{title}</DialogTitle>
          <DialogDescription className="text-base text-muted-foreground">
            {description}
          </DialogDescription>
        </DialogHeader>
        {note && <p className="rounded-lg bg-warning-muted p-3 text-sm text-warning">{note}</p>}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <DialogFooter className="grid grid-cols-2 gap-3 sm:justify-normal">
          <Button
            data-cancel
            variant="outline"
            size="lg"
            className="h-11"
            onClick={() => onOpenChange(false)}
          >
            Annuler
          </Button>
          <Button
            variant="destructive"
            size="lg"
            className="h-11"
            disabled={pending}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
