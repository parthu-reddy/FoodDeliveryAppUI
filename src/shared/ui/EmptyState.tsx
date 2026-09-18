import React from 'react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, description, icon, action }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center h-full min-h-[300px]">
      {icon && (
        <div className="mb-4 text-slate-400">
          {icon}
        </div>
      )}
      <h3 className="text-xl font-semibold text-slate-800 mb-2">{title}</h3>
      <p className="text-slate-500 max-w-sm mb-6">{description}</p>
      {action && (
        <div className="mt-2">
          {action}
        </div>
      )}
    </div>
  );
};
