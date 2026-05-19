import React from 'react';
import { AlertTriangle, Phone, Mail, RefreshCw } from 'lucide-react';

interface ServerErrorPageProps {
  onRetry?: () => void;
  showSupportInfo?: boolean;
}

export const ServerErrorPage: React.FC<ServerErrorPageProps> = ({
  onRetry,
  showSupportInfo = true,
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-red-50 to-white flex flex-col items-center justify-center px-4 py-8">
      {/* Animated Background Elements */}
      <div className="absolute top-10 right-10 w-72 h-72 bg-red-500 rounded-full mix-blend-multiply filter blur-3xl opacity-5 animate-pulse"></div>
      <div className="absolute bottom-10 left-10 w-72 h-72 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl opacity-5 animate-pulse"></div>

      <div className="relative z-10 text-center max-w-md">
        {/* Error Code */}
        <div className="mb-8">
          <div className="text-9xl font-bold text-red-500 mb-2 animate-pulse">
            500
          </div>
          <p
            style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
            className="text-gray-500 text-sm uppercase tracking-widest"
          >
            Error del servidor
          </p>
        </div>

        {/* Icon */}
        <div className="mb-8 flex justify-center">
          <div className="relative animate-bounce">
            <div className="absolute inset-0 bg-red-500 rounded-full opacity-20 blur-xl"></div>
            <AlertTriangle className="w-16 h-16 text-red-500 relative z-10" />
          </div>
        </div>

        {/* Main Message */}
        <h1
          style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
          className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
        >
          Algo salió mal
        </h1>

        <p
          style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
          className="text-gray-600 mb-8 leading-relaxed"
        >
          Nuestros servidores están experimentando dificultades. Estamos trabajando para solucionarlo lo antes posible.
        </p>

        {/* Retry Button */}
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 hover:shadow-lg text-white font-medium rounded-lg transition-all duration-300 transform hover:scale-105 mb-6 w-full"
          >
            <RefreshCw className="w-5 h-5" />
            Reintentar
          </button>
        )}

        {/* Support Info */}
        {showSupportInfo && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h3
              style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
              className="font-semibold text-blue-900 mb-4"
            >
              Necesitas ayuda?
            </h3>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-gray-700">
                  +57 (601) 234-5678
                </span>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <a
                  href="mailto:soporte@selenneboutique.com"
                  style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                  className="text-blue-600 hover:text-blue-700 underline"
                >
                  soporte@selenneboutique.com
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Status Info */}
        <div
          style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
          className="bg-gray-100 rounded-lg p-4 mb-8"
        >
          <p className="text-xs text-gray-600 mb-2">
            <strong>Estado:</strong> Monitoreo activo en curso
          </p>
          <div className="flex gap-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 bg-green-500 rounded-full animate-pulse"
                style={{ animationDelay: `${i * 0.3}s` }}
              ></div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
          className="text-xs text-gray-500"
        >
          <p>Referencia: {new Date().toISOString()}</p>
          <p>Selenne Boutique Authentication UI</p>
        </div>
      </div>
    </div>
  );
};

export default ServerErrorPage;
