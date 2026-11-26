import { toIsoDate } from '@afro/common';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import {
  WEEK_DAYS,
  cursorFromIsoDate,
  dayLabel,
  monthGrid,
  monthLabel,
  moveMonth,
  weeks,
  type MonthCursor,
} from '@/lib/calendar';
import { cn } from '@/lib/utils';
import { quickDates } from '../../lib/searchDraft';

interface DatePickerProps {
  /** Jour choisi « AAAA-MM-JJ » (vide : aucun). */
  value: string;
  onPick(day: string): void;
  /** Nombre de mois affichés côte à côte (2 sur grand écran, 1 sur téléphone). */
  months?: 1 | 2;
  className?: string;
}

/**
 * Le calendrier de « Quand ? » : raccourcis (« Ce samedi »…) puis un ou deux mois.
 * Les jours passés sont grisés. Le mois s'ouvre sur la date choisie, sinon sur le mois en cours.
 */
export function DatePicker({ value, onPick, months = 2, className }: DatePickerProps) {
  const today = toIsoDate(new Date());
  const [cursor, setCursor] = useState<MonthCursor>(() => cursorFromIsoDate(value || today));
  const firstMonth = cursorFromIsoDate(today);
  const canGoBack = cursor.year * 12 + cursor.month > firstMonth.year * 12 + firstMonth.month;
  const shown = Array.from({ length: months }, (_, i) => moveMonth(cursor, i));

  return (
    <div className={cn('flex flex-col gap-5', className)}>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Dates rapides">
        {quickDates().map((quick) => (
          <button
            key={quick.label}
            type="button"
            aria-pressed={value === quick.date}
            onClick={() => {
              setCursor(cursorFromIsoDate(quick.date));
              onPick(quick.date);
            }}
            className={cn(
              'rounded-full border-[1.5px] border-border px-4 py-2 text-sm font-semibold transition-colors outline-none hover:border-foreground focus-visible:ring-[3px] focus-visible:ring-ring',
              value === quick.date && 'border-foreground bg-foreground text-background',
            )}
          >
            {quick.label}
          </button>
        ))}
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-between">
          <MonthArrow
            label="Mois précédent"
            disabled={!canGoBack}
            onClick={() => setCursor((c) => moveMonth(c, -1))}
          >
            <ChevronLeft className="size-5" aria-hidden />
          </MonthArrow>
          <MonthArrow label="Mois suivant" onClick={() => setCursor((c) => moveMonth(c, 1))}>
            <ChevronRight className="size-5" aria-hidden />
          </MonthArrow>
        </div>
        <div className={cn('grid gap-8', months === 2 && 'sm:grid-cols-2')}>
          {shown.map((month) => (
            <MonthGrid
              key={`${month.year}-${month.month}`}
              month={month}
              today={today}
              value={value}
              onPick={onPick}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function MonthArrow({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick(): void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="pointer-events-auto flex size-9 items-center justify-center rounded-full transition-colors outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function MonthGrid({
  month,
  today,
  value,
  onPick,
}: {
  month: MonthCursor;
  today: string;
  value: string;
  onPick(day: string): void;
}) {
  const label = monthLabel(month);
  return (
    <table className="w-full table-fixed border-separate border-spacing-y-0.5 text-center">
      <caption className="mb-3 h-9 align-middle text-base leading-9 font-semibold capitalize">
        {label}
      </caption>
      <thead>
        <tr>
          {WEEK_DAYS.map((day) => (
            <th
              key={day}
              scope="col"
              abbr={day}
              className="pb-1 text-xs font-semibold text-muted-foreground"
            >
              {day.slice(0, 2)}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {weeks(monthGrid(month)).map((week, w) => (
          <tr key={w}>
            {week.map((day, d) =>
              day ? (
                <td key={day} className="p-0">
                  <button
                    type="button"
                    disabled={day < today}
                    aria-pressed={day === value}
                    aria-label={dayLabel(day)}
                    onClick={() => onPick(day)}
                    className={cn(
                      'mx-auto flex aspect-square w-full max-w-11 items-center justify-center rounded-full text-sm font-semibold transition-colors outline-none hover:border-[1.5px] hover:border-foreground focus-visible:ring-[3px] focus-visible:ring-ring disabled:pointer-events-none disabled:font-normal disabled:text-muted-foreground/50 disabled:line-through',
                      day === today && 'text-primary underline underline-offset-4',
                      day === value && 'bg-primary text-primary-foreground hover:border-0',
                    )}
                  >
                    {Number(day.slice(8))}
                  </button>
                </td>
              ) : (
                <td key={`empty-${d}`} />
              ),
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
