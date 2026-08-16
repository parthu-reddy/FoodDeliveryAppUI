import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'panel' | 'card';
  className?: string;
}

export function GlassCard({ children, variant = 'card', className = '', ...props }: GlassCardProps) {
  const baseClass = variant === 'panel' ? 'glass-panel' : 'glass-card';
  
  return (
    <div className={`${baseClass} rounded-2xl ${className}`} {...props}>
      {children}
    </div>
  );
}
