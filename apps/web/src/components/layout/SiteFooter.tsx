import { CalendarDays, Store } from 'lucide-react';
import { Link } from 'react-router';
import { Logo } from '@/components/Logo';
import { cn } from '@/lib/utils';
import {
  FOOTER_DISCOVER,
  FOOTER_LEGAL,
  FOOTER_PROFILES,
  FOOTER_SUPPORT,
  SOCIAL_LINKS,
  type FooterLink,
} from './footerContent';
import { NewsletterForm } from './NewsletterForm';
import { SocialIcon } from './SocialIcon';

/*
 * Tailles qui suivent la largeur de l'écran à partir de 1280 px, pour retrouver la maquette (2167 px) :
 * titres 23 px, liens 21 px, sous-titres 18 px au plus.
 */
const heading = 'font-sans text-lg font-bold text-white xl:text-[clamp(1.1rem,1.06vw,1.45rem)]';
const linkText = 'text-[15px] xl:text-[clamp(0.95rem,0.97vw,1.32rem)]';
const focusRing =
  'rounded-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-foreground';
// Colonnes séparées par un filet vertical (grand écran).
const divided =
  'min-[1400px]:border-l min-[1400px]:border-white/15 min-[1400px]:pl-[clamp(1.5rem,2.3vw,3.2rem)]';

/**
 * Le pied de page de toutes les pages (gabarits public, client, pro et admin).
 * À partir de 1400 px : 5 colonnes (marque, Découvrir, Je suis, Aide & Support, Restez informé) puis la barre légale.
 * Tablette et 1280–1399 px : marque en haut, 3 colonnes de liens, lettre d'information. Téléphone : 2 colonnes puis une seule.
 */
