import { CalendarCheck, MessageSquareText, Search } from 'lucide-react';

const STEPS = [
  {
    icon: Search,
    title: 'Trouvez',
    text: 'Cherchez par prestation, origine, ville et date. Comparez les formules et les avis.',
  },
  {
    icon: MessageSquareText,
    title: 'Demandez un devis',
    text: 'Décrivez votre événement. Le prestataire vous répond avec un devis détaillé.',
  },
  {
    icon: CalendarCheck,
    title: 'Réservez',
    text: 'Acceptez le devis : la date est bloquée et vous échangez directement avec lui.',
  },
];

/** « Comment ça marche » en 3 étapes, sur l'accueil. */
export function HowItWorks() {
  return (
    <section className="bg-sand-100" aria-labelledby="how-title">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <h2 id="how-title" className="mb-8 font-display text-2xl font-semibold">
          Comment ça marche
        </h2>
        <ol className="grid gap-6 md:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, text }, index) => (
            <li key={title} className="flex gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white">
                <Icon className="size-5" aria-hidden />
              </span>
              <div>
                <h3 className="font-semibold">
                  <span className="sr-only">Étape {index + 1} : </span>
                  {title}
                </h3>
                <p className="text-sm text-muted-foreground">{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
