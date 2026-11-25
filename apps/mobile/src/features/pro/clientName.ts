/**
 * Le nom d'un client, tel que le prestataire le voit : « Aïssatou D. ».
 * L'initiale arrive déjà avec son point (« D. ») ; elle est vide pour un compte supprimé.
 */
export function clientName(client: { firstName: string; lastNameInitial: string }) {
  return `${client.firstName} ${client.lastNameInitial}`.trim();
}
