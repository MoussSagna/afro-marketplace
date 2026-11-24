import type { DemoAccount, UserRole } from '../../types';

/*
 * Les personnes qui ne sont PAS des prestataires (les propriétaires des profils
 * sont décrits dans providers.ts). Les trois premiers sont les comptes de démo.
 */

export interface SeedPerson {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  roles: UserRole[];
}

export const DEMO_CLIENT_ID = 'user-aissatou';
/** Mamadou a deux rôles : il tient « Saveurs de Dakar » ET réserve parfois pour lui. */
export const DEMO_PROVIDER_ID = 'user-saveurs-de-dakar';
export const DEMO_ADMIN_ID = 'user-admin';

export const seedPeople: SeedPerson[] = [
  {
    id: DEMO_CLIENT_ID,
    firstName: 'Aïssatou',
    lastName: 'Ndiaye',
    email: 'aissatou.ndiaye@example.com',
    phone: '06 12 34 56 78',
    roles: ['client'],
  },
  {
    id: DEMO_ADMIN_ID,
    firstName: 'Nadia',
    lastName: 'Admin',
    email: 'admin@example.com',
    roles: ['client', 'admin'],
  },
  // Autres clients : auteurs des demandes et des avis passés.
  {
    id: 'user-ibrahim',
    firstName: 'Ibrahim',
    lastName: 'Koné',
    email: 'ibrahim.kone@example.com',
    roles: ['client'],
  },
  {
    id: 'user-grace',
    firstName: 'Grace',
    lastName: 'Mukendi',
    email: 'grace.mukendi@example.com',
    roles: ['client'],
  },
  {
    id: 'user-sophie',
    firstName: 'Sophie',
    lastName: 'Martin',
    email: 'sophie.martin@example.com',
    roles: ['client'],
  },
  {
    id: 'user-kevin',
    firstName: 'Kévin',
    lastName: 'Jean-Louis',
    email: 'kevin.jl@example.com',
    roles: ['client'],
  },
  {
    id: 'user-mariam',
    firstName: 'Mariam',
    lastName: 'Touré',
    email: 'mariam.toure@example.com',
    roles: ['client'],
  },
  {
    id: 'user-yannick',
    firstName: 'Yannick',
    lastName: 'Essomba',
    email: 'yannick.essomba@example.com',
    roles: ['client'],
  },
  {
    id: 'user-claire',
    firstName: 'Claire',
    lastName: 'Dubois',
    email: 'claire.dubois@example.com',
    roles: ['client'],
  },
  {
    id: 'user-moussa',
    firstName: 'Moussa',
    lastName: 'Diop',
    email: 'moussa.diop@example.com',
    roles: ['client'],
  },
];

/**
 * Le mot de passe de TOUS les comptes du jeu de démo (connexion par email, lot M5).
 * Ex. : aissatou.ndiaye@example.com / Wenzee2026.
 */
export const DEMO_PASSWORD = 'Wenzee2026';

/** Les comptes proposés sur la page de connexion de démo (lot 2). */
export const seedDemoAccounts: DemoAccount[] = [
  {
    userId: DEMO_CLIENT_ID,
    label: 'Aïssatou, cliente',
    description:
      'Prépare son mariage : des demandes en cours, une réservation confirmée, un avis à laisser.',
    roles: ['client'],
  },
  {
    userId: DEMO_PROVIDER_ID,
    label: 'Saveurs de Dakar, prestataire',
    description:
      'Mamadou, traiteur : des demandes à traiter, des devis envoyés, un agenda. Il est aussi client.',
    roles: ['client', 'provider'],
  },
  {
    userId: DEMO_ADMIN_ID,
    label: 'Admin',
    description: 'Nadia, modératrice : des profils à valider et des signalements à traiter.',
    roles: ['client', 'admin'],
  },
];
