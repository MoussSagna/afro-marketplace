import { HOME, safeRedirect, useAuthFlowStore } from './authFlowStore';

describe('safeRedirect', () => {
  it('garde une adresse interne de l’app', () => {
    expect(safeRedirect('/demandes')).toBe('/demandes');
    expect(safeRedirect('/messages?id=1')).toBe('/messages?id=1');
  });

  it('refuse une adresse externe ou bizarre', () => {
    for (const value of [
      'https://pirate.example',
      '//pirate.example',
      'demandes',
      '/\\pirate',
      42,
      null,
    ]) {
      expect(safeRedirect(value)).toBe(HOME);
    }
  });
});

describe('useAuthFlowStore', () => {
  it('retient où revenir, puis l’oublie une fois lu', () => {
    useAuthFlowStore.getState().startAuth('/compte');
    expect(useAuthFlowStore.getState().takeRedirect()).toBe('/compte');
    expect(useAuthFlowStore.getState().takeRedirect()).toBe(HOME);
  });

  it('ne retient pas une adresse externe', () => {
    useAuthFlowStore.getState().startAuth('https://pirate.example');
    expect(useAuthFlowStore.getState().takeRedirect()).toBe(HOME);
  });
});
