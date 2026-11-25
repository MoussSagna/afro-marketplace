import { Link } from 'react-router';
import { categorySearchUrl, type CategoryShortcut } from '../lib/heroContent';

/**
 * Les catégories populaires du hero : une tuile en verre fumé + son nom.
 * Grand écran : les 8 sur une ligne. Tablette et téléphone : bande qui défile
 * horizontalement (avec aimantation), sans faire déborder la page.
 */
export function CategoryShortcuts({ shortcuts }: { shortcuts: CategoryShortcut[] }) {
  return (
    <nav aria-label="Catégories populaires" className="-mx-4 sm:-mx-6 lg:mx-0">
      <ul className="flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pt-1 pb-2 [scrollbar-width:none] sm:scroll-px-6 sm:gap-4 sm:px-6 lg:justify-between lg:gap-0 lg:overflow-visible lg:px-[63px] [&::-webkit-scrollbar]:hidden">
        {shortcuts.map(({ label, categorySlug, icon: Icon }) => (
          <li key={categorySlug} className="shrink-0 snap-start">
            <Link
              to={categorySearchUrl(categorySlug)}
              className="group flex w-[84px] flex-col items-center gap-2.5 rounded-2xl outline-none sm:w-[100px] lg:w-[120px] lg:gap-2.5"
            >
              <span className="flex h-[68px] w-full items-center justify-center rounded-2xl border border-white/15 bg-foreground/45 shadow-[inset_0_1px_0_rgb(255_255_255/0.08)] backdrop-blur-sm transition-[background-color,border-color,transform] duration-200 group-hover:-translate-y-0.5 group-hover:border-cta/70 group-hover:bg-foreground/65 group-focus-visible:ring-[3px] group-focus-visible:ring-ring group-active:translate-y-0 sm:h-[76px] lg:h-[85px]">
                <Icon className="size-8 text-white lg:size-12" strokeWidth={1.3} aria-hidden />
              </span>
              <span className="text-center text-sm leading-tight font-semibold text-white lg:text-[17px]">
                {label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
