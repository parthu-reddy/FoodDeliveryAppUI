import { ChevronRight, Star } from 'lucide-react';
import { useState } from 'react';
import RateOrderModal from './RateOrderModal';
import { RoleName } from '@/types';

interface OrderReviewActionProps {
  orderId: string;
  actorRole: RoleName;
  presentation?: 'featured' | 'compact';
  onSubmitted?: () => void;
}

/** Shared entry point for reviewing an order from its delivered screen or order history. */
export function OrderReviewAction({
  orderId,
  actorRole,
  presentation = 'featured',
  onSubmitted,
}: OrderReviewActionProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {presentation === 'featured' ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setIsOpen(true);
          }}
          data-testid="rate-order-prompt"
          aria-haspopup="dialog"
          className="group flex w-full items-center gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-left transition-colors hover:bg-amber-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
            <Star className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-extrabold text-ink">
              {actorRole === RoleName.CUSTOMER ? 'How was your order?' : 'How was this delivery?'}
            </span>
            <span className="mt-0.5 block text-xs leading-snug text-ink-2">
              {actorRole === RoleName.CUSTOMER
                ? 'Rate its dishes, the restaurant, or the delivery partner.'
                : actorRole === RoleName.RESTAURANT
                  ? 'Share private feedback about the customer or delivery partner.'
                  : 'Share private feedback about the customer or restaurant.'}
            </span>
          </span>
          <ChevronRight className="h-5 w-5 shrink-0 text-amber-600 transition-transform group-hover:translate-x-0.5 dark:text-amber-400" aria-hidden="true" />
        </button>
      ) : (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setIsOpen(true);
          }}
          data-testid="rate-order-prompt"
          aria-haspopup="dialog"
          className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-600 transition-colors hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-500/20"
        >
          <Star className="h-3 w-3" aria-hidden="true" />
          Leave feedback
        </button>
      )}

      {isOpen && (
        <RateOrderModal
          isOpen
          orderId={orderId}
          actorRole={actorRole}
          onClose={() => setIsOpen(false)}
          onSubmitted={onSubmitted}
        />
      )}
    </>
  );
}
