import type { Quote } from '@afro/common';
import { describe, expect, it } from 'vitest';
import {
  centsToEuros,
  eurosToCents,
  initialQuoteForm,
  liveTotals,
  quoteFormSchema,
  toCreateQuoteInput,
} from './quoteForm';

describe('formulaire de devis (S4)', () => {
  it('lit les montants en euros à la française', () => {
    expect(eurosToCents('28,50')).toBe(2850);
    expect(eurosToCents('28.5')).toBe(2850);
    expect(eurosToCents('1 200')).toBe(120000);
    expect(eurosToCents('12,345')).toBeUndefined();
    expect(eurosToCents('abc')).toBeUndefined();
    expect(centsToEuros(2850)).toBe('28,50');
    expect(centsToEuros(120000)).toBe('1200');
  });

  it('calcule le total et l’acompte en direct, en ignorant les lignes incomplètes', () => {
    expect(
      liveTotals({
        lines: [
          { label: 'Buffet', quantity: '150', unitPrice: '28' },
          { label: 'Service', quantity: '1', unitPrice: '300' },
          { label: 'En cours', quantity: '2', unitPrice: '' },
        ],
        depositRate: '30',
      }),
    ).toEqual({ lineTotals: [420000, 30000, 0], total: 450000, deposit: 135000 });
  });

  it('refuse une ligne sans libellé ou un prix illisible', () => {
    const result = quoteFormSchema.safeParse({
      ...initialQuoteForm('2026-12-01'),
      lines: [{ label: '', quantity: '0', unitPrice: '12,345' }],
    });
    expect(result.success).toBe(false);
    expect(result.error!.issues.map((i) => i.message)).toEqual([
      'Décris la ligne',
      'Quantité entre 1 et 10 000',
      'Prix invalide (ex. : 28,50)',
    ]);
  });

  it('reprend la version précédente pour une négociation', () => {
    const previous = {
      lines: [{ id: 'l', quoteId: 'q', label: 'Show', quantity: 1, unitPrice: 65000 }],
      depositRate: 40,
      conditions: 'Sono fournie',
    } as Quote;
    const values = initialQuoteForm('2026-12-01', previous);
    expect(values.lines).toEqual([{ label: 'Show', quantity: '1', unitPrice: '650' }]);
    expect(values).toMatchObject({
      depositRate: '40',
      validUntil: '2026-12-15',
      conditions: 'Sono fournie',
    });
  });

  it('convertit la saisie pour l’API', () => {
    expect(
      toCreateQuoteInput(
        {
          lines: [{ label: ' Buffet ', quantity: '150', unitPrice: '28,50' }],
          depositRate: '30',
          validUntil: '2026-12-15',
          conditions: '',
        },
        'qr-1',
      ),
    ).toEqual({
      quoteRequestId: 'qr-1',
      lines: [{ label: 'Buffet', quantity: 150, unitPrice: 2850 }],
      depositRate: 30,
      validUntil: '2026-12-15',
      conditions: undefined,
    });
  });
});
