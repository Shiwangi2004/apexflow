import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div
      className={`animate-pulse bg-steel/30 rounded-[2px] border border-steel/40 ${className}`}
    />
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="p-5 bg-graphite border border-steel chamfer-box panel-ticks space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-12" />
      </div>
      <Skeleton className="h-8 w-36" />
      <div className="space-y-2 pt-2 border-t border-steel/40">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>
    </div>
  );
};

export const GaugeSkeleton: React.FC = () => {
  return (
    <div className="p-4 bg-graphite border border-steel chamfer-box flex flex-col items-center justify-center space-y-3">
      <Skeleton className="h-3 w-28" />
      <div className="w-40 h-28 rounded-t-full border-2 border-dashed border-steel/50 flex items-center justify-center animate-pulse" />
      <Skeleton className="h-6 w-20" />
    </div>
  );
};
