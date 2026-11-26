import { describe, expect, it } from 'vitest';
import {
  canHaveProviderProfile,
  computeDepositAmount,
  computePriceFrom,
  computeProviderRating,
  computeQuoteTotal,
  getMissingProfileRequirements,
  isProviderAvailable,
} from '../../rules';
import { mockDataSchema } from '../data';
import { buildSeed } from './buildSeed';
import { DEMO_CLIENT_ID, DEMO_PASSWORD, DEMO_PROVIDER_ID, seedDemoAccounts } from './people';

const NOW = new Date('2026-11-22T12:00:00Z');
const TODAY = '2026-11-22';
const data = buildSeed(NOW);

/*
 * Ces tests vérifient que les données de démo sont cohérentes avec le modèle
 * ET avec les règles métier : si quelqu'un modifie le seed à la main et casse
 * une règle, on le voit tout de suite.
 */
describe('le jeu de données de démo', () => {
  it('passe la validation Zod de toutes les entités', () => {
    const result = mockDataSchema.safeParse(data);
    expect(result.success ? [] : result.error.issues.slice(0, 5)).toEqual([]);
  });

  it('est identique pour une même date (pas de hasard)', () => {
    expect(buildSeed(NOW)).toEqual(data);
  });

  describe('les catégories', () => {
    const groups = data.categories.filter((category) => !category.parentId);

    it('ont 8 groupes, chacun avec ses sous-catégories', () => {
      expect(groups.map((group) => group.name)).toEqual([
        'Organisation & lieux',
        'Traiteur & boissons',
        'Mode & tenues',
        'Déco & location',
        'Musique & animation',
        'Beauté & soins',
        'Photo & vidéo',
        'Services événementiels',
      ]);
      for (const group of groups) {
        const children = data.categories.filter((category) => category.parentId === group.id);
        expect(children.length, group.name).toBeGreaterThanOrEqual(4);
      }
    });

    it('ont des identifiants et des slugs uniques, et un seul niveau de profondeur', () => {
      const ids = data.categories.map((category) => category.id);
      const slugs = data.categories.map((category) => category.slug);
      expect(new Set(ids).size).toBe(ids.length);
      expect(new Set(slugs).size).toBe(slugs.length);
      const groupIds = new Set(groups.map((group) => group.id));
      for (const category of data.categories) {
        if (category.parentId) expect(groupIds).toContain(category.parentId);
      }
    });

    it('sont toutes connues des prestataires et de leurs prestations', () => {
      const known = new Set(data.categories.map((category) => category.id));
      for (const provider of data.providers) {
        for (const id of provider.categoryIds) expect(known, provider.slug).toContain(id);
      }
      for (const offering of data.offerings) expect(known).toContain(offering.categoryId);
    });
  });

  it('contient environ 25 prestataires, dont une vingtaine publiés en Île-de-France', () => {
    expect(data.providers.length).toBeGreaterThanOrEqual(25);
    const published = data.providers.filter((p) => p.status === 'published');
    expect(published.length).toBeGreaterThanOrEqual(20);
    const idf = ['75', '77', '78', '91', '92', '93', '94', '95'];
    for (const provider of published) {
      expect(idf).toContain(provider.postalCode.slice(0, 2));
    }
  });

  it('a des identifiants uniques dans chaque table', () => {
    for (const [table, rows] of Object.entries(data)) {
      // Les tables de connexion (M5) sont repérées par l'utilisateur ou l'email, pas par un id.
      const ids = (rows as { id?: string; userId?: string; email?: string }[]).map(
        (row) => row.id ?? row.userId ?? row.email,
      );
      expect(new Set(ids).size, table).toBe(ids.length);
    }
  });

  it('donne le mot de passe de démo à chaque compte (connexion par email)', () => {
    expect(data.credentials).toHaveLength(data.users.length);
    expect(new Set(data.credentials.map((c) => c.password))).toEqual(new Set([DEMO_PASSWORD]));
  });

  it('a des slugs de prestataires uniques', () => {
    const slugs = data.providers.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('propose les 3 comptes de démo, qui existent bien', () => {
    expect(seedDemoAccounts).toHaveLength(3);
    for (const account of seedDemoAccounts) {
      const user = data.users.find((u) => u.id === account.userId);
      expect(user?.roles).toEqual(account.roles);
    }
  });

  it('a des demandes dans chaque statut', () => {
    const statuses = new Set(data.quoteRequests.map((r) => r.status));
    expect([...statuses].sort()).toEqual(
      ['accepted', 'cancelled', 'declined', 'expired', 'pending', 'quoted'].sort(),
    );
  });

  it('donne au compte cliente de démo une demande de chaque statut', () => {
    const mine = data.quoteRequests.filter((r) => r.clientId === DEMO_CLIENT_ID);
    expect(new Set(mine.map((r) => r.status)).size).toBe(6);
  });

  it('donne au prestataire de démo des demandes reçues ET envoyées (compte à deux rôles)', () => {
    const profile = data.providers.find((p) => p.userId === DEMO_PROVIDER_ID)!;
    const received = data.quoteRequests.filter((r) => r.providerId === profile.id);
    const sent = data.quoteRequests.filter((r) => r.clientId === DEMO_PROVIDER_ID);
    expect(received.some((r) => r.status === 'pending')).toBe(true);
    expect(received.some((r) => r.status === 'quoted')).toBe(true);
    expect(sent.length).toBeGreaterThan(0);
  });

  it('a des devis et des réservations dans des statuts variés', () => {
    expect(new Set(data.quotes.map((q) => q.status))).toEqual(
      new Set(['sent', 'accepted', 'superseded']),
    );
    expect(new Set(data.bookings.map((b) => b.status))).toEqual(
      new Set(['confirmed', 'completed', 'cancelled']),
    );
  });
});

describe('cohérence avec les règles métier', () => {
  it('règle n° 1 : chaque profil appartient à un utilisateur prestataire', () => {
    for (const profile of data.providers) {
      const owner = data.users.find((u) => u.id === profile.userId);
      expect(owner && canHaveProviderProfile(owner), profile.slug).toBe(true);
    }
  });

  it('règle n° 2 : les profils publiés ou en validation sont complets', () => {
    for (const profile of data.providers.filter((p) =>
      ['published', 'pending_review'].includes(p.status),
    )) {
      const media = data.media.filter((m) => m.providerId === profile.id);
      const offerings = data.offerings.filter((o) => o.providerId === profile.id);
      expect(getMissingProfileRequirements(profile, media, offerings), profile.slug).toEqual([]);
    }
  });

  it('règle n° 4 : personne ne s’envoie de demande à soi-même', () => {
    for (const request of data.quoteRequests) {
      const provider = data.providers.find((p) => p.id === request.providerId)!;
      expect(provider.userId).not.toBe(request.clientId);
    }
  });

  it('le prix « à partir de » correspond aux formules', () => {
    for (const profile of data.providers) {
      const offerings = data.offerings.filter((o) => o.providerId === profile.id);
      expect(profile.priceFrom, profile.slug).toBe(computePriceFrom(offerings));
    }
  });

  it('règle n° 8 : la note moyenne correspond aux avis publiés', () => {
    for (const profile of data.providers) {
      const reviews = data.reviews.filter((r) => r.providerId === profile.id);
      expect(
        { ratingAverage: profile.ratingAverage, ratingCount: profile.ratingCount },
        profile.slug,
      ).toEqual(computeProviderRating(reviews));
    }
  });

  it('règle n° 6 : un avis par réservation terminée, écrit par son client', () => {
    const reviewedBookings = data.reviews.map((r) => r.bookingId);
    expect(new Set(reviewedBookings).size).toBe(reviewedBookings.length);
    for (const review of data.reviews) {
      const booking = data.bookings.find((b) => b.id === review.bookingId)!;
      expect(booking.status).toBe('completed');
      expect(booking.clientId).toBe(review.authorId);
      expect(booking.providerId).toBe(review.providerId);
    }
  });

  it('laisse au moins une réservation terminée sans avis (pour la démo du lot 6)', () => {
    const reviewed = new Set(data.reviews.map((r) => r.bookingId));
    const toReview = data.bookings.filter(
      (b) => b.clientId === DEMO_CLIENT_ID && b.status === 'completed' && !reviewed.has(b.id),
    );
    expect(toReview.length).toBeGreaterThan(0);
  });

  it('les totaux de devis et les acomptes sont justes', () => {
    for (const quote of data.quotes) {
      expect(quote.totalAmount).toBe(computeQuoteTotal(quote.lines));
    }
    for (const booking of data.bookings) {
      const quote = data.quotes.find((q) => q.id === booking.quoteId)!;
      expect(quote.status).toBe('accepted');
      expect(booking.totalAmount).toBe(quote.totalAmount);
      expect(booking.depositAmount).toBe(
        computeDepositAmount(quote.totalAmount, quote.depositRate),
      );
    }
  });

  it('une demande acceptée a exactement un devis accepté et une réservation', () => {
    for (const request of data.quoteRequests.filter((r) => r.status === 'accepted')) {
      const quotes = data.quotes.filter((q) => q.quoteRequestId === request.id);
      expect(quotes.filter((q) => q.status === 'accepted')).toHaveLength(1);
      expect(data.bookings.filter((b) => b.quoteRequestId === request.id)).toHaveLength(1);
    }
  });

  it('chaque réservation active bloque sa date, une réservation annulée non', () => {
    for (const booking of data.bookings) {
      const blocked = data.unavailabilities.some((u) => u.bookingId === booking.id);
      expect(blocked).toBe(booking.status !== 'cancelled');
    }
  });

  it('règle n° 3 : aucune demande en cours ne tombe sur une date indisponible', () => {
    for (const request of data.quoteRequests.filter((r) => r.status === 'pending')) {
      const profile = data.providers.find((p) => p.id === request.providerId)!;
      const unavailabilities = data.unavailabilities.filter((u) => u.providerId === profile.id);
      expect(
        isProviderAvailable({ ...profile, unavailabilities }, request.eventDate),
        request.id,
      ).toBe(true);
    }
  });

  it('les réservations à venir sont dans le futur, les terminées dans le passé', () => {
    for (const booking of data.bookings) {
      if (booking.status === 'confirmed') expect(booking.eventDate > TODAY).toBe(true);
      if (booking.status === 'completed') expect(booking.eventDate < TODAY).toBe(true);
    }
  });

  it('aucune date de création n’est dans le futur', () => {
    const all = Object.values(data).flat() as { createdAt?: string }[];
    for (const row of all) {
      if (row.createdAt) expect(new Date(row.createdAt) <= NOW).toBe(true);
    }
  });

  it('règle n° 7 : les coordonnées sont masquées avant réservation, et visibles après', () => {
    const masked = data.messages.filter((m) => m.hasMaskedContent);
    expect(masked.length).toBeGreaterThan(0);
    for (const message of masked) {
      expect(message.body).toContain('[coordonnées masquées]');
    }
    // Après la réservation avec DJ Makossa Vibes, le numéro du DJ est visible.
    expect(data.messages.some((m) => m.body.includes('07 98 76 54 32'))).toBe(true);
  });

  it('une conversation par demande, avec des compteurs de non-lus cohérents', () => {
    expect(data.conversations).toHaveLength(data.quoteRequests.length);
    const unreadForAissatou = data.conversations
      .filter((c) => c.clientId === DEMO_CLIENT_ID)
      .reduce((sum, c) => sum + c.unreadCountClient, 0);
    expect(unreadForAissatou).toBeGreaterThan(0);
  });

  it('toutes les références pointent vers des lignes qui existent', () => {
    const ids = (rows: { id: string }[]) => new Set(rows.map((r) => r.id));
    const users = ids(data.users);
    const providers = ids(data.providers);
    const categories = ids(data.categories);
    const origins = ids(data.culturalOrigins);
    for (const p of data.providers) {
      for (const c of p.categoryIds) expect(categories.has(c), `${p.slug} → ${c}`).toBe(true);
      for (const o of p.culturalOriginIds) expect(origins.has(o), `${p.slug} → ${o}`).toBe(true);
    }
    for (const o of data.offerings) {
      expect(providers.has(o.providerId)).toBe(true);
      expect(categories.has(o.categoryId)).toBe(true);
    }
    for (const r of data.quoteRequests) {
      expect(users.has(r.clientId)).toBe(true);
      expect(providers.has(r.providerId)).toBe(true);
    }
    for (const m of data.messages) expect(users.has(m.senderId)).toBe(true);
  });
});
