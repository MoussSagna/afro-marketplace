import { emptyQuoteRequestForm } from '@afro/common';
import { i18n } from '@/i18n';
import { quoteSummary } from './quoteSummary';

const values = {
  ...emptyQuoteRequestForm,
  eventType: 'wedding' as const,
  eventDate: '2026-12-12',
  eventCity: ' Saint-Denis ',
  guestCount: '120',
  budgetMin: '2000',
  budgetMax: '3000',
};

afterEach(async () => {
  await i18n.changeLanguage('fr');
});

describe('quoteSummary', () => {
  it('résume l’événement et le budget en deux lignes', () => {
    const { title, detail } = quoteSummary(values);
    expect(title).toMatch(/^Mariage · sam\. 12 déc\. · 120 invités$/);
    expect(detail).toMatch(/^Saint-Denis · budget 2\s000\s€ à 3\s000\s€$/);
  });

  it('s’adapte à un budget partiel ou absent', () => {
    expect(quoteSummary({ ...values, budgetMin: '' }).detail).toMatch(/budget jusqu’à 3\s000\s€$/);
    expect(quoteSummary({ ...values, budgetMax: '' }).detail).toMatch(/budget dès 2\s000\s€$/);
    expect(quoteSummary({ ...values, budgetMin: '', budgetMax: '', guestCount: '' })).toEqual({
      title: expect.stringMatching(/^Mariage · sam\. 12 déc\.$/),
      detail: 'Saint-Denis',
    });
  });

  it('parle anglais quand l’app est en anglais', async () => {
    await i18n.changeLanguage('en');
    expect(quoteSummary(values)).toEqual({
      title: 'Wedding · Sat 12 Dec · 120 guests',
      detail: 'Saint-Denis · budget €2,000 to €3,000',
    });
  });
});
