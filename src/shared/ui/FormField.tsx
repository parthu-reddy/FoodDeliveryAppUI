import React from 'react';

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}

export function FormField({ label, required, error, hint, className = '', children }: FormFieldProps) {
  return (
    <div className={className}>
      <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1 block tracking-wider">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-[10px] text-red-500 dark:text-red-400 mt-1 font-medium">{error}</p>
      )}
      {hint && !error && (
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{hint}</p>
      )}
    </div>
  );
}
