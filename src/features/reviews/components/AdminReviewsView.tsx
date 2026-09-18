import { reviewsApi } from '@/lib/zodiosClients';
import { parseApiError } from '@/lib/parseApiError';
import { AlertBanner, Button, EmptyState, Input, Select, Spinner } from '@shared/ui';
import { Search, ShieldAlert } from 'lucide-react';
import { useState } from 'react';
import { StarRating } from './StarRating';
import { shortDate } from '../model/reviewCopy';
import type { ReviewDetail, ReviewEntityType } from '../model/types';

type Mode = 'entity' | 'user';

/**
 * Moderation. The unredacted view, and the only one.
 *
 * Every other surface withholds who wrote a review — deliberately, and for the driver especially.
 * Investigating a complaint or a review-bombing pattern is the one job that cannot be done without
 * the author and the order, so this screen exists and nothing else shows them.
 *
 * Read-only on purpose. There is no hide, no delete: a review is immutable, and an administrator
 * being able to quietly remove an inconvenient one is a different product with a different audit
 * story. When that is wanted it should arrive as an explicit, logged action.
 */
export function AdminReviewsView() {
  const [mode, setMode] = useState<Mode>('entity');
  const [entityType, setEntityType] = useState<ReviewEntityType>('RESTAURANT');
  const [entityId, setEntityId] = useState('');
  const [userId, setUserId] = useState('');

  const [reviews, setReviews] = useState<ReviewDetail[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSearch = mode === 'entity' ? entityId.trim().length > 0 : userId.trim().length > 0;

  const search = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res =
        mode === 'entity'
          ? await reviewsApi.adminReview.getReviewsForEntity({
              queries: { entityType, entityId: entityId.trim(), page: 0, size: 50 },
            })
          : await reviewsApi.adminReview.getReviewsByUser({
              params: { userId: userId.trim() },
              queries: { page: 0, size: 50 },
            });
      const content = (res.data?.content ?? []) as ReviewDetail[];
      setReviews(content);
    } catch (err: unknown) {
      setError(parseApiError(err, 'Could not load reviews.').message);
      setReviews(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <header className="mb-5">
        <h2 className="flex items-center gap-2 text-xl font-black text-slate-800 dark:text-[#f0ede6]">
          <ShieldAlert className="h-5 w-5 text-rose-500" />
          Review Moderation
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Unredacted. Reviews cannot be edited or removed — this is for investigation.
        </p>
      </header>

      <div className="mb-5 flex flex-wrap items-end gap-3">
        <div className="w-44">
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Look up by
          </label>
          <Select
            aria-label="Look up by"
            value={mode}
            onChange={(value) => setMode(value as Mode)}
            options={[
              { value: 'entity', label: 'Entity' },
              { value: 'user', label: 'Author' },
            ]}
          />
        </div>

        {mode === 'entity' ? (
          <>
            <div className="w-44">
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Type
              </label>
              <Select
                aria-label="Entity type"
                value={entityType}
                onChange={(value) => setEntityType(value as ReviewEntityType)}
                options={[
                  { value: 'RESTAURANT', label: 'Restaurant' },
                  { value: 'DRIVER', label: 'Driver' },
                  { value: 'PRODUCT', label: 'Product' },
                ]}
              />
            </div>
            <div className="min-w-[280px] flex-1">
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Entity ID
              </label>
              <Input
                aria-label="Entity ID"
                value={entityId}
                onChange={(e) => setEntityId(e.target.value)}
                placeholder="outlet, driver or menu-item id"
              />
            </div>
          </>
        ) : (
          <div className="min-w-[280px] flex-1">
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Author user ID
            </label>
            <Input
              aria-label="Author user ID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="customer id — shows everything this account has written"
            />
          </div>
        )}

        <Button
          variant="primary"
          icon={<Search className="h-4 w-4" />}
          loading={isLoading}
          disabled={!canSearch || isLoading}
          onClick={search}
        >
          Search
        </Button>
      </div>

      {error && <AlertBanner variant="error" className="mb-4">{error}</AlertBanner>}

      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {!isLoading && reviews?.length === 0 && (
        <EmptyState
          title="No reviews found"
          description="Nothing has been written about that entity, or by that account."
          icon={<ShieldAlert className="h-10 w-10" />}
        />
      )}

      {!isLoading && reviews && reviews.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {reviews.length} review{reviews.length === 1 ? '' : 's'}
          </p>
          {reviews.map((review) => (
            <article
              key={review.id}
              className="rounded-2xl border border-white/40 bg-white/20 p-4 backdrop-blur-sm dark:border-white/10 dark:bg-black/10"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <StarRating value={review.rating} size="sm" />
                <time className="text-[10px] text-slate-400">{shortDate(review.createdAt)}</time>
              </div>

              {review.comment?.trim() && (
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">
                  {review.comment}
                </p>
              )}

              {/* The whole reason this screen exists: author and order, on the record. */}
              <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1 border-t border-white/30 pt-2 font-mono text-[10px] text-slate-500 dark:border-white/10 dark:text-slate-400 sm:grid-cols-2">
                <div className="flex gap-2">
                  <dt className="font-bold">author</dt>
                  <dd className="truncate">{review.authorDisplayName || '—'} · {review.userId}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="font-bold">order</dt>
                  <dd className="truncate">{review.orderId}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="font-bold">target</dt>
                  <dd className="truncate">{review.entityType} · {review.entityId}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="font-bold">review</dt>
                  <dd className="truncate">{review.id}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminReviewsView;
