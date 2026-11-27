import { delay, http, HttpResponse } from 'msw';
import { canChangeProviderStatus, computeProviderRating } from '../../rules';
import {
  moderateProviderInputSchema,
  reportStatusSchema,
  resolveReportInputSchema,
  setUserStatusInputSchema,
} from '../../schemas';
import type {
  AdminActivityItem,
  AdminReport,
  ModerationAction,
  ModerationActionType,
  ProviderProfile,
  Report,
  User,
} from '../../types';
import type { MockDb } from '../db';
import { toPublicUser } from '../mappers';
import { apiError, currentUser, invalidInput } from './http';

const PAGE_SIZE = 20;
const ACTIVITY_LIMIT = { default: 10, max: 50 };
const HIDDEN_MESSAGE = 'Message masqué par la modération.';

/**
 * Administration minimale (lot 8) : profils à valider (A2), signalements (A3),
 * utilisateurs (A4). Chaque décision est inscrite au journal `moderationActions`.
 */
export function adminHandlers(db: MockDb) {
  /** Seuls les comptes « admin » passent ; sinon 401 ou 403. */
  function requireAdmin(request: Request): User | Response {
    const user = currentUser(db, request);
    if (!user) return apiError(401, 'unauthenticated', 'Connecte-toi pour continuer.');
    if (!user.roles.includes('admin')) return apiError(403, 'forbidden', 'Réservé aux admins.');
    return user;
  }

  function log(
    admin: User,
    action: ModerationActionType,
    targetType: ModerationAction['targetType'],
    targetId: string,
    note?: string,
  ) {
    db.data.moderationActions.push({
      id: db.newId('mod'),
      adminId: admin.id,
      action,
      targetType,
      targetId,
      ...(note && { note }),
      createdAt: db.now().toISOString(),
    });
  }

  function refreshRating(providerId: string) {
    const provider = db.data.providers.find((p) => p.id === providerId);
    if (provider) {
      Object.assign(
        provider,
        computeProviderRating(db.data.reviews.filter((r) => r.providerId === providerId)),
      );
    }
  }

  /**
   * Suspendre (ou bannir) un compte : le compte ne peut plus se connecter, et
   * son profil prestataire publié sort de la recherche. Réactiver fait l'inverse.
   */
  function applyUserStatus(user: User, status: User['status']) {
    const at = db.now().toISOString();
    Object.assign(user, { status, updatedAt: at });
    const provider = db.data.providers.find((p) => p.userId === user.id);
    if (!provider) return;
    const next = status === 'active' ? 'published' : 'suspended';
    if (canChangeProviderStatus(provider.status, next)) {
      Object.assign(provider, { status: next, updatedAt: at });
    }
  }

  /** Un nom court et discret : « Aïssatou N. » (le prénom seul si le nom n'est pas encore connu, « - »). */
  function name(userId: string) {
    const user = db.data.users.find((u) => u.id === userId);
    if (!user) return 'Compte supprimé';
    const initial = /^\p{L}/u.test(user.lastName) ? ` ${user.lastName.charAt(0)}.` : '';
    return `${user.firstName}${initial}`;
  }

  /** Un aperçu lisible de ce qui est signalé (ou masqué), pour les écrans A1 et A3. */
  function describeTarget(report: Pick<Report, 'targetType' | 'targetId'>): AdminReport['target'] {
    const { data } = db;
    switch (report.targetType) {
      case 'review': {
        const review = data.reviews.find((r) => r.id === report.targetId);
        if (!review) return { label: 'Avis supprimé', hidden: true };
        const provider = data.providers.find((p) => p.id === review.providerId);
        return {
          label: `Avis de ${name(review.authorId)} sur ${provider?.displayName ?? '?'} (${review.rating}/5)`,
          excerpt: review.comment,
          ownerId: review.authorId,
          hidden: review.status === 'hidden',
        };
      }
      case 'message': {
        const message = data.messages.find((m) => m.id === report.targetId);
        if (!message) return { label: 'Message supprimé', hidden: true };
        return {
          label: `Message de ${name(message.senderId)}`,
          excerpt: message.body,
          ownerId: message.senderId,
          hidden: message.body === HIDDEN_MESSAGE,
        };
      }
      case 'provider': {
        const provider = data.providers.find((p) => p.id === report.targetId);
        if (!provider) return { label: 'Profil supprimé', hidden: true };
        return {
          label: `Profil ${provider.displayName}`,
          excerpt: provider.bio.slice(0, 280),
          ownerId: provider.userId,
          hidden: provider.status === 'suspended',
        };
      }
      case 'media': {
        const media = data.media.find((m) => m.id === report.targetId);
        const provider = media && data.providers.find((p) => p.id === media.providerId);
        if (!media) return { label: 'Photo supprimée', hidden: true };
        return {
          label: `Photo de ${provider?.displayName ?? '?'}`,
          excerpt: media.caption,
          ownerId: provider?.userId,
          hidden: false,
        };
      }
      case 'user': {
        const user = data.users.find((u) => u.id === report.targetId);
        return {
          label: user ? `Compte de ${name(user.id)}` : 'Compte supprimé',
          ownerId: user?.id,
          hidden: user ? user.status !== 'active' : true,
        };
      }
    }
  }

  /** « Masquer le contenu » selon le type : avis masqué, message remplacé, photo retirée, profil suspendu. */
  function hideContent(admin: User, report: Report) {
    const { data } = db;
    const at = db.now().toISOString();
    switch (report.targetType) {
      case 'review': {
        const review = data.reviews.find((r) => r.id === report.targetId);
        if (review) {
          Object.assign(review, { status: 'hidden', updatedAt: at });
          // Règle n° 8 : un avis masqué sort du calcul de la note.
          refreshRating(review.providerId);
        }
        break;
      }
      case 'message': {
        const message = data.messages.find((m) => m.id === report.targetId);
        if (message) Object.assign(message, { body: HIDDEN_MESSAGE, updatedAt: at });
        break;
      }
      case 'media':
        data.media = data.media.filter((m) => m.id !== report.targetId);
        break;
      case 'provider': {
        const provider = data.providers.find((p) => p.id === report.targetId);
        if (provider && canChangeProviderStatus(provider.status, 'suspended')) {
          Object.assign(provider, { status: 'suspended', updatedAt: at });
        }
        break;
      }
      case 'user': {
        const user = data.users.find((u) => u.id === report.targetId);
        if (user) applyUserStatus(user, 'suspended');
        break;
      }
    }
    log(admin, 'hide_content', report.targetType, report.targetId, report.details);
  }

  /**
   * A1 : l'activité récente, reconstruite à partir des tables existantes (aucune donnée inventée) :
   * comptes et profils créés, profils envoyés en validation, signalements, décisions d'admin.
   */
  function buildActivity(): AdminActivityItem[] {
    const { users, providers, reports, moderationActions } = db.data;
    const items: AdminActivityItem[] = [];
    const providerHref = (id: string) => `/admin/prestataires/${id}`;

    for (const user of users) {
      if (user.status === 'deleted') continue;
      const provider = providers.find((p) => p.userId === user.id);
      // Compte et profil créés au même moment = une seule inscription (prestataire).
      if (provider?.createdAt !== user.createdAt) {
        items.push({
          id: `${user.id}:created`,
          type: 'account_created',
          at: user.createdAt,
          subject: name(user.id),
          href: '/admin/utilisateurs',
        });
      }
    }
    for (const provider of providers) {
      const subject = provider.displayName || name(provider.userId);
      items.push({
        id: `${provider.id}:created`,
        type: 'provider_created',
        at: provider.createdAt,
        subject,
        href: providerHref(provider.id),
      });
      if (provider.status === 'pending_review') {
        // La date d'envoi en validation est la dernière mise à jour (comme sur l'écran A2).
        items.push({
          id: `${provider.id}:submitted`,
          type: 'provider_submitted',
          at: provider.updatedAt,
          subject,
          href: providerHref(provider.id),
        });
      }
    }
    for (const report of reports) {
      items.push({
        id: `${report.id}:created`,
        type: 'report_created',
        at: report.createdAt,
        subject: describeTarget(report).label,
        reason: report.reason,
        href: report.status === 'open' ? `/admin/signalements#${report.id}` : '/admin/signalements',
      });
    }
    for (const action of moderationActions) {
      const { targetType, targetId } = action;
      let subject: string;
      let href: string | undefined;
      if (targetType === 'provider') {
        subject = providers.find((p) => p.id === targetId)?.displayName ?? 'Profil supprimé';
        href = providerHref(targetId);
      } else if (targetType === 'user') {
        subject = name(targetId);
        href = '/admin/utilisateurs';
      } else if (targetType === 'report') {
        const report = reports.find((r) => r.id === targetId);
        subject = report ? describeTarget(report).label : 'Signalement supprimé';
        href = '/admin/signalements';
      } else {
        subject = describeTarget({ targetType, targetId }).label;
        href = '/admin/signalements';
      }
      items.push({
        id: action.id,
        type: 'moderation',
        at: action.createdAt,
        subject,
        action: action.action,
        href,
      });
    }
    return items.sort((a, b) => b.at.localeCompare(a.at));
  }

  return [
    http.get('*/api/admin/activity', async ({ request }) => {
      await delay();
      const admin = requireAdmin(request);
      if (admin instanceof Response) return admin;
      const asked = Number(new URL(request.url).searchParams.get('limit'));
      const limit =
        Number.isInteger(asked) && asked > 0
          ? Math.min(asked, ACTIVITY_LIMIT.max)
          : ACTIVITY_LIMIT.default;
      return HttpResponse.json(buildActivity().slice(0, limit));
    }),

    http.get('*/api/admin/overview', async ({ request }) => {
      await delay();
      const admin = requireAdmin(request);
      if (admin instanceof Response) return admin;
      const { providers, reports, users } = db.data;
      return HttpResponse.json({
        providersToReview: providers.filter((p) => p.status === 'pending_review').length,
        openReports: reports.filter((r) => r.status === 'open').length,
        publishedProviders: providers.filter((p) => p.status === 'published').length,
        users: users.filter((u) => u.status !== 'deleted').length,
      });
    }),

    http.get('*/api/admin/providers/to-review', async ({ request }) => {
      await delay();
      const admin = requireAdmin(request);
      if (admin instanceof Response) return admin;
      return HttpResponse.json(
        db.data.providers
          .filter((p) => p.status === 'pending_review')
          .sort((a, b) => a.updatedAt.localeCompare(b.updatedAt)),
      );
    }),

    http.get('*/api/admin/providers/:providerId', async ({ params, request }) => {
      await delay();
      const admin = requireAdmin(request);
      if (admin instanceof Response) return admin;
      const provider = db.data.providers.find((p) => p.id === params.providerId);
      if (!provider) return apiError(404, 'provider_not_found', 'Prestataire introuvable.');
      return HttpResponse.json({
        profile: provider,
        offerings: db.data.offerings.filter((o) => o.providerId === provider.id),
        media: db.data.media
          .filter((m) => m.providerId === provider.id)
          .sort((a, b) => a.order - b.order),
        owner: db.data.users.find((u) => u.id === provider.userId)!,
        history: db.data.moderationActions
          .filter((a) => a.targetType === 'provider' && a.targetId === provider.id)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      });
    }),

    // A2 : valider, demander des corrections ou refuser (avec motif).
    http.post('*/api/admin/providers/:providerId/moderate', async ({ params, request }) => {
      await delay();
      const admin = requireAdmin(request);
      if (admin instanceof Response) return admin;
      const provider = db.data.providers.find((p) => p.id === params.providerId);
      if (!provider) return apiError(404, 'provider_not_found', 'Prestataire introuvable.');
      const parsed = moderateProviderInputSchema.safeParse(await request.json().catch(() => null));
      if (!parsed.success) return invalidInput(parsed.error);

      const decision = parsed.data;
      const next: ProviderProfile['status'] =
        decision.decision === 'validate'
          ? 'published'
          : decision.decision === 'request_changes'
            ? 'changes_requested'
            : 'rejected';
      if (!canChangeProviderStatus(provider.status, next)) {
        return apiError(409, 'invalid_status', 'Ce profil n’est pas en attente de validation.');
      }

      db.update(() => {
        const at = db.now().toISOString();
        Object.assign(provider, { status: next, updatedAt: at });
        if (decision.decision === 'validate') {
          provider.isProVerified = decision.isProVerified && provider.siret !== undefined;
          delete provider.rejectionReason;
          log(admin, 'validate_profile', 'provider', provider.id);
        } else {
          provider.rejectionReason = decision.reason;
          log(
            admin,
            decision.decision === 'request_changes' ? 'request_changes' : 'reject_profile',
            'provider',
            provider.id,
            decision.reason,
          );
        }
      });
      return HttpResponse.json(provider);
    }),

    http.get('*/api/admin/reports', async ({ request }) => {
      await delay();
      const admin = requireAdmin(request);
      if (admin instanceof Response) return admin;
      const status = reportStatusSchema.safeParse(new URL(request.url).searchParams.get('status'));
      const reports = db.data.reports
        .filter((r) => !status.success || r.status === status.data)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((report) => {
          const reporter = db.data.users.find((u) => u.id === report.reporterId)!;
          return { ...report, reporter: toPublicUser(reporter), target: describeTarget(report) };
        });
      return HttpResponse.json(reports);
    }),

    // A3 : classer sans suite, masquer le contenu ou suspendre son auteur.
    http.post('*/api/admin/reports/:reportId/resolve', async ({ params, request }) => {
      await delay();
      const admin = requireAdmin(request);
      if (admin instanceof Response) return admin;
      const report = db.data.reports.find((r) => r.id === params.reportId);
      if (!report) return apiError(404, 'report_not_found', 'Signalement introuvable.');
      if (report.status !== 'open') {
        return apiError(409, 'already_resolved', 'Ce signalement est déjà traité.');
      }
      const parsed = resolveReportInputSchema.safeParse(await request.json().catch(() => null));
      if (!parsed.success) return invalidInput(parsed.error);
      const { outcome, note } = parsed.data;

      const ownerId = describeTarget(report).ownerId;
      const owner = ownerId && db.data.users.find((u) => u.id === ownerId);
      if (outcome === 'suspend_user' && !owner) {
        return apiError(422, 'no_owner', 'Aucun compte à suspendre pour ce signalement.');
      }
      if (outcome === 'suspend_user' && owner && owner.roles.includes('admin')) {
        return apiError(422, 'cannot_suspend_admin', 'On ne suspend pas un compte admin.');
      }

      db.update(() => {
        const at = db.now().toISOString();
        if (outcome === 'dismiss') {
          log(admin, 'dismiss_report', 'report', report.id, note);
        } else if (outcome === 'hide_content') {
          hideContent(admin, report);
        } else if (owner) {
          applyUserStatus(owner, 'suspended');
          log(admin, 'suspend_user', 'user', owner.id, note ?? report.details);
        }
        Object.assign(report, {
          status: outcome === 'dismiss' ? 'dismissed' : 'resolved',
          updatedAt: at,
        });
      });
      return HttpResponse.json(report);
    }),

    http.get('*/api/admin/users', async ({ request }) => {
      await delay();
      const admin = requireAdmin(request);
      if (admin instanceof Response) return admin;
      const url = new URL(request.url);
      const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
      const q = (url.searchParams.get('q') ?? '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '');
      const plain = (text: string) => text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
      const users = db.data.users
        .filter((u) => u.status !== 'deleted')
        .filter((u) => !q || plain(`${u.firstName} ${u.lastName} ${u.email}`).includes(q))
        .sort((a, b) => a.lastName.localeCompare(b.lastName, 'fr'));
      return HttpResponse.json({
        items: users.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
        total: users.length,
        page,
        pageSize: PAGE_SIZE,
      });
    }),

    // A4 : suspendre, bannir ou réactiver un compte (avec motif).
    http.post('*/api/admin/users/:userId/status', async ({ params, request }) => {
      await delay();
      const admin = requireAdmin(request);
      if (admin instanceof Response) return admin;
      const user = db.data.users.find((u) => u.id === params.userId && u.status !== 'deleted');
      if (!user) return apiError(404, 'user_not_found', 'Utilisateur introuvable.');
      const parsed = setUserStatusInputSchema.safeParse(await request.json().catch(() => null));
      if (!parsed.success) return invalidInput(parsed.error);
      if (user.id === admin.id || user.roles.includes('admin')) {
        return apiError(422, 'cannot_suspend_admin', 'On ne change pas le statut d’un admin ici.');
      }
      const { status, note } = parsed.data;
      if (status === user.status) return HttpResponse.json(user);

      db.update(() => {
        applyUserStatus(user, status);
        const action: ModerationActionType =
          status === 'active'
            ? 'reactivate_user'
            : status === 'banned'
              ? 'ban_user'
              : 'suspend_user';
        log(admin, action, 'user', user.id, note);
      });
      return HttpResponse.json(user);
    }),
  ];
}
