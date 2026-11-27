import { formatOfferingPrice, type Offering } from '@afro/common';
import { Clock, Users, type LucideIcon } from 'lucide-react';

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${rest}` : `${hours} h`;
}

function guestsLabel({ minGuests, maxGuests }: Offering): string | undefined {
  if (minGuests && maxGuests) return `De ${minGuests} à ${maxGuests} invités`;
  if (minGuests) return `À partir de ${minGuests} invités`;
  if (maxGuests) return `Jusqu’à ${maxGuests} invités`;
  return undefined;
}

interface OfferingListProps {
  offerings: Offering[];
  /** L'icône de la famille de prestations du profil (les formules n'ont pas de catégorie propre). */
  icon: LucideIcon;
}

/**
 * Onglet « Prestations » : les formules enregistrées par le prestataire, en cartes compactes.
 * Le prix indicatif est gardé (il fait partie des données) ; « Sur devis » quand il n'y en a pas.
 * La grille dépend de la largeur de la colonne (requête de conteneur `@container`), pas de l'écran :
 * 3 cartes par ligne dès que la colonne fait 672 px.
 */
export function OfferingList({ offerings, icon: Icon }: OfferingListProps) {
  return (
    <section aria-labelledby="offerings-title" className="@container">
      <h2
        id="offerings-title"
        className="mb-5 font-display text-[26px] font-semibold md:text-[32px]"
      >
        Nos prestations
      </h2>
      <ul className="grid gap-4 @md:grid-cols-2 @2xl:grid-cols-3">
        {offerings.map((offering) => {
          const guests = guestsLabel(offering);
          return (
            <li
              key={offering.id}
              className="flex flex-col gap-2 rounded-xl border bg-card p-5 shadow-card"
            >
              <span
                aria-hidden
                className="mb-1 flex size-11 items-center justify-center rounded-full bg-secondary text-primary"
              >
                <Icon className="size-[22px]" strokeWidth={1.8} />
              </span>
              <h3 className="text-lg leading-snug font-semibold">{offering.title}</h3>
              {offering.description && (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {offering.description}
                </p>
              )}
              {/* Détails puis prix en bas de carte : le prix est aligné d'une carte à l'autre. */}
              <div className="mt-auto flex flex-col gap-1 pt-1">
                {(offering.durationMinutes || guests) && (
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    {offering.durationMinutes && (
                      <span className="flex items-center gap-1">
                        <Clock className="size-4" aria-hidden />
                        {formatDuration(offering.durationMinutes)}
                      </span>
                    )}
                    {guests && (
                      <span className="flex items-center gap-1">
                        <Users className="size-4" aria-hidden />
                        {guests}
                      </span>
                    )}
                  </div>
                )}
                <p className="text-[15px] font-semibold text-primary">
                  {formatOfferingPrice(offering)}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-sm text-muted-foreground">
        Prix indicatifs : le prestataire vous envoie un devis adapté à votre événement.
      </p>
    </section>
  );
}
