import { useQuoteRequests, type Side } from '@afro/common';
import { FileText } from 'lucide-react';
import { Link, useSearchParams } from 'react-router';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
 * C2 « Mes demandes » (côté client) et S3 « Demandes reçues » (côté prestataire) :
 * la même page, avec le côté en paramètre. L'onglet choisi est gardé dans
 * l'adresse (`?onglet=`) pour que le bouton « retour » y ramène.
 */
export function RequestsPage({ side }: { side: Side }) {
  const requests = useQuoteRequests(side);
  const [searchParams, setSearchParams] = useSearchParams();
  const tabs = TABS[side];
  const current = tabs.find((t) => t.value === searchParams.get('onglet'))?.value ?? 'open';
  const title = side === 'client' ? 'Mes demandes' : 'Demandes reçues';
  usePageMeta(title);

  return (
    <section aria-labelledby="requests-title">
      <h1 id="requests-title" className="mb-6 text-3xl font-semibold">
        {title}
      </h1>

      {requests.isPending && (
        <div className="flex flex-col gap-3" aria-label="Chargement">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      )}
      {requests.isError && (
        <p role="alert" className="rounded-lg bg-red-50 p-4 text-destructive">
          Impossible de charger les demandes. Réessaie dans un instant.
        </p>
      )}
      {requests.isSuccess && requests.data.length === 0 && (
        <EmptyState
          icon={FileText}
          title={side === 'client' ? 'Pas encore de demande' : 'Pas encore de demande reçue'}
          description={
            side === 'client'
              ? 'Trouve un prestataire et demande-lui un devis : c’est gratuit et sans engagement.'
              : 'Les demandes des clients arriveront ici. Un profil complet en reçoit plus !'
          }
          action={
            side === 'client' && (
              <Button asChild>
                <Link to="/recherche">Trouver un prestataire</Link>
              </Button>
            )
          }
        />
      )}
      {requests.isSuccess && requests.data.length > 0 && (
        <Tabs
          value={current}
          onValueChange={(value) => setSearchParams({ onglet: value }, { replace: true })}
        >
          <TabsList>
            {tabs.map((tab) => {
              const count = requests.data.filter(
                (s) => requestTab(s.request.status) === tab.value,
              ).length;
              return (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label} ({count})
                </TabsTrigger>
              );
            })}
          </TabsList>
          {tabs.map((tab) => {
            const items = requests.data.filter((s) => requestTab(s.request.status) === tab.value);
            return (
              <TabsContent key={tab.value} value={tab.value} className="mt-4">
                {items.length === 0 ? (
                  <p className="py-8 text-center text-muted-foreground">{tab.empty}</p>
                ) : (
                  <ul className="flex flex-col gap-3">
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
  );
}
