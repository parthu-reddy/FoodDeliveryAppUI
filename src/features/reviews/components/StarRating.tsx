import { Star } from 'lucide-react';
import { useId, useState } from 'react';

export type StarRatingSize = 'sm' | 'md' | 'lg';

interface StarRatingProps {
  /** 0–5. Fractional values render a partial star; only meaningful when read-only. */
  value: number;
  /** Omit to render read-only. Supplying it makes the control interactive. */
  onChange?: (value: number) => void;
  size?: StarRatingSize;
  /** What is being rated, e.g. "Bombay Canteen". Read out by assistive technology. */
  label?: string;
  className?: string;
}

const SIZE_CLASSES: Record<StarRatingSize, string> = {
  sm: 'w-3.5 h-3.5',
  md: 'w-5 h-5',
  lg: 'w-8 h-8',
};

const GAP_CLASSES: Record<StarRatingSize, string> = {
  sm: 'gap-0.5',
  md: 'gap-1',
  lg: 'gap-1.5',
};

const VALUES = [1, 2, 3, 4, 5];

/**
 * The one star control in the app.
 *
 * Read-only and interactive are the same component deliberately: a customer who rates four stars in
 * the submit sheet and then sees the review listed should be looking at the same object, not at two
 * implementations that drifted apart.
 *
 * Keyboard: arrow keys step the value, 1–5 set it directly, Home/End jump to the ends. The stars
 * form a radiogroup rather than five buttons, so a screen reader announces "3 of 5 stars, selected"
 * instead of reading five unlabelled controls.
 */
export function StarRating({
  value,
  onChange,
  size = 'md',
  label,
  className = '',
}: StarRatingProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const groupId = useId();
  const interactive = typeof onChange === 'function';

  // While hovering or arrowing, preview that value without committing it.
  const shown = interactive && hovered !== null ? hovered : value;

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!interactive) return;

    const current = Math.round(value) || 0;
    let next: number | null = null;

    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') next = Math.min(5, current + 1);
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') next = Math.max(1, current - 1);
    else if (event.key === 'Home') next = 1;
    else if (event.key === 'End') next = 5;
    else if (/^[1-5]$/.test(event.key)) next = Number(event.key);

    if (next !== null) {
      event.preventDefault();
      onChange?.(next);
    }
  };

  return (
    <div
      role={interactive ? 'radiogroup' : 'img'}
      aria-label={
        interactive
          ? `Rate ${label ?? 'this'} out of 5 stars`
          : `${value.toFixed(1)} out of 5 stars${label ? ` for ${label}` : ''}`
      }
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={handleKeyDown}
      onMouseLeave={() => setHovered(null)}
      className={`inline-flex items-center ${GAP_CLASSES[size]} ${
        interactive ? 'cursor-pointer rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent' : ''
      } ${className}`}
    >
      {VALUES.map((star) => {
        // Fill fraction for this star: 1 when fully earned, 0 when not, partial in between.
        const fill = Math.max(0, Math.min(1, shown - (star - 1)));
        const selected = Math.round(value) === star;

        const starGlyph = (
          <span className="relative inline-block" aria-hidden="true">
            <Star className={`${SIZE_CLASSES[size]} text-slate-300 dark:text-slate-600`} />
            {fill > 0 && (
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fill * 100}%` }}
              >
                <Star className={`${SIZE_CLASSES[size]} text-amber-400 fill-amber-400`} />
              </span>
            )}
          </span>
        );

        if (!interactive) {
          return <span key={star}>{starGlyph}</span>;
        }

        return (
          <span
            key={star}
            id={`${groupId}-${star}`}
            role="radio"
            aria-checked={selected}
            aria-label={`${star} star${star === 1 ? '' : 's'}`}
            // The group owns focus and the keyboard handler; individual stars are click targets
            // only, so Tab moves past the whole control rather than through five stops.
            tabIndex={-1}
            onClick={() => onChange?.(star)}
            onMouseEnter={() => setHovered(star)}
            className="transition-transform hover:scale-110 active:scale-95"
          >
            {starGlyph}
          </span>
        );
      })}
    </div>
  );
}

export default StarRating;
