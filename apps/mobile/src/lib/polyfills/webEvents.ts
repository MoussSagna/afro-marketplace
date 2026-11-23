/**
 * Des versions minimales de quelques API web que Hermes (le moteur JavaScript
 * du téléphone) n'a pas : EventTarget, Event, MessageEvent, CloseEvent et BroadcastChannel.
 *
 * Pourquoi ? MSW contient aussi de quoi simuler des WebSockets. Même si on ne
 * s'en sert pas, ce code est lu au chargement et y fait référence (« class … extends
 * MessageEvent », « new BroadcastChannel(…) ») : sans elles, l'app planterait au démarrage.
 * On n'ajoute une API que si elle manque : là où elle existe (navigateur, Node), on n'y touche pas.
 */

type Listener = (event: MinimalEvent) => void;

class MinimalEvent {
  readonly type: string;
  readonly cancelable: boolean;
  defaultPrevented = false;
  target: unknown = null;
  constructor(type: string, init: { cancelable?: boolean } = {}) {
    this.type = type;
    this.cancelable = Boolean(init.cancelable);
  }
  preventDefault() {
    if (this.cancelable) this.defaultPrevented = true;
  }
  stopPropagation() {}
  stopImmediatePropagation() {}
}

class MinimalMessageEvent extends MinimalEvent {
  readonly data: unknown;
  constructor(type: string, init: { data?: unknown; cancelable?: boolean } = {}) {
    super(type, init);
    this.data = init.data;
  }
}

class MinimalCloseEvent extends MinimalEvent {
  readonly code: number;
  readonly reason: string;
  readonly wasClean: boolean;
  constructor(type: string, init: { code?: number; reason?: string; wasClean?: boolean } = {}) {
    super(type);
    this.code = init.code ?? 0;
    this.reason = init.reason ?? '';
    this.wasClean = Boolean(init.wasClean);
  }
}

class MinimalEventTarget {
  #listeners = new Map<string, Set<Listener>>();
  addEventListener(type: string, listener: Listener | null) {
    if (!listener) return;
    const set = this.#listeners.get(type) ?? new Set();
    set.add(listener);
    this.#listeners.set(type, set);
  }
  removeEventListener(type: string, listener: Listener | null) {
    if (listener) this.#listeners.get(type)?.delete(listener);
  }
  dispatchEvent(event: MinimalEvent) {
    event.target = this;
    for (const listener of this.#listeners.get(event.type) ?? []) listener.call(this, event);
    return !event.defaultPrevented;
  }
}

/** Un canal entre onglets : un téléphone n'a qu'une « fenêtre », il ne fait donc rien. */
class MinimalBroadcastChannel extends MinimalEventTarget {
  readonly name: string;
  onmessage: Listener | null = null;
  constructor(name: string) {
    super();
    this.name = name;
  }
  postMessage(_message: unknown) {}
  close() {}
}

const polyfills = {
  Event: MinimalEvent,
  EventTarget: MinimalEventTarget,
  MessageEvent: MinimalMessageEvent,
  CloseEvent: MinimalCloseEvent,
  BroadcastChannel: MinimalBroadcastChannel,
} as const;

/** Ajoute les API manquantes sur `target` (globalThis par défaut) ; renvoie leurs noms. */
export function installWebEventPolyfills(target: object = globalThis): string[] {
  const installed: string[] = [];
  for (const [name, value] of Object.entries(polyfills)) {
    if (!(name in target) || (target as Record<string, unknown>)[name] === undefined) {
      Object.defineProperty(target, name, { value, writable: true, configurable: true });
      installed.push(name);
    }
  }
  return installed;
}
