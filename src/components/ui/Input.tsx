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
          w-full bg-slate-100 dark:bg-slate-800 
          text-slate-800 dark:text-[#f0ede6]
          placeholder:text-slate-400 dark:placeholder:text-slate-500
          border ${error ? 'border-red-400 dark:border-red-500' : 'border-transparent'}
          focus:outline-none focus:ring-2 ${error ? 'focus:ring-red-400' : 'focus:ring-rose-400 dark:focus:ring-rose-500'}
          transition-colors
          ${sizeStyles[inputSize]}
          ${className}
        `}
        {...rest}
      />
    );
  }
);

Input.displayName = 'Input';