export function SiteFooter() {
  return (
    <footer className="bg-foreground text-white/85">
      <div className="mx-auto max-w-[1960px] px-5 pt-14 pb-8 sm:px-8 xl:pt-[clamp(5rem,7.6vw,10.3rem)] xl:pb-[clamp(2.5rem,4.2vw,5.6rem)]">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:max-[1399px]:grid-cols-3 max-md:grid-flow-dense min-[1400px]:grid-cols-[459fr_292fr_393fr_316fr_418fr] min-[1400px]:gap-x-0">
          {/* Marque */}
          <div className="col-span-2 md:max-[1399px]:col-span-3 min-[1400px]:col-span-1 min-[1400px]:pr-8 min-[1400px]:pl-[18px]">
            <Link to="/" aria-label="Wenzee, accueil" className={cn('inline-block', focusRing)}>
              <Logo variant="light" className="h-11 xl:h-[clamp(3rem,3.5vw,4.6rem)]" />
            </Link>
            <p
              className={cn(
                'mt-5 max-w-[420px] leading-relaxed text-white/85 xl:mt-[clamp(1.25rem,1.3vw,1.75rem)] xl:leading-[1.5]',
                linkText,
              )}
            >
              La marketplace afro et caribéenne en France pour trouver les talents qui subliment vos
              événements.
            </p>
            <ul
              aria-label="Réseaux sociaux"
              className="mt-6 flex gap-3 xl:mt-[clamp(1.5rem,1.7vw,2.3rem)] xl:gap-[18px]"
            >
              {SOCIAL_LINKS.map((social) => {
                const circle =
                  'flex size-11 items-center justify-center rounded-full border border-white/35 text-white xl:size-[clamp(2.75rem,2.4vw,3.25rem)]';
                return (
                  <li key={social.network}>
                    {social.url ? (
                      <a
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Wenzee sur ${social.label}`}
                        className={cn(
                          circle,
                          'transition-colors hover:border-cta hover:text-cta',
                          focusRing,
                        )}
                      >
                        <SocialIcon network={social.network} className="size-5 xl:size-6" />
                      </a>
                    ) : (
                      // Compte pas encore créé : pastille visible mais non cliquable.
                      <span
                        role="img"
                        aria-label={`${social.label} (bientôt)`}
                        title={`${social.label} : bientôt disponible`}
                        className={circle}
                      >
                        <SocialIcon network={social.network} className="size-5 xl:size-6" />
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          <LinkColumn title="Découvrir" links={FOOTER_DISCOVER} className={divided} />

          {/* Je suis */}
          <nav
            aria-labelledby="footer-profiles"
            className={cn('col-span-2 md:col-span-1 min-[1400px]:col-span-1', divided)}
          >
            <h2 id="footer-profiles" className={heading}>
              Je suis
            </h2>
            <ul className="mt-5 flex flex-col gap-5 xl:mt-[clamp(1.5rem,2.1vw,2.85rem)] xl:gap-[clamp(1.25rem,1.85vw,2.5rem)]">
              {FOOTER_PROFILES.map((profile) => {
                const Icon = profile.icon === 'store' ? Store : CalendarDays;
                return (
                  <li key={profile.label}>
                    <Link
                      to={profile.to}
                      className={cn(
                        'group flex items-start gap-4 xl:gap-[clamp(1rem,1.4vw,1.9rem)]',
                        focusRing,
                      )}
                    >
                      <Icon
                        className="size-9 shrink-0 text-cta xl:size-[clamp(2.25rem,1.9vw,2.6rem)]"
                        strokeWidth={1.5}
                        aria-hidden
                      />
                      <span className="flex flex-col">
                        <span className={cn(heading, 'group-hover:text-cta')}>{profile.label}</span>
                        <span className="text-sm text-white/80 xl:text-[clamp(0.85rem,0.83vw,1.13rem)]">
                          {profile.hint}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <LinkColumn title="Aide & Support" links={FOOTER_SUPPORT} className={divided} />

          {/* Restez informé */}
          <section
            aria-labelledby="footer-newsletter"
            className="col-span-2 rounded-2xl border border-white/10 bg-white/[0.04] p-6 md:max-[1399px]:col-span-3 min-[1400px]:col-span-1 xl:p-[clamp(1.5rem,1.3vw,1.75rem)]"
          >
            <h2
              id="footer-newsletter"
              className={cn(heading, 'xl:text-[clamp(1.2rem,1.2vw,1.65rem)]')}
            >
              Restez informé
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-white/85 xl:text-[clamp(0.9rem,0.88vw,1.2rem)]">
              Recevez nos nouveautés, offres et événements à ne pas manquer.
            </p>
            <div className="mt-5">
              <NewsletterForm />
            </div>
          </section>
        </div>

        {/* Barre légale */}
        <div className="mt-12 flex flex-col gap-4 border-t border-white/15 pt-6 text-sm md:flex-row md:items-center md:justify-between xl:mt-[clamp(3rem,4.3vw,5.8rem)] xl:pt-[clamp(1.5rem,2.2vw,3rem)] xl:text-[clamp(0.9rem,0.97vw,1.32rem)]">
          <p>
            © {new Date().getFullYear()} Wenzee. Tous droits réservés.
            <span className="mt-1 block text-xs text-white/70 md:mt-0 md:ml-2 md:inline">
              Version de démonstration : données fictives.
            </span>
          </p>
          <nav aria-label="Informations légales">
            <ul className="flex flex-wrap gap-x-4 gap-y-2 md:gap-x-0">
              {FOOTER_LEGAL.map((link, index) => (
                <li key={link.to} className="flex items-center">
                  {index > 0 && (
                    <span
                      aria-hidden
                      className="mx-[clamp(0.75rem,1.3vw,1.8rem)] hidden text-white/50 md:inline"
                    >
                      |
                    </span>
                  )}
                  <Link to={link.to} className={cn('hover:text-white hover:underline', focusRing)}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}

/** Une colonne de liens avec son titre. */
function LinkColumn({
  title,
  links,
  className,
}: {
  title: string;
  links: FooterLink[];
  className?: string;
}) {
  return (
    <nav aria-label={title} className={className}>
      <h2 className={heading}>{title}</h2>
      <ul className="mt-5 flex flex-col gap-3 xl:mt-[clamp(1.25rem,1.55vw,2.1rem)] xl:gap-[clamp(0.5rem,0.55vw,0.75rem)]">
        {links.map((link) => (
          <li key={link.to + link.label}>
            <Link
              to={link.to}
              className={cn('text-white/85 hover:text-white hover:underline', linkText, focusRing)}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
