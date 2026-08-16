import React from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  selectSize?: 'sm' | 'md' | 'lg';
  error?: boolean;
}

const sizeStyles: Record<string, string> = {
  sm: 'px-2.5 py-1.5 text-xs rounded-lg',
  md: 'px-3 py-2.5 text-sm rounded-xl',
  lg: 'px-4 py-3 text-base rounded-xl',
};

export function Select({
  options,
  onChange,
  placeholder,
  selectSize = 'md',
  error,
  className = '',
  value,
  ...rest
}: SelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`
        w-full bg-slate-100 dark:bg-slate-800
        text-slate-800 dark:text-[#f0ede6]
        border ${error ? 'border-red-400 dark:border-red-500' : 'border-transparent'}
        focus:outline-none focus:ring-2 ${error ? 'focus:ring-red-400' : 'focus:ring-rose-400 dark:focus:ring-rose-500'}
        transition-colors appearance-none cursor-pointer
        ${sizeStyles[selectSize]}
        ${className}
      `}
      {...rest}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
