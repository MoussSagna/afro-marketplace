import { Link } from 'react-router';
import { StaticPage, StaticSection } from '../components/StaticPage';

/*
 * Les textes juridiques (P7). Ils sont PROVISOIRES : rédigés pour le MVP, ils doivent être
 * relus par un juriste avant l'ouverture (voir agents/questions-ouvertes.md, n° 6 et 7).
 * Les éléments entre crochets sont à compléter.
 */

const UPDATED_AT = '22 novembre 2026';

export function TermsPage() {
  return (
    <StaticPage
      title="Conditions générales d’utilisation"
      description="Les règles d’utilisation de Teranga pour les clients et les prestataires."
      updatedAt={UPDATED_AT}
      draft
    >
      <StaticSection title="1. Objet">
        <p>
          Teranga est une plateforme de mise en relation entre des personnes qui organisent un
          événement (les « clients ») et des professionnels de l’événementiel (les « prestataires
          »). Teranga n’est pas partie aux contrats conclus entre clients et prestataires.
        </p>
      </StaticSection>
      <StaticSection title="2. Compte">
        <p>
          L’inscription est réservée aux personnes majeures. Vous êtes responsable des informations
          de votre compte et de la confidentialité de vos accès. Vous pouvez supprimer votre compte
          à tout moment depuis « Mon compte ».
        </p>
      </StaticSection>
      <StaticSection title="3. Demandes, devis et réservations">
        <p>
          Une demande de devis n’engage pas le client. La réservation est conclue quand le client
          accepte un devis : la date est alors bloquée dans l’agenda du prestataire. Le paiement se
          fait directement entre le client et le prestataire, selon les conditions du devis.
        </p>
      </StaticSection>
      <StaticSection title="4. Annulation">
        <p>
          Les conditions d’annulation sont celles choisies par le prestataire (souple, modérée ou
          stricte) et affichées sur son profil et dans le devis.
        </p>
      </StaticSection>
      <StaticSection title="5. Obligations des prestataires">
        <p>
          Le prestataire garantit l’exactitude de son profil (identité, statut, SIRET, photos,
          tarifs) et respecte la réglementation applicable à son activité (hygiène alimentaire,
          droits d’auteur, assurances…). Chaque profil est relu par Teranga avant publication.
        </p>
      </StaticSection>
      <StaticSection title="6. Avis et contenus">
        <p>
          Seul un client dont la réservation a eu lieu peut laisser un avis, une fois par
          réservation. Les contenus illicites, injurieux ou trompeurs peuvent être signalés,
          masqués, et leur auteur suspendu.
        </p>
      </StaticSection>
      <StaticSection title="7. Tarifs">
        <p>
          L’utilisation de Teranga est gratuite pour les clients. Elle est gratuite pour les
          prestataires pendant la phase de lancement ; toute évolution sera annoncée au moins 30
          jours à l’avance.
        </p>
      </StaticSection>
      <StaticSection title="8. Droit applicable">
        <p>Les présentes conditions sont soumises au droit français.</p>
      </StaticSection>
    </StaticPage>
  );
}

export function LegalNoticePage() {
  return (
    <StaticPage
      title="Mentions légales"
      description="Éditeur, hébergeur et contact du site Teranga."
      updatedAt={UPDATED_AT}
      draft
    >
      <StaticSection title="Éditeur">
        <p>
          [Raison sociale], [forme juridique] au capital de [montant], immatriculée au RCS de
          [ville] sous le numéro [SIREN], dont le siège est situé [adresse].
          <br />
          Directeur de la publication : [nom].
          <br />
          Contact : contact@teranga.example (adresse provisoire).
        </p>
      </StaticSection>
      <StaticSection title="Hébergement">
        <p>
          Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis. [À compléter avec
          l’hébergeur des données (Supabase) au lot 10.]
        </p>
      </StaticSection>
      <StaticSection title="Propriété intellectuelle">
        <p>
          Les photos et textes des profils appartiennent à leurs auteurs, qui en autorisent
          l’affichage sur Teranga. Le reste du site est la propriété de l’éditeur.
        </p>
      </StaticSection>
    </StaticPage>
  );
}

export function PrivacyPage() {
  return (
    <StaticPage
      title="Politique de confidentialité"
      description="Quelles données Teranga collecte, pourquoi, combien de temps, et comment exercer vos droits."
      updatedAt={UPDATED_AT}
      draft
    >
      <StaticSection title="Données collectées">
        <ul className="list-disc space-y-1 pl-5">
          <li>Compte : prénom, nom, email, téléphone (facultatif), préférences de notification.</li>
          <li>Demandes et réservations : type d’événement, date, lieu, budget, messages.</li>
          <li>Prestataires : profil professionnel, SIRET, photos, formules, agenda.</li>
        </ul>
      </StaticSection>
      <StaticSection title="Pourquoi">
        <p>
          Pour faire fonctionner le service (exécution du contrat) : mise en relation, devis,
          réservations, messagerie, avis, modération. Les emails de nouveautés ne sont envoyés
          qu’avec votre accord, modifiable dans « Mon compte ».
        </p>
      </StaticSection>
      <StaticSection title="Ce que voient les autres utilisateurs">
        <p>
          Un prestataire voit votre prénom et l’initiale de votre nom, jamais votre email ni votre
          téléphone.
        </p>
      </StaticSection>
      <StaticSection title="Durée de conservation">
        <p>
          Tant que votre compte est actif. [Durées à préciser avec le juriste, notamment pour les
          obligations comptables et la gestion des litiges.]
        </p>
      </StaticSection>
      <StaticSection title="Vos droits">
        <p>
          Vous pouvez consulter et corriger vos informations dans{' '}
          <Link to="/espace/compte" className="text-primary underline">
            Mon compte
          </Link>
          , et supprimer votre compte depuis la même page : vos informations personnelles sont alors
          effacées et vos avis restent, signés « Utilisateur supprimé ». Pour toute autre demande
          (accès, portabilité, opposition), écrivez à contact@teranga.example. Vous pouvez aussi
          saisir la CNIL.
        </p>
      </StaticSection>
      <StaticSection title="Cookies">
        <p>
          Teranga n’utilise que le stockage nécessaire au fonctionnement (garder votre session
          ouverte). Aucun cookie publicitaire ni de mesure d’audience pour l’instant.
        </p>
      </StaticSection>
    </StaticPage>
  );
}
