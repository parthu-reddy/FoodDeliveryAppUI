import { Search, X } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  /** Show a clear button when there is text */
  clearable?: boolean;
  inputSize?: 'sm' | 'md';
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
  clearable = true,
  inputSize = 'md',
}: SearchInputProps) {
  const sizeClasses = inputSize === 'sm'
    ? 'pl-8 pr-3 py-1.5 text-xs'
    : 'pl-10 pr-4 py-2.5 text-sm';

  const iconSizeClasses = inputSize === 'sm'
    ? 'left-2 w-3.5 h-3.5'
    : 'left-3 w-4.5 h-4.5';

  return (
    <div className={`relative ${className}`}>
      <Search
        className={`absolute top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none ${iconSizeClasses}`}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`
          w-full bg-slate-100 dark:bg-slate-800
          text-slate-800 dark:text-[#f0ede6]
          placeholder:text-slate-400 dark:placeholder:text-slate-500
          border-none rounded-xl
          focus:outline-none focus:ring-2 focus:ring-rose-400 dark:focus:ring-rose-500
          transition-colors
          ${sizeClasses}
        `}
      />
      {clearable && value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
        >
          <X className="w-3 h-3 text-slate-400" />
        </button>
      )}
    </div>
  );
}
