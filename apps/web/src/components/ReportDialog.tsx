import {
  ApiError,
  REPORT_REASON_LABELS,
  useCreateReport,
  type ReportReason,
  type ReportTargetType,
} from '@afro/common';
import { Flag } from 'lucide-react';
import { useId, useState } from 'react';
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
import { NativeSelect } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';

interface ReportDialogProps {
  targetType: ReportTargetType;
  targetId: string;
  /** Le texte du bouton, lu par les lecteurs d'écran (« Signaler ce message »). */
  label: string;
  /** Les motifs proposés (par défaut : tous sauf « faux avis »). */
  reasons?: ReportReason[];
}

/**
 * Le bouton « Signaler » et sa fenêtre. Réutilisable pour un message,
 * un profil ou un avis : le signalement part chez l'admin (lot 8).
 */
export function ReportDialog({
  targetType,
  targetId,
  label,
  reasons = ['fraud', 'inappropriate', 'spam', 'other'],
}: ReportDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>(reasons[0]!);
  const [details, setDetails] = useState('');
  const report = useCreateReport();
  const reasonId = useId();
  const detailsId = useId();

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) report.reset();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          aria-label={label}
          className="h-7 px-2 text-xs text-muted-foreground"
        >
          <Flag aria-hidden />
          <span className="hidden sm:inline">Signaler</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Signaler</DialogTitle>
          <DialogDescription>
            Notre équipe examine chaque signalement. La personne signalée ne sait pas qui l’a
            signalée.
          </DialogDescription>
        </DialogHeader>
        {report.isSuccess ? (
          <p role="status" className="rounded-lg bg-success-muted p-4 text-success">
            Merci, ton signalement a bien été envoyé.
          </p>
        ) : (
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              report.mutate({
                targetType,
                targetId,
                reason,
                details: details.trim() || undefined,
              });
            }}
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor={reasonId}>Motif</Label>
              <NativeSelect
                id={reasonId}
                value={reason}
                onChange={(event) => setReason(event.target.value as ReportReason)}
              >
                {reasons.map((value) => (
                  <option key={value} value={value}>
                    {REPORT_REASON_LABELS[value]}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={detailsId}>Précisions (facultatif)</Label>
              <Textarea
                id={detailsId}
                rows={3}
                maxLength={1000}
                value={details}
                onChange={(event) => setDetails(event.target.value)}
              />
            </div>
            {report.isError && (
              <p role="alert" className="text-sm text-destructive">
                {report.error instanceof ApiError ? report.error.message : 'L’envoi a échoué.'}
              </p>
            )}
            <DialogFooter>
              <Button type="submit" disabled={report.isPending}>
                Envoyer le signalement
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
