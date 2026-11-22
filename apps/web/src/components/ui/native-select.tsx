import { ChevronDownIcon } from 'lucide-react';
import type * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * Une liste déroulante NATIVE (<select>), au style des autres champs.
 * Pour les filtres, on la préfère au Select Radix : sur téléphone, elle ouvre
 * le sélecteur du système, plus pratique, et elle est simple à tester.
 */
function NativeSelect({ className, ...props }: React.ComponentProps<'select'>) {
  return (
    <div className="relative">
      <select
        data-slot="native-select"
        className={cn(
          'border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full appearance-none rounded-md border bg-card py-1 pr-8 pl-3 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:opacity-50',
          className,
        )}
        {...props}
      />
      <ChevronDownIcon
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 opacity-50"
      />
    </div>
  );
}

export { NativeSelect };
