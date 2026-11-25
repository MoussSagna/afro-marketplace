import { z } from 'zod';
import { computeDepositAmount, computeQuoteTotal } from '../rules/quote';
import { createQuoteInputSchema } from '../schemas/quote';
import type { CreateQuoteInput, Quote } from '../types';
import { addDays } from './dates';
import { centsToEuros, eurosToCents } from './money';

/** Les messages d'erreur du formulaire de devis (traduits via errorKeyOf, voir i18n/fr.ts). */
export const quoteFormMessages = {
  lineLabelRequired: 'Décris la ligne',
  quantityRange: 'Quantité entre 1 et 10 000',
  unitPriceInvalid: 'Prix invalide (ex. : 28,50)',
  linesRequired: 'Ajoute au moins une ligne',
  depositRateRange: 'Un pourcentage entre 0 et 100',
  validUntilRequired: 'Choisis une date de validité',
} as const;

const lineSchema = z.object({
  label: z.string().trim().min(2, quoteFormMessages.lineLabelRequired).max(200),
  quantity: z
    .string()
    .trim()
    .refine(
      (v) => /^\d+$/.test(v) && Number(v) >= 1 && Number(v) <= 10000,
      quoteFormMessages.quantityRange,
    ),
  unitPrice: z
    .string()
    .refine((v) => eurosToCents(v) !== undefined, quoteFormMessages.unitPriceInvalid),
});

/**
 * Le formulaire S4 (site et app), tel que le prestataire le remplit (texte, euros).
 * Le total n'est JAMAIS saisi : il est calculé à partir des lignes
 * (ici pour l'affichage, et de nouveau par le serveur).
 */
export const quoteFormSchema = z.object({
  lines: z.array(lineSchema).min(1, quoteFormMessages.linesRequired).max(30),
  depositRate: z
    .string()
    .refine((v) => /^\d+$/.test(v) && Number(v) <= 100, quoteFormMessages.depositRateRange),
  validUntil: z.iso.date({ error: quoteFormMessages.validUntilRequired }),
  conditions: z.string().max(2000, '2000 caractères maximum'),
});

export type QuoteFormValues = z.input<typeof quoteFormSchema>;
export type QuoteFormLine = QuoteFormValues['lines'][number];

export const emptyLine: QuoteFormLine = { label: '', quantity: '1', unitPrice: '' };

/** Valeurs de départ : vides, ou reprises de la dernière version pour une négociation. */
export function initialQuoteForm(today: string, previous?: Quote): QuoteFormValues {
  return {
    lines: previous
      ? previous.lines.map((l) => ({
          label: l.label,
          quantity: String(l.quantity),
          unitPrice: centsToEuros(l.unitPrice),
        }))
      : [{ ...emptyLine }],
    depositRate: String(previous?.depositRate ?? 30),
    validUntil: addDays(today, 14),
    conditions: previous?.conditions ?? '',
  };
}

/** Total et acompte « en direct », même si certaines lignes sont encore incomplètes. */
export function liveTotals(values: Pick<QuoteFormValues, 'lines' | 'depositRate'>) {
  const lines = values.lines.map((line) => ({
    quantity: /^\d+$/.test(line.quantity.trim()) ? Number(line.quantity) : 0,
    unitPrice: eurosToCents(line.unitPrice) ?? 0,
  }));
  const total = computeQuoteTotal(lines);
  const rate = Number(values.depositRate);
  return {
    lineTotals: lines.map((l) => l.quantity * l.unitPrice),
    total,
    deposit: Number.isFinite(rate) ? computeDepositAmount(total, rate) : 0,
  };
}

/** Convertit la saisie en données pour l'API (nombres, centimes). */
export function toCreateQuoteInput(
  values: QuoteFormValues,
  quoteRequestId: string,
): CreateQuoteInput {
  return createQuoteInputSchema.parse({
    quoteRequestId,
    lines: values.lines.map((line) => ({
      label: line.label.trim(),
      quantity: Number(line.quantity),
      unitPrice: eurosToCents(line.unitPrice),
    })),
    depositRate: Number(values.depositRate),
    validUntil: values.validUntil,
    conditions: values.conditions.trim() || undefined,
  });
}
