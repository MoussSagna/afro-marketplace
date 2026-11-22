import {
  computeDepositAmount,
  computePriceFrom,
  computeProviderRating,
  computeQuoteRequestExpiresAt,
  computeQuoteTotal,
  maskContactDetails,
  nextQuoteVersion,
  shouldMaskContactDetails,
} from '../../rules';
import type {
  Booking,
  BookingStatus,
  Conversation,
  EventType,
  Message,
  NotificationPrefs,
  ProviderProfile,
  Quote,
  QuoteRequest,
  QuoteRequestStatus,
  QuoteStatus,
  Review,
} from '../../types';
import { formatPrice } from '../../utils/formatPrice';
import { addDays, parseIsoDate, toIsoDate } from '../../utils/dates';
import type { MockData } from '../data';
import { seedCategories, seedCulturalOrigins } from './catalogue';
import { DEMO_ADMIN_ID, DEMO_CLIENT_ID, DEMO_PROVIDER_ID, seedPeople } from './people';
import { seedProviderDefinitions } from './providers';

/*
 * Construit le jeu de données de démo.
 *
 * Toutes les dates sont RELATIVES à `now` : une réservation « dans 20 jours »
 * restera dans 20 jours quel que soit le jour où tu lances la démo.
 * Les tests passent une date fixe pour obtenir toujours le même résultat.
 *
 * Les champs dérivés (prix « à partir de », note moyenne, total des devis,
 * masquage des coordonnées…) sont calculés avec les règles de common/rules :
 * le seed respecte donc les mêmes règles que l'application.
 */
