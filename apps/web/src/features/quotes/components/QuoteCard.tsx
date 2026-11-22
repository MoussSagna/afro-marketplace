import { computeDepositAmount, formatEventDate, formatPrice, type Quote } from '@afro/common';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

const STATUS: Record<Quote['status'], { label: string; className: string }> = {
  sent: { label: 'En attente de réponse', className: 'bg-muted text-primary' },
  accepted: { label: 'Accepté', className: 'bg-success-muted text-success' },
  declined: { label: 'Refusé', className: 'bg-secondary text-muted-foreground' },
  expired: { label: 'Expiré', className: 'bg-secondary text-muted-foreground' },
  superseded: { label: 'Remplacé', className: 'bg-secondary text-muted-foreground' },
};

/** Un devis détaillé : lignes, total, acompte, validité, conditions. Les actions sont passées en enfants. */
export function QuoteCard({ quote, children }: { quote: Quote; children?: ReactNode }) {
  const status = STATUS[quote.status];
  const isOld =
    quote.status === 'superseded' || quote.status === 'declined' || quote.status === 'expired';
  return (
    <article
      aria-label={`Devis n° ${quote.version}`}
      className={cn('rounded-xl border bg-card p-5', isOld && 'opacity-75')}
    >
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-semibold">Devis n° {quote.version}</h3>
        <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', status.className)}>
          {status.label}
        </span>
      </header>
      <table className="w-full text-sm">
        <caption className="sr-only">Lignes du devis n° {quote.version}</caption>
        <thead className="text-left text-muted-foreground">
          <tr>
            <th scope="col" className="pb-2 font-normal">
              Libellé
            </th>
            <th scope="col" className="pb-2 text-right font-normal">
              Qté
            </th>
            <th scope="col" className="pb-2 text-right font-normal">
              Prix unitaire
            </th>
            <th scope="col" className="pb-2 text-right font-normal">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {quote.lines.map((line) => (
            <tr key={line.id} className="border-t">
              <td className="py-2 pr-2">{line.label}</td>
              <td className="py-2 text-right tabular-nums">{line.quantity}</td>
              <td className="py-2 text-right tabular-nums">{formatPrice(line.unitPrice)}</td>
              <td className="py-2 text-right tabular-nums">
                {formatPrice(line.quantity * line.unitPrice)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t text-base font-semibold">
            <th scope="row" colSpan={3} className="pt-3 text-left">
              Total
            </th>
            <td className="pt-3 text-right tabular-nums">{formatPrice(quote.totalAmount)}</td>
          </tr>
        </tfoot>
      </table>
      <dl className="mt-3 grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
        <div>
          <dt className="inline">Acompte : </dt>
          <dd className="inline">
            {quote.depositRate} % soit{' '}
            {formatPrice(computeDepositAmount(quote.totalAmount, quote.depositRate))}
          </dd>
        </div>
        <div>
          <dt className="inline">Valable jusqu’au </dt>
          <dd className="inline">{formatEventDate(quote.validUntil)}</dd>
        </div>
      </dl>
      {quote.conditions && <p className="mt-3 text-sm whitespace-pre-line">{quote.conditions}</p>}
      {children && <div className="mt-4 flex flex-wrap gap-3">{children}</div>}
    </article>
  );
}
