import { REPORT_REASON_LABELS, type AdminReport, type ProviderProfile } from '@afro/common';

/** Une tâche qui attend l'admin : un profil à valider ou un signalement ouvert. */
export interface PriorityTask {
  id: string;
  kind: 'provider' | 'report';
  title: string;
  description: string;
  /** Le badge : « À valider » (profil) ou « À traiter » (signalement). */
  status: string;
  /** Le dossier à ouvrir avec « Examiner ». */
  href: string;
  /** Depuis quand la tâche attend (ISO UTC). */
  since: string;
}

/** Combien de tâches la vue d'ensemble montre ; le reste est dans les listes complètes. */
export const PRIORITY_TASKS_LIMIT = 4;

/**
 * Les tâches de la vue d'ensemble, à partir des vraies listes (profils `pending_review`,
 * signalements `open`) : aucune tâche inventée. Il n'y a pas de niveau de priorité en base,
 * donc on traite d'abord ce qui attend depuis le plus longtemps (comme la file A2).
 * Un signalement s'ouvre sur sa carte dans la page Signalements (`#rep-…`).
 */
export function buildPriorityTasks(
  providers: ProviderProfile[],
  openReports: AdminReport[],
): PriorityTask[] {
  const tasks: PriorityTask[] = [
    ...providers.map((provider) => ({
      id: provider.id,
      kind: 'provider' as const,
      title: 'Profil prestataire en attente',
      description: [provider.displayName, provider.city].filter(Boolean).join(' · '),
      status: 'À valider',
      href: `/admin/prestataires/${provider.id}`,
      since: provider.updatedAt,
    })),
    ...openReports
      .filter((report) => report.status === 'open')
      .map((report) => ({
        id: report.id,
        kind: 'report' as const,
        title: 'Signalement à traiter',
        description: `${REPORT_REASON_LABELS[report.reason]} · ${report.target.label}`,
        status: 'À traiter',
        href: `/admin/signalements#${report.id}`,
        since: report.createdAt,
      })),
  ];
  return tasks.sort((a, b) => a.since.localeCompare(b.since));
}
