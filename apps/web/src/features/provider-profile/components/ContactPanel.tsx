import { CalendarDays, Check, Info, Mail, Phone, Zap } from 'lucide-react';
import { useId, useState } from 'react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';

interface ContactPanelProps {
  requestUrl: string;
  /** « 3 h », « 2 j » : le délai de réponse moyen, s'il est connu. */
  responseTime?: string;
  /** Les points rassurants, tous tirés du profil (déplacement, annulation…). */
  highlights: string[];
}

/**
 * « Parlons de votre événement » : le panneau de contact, à droite sur ordinateur (collant au défilement,
 * géré par la page), dans le flux sur téléphone.
 *
 * « Envoyer une demande » ouvre le formulaire de demande de devis existant (Q1).
 * « Afficher le numéro » n'affiche pas de numéro : les coordonnées restent masquées tant qu'il n'y a pas
 * de réservation confirmée (règle n° 7) et l'API ne renvoie pas le téléphone du prestataire
 * (question ouverte n° 13). Le bouton explique donc comment le joindre.
 */
export function ContactPanel({ requestUrl, responseTime, highlights }: ContactPanelProps) {
  const [showPhoneInfo, setShowPhoneInfo] = useState(false);
  const phoneInfoId = useId();

  return (
    <section
      aria-labelledby="contact-title"
      className="@container rounded-2xl border bg-card p-6 shadow-card"
    >
      {/* Panneau large (tablette, colonne unique) : texte à gauche, actions à droite. */}
      <div className="grid gap-5 @2xl:grid-cols-2 @2xl:gap-x-8">
        <div className="flex flex-col gap-5">
          <div className="flex items-start gap-4">
            <span
              aria-hidden
              className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary"
            >
              <CalendarDays className="size-7" strokeWidth={1.8} />
            </span>
            <h2 id="contact-title" className="font-display text-2xl leading-tight font-semibold">
              Parlons de votre événement
            </h2>
          </div>
          <p className="leading-relaxed text-foreground/90">
            Une question, une disponibilité ou un besoin spécifique ? Contactez directement le
            prestataire pour échanger sur votre projet.
          </p>
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-3">
            <Button
              asChild
              size="lg"
              className="h-12 w-full text-base font-semibold has-[>svg]:px-6"
            >
              <Link to={requestUrl}>
                <Mail aria-hidden />
                Envoyer une demande
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-12 w-full border-primary/30 bg-card text-base font-semibold text-primary has-[>svg]:px-6"
              aria-expanded={showPhoneInfo}
              aria-controls={phoneInfoId}
              onClick={() => setShowPhoneInfo((value) => !value)}
            >
              <Phone aria-hidden />
              Afficher le numéro
            </Button>
            {showPhoneInfo && (
              <p
                id={phoneInfoId}
                className="flex gap-2 rounded-lg bg-muted p-3 text-sm text-muted-foreground"
              >
                <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                Le numéro est communiqué une fois la réservation confirmée. D’ici là, envoyez une
                demande : le prestataire vous répond dans votre messagerie Wenzee.
              </p>
            )}
          </div>

          {responseTime && (
            <p className="flex items-center justify-center gap-2 text-[15px]">
              <Zap className="size-5 text-ochre" aria-hidden />
              Répond en {responseTime} en moyenne
            </p>
          )}

          {highlights.length > 0 && (
            <ul className="flex flex-col gap-2.5 rounded-xl bg-secondary/60 p-4 text-[15px]">
              {highlights.map((highlight) => (
                <li key={highlight} className="flex items-start gap-3">
                  <Check className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                  {highlight}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
