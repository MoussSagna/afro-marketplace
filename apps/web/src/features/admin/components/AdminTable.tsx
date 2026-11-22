import type { ReactNode } from 'react';

/** Un tableau simple et lisible ; il défile horizontalement sur téléphone. */
export function AdminTable({
  caption,
  head,
  children,
}: {
  caption: string;
  head: string[];
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="border-b bg-muted text-muted-foreground">
          <tr>
            {head.map((label) => (
              <th key={label} scope="col" className="px-4 py-2 font-medium whitespace-nowrap">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">{children}</tbody>
      </table>
    </div>
  );
}

export function StatusPill({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'success' | 'warning' | 'danger';
}) {
  const styles = {
    neutral: 'bg-secondary text-muted-foreground',
    success: 'bg-success-muted text-success',
    warning: 'bg-warning-muted text-foreground',
    danger: 'bg-red-50 text-destructive',
  }[tone];
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${styles}`}
    >
      {children}
    </span>
  );
}
