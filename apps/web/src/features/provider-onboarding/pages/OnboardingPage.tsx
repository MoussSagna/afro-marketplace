import {
  ApiError,
  PROVIDER_STATUS_LABELS,
  useMyProviderProfile,
  useUpdateMyProviderProfile,
  type MyProviderDetails,
  type UpdateProviderProfileInput,
} from '@afro/common';
import { ArrowLeft, ArrowRight, PartyPopper } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { Link, Navigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePageMeta } from '@/hooks/usePageMeta';
import { SubmitStep } from '../components/SubmitStep';
import { PROFILE_STEPS, SUMMARY_STEP, resumeStep } from '../lib/steps';

/** S1 : l'onboarding en étapes. Reprenable : on repart de `onboardingStep`. */
export function OnboardingPage() {
  const details = useMyProviderProfile();
  usePageMeta('Créer mon profil');

  if (details.isPending)
    return <Skeleton className="h-96 rounded-xl" role="status" aria-label="Chargement" />;
  if (details.isError) {
    if (details.error instanceof ApiError && details.error.status === 404) {
      return <Navigate to="/devenir-prestataire" replace />;
    }
    return (
      <p role="alert" className="rounded-lg bg-red-50 p-4 text-destructive">
        Impossible de charger ton profil.
      </p>
    );
  }
  const { status } = details.data.profile;
  if (status !== 'draft' && status !== 'changes_requested') {
    return <AlreadySubmitted status={status} />;
  }
  return <Wizard details={details.data} />;
}

function Wizard({ details }: { details: MyProviderDetails }) {
  const { profile } = details;
  const [step, setStep] = useState(() => resumeStep(profile.onboardingStep));
  // 1 = on avance (la nouvelle étape arrive par la droite), -1 = on recule.
  const [direction, setDirection] = useState(1);
  const update = useUpdateMyProviderProfile();

  function goTo(next: number) {
    setDirection(next > step ? 1 : -1);
    setStep(next);
    window.scrollTo?.({ top: 0 });
  }

  /** Enregistre l'étape, retient la progression, puis passe à la suivante. */
  async function saveAndContinue(input: UpdateProviderProfileInput) {
    const next = step + 1;
    await update.mutateAsync({ ...input, onboardingStep: Math.max(profile.onboardingStep, next) });
    goTo(next);
  }

  const current = PROFILE_STEPS[step - 1];
  const title = current?.title ?? 'Dernière vérification';
  const description =
    current?.description ??
    'Tout est prêt ? Envoie ton profil, on le relit avant sa mise en ligne.';
  const back =
    step > 1 ? (
      <Button type="button" variant="ghost" onClick={() => goTo(step - 1)}>
        <ArrowLeft aria-hidden />
        Retour
      </Button>
    ) : null;

  return (
    <section aria-labelledby="onboarding-title" className="mx-auto flex max-w-2xl flex-col gap-6">
      <header className="flex flex-col gap-3">
        <p className="text-sm font-medium text-muted-foreground">
          Étape {step} sur {SUMMARY_STEP}
        </p>
        <div
          role="progressbar"
          aria-label="Progression de l’inscription"
          aria-valuemin={1}
          aria-valuemax={SUMMARY_STEP}
          aria-valuenow={step}
          className="h-2 overflow-hidden rounded-full bg-secondary"
        >
          <motion.div
            className="h-full rounded-full bg-cta"
            initial={false}
            animate={{ width: `${(step / SUMMARY_STEP) * 100}%` }}
          />
        </div>
        {profile.status === 'changes_requested' && profile.rejectionReason && (
          <p role="note" className="rounded-lg bg-warning-muted p-4 text-sm">
            <span className="font-semibold">Corrections demandées :</span> {profile.rejectionReason}
          </p>
        )}
      </header>

      {/* La clé change à chaque étape : l'étape entre en glissant depuis le bon côté. */}
      <motion.div
        key={step}
        initial={{ opacity: 0, x: 32 * direction }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="flex flex-col gap-5 rounded-2xl border bg-card p-5 shadow-card sm:p-6"
      >
        <div>
          <h1 id="onboarding-title" className="text-2xl font-semibold sm:text-3xl">
            {title}
          </h1>
          <p className="mt-1 text-muted-foreground">{description}</p>
        </div>
        {current ? (
          <current.Section
            details={details}
            onSave={saveAndContinue}
            actions={
              <>
                {back}
                <Button type="submit" disabled={update.isPending}>
                  Continuer
                  <ArrowRight aria-hidden />
                </Button>
              </>
            }
          />
        ) : (
          <SubmitStep details={details} onGoToStep={goTo} back={back} />
        )}
      </motion.div>
      <p className="text-center text-sm text-muted-foreground">
        Chaque étape est enregistrée : tu peux t’arrêter et reprendre plus tard.
      </p>
    </section>
  );
}

function AlreadySubmitted({ status }: { status: keyof typeof PROVIDER_STATUS_LABELS }) {
  const pending = status === 'pending_review';
  return (
    <section className="mx-auto flex max-w-xl flex-col items-center gap-4 rounded-2xl border bg-card p-8 text-center">
      <PartyPopper className="size-10 text-title-accent" aria-hidden />
      <h1 className="text-2xl font-semibold">
        {pending ? 'Ton profil est envoyé !' : `Profil : ${PROVIDER_STATUS_LABELS[status]}`}
      </h1>
      <p className="text-muted-foreground">
        {pending
          ? 'Notre équipe le relit, en général sous 48 h. Tu recevras un message dès qu’il sera en ligne.'
          : 'Ton profil a déjà passé l’étape de l’inscription. Tu peux le modifier à tout moment.'}
      </p>
      <Button asChild>
        <Link to="/pro/profil">Voir mon profil</Link>
      </Button>
    </section>
  );
}
