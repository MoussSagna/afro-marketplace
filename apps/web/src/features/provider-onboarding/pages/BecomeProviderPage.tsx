import { ApiError, useApiClient, useStartProviderOnboarding } from '@afro/common';
import { CalendarCheck, HandCoins, MessagesSquare, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { usePageMeta } from '@/hooks/usePageMeta';
import { useSessionStore } from '@/stores/session';

const ARGUMENTS = [
  {
    icon: HandCoins,
    title: 'Gratuit au lancement',
    text: 'Pas d’abonnement, pas de commission : tu gardes 100 % de ce que tu factures.',
  },
  {
    icon: Sparkles,
    title: 'Une vitrine à ton image',
    text: 'Photos, formules, cultures et langues : les clients savent tout de suite ce que tu proposes.',
  },
  {
    icon: MessagesSquare,
    title: 'Des demandes qualifiées',
    text: 'Date, lieu, nombre d’invités et budget : tu réponds avec un devis en quelques minutes.',
  },
  {
    icon: CalendarCheck,
    title: 'Ton agenda à jour',
    text: 'Chaque réservation bloque la date ; tu bloques les autres en un clic.',
  },
];

const STEPS = [
  'Crée ton profil en 10 minutes (tu peux t’arrêter et reprendre).',
  'Notre équipe le relit, en général sous 48 h.',
  'Ton profil est en ligne : les demandes de devis arrivent.',
];

/** P6 : la page « Devenir prestataire », et le bouton qui lance l'onboarding (S1). */
export function BecomeProviderPage() {
  usePageMeta(
    'Devenir prestataire',
    'Traiteur, DJ, danseur, coiffeuse… Rejoins Wenzee gratuitement et reçois des demandes de devis.',
  );
  const user = useSessionStore((state) => state.user);
  const setUser = useSessionStore((state) => state.setUser);
  const api = useApiClient();
  const start = useStartProviderOnboarding();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const isProvider = user?.roles.includes('provider') ?? false;

  async function handleStart() {
    setError(null);
    try {
      await start.mutateAsync();
      // Le serveur a ajouté le rôle « provider » : on met la session à jour avant d'entrer dans /pro.
      setUser(await api.getMe());
      navigate('/pro/onboarding');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'La création du profil a échoué, réessaie.');
    }
  }

  const cta = !user ? (
    <Button asChild variant="cta" size="lg">
      <Link to={`/connexion?retour=${encodeURIComponent('/devenir-prestataire')}`}>
        Créer mon profil gratuitement
      </Link>
    </Button>
  ) : isProvider ? (
    <Button asChild variant="cta" size="lg">
      <Link to="/pro">Aller à mon espace pro</Link>
    </Button>
  ) : (
    <Button variant="cta" size="lg" disabled={start.isPending} onClick={handleStart}>
      Créer mon profil gratuitement
    </Button>
  );

  return (
    <>
      <section className="bg-linear-to-b from-muted to-background">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-16 md:py-24">
          <span className="rounded-full bg-accent px-3 py-1 text-sm font-semibold text-accent-foreground">
            Gratuit pendant le lancement
          </span>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl font-display text-4xl leading-tight font-semibold md:text-5xl"
          >
            Fais connaître ton talent,{' '}
            <span className="text-title-accent">on t’amène les clients</span>
          </motion.h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Traiteurs, DJ, danseurs, coiffeuses, speakers… Rejoins la place de marché des
            prestataires afro en Île-de-France.
          </p>
          {cta}
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </div>
      </section>

      <section aria-labelledby="why-title" className="mx-auto max-w-6xl px-4 py-12">
        <h2 id="why-title" className="mb-6 font-display text-3xl font-semibold">
          Pourquoi nous rejoindre
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ARGUMENTS.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex flex-col gap-2 rounded-2xl border bg-card p-5">
              <span className="flex size-11 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <Icon className="size-5" aria-hidden />
              </span>
              <h3 className="font-sans text-lg font-semibold">{title}</h3>
              <p className="text-muted-foreground">{text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="how-title" className="mx-auto max-w-6xl px-4 pb-16">
        <h2 id="how-title" className="mb-6 font-display text-3xl font-semibold">
          Comment ça marche
        </h2>
        <ol className="flex flex-col gap-3">
          {STEPS.map((step, index) => (
            <li key={step} className="flex items-center gap-4">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground">
                {index + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
        <div className="mt-8">{cta}</div>
      </section>
    </>
  );
}
