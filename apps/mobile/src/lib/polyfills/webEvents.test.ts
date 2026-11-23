import { installWebEventPolyfills } from './webEvents';

describe('installWebEventPolyfills (API web absentes de Hermes, lues par MSW)', () => {
  it('ajoute seulement les API qui manquent', () => {
    const target: Record<string, unknown> = { Event: 'déjà là' };
    const installed = installWebEventPolyfills(target);
    expect(installed).toEqual(['EventTarget', 'MessageEvent', 'CloseEvent', 'BroadcastChannel']);
    expect(target.Event).toBe('déjà là');
  });

  it('ne touche à rien quand tout existe (navigateur, Node)', () => {
    const native = { Event, EventTarget, MessageEvent, CloseEvent: Event, BroadcastChannel };
    const target = { ...native };
    expect(installWebEventPolyfills(target)).toEqual([]);
    expect(target).toEqual(native);
  });

  it('fournit des versions qui fonctionnent assez pour MSW', () => {
    const target: Record<string, unknown> = {};
    installWebEventPolyfills(target);
    const Target = target.EventTarget as typeof EventTarget;
    const Message = target.MessageEvent as new (
      type: string,
      init?: MessageEventInit,
    ) => MessageEvent;
    const Channel = target.BroadcastChannel as typeof BroadcastChannel;

    // On peut en hériter, comme le fait MSW au chargement.
    class CancelableMessageEvent extends Message {}
    const event = new CancelableMessageEvent('message', { data: 'coucou', cancelable: true });

    const emitter = new Target();
    const received: unknown[] = [];
    emitter.addEventListener('message', (e) => {
      received.push((e as MessageEvent).data);
      e.preventDefault();
    });
    expect(emitter.dispatchEvent(event)).toBe(false);
    expect(received).toEqual(['coucou']);

    const channel = new Channel('msw');
    expect(() => {
      channel.postMessage('rien');
      channel.close();
    }).not.toThrow();
  });
});
