import { ApiError } from '@afro/common';
import { useId, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ReasonDialogProps {
  /** Le bouton qui ouvre la fenêtre. */
  trigger: ReactNode;
  title: string;
  description: string;
  confirmLabel: string;
  /** Nombre de caractères minimum du motif (0 = facultatif). */
  minLength: number;
  onConfirm: (reason: string) => Promise<unknown>;
  destructive?: boolean;
}

/**
 * Une décision d'admin qui demande un motif (corrections, refus, suspension).
 * Le motif est inscrit au journal de modération et, selon le cas, montré à l'intéressé.
 */
export function ReasonDialog({
  trigger,
  title,
  description,
  confirmLabel,
  minLength,
  onConfirm,
  destructive,
}: ReasonDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const fieldId = useId();
  const tooShort = reason.trim().length < minLength;

  async function confirm() {
    setError(null);
    setPending(true);
    try {
      await onConfirm(reason.trim());
      setOpen(false);
      setReason('');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'L’action a échoué.');
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor={fieldId}>
            Motif{minLength === 0 ? ' (facultatif)' : ` (${minLength} caractères minimum)`}
          </Label>
          <Textarea
            id={fieldId}
            rows={4}
            maxLength={1000}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <DialogFooter>
          <Button
            type="button"
            variant={destructive ? 'destructive' : 'default'}
            disabled={tooShort || pending}
            onClick={confirm}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
