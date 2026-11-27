import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router';

/**
 * Section « Pourquoi Wenzee », sous « Comment ça marche » : la mission en une photo et quelques lignes.
 * Photo à gauche (cadre ocre décalé en arrière-plan), texte à droite ; empilés sur téléphone et tablette.
 * Même grammaire que les sections au-dessus : surtitre à tiret, titre Playfair, mot accent souligné.
 * Fond ivoire : il alterne avec le sable de « Comment ça marche ».
 */
export function WhyWenzeeSection() {
  return (
    <section aria-labelledby="why-title" className="bg-background">
      <div className="mx-auto grid max-w-[1539px] items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-[93px]">
        <div className="relative mx-auto w-full max-w-2xl lg:max-w-none">
          <div
            aria-hidden
            className="absolute inset-0 translate-x-3 translate-y-3 rounded-3xl bg-ochre/70 sm:translate-x-5 sm:translate-y-5"
          />
          <img
            src="/images/hero/celebration.webp"
            srcSet="/images/hero/celebration-900.webp 900w, /images/hero/celebration.webp 1600w"
            sizes="(min-width: 1024px) 50vw, 100vw"
            alt="Un couple danse au milieu d'invités en tenues wax qui applaudissent"
            loading="lazy"
            className="relative aspect-[5/4] w-full rounded-3xl object-cover shadow-card"
          />
        </div>

        <div className="max-w-2xl">
          <p className="flex items-center gap-3 text-sm font-bold tracking-[0.08em] text-primary uppercase lg:text-[17px]">
            <span aria-hidden className="h-0.5 w-7 shrink-0 bg-primary" />
            Pourquoi Wenzee
          </p>
          <h2
            id="why-title"
            className="mt-4 font-display text-4xl leading-[1.08] font-bold tracking-[-0.01em] sm:text-5xl lg:text-[52px] lg:leading-[1.05]"
          >
            Le lien entre{' '}
            <span className="relative inline-block text-title-accent">
              nos talents
              <svg
                aria-hidden
                className="absolute -bottom-3 left-[4%] h-3 w-[94%] text-ochre"
                viewBox="0 0 500 16"
                preserveAspectRatio="none"
                fill="none"
              >
                <path
                  d="M3 12 C 140 3, 330 1, 497 9"
                  stroke="currentColor"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
              </svg>
            </span>{' '}
            et vos moments.
          </h2>
          <p className="mt-8 text-base leading-relaxed text-muted-foreground lg:text-lg">
            Trop de prestataires afro talentueux restent invisibles, et trop d’organisateurs
            cherchent sans trouver. Wenzee les réunit sur une seule plateforme, pensée pour nos
            cultures.
          </p>
          <blockquote className="mt-8 border-l-4 border-cta py-1 pl-5 font-display text-xl text-primary italic lg:text-2xl">
            « Chaque fête mérite des prestataires qui comprennent d’où l’on vient. »
          </blockquote>
          <Link
            to="/comment-ca-marche"
            className="mt-8 inline-flex items-center gap-2 font-semibold text-primary underline-offset-4 hover:underline"
          >
            Découvrir notre mission
            <ArrowRight className="size-5" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
