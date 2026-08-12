import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Visual size variant */
  inputSize?: 'sm' | 'md' | 'lg';
  /** Whether the input has a validation error */
  error?: boolean;
}

const sizeStyles: Record<string, string> = {
  sm: 'px-2.5 py-1.5 text-xs rounded-lg',
  md: 'px-3 py-2.5 text-sm rounded-xl',
  lg: 'px-4 py-3 text-base rounded-xl',
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ inputSize = 'md', error, className = '', ...rest }, ref) => {
    return (
      <input
        ref={ref}
        className={`
          w-full glass-input
          focus:outline-none focus:ring-0
          transition-colors
          ${error ? 'border-red-400 focus:border-red-500' : 'focus:border-white/40'}
          ${sizeStyles[inputSize]}
          ${className}
        `}
        {...rest}
      />
    );
  }
);

Input.displayName = 'Input';
