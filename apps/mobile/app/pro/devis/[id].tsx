import { useTranslation } from 'react-i18next';
import { ProOnly } from '@/features/pro/ProOnly';
import { QuoteFormScreen } from '@/features/pro/QuoteFormScreen';

/** Envoyer un devis pour la demande [id] (S4, lot M14b). */
export default function ProQuoteRoute() {
  const { t } = useTranslation();
  return (
    <ProOnly title={t('tabs.requests')}>
      <QuoteFormScreen />
    </ProOnly>
  );
}
