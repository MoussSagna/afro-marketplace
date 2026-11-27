import type { LucideIcon } from 'lucide-react';
import { useId, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AdminPanelProps {
  icon: LucideIcon;
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
}

/** Une grande carte blanche du back-office : icône, titre Playfair, sous-titre, puis le contenu. */
export function AdminPanel({
  icon: Icon,
  title,
  description,
  children,
  className,
}: AdminPanelProps) {
  const titleId = useId();
  return (
    <section
      aria-labelledby={titleId}
      className={cn('flex min-w-0 flex-col rounded-2xl border bg-card shadow-card', className)}
    >
      <header className="flex items-start gap-3 border-b px-4 py-4 sm:gap-4 sm:px-5 sm:py-5">
        <Icon
          className="mt-0.5 size-8 shrink-0 text-primary sm:size-9"
          strokeWidth={1.6}
          aria-hidden
        />
        <div className="min-w-0">
          <h2 id={titleId} className="text-2xl leading-tight font-bold sm:text-[28px]">
            {title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">{description}</p>
        </div>
      </header>
      {children}
    </section>
  );
}