export function buildSeed(now: Date): MockData {
  const today = toIsoDate(now);
  /** Un jour relatif à aujourd'hui : day(20) = dans 20 jours. */
  const day = (offset: number) => addDays(today, offset);
  /** Une date-heure relative : at(-3, 14) = il y a 3 jours à 14 h (UTC). Jamais dans le futur. */
  const at = (offset: number, hour = 10) => {
    const date = new Date(parseIsoDate(day(offset)).getTime() + hour * 3_600_000);
    return (date > now ? now : date).toISOString();
  };

  const counters = new Map<string, number>();
  const nextId = (prefix: string) => {
    const n = (counters.get(prefix) ?? 0) + 1;
    counters.set(prefix, n);
    return `${prefix}-${n}`;
  };

  const data: MockData = {
    users: [],
    providers: [],
    categories: seedCategories,
    culturalOrigins: seedCulturalOrigins,
    offerings: [],
    media: [],
    unavailabilities: [],
    quoteRequests: [],
    quotes: [],
    bookings: [],
    conversations: [],
    messages: [],
    reviews: [],
    reports: [],
    moderationActions: [],
  };

  // ---------------------------------------------------------------- Comptes

  const channels = (email: boolean) => ({ email, push: false, sms: false });
  const defaultPrefs: NotificationPrefs = {
    quotes: channels(true),
    messages: channels(true),
    bookings: channels(true),
    marketing: channels(false),
  };

  for (const person of seedPeople) {
    data.users.push({
      ...person,
      authProvider: 'email',
      status: 'active',
      notificationPrefs: defaultPrefs,
      createdAt: at(-420),
      updatedAt: at(-420),
    });
  }

  const providerBySlug = new Map<string, ProviderProfile>();

  for (const [index, def] of seedProviderDefinitions.entries()) {
    const userId = `user-${def.slug}`;
    const providerId = `prov-${def.slug}`;
    const status = def.status ?? 'published';
    const createdAt = at(-400 + index * 5);

    data.users.push({
      id: userId,
      firstName: def.owner.firstName,
      lastName: def.owner.lastName,
      email: `${def.slug}@example.com`,
      roles: ['client', 'provider'],
      authProvider: 'email',
      status: 'active',
      notificationPrefs: defaultPrefs,
      createdAt,
      updatedAt: createdAt,
    });

    const photoCount = def.photoCount ?? 6;
    for (let i = 0; i < photoCount; i++) {
      data.media.push({
        id: nextId('media'),
        providerId,
        type: 'image',
        url: `https://picsum.photos/seed/${def.slug}-${i + 1}/1200/800`,
        thumbnailUrl: `https://picsum.photos/seed/${def.slug}-${i + 1}/400/300`,
        order: i,
        createdAt,
        updatedAt: createdAt,
      });
    }

    const offerings = def.offerings.map(
      ({ priceEuros, isActive = true, description = '', ...o }) => ({
        ...o,
        id: nextId('off'),
        providerId,
        description,
        isActive,
        price: priceEuros === undefined ? undefined : priceEuros * 100,
        createdAt,
        updatedAt: createdAt,
      }),
    );
    data.offerings.push(...offerings);

    const profile: ProviderProfile = {
      id: providerId,
      userId,
      displayName: def.displayName,
      slug: def.slug,
      bio: def.bio,
      coverUrl:
        photoCount > 0 ? `https://picsum.photos/seed/${def.slug}-cover/1600/600` : undefined,
      legalType: def.legalType,
      siret: def.siret,
      isProVerified: def.isProVerified,
      categoryIds: def.categoryIds,
      culturalOriginIds: def.culturalOriginIds,
      languages: def.languages,
      city: def.city,
      postalCode: def.postalCode,
      location: def.location,
      travelRadiusKm: def.travelRadiusKm,
      priceFrom: computePriceFrom(offerings),
      maxBookingsPerDay: def.maxBookingsPerDay ?? 1,
      cancellationPolicy: def.cancellationPolicy,
      status,
      rejectionReason: def.rejectionReason,
      onboardingStep: status === 'draft' ? 2 : 8,
      ratingAverage: 0,
      ratingCount: 0,
      responseTimeHours: def.responseTimeHours,
      createdAt,
      updatedAt: createdAt,
    };
    data.providers.push(profile);
    providerBySlug.set(def.slug, profile);

    if (status === 'published' || status === 'paused') {
      data.moderationActions.push({
        id: nextId('mod'),
        adminId: DEMO_ADMIN_ID,
        action: 'validate_profile',
        targetType: 'provider',
        targetId: providerId,
        createdAt: at(-395 + index * 5),
      });
    }
    if (status === 'changes_requested' && def.rejectionReason) {
      data.moderationActions.push({
        id: nextId('mod'),
        adminId: DEMO_ADMIN_ID,
        action: 'request_changes',
        targetType: 'provider',
        targetId: providerId,
        note: def.rejectionReason,
        createdAt: at(-4),
      });
    }
  }

  const provider = (slug: string): ProviderProfile => {
    const found = providerBySlug.get(slug);
    if (!found) throw new Error(`Prestataire inconnu dans le seed : ${slug}`);
    return found;
  };

  // ------------------------------------------------- Outils de transaction

  /** L'état d'une demande en cours de construction, pour enchaîner les étapes. */
  interface Thread {
    request: QuoteRequest;
    conversation: Conversation;
    providerUserId: string;
    booking?: Booking;
  }

  function addMessage(
    thread: Thread,
    from: 'client' | 'provider',
    body: string,
    createdAt: string,
    options: { kind?: Message['kind']; read?: boolean } = {},
  ) {
    const { kind = 'text', read = true } = options;
    // Règle n° 7 : masquage tant qu'il n'y a pas de réservation confirmée.
    const masked =
      kind === 'text' && shouldMaskContactDetails(thread.booking?.status)
        ? maskContactDetails(body)
        : { text: body, hasMaskedContent: false };
    data.messages.push({
      id: nextId('msg'),
      conversationId: thread.conversation.id,
      senderId: from === 'client' ? thread.request.clientId : thread.providerUserId,
      kind,
      body: masked.text,
      hasMaskedContent: masked.hasMaskedContent,
      readAt: read ? createdAt : undefined,
      createdAt,
      updatedAt: createdAt,
    });
  }

  function addRequest(options: {
    clientId: string;
    providerSlug: string;
    eventType: EventType;
    eventDate: string;
    createdAt: string;
    message: string;
    status?: QuoteRequestStatus;
    guestCount?: number;
    budget?: [number, number];
    declineReason?: string;
    clientType?: QuoteRequest['clientType'];
  }): Thread {
    const target = provider(options.providerSlug);
    const request: QuoteRequest = {
      id: nextId('qr'),
      clientId: options.clientId,
      providerId: target.id,
      clientType: options.clientType ?? 'individual',
      eventType: options.eventType,
      eventDate: options.eventDate,
      eventCity: target.city,
      eventPostalCode: target.postalCode,
      guestCount: options.guestCount,
      budgetMin: options.budget?.[0],
      budgetMax: options.budget?.[1],
      message: options.message,
      status: options.status ?? 'pending',
      declineReason: options.declineReason,
      expiresAt: computeQuoteRequestExpiresAt(new Date(options.createdAt)),
      createdAt: options.createdAt,
      updatedAt: options.createdAt,
    };
    const conversation: Conversation = {
      id: nextId('conv'),
      quoteRequestId: request.id,
      clientId: request.clientId,
      providerUserId: target.userId,
      lastMessageAt: options.createdAt,
      unreadCountClient: 0,
      unreadCountProvider: 0,
      createdAt: options.createdAt,
      updatedAt: options.createdAt,
    };
    data.quoteRequests.push(request);
    data.conversations.push(conversation);
    const thread: Thread = { request, conversation, providerUserId: target.userId };
    addMessage(thread, 'client', options.message, options.createdAt);
    return thread;
  }

  function addQuote(
    thread: Thread,
    options: {
      lines: { label: string; quantity: number; unitPrice: number }[];
      createdAt: string;
      status: QuoteStatus;
      depositRate?: number;
      conditions?: string;
    },
  ): Quote {
    const id = nextId('quote');
    const existing = data.quotes.filter((q) => q.quoteRequestId === thread.request.id);
    const quote: Quote = {
      id,
      quoteRequestId: thread.request.id,
      version: nextQuoteVersion(existing),
      lines: options.lines.map((line) => ({ ...line, id: nextId('line'), quoteId: id })),
      totalAmount: computeQuoteTotal(options.lines),
      depositRate: options.depositRate ?? 30,
      validUntil: addDays(options.createdAt.slice(0, 10), 14),
      conditions: options.conditions,
      status: options.status,
      createdAt: options.createdAt,
      updatedAt: options.createdAt,
    };
    data.quotes.push(quote);
    addMessage(
      thread,
      'provider',
      `Devis n° ${quote.version} envoyé : ${formatPrice(quote.totalAmount)}`,
      options.createdAt,
      { kind: 'system' },
    );
    return quote;
  }

  function addBooking(
    thread: Thread,
    quote: Quote,
    options: {
      createdAt: string;
      status: BookingStatus;
      eventAddress: string;
      cancelledBy?: Booking['cancelledBy'];
      cancelReason?: string;
      cancelledAt?: string;
    },
  ): Booking {
    const target = data.providers.find((p) => p.id === thread.request.providerId)!;
    const booking: Booking = {
      id: nextId('book'),
      quoteId: quote.id,
      quoteRequestId: thread.request.id,
      clientId: thread.request.clientId,
      providerId: target.id,
      eventDate: thread.request.eventDate,
      eventAddress: options.eventAddress,
      totalAmount: quote.totalAmount,
      depositAmount: computeDepositAmount(quote.totalAmount, quote.depositRate),
      paymentMode: 'offline',
      commissionRate: 0,
      cancellationPolicy: target.cancellationPolicy,
      status: options.status,
      cancelledBy: options.cancelledBy,
      cancelReason: options.cancelReason,
      cancelledAt: options.cancelledAt,
      createdAt: options.createdAt,
      updatedAt: options.cancelledAt ?? options.createdAt,
    };
    data.bookings.push(booking);
    if (booking.status !== 'cancelled') {
      data.unavailabilities.push({
        id: nextId('unav'),
        providerId: target.id,
        date: booking.eventDate,
        reason: 'booking',
        bookingId: booking.id,
        createdAt: options.createdAt,
        updatedAt: options.createdAt,
      });
    }
    // Le message système est posté une fois la réservation confirmée : plus de masquage.
    thread.booking = { ...booking, status: 'confirmed' };
    addMessage(
      thread,
      'client',
      `Réservation confirmée pour le ${booking.eventDate}`,
      options.createdAt,
      { kind: 'system' },
    );
    thread.booking = booking;
    return booking;
  }

  function addReview(booking: Booking, rating: number, comment: string, createdAt: string): Review {
    const review: Review = {
      id: nextId('rev'),
      bookingId: booking.id,
      authorId: booking.clientId,
      providerId: booking.providerId,
      rating,
      subRatings: {
        quality: rating,
        punctuality: Math.max(1, rating - (rating % 2 === 0 ? 1 : 0)),
        value: rating,
      },
      comment,
      status: 'published',
      createdAt,
      updatedAt: createdAt,
    };
    data.reviews.push(review);
    return review;
  }

  /** Une demande déjà menée jusqu'au bout : demande → devis → réservation terminée. */
  function addCompletedStory(options: {
    clientId: string;
    providerSlug: string;
    eventOffset: number;
    eventType: EventType;
    amount: number;
  }): { thread: Thread; booking: Booking } {
    const { eventOffset } = options;
    const thread = addRequest({
      clientId: options.clientId,
      providerSlug: options.providerSlug,
      eventType: options.eventType,
      eventDate: day(eventOffset),
      createdAt: at(eventOffset - 45, 9),
      message: 'Bonjour, êtes-vous disponible à cette date ? Merci de me faire une proposition.',
      status: 'accepted',
      guestCount: 80,
    });
    addMessage(
      thread,
      'provider',
      'Bonjour, oui je suis disponible. Je vous prépare un devis.',
      at(eventOffset - 45, 12),
    );
    const quote = addQuote(thread, {
      lines: [{ label: 'Prestation complète', quantity: 1, unitPrice: options.amount }],
      createdAt: at(eventOffset - 44, 10),
      status: 'accepted',
    });
    const booking = addBooking(thread, quote, {
      createdAt: at(eventOffset - 42, 18),
      status: 'completed',
      eventAddress: `Salle des fêtes, ${thread.request.eventCity}`,
    });
    addMessage(thread, 'client', 'Merci encore, c’était parfait !', at(eventOffset + 1, 11));
    return { thread, booking };
  }

  // ------------------------------------------ Historique : avis passés

  const reviewComments: Record<number, string[]> = {
    5: [
      'Prestation exceptionnelle, nos invités en parlent encore !',
      'Très professionnel, ponctuel et chaleureux. Je recommande à 100 %.',
      'Tout était parfait, merci pour cette belle journée.',
      'Une ambiance incroyable, exactement ce qu’on voulait.',
    ],
    4: [
      'Très bien dans l’ensemble, petit retard au démarrage.',
      'Bonne prestation, rapport qualité-prix correct.',
      'Nous sommes contents, quelques détails à améliorer.',
    ],
    3: ['Correct, mais la communication avant l’événement était compliquée.'],
  };
  const historicalClients = seedPeople
    .filter((p) => p.id !== DEMO_ADMIN_ID && p.id !== DEMO_CLIENT_ID)
    .map((p) => p.id);
  const eventTypes: EventType[] = ['wedding', 'birthday', 'baptism', 'corporate', 'other'];

  let story = 0;
  for (const def of seedProviderDefinitions) {
    for (const [i, rating] of def.pastRatings.entries()) {
      story++;
      const eventOffset = -(15 + i * 31 + (story % 7));
      const { booking } = addCompletedStory({
        clientId: historicalClients[story % historicalClients.length]!,
        providerSlug: def.slug,
        eventOffset,
        eventType: eventTypes[story % eventTypes.length]!,
        amount: (provider(def.slug).priceFrom ?? 80000) + (story % 5) * 5000,
      });
      const comments = reviewComments[rating] ?? reviewComments[4]!;
      addReview(booking, rating, comments[story % comments.length]!, at(eventOffset + 3, 20));
    }
  }

  // --------------------------------- Scénarios de démo (étape 1, parcours)

  // 1. Aïssatou → Saveurs de Dakar : demande en attente de réponse.
  addRequest({
    clientId: DEMO_CLIENT_ID,
    providerSlug: 'saveurs-de-dakar',
    eventType: 'wedding',
    eventDate: day(75),
    createdAt: at(-1, 9),
    guestCount: 150,
    budget: [300000, 450000],
    message:
      'Bonjour, nous nous marions et cherchons un traiteur sénégalais pour 150 personnes : thiéboudienne et yassa, avec un buffet de desserts.',
  });

  // 2. Aïssatou → Compagnie Akwaba : négociation, devis v1 remplacé par v2.
  {
    const thread = addRequest({
      clientId: DEMO_CLIENT_ID,
      providerSlug: 'compagnie-akwaba',
      eventType: 'wedding',
      eventDate: day(75),
      createdAt: at(-6, 8),
      guestCount: 150,
      budget: [40000, 60000],
      message:
        'Bonjour ! Nous aimerions un show de coupé-décalé pour l’entrée des mariés, puis 30 minutes pour faire danser les invités.',
      status: 'quoted',
    });
    addQuote(thread, {
      lines: [{ label: 'Show + initiation des invités', quantity: 1, unitPrice: 65000 }],
      createdAt: at(-5, 15),
      status: 'superseded',
      conditions: 'Défraiement inclus en Île-de-France.',
    });
    addMessage(
      thread,
      'client',
      'Merci ! C’est un peu au-dessus de notre budget. Vous pouvez m’appeler au 06 12 34 56 78 pour en parler ?',
      at(-4, 19),
    );
    addMessage(
      thread,
      'provider',
      'Je vous propose une version un peu plus courte, avec seulement 4 danseurs.',
      at(-3, 10),
    );
    addQuote(thread, {
      lines: [
        { label: 'Entrée des mariés (4 danseurs)', quantity: 1, unitPrice: 30000 },
        { label: 'Animation danse avec les invités (30 min)', quantity: 1, unitPrice: 25000 },
      ],
      createdAt: at(-3, 10),
      status: 'sent',
      conditions: 'Défraiement inclus en Île-de-France.',
    });
  }

  // 3. Aïssatou → DJ Makossa Vibes : réservation confirmée à venir.
  {
    const thread = addRequest({
      clientId: DEMO_CLIENT_ID,
      providerSlug: 'dj-makossa-vibes',
      eventType: 'baptism',
      eventDate: day(20),
      createdAt: at(-15, 20),
      guestCount: 60,
      message:
        'Bonjour, je cherche un DJ pour le baptême de mon neveu, de 15 h à 21 h. Plutôt makossa et afrobeats.',
      status: 'accepted',
    });
    addMessage(thread, 'provider', 'Avec plaisir ! Je vous envoie un devis.', at(-14, 9));
    const quote = addQuote(thread, {
      lines: [
        { label: 'Soirée DJ (6 h)', quantity: 1, unitPrice: 42000 },
        { label: 'Jeux de lumière', quantity: 1, unitPrice: 5000 },
      ],
      createdAt: at(-14, 9),
      status: 'accepted',
      conditions: 'Accès à une prise électrique à moins de 10 m.',
    });
    addBooking(thread, quote, {
      createdAt: at(-12, 18),
      status: 'confirmed',
      eventAddress: '12 rue des Lilas, 94000 Créteil',
    });
    addMessage(
      thread,
      'provider',
      'Merci ! Mon numéro pour le jour J : 07 98 76 54 32.',
      at(-12, 19),
      { read: false },
    );
  }

  // 4. Aïssatou → Douceurs Créoles : réservation terminée, avis pas encore laissé.
  addCompletedStory({
    clientId: DEMO_CLIENT_ID,
    providerSlug: 'douceurs-creoles',
    eventOffset: -10,
    eventType: 'birthday',
    amount: 15000,
  });

  // 5. Aïssatou → Kinshasa Groove : demande déclinée.
  {
    const thread = addRequest({
      clientId: DEMO_CLIENT_ID,
      providerSlug: 'kinshasa-groove',
      eventType: 'wedding',
      eventDate: day(75),
      createdAt: at(-8, 11),
      guestCount: 150,
      message:
        'Bonjour, seriez-vous disponibles pour animer notre soirée de mariage avec de la rumba ?',
      status: 'declined',
      declineReason: 'Nous jouons déjà à un autre mariage ce jour-là, désolés !',
    });
    addMessage(
      thread,
      'provider',
      'Nous jouons déjà à un autre mariage ce jour-là, désolés !',
      at(-7, 9),
      { read: false },
    );
  }

  // 6. Aïssatou → Fatou Gâteaux : demande expirée sans réponse.
  addRequest({
    clientId: DEMO_CLIENT_ID,
    providerSlug: 'fatou-gateaux',
    eventType: 'wedding',
    eventDate: day(75),
    createdAt: at(-20, 10),
    message: 'Bonjour, quel serait le prix d’un wedding cake pour 150 personnes, parfum bissap ?',
    status: 'expired',
  });

  // 7. Aïssatou → Glow by Aminata : demande annulée par la cliente.
  addRequest({
    clientId: DEMO_CLIENT_ID,
    providerSlug: 'glow-by-aminata',
    eventType: 'wedding',
    eventDate: day(75),
    createdAt: at(-9, 10),
    message: 'Bonjour, je cherche une maquilleuse pour mon mariage, avec un essai avant.',
    status: 'cancelled',
  });

  // 8. Ibrahim → Saveurs de Dakar : devis envoyé, en attente du client.
  {
    const thread = addRequest({
      clientId: 'user-ibrahim',
      providerSlug: 'saveurs-de-dakar',
      eventType: 'corporate',
      clientType: 'business',
      eventDate: day(25),
      createdAt: at(-4, 9),
      guestCount: 60,
      budget: [80000, 120000],
      message:
        'Bonjour, nous organisons un séminaire et voudrions un cocktail sénégalais pour 60 personnes.',
      status: 'quoted',
    });
    addQuote(thread, {
      lines: [
        { label: 'Plateau cocktail', quantity: 60, unitPrice: 1500 },
        { label: 'Service (2 serveurs)', quantity: 2, unitPrice: 12000 },
      ],
      createdAt: at(-3, 16),
      status: 'sent',
    });
  }

  // 9. Grace → Saveurs de Dakar : réservation confirmée dans 10 jours.
  {
    const thread = addRequest({
      clientId: 'user-grace',
      providerSlug: 'saveurs-de-dakar',
      eventType: 'baptism',
      eventDate: day(10),
      createdAt: at(-30, 9),
      guestCount: 80,
      message:
        'Bonjour, pour le baptême de ma fille nous serons 80. Pouvez-vous faire du thiakry en dessert ?',
      status: 'accepted',
    });
    addMessage(thread, 'provider', 'Bien sûr, le thiakry est notre spécialité !', at(-29, 10));
    const quote = addQuote(thread, {
      lines: [
        { label: 'Repas de baptême', quantity: 80, unitPrice: 1400 },
        { label: 'Thiakry (dessert)', quantity: 80, unitPrice: 300 },
      ],
      createdAt: at(-29, 10),
      status: 'accepted',
    });
    addBooking(thread, quote, {
      createdAt: at(-27, 21),
      status: 'confirmed',
      eventAddress: '5 allée des Acacias, 93200 Saint-Denis',
    });
    addMessage(
      thread,
      'client',
      'Bonjour, pouvez-vous arriver à 11 h ? Mon numéro : 06 55 44 33 22.',
      at(-1, 18),
      { read: false },
    );
  }

  // 10. Sophie → Saveurs de Dakar : réservation annulée par la cliente.
  {
    const thread = addRequest({
      clientId: 'user-sophie',
      providerSlug: 'saveurs-de-dakar',
      eventType: 'birthday',
      eventDate: day(40),
      createdAt: at(-25, 9),
      guestCount: 40,
      message: 'Bonjour, je voudrais un buffet pour les 40 ans de mon mari, environ 40 personnes.',
      status: 'accepted',
    });
    const quote = addQuote(thread, {
      lines: [{ label: 'Buffet anniversaire', quantity: 40, unitPrice: 2500 }],
      createdAt: at(-24, 11),
      status: 'accepted',
    });
    addBooking(thread, quote, {
      createdAt: at(-22, 20),
      status: 'cancelled',
      eventAddress: '18 rue Oberkampf, 75011 Paris',
      cancelledBy: 'client',
      cancelReason: 'La fête est reportée à l’année prochaine.',
      cancelledAt: at(-5, 9),
    });
  }

  // 11. Mamadou (compte à deux rôles) réserve en tant que CLIENT chez Rire au Pays.
  addRequest({
    clientId: DEMO_PROVIDER_ID,
    providerSlug: 'rire-au-pays',
    eventType: 'corporate',
    eventDate: day(50),
    createdAt: at(-2, 14),
    guestCount: 100,
    message:
      'Bonjour, je fête les 10 ans de mon restaurant et cherche un maître de cérémonie drôle et chaleureux.',
  });

  // 12. Kévin → Saveurs de Dakar : une deuxième demande en attente.
  addRequest({
    clientId: 'user-kevin',
    providerSlug: 'saveurs-de-dakar',
    eventType: 'birthday',
    eventDate: day(32),
    createdAt: at(-2, 21),
    guestCount: 35,
    message:
      'Salut ! Je cherche un plateau cocktail pour une trentaine de personnes, pastels et accras.',
  });

  // Dates bloquées à la main.
  for (const [slug, offsets] of [
    ['saveurs-de-dakar', [15, 16]],
    ['dj-makossa-vibes', [45]],
    ['compagnie-akwaba', [30, 31]],
  ] as const) {
    for (const offset of offsets) {
      data.unavailabilities.push({
        id: nextId('unav'),
        providerId: provider(slug).id,
        date: day(offset),
        reason: 'manual',
        createdAt: at(-10),
        updatedAt: at(-10),
      });
    }
  }

  // -------------------------------------------------------- Modération

  const boubouReview = data.reviews.find(
    (r) => r.providerId === provider('boubou-prestige').id && r.rating === 3,
  );
  if (boubouReview) {
    data.reports.push({
      id: nextId('rep'),
      reporterId: provider('boubou-prestige').userId,
      targetType: 'review',
      targetId: boubouReview.id,
      reason: 'fake_review',
      details: 'Je ne reconnais pas cette cliente, je pense que c’est un faux avis.',
      status: 'open',
      createdAt: at(-2, 15),
      updatedAt: at(-2, 15),
    });
  }
  data.reports.push(
    {
      id: nextId('rep'),
      reporterId: 'user-claire',
      targetType: 'provider',
      targetId: provider('le-mafe-truck').id,
      reason: 'other',
      details: 'Le prestataire ne répond plus depuis que j’ai demandé une facture.',
      status: 'open',
      createdAt: at(-1, 10),
      updatedAt: at(-1, 10),
    },
    {
      id: nextId('rep'),
      reporterId: 'user-moussa',
      targetType: 'provider',
      targetId: provider('afro-beats-by-kofi').id,
      reason: 'spam',
      status: 'dismissed',
      createdAt: at(-30, 10),
      updatedAt: at(-29, 10),
    },
  );
  data.moderationActions.push({
    id: nextId('mod'),
    adminId: DEMO_ADMIN_ID,
    action: 'dismiss_report',
    targetType: 'report',
    targetId: data.reports[data.reports.length - 1]!.id,
    note: 'Aucun élément de spam constaté.',
    createdAt: at(-29, 10),
  });

  // ------------------------------------------------ Champs dérivés

  // Règle n° 8 : note moyenne recalculée depuis les avis.
  for (const profile of data.providers) {
    Object.assign(
      profile,
      computeProviderRating(data.reviews.filter((r) => r.providerId === profile.id)),
    );
  }

  // Dernier message et compteurs de non-lus de chaque conversation.
  for (const conversation of data.conversations) {
    const messages = data.messages.filter((m) => m.conversationId === conversation.id);
    const unreadFrom = (senderId: string) =>
      messages.filter((m) => m.kind !== 'system' && !m.readAt && m.senderId === senderId).length;
    conversation.lastMessageAt = messages.reduce(
      (latest, m) => (m.createdAt > latest ? m.createdAt : latest),
      conversation.lastMessageAt,
    );
    conversation.unreadCountClient = unreadFrom(conversation.providerUserId);
    conversation.unreadCountProvider = unreadFrom(conversation.clientId);
    conversation.updatedAt = conversation.lastMessageAt;
  }

  return data;
}
