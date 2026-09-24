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

  if (!imagenesValidas || imagenesValidas.length === 0) {
    return (
      <div className={`bg-[#fdf2f8] dark:bg-[#362b34] flex flex-col items-center justify-center gap-3 ${className}`}>
        <div className="w-20 h-20 rounded-full bg-pink-100 dark:bg-[#3a2530] flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-[#A3395C] opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-sm text-pink-300 dark:text-[#b8a3ac] font-medium tracking-wide">Imagen no disponible</p>
      </div>
    );
  }

  const hayVarias = imagenesValidas.length > 1;

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

  const onThumbError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80x80?text=No+Img';
  };

  return (
    <div className={`flex flex-col sm:flex-row gap-2 sm:gap-3 ${className}`}>
      {/* Riel de miniaturas — vertical en desktop */}
      {hayVarias && (
        <div className="hidden sm:flex flex-col gap-2 w-[68px] flex-shrink-0 overflow-y-auto">
          {imagenesValidas.map((img, idx) => (
            <button
              type="button"
              key={idx}
              onClick={() => setImagenActual(idx)}
              className={`w-[68px] h-[68px] rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${
                idx === imagenActual ? 'border-[#A3395C]' : 'border-transparent opacity-60 hover:opacity-100'
              }`}
              aria-label={`Ver imagen ${idx + 1}`}
              title={`Imagen ${idx + 1}`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" onError={onThumbError} />
            </button>
          ))}
        </div>
      )}

      {/* Imagen principal */}
      <div className="relative flex-1 min-w-0 bg-[#fafafa] dark:bg-[#2a2029] overflow-hidden">
        <img
          key={imagenesValidas[imagenActual]}
          src={imagenesValidas[imagenActual]}
          alt={`${nombre} - Imagen ${imagenActual + 1}`}
          className="w-full h-full object-contain"
          loading="eager"
          decoding="async"
          onError={(e) => {
            console.warn(`Error cargando imagen: ${imagenesValidas[imagenActual]}`);
            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x400?text=Imagen+No+Disponible';
          }}
        />

        {hayVarias && (
          <>
            <button type="button"
              onClick={irAnterior}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-[#322631]/90 text-[#241B22] dark:text-[#F5EDE9] p-1.5 rounded-full hover:bg-white dark:hover:bg-[#322631] transition-colors shadow-md"
              aria-label="Imagen anterior"
              title="Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button type="button"
              onClick={irSiguiente}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-[#322631]/90 text-[#241B22] dark:text-[#F5EDE9] p-1.5 rounded-full hover:bg-white dark:hover:bg-[#322631] transition-colors shadow-md"
              aria-label="Imagen siguiente"
              title="Siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <div className="absolute top-2.5 right-2.5 bg-[#241B22]/70 text-white px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide">
              {imagenActual + 1} / {imagenesValidas.length}
            </div>
          </>
        )}
      </div>

      {/* Miniaturas — fila horizontal en mobile */}
      {hayVarias && (
        <div className="flex sm:hidden gap-2 overflow-x-auto px-3 pb-2">
          {imagenesValidas.map((img, idx) => (
            <button
              type="button"
              key={idx}
              onClick={() => setImagenActual(idx)}
              className={`w-14 h-14 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${
                idx === imagenActual ? 'border-[#A3395C]' : 'border-transparent opacity-60'
              }`}
              aria-label={`Ver imagen ${idx + 1}`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" onError={onThumbError} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageCarousel;
