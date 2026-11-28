import type { ReactNode } from 'react';

interface AdminPageHeaderProps {
  /** L'id du titre, pour `aria-labelledby` de la section de la page. */
  id: string;
  title: string;
  description?: ReactNode;
  /** Une action à droite du titre (bouton, compteur…). */
  actions?: ReactNode;
}

/** Le titre d'une page du back-office (`font-display`), avec son sous-titre. */
export function AdminPageHeader({ id, title, description, actions }: AdminPageHeaderProps) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1
          id={id}
          className="text-[32px] leading-tight font-bold tracking-tight sm:text-4xl lg:text-[44px]"
        >
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 text-base text-muted-foreground sm:text-lg lg:text-xl">
            {description}
          </p>
        )}
      </div>
      {actions}
    </header>
  );
}
