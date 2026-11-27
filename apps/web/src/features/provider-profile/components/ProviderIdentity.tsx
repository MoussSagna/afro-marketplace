import type { Category, PublicProviderProfile } from '@afro/common';
import { BadgeCheck, Mail, MapPin } from 'lucide-react';
import { Link } from 'react-router';
import { Rating } from '@/components/Rating';
import { Button } from '@/components/ui/button';
import { FavoriteButton } from '@/features/search/components/FavoriteButton';
import { categoryIcon } from '../lib/categoryIcon';
import { monogram } from '../lib/profileDisplay';

interface ProviderIdentityProps {
  profile: PublicProviderProfile;
  /** Les catégories du prestataire (sous-catégories du catalogue). */
  categories: Category[];
  /** La famille de la première catégorie (« Traiteur & boissons »), affichée sous le nom. */
  groupName?: string;
  requestUrl: string;
}

/**
 * L'identité du prestataire, posée en bas de la couverture (texte blanc sur le dégradé sombre) :
 * monogramme, nom, badge vérifié, famille, catégories, ville, note ;
 * à droite, le cœur des favoris et « Contacter le prestataire ».
 */
export function ProviderIdentity({
  profile: p,
  categories,
  groupName,
  requestUrl,
}: ProviderIdentityProps) {
  const MainIcon = categoryIcon(categories[0]);

  return (
    <header className="flex flex-col gap-5 text-white lg:flex-row lg:items-end lg:justify-between">
      <div className="flex min-w-0 items-start gap-4 sm:items-center sm:gap-6">
        <span
          aria-hidden
          className="flex size-16 shrink-0 items-center justify-center rounded-2xl border-2 border-white/90 bg-primary font-display text-2xl font-semibold text-primary-foreground shadow-pop sm:size-24 sm:text-4xl lg:size-[104px]"
        >
          {monogram(p.displayName)}
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="font-display text-[28px] leading-tight font-semibold text-white drop-shadow-sm sm:text-4xl lg:text-[42px]">
            {p.displayName}
            {p.isProVerified && (
              <span className="ml-2 inline-flex align-[-0.1em]" title="Pro vérifié">
                <BadgeCheck
                  aria-hidden
                  className="size-6 fill-ochre text-white sm:size-8"
                  strokeWidth={2.2}
                />
                <span className="sr-only">Pro vérifié</span>
              </span>
            )}
          </h1>
          {groupName && <p className="text-white/90 sm:text-lg">{groupName}</p>}
          <ul className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm sm:text-[15px]">
            {categories.map((category) => (
              <li key={category.id}>
                <Link
                  to={`/categories/${category.slug}`}
                  className="inline-flex h-8 items-center gap-1.5 rounded-full bg-secondary px-3.5 font-medium text-secondary-foreground transition-colors outline-none hover:bg-background focus-visible:ring-[3px] focus-visible:ring-white"
                >
                  <MainIcon className="size-4 text-primary" aria-hidden />
                  {category.name}
                </Link>
              </li>
            ))}
            <li className="flex items-center gap-1.5">
              <MapPin className="size-4" aria-hidden />
              {p.city}
            </li>
            <li>
              <Rating
                value={p.ratingAverage}
                count={p.ratingCount}
                variant="compact"
                className="text-white [&_.text-muted-foreground]:text-white/85"
              />
            </li>
          </ul>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <FavoriteButton
          providerId={p.id}
          providerName={p.displayName}
          className="size-12 bg-white"
        />
        <Button
          asChild
          size="lg"
          className="h-12 flex-1 rounded-full bg-secondary px-7 text-base font-semibold text-primary shadow-pop hover:bg-background has-[>svg]:px-7 sm:flex-none"
        >
          <Link to={requestUrl}>
            <Mail aria-hidden />
            Contacter le prestataire
          </Link>
        </Button>
      </div>
    </header>
  );
}
