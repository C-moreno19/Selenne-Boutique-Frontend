import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

interface AnimatedHeroBannerProps {
  title: string;
  subtitle?: string;
  backgroundImage?: string;
  backgroundColor?: string;
  primaryButtonLabel?: string;
  secondaryButtonLabel?: string;
  onPrimaryClick?: () => void;
  onSecondaryClick?: () => void;
  showSparkles?: boolean;
  className?: string;
  variant?: 'pink' | 'purple' | 'custom';
}

export const AnimatedHeroBanner: React.FC<AnimatedHeroBannerProps> = ({
  title,
  subtitle,
  backgroundImage,
  backgroundColor = 'from-[#d65391] to-[#f8a9c5]',
  primaryButtonLabel = 'Ver Colección',
  secondaryButtonLabel = 'Más Información',
  onPrimaryClick,
  onSecondaryClick,
  showSparkles = true,
  className = '',
  variant = 'pink',
}) => {
  return (
    <div className={`relative overflow-hidden rounded-2xl ${className}`}>
      {/* Background */}
      <div
        className={`absolute inset-0 bg-gradient-to-r ${backgroundColor}`}
        style={{
          backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
        }}
      >
        {/* Animated Background Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-transparent to-black/20"></div>

        {/* Animated Shapes */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Content */}
      <div className="relative z-10 px-6 sm:px-12 py-16 sm:py-24">
        <div className="max-w-2xl">
          {/* Sparkles Icon */}
          {showSparkles && (
            <div className="flex items-center gap-2 mb-4 animate-bounce">
              <Sparkles className="w-5 h-5 text-white" />
              <span
                style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                className="text-sm font-semibold text-white uppercase tracking-widest"
              >
                Nueva Colección
              </span>
            </div>
          )}

          {/* Title */}
          <h1
            style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight animate-fade-in"
          >
            {title}
          </h1>

          {/* Subtitle */}
          {subtitle && (
            <p
              style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
              className="text-lg sm:text-xl text-white/90 mb-8 leading-relaxed animate-fade-in"
              style={{ animationDelay: '0.2s' }}
            >
              {subtitle}
            </p>
          )}

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            {/* Primary Button */}
            <button
              onClick={onPrimaryClick}
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-white hover:bg-gray-50 text-[#d65391] font-bold rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
            >
              {primaryButtonLabel}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Secondary Button */}
            <button
              onClick={onSecondaryClick}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/20 hover:bg-white/30 text-white font-bold rounded-lg border border-white/30 transition-all duration-300 backdrop-blur-sm"
            >
              {secondaryButtonLabel}
            </button>
          </div>

          {/* Stats or Features */}
          <div className="mt-12 grid grid-cols-3 gap-4 max-w-sm text-white">
            <div className="animate-fade-in" style={{ animationDelay: '0.6s' }}>
              <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-2xl font-bold">
                500+
              </p>
              <p
                style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                className="text-sm text-white/80"
              >
                Productos
              </p>
            </div>

            <div className="animate-fade-in" style={{ animationDelay: '0.7s' }}>
              <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-2xl font-bold">
                100K+
              </p>
              <p
                style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                className="text-sm text-white/80"
              >
                Clientes
              </p>
            </div>

            <div className="animate-fade-in" style={{ animationDelay: '0.8s' }}>
              <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-2xl font-bold">
                4.9⭐
              </p>
              <p
                style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                className="text-sm text-white/80"
              >
                Rating
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
};

export default AnimatedHeroBanner;
