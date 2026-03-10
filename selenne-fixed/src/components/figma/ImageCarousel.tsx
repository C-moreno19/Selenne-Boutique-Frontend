import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageCarouselProps {
  imagenes: string[];
  nombre: string;
  className?: string;
}

export const ImageCarousel: React.FC<ImageCarouselProps> = ({
  imagenes,
  nombre,
  className = '',
}) => {
  const [imagenActual, setImagenActual] = useState(0);

  // Filtrar imágenes vacías
  const imagenesValidas = (imagenes || []).filter(img => img && img.trim() !== '');

  // Si no hay imágenes, mostrar una imagen por defecto
  if (!imagenesValidas || imagenesValidas.length === 0) {
    return (
      <div className={`bg-gray-200 flex items-center justify-center ${className}`}>
        <span className="text-gray-500">Sin imagen</span>
      </div>
    );
  }

  const irAnterior = () => {
    setImagenActual((prev) =>
      prev === 0 ? imagenesValidas.length - 1 : prev - 1
    );
  };

  const irSiguiente = () => {
    setImagenActual((prev) =>
      prev === imagenesValidas.length - 1 ? 0 : prev + 1
    );
  };

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Imagen principal */}
      <img
        src={imagenesValidas[imagenActual]}
        alt={`${nombre} - Imagen ${imagenActual + 1}`}
        className="w-full h-full object-cover"
        onError={(e) => {
          console.warn(`Error cargando imagen: ${imagenesValidas[imagenActual]}`);
          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x400?text=Imagen+No+Disponible';
        }}
      />

      {/* Botones de navegación - Siempre visibles si hay múltiples imágenes */}
      {imagenesValidas.length > 1 && (
        <>
          <button
            onClick={irAnterior}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-white text-black p-2 rounded-full hover:bg-gray-200 transition-colors z-20 shadow-lg"
            aria-label="Imagen anterior"
            title="Anterior"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={irSiguiente}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-white text-black p-2 rounded-full hover:bg-gray-200 transition-colors z-20 shadow-lg"
            aria-label="Imagen siguiente"
            title="Siguiente"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Indicadores de imagen - Puntos */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
            {imagenesValidas.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setImagenActual(idx)}
                className={`rounded-full transition-all ${
                  idx === imagenActual
                    ? 'bg-white w-3 h-3'
                    : 'bg-white/60 w-2 h-2 hover:bg-white/85'
                }`}
                aria-label={`Ver imagen ${idx + 1}`}
                title={`Imagen ${idx + 1}`}
              />
            ))}
          </div>

          {/* Contador de imágenes */}
          <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-2 rounded text-sm font-medium z-20 shadow-lg">
            {imagenActual + 1} / {imagenesValidas.length}
          </div>

          {/* Thumbnails debajo (opcional) */}
          <div className="absolute -bottom-20 left-0 right-0 flex gap-2 justify-center px-2">
            {imagenesValidas.slice(0, 5).map((img, idx) => (
              <button
                key={idx}
                onClick={() => setImagenActual(idx)}
                className={`w-12 h-12 rounded border-2 overflow-hidden transition-all ${
                  idx === imagenActual
                    ? 'border-[#d65391] scale-105'
                    : 'border-gray-300 hover:border-gray-400 opacity-70 hover:opacity-100'
                }`}
                title={`Ir a imagen ${idx + 1}`}
              >
                <img
                  src={img}
                  alt={`Thumb ${idx + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/50x50?text=No+Img';
                  }}
                />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ImageCarousel;
