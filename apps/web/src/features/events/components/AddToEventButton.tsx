import { ApiError, useAddEventProvider, useEvents } from '@afro/common';
import { CalendarPlus, Check, Plus } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useSessionStore } from '@/stores/session';
import { toast } from '@/stores/toasts';
import { clearDraft } from '../lib/eventDraft';
import { EVENT_TYPE_PHOTOS, formatEventDay, plural } from '../lib/eventDisplay';

const buttonClass =
  'h-12 w-full border-primary/30 bg-card text-base font-semibold text-primary has-[>svg]:px-6';

/**
 * « Ajouter à un événement » (fiche prestataire) : une fenêtre liste mes événements, avec
 * « Ajouter » ou « Ajouté », et « Nouvel événement » (formulaire, puis retour sur la fiche).
 * Visiteur non connecté : le bouton mène à la connexion, puis revient sur la fiche.
 */
export function AddToEventButton({
  providerId,
  providerName,
}: {
  providerId: string;
  providerName: string;
}) {
  const user = useSessionStore((state) => state.user);
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const events = useEvents({ enabled: open && !!user });
  const add = useAddEventProvider();

  if (!user) {
    return (
      <Button asChild variant="outline" size="lg" className={buttonClass}>
        <Link to={`/connexion?retour=${encodeURIComponent(pathname)}`}>
          <CalendarPlus aria-hidden />
          Ajouter à un événement
        </Link>
      </Button>
    );
  }

  const newEventUrl = `/evenements/nouveau?prestataire=${encodeURIComponent(providerId)}&retour=${encodeURIComponent(pathname)}`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg" className={buttonClass}>
          <CalendarPlus aria-hidden />
          Ajouter à un événement
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg gap-5 rounded-2xl p-6 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-bold">
            Ajouter à un événement
          </DialogTitle>
          <DialogDescription>
            Choisissez l’événement auquel ajouter{' '}
            <strong className="text-foreground">« {providerName} »</strong>.
          </DialogDescription>
        </DialogHeader>
        {events.isPending && (
          <div role="status" aria-label="Chargement" className="flex flex-col gap-2.5">
            <Skeleton className="h-[74px] rounded-xl" />
            <Skeleton className="h-[74px] rounded-xl" />
          </div>
        )}
        {events.isError && (
          <p role="alert" className="text-sm text-destructive">
            Impossible de charger vos événements.
          </p>
        )}
        {events.isSuccess && events.data.length === 0 && (
          <p className="text-muted-foreground">Vous n’avez pas encore d’événement.</p>
        )}
        {events.isSuccess && events.data.length > 0 && (
          <ul
            aria-label="Mes événements"
            className="flex max-h-[50dvh] flex-col gap-2.5 overflow-y-auto"
          >
            {events.data.map(({ event, providerIds }) => {
              const already = providerIds.includes(providerId);
              return (
                <li key={event.id} className="flex items-center gap-3.5 rounded-xl border p-3">
                  <img
                    src={EVENT_TYPE_PHOTOS[event.type]}
                    alt=""
                    className="h-[52px] w-16 shrink-0 rounded-lg object-cover"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{event.name}</span>
                    <span className="block truncate text-sm text-muted-foreground">
                      {formatEventDay(event.date)} · {event.city} ·{' '}
                      {plural(providerIds.length, 'prestataire')}
                    </span>
                  </span>
                  {already ? (
                    <Button
                      size="sm"
                      disabled
                      className="h-9 bg-success-muted text-success opacity-100 has-[>svg]:px-3"
                    >
                      <Check aria-hidden />
                      Ajouté
                    </Button>
                  ) : (
                    <Button
                      variant="cta"
                      size="sm"
                      className="h-9 px-4"
                      disabled={add.isPending}
                      aria-label={`Ajouter à ${event.name}`}
                      onClick={() =>
                        add.mutate(
                          { eventId: event.id, providerId },
                          {
                            onSuccess: () => {
                              setOpen(false);
                              toast({
                                title: 'Prestataire ajouté',
                                description: `« ${providerName} » a été ajouté à « ${event.name} ».`,
                              });
                            },
                            onError: (error) =>
                              toast({
                                tone: 'info',
                                title: 'Ajout impossible',
                                description: error instanceof ApiError ? error.message : undefined,
                              }),
                          },
                        )
                      }
                    >
                      Ajouter
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        <Button asChild variant="outline" size="lg" className="h-11 w-full has-[>svg]:px-5">
          <Link to={newEventUrl} onClick={() => clearDraft()}>
            <Plus aria-hidden />
            Nouvel événement
          </Link>
        </Button>
      </DialogContent>
    </Dialog>
  );
}
