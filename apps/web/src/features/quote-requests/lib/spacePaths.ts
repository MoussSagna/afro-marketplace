import type { Side } from '@afro/common';

/** Les adresses des pages « demandes » et « messages » de chaque espace. */
export const SPACE_PATHS: Record<Side, { requests: string; messages: string }> = {
  client: { requests: '/espace/demandes', messages: '/espace/messages' },
  provider: { requests: '/pro/demandes', messages: '/pro/messages' },
};
