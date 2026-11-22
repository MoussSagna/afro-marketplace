import { ApiError, useDeclineQuote } from '@afro/common';
import { Button } from '@/components/ui/button';

/** C3 : refuser un devis. La demande reste ouverte pour une nouvelle version. */
export function DeclineQuoteButton({ quoteId }: { quoteId: string }) {
  const decline = useDeclineQuote(quoteId);
  return (
    <>
      <Button variant="outline" disabled={decline.isPending} onClick={() => decline.mutate()}>
        Refuser
      </Button>
      {decline.isError && (
        <p role="alert" className="w-full text-sm text-destructive">
          {decline.error instanceof ApiError ? decline.error.message : 'Le refus a échoué.'}
        </p>
      )}
    </>
  );
}
