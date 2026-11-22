import { formatOfferingPrice, type Offering } from '@afro/common';
import { Clock, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

/** Les formules et leurs prix indicatifs (P5). */
export function OfferingList({ offerings }: { offerings: Offering[] }) {
  return (
    <section aria-labelledby="offerings-title">
      <h2 id="offerings-title" className="mb-4 font-display text-2xl font-semibold">
        Formules et prix
      </h2>
      <ul className="grid gap-4 sm:grid-cols-2">
        {offerings.map((offering) => {
          const guests = guestsLabel(offering);
          return (
            <li key={offering.id}>
              <Card className="h-full gap-2 py-5">
                <CardHeader>
                  <CardTitle>
                    <h3>{offering.title}</h3>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2 text-sm">
                  <p className="text-base font-semibold text-primary">
                    {formatOfferingPrice(offering)}
                  </p>
                  {offering.description && (
                    <p className="text-muted-foreground">{offering.description}</p>
                  )}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
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
                </CardContent>
              </Card>
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
