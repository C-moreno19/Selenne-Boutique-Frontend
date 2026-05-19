import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  fullScreen?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  message = 'Cargando...',
  fullScreen = false,
  className = '',
}) => {
  const containerClasses = fullScreen
    ? 'fixed inset-0 flex items-center justify-center bg-white bg-opacity-95 z-50'
    : 'flex items-center justify-center py-8';

  return (
    <div className={`${containerClasses} ${className}`}>
      <div className="flex flex-col items-center gap-4">
        {/* Custom spinner with Selenne brand colors */}
        <div className={`${sizeClasses[size]} relative`}>
          <div className="absolute inset-0 bg-gradient-to-r from-[#d65391] to-[#f8a9c5] rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
          <div
            className="absolute inset-0 border-4 border-transparent border-t-[#d65391] rounded-full animate-spin"
            style={{
              animation: 'spin 1s linear infinite',
            }}
          ></div>

          <style>{`
            @keyframes spin {
              to {
                transform: rotate(360deg);
              }
            }
          `}</style>
        </div>

        {message && (
          <p
            style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
            className="text-gray-600 text-sm font-medium"
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default LoadingSpinner;
