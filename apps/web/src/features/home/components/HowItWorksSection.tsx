import { ArrowRight } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { HOW_IT_WORKS_STEPS } from '../lib/howItWorks';

/**
 * 5ᵉ section de l'accueil : « Comment ça marche », en 3 étapes numérotées.
 * Même grammaire que les sections au-dessus : surtitre entre tirets, titre `font-display`, mot accent souligné.
 * Cartes ivoire sur fond sable, liseré orange en haut, grand numéro `font-display` ; un fil pointillé
 * relie les étapes (horizontal sur ordinateur, vertical sur téléphone et tablette).
 * Les cartes montent l'une après l'autre quand la section arrive à l'écran.
 * Avec « réduire les animations », elles sont là d'emblée : `MotionConfig` ne coupe que les
 * déplacements, pas les fondus, d'où `initial={false}`.
 */
export function HowItWorksSection() {
  const reduceMotion = useReducedMotion();
  return (
    <section aria-labelledby="how-title" className="bg-muted">
      <div className="mx-auto max-w-[1539px] px-4 py-16 sm:px-6 lg:px-8 lg:py-[93px]">
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
          <p className="flex items-center gap-3 text-xs font-bold tracking-[0.12em] text-primary uppercase sm:text-sm lg:text-[17px]">
            <span aria-hidden className="h-0.5 w-4 shrink-0 bg-primary sm:w-5" />
            Comment ça marche
            <span aria-hidden className="h-0.5 w-4 shrink-0 bg-primary sm:w-5" />
          </p>
          <h2
            id="how-title"
            className="mt-4 font-display text-4xl leading-[1.08] font-bold tracking-[-0.01em] text-balance sm:text-5xl lg:text-[52px] lg:leading-[1.05]"
          >
            Trois étapes,{' '}
            <span className="relative inline-block text-title-accent">
              zéro prise de tête.
              <svg
                aria-hidden
                className="absolute -bottom-3 left-[6%] h-3 w-[92%] text-ochre"
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
            </span>
          </h2>
        </div>

        <ol className="relative mx-auto mt-12 grid max-w-2xl gap-8 lg:mt-16 lg:max-w-none lg:grid-cols-3 lg:gap-10">
          {/* Fil pointillé qui relie les étapes, derrière les cartes. */}
          <span
            aria-hidden
            className="absolute inset-y-8 left-1/2 border-l-2 border-dashed border-primary/30 lg:hidden"
          />
          <span
            aria-hidden
            className="absolute inset-x-[16%] top-[78px] hidden border-t-2 border-dashed border-primary/30 lg:block"
          />
          {HOW_IT_WORKS_STEPS.map(({ icon: Icon, title, text }, index) => (
            <motion.li
              key={title}
              initial={reduceMotion ? false : { opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.5, delay: index * 0.15, ease: 'easeOut' }}
              className="group relative flex flex-col rounded-3xl border-t-4 border-cta bg-background p-7 shadow-card transition-[translate,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-pop motion-reduce:transition-none motion-reduce:hover:translate-y-0 lg:p-9"
            >
              <div className="flex items-center justify-between">
                <span
                  aria-hidden
                  className="font-display text-5xl leading-none font-bold text-title-accent lg:text-6xl"
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform duration-300 group-hover:scale-110 motion-reduce:transition-none motion-reduce:group-hover:scale-100">
                  <Icon className="size-6" aria-hidden />
                </span>
              </div>
              <h3 className="mt-6 font-display text-2xl font-bold lg:text-[26px]">
                <span className="sr-only">Étape {index + 1} : </span>
                {title}
              </h3>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground lg:text-lg">
                {text}
              </p>
            </motion.li>
          ))}
        </ol>

        <div className="mt-12 flex justify-center lg:mt-14">
          <Button asChild size="lg" variant="cta" className="h-12 px-7 text-base font-semibold">
            <Link to="/recherche">
              Commencer ma recherche
              <ArrowRight className="size-5" aria-hidden />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
