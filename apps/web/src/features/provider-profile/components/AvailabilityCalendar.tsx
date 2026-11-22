import { toIsoDate, useUnavailableDates } from '@afro/common';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  cursorFromIsoDate,
  dayLabel,
  monthGrid,
  monthLabel as formatMonth,
  moveMonth,
  WEEK_DAYS,
} from '@/lib/calendar';
import { cn } from '@/lib/utils';

interface AvailabilityCalendarProps {
  providerId: string;
  /** Aujourd'hui, au format ISO (passé en paramètre pour les tests). */
  today?: string;
}

/**
 * Calendrier de disponibilités en lecture seule (P5).
 * Par défaut, un prestataire est disponible : on barre seulement les jours
 * indisponibles (règle n° 3), sans dire pourquoi.
 */
export function AvailabilityCalendar({
  providerId,
  today = toIsoDate(new Date()),
}: AvailabilityCalendarProps) {
  const [cursor, setCursor] = useState(() => cursorFromIsoDate(today));
  const days = useMemo(() => monthGrid(cursor), [cursor]);
  const range = { from: days.find(Boolean)!, to: days.at(-1)! };
  const unavailable = useUnavailableDates(providerId, range);
  const blocked = new Set(unavailable.data ?? []);
  const isCurrentMonth = today.startsWith(range.from.slice(0, 7));

  const move = (step: number) => setCursor((current) => moveMonth(current, step));
  const monthLabel = formatMonth(cursor);

  return (
    <section aria-labelledby="availability-title" className="rounded-xl border bg-card p-4">
      <h2 id="availability-title" className="mb-3 font-display text-xl font-semibold">
        Disponibilités
      </h2>
      <div className="mb-3 flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => move(-1)}
          disabled={isCurrentMonth}
          aria-label="Mois précédent"
        >
          <ChevronLeft />
        </Button>
        <p className="font-medium capitalize" aria-live="polite">
          {monthLabel}
        </p>
        <Button variant="ghost" size="icon" onClick={() => move(1)} aria-label="Mois suivant">
          <ChevronRight />
        </Button>
      </div>
      <table className="w-full table-fixed text-center text-sm" aria-label={monthLabel}>
        <thead>
          <tr>
            {WEEK_DAYS.map((day) => (
              <th key={day} scope="col" className="pb-1 text-xs font-normal text-muted-foreground">
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: Math.ceil(days.length / 7) }, (_, week) => (
            <tr key={week}>
              {days.slice(week * 7, week * 7 + 7).map((day, index) => {
                if (!day) return <td key={`empty-${index}`} />;
                const past = day < today;
                const isBlocked = blocked.has(day);
                const label = `${dayLabel(day)} : ${
                  past ? 'passé' : isBlocked ? 'indisponible' : 'disponible'
                }`;
                return (
                  <td key={day} className="p-0.5">
                    <span
                      aria-label={label}
                      title={label}
                      className={cn(
                        'flex aspect-square items-center justify-center rounded-md',
                        past && 'text-muted-foreground',
                        !past && isBlocked && 'bg-muted text-muted-foreground line-through',
                        !past && !isBlocked && 'bg-success-muted text-success',
                        day === today && 'ring-2 ring-ring',
                      )}
                    >
                      {Number(day.slice(8))}
                    </span>
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
            className="size-3 rounded-sm bg-success-muted border border-success/30"
            aria-hidden
          />{' '}
          Disponible
        </span>
        <span className="flex items-center gap-1">
          <span className="size-3 rounded-sm bg-muted" aria-hidden /> Indisponible
        </span>
      </p>
    </section>
  );
}
