import {
  ApiError,
  getMissingProfileRequirements,
  useSubmitMyProviderProfile,
  type MyProviderDetails,
  type ProfileRequirement,
} from '@afro/common';
import { CheckCircle2, Circle, Send } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { SectionActions } from './ProfileSections';

/** Les 4 conditions de la règle n° 2, et l'étape où les remplir. */
const REQUIREMENTS: { requirement: ProfileRequirement; label: string; step: number }[] = [
  { requirement: 'category', label: 'Au moins une catégorie', step: 2 },
  { requirement: 'city', label: 'Ta ville', step: 3 },
  { requirement: 'images', label: 'Au moins 3 photos', step: 4 },
  { requirement: 'offering', label: 'Au moins une formule active', step: 5 },
];

/** Dernière étape de S1 : la checklist de la règle n° 2, puis l'envoi en validation. */
export function SubmitStep({
  details,
  onGoToStep,
  back,
}: {
  details: MyProviderDetails;
  onGoToStep: (step: number) => void;
  back: ReactNode;
}) {
  const submit = useSubmitMyProviderProfile();
  const missing = getMissingProfileRequirements(details.profile, details.media, details.offerings);
  const isMissing = (r: ProfileRequirement) => missing.some((m) => m.requirement === r);

  return (
    <div className="flex flex-col gap-5">
      <ul className="flex flex-col gap-2" aria-label="Ce qu’il faut pour publier">
        {REQUIREMENTS.map(({ requirement, label, step }) => {
          const done = !isMissing(requirement);
          return (
            <li key={requirement} className="flex items-center gap-3 rounded-xl border bg-card p-3">
              {done ? (
                <CheckCircle2 className="size-5 text-success" aria-hidden />
              ) : (
                <Circle className="size-5 text-muted-foreground" aria-hidden />
              )}
              <span className="flex-1">
                {label}
                <span className="sr-only">{done ? ' : fait' : ' : à faire'}</span>
              </span>
              {!done && (
                <Button type="button" variant="link" size="sm" onClick={() => onGoToStep(step)}>
                  Compléter
                </Button>
              )}
            </li>
          );
        })}
      </ul>
      <p className="text-sm text-muted-foreground">
        Notre équipe relit chaque profil avant sa mise en ligne, en général sous 48 h. L’inscription
        est gratuite.
      </p>
      {submit.isError && (
        <p role="alert" className="text-sm text-destructive">
          {submit.error instanceof ApiError ? submit.error.message : 'L’envoi a échoué.'}
        </p>
      )}
      <SectionActions>
        {back}
        <Button
          type="button"
          variant="cta"
          disabled={missing.length > 0 || submit.isPending}
          onClick={() => submit.mutate()}
        >
          <Send aria-hidden />
          Envoyer mon profil en validation
        </Button>
      </SectionActions>
    </div>
  );
}
