import {
  ApiError,
  replyToReviewInputSchema,
  useReplyToReview,
  type ReplyToReviewInput,
} from '@afro/common';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';

/** S8 : la réponse publique à un avis. Une seule, qui ne se modifie plus ensuite. */
export function ReplyForm({ reviewId, authorName }: { reviewId: string; authorName: string }) {
  const reply = useReplyToReview(reviewId);
  const form = useForm<ReplyToReviewInput>({
    resolver: zodResolver(replyToReviewInputSchema),
    defaultValues: { reply: '' },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => reply.mutate(values))}
        className="mt-3 flex flex-col gap-2"
      >
        <FormField
          control={form.control}
          name="reply"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Répondre à {authorName}</FormLabel>
              <FormControl>
                <Textarea rows={3} maxLength={1000} {...field} />
              </FormControl>
              <FormDescription>
                Ta réponse sera visible sur ton profil. Tu ne pourras répondre qu’une fois.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        {reply.isError && (
          <p role="alert" className="text-sm text-destructive">
            {reply.error instanceof ApiError ? reply.error.message : 'L’envoi a échoué.'}
          </p>
        )}
        <Button type="submit" size="sm" className="self-end" disabled={reply.isPending}>
          Publier la réponse
        </Button>
      </form>
    </Form>
  );
}
