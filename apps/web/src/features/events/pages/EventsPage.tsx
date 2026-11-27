import { useEvents } from '@afro/common';
import { CalendarCheck, Plus, Sparkles } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePageMeta } from '@/hooks/usePageMeta';
import { EventCard } from '../components/EventCard';

const NEW_EVENT_URL = '/evenements/nouveau';

/**
 * « Mes événements » : la page ouverte par « Événements » dans la navbar (planificateur).
 * Le client y retrouve ses événements ; chacun mène à son détail.
 */
export function EventsPage() {
  const events = useEvents();
  usePageMeta('Mes événements');

  return (
    <section aria-labelledby="events-title" className="flex flex-col gap-5 sm:gap-6">
      <header className="flex items-center justify-between gap-4 sm:items-end">
        <div className="min-w-0">
          <h1 id="events-title" className="text-[26px] leading-tight font-bold sm:text-4xl">
            Mes événements
          </h1>
          <p className="mt-1 text-sm text-muted-foreground sm:mt-1.5 sm:text-base">
            Planifiez vos événements et gérez vos prestataires.
          </p>
        </div>
        {events.isSuccess && events.data.length > 0 && (
          <Button
            asChild
            variant="cta"
            size="lg"
            className="h-10 shrink-0 sm:h-11 has-[>svg]:px-4 sm:has-[>svg]:px-5"
          >
            <Link to={NEW_EVENT_URL}>
              <Plus aria-hidden />
              <span className="sm:hidden">Créer</span>
              <span className="hidden sm:inline">Créer mon événement</span>
            </Link>
          </Button>
        )}
      </header>

      {events.isPending && (
        <div role="status" aria-label="Chargement" className="flex flex-col gap-4">
          <Skeleton className="h-[140px] rounded-2xl" />
          <Skeleton className="h-[140px] rounded-2xl" />
        </div>
      )}
      {events.isError && (
        <p role="alert" className="rounded-xl bg-red-50 p-4 text-destructive">
          Impossible de charger vos événements.
        </p>
      )}
      {events.isSuccess && events.data.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border bg-card px-6 py-12 text-center shadow-card sm:py-16">
          <div
            aria-hidden
            className="relative mb-2 flex size-36 items-center justify-center rounded-full bg-muted sm:size-44"
          >
            <CalendarCheck className="size-16 text-title-accent sm:size-20" strokeWidth={1.3} />
            <Sparkles className="absolute top-2 right-3 size-7 text-ochre" strokeWidth={1.6} />
          </div>
          <h2 className="text-[22px] font-bold sm:text-[26px]">Aucun événement pour le moment</h2>
          <p className="max-w-md text-muted-foreground">
            Créez votre premier événement et commencez à ajouter des prestataires.
          </p>
          <Button asChild variant="cta" size="lg" className="mt-2 h-11 has-[>svg]:px-5">
            <Link to={NEW_EVENT_URL}>
              <Plus aria-hidden />
              Créer mon événement
            </Link>
          </Button>
        </div>
      )}
      {events.isSuccess && events.data.length > 0 && (
        <ul aria-label="Mes événements" className="flex flex-col gap-4">
          {events.data.map((summary) => (
            <li key={summary.event.id}>
              <EventCard summary={summary} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
