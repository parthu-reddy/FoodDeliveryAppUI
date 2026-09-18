import { reviewsApi } from '@/lib/zodiosClients';
import { parseApiError } from '@/lib/parseApiError';
import { AlertBanner, Button, ErrorBoundary, Modal, Spinner } from '@shared/ui';
import { Bike, Check, Lock, Star, Store, UtensilsCrossed } from 'lucide-react';
import { useMemo, useState } from 'react';
import { StarRating } from './StarRating';
import { isAlreadyReviewed, reviewRejectionCopy, shortDate } from '../model/reviewCopy';
import { useOrderReviewEligibility } from '../model/useOrderReviewEligibility';
import type { ReviewEntry, ReviewTarget } from '../model/types';

const COMMENT_LIMIT = 1000;

interface RateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  /** Called once a submission succeeds, so the caller can refresh its own view. */
  onSubmitted?: () => void;
}

export default function RateOrderModal(props: RateOrderModalProps) {
  return (
    <ErrorBoundary fallbackLabel="Rate Order">
      {/* Keyed on the order: opening the sheet for a different order remounts it, so the previous
          order's drafts and success state are discarded by React rather than by a reset effect
          that runs a render too late. */}
      <RateOrderModalInner key={props.orderId} {...props} />
    </ErrorBoundary>
  );
}

interface Draft {
  rating: number;
  comment: string;
}

function targetIcon(entityType: ReviewTarget['entityType']) {
  if (entityType === 'RESTAURANT') return <Store className="h-4 w-4" />;
  if (entityType === 'DRIVER') return <Bike className="h-4 w-4" />;
  return <UtensilsCrossed className="h-4 w-4" />;
}

function targetKey(target: ReviewTarget) {
  return `${target.entityType}:${target.entityId}`;
}

/**
 * The rating sheet for one order.
 *
 * Three things this gets deliberately right:
 *
 * 1. **Already-reviewed targets are shown, not hidden.** A review cannot be edited, so the honest
 *    presentation is the statement the customer made, read-only, with the date. Hiding it would
 *    make a submitted review indistinguishable from a broken button.
 * 2. **A refusal is explained.** `reviewable: false` carries a reason, rendered through
 *    `reviewRejectionCopy` — "the review window for this order has closed" rather than an empty
 *    sheet.
 * 3. **A 409 is not an error.** If another tab submitted first, the server says `ALREADY_REVIEWED`;
 *    the sheet refetches and shows the submitted state instead of a red banner.
 */
