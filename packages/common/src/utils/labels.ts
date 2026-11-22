import type { ClientType, EventType, LegalType, ReportReason } from '../types';

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
const LANGUAGE_LABELS: Record<string, string> = {
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
