import { useEffect, useState } from 'react';
import { customerApi } from '@/lib/zodiosClients';
import type { Order } from '@/types';

/**
 * "Order it again" — the most recent completed order per restaurant.
 *
 * `Main.dc.html` is titled "Home — reorder first" and puts this strip ABOVE browse, because
 * repeat ordering is the dominant path in this category. The data for it already existed and
 * was already being fetched: `getOrderHistory` is called by `CustomerOrderHistory` and by
 * `SettingsHistoryTab`. It was reachable only from Settings, three taps deep, which is the
 * gap between the design and the app rather than a missing capability.
 *
 * README.md records that reorder-first is a design judgement here and not a measured one:
 * there is no production traffic to compute a repeat-order rate from
 * (`tools/repeat_order_rate.sql` is written and waiting). The strip degrades to nothing when
 * a customer has no history, so the cost of being wrong is one absent section.
 *
 * Deduped by RESTAURANT, not by order: five biryanis from the same outlet is one suggestion,
 * not five identical cards.
 */

export interface ReorderSuggestion {
  orderId: string;
  restaurantId: string;
  restaurantName: string;
  /** The item that names the order — the largest line, falling back to the first. */
  headline: string;
  /** How many further items the order had beyond the headline. */
  extraItems: number;
  total: number;
  /** "3 days ago", "last week" — the artboard's phrasing. */
  ago: string;
}

/** Orders that actually completed. A cancelled order is not something to offer again. */
const COMPLETED = new Set(['DELIVERED']);

export function relativeAgo(iso: string, now: number = Date.now()): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return '';
  const days = Math.floor((now - then) / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 14) return 'last week';
  if (days < 61) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

export function toSuggestions(orders: Order[], limit = 6, now: number = Date.now()): ReorderSuggestion[] {
  const newestFirst = [...orders].sort(
    (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
  );

  const seen = new Set<string>();
  const out: ReorderSuggestion[] = [];

  for (const order of newestFirst) {
    if (!COMPLETED.has(String(order.deliveryStatus))) continue;
    const restaurantId = order.restaurantId;
    if (!restaurantId || seen.has(restaurantId)) continue;

    const items = order.items ?? [];
    if (items.length === 0) continue;

    const headline = items.reduce((best, it) => (it.quantity > best.quantity ? it : best), items[0]);

    seen.add(restaurantId);
    out.push({
      orderId: order.id,
      restaurantId,
      restaurantName: order.restaurantName ?? 'Previous order',
      headline: headline.name,
      extraItems: items.length - 1,
      total: order.totalAmount ?? 0,
      ago: relativeAgo(String(order.createdAt ?? ''), now),
    });
    if (out.length >= limit) break;
  }

  return out;
}

export function useReorderSuggestions() {
  const [suggestions, setSuggestions] = useState<ReorderSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    customerApi.order
      .getOrderHistory({ queries: { page: 0 }, signal: controller.signal })
      .then((res) => {
        if (!controller.signal.aborted) {
          setSuggestions(toSuggestions((res?.data?.content ?? []) as Order[]));
        }
      })
      .catch(() => {
        // A customer with no history and a failed call look the same on screen: no strip.
        // This is the one section of the home feed allowed to be absent, so it raises no
        // toast and never blocks the restaurant feed behind it.
        if (!controller.signal.aborted) setSuggestions([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, []);

  return { suggestions, isLoading };
}