function RateOrderModalInner({ isOpen, onClose, orderId, onSubmitted }: RateOrderModalProps) {
  const { eligibility, isLoading, error, refetch } = useOrderReviewEligibility(orderId, isOpen);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const pending = useMemo(
    () => eligibility?.targets.filter((t) => !t.alreadyReviewed) ?? [],
    [eligibility],
  );
  const submitted = useMemo(
    () => eligibility?.targets.filter((t) => t.alreadyReviewed) ?? [],
    [eligibility],
  );

  const entries: ReviewEntry[] = pending
    .filter((target) => (drafts[targetKey(target)]?.rating ?? 0) > 0)
    .map((target) => ({
      entityType: target.entityType,
      entityId: target.entityId,
      rating: drafts[targetKey(target)].rating,
      comment: drafts[targetKey(target)].comment.trim() || undefined,
    }));

  const setDraft = (target: ReviewTarget, patch: Partial<Draft>) => {
    const key = targetKey(target);
    setDrafts((prev) => {
      const existing = prev[key] ?? { rating: 0, comment: '' };
      return { ...prev, [key]: { ...existing, ...patch } };
    });
    if (submitError) setSubmitError(null);
  };

  const handleSubmit = async () => {
    if (entries.length === 0) return;
    setStatus('submitting');
    setSubmitError(null);

    try {
      await reviewsApi.review.createReviews({ orderId, entries });
      setStatus('success');
      onSubmitted?.();
    } catch (err: unknown) {
      const parsed = parseApiError(err, 'Could not submit your review.');
      const code = (err as { response?: { data?: { errorCode?: string } } })?.response?.data
        ?.errorCode;

      if (isAlreadyReviewed(code)) {
        // Someone — most likely this customer in another tab — got there first. That is the
        // outcome they wanted, so show it rather than reporting a failure.
        setStatus('idle');
        setDrafts({});
        refetch();
        return;
      }

      setStatus('idle');
      setSubmitError(parsed.message);
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Modal open={isOpen} onClose={handleClose} title="Rate your order" size="lg">
      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {!isLoading && error && (
        <div className="space-y-4 py-2">
          <AlertBanner variant="error">{error}</AlertBanner>
          <Button variant="secondary" fullWidth onClick={refetch}>
            Try again
          </Button>
        </div>
      )}

      {!isLoading && !error && eligibility && !eligibility.reviewable && (
        <div className="flex flex-col items-center px-4 py-10 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-500/10 text-slate-400">
            <Lock className="h-7 w-7" />
          </div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            {reviewRejectionCopy(eligibility.reason)}
          </p>
          <Button variant="secondary" fullWidth className="mt-6" onClick={handleClose}>
            Close
          </Button>
        </div>
      )}

      {!isLoading && !error && status === 'success' && (
        <div className="flex flex-col items-center px-4 py-10 text-center">
          <div className="mb-5 flex h-16 w-16 animate-[bounce_0.5s_ease-out] items-center justify-center rounded-full bg-amber-500 text-white">
            <Check className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-[#f0ede6]">Thanks for that</h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
            Your review is in. Reviews can&apos;t be changed once submitted, so this is final.
          </p>
          <Button variant="primary" fullWidth className="mt-6" onClick={handleClose}>
            Done
          </Button>
        </div>
      )}

      {!isLoading && !error && eligibility?.reviewable && status !== 'success' && (
        <div className="space-y-5">
          {eligibility.windowClosesAt && pending.length > 0 && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              You can review this order until {shortDate(eligibility.windowClosesAt)}. Reviews
              can&apos;t be edited once submitted.
            </p>
          )}

          {submitError && <AlertBanner variant="error">{submitError}</AlertBanner>}

          {pending.map((target) => {
            const key = targetKey(target);
            const draft = drafts[key];
            const rating = draft?.rating ?? 0;
            const comment = draft?.comment ?? '';

            return (
              <div
                key={key}
                className="rounded-2xl border border-white/40 bg-white/20 p-4 backdrop-blur-sm dark:border-white/10 dark:bg-black/10"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2 text-slate-700 dark:text-slate-200">
                    <span className="text-rose-500">{targetIcon(target.entityType)}</span>
                    <span className="truncate text-sm font-bold">{target.displayName}</span>
                  </div>
                  <StarRating
                    value={rating}
                    onChange={(value) => setDraft(target, { rating: value })}
                    size="md"
                    label={target.displayName}
                  />
                </div>

                <div className="mt-3">
                  <textarea
                    value={comment}
                    maxLength={COMMENT_LIMIT}
                    // A comment with no rating cannot be submitted, so the field stays out of the
                    // way until there is something to attach it to.
                    disabled={rating === 0}
                    onChange={(e) => setDraft(target, { comment: e.target.value })}
                    placeholder={
                      rating === 0
                        ? 'Pick a rating first'
                        : `What stood out about ${target.displayName}? (optional)`
                    }
                    rows={2}
                    aria-label={`Comment about ${target.displayName}`}
                    className="w-full resize-none rounded-xl border border-white/50 bg-white/40 p-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-black/20 dark:text-slate-200"
                  />
                  {comment.length > 0 && (
                    <p className="mt-1 text-right text-[10px] tabular-nums text-slate-400">
                      {comment.length}/{COMMENT_LIMIT}
                    </p>
                  )}
                </div>
              </div>
            );
          })}

          {submitted.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                Already reviewed
              </h4>
              {submitted.map((target) => (
                <div
                  key={targetKey(target)}
                  className="rounded-2xl border border-white/30 bg-white/10 p-3 dark:border-white/5 dark:bg-black/5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2 text-slate-500 dark:text-slate-400">
                      <span>{targetIcon(target.entityType)}</span>
                      <span className="truncate text-sm font-semibold">{target.displayName}</span>
                    </div>
                    <StarRating value={target.existingRating ?? 0} size="sm" />
                  </div>
                  {target.existingComment?.trim() && (
                    <p className="mt-1.5 text-xs italic text-slate-500 dark:text-slate-400">
                      &ldquo;{target.existingComment}&rdquo;
                    </p>
                  )}
                  <p className="mt-1 text-[10px] text-slate-400">
                    Submitted {shortDate(target.existingReviewedAt)}
                  </p>
                </div>
              ))}
            </div>
          )}

          {pending.length === 0 ? (
            <Button variant="secondary" fullWidth onClick={handleClose}>
              Close
            </Button>
          ) : (
            <div className="space-y-2.5">
              <Button
                variant="primary"
                fullWidth
                icon={<Star className="h-4 w-4" />}
                loading={status === 'submitting'}
                disabled={entries.length === 0 || status === 'submitting'}
                onClick={handleSubmit}
              >
                {entries.length === 0
                  ? 'Pick a rating to continue'
                  : `Submit ${entries.length} review${entries.length === 1 ? '' : 's'}`}
              </Button>
              <Button variant="ghost" fullWidth onClick={handleClose}>
                Not now
              </Button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
