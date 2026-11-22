import {
  ApiError,
  toIsoDate,
  useBlockDate,
  useBookings,
  useMyProviderProfile,
  useMyUnavailabilities,
  useUnblockDate,
  useUpdateMyProviderProfile,
} from '@afro/common';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useId, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePageMeta } from '@/hooks/usePageMeta';
import {
  cursorFromIsoDate,
  dayLabel,
  monthGrid,
  monthLabel,
  moveMonth,
  WEEK_DAYS,
  weeks,
} from '@/lib/calendar';
import { cn } from '@/lib/utils';

/** Le réglage « réservations maximum par jour » (règle n° 3). */
function MaxPerDaySetting() {
  const profile = useMyProviderProfile();
  const update = useUpdateMyProviderProfile();
  const [draft, setDraft] = useState<string | null>(null);
  const inputId = useId();
  const current = profile.data?.profile.maxBookingsPerDay;
  const value = draft ?? (current === undefined ? '' : String(current));
  const parsed = Number(value);
  const isValid = Number.isInteger(parsed) && parsed >= 1 && parsed <= 20;

  return (
    <form
      className="flex flex-wrap items-end gap-3 rounded-xl border bg-card p-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (isValid)
          update.mutate({ maxBookingsPerDay: parsed }, { onSuccess: () => setDraft(null) });
      }}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor={inputId}>Réservations maximum par jour</Label>
        <Input
          id={inputId}
          inputMode="numeric"
          className="w-24"
          value={value}
          onChange={(event) => setDraft(event.target.value)}
          aria-invalid={!isValid}
        />
      </div>
      <Button
        type="submit"
        variant="outline"
        disabled={!isValid || draft === null || update.isPending}
      >
        Enregistrer
      </Button>
      <p className="basis-full text-sm text-muted-foreground" role="status">
        {update.isSuccess && draft === null
          ? 'Réglage enregistré.'
          : 'Au-delà, le jour apparaît complet et les clients ne peuvent plus demander de devis pour cette date.'}
      </p>
    </form>
  );
}

/**
 * S6 : l'agenda du prestataire. Vue mois : dates réservées, dates bloquées
 * à la main. Un clic sur un jour libre le bloque ; un clic sur un jour bloqué
 * le débloque. Un jour réservé renvoie vers la demande correspondante.
 */
export function AgendaPage({ today = toIsoDate(new Date()) }: { today?: string }) {
  usePageMeta('Agenda');
  const [cursor, setCursor] = useState(() => cursorFromIsoDate(today));
  const days = useMemo(() => monthGrid(cursor), [cursor]);
  const range = { from: days.find(Boolean)!, to: days.at(-1)! };
  const unavailabilities = useMyUnavailabilities(range);
  const bookings = useBookings('provider');
  const block = useBlockDate();
  const unblock = useUnblockDate();
  const error = block.error ?? unblock.error;

  const manualByDay = new Map(
    (unavailabilities.data ?? []).filter((u) => u.reason === 'manual').map((u) => [u.date, u]),
  );
  const bookingsByDay = new Map<string, NonNullable<typeof bookings.data>>();
  for (const summary of bookings.data ?? []) {
    if (summary.booking.status !== 'confirmed') continue;
    const list = bookingsByDay.get(summary.booking.eventDate) ?? [];
    bookingsByDay.set(summary.booking.eventDate, [...list, summary]);
  }
  const label = monthLabel(cursor);
  const isPending = block.isPending || unblock.isPending;

  return (
    <section aria-labelledby="agenda-title" className="flex flex-col gap-6">
      <h1 id="agenda-title" className="text-3xl font-semibold">
        Agenda
      </h1>

      <div className="rounded-xl border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Mois précédent"
            onClick={() => setCursor((c) => moveMonth(c, -1))}
          >
            <ChevronLeft />
          </Button>
          <p className="text-lg font-semibold capitalize" aria-live="polite">
            {label}
          </p>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Mois suivant"
            onClick={() => setCursor((c) => moveMonth(c, 1))}
          >
            <ChevronRight />
          </Button>
        </div>

        <table className="w-full table-fixed text-sm" aria-label={label}>
          <thead>
            <tr>
              {WEEK_DAYS.map((day) => (
                <th
                  key={day}
                  scope="col"
                  className="pb-2 text-xs font-normal text-muted-foreground"
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks(days).map((week, w) => (
              <tr key={w}>
                {week.map((day, index) => {
                  if (!day) return <td key={`empty-${index}`} />;
                  const past = day < today;
                  const manual = manualByDay.get(day);
                  const booked = bookingsByDay.get(day) ?? [];
                  const number = Number(day.slice(8));
                  const base =
                    'flex h-16 w-full flex-col items-start gap-0.5 rounded-md border p-1 text-left text-xs sm:h-20 sm:p-1.5';

                  if (booked.length > 0) {
                    const first = booked[0]!;
                    return (
                      <td key={day} className="p-0.5 align-top">
                        <Link
                          to={`/pro/demandes/${first.booking.quoteRequestId}`}
                          aria-label={`${dayLabel(day)} : réservé (${booked.length}), voir la demande`}
                          className={cn(
                            base,
                            'border-success/30 bg-success-muted text-success hover:brightness-95',
                          )}
                        >
                          <span className="font-semibold">{number}</span>
                          <span className="hidden truncate sm:block">
                            {first.client.firstName} {first.client.lastNameInitial}
                          </span>
                          <span className="sm:hidden" aria-hidden>
                            ●
                          </span>
                        </Link>
                      </td>
                    );
                  }
                  return (
                    <td key={day} className="p-0.5 align-top">
                      <button
                        type="button"
                        disabled={past || isPending}
                        aria-pressed={!!manual}
                        aria-label={`${dayLabel(day)} : ${manual ? 'bloqué, cliquer pour débloquer' : 'libre, cliquer pour bloquer'}`}
                        onClick={() => (manual ? unblock.mutate(manual.id) : block.mutate(day))}
                        className={cn(
                          base,
                          'transition-colors disabled:cursor-default',
                          past && 'border-transparent text-muted-foreground',
                          !past && manual && 'bg-secondary text-muted-foreground line-through',
                          !past && !manual && 'bg-background hover:bg-muted',
                          day === today && 'ring-2 ring-ring',
                        )}
                      >
                        <span className="font-semibold">{number}</span>
                        {manual && !past && (
                          <span className="hidden no-underline sm:block">Bloqué</span>
                        )}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        <p className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span
              className="size-3 rounded-sm border border-success/30 bg-success-muted"
              aria-hidden
            />{' '}
            Réservé
          </span>
          <span className="flex items-center gap-1">
            <span className="size-3 rounded-sm bg-secondary" aria-hidden /> Bloqué par toi
          </span>
          <span className="flex items-center gap-1">
            <span className="size-3 rounded-sm border bg-background" aria-hidden /> Libre
          </span>
        </p>
        {error && (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {error instanceof ApiError ? error.message : 'La modification a échoué.'}
          </p>
        )}
      </div>

      <MaxPerDaySetting />
    </section>
  );
}
