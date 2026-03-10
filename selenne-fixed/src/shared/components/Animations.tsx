import React from 'react';

interface PageTransitionProps {
  children: React.ReactNode;
  type?: 'fade' | 'slideUp' | 'slideRight' | 'slideLeft' | 'scaleUp' | 'none';
  duration?: number;
  delay?: number;
  className?: string;
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  type = 'fade',
  duration = 300,
  delay = 0,
  className = '',
}) => {
  const animations = {
    fade: 'animate-fade-in',
    slideUp: 'animate-slide-up',
    slideRight: 'animate-slide-right',
    slideLeft: 'animate-slide-left',
    scaleUp: 'animate-scale-up',
    none: '',
  };

  return (
    <div
      className={`${animations[type]} ${className}`}
      style={{
        animationDuration: `${duration}ms`,
        animationDelay: `${delay}ms`,
      }}
    >
      {children}

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-right {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slide-left {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes scale-up {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fade-in {
          animation: fade-in forwards;
        }

        .animate-slide-up {
          animation: slide-up forwards;
        }

        .animate-slide-right {
          animation: slide-right forwards;
        }

        .animate-slide-left {
          animation: slide-left forwards;
        }

        .animate-scale-up {
          animation: scale-up forwards;
        }
      `}</style>
    </div>
  );
};

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

export const FadeIn: React.FC<FadeInProps> = ({
  children,
  delay = 0,
  duration = 500,
  className = '',
}) => {
  return (
    <div
      className={`animate-fade-in ${className}`}
      style={{
        animationDuration: `${duration}ms`,
        animationDelay: `${delay}ms`,
        opacity: 0,
        animation: `fade-in ${duration}ms ease-out ${delay}ms forwards`,
      }}
    >
      {children}

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

interface SlideInProps {
  children: React.ReactNode;
  direction?: 'left' | 'right' | 'up' | 'down';
  delay?: number;
  duration?: number;
  className?: string;
}

export const SlideIn: React.FC<SlideInProps> = ({
  children,
  direction = 'up',
  delay = 0,
  duration = 500,
  className = '',
}) => {
  const directionMap = {
    left: 'slideFromLeft',
    right: 'slideFromRight',
    up: 'slideFromBottom',
    down: 'slideFromTop',
  };

  return (
    <div
      className={className}
      style={{
        animation: `${directionMap[direction]} ${duration}ms ease-out ${delay}ms forwards`,
        opacity: 0,
      }}
    >
      {children}

      <style>{`
        @keyframes slideFromLeft {
          from {
            opacity: 0;
            transform: translateX(-100px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideFromRight {
          from {
            opacity: 0;
            transform: translateX(100px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideFromTop {
          from {
            opacity: 0;
            transform: translateY(-100px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideFromBottom {
          from {
            opacity: 0;
            transform: translateY(100px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

interface HoverScaleProps {
  children: React.ReactNode;
  scale?: number;
  className?: string;
}

export const HoverScale: React.FC<HoverScaleProps> = ({
  children,
  scale = 1.05,
  className = '',
}) => {
  return (
    <div
      className={`transition-transform duration-300 hover:scale-${Math.round(
        scale * 100
      )} ${className}`}
      style={{
        '--tw-scale-x': scale,
        '--tw-scale-y': scale,
      } as React.CSSProperties & { '--tw-scale-x': number; '--tw-scale-y': number }}
    >
      {children}

      <style>{`
        .hover\\:scale-${Math.round(scale * 100)}:hover {
          transform: scale(${scale});
        }
      `}</style>
    </div>
  );
};

export default {
  PageTransition,
  FadeIn,
  SlideIn,
  HoverScale,
};
