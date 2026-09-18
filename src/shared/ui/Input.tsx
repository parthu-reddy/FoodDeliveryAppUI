import React from 'react';

/**
 * Text input, built on the design tokens.
 *
 * Previously carried the `glass-input` class, which put a blurred translucent surface behind
 * every text field in the app. Glass is a layer role for chrome that floats over scrolling
 * content; a form field is content. It is a recessed solid surface now, which is also what
 * makes it read as something you type into.
 */

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Visual size variant. md and lg clear the 44px touch-target floor. */
  inputSize?: 'sm' | 'md' | 'lg';
  /** Whether the input has a validation error */
  error?: boolean;
}

const SIZE: Record<string, React.CSSProperties> = {
  sm: { minHeight: 36, fontSize: 12, padding: '0 10px', borderRadius: 'var(--radius-sm)' },
  md: { minHeight: 44, fontSize: 14, padding: '0 12px', borderRadius: 'var(--radius-md)' },
  lg: { minHeight: 50, fontSize: 15, padding: '0 14px', borderRadius: 'var(--radius-md)' },
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ inputSize = 'md', error, className = '', style, ...rest }, ref) => {
    return (
      <input
        ref={ref}
        aria-invalid={error || undefined}
        className={`w-full focus:outline-none ${className}`}
        style={{
          ...SIZE[inputSize],
          background: 'var(--color-paper-sunken)',
          color: 'var(--color-ink)',
          border: `1px solid ${error ? 'var(--color-danger)' : 'var(--color-paper-line)'}`,
          transitionProperty: 'border-color, box-shadow',
          transitionDuration: 'var(--duration-fast)',
          transitionTimingFunction: 'var(--ease-out)',
          ...style,
        }}
        {...rest}
      />
    );
  }
);

Input.displayName = 'Input';
