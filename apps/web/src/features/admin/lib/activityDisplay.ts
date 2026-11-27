import {
  MODERATION_ACTION_LABELS,
  REPORT_REASON_LABELS,
  type AdminActivityItem,
  type ModerationActionType,
} from '@afro/common';
import {
  BadgeCheck,
  EyeOff,
  Flag,
  FlagOff,
  PencilLine,
  Send,
  UserCheck,
  UserPlus,
  UserRoundPlus,
  UserX,
  XCircle,
  type LucideIcon,
} from 'lucide-react';

export interface ActivityDisplay {
  icon: LucideIcon;
  title: string;
  description: string;
}

const MODERATION_ICONS: Record<ModerationActionType, LucideIcon> = {
  validate_profile: BadgeCheck,
  request_changes: PencilLine,
  reject_profile: XCircle,
  hide_content: EyeOff,
  dismiss_report: FlagOff,
  suspend_user: UserX,
  ban_user: UserX,
  reactivate_user: UserCheck,
};

/** Le titre, la phrase et l'icône d'un événement de l'activité récente (A1). */
export function describeActivity(item: AdminActivityItem): ActivityDisplay {
  switch (item.type) {
    case 'account_created':
      return {
        icon: UserRoundPlus,
        title: 'Compte créé',
        description: `${item.subject} a créé un compte.`,
      };
    case 'provider_created':
      return {
        icon: UserPlus,
        title: 'Nouvelle inscription prestataire',
        description: `Profil créé : ${item.subject}.`,
      };
    case 'provider_submitted':
      return {
        icon: Send,
        title: 'Profil envoyé en validation',
        description: `${item.subject} attend votre validation.`,
      };
    case 'report_created':
      return {
        icon: Flag,
        title: 'Nouveau signalement',
        description: item.reason
          ? `${REPORT_REASON_LABELS[item.reason]} · ${item.subject}`
          : item.subject,
      };
    case 'moderation':
      return {
        icon: item.action ? MODERATION_ICONS[item.action] : BadgeCheck,
        title: item.action ? MODERATION_ACTION_LABELS[item.action] : 'Décision de modération',
        description: item.subject,
      };
  }
}
