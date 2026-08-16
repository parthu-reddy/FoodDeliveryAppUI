import React from 'react';

interface SkeletonProps {
  className?: string;
}

/** Generic skeleton placeholder — apply your own sizing via className */
export const Skeleton = ({ className = '' }: SkeletonProps) => {
  return (
    <div className={`animate-pulse bg-slate-200 dark:bg-slate-700 rounded ${className}`}></div>
  );
};

/** Full-page loading skeleton with a title bar and 3 card placeholders */
export const LoadingSkeleton: React.FC = () => {
  return (
    <div className="p-5 space-y-4 animate-pulse">
      <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl w-1/3"></div>
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl w-full"></div>
        ))}
      </div>
    </div>
  );
};

/** Skeleton shaped like a restaurant card (image + text rows) */
export const RestaurantCardSkeleton = () => {
  return (
    <div className="flex flex-col rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white/10 shadow-sm">
      <Skeleton className="h-44 w-full" />
      <div className="p-4.5 space-y-2">
        <div className="flex justify-between items-center">
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-5 w-12" />
        </div>
        <Skeleton className="h-4 w-3/4" />
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
  );
};

/** Skeleton for a horizontal category pill strip */
export const MenuCategorySkeleton = () => {
  return (
    <div className="flex gap-2 overflow-hidden py-2">
      <Skeleton className="h-10 w-24 rounded-xl" />
      <Skeleton className="h-10 w-24 rounded-xl" />
      <Skeleton className="h-10 w-24 rounded-xl" />
      <Skeleton className="h-10 w-24 rounded-xl" />
    </div>
  );
};
