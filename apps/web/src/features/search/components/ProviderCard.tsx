import type { ProviderCard as ProviderCardData } from '@afro/common';
import { BadgeCheck, MapPin } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { Rating } from '@/components/Rating';
import { cn } from '@/lib/utils';
import type { ResultsView } from '../lib/resultsView';
import { FavoriteButton } from './FavoriteButton';

interface ProviderCardProps {
  provider: ProviderCardData;
  /** Pastille posée sur la photo (la catégorie principale du prestataire). */
  categoryName?: string;
  /** Spécialités affichées en pastilles sous la description (ses origines culturelles). */
  tags?: string[];
  /** `grid` : carte verticale, grande photo au-dessus ; `list` : carte horizontale, photo à gauche. */
  layout?: ResultsView;
  className?: string;
}

/** Nombre de pastilles visibles avant « +N ». */
const MAX_TAGS = 3;

/**
 * La carte d'un prestataire dans les résultats (P2, P4) et l'aperçu de « Mon profil ».
 *
 * Volontairement épurée : photo, nom, ville, note, une phrase de présentation et des pastilles.
 * Pas de prix ni de bouton « Voir le profil » : toute la carte est cliquable. Le lien est sur le nom
 * et une astuce CSS (`after:absolute after:inset-0`) étend sa zone de clic à toute la carte,
 * sans imbriquer d'éléments interactifs. Seul le cœur (favoris) est un autre bouton, posé au-dessus.
 */
export function ProviderCard({
  provider,
  categoryName,
  tags = [],
  layout = 'grid',
  className,
}: ProviderCardProps) {
  // Si la photo ne se charge pas, on retombe sur le dégradé avec l'initiale (pas d'image cassée).
  const [coverFailed, setCoverFailed] = useState(false);
  const showCover = provider.coverUrl !== undefined && !coverFailed;
  const list = layout === 'list';
  const visibleTags = tags.slice(0, MAX_TAGS);
  const hiddenTags = tags.length - visibleTags.length;

  const favorite = (
    <FavoriteButton
      providerId={provider.id}
      providerName={provider.displayName}
      className={list ? 'shrink-0' : 'absolute top-3 right-3 size-12'}
    />
  );

  return (
    <article
      className={cn(
        'group relative flex h-full rounded-[1.375rem] bg-card p-2.5 shadow-card ring-1 ring-border/70 transition-[translate,box-shadow] duration-300 focus-within:ring-[3px] focus-within:ring-ring/60 hover:-translate-y-1 hover:shadow-pop motion-reduce:transition-none motion-reduce:hover:translate-y-0',
        list ? 'flex-row gap-3 sm:gap-5' : 'flex-col',
        className,
      )}
    >
      <div
        className={cn(
          'relative shrink-0 overflow-hidden rounded-2xl bg-linear-to-br from-ochre via-primary to-foreground',
          list ? 'w-28 self-stretch sm:w-56 lg:w-64' : 'aspect-[10/11] w-full',
        )}
      >
        {showCover ? (
          <img
            src={provider.coverUrl}
            alt=""
            loading="lazy"
            onError={() => setCoverFailed(true)}
            className={cn(
              'size-full object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none',
              list && 'absolute inset-0',
            )}
          />
        ) : (
          <span
            aria-hidden
            className="absolute inset-0 flex items-center justify-center font-display text-6xl font-bold text-white/90"
          >
            {provider.displayName.charAt(0)}
          </span>
        )}
        {categoryName && (
          <span
            className={cn(
              'absolute top-3.5 left-3.5 max-w-[calc(100%-5rem)] truncate rounded-full bg-background/95 px-4 py-1.5 text-sm font-semibold text-foreground shadow-sm',
              list && 'hidden max-w-[calc(100%-1.5rem)] sm:block',
            )}
          >
            {categoryName}
          </span>
        )}
        {!list && favorite}
      </div>

      <div
        className={cn(
          'flex min-w-0 flex-1 flex-col gap-1.5',
          list ? 'py-1.5 pr-1 sm:py-3 sm:pr-3' : 'px-2.5 pt-5 pb-3',
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <h3
            className={cn(
              'min-w-0 font-display leading-tight font-bold text-foreground',
              list ? 'text-lg sm:text-2xl' : 'text-[1.625rem]',
            )}
          >
            <Link
              to={`/prestataires/${provider.slug}`}
              className="outline-none after:absolute after:inset-0 after:rounded-[1.375rem] after:content-['']"
            >
              {provider.displayName}
            </Link>
            {provider.isProVerified && (
              <BadgeCheck
                role="img"
                aria-label="Pro vérifié"
                // En ligne avec le texte : il suit le dernier mot, même si le nom passe sur 2 lignes.
                className="ml-1.5 inline-block size-6 fill-title-accent align-[-0.2em] text-card"
              />
            )}
          </h3>
          {list && favorite}
        </div>

        {list && categoryName && (
          <p className="text-xs font-semibold text-muted-foreground sm:hidden">{categoryName}</p>
        )}

        <p className="flex items-center gap-2 text-base text-foreground sm:text-[1.0625rem]">
          <MapPin className="size-[1.125rem] shrink-0 fill-primary text-card" aria-hidden />
          <span className="truncate">{provider.city}</span>
        </p>
        <Rating
          value={provider.ratingAverage}
          count={provider.ratingCount}
          variant="compact"
          size="md"
          className="sm:text-[1.0625rem]"
        />

        {provider.summary && (
          <p
            className={cn(
              'mt-1.5 text-[0.9375rem] leading-snug text-foreground/85',
              list ? 'line-clamp-2 max-sm:hidden sm:line-clamp-3' : 'line-clamp-2',
            )}
          >
            {provider.summary}
          </p>
        )}

        {visibleTags.length > 0 && (
          <ul
            className={cn('mt-auto flex flex-wrap gap-1.5 pt-3', list && 'max-sm:hidden')}
            aria-label="Spécialités"
          >
            {visibleTags.map((tag) => (
              <li
                key={tag}
                className="rounded-full bg-muted px-3.5 py-1.5 text-[0.8125rem] font-medium text-foreground"
              >
                {tag}
              </li>
            ))}
            {hiddenTags > 0 && (
              <li className="rounded-full bg-muted px-3.5 py-1.5 text-[0.8125rem] font-medium text-foreground">
                <span aria-hidden>+{hiddenTags}</span>
                <span className="sr-only">
                  et {hiddenTags} autre{hiddenTags > 1 ? 's' : ''}
                </span>
              </li>
            )}
          </ul>
        )}
      </div>
    </article>
  );
}
