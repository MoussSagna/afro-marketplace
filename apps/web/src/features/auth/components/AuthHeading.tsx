import type { ReactNode } from 'react';

/** Le titre (h1) et le sous-titre d'une page d'authentification, centrés. */
export function AuthHeading({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 text-center sm:gap-3">
      <h1 className="font-display text-[32px] leading-tight font-semibold sm:text-[40px] lg:text-[44px]">
        {title}
      </h1>
      <p className="text-muted-foreground sm:text-lg">{children}</p>
    </div>
  );
}

/** Le séparateur « ou » entre le formulaire et les autres façons de se connecter. */
export function OrDivider() {
  return (
    <div className="flex w-full items-center gap-5 text-muted-foreground" aria-hidden>
      <span className="h-px flex-1 bg-border" />
      ou
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

/** Un message d'erreur du serveur, au-dessus du formulaire. */
export function FormAlert({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="w-full rounded-xl bg-red-50 p-4 text-destructive">
      {children}
    </p>
  );
}
