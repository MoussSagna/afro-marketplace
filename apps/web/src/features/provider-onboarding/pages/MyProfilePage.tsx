import {
  ApiError,
  PROVIDER_STATUS_LABELS,
  summarize,
  useMyProviderProfile,
  useSetMyProviderProfilePaused,
  useUpdateMyProviderProfile,
  type MyProviderDetails,
  type ProviderStatus,
  type UpdateProviderProfileInput,
} from '@afro/common';
import { ExternalLink, Pause, Play } from 'lucide-react';
import { useState } from 'react';
import { Link, Navigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePageMeta } from '@/hooks/usePageMeta';
import { cn } from '@/lib/utils';
import { ProviderCard } from '@/features/search/components/ProviderCard';
import { PROFILE_STEPS } from '../lib/steps';

const STATUS_STYLES: Record<ProviderStatus, string> = {
  draft: 'bg-secondary text-muted-foreground',
  pending_review: 'bg-warning-muted text-foreground',
  changes_requested: 'bg-warning-muted text-foreground',
  published: 'bg-success-muted text-success',
  rejected: 'bg-red-50 text-destructive',
  paused: 'bg-secondary text-muted-foreground',
  suspended: 'bg-red-50 text-destructive',
};

/** S7 : modifier son profil, le prévisualiser, le mettre en pause. */
export function MyProfilePage() {
  const details = useMyProviderProfile();
  usePageMeta('Mon profil');

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
  return <ProfileEditor details={details.data} />;
}

function ProfileEditor({ details }: { details: MyProviderDetails }) {
  const { profile } = details;
  const update = useUpdateMyProviderProfile();
  const pause = useSetMyProviderProfilePaused();
  const [savedTab, setSavedTab] = useState<string | null>(null);
  const isVisible = profile.status === 'published';
  const inOnboarding = profile.status === 'draft' || profile.status === 'changes_requested';

  return (
    <section aria-labelledby="profile-title" className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 id="profile-title" className="text-3xl font-semibold">
            Mon profil
          </h1>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            Statut :
            <span
              className={cn(
                'rounded-full px-2.5 py-0.5 text-xs font-semibold',
                STATUS_STYLES[profile.status],
              )}
            >
              {PROVIDER_STATUS_LABELS[profile.status]}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {inOnboarding && (
            <Button asChild variant="cta">
              <Link to="/pro/onboarding">Terminer mon inscription</Link>
            </Button>
          )}
          {(profile.status === 'published' || profile.status === 'paused') && (
            <Button
              variant="outline"
              disabled={pause.isPending}
              onClick={() => pause.mutate(profile.status === 'published')}
            >
              {profile.status === 'published' ? (
                <>
                  <Pause aria-hidden />
                  Mettre en pause
                </>
              ) : (
                <>
                  <Play aria-hidden />
                  Réactiver mon profil
                </>
              )}
            </Button>
          )}
          {isVisible && (
            <Button asChild variant="ghost">
              <Link to={`/prestataires/${profile.slug}`}>
                <ExternalLink aria-hidden />
                Voir ma page publique
              </Link>
            </Button>
          )}
        </div>
      </header>

      {profile.status === 'paused' && (
        <p role="status" className="rounded-lg bg-secondary p-4 text-sm">
          Ton profil est en pause : il n’apparaît plus dans la recherche et ne reçoit plus de
          demandes. Tes réservations en cours ne changent pas.
        </p>
      )}
      {profile.status === 'changes_requested' && profile.rejectionReason && (
        <p role="note" className="rounded-lg bg-warning-muted p-4 text-sm">
          <span className="font-semibold">Corrections demandées :</span> {profile.rejectionReason}
        </p>
      )}
      {pause.isError && (
        <p role="alert" className="text-sm text-destructive">
          {pause.error instanceof ApiError ? pause.error.message : 'L’action a échoué.'}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
        <Tabs defaultValue={PROFILE_STEPS[0]!.key} onValueChange={() => setSavedTab(null)}>
          <TabsList className="h-auto w-full flex-wrap justify-start">
            {PROFILE_STEPS.map((step) => (
              <TabsTrigger key={step.key} value={step.key} className="h-8 flex-none">
                {step.title}
              </TabsTrigger>
            ))}
          </TabsList>
          {PROFILE_STEPS.map((step) => (
            <TabsContent
              key={step.key}
              value={step.key}
              className="mt-4 rounded-2xl border bg-card p-5"
            >
              <p className="mb-4 text-muted-foreground">{step.description}</p>
              <step.Section
                details={details}
                onSave={async (input: UpdateProviderProfileInput) => {
                  setSavedTab(null);
                  await update.mutateAsync(input);
                  setSavedTab(step.key);
                }}
                actions={
                  <>
                    {savedTab === step.key && (
                      <p role="status" className="text-sm text-success">
                        Modifications enregistrées.
                      </p>
                    )}
                    <Button type="submit" disabled={update.isPending}>
                      Enregistrer
                    </Button>
                  </>
                }
              />
            </TabsContent>
          ))}
        </Tabs>

        <aside aria-labelledby="preview-title" className="flex flex-col gap-3">
          <h2 id="preview-title" className="font-sans text-base font-semibold">
            Aperçu dans les résultats
          </h2>
          {/* « inert » : l’aperçu ne se clique pas et sort du parcours clavier. */}
          <div inert>
            <ProviderCard
              provider={{
                ...profile,
                city: profile.city || 'Ta ville',
                summary: summarize(profile.bio),
              }}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            C’est ainsi que les clients voient ton profil dans la recherche.
          </p>
        </aside>
      </div>
    </section>
  );
}
