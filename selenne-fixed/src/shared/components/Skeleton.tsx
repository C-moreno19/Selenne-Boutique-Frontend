import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  width = '100%',
  height = '1rem',
}) => {
  const baseClasses = 'bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse';
  
  const variantClasses = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={{
        ...style,
        backgroundSize: '200% 100%',
        animation: 'shimmer 2s infinite',
      }}
    >
      <style>{`
        @keyframes shimmer {
          0% {
            backgroundPosition: -200% 0;
          }
          100% {
            backgroundPosition: 200% 0;
          }
        }
      `}</style>
    </div>
  );
};

interface SkeletonProductCardProps {
  className?: string;
}

export const SkeletonProductCard: React.FC<SkeletonProductCardProps> = ({ className = '' }) => (
  <div className={`bg-white rounded-lg p-4 space-y-4 ${className}`}>
    <Skeleton variant="rectangular" height={200} className="w-full" />
    <Skeleton className="w-3/4 h-6" />
    <Skeleton className="w-1/2 h-4" />
    <div className="flex gap-2">
      <Skeleton className="flex-1 h-8" />
      <Skeleton className="flex-1 h-8" />
    </div>
  </div>
);

interface SkeletonTableRowProps {
  columns?: number;
  className?: string;
}

export const SkeletonTableRow: React.FC<SkeletonTableRowProps> = ({ columns = 5, className = '' }) => (
  <div className={`flex gap-4 py-4 border-b border-gray-100 ${className}`}>
    {Array.from({ length: columns }).map((_, i) => (
      <Skeleton key={i} className="flex-1 h-6" />
    ))}
  </div>
);

interface SkeletonDashboardCardProps {
  className?: string;
}

export const SkeletonDashboardCard: React.FC<SkeletonDashboardCardProps> = ({ className = '' }) => (
  <div className={`bg-white rounded-xl p-6 space-y-4 border border-gray-100 ${className}`}>
    <div className="flex items-center justify-between">
      <Skeleton className="w-24 h-6" />
      <Skeleton variant="circular" width={48} height={48} />
    </div>
    <Skeleton className="w-1/2 h-8" />
    <Skeleton className="w-full h-4" />
  </div>
);

export const SkeletonListItem: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`flex gap-4 py-3 ${className}`}>
    <Skeleton variant="circular" width={40} height={40} className="flex-shrink-0" />
    <div className="flex-1 space-y-2">
      <Skeleton className="w-2/3 h-4" />
      <Skeleton className="w-1/2 h-3" />
    </div>
  </div>
);

export { Skeleton };
export default Skeleton;
