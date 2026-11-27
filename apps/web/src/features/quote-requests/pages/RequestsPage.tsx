import { useQuoteRequests, type Side } from '@afro/common';
import { FileText, Plus, SearchX } from 'lucide-react';
import { Link, useSearchParams } from 'react-router';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClientDashboardSummary } from '@/features/client-dashboard/components/ClientDashboardSummary';
import { usePageMeta } from '@/hooks/usePageMeta';
import { RequestCard } from '../components/RequestCard';
import { requestTab, type RequestTab } from '../lib/requestStatus';
import { SPACE_PATHS } from '../lib/spacePaths';

const TABS: Record<Side, { value: RequestTab; label: string; empty: string }[]> = {
  client: [
    { value: 'open', label: 'En cours', empty: 'Aucune demande en cours.' },
    { value: 'booked', label: 'Réservations', empty: 'Pas encore de réservation.' },
    { value: 'closed', label: 'Terminées', empty: 'Aucune demande terminée.' },
  ],
  provider: [
    { value: 'open', label: 'En cours', empty: 'Aucune demande à traiter pour le moment.' },
    { value: 'booked', label: 'Réservées', empty: 'Pas encore de réservation.' },
    { value: 'closed', label: 'Archivées', empty: 'Aucune demande archivée.' },
  ],
};

/**
 * « Nouvelle demande » : une demande se fait depuis le profil d'un prestataire
 * (`/prestataires/:slug/demande`) ; on commence donc par en trouver un.
 */
const NEW_REQUEST_URL = '/recherche';

/**
 * C2 « Mes demandes » (côté client) et S3 « Demandes reçues » (côté prestataire) :
 * la même page, avec le côté en paramètre. L'onglet choisi est gardé dans
 * l'adresse (`?onglet=`) pour que le bouton « retour » y ramène.
 *
 * Côté client, c'est aussi le tableau de bord de l'espace : bannière « Bonjour … »
 * et 3 chiffres (`ClientDashboardSummary`) au-dessus de la liste.
 */
export function RequestsPage({ side }: { side: Side }) {
  const requests = useQuoteRequests(side);
  const [searchParams, setSearchParams] = useSearchParams();
  const tabs = TABS[side];
  const current = tabs.find((t) => t.value === searchParams.get('onglet'))?.value ?? 'open';
  const title = side === 'client' ? 'Mes demandes' : 'Demandes reçues';
  const isClient = side === 'client';
  usePageMeta(title);

  return (
    <div className="flex flex-col gap-8 sm:gap-10">
      {isClient && <ClientDashboardSummary requests={requests.data} />}

      <section aria-labelledby="requests-title" className="flex flex-col gap-5 sm:gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1
            id="requests-title"
            className="font-display text-[28px] font-semibold sm:text-4xl lg:text-[40px]"
          >
            {title}
          </h1>
          {isClient && (
            <Button
              asChild
              size="lg"
              className="h-12 rounded-full px-6 text-base font-semibold shadow-card has-[>svg]:px-6 sm:h-[54px] sm:px-7 sm:text-lg"
            >
              <Link to={NEW_REQUEST_URL}>
                <Plus aria-hidden className="size-5" />
                Nouvelle demande
              </Link>
            </Button>
          )}
        </div>

        {requests.isPending && (
          <div className="flex flex-col gap-4" role="status" aria-label="Chargement">
            <Skeleton className="h-14 w-full max-w-[545px] rounded-full" />
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
          </div>
        )}
        {requests.isError && (
          <p role="alert" className="rounded-xl bg-red-50 p-4 text-destructive">
            Impossible de charger les demandes. Réessaie dans un instant.
          </p>
        )}
        {requests.isSuccess && requests.data.length === 0 && (
          <EmptyState
            icon={FileText}
            title={isClient ? 'Pas encore de demande' : 'Pas encore de demande reçue'}
            description={
              isClient
                ? 'Trouve un prestataire et demande-lui un devis : c’est gratuit et sans engagement.'
                : 'Les demandes des clients arriveront ici. Un profil complet en reçoit plus !'
            }
            action={
              isClient && (
                <Button asChild className="rounded-full">
                  <Link to={NEW_REQUEST_URL}>
                    <Plus aria-hidden /> Faire une première demande
                  </Link>
                </Button>
              )
            }
          />
        )}
        {requests.isSuccess && requests.data.length > 0 && (
          <Tabs
            value={current}
            onValueChange={(value) => setSearchParams({ onglet: value }, { replace: true })}
            className="gap-5 sm:gap-6"
          >
            <TabsList className="h-auto w-full gap-1 rounded-full border bg-card p-1 text-foreground shadow-card sm:w-fit">
              {tabs.map((tab) => {
                const count = requests.data.filter(
                  (s) => requestTab(s.request.status) === tab.value,
                ).length;
                return (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="h-10 flex-1 rounded-full border-0 px-3 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-muted data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-xs data-[state=active]:hover:bg-primary sm:h-12 sm:flex-none sm:px-7 sm:text-[17px]"
                  >
                    {tab.label} ({count})
                  </TabsTrigger>
                );
              })}
            </TabsList>
            {tabs.map((tab) => {
              const items = requests.data.filter((s) => requestTab(s.request.status) === tab.value);
              return (
                <TabsContent key={tab.value} value={tab.value}>
                  {items.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed bg-card/60 px-6 py-12 text-center">
                      <SearchX className="size-8 text-muted-foreground" aria-hidden />
                      <p className="text-muted-foreground">{tab.empty}</p>
                    </div>
                  ) : (
                    <ul className="flex flex-col gap-3 sm:gap-4">
                      {items.map((summary) => (
                        <li key={summary.request.id}>
                          <RequestCard
                            summary={summary}
                            side={side}
                            to={`${SPACE_PATHS[side].requests}/${summary.request.id}`}
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        )}
      </section>
    </div>
  );
}
