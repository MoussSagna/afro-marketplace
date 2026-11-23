import { Link } from 'react-router';
import { StaticPage } from '../components/StaticPage';

const QUESTIONS = [
  {
    q: 'Est-ce que c’est payant ?',
    a: 'Non. Chercher un prestataire et demander des devis est gratuit. Au lancement, l’inscription est aussi gratuite pour les prestataires.',
  },
  {
    q: 'Comment se passe le paiement ?',
    a: 'Pour l’instant, vous payez directement le prestataire, selon les conditions écrites dans son devis (acompte, solde). Le paiement en ligne arrivera plus tard.',
  },
  {
    q: 'Combien de temps pour recevoir un devis ?',
    a: 'Le prestataire a 7 jours pour répondre. Sans réponse, la demande expire et vous pouvez en envoyer une autre. Le temps de réponse moyen est affiché sur chaque profil.',
  },
  {
    q: 'Puis-je annuler une réservation ?',
    a: 'Oui, depuis « Mes réservations ». Les conditions d’annulation du prestataire (affichées sur son profil et dans le devis) s’appliquent.',
  },
  {
    q: 'Les profils sont-ils vérifiés ?',
    a: 'Chaque profil est relu par notre équipe avant publication. Le badge « Pro vérifié » indique que le numéro SIRET a été contrôlé.',
  },
  {
    q: 'Qui peut laisser un avis ?',
    a: 'Seulement un client dont la réservation a eu lieu, une fois par réservation. Un avis abusif peut être signalé.',
  },
  {
    q: 'Comment supprimer mon compte ?',
    a: 'Dans « Mon compte », en bas de la page. Vos informations personnelles sont effacées ; vos avis restent, signés « Utilisateur supprimé ».',
  },
  {
    q: 'Comment changer mon email ou signaler un problème ?',
    a: 'Écrivez-nous à contact@wenzee.example (adresse provisoire). Pour un contenu inapproprié, utilisez le bouton « Signaler » sur le message, l’avis ou le profil.',
  },
];

/** P7 : questions fréquentes, en accordéon natif (<details>), accessible sans JavaScript. */
export function FaqPage() {
  return (
    <StaticPage
      title="Questions fréquentes"
      description="Gratuité, paiement, devis, annulation, avis, suppression du compte : les réponses aux questions les plus fréquentes."
    >
      <div className="flex flex-col gap-3">
        {QUESTIONS.map(({ q, a }) => (
          <details key={q} className="group rounded-lg border bg-card p-4">
            <summary className="cursor-pointer font-medium marker:text-primary">{q}</summary>
            <p className="mt-2 text-muted-foreground">{a}</p>
          </details>
        ))}
      </div>
      <p>
        Pas de réponse à votre question ? Voyez aussi{' '}
        <Link to="/comment-ca-marche" className="text-primary underline">
          comment ça marche
        </Link>
        .
      </p>
    </StaticPage>
  );
}
