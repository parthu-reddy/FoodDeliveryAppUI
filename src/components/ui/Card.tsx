import React from 'react';

interface CardProps {
  className?: string;
  children: React.ReactNode;
  /** If true, uses the glassmorphism surface styling */
  glass?: boolean;
  /** Border color variant */
  borderColor?: 'rose' | 'slate' | 'none';
  onClick?: () => void;
}

const borderStyles: Record<string, string> = {
  rose: 'border border-rose-500/20 dark:border-rose-500/30',
  slate: 'border border-slate-200 dark:border-slate-800',
  none: '',
};

export function Card({
  className = '',
  children,
  glass = true,
  borderColor = 'rose',
  onClick,
}: CardProps) {
  const Tag = onClick ? 'button' : 'div';

  return (
    <Tag
      onClick={onClick}
      className={`
        ${glass ? 'bg-white/50 dark:bg-slate-900/40 backdrop-blur-md' : 'bg-white dark:bg-slate-900'}
        ${borderStyles[borderColor]}
        rounded-2xl shadow-sm
        ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow text-left w-full' : ''}
        ${className}
      `}
    >
      {children}
    </Tag>
  );
}

// Sub-components for structured cards
Card.Header = function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`px-4 pt-4 pb-2 ${className}`}>
      {children}
    </div>
  );
};

Card.Body = function CardBody({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`px-4 pb-4 ${className}`}>
      {children}
    </div>
  );
};
