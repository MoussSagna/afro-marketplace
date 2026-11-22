import type {
  ClientType,
  EventType,
  LegalType,
  PricingType,
  ProviderStatus,
  ModerationActionType,
  ReportReason,
  ReportStatus,
  UserRole,
  UserStatus,
} from '../types';

/*
 * Les libellés français des valeurs codées en anglais.
 * Partagés web + mobile pour que les deux affichent exactement la même chose.
 */

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  wedding: 'Mariage',
  birthday: 'Anniversaire',
  baptism: 'Baptême',
  corporate: 'Événement d’entreprise',
  funeral: 'Funérailles',
  other: 'Autre',
};

/** Qui organise l'événement (demande de devis). */
export const CLIENT_TYPE_LABELS: Record<ClientType, string> = {
  individual: 'À titre personnel',
  business: 'Par une entreprise ou une association',
};

export const LEGAL_TYPE_LABELS: Record<LegalType, string> = {
  individual: 'Indépendant',
  company: 'Entreprise',
  association: 'Association',
};

/** Codes de langue → nom affiché. Les langues inconnues sont affichées telles quelles. */
export const LANGUAGE_LABELS: Record<string, string> = {
  fr: 'Français',
  en: 'Anglais',
  wolof: 'Wolof',
  bambara: 'Bambara',
  lingala: 'Lingala',
  peul: 'Peul',
  soussou: 'Soussou',
  yoruba: 'Yoruba',
  fon: 'Fon',
  ewe: 'Éwé',
  créole: 'Créole',
  shikomori: 'Shikomori',
};

export function languageLabel(code: string): string {
  return LANGUAGE_LABELS[code] ?? code.charAt(0).toUpperCase() + code.slice(1);
}

/** Les motifs de signalement proposés à l'utilisateur. */
export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  fraud: 'Arnaque ou tentative de fraude',
  inappropriate: 'Contenu inapproprié ou insultant',
  spam: 'Spam ou publicité',
  fake_review: 'Faux avis',
  other: 'Autre raison',
};

/** Le statut d'un profil prestataire, vu par son propriétaire (S7). */
export const PROVIDER_STATUS_LABELS: Record<ProviderStatus, string> = {
  draft: 'Brouillon',
  pending_review: 'En cours de validation',
  changes_requested: 'Corrections demandées',
  published: 'Publié',
  rejected: 'Refusé',
  paused: 'En pause',
  suspended: 'Suspendu',
};

/** Comment le prix d'une formule est affiché. */
export const PRICING_TYPE_LABELS: Record<PricingType, string> = {
  from: 'À partir de',
  fixed: 'Prix fixe',
  per_person: 'Par personne',
  on_quote: 'Sur devis',
};

// ---------------------------------------------------------------- Administration (lot 8)

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  client: 'Client',
  provider: 'Prestataire',
  admin: 'Admin',
};

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  active: 'Actif',
  suspended: 'Suspendu',
  banned: 'Banni',
  deleted: 'Supprimé',
};

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  open: 'À traiter',
  resolved: 'Traité',
  dismissed: 'Classé sans suite',
};

/** Le journal de modération, lisible par un humain. */
export const MODERATION_ACTION_LABELS: Record<ModerationActionType, string> = {
  validate_profile: 'Profil validé',
  request_changes: 'Corrections demandées',
  reject_profile: 'Profil refusé',
  hide_content: 'Contenu masqué',
  dismiss_report: 'Signalement classé sans suite',
  suspend_user: 'Compte suspendu',
  ban_user: 'Compte banni',
  reactivate_user: 'Compte réactivé',
};
