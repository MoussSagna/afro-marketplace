import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export interface AboutTag {
  icon: LucideIcon;
  label: string;
}

export interface AboutFact {
  icon: LucideIcon;
  title: string;
  value: string;
}

interface AboutSectionProps {
  providerName: string;
  bio: string;
  /** « Entreprise », « Auto-entrepreneur »… */
  legalTypeLabel: string;
  /** Spécialités (catégories, origines, langues), toutes tirées du profil : rien d'inventé. */
  tags: AboutTag[];
  /** Les informations synthétiques (capacité, zone, délai de réponse, annulation), si elles existent. */
  facts: AboutFact[];
  /** Les informations pratiques sous la présentation (calendrier, annulation). */
  children?: ReactNode;
}

/** Onglet « Présentation » : « À propos de … », la présentation, les spécialités et les infos clés. */
export function AboutSection({
  providerName,
  bio,
  legalTypeLabel,
  tags,
  facts,
  children,
}: AboutSectionProps) {
  return (
    <section aria-labelledby="about-title" className="@container flex flex-col gap-6">
      <div>
        <h2 id="about-title" className="mb-4 font-display text-[26px] font-semibold md:text-[32px]">
          À propos de {providerName}
        </h2>
        <p className="max-w-[68ch] leading-relaxed whitespace-pre-line text-foreground/90 sm:text-[17px]">
          {bio}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">{legalTypeLabel}</p>
      </div>

      {tags.length > 0 && (
        <ul aria-label="Spécialités" className="flex flex-wrap gap-2.5">
          {tags.map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-secondary px-4 text-[15px] text-secondary-foreground"
            >
              <Icon className="size-[18px] text-primary" aria-hidden />
              {label}
            </li>
          ))}
        </ul>
      )}

      {facts.length > 0 && (
        <dl className="grid grid-cols-2 gap-y-5 rounded-xl border bg-secondary/40 p-5 @2xl:grid-cols-4 @2xl:divide-x @2xl:p-6">
          {facts.map(({ icon: Icon, title, value }) => (
            <div key={title} className="flex flex-col gap-1.5 px-2 @2xl:px-5 @2xl:first:pl-0">
              <Icon className="mb-1 size-8 text-primary" strokeWidth={1.6} aria-hidden />
              <dt className="font-semibold sm:text-[17px]">{title}</dt>
              <dd className="text-sm text-muted-foreground sm:text-[15px]">{value}</dd>
            </div>
          ))}
        </dl>
      )}

      {children}
    </section>
  );
}
