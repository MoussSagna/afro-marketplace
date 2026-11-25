import { i18n } from './index';
import { useLanguageStore } from './languageStore';

afterEach(async () => {
  useLanguageStore.setState({ preference: 'system' });
  await i18n.changeLanguage('fr');
});

describe('useLanguageStore', () => {
  it('change la langue de l’app quand on en choisit une', () => {
    useLanguageStore.getState().setPreference('en');
    expect(i18n.language).toBe('en');
    useLanguageStore.getState().setPreference('fr');
    expect(i18n.language).toBe('fr');
  });
});
