/*
 * Maquette « Événements » — Wenzee
 * Application à page unique, sans back-end : l'état vit dans le localStorage.
 *
 * Adresses (dans le « # ») :
 *   #/evenements                         01 Mes événements (ou état vide)
 *   #/evenements/nouveau?etape=1|2|3     02 Créer un événement
 *   #/evenements/:id                     03 Détail (?modale=retirer&prestataire=… : 05, ?modale=supprimer : 08)
 *   #/evenements/:id/ajouter             04 Ajouter un prestataire (?categorie=…)
 *   #/evenements/:id/devis               06 Demander les devis
 *   #/evenements/:id/modifier?etape=…    07 Modifier un événement
 *   #/prestataires/:id                   Fiche prestataire (?modale=ajouter : « Ajouter à un événement »)
 * Paramètres de la page (avant le #) : ?theme=light|dark, ?reset=1 (données de démo), ?vide=1 (aucun événement).
 *
 * Règle métier : pas de réservation ni de paiement. On ajoute des prestataires, on leur demande un devis,
 * on compare et on « retient » (retenir ≠ réserver).
 */
(() => {
  'use strict';

  const STORE_KEY = 'wenzee-maquette-evenements-v1';
  const THEME_KEY = 'wenzee-maquette-theme';
  const DRAFT_KEY = 'wenzee-maquette-brouillon';
  /** « Aujourd'hui » figé pour la démo : les captures restent identiques d'un jour à l'autre. */
  const TODAY = '2026-11-27';
  const IMG = 'assets/img/';

  // ------------------------------------------------------------------ Données fictives

  const EVENT_TYPES = [
    { id: 'mariage', label: 'Mariage', icon: 'gem', photo: 'mariage.webp' },
    { id: 'soiree', label: 'Soirée', icon: 'martini', photo: 'soiree.webp' },
    { id: 'bapteme', label: 'Baptême', icon: 'droplet', photo: 'decoration.webp' },
    { id: 'anniversaire', label: 'Anniversaire', icon: 'cake', photo: 'celebration.webp' },
    { id: 'conference', label: 'Conférence', icon: 'briefcase', photo: 'speaker.webp' },
    { id: 'autre', label: 'Autre', icon: 'ellipsis', photo: 'show.webp' },
  ];

  const CATEGORIES = [
    { id: 'traiteur', label: 'Traiteur', icon: 'utensils-crossed' },
    { id: 'patisserie', label: 'Pâtisserie', icon: 'cake' },
    { id: 'dj', label: 'DJ / Animation', icon: 'music' },
    { id: 'musique', label: 'Musique live', icon: 'mic' },
    { id: 'danse', label: 'Danse', icon: 'sparkles' },
    { id: 'decoration', label: 'Décoration', icon: 'flower-2' },
    { id: 'photo', label: 'Photographie', icon: 'camera' },
    { id: 'beaute', label: 'Beauté / Coiffure', icon: 'scissors' },
    { id: 'speakers', label: 'Speakers', icon: 'presentation' },
    { id: 'organisation', label: 'Organisation', icon: 'calendar-check' },
  ];

  /** Les catégories conseillées par type d'événement (« Complétez votre événement »). */
  const RECOMMENDED = {
    mariage: ['traiteur', 'dj', 'decoration', 'photo', 'beaute', 'patisserie', 'danse'],
    soiree: ['dj', 'traiteur', 'decoration', 'danse', 'photo'],
    bapteme: ['traiteur', 'patisserie', 'decoration', 'photo'],
    anniversaire: ['traiteur', 'dj', 'decoration', 'patisserie', 'photo'],
    conference: ['speakers', 'traiteur', 'photo', 'organisation'],
    autre: ['traiteur', 'dj', 'decoration', 'photo'],
  };

  const PROVIDERS = [
    {
      id: 'saveurs-de-dakar',
      name: 'Saveurs de Dakar',
      category: 'traiteur',
      city: 'Paris',
      rating: 4.8,
      reviews: 124,
      verified: true,
      photo: 'traiteur.webp',
      bio: 'Cuisine sénégalaise de fête : thiéboudienne, yassa, pastels et buffets pour 30 à 400 invités.',
    },
    {
      id: 'dj-kizomba',
      name: 'DJ Kizomba',
      category: 'dj',
      city: 'Paris',
      rating: 4.7,
      reviews: 96,
      verified: true,
      photo: 'soiree.webp',
      bio: 'Kizomba, afrobeats, zouk et coupé-décalé : le DJ des mariages et soirées afro en Île-de-France.',
    },
    {
      id: 'decor-afrik',
      name: 'Décor Afrik',
      category: 'decoration',
      city: 'Paris',
      rating: 4.9,
      reviews: 67,
      verified: true,
      photo: 'decoration.webp',
      bio: 'Décoration afro-chic : wax, fleurs, arches et tables d’honneur sur mesure.',
    },
    {
      id: 'douceurs-creoles',
      name: 'Douceurs Créoles',
      category: 'patisserie',
      city: 'Saint-Denis',
      rating: 4.8,
      reviews: 58,
      verified: true,
      photo: 'celebration.webp',
      bio: 'Pièces montées, gâteaux patate douce et mignardises antillaises.',
    },
    {
      id: 'belle-afro',
      name: 'Belle Afro',
      category: 'beaute',
      city: 'Saint-Denis',
      rating: 4.8,
      reviews: 52,
      verified: true,
      photo: 'beaute.webp',
      bio: 'Coiffure, tresses, maquillage et attache de gélé pour la mariée et ses proches.',
    },
    {
      id: 'studio-sankofa',
      name: 'Studio Sankofa',
      category: 'photo',
      city: 'Montreuil',
      rating: 4.9,
      reviews: 41,
      verified: true,
      photo: 'mariage.webp',
      bio: 'Photo et vidéo de mariages et cérémonies traditionnelles.',
    },
    {
      id: 'ndombolo-crew',
      name: 'Ndombolo Dance Crew',
      category: 'danse',
      city: 'Créteil',
      rating: 4.6,
      reviews: 33,
      verified: false,
      photo: 'show.webp',
      bio: 'Danseurs et chorégraphies pour entrées de mariés et animations.',
    },
    {
      id: 'kompa-vibes',
      name: 'Kompa Vibes Haïti',
      category: 'musique',
      city: 'Sarcelles',
      rating: 4.7,
      reviews: 21,
      verified: true,
      photo: 'show.webp',
      bio: 'Groupe de kompa haïtien : cinq musiciens pour vos soirées.',
    },
    {
      id: 'awa-diallo',
      name: 'Awa Diallo',
      category: 'speakers',
      city: 'Paris',
      rating: 5,
      reviews: 12,
      verified: true,
      photo: 'speaker.webp',
      bio: 'Conférencière : entrepreneuriat, leadership et diaspora.',
    },
    {
      id: 'jour-j-mariama',
      name: 'Jour J by Mariama',
      category: 'organisation',
      city: 'Paris',
      rating: 4.9,
      reviews: 38,
      verified: true,
      photo: 'celebration.webp',
      bio: 'Wedding planner : organisation complète ou coordination du jour J.',
    },
    {
      id: 'teranga-traiteur',
      name: 'Teranga Traiteur',
      category: 'traiteur',
      city: 'Montreuil',
      rating: 4.6,
      reviews: 80,
      verified: false,
      photo: 'traiteur.webp',
      bio: 'Buffets ouest-africains et cocktails dînatoires.',
    },
  ];

  const CITIES = [
    'Paris',
    'Saint-Denis',
    'Montreuil',
    'Créteil',
    'Sarcelles',
    'Versailles',
    'Nanterre',
    'Argenteuil',
  ];

  const BUDGETS = [
    { id: 'lt1000', label: 'Moins de 1 000 €' },
    { id: '1000-3000', label: '1 000 – 3 000 €' },
    { id: '3000-5000', label: '3 000 – 5 000 €' },
    { id: '5000-10000', label: '5 000 – 10 000 €' },
    { id: '10000-20000', label: '10 000 – 20 000 €' },
    { id: 'gt20000', label: 'Plus de 20 000 €' },
    { id: 'tbd', label: 'À définir' },
  ];

  /** Statut d'un prestataire dans un événement : couleur + icône + texte (jamais la couleur seule). */
  const LINK_STATUS = {
    added: { label: 'Ajouté', icon: 'plus', cls: 'badge--added' },
    requested: { label: 'Devis demandé', icon: 'send', cls: 'badge--requested' },
    received: { label: 'Devis reçu', icon: 'file-text', cls: 'badge--received' },
    retained: { label: 'Retenu', icon: 'check', cls: 'badge--retained' },
  };

  function demoData() {
    return {
      events: [
        {
          id: 'mariage-aissatou',
          type: 'mariage',
          name: 'Mariage de Aïssatou',
          date: '2027-02-10',
          city: 'Paris',
          guests: 150,
          budget: 'gt20000',
          description:
            'Mariage traditionnel et moderne. Nous souhaitons une ambiance afro-chic avec des prestataires expérimentés.',
          createdAt: '2026-11-02T10:00:00Z',
          providers: [
            { providerId: 'saveurs-de-dakar', status: 'received' },
            { providerId: 'dj-kizomba', status: 'requested' },
            { providerId: 'decor-afrik', status: 'added' },
            { providerId: 'douceurs-creoles', status: 'received' },
          ],
        },
        {
          id: 'anniversaire-30-ans',
          type: 'anniversaire',
          name: 'Anniversaire 30 ans',
          date: '2027-05-24',
          city: 'Saint-Denis',
          guests: 80,
          budget: '3000-5000',
          description: '',
          createdAt: '2026-11-15T10:00:00Z',
          providers: [
            { providerId: 'dj-kizomba', status: 'requested' },
            { providerId: 'douceurs-creoles', status: 'received' },
            { providerId: 'decor-afrik', status: 'requested' },
          ],
        },
      ],
      deleted: null,
    };
  }

  // ------------------------------------------------------------------ État

  const params = new URLSearchParams(location.search);
  let state = load();
  if (params.has('reset') || params.has('vide')) {
    state = demoData();
    if (params.has('vide')) state.events = [];
    sessionStorage.removeItem(DRAFT_KEY);
    save();
    // On retire le paramètre de l'adresse : un rechargement ne réinitialise pas à nouveau.
    params.delete('reset');
    params.delete('vide');
    const rest = params.toString();
    history.replaceState(null, '', `${location.pathname}${rest ? `?${rest}` : ''}${location.hash}`);
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      /* données illisibles : on repart de la démo */
    }
    return demoData();
  }
  function save() {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  }

  const provider = (id) => PROVIDERS.find((p) => p.id === id);
  const category = (id) => CATEGORIES.find((c) => c.id === id);
  const eventType = (id) => EVENT_TYPES.find((t) => t.id === id) ?? EVENT_TYPES[5];
  const findEvent = (id) => state.events.find((e) => e.id === id);

  function counts(event) {
    const s = event.providers.map((p) => p.status);
    return {
      providers: s.length,
      requested: s.filter((x) => x !== 'added').length,
      received: s.filter((x) => x === 'received' || x === 'retained').length,
      retained: s.filter((x) => x === 'retained').length,
    };
  }

  /** Le statut d'un événement, calculé (jamais saisi). */
  function eventStatus(event) {
    if (event.date < TODAY) return { label: 'Passé', cls: 'badge--past' };
    const s = event.providers.map((p) => p.status);
    if (s.includes('requested') && !s.includes('added'))
      return { label: 'Devis en cours', cls: 'badge--quotes' };
    return { label: 'En préparation', cls: 'badge--preparation' };
  }

  // ------------------------------------------------------------------ Outils d'affichage

  const esc = (value) =>
    String(value ?? '').replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );
  const icon = (name, cls = '') =>
    `<svg class="icon ${cls}" viewBox="0 0 24 24" aria-hidden="true">${window.ICONS[name] ?? ''}</svg>`;
  const plural = (n, one, many = `${one}s`) => `${n} ${n > 1 ? many : one}`;
  const dateFmt = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
  const formatDate = (iso) => {
    const text = dateFmt.format(new Date(`${iso}T00:00:00Z`));
    return text.charAt(0).toUpperCase() + text.slice(1);
  };
  const budgetLabel = (id) => BUDGETS.find((b) => b.id === id)?.label;
  const badge = (status) =>
    `<span class="badge ${status.cls}">${status.icon ? icon(status.icon) : ''}${esc(status.label)}</span>`;
  const verified = (p) =>
    p.verified
      ? `<span class="verified" title="Prestataire vérifié">${icon('badge-check')}<span class="sr-only">Vérifié</span></span>`
      : '';
  const rating = (p) =>
    `<span class="rating">${icon('star')}${p.rating.toLocaleString('fr-FR', { minimumFractionDigits: 1 })}</span>`;
  const slugify = (text) =>
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40) || 'evenement';

  // ------------------------------------------------------------------ Routeur

  function parseRoute() {
    const [path, query = ''] = location.hash.replace(/^#/, '').split('?');
    const parts = path.split('/').filter(Boolean);
    return { parts, query: new URLSearchParams(query) };
  }
  function go(hash) {
    if (location.hash === hash) render();
    else location.hash = hash;
  }

  const app = document.getElementById('app');
  let pendingToast = null;

  function render() {
    closeDrawer();
    const { parts, query } = parseRoute();
    let view;
    let sticky = false;
    if (parts[0] === 'prestataires' && parts[1]) {
      view = profileView(parts[1], query);
    } else if (parts[0] !== 'evenements') {
      location.replace('#/evenements');
      return;
    } else if (!parts[1]) {
      view = listView();
    } else if (parts[1] === 'nouveau') {
      view = formView(null, query);
      sticky = true;
    } else {
      const event = findEvent(parts[1]);
      if (!event) {
        view = notFoundView();
      } else if (parts[2] === 'modifier') {
        view = formView(event, query);
        sticky = true;
      } else if (parts[2] === 'ajouter') {
        view = addView(event, query);
      } else if (parts[2] === 'devis') {
        view = quotesView(event);
        sticky = true;
      } else {
        view = detailView(event, query);
        sticky = true;
      }
    }
    document.body.classList.toggle('has-sticky', sticky);
    app.innerHTML = view.html;
    document.title = `${view.title} · Wenzee (maquette)`;
    view.after?.();
    renderModal(query, parts);
    if (pendingToast) {
      toast(pendingToast);
      pendingToast = null;
    }
  }

  // ------------------------------------------------------------------ 01 Mes événements

  function eventMeta(event, withCounts) {
    const c = counts(event);
    return `
      <ul class="meta">
        <li>${icon('calendar')}${formatDate(event.date)}</li>
        <li>${icon('map-pin')}${esc(event.city)}</li>
        <li>${icon('users')}${plural(event.guests, 'invité')}</li>
      </ul>
      ${
        withCounts
          ? `<ul class="meta meta--muted">
              <li>${icon('user-round')}${plural(c.providers, 'prestataire')}</li>
              <li>${icon('file-text')}${c.received} devis ${c.received > 1 ? 'reçus' : 'reçu'}</li>
            </ul>`
          : ''
      }`;
  }

  function listView() {
    // Sur téléphone, le bouton de l'en-tête devient « + Créer » (comme la planche).
    const createBtn = (short = true) =>
      `<a class="btn btn--cta btn--sm-mobile" href="#/evenements/nouveau?etape=1">${icon('plus')}${
        short
          ? '<span class="label-long">Créer mon événement</span><span class="label-short">Créer</span>'
          : 'Créer mon événement'
      }</a>`;
    if (state.events.length === 0) {
      return {
        title: 'Mes événements',
        html: `
        <section class="page container" aria-labelledby="page-title">
          <div class="page-head"><div><h1 id="page-title">Mes événements</h1>
          <p>Planifiez vos événements et gérez vos prestataires.</p></div></div>
          <div class="card empty">
            <div class="empty__art" aria-hidden="true">
              ${icon('calendar-check', 'art-calendar')}
              ${icon('sparkles', 'art-spark')}
            </div>
            <h2>Aucun événement pour le moment</h2>
            <p>Créez votre premier événement et commencez à ajouter des prestataires.</p>
            ${createBtn(false)}
          </div>
        </section>`,
        after() {
          const spark = app.querySelector('.art-spark');
          spark.style.cssText = 'top:6px;right:10px';
        },
      };
    }
    const events = [...state.events].sort((a, b) => a.date.localeCompare(b.date));
    return {
      title: 'Mes événements',
      html: `
      <section class="page container" aria-labelledby="page-title">
        <div class="page-head">
          <div><h1 id="page-title">Mes événements</h1>
          <p>Planifiez vos événements et gérez vos prestataires.</p></div>
          ${createBtn()}
        </div>
        <ul class="event-list" aria-label="Mes événements">
          ${events
            .map(
              (event) => `
            <li>
              <a class="card event-card" href="#/evenements/${event.id}">
                <img class="event-card__photo" src="${IMG}${eventType(event.type).photo}" alt="" />
                <div class="event-card__body">
                  <div class="event-card__title"><h2>${esc(event.name)}</h2>${badge(eventStatus(event))}</div>
                  ${eventMeta(event, true)}
                </div>
                <span class="chevron-circle" aria-hidden="true">${icon('chevron-right')}</span>
              </a>
            </li>`,
            )
            .join('')}
        </ul>
      </section>`,
    };
  }

  // ------------------------------------------------------------------ 02 / 07 Formulaire partagé

  /** Le brouillon du formulaire (création ou modification), gardé entre les étapes. */
  function getDraft(event) {
    const key = event ? `edit:${event.id}` : 'new';
    let draft;
    try {
      draft = JSON.parse(sessionStorage.getItem(DRAFT_KEY) ?? 'null');
    } catch {
      draft = null;
    }
    if (!draft || draft.key !== key) {
      draft = event
        ? {
            key,
            type: event.type,
            name: event.name,
            date: event.date,
            city: event.city,
            guests: String(event.guests),
            budget: event.budget ?? '',
            description: event.description ?? '',
          }
        : { key, type: '', name: '', date: '', city: '', guests: '', budget: '', description: '' };
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    }
    return draft;
  }
  function saveDraft(draft) {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }

  function validateStep(step, d) {
    const errors = {};
    if (step === 1 && !d.type) errors.type = 'Choisissez un type d’événement.';
    if (step === 2) {
      if (d.name.trim().length < 3)
        errors.name = 'Donnez un nom à votre événement (3 caractères minimum).';
      if (!d.date) errors.date = 'Choisissez la date de l’événement.';
      else if (d.date < TODAY) errors.date = 'Choisissez une date à venir.';
      if (!d.city.trim()) errors.city = 'Indiquez la ville de l’événement.';
      const g = Number(d.guests);
      if (!d.guests || !Number.isInteger(g) || g < 1 || g > 5000)
        errors.guests = 'Indiquez un nombre d’invités entre 1 et 5 000.';
    }
    return errors;
  }

  function formView(event, query) {
    const editing = !!event;
    const draft = getDraft(event);
    const step = Math.min(3, Math.max(1, Number(query.get('etape')) || 1));
    const base = editing ? `#/evenements/${event.id}/modifier` : '#/evenements/nouveau';
    // On ne saute pas une étape incomplète (lien direct vers l'étape 3, par exemple).
    for (let s = 1; s < step; s++) {
      if (Object.keys(validateStep(s, draft)).length) {
        location.replace(`${base}?etape=${s}${carry(query)}`);
        return { title: '', html: '' };
      }
    }
    const title = editing ? 'Modifier mon événement' : 'Créer un événement';
    const steps = ['Type', 'Informations', 'Détails'];
    const err = (name) =>
      `<p class="error" id="err-${name}" hidden>${icon('circle-alert')}<span></span></p>`;
    const backLink = editing
      ? `<a class="link back" href="#/evenements/${event.id}">${icon('arrow-left')}${esc(event.name)}</a>`
      : query.get('retour') === 'fiche' && query.get('prestataire')
        ? `<a class="link back" href="#/prestataires/${esc(query.get('prestataire'))}">${icon('arrow-left')}Retour à la fiche</a>`
        : `<a class="link back" href="#/evenements">${icon('arrow-left')}Mes événements</a>`;

    let body = '';
    if (step === 1) {
      body = `
        <fieldset class="type-grid" aria-describedby="err-type">
          <legend class="form-title">Quel type d’événement organisez-vous ?</legend>
          ${EVENT_TYPES.map(
            (t) => `
            <div class="type-option">
              <input type="radio" name="type" id="type-${t.id}" value="${t.id}" ${draft.type === t.id ? 'checked' : ''} />
              <label for="type-${t.id}">${icon(t.icon)}${t.label}</label>
            </div>`,
          ).join('')}
        </fieldset>
        <div style="margin-top:12px">${err('type')}</div>`;
    } else if (step === 2) {
      body = `
        <h2 class="form-title">Les informations de l’événement</h2>
        <div class="fields">
          <div class="field field--full" data-field="name">
            <label for="f-name">Nom de l’événement <span class="req">*</span></label>
            <input class="input" id="f-name" name="name" maxlength="80" placeholder="Mariage de Aïssatou" value="${esc(draft.name)}" aria-describedby="err-name" autocomplete="off" />
            ${err('name')}
          </div>
          <div class="field field--full" data-field="date">
            <label for="f-date">Date <span class="req">*</span></label>
            <div class="control">${icon('calendar')}<input class="input" type="date" id="f-date" name="date" min="${TODAY}" value="${esc(draft.date)}" aria-describedby="err-date" /></div>
            ${err('date')}
          </div>
          <div class="field" data-field="city">
            <label for="f-city">Ville <span class="req">*</span></label>
            <div class="control">${icon('map-pin')}<input class="input" id="f-city" name="city" list="cities" placeholder="Paris" value="${esc(draft.city)}" aria-describedby="err-city" autocomplete="off" />
            <datalist id="cities">${CITIES.map((c) => `<option value="${c}"></option>`).join('')}</datalist></div>
            ${err('city')}
          </div>
          <div class="field" data-field="guests">
            <label for="f-guests">Nombre d’invités <span class="req">*</span></label>
            <div class="control">${icon('users')}<input class="input" type="number" inputmode="numeric" min="1" max="5000" id="f-guests" name="guests" placeholder="150" value="${esc(draft.guests)}" aria-describedby="err-guests" /></div>
            ${err('guests')}
          </div>
        </div>`;
    } else {
      body = `
        <h2 class="form-title">Quelques détails pour les prestataires</h2>
        <div class="fields">
          <div class="field field--full">
            <label for="f-budget">Budget indicatif <span class="opt">(facultatif)</span></label>
            <div class="control">${icon('wallet')}
              <select class="select" id="f-budget" name="budget">
                <option value="">Choisir une fourchette</option>
                ${BUDGETS.map((b) => `<option value="${b.id}" ${draft.budget === b.id ? 'selected' : ''}>${b.label}</option>`).join('')}
              </select>${icon('chevron-down', 'icon--end')}</div>
          </div>
          <div class="field field--full">
            <label for="f-description">Description <span class="opt">(facultative)</span></label>
            <textarea class="textarea" id="f-description" name="description" maxlength="600" placeholder="Ambiance souhaitée, déroulé, contraintes…">${esc(draft.description)}</textarea>
            <p class="hint">Ces informations aident les prestataires à préparer leur devis.</p>
          </div>
        </div>`;
    }

    const finalLabel = editing ? 'Enregistrer les modifications' : 'Créer l’événement';
    return {
      title,
      html: `
      <section class="page container" aria-labelledby="page-title">
        ${backLink}
        <div class="page-head"><div><h1 id="page-title">${title}</h1>
        ${editing ? '' : '<p>Trois étapes, moins d’une minute.</p>'}</div></div>
        <form class="card form-card" id="event-form" novalidate>
          <ol class="stepper" aria-label="Étapes">
            ${steps
              .map(
                (label, i) => `
              <li class="${i + 1 < step ? 'is-done' : i + 1 === step ? 'is-current' : ''}" ${i + 1 === step ? 'aria-current="step"' : ''}>
                <span class="stepper__dot">${i + 1 < step ? icon('check') : i + 1}</span>${label}
              </li>`,
              )
              .join('')}
          </ol>
          ${body}
          <div class="form-actions">
            ${step > 1 ? `<a class="btn btn--outline" href="${base}?etape=${step - 1}${carry(query)}">${icon('arrow-left')}Précédent</a>` : '<span class="spacer"></span>'}
            <button class="btn btn--cta" type="submit">${step < 3 ? `Suivant${icon('arrow-right')}` : `${finalLabel}${icon('check')}`}</button>
          </div>
        </form>
      </section>`,
      after() {
        const form = document.getElementById('event-form');
        const sync = () => {
          const data = new FormData(form);
          for (const [k, v] of data.entries()) draft[k] = String(v);
          saveDraft(draft);
        };
        form.addEventListener('input', sync);
        form.addEventListener('change', sync);
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          sync();
          const errors = validateStep(step, draft);
          form.querySelectorAll('.error').forEach((el) => (el.hidden = true));
          form.querySelectorAll('.field').forEach((el) => el.classList.remove('has-error'));
          const keys = Object.keys(errors);
          if (keys.length) {
            for (const k of keys) {
              const el = document.getElementById(`err-${k}`);
              el.querySelector('span').textContent = errors[k];
              el.hidden = false;
              form.querySelector(`[data-field="${k}"]`)?.classList.add('has-error');
              form.querySelector(`[name="${k}"]`)?.setAttribute('aria-invalid', 'true');
            }
            form.querySelector(`[name="${keys[0]}"]`)?.focus();
            return;
          }
          if (step < 3) {
            go(`${base}?etape=${step + 1}${carry(query)}`);
            return;
          }
          finishForm(event, draft, query);
        });
        if (step === 2) form.querySelector('[name="name"]').focus({ preventScroll: true });
      },
    };
  }

  /** Les paramètres à garder d'une étape à l'autre (création depuis une fiche prestataire). */
  function carry(query) {
    const p = new URLSearchParams();
    for (const k of ['prestataire', 'retour']) if (query.get(k)) p.set(k, query.get(k));
    const s = p.toString();
    return s ? `&${s}` : '';
  }

  function finishForm(event, d, query) {
    const fields = {
      type: d.type,
      name: d.name.trim(),
      date: d.date,
      city: d.city.trim(),
      guests: Number(d.guests),
      budget: d.budget || '',
      description: d.description.trim(),
    };
    sessionStorage.removeItem(DRAFT_KEY);
    if (event) {
      Object.assign(event, fields);
      save();
      pendingToast = {
        title: 'Modifications enregistrées',
        text: `« ${fields.name} » est à jour.`,
      };
      go(`#/evenements/${event.id}`);
      return;
    }
    let id = slugify(fields.name);
    while (findEvent(id)) id = `${slugify(fields.name)}-${Math.random().toString(36).slice(2, 6)}`;
    const created = { id, ...fields, createdAt: new Date().toISOString(), providers: [] };
    const fromProvider = provider(query.get('prestataire'));
    if (fromProvider) created.providers.push({ providerId: fromProvider.id, status: 'added' });
    state.events.push(created);
    save();
    if (fromProvider && query.get('retour') === 'fiche') {
      pendingToast = {
        title: 'Événement créé',
        text: `« ${fromProvider.name} » a été ajouté à « ${fields.name} ».`,
      };
      go(`#/prestataires/${fromProvider.id}`);
    } else {
      pendingToast = { title: 'Événement créé', text: 'Ajoutez maintenant vos prestataires.' };
      go(`#/evenements/${id}`);
    }
  }

  // ------------------------------------------------------------------ 03 Détail

  function detailView(event) {
    const c = counts(event);
    const status = eventStatus(event);
    const groups = CATEGORIES.map((cat) => ({
      cat,
      links: event.providers.filter((l) => provider(l.providerId)?.category === cat.id),
    })).filter((g) => g.links.length);
    const present = new Set(event.providers.map((l) => provider(l.providerId)?.category));
    const missing = (RECOMMENDED[event.type] ?? RECOMMENDED.autre)
      .filter((id) => !present.has(id))
      .slice(0, 4);
    const canRequest = event.providers.some((l) => l.status === 'added');
    const requestBtn = (cls = '') =>
      canRequest
        ? `<a class="btn btn--cta ${cls}" href="#/evenements/${event.id}/devis">${icon('send')}Demander les devis</a>`
        : `<button class="btn btn--cta ${cls}" type="button" disabled title="Ajoutez d’abord un prestataire">${icon('send')}Demander les devis</button>`;
    const addBtn = (cls = 'btn--outline') =>
      `<a class="btn ${cls}" href="#/evenements/${event.id}/ajouter">${icon('plus')}Ajouter un prestataire</a>`;
    const budget = budgetLabel(event.budget);

    const providerRow = (link) => {
      const p = provider(link.providerId);
      const st = LINK_STATUS[link.status];
      return `
        <li class="provider-row">
          <img class="provider-row__photo" src="${IMG}${p.photo}" alt="" />
          <div class="provider-row__body">
            <p class="provider-row__name"><a href="#/prestataires/${p.id}">${esc(p.name)}</a>${verified(p)}</p>
            <p class="provider-row__meta">${rating(p)}<span>(${p.reviews} avis)</span><span>${icon('map-pin', 'icon--xs')}${esc(p.city)}</span></p>
          </div>
          <div class="provider-row__status">${badge(st)}</div>
          <div class="provider-row__actions">
            ${
              link.status === 'received'
                ? `<button class="icon-action" type="button" data-action="retain" data-provider="${p.id}">${icon('check')}Retenir</button>`
                : link.status === 'retained'
                  ? `<button class="icon-action" type="button" data-action="unretain" data-provider="${p.id}">${icon('undo-2')}Ne plus retenir</button>`
                  : ''
            }
            <a class="icon-action" href="#/prestataires/${p.id}" aria-label="Voir la fiche de ${esc(p.name)}" title="Voir la fiche">${icon('chevron-right')}</a>
            <a class="icon-action icon-action--danger" href="#/evenements/${event.id}?modale=retirer&prestataire=${p.id}" aria-label="Retirer ${esc(p.name)}" title="Retirer">${icon('x')}</a>
          </div>
        </li>`;
    };

    const stat = (iconName, value, label) =>
      `<li class="card stat"><span class="stat__icon">${icon(iconName)}</span><span class="stat__text"><span class="stat__value">${value}</span><span class="stat__label">${label}</span></span></li>`;

    return {
      title: event.name,
      html: `
      <section class="page container" aria-labelledby="page-title">
        <a class="link back" href="#/evenements">${icon('arrow-left')}Mes événements</a>
        <header class="card detail-head">
          <img class="detail-head__photo" src="${IMG}${eventType(event.type).photo}" alt="" />
          <div class="detail-head__body">
            <div class="detail-head__top">
              <div class="detail-head__title"><h1 id="page-title">${esc(event.name)}</h1>${badge(status)}</div>
              <div class="detail-head__actions">
                <a class="btn btn--outline btn--sm" href="#/evenements/${event.id}/modifier?etape=1">${icon('pencil')}Modifier</a>
                <a class="btn btn--danger-outline btn--sm" href="#/evenements/${event.id}?modale=supprimer">${icon('trash-2')}Supprimer</a>
              </div>
            </div>
            <ul class="meta">
              <li>${icon(eventType(event.type).icon)}${eventType(event.type).label}</li>
              <li>${icon('calendar')}${formatDate(event.date)}</li>
              <li>${icon('map-pin')}${esc(event.city)}</li>
              <li>${icon('users')}${plural(event.guests, 'invité')}</li>
              ${budget ? `<li>${icon('wallet')}${budget}</li>` : ''}
            </ul>
            ${event.description ? `<p class="detail-head__desc">${esc(event.description)}</p>` : ''}
          </div>
        </header>
        <ul class="stats" aria-label="Indicateurs">
          ${stat('user-round', c.providers, c.providers > 1 ? 'prestataires ajoutés' : 'prestataire ajouté')}
          ${stat('send', c.requested, c.requested > 1 ? 'devis demandés' : 'devis demandé')}
          ${stat('file-text', c.received, c.received > 1 ? 'devis reçus' : 'devis reçu')}
          ${stat('award', c.retained, c.retained > 1 ? 'retenus' : 'retenu')}
        </ul>
        <div class="detail-grid">
          <section aria-labelledby="providers-title">
            <div class="section-head">
              <h2 id="providers-title">Prestataires de l’événement (${c.providers})</h2>
              ${addBtn('btn--outline btn--sm')}
            </div>
            ${
              groups.length
                ? groups
                    .map(
                      (g) => `
              <div class="card group">
                <h3 class="group__title">${icon(g.cat.icon)}${g.cat.label} (${g.links.length})</h3>
                <ul style="list-style:none;margin:0;padding:0">${g.links.map(providerRow).join('')}</ul>
              </div>`,
                    )
                    .join('')
                : `<div class="card empty-inline">
                    <span class="stat__icon">${icon('user-round')}</span>
                    <h3>Aucun prestataire pour l’instant</h3>
                    <p>Ajoutez les prestataires qui vous intéressent, puis envoyez-leur une demande de devis en une fois.</p>
                    ${addBtn('btn--cta')}
                  </div>`
            }
          </section>
          <aside class="side">
            ${
              missing.length
                ? `<section class="card side-card" aria-labelledby="suggest-title">
              <h2 id="suggest-title">Complétez votre événement</h2>
              <p>Les prestataires souvent choisis pour un ${eventType(event.type).label.toLowerCase()}.</p>
              <ul class="suggest">
                ${missing
                  .map((id) => {
                    const cat = category(id);
                    return `<li><span class="suggest__icon">${icon(cat.icon)}</span><span class="suggest__label">${cat.label}</span>
                    <a class="btn btn--ghost btn--sm" href="#/evenements/${event.id}/ajouter?categorie=${cat.id}" aria-label="Découvrir : ${cat.label}">Découvrir</a></li>`;
                  })
                  .join('')}
              </ul>
            </section>`
                : ''
            }
            <div class="card side-actions">
              ${requestBtn('btn--block')}
              ${addBtn('btn--outline btn--block')}
              <p class="hint" style="text-align:center">Wenzee ne prend aucune réservation ni paiement : vous comparez les devis et retenez vos prestataires.</p>
            </div>
          </aside>
        </div>
        <div class="sticky-cta">${requestBtn()}</div>
      </section>`,
      after() {
        app.querySelectorAll('[data-action="retain"], [data-action="unretain"]').forEach((btn) =>
          btn.addEventListener('click', () => {
            const link = event.providers.find((l) => l.providerId === btn.dataset.provider);
            const retain = btn.dataset.action === 'retain';
            link.status = retain ? 'retained' : 'received';
            save();
            pendingToast = retain
              ? {
                  title: 'Prestataire retenu',
                  text: `« ${provider(link.providerId).name} » fait partie de vos choix. Ce n’est pas une réservation.`,
                }
              : {
                  title: 'Choix retiré',
                  text: `« ${provider(link.providerId).name} » n’est plus retenu.`,
                };
            render();
          }),
        );
      },
    };
  }

  // ------------------------------------------------------------------ 04 Ajouter un prestataire

  function addView(event, query) {
    const q = (query.get('q') ?? '').trim();
    const cat = query.get('categorie') ?? '';
    const city = query.get('ville') ?? '';
    const norm = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const results = PROVIDERS.filter(
      (p) =>
        (!q || norm(`${p.name} ${category(p.category).label}`).includes(norm(q))) &&
        (!cat || p.category === cat) &&
        (!city || p.city === city),
    );
    const linked = new Set(event.providers.map((l) => l.providerId));
    return {
      title: 'Ajouter un prestataire',
      html: `
      <section class="page container" aria-labelledby="page-title">
        <a class="link back" href="#/evenements/${event.id}">${icon('arrow-left')}Retour à l’événement</a>
        <div class="page-head"><div><h1 id="page-title">Ajouter un prestataire</h1>
        <p>Recherchez et ajoutez un prestataire à « ${esc(event.name)} ».</p></div></div>
        <form class="card filters" id="filters" role="search">
          <div class="field field--search">
            <label for="f-q">Rechercher</label>
            <div class="control">${icon('search')}<input class="input" type="search" id="f-q" name="q" placeholder="Rechercher un prestataire…" value="${esc(q)}" autocomplete="off" /></div>
          </div>
          <div class="field">
            <label for="f-cat">Catégorie</label>
            <div class="control"><select class="select" id="f-cat" name="categorie">
              <option value="">Toutes les catégories</option>
              ${CATEGORIES.map((c) => `<option value="${c.id}" ${c.id === cat ? 'selected' : ''}>${c.label}</option>`).join('')}
            </select>${icon('chevron-down', 'icon--end')}</div>
          </div>
          <div class="field">
            <label for="f-city">Ville</label>
            <div class="control"><select class="select" id="f-city" name="ville">
              <option value="">Toutes les villes</option>
              ${CITIES.map((c) => `<option ${c === city ? 'selected' : ''}>${c}</option>`).join('')}
            </select>${icon('chevron-down', 'icon--end')}</div>
          </div>
        </form>
        <p class="results-count" aria-live="polite">${plural(results.length, 'prestataire')}</p>
        ${
          results.length
            ? `<ul class="result-list">${results
                .map((p) => {
                  const added = linked.has(p.id);
                  return `
              <li class="card result">
                <img class="result__photo" src="${IMG}${p.photo}" alt="" />
                <div class="result__body">
                  <p class="provider-row__name"><a href="#/prestataires/${p.id}">${esc(p.name)}</a>${verified(p)}</p>
                  <p class="provider-row__meta"><span>${category(p.category).label} · ${esc(p.city)}</span></p>
                  <p class="provider-row__meta">${rating(p)}<span>(${p.reviews} avis)</span></p>
                </div>
                ${
                  added
                    ? `<button class="btn btn--sm btn--added" type="button" disabled>${icon('check')}Ajouté</button>`
                    : `<button class="btn btn--cta btn--sm" type="button" data-add="${p.id}" aria-label="Ajouter ${esc(p.name)}">${icon('plus')}Ajouter</button>`
                }
              </li>`;
                })
                .join('')}</ul>`
            : `<div class="card empty-inline"><span class="stat__icon">${icon('search')}</span><h3>Aucun prestataire trouvé</h3>
               <p>Essayez une autre catégorie ou une autre ville.</p>
               <a class="btn btn--outline" href="#/evenements/${event.id}/ajouter">Effacer les filtres</a></div>`
        }
      </section>`,
      after() {
        const form = document.getElementById('filters');
        let timer;
        const apply = () => {
          const p = new URLSearchParams();
          for (const [k, v] of new FormData(form).entries()) if (v) p.set(k, String(v));
          const active = document.activeElement?.id;
          history.replaceState(
            null,
            '',
            `#/evenements/${event.id}/ajouter${p.toString() ? `?${p}` : ''}`,
          );
          render();
          if (active) {
            const el = document.getElementById(active);
            el?.focus();
            if (el?.type === 'search') el.setSelectionRange(el.value.length, el.value.length);
          }
        };
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          apply();
        });
        form.addEventListener('change', apply);
        form.q.addEventListener('input', () => {
          clearTimeout(timer);
          timer = setTimeout(apply, 250);
        });
        app.querySelectorAll('[data-add]').forEach((btn) =>
          btn.addEventListener('click', () => {
            if (event.providers.some((l) => l.providerId === btn.dataset.add)) return; // pas de doublon
            event.providers.push({ providerId: btn.dataset.add, status: 'added' });
            save();
            pendingToast = {
              title: 'Prestataire ajouté',
              text: `« ${provider(btn.dataset.add).name} » a été ajouté à « ${event.name} ».`,
            };
            render();
          }),
        );
      },
    };
  }

  // ------------------------------------------------------------------ 06 Demander les devis

  function quotesView(event) {
    const eligible = event.providers.filter((l) => l.status === 'added').map((l) => l.providerId);
    const selected = new Set(eligible);
    const ordered = [...event.providers].sort(
      (a, b) => (a.status === 'added' ? 0 : 1) - (b.status === 'added' ? 0 : 1),
    );
    const budget = budgetLabel(event.budget);
    return {
      title: 'Demander les devis',
      html: `
      <section class="page container" aria-labelledby="page-title">
        <a class="link back" href="#/evenements/${event.id}">${icon('arrow-left')}Retour à l’événement</a>
        <div class="page-head"><div><h1 id="page-title">Demander les devis</h1>
        <p>Sélectionnez les prestataires à qui vous souhaitez envoyer une demande de devis.</p></div></div>
        <form id="quote-form" class="quote-grid">
          <div style="display:flex;flex-direction:column;gap:20px;min-width:0">
            <div class="card" style="overflow:hidden">
              <div class="pick-head">
                <strong id="selected-count" aria-live="polite"></strong>
                ${eligible.length > 1 ? '<button type="button" class="link" id="toggle-all" style="border:0;background:none">Tout désélectionner</button>' : ''}
              </div>
              ${
                event.providers.length
                  ? `<ul class="pick-list">${ordered
                      .map((l) => {
                        const p = provider(l.providerId);
                        const can = l.status === 'added';
                        return `
                  <li class="pick ${can ? 'is-checked' : 'is-disabled'}">
                    <input type="checkbox" id="pick-${p.id}" name="pick" value="${p.id}" ${can ? 'checked' : 'disabled'} />
                    <label for="pick-${p.id}">
                      <img class="provider-row__photo" src="${IMG}${p.photo}" alt="" style="width:48px;height:48px" />
                      <span class="provider-row__body">
                        <span class="provider-row__name">${esc(p.name)}${verified(p)}</span>
                        <span class="provider-row__meta">${category(p.category).label}${can ? '' : ' · déjà contacté'}</span>
                      </span>
                    </label>
                    ${badge(LINK_STATUS[l.status])}
                  </li>`;
                      })
                      .join('')}</ul>`
                  : `<div class="empty-inline"><p>Aucun prestataire dans cet événement.</p><a class="btn btn--outline" href="#/evenements/${event.id}/ajouter">${icon('plus')}Ajouter un prestataire</a></div>`
              }
            </div>
            <div class="card" style="padding:20px">
              <div class="field">
                <label for="f-message">Message aux prestataires <span class="opt">(facultatif)</span></label>
                <textarea class="textarea" id="f-message" name="message" maxlength="1000" placeholder="Bonjour, nous organisons « ${esc(event.name)} » et aimerions recevoir votre devis…"></textarea>
                <p class="hint">Chaque prestataire reçoit une demande de devis séparée ; les échanges passent ensuite par la messagerie Wenzee.</p>
              </div>
            </div>
          </div>
          <aside class="card side-card recap side" aria-labelledby="recap-title">
            <h2 id="recap-title">Récapitulatif</h2>
            <dl>
              <div><dt>Événement</dt><dd>${esc(event.name)}</dd></div>
              <div><dt>Date</dt><dd>${formatDate(event.date)}</dd></div>
              <div><dt>Ville</dt><dd>${esc(event.city)}</dd></div>
              <div><dt>Invités</dt><dd>${event.guests}</dd></div>
              ${budget ? `<div><dt>Budget indicatif</dt><dd>${budget}</dd></div>` : ''}
            </dl>
            <ul class="recap__chosen" id="recap-chosen" aria-label="Prestataires choisis"></ul>
            <button class="btn btn--cta btn--block recap-submit" type="submit">${icon('send')}Envoyer les demandes de devis</button>
          </aside>
          <div class="sticky-cta"><button class="btn btn--cta" type="submit">${icon('send')}Envoyer les demandes de devis</button></div>
        </form>
      </section>`,
      after() {
        const form = document.getElementById('quote-form');
        const update = () => {
          const n = selected.size;
          document.getElementById('selected-count').textContent =
            eligible.length === 0
              ? 'Toutes les demandes ont déjà été envoyées'
              : `${plural(n, 'prestataire sélectionné', 'prestataires sélectionnés')}`;
          document.getElementById('recap-chosen').innerHTML = n
            ? [...selected]
                .map((id) => `<li>${icon('check')}${esc(provider(id).name)}</li>`)
                .join('')
            : '<li class="muted">Aucun prestataire sélectionné</li>';
          form.querySelectorAll('button[type="submit"]').forEach((b) => (b.disabled = n === 0));
          const all = document.getElementById('toggle-all');
          if (all)
            all.textContent = n === eligible.length ? 'Tout désélectionner' : 'Tout sélectionner';
          form.querySelectorAll('.pick input:not(:disabled)').forEach((input) => {
            input.checked = selected.has(input.value);
            input.closest('.pick').classList.toggle('is-checked', input.checked);
          });
        };
        form.addEventListener('change', (e) => {
          if (e.target.name !== 'pick') return;
          if (e.target.checked) selected.add(e.target.value);
          else selected.delete(e.target.value);
          update();
        });
        document.getElementById('toggle-all')?.addEventListener('click', () => {
          if (selected.size === eligible.length) selected.clear();
          else eligible.forEach((id) => selected.add(id));
          update();
        });
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          if (!selected.size) return;
          for (const link of event.providers)
            if (selected.has(link.providerId)) link.status = 'requested';
          save();
          pendingToast = {
            title: 'Demandes de devis envoyées',
            text: `${plural(selected.size, 'prestataire va', 'prestataires vont')} recevoir votre demande.`,
          };
          go(`#/evenements/${event.id}`);
        });
        update();
      },
    };
  }

  // ------------------------------------------------------------------ Fiche prestataire (point d'entrée « Ajouter à un événement »)

  function profileView(id) {
    const p = provider(id);
    if (!p) return notFoundView();
    const inEvents = state.events.filter((e) => e.providers.some((l) => l.providerId === p.id));
    return {
      title: p.name,
      html: `
      <section class="page container" aria-labelledby="page-title">
        <a class="link back" href="javascript:history.back()">${icon('arrow-left')}Retour</a>
        <div class="profile-cover">
          <img src="${IMG}${p.photo}" alt="" />
          <div class="profile-cover__id">
            <h1 id="page-title">${esc(p.name)}${verified(p)}</h1>
            <p><span>${category(p.category).label}</span><span>${icon('map-pin')} ${esc(p.city)}</span>${rating(p)}<span>(${p.reviews} avis)</span></p>
          </div>
        </div>
        <div class="profile-body">
          <div class="card"><h2 style="font-size:22px;margin-bottom:10px">Présentation</h2><p>${esc(p.bio)}</p>
          <p class="hint" style="margin-top:16px">Fiche simplifiée pour la maquette : la vraie fiche prestataire du site garde ses onglets (Présentation, Prestations, Galerie, Avis).</p></div>
          <div class="card side-actions">
            <a class="btn btn--cta btn--block" href="#/prestataires/${p.id}?modale=ajouter">${icon('circle-plus')}Ajouter à un événement</a>
            <button class="btn btn--outline btn--block" type="button" data-out-of-scope>${icon('message-circle')}Contacter le prestataire</button>
            ${
              inEvents.length
                ? `<p class="hint" style="text-align:center">Déjà dans : ${inEvents.map((e) => `<a class="link" href="#/evenements/${e.id}">${esc(e.name)}</a>`).join(', ')}</p>`
                : ''
            }
          </div>
        </div>
      </section>`,
    };
  }

  function notFoundView() {
    return {
      title: 'Introuvable',
      html: `<section class="page container"><div class="card empty"><h2>Cette page n’existe plus</h2>
        <p>L’événement a peut-être été supprimé.</p><a class="btn btn--cta" href="#/evenements">Mes événements</a></div></section>`,
    };
  }

  // ------------------------------------------------------------------ Modales (05, 08, ajout depuis la fiche)

  const modalRoot = document.getElementById('modal-root');
  let lastFocus = null;

  function closeModal(toHash) {
    modalRoot.innerHTML = '';
    document.removeEventListener('keydown', onModalKey);
    if (toHash) go(toHash);
    lastFocus?.focus?.();
  }
  function onModalKey(e) {
    if (e.key === 'Escape') modalRoot.querySelector('[data-cancel]')?.click();
    if (e.key === 'Tab') {
      const f = [...modalRoot.querySelectorAll('button, a[href], input')].filter(
        (el) => !el.disabled,
      );
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }
  function openModal(html, { wide = false } = {}) {
    lastFocus = document.activeElement;
    modalRoot.innerHTML = `<div class="modal-backdrop" data-backdrop><div class="card modal ${wide ? 'modal--wide' : ''}" role="dialog" aria-modal="true" aria-labelledby="modal-title" aria-describedby="modal-desc" style="position:relative">${html}</div></div>`;
    document.addEventListener('keydown', onModalKey);
    modalRoot.querySelector('[data-backdrop]').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) modalRoot.querySelector('[data-cancel]')?.click();
    });
    (modalRoot.querySelector('[data-autofocus]') ?? modalRoot.querySelector('button'))?.focus();
  }

  function renderModal(query, parts) {
    modalRoot.innerHTML = '';
    const kind = query.get('modale');
    if (!kind) return;
    if (parts[0] === 'prestataires') return addToEventModal(provider(parts[1]));
    const event = findEvent(parts[1]);
    if (!event) return;
    const back = `#/evenements/${event.id}`;
    if (kind === 'retirer') {
      const link = event.providers.find((l) => l.providerId === query.get('prestataire'));
      if (!link) return;
      const p = provider(link.providerId);
      openModal(`
        <div class="modal__icon">${icon('trash-2')}</div>
        <h2 id="modal-title">Retirer le prestataire ?</h2>
        <p id="modal-desc">Souhaitez-vous vraiment retirer <strong>« ${esc(p.name)} »</strong> de cet événement ?</p>
        ${link.status !== 'added' ? `<p class="modal__note">Statut actuel : ${LINK_STATUS[link.status].label}. La demande de devis restera dans votre messagerie, mais ne sera plus suivie ici.</p>` : ''}
        <div class="modal__actions">
          <button class="btn btn--outline" type="button" data-cancel data-autofocus>Annuler</button>
          <button class="btn btn--danger" type="button" data-confirm>Retirer</button>
        </div>`);
      modalRoot.querySelector('[data-cancel]').addEventListener('click', () => closeModal(back));
      modalRoot.querySelector('[data-confirm]').addEventListener('click', () => {
        event.providers = event.providers.filter((l) => l !== link);
        save();
        pendingToast = {
          title: 'Prestataire retiré',
          text: `« ${p.name} » a été retiré de « ${event.name} ».`,
        };
        closeModal(back);
      });
    }
    if (kind === 'supprimer') {
      openModal(`
        <div class="modal__icon">${icon('triangle-alert')}</div>
        <h2 id="modal-title">Supprimer l’événement ?</h2>
        <p id="modal-desc">Cette action supprimera <strong>« ${esc(event.name)} »</strong> et ses associations avec les prestataires. Les comptes des prestataires ne sont pas supprimés.</p>
        <div class="modal__actions">
          <button class="btn btn--outline" type="button" data-cancel data-autofocus>Annuler</button>
          <button class="btn btn--danger" type="button" data-confirm>Supprimer</button>
        </div>`);
      modalRoot.querySelector('[data-cancel]').addEventListener('click', () => closeModal(back));
      modalRoot.querySelector('[data-confirm]').addEventListener('click', () => {
        const index = state.events.indexOf(event);
        state.deleted = { event, index };
        state.events.splice(index, 1);
        save();
        pendingToast = {
          title: 'Événement supprimé',
          text: 'L’événement a bien été supprimé.',
          undo: () => {
            if (!state.deleted) return;
            state.events.splice(
              Math.min(state.deleted.index, state.events.length),
              0,
              state.deleted.event,
            );
            const restored = state.deleted.event;
            state.deleted = null;
            save();
            pendingToast = {
              title: 'Événement restauré',
              text: `« ${restored.name} » et ses prestataires sont de retour.`,
            };
            render();
          },
        };
        closeModal('#/evenements');
      });
    }
  }

  function addToEventModal(p) {
    if (!p) return;
    const back = `#/prestataires/${p.id}`;
    const events = [...state.events].sort((a, b) => a.date.localeCompare(b.date));
    openModal(
      `
      <button class="icon-btn modal__close" type="button" data-cancel aria-label="Fermer">${icon('x')}</button>
      <h2 id="modal-title">Ajouter à un événement</h2>
      <p id="modal-desc">Choisissez l’événement auquel ajouter <strong>« ${esc(p.name)} »</strong>.</p>
      ${
        events.length
          ? `<ul class="pick-events">${events
              .map((e) => {
                const already = e.providers.some((l) => l.providerId === p.id);
                return `<li><img src="${IMG}${eventType(e.type).photo}" alt="" />
                <span style="flex:1;min-width:0"><strong>${esc(e.name)}</strong><br /><span class="hint">${formatDate(e.date)} · ${esc(e.city)} · ${plural(e.providers.length, 'prestataire')}</span></span>
                ${
                  already
                    ? `<button class="btn btn--sm btn--added" type="button" disabled>${icon('check')}Ajouté</button>`
                    : `<button class="btn btn--cta btn--sm" type="button" data-to="${e.id}" aria-label="Ajouter à ${esc(e.name)}">Ajouter</button>`
                }</li>`;
              })
              .join('')}</ul>`
          : '<p class="hint" style="margin:16px 0">Vous n’avez pas encore d’événement.</p>'
      }
      <a class="btn btn--outline btn--block" href="#/evenements/nouveau?etape=1&prestataire=${p.id}&retour=fiche" data-new>${icon('plus')}Nouvel événement</a>`,
      { wide: true },
    );
    modalRoot.querySelector('[data-cancel]').addEventListener('click', () => closeModal(back));
    modalRoot.querySelector('[data-new]').addEventListener('click', () => {
      sessionStorage.removeItem(DRAFT_KEY);
      closeModal();
    });
    modalRoot.querySelectorAll('[data-to]').forEach((btn) =>
      btn.addEventListener('click', () => {
        const e = findEvent(btn.dataset.to);
        if (!e.providers.some((l) => l.providerId === p.id))
          e.providers.push({ providerId: p.id, status: 'added' });
        save();
        pendingToast = {
          title: 'Prestataire ajouté',
          text: `« ${p.name} » a été ajouté à « ${e.name} ».`,
        };
        closeModal(back);
      }),
    );
  }

  // ------------------------------------------------------------------ Toasts

  const toastRoot = document.getElementById('toasts');
  function toast({ title, text, undo, kind = 'success' }) {
    const el = document.createElement('div');
    el.className = `card toast ${kind === 'info' ? 'toast--info' : ''}`;
    el.setAttribute('role', 'status');
    el.innerHTML = `
      <span class="toast__icon">${icon(kind === 'info' ? 'info' : 'check')}</span>
      <div class="toast__body"><p class="toast__title">${esc(title)}</p>${text ? `<p class="toast__text">${esc(text)}</p>` : ''}</div>
      ${undo ? '<button class="toast__undo" type="button">Annuler</button>' : ''}
      <button class="icon-action" type="button" aria-label="Fermer la notification">${icon('x')}</button>`;
    const remove = () => el.remove();
    el.querySelector('[aria-label="Fermer la notification"]').addEventListener('click', remove);
    el.querySelector('.toast__undo')?.addEventListener('click', () => {
      remove();
      undo();
    });
    toastRoot.replaceChildren(el);
    // L'annulation reste possible 8 s ; les autres messages partent après 5 s.
    setTimeout(remove, undo ? 8000 : 5000);
  }

  // ------------------------------------------------------------------ Coque : thème, menu, liens hors maquette

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
      btn.innerHTML = icon(theme === 'dark' ? 'sun' : 'moon');
      btn.setAttribute(
        'aria-label',
        theme === 'dark' ? 'Passer en thème clair' : 'Passer en thème sombre',
      );
    });
  }
  const initialTheme = params.get('theme') ?? localStorage.getItem(THEME_KEY) ?? 'light';
  applyTheme(initialTheme === 'dark' ? 'dark' : 'light');
  document.addEventListener('click', (e) => {
    const toggle = e.target.closest('[data-theme-toggle]');
    if (toggle) {
      const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem(THEME_KEY, next);
      applyTheme(next);
    }
    if (e.target.closest('[data-out-of-scope]')) {
      e.preventDefault();
      toast({
        kind: 'info',
        title: 'Hors de cette maquette',
        text: 'Cet écran existe déjà sur le site ; il n’est pas repris ici.',
      });
    }
    if (e.target.closest('[data-burger]')) openDrawer();
    if (e.target.closest('[data-drawer-close]') || e.target.matches('.drawer')) closeDrawer();
  });

  const drawer = document.getElementById('drawer');
  function openDrawer() {
    drawer.hidden = false;
    drawer.querySelector('a, button')?.focus();
  }
  function closeDrawer() {
    if (drawer) drawer.hidden = true;
  }

  window.addEventListener('hashchange', render);
  if (!location.hash) location.replace('#/evenements');
  render();
})();
