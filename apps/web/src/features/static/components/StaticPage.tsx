import { TriangleAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { usePageMeta } from '@/hooks/usePageMeta';

interface StaticPageProps {
  title: string;
  description: string;
  /** Date de dernière mise à jour, affichée sous le titre (texte libre). */
  updatedAt?: string;
  /** Texte juridique pas encore relu par un professionnel : on l'affiche clairement. */
  draft?: boolean;
  children: ReactNode;
}

/** Gabarit des pages de contenu (P7) : titre, avertissement éventuel, texte lisible. */
export function StaticPage({ title, description, updatedAt, draft, children }: StaticPageProps) {
  usePageMeta(title, description);
  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-12">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-semibold md:text-4xl">{title}</h1>
        {updatedAt && <p className="text-sm text-muted-foreground">Mise à jour : {updatedAt}</p>}
      </header>
      {draft && (
        <p role="note" className="flex gap-2 rounded-lg bg-warning-muted p-4 text-sm">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          Texte provisoire, en attente de relecture juridique. Il ne s’applique pas encore : la
          plateforme est en développement et ses données sont fictives.
        </p>
      )}
      <div className="flex flex-col gap-4 leading-relaxed">{children}</div>
    </article>
  );
}

/** Une section titrée d'une page de contenu. */
export function StaticSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="mt-4 text-xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}
