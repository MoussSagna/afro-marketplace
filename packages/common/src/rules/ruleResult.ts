/**
 * Le résultat d'une règle qui autorise ou refuse une action.
 *
 * Plutôt qu'un simple booléen, on renvoie AUSSI la raison du refus :
 * - `reason` : un code stable, pour le code et les tests (« provider_unavailable ») ;
 * - `message` : une phrase prête à afficher à l'utilisateur.
 */
export type RuleResult<Reason extends string = string> =
  { allowed: true } | { allowed: false; reason: Reason; message: string };

export const allow = (): { allowed: true } => ({ allowed: true });

export function deny<Reason extends string>(
  reason: Reason,
  message: string,
): { allowed: false; reason: Reason; message: string } {
  return { allowed: false, reason, message };
}
