import React from 'react';
import { RotateCcw } from 'lucide-react';
import { motion } from 'motion/react';
import { formatINR } from '@shared/money';
import { useMotionPresets } from '@shared/ui';
import { surfaceStyle } from '@shared/ui/surface/surfaceStyle';
import type { ReorderSuggestion } from '../model/useReorderSuggestions';

/**
 * "Order it again" — the first section of the customer home.
 *
 * `Main.dc.html` puts this ABOVE browse and calls the screen "Home — reorder first". The app
 * opened on a promotional banner instead, and the only way to a past order was Settings →
 * History. This is that data, at the top, one tap from repeating it.
 *
 * Each card is a `<button>`, not a div with an onClick — the Phase 2 gate fails on the latter
 * and a keyboard cannot reach it. `surfaceStyle()` rather than `<Surface>` for exactly that
 * reason: the card must stay a real button while still taking the surface tokens.
 *
 * Renders nothing at all when there is no history. A first-time customer sees discovery
 * first, which is the graceful degradation the plan's open question relies on.
 */

interface ReorderStripProps {
  suggestions: ReorderSuggestion[];
  onReorder: (suggestion: ReorderSuggestion) => void;
}

export function ReorderStrip({ suggestions, onReorder }: ReorderStripProps) {
  const presets = useMotionPresets();
  if (suggestions.length === 0) return null;

  return (
    <motion.section {...presets.rise} aria-labelledby="reorder-heading" className="w-full">
      <h4
        id="reorder-heading"
        className="font-bold text-lg mb-3"
        style={{ color: 'var(--color-ink)' }}
      >
        Order it again
      </h4>

      {/* A horizontal rail on a phone, a grid once there is room. The artboard shows two
          cards side by side at 390px; at desktop widths the same cards fill the row rather
          than leaving the right half of a 1280px column empty. */}
      <div
        className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 lg:grid lg:grid-cols-3 lg:overflow-visible"
        style={{ scrollbarWidth: 'thin' }}
      >
        {suggestions.map((s, i) => (
          <motion.button
            key={s.orderId}
            {...presets.listItem(i)}
            {...presets.press}
            type="button"
            onClick={() => onReorder(s)}
            aria-label={`Order ${s.headline} from ${s.restaurantName} again, ${formatINR(s.total)}`}
            className="shrink-0 w-[248px] lg:w-auto p-3 text-left flex flex-col gap-2 cursor-pointer transition-transform duration-150 hover:-translate-y-0.5"
            style={surfaceStyle({ elevation: 1, radius: 'lg', variant: 'solid' })}
          >
            <span className="flex flex-col gap-0.5 min-w-0">
              <span
                className="text-[14px] font-bold leading-tight truncate"
                style={{ color: 'var(--color-ink)' }}
              >
                {s.headline}
              </span>
              <span className="text-[11px] font-medium truncate" style={{ color: 'var(--color-ink-2)' }}>
                {s.restaurantName}
                {s.ago && ` · ${s.ago}`}
                {s.extraItems > 0 && ` · +${s.extraItems} more`}
              </span>
            </span>

            {/* A span, styled from the surface tokens rather than a <Surface>: a button's
                content model is phrasing content, so the div a Surface renders would be
                invalid inside it. `surfaceStyle()` exists for exactly this. */}
            <span
              className="flex items-center justify-center gap-1.5 py-1.5 px-2 w-full"
              style={surfaceStyle({ elevation: 0, radius: 'md', variant: 'sunken' })}
            >
              <RotateCcw className="w-3.5 h-3.5" style={{ color: 'var(--color-action-ink)' }} aria-hidden="true" />
              <span
                className="font-mono text-[12px] font-bold"
                style={{ color: 'var(--color-action-ink)' }}
              >
                Reorder · {formatINR(s.total)}
              </span>
            </span>
          </motion.button>
        ))}
      </div>
    </motion.section>
  );
}
