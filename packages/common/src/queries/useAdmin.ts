import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  ModerateProviderInput,
  ReportStatus,
  ResolveReportInput,
  SetUserStatusInput,
} from '../types';
import { useApiClient } from './ApiClientContext';
import { queryKeys } from './queryKeys';

/**
 * Administration (lot 8). Après chaque décision, on recharge tout l'espace admin
 * ET les profils publics : une validation ou une suspension change la recherche.
 */
function useInvalidateAdmin() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all(
      [queryKeys.admin.all, queryKeys.providers.all].map((queryKey) =>
        queryClient.invalidateQueries({ queryKey }),
      ),
    );
}

/** A1 : les chiffres de la vue d'ensemble. */
export function useAdminOverview() {
  const api = useApiClient();
  return useQuery({ queryKey: queryKeys.admin.overview(), queryFn: () => api.getAdminOverview() });
}

/** A2 : les profils en attente de validation. */
export function useProvidersToReview() {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.admin.providersToReview(),
    queryFn: () => api.listProvidersToReview(),
  });
}

export function useAdminProvider(providerId: string) {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.admin.provider(providerId),
    queryFn: () => api.getAdminProvider(providerId),
    enabled: !!providerId,
  });
}

export function useModerateProvider(providerId: string) {
  const api = useApiClient();
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: (input: ModerateProviderInput) => api.moderateProvider(providerId, input),
    onSuccess: invalidate,
  });
}

/** A3 : les signalements, filtrés par statut. */
export function useAdminReports(status?: ReportStatus) {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.admin.reports(status),
    queryFn: () => api.listReports(status),
  });
}

export function useResolveReport(reportId: string) {
  const api = useApiClient();
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: (input: ResolveReportInput) => api.resolveReport(reportId, input),
    onSuccess: invalidate,
  });
}

/** A4 : recherche d'utilisateurs, paginée. La page précédente reste affichée pendant le chargement. */
export function useAdminUsers(query: { q?: string; page?: number }) {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.admin.users(query),
    queryFn: () => api.listUsers(query),
    placeholderData: keepPreviousData,
  });
}

export function useSetUserStatus(userId: string) {
  const api = useApiClient();
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: (input: SetUserStatusInput) => api.setUserStatus(userId, input),
    onSuccess: invalidate,
  });
}
