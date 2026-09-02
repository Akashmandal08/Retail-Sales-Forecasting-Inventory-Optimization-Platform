import React from 'react';

export const Skeleton = ({ className = '', variant = 'rect' }) => {
  const variantClasses = {
    rect: 'rounded-lg',
    circle: 'rounded-full',
    text: 'rounded h-4',
  };

  return (
    <div
      className={`bg-slate-700/60 dark:bg-slate-700/60 light:bg-slate-200 animate-pulse ${variantClasses[variant]} ${className}`}
    />
  );
};

export const ChartSkeleton = ({ height = 300 }) => {
  return (
    <div
      style={{ height }}
      className="w-full bg-slate-800/40 border border-slate-700/30 rounded-xl p-6 flex flex-col justify-between animate-pulse"
    >
      <div className="flex items-center justify-between">
        <Skeleton className="w-32 h-5" />
        <Skeleton className="w-20 h-4" />
      </div>
      <div className="flex items-end justify-between space-x-2 h-4/6 px-4">
        {[40, 65, 30, 80, 55, 90, 45, 70, 85, 60, 75, 50].map((h, i) => (
          <div
            key={i}
            style={{ height: `${h}%` }}
            className="w-full bg-slate-700/40 rounded-t"
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="w-16 h-3" />
        <Skeleton className="w-16 h-3" />
        <Skeleton className="w-16 h-3" />
        <Skeleton className="w-16 h-3" />
      </div>
    </div>
  );
};

export default Skeleton;
