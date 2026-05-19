import React from 'react';
import { ChevronRight, Home, Search, Package } from 'lucide-react';

interface NotFoundPageProps {
  onNavigateHome?: () => void;
  showLogo?: boolean;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({
  onNavigateHome,
  showLogo = true,
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-white flex flex-col items-center justify-center px-4 py-8">
      {/* Animated Background Elements */}
      <div className="absolute top-10 right-10 w-72 h-72 bg-[#d65391] rounded-full mix-blend-multiply filter blur-3xl opacity-5 animate-pulse"></div>
      <div className="absolute bottom-10 left-10 w-72 h-72 bg-[#f8a9c5] rounded-full mix-blend-multiply filter blur-3xl opacity-5 animate-pulse"></div>

      <div className="relative z-10 text-center max-w-md">
        {/* 404 Display with Animation */}
        <div className="mb-8">
          <div className="text-9xl font-bold bg-gradient-to-r from-[#d65391] to-[#f8a9c5] bg-clip-text text-transparent mb-2 animate-bounce">
            404
          </div>
          <p
            style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
            className="text-gray-500 text-sm uppercase tracking-widest"
          >
            Página no encontrada
          </p>
        </div>

        {/* Icon */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-[#d65391] rounded-full opacity-10 blur-xl animate-pulse"></div>
            <Package className="w-16 h-16 text-[#d65391] relative z-10" />
          </div>
        </div>

        {/* Main Message */}
        <h1
          style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
          className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
        >
          Oops, parece que algo falló
        </h1>

        <p
          style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
          className="text-gray-600 mb-8 leading-relaxed"
        >
          La página que buscas no existe o ha sido movida. Explora nuestras colecciones o regresa al inicio.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <button
            onClick={onNavigateHome}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#d65391] to-[#f8a9c5] hover:shadow-lg text-white font-medium rounded-lg transition-all duration-300 transform hover:scale-105"
          >
            <Home className="w-5 h-5" />
            Ir al inicio
          </button>

          <button
            onClick={() => {
              const search = prompt('¿Qué estás buscando?');
              if (search && onNavigateHome) {
                // Aquí podrías agregar lógica de búsqueda
                console.log('Buscando:', search);
              }
            }}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-gray-900 font-medium rounded-lg border border-gray-200 transition-all duration-300"
          >
            <Search className="w-5 h-5" />
            Buscar
          </button>
        </div>

        {/* Quick Links */}
        <div className="space-y-2 text-sm">
          <p
            style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
            className="text-gray-500 mb-3"
          >
            Navegación rápida:
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={onNavigateHome}
              className="text-[#d65391] hover:text-[#c1427e] font-medium transition-colors inline-flex items-center justify-center gap-1"
            >
              <ChevronRight className="w-4 h-4" />
              Catálogo de productos
            </button>
            <button
              onClick={onNavigateHome}
              className="text-[#d65391] hover:text-[#c1427e] font-medium transition-colors inline-flex items-center justify-center gap-1"
            >
              <ChevronRight className="w-4 h-4" />
              Ofertas y promociones
            </button>
            <button
              onClick={onNavigateHome}
              className="text-[#d65391] hover:text-[#c1427e] font-medium transition-colors inline-flex items-center justify-center gap-1"
            >
              <ChevronRight className="w-4 h-4" />
              Contactar soporte
            </button>
          </div>
        </div>

        {/* Footer Info */}
        <div
          style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
          className="mt-12 pt-8 border-t border-gray-200 text-xs text-gray-500"
        >
          <p>Código de error: 404 | Selenne Boutique Authentication UI</p>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
