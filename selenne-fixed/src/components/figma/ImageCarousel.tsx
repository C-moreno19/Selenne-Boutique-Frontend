import React, { useState, useRef } from 'react';
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
  const [fitMode, setFitMode] = useState<'cover' | 'contain'>('cover');
  const containerRef = useRef<HTMLDivElement>(null);

  // Si la proporcion de la foto se aleja mucho de la del marco, se muestra completa (contain)
  // en vez de recortada (cover), para no cortar partes importantes del producto.
  const handleImgLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const container = containerRef.current;
    if (!container || !img.naturalWidth || !img.naturalHeight || !container.clientHeight) return;
    const ratioContenedor = container.clientWidth / container.clientHeight;
    const ratioImagen = img.naturalWidth / img.naturalHeight;
    const diferencia = Math.abs(ratioContenedor - ratioImagen) / ratioContenedor;
    setFitMode(diferencia > 0.3 ? 'contain' : 'cover');
  };

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
    <div ref={containerRef} className={`relative w-full h-full bg-[#fafafa] dark:bg-[#2a2029] ${className}`}>
      {/* Imagen principal */}
      <img
        key={imagenesValidas[imagenActual]}
        src={imagenesValidas[imagenActual]}
        alt={`${nombre} - Imagen ${imagenActual + 1}`}
        className={`w-full h-full ${fitMode === 'cover' ? 'object-cover' : 'object-contain'}`}
        loading="eager"
        decoding="async"
        onLoad={handleImgLoad}
        onError={(e) => {
          console.warn(`Error cargando imagen: ${imagenesValidas[imagenActual]}`);
          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x400?text=Imagen+No+Disponible';
        }}
      />

      {/* Botones de navegación - Siempre visibles si hay múltiples imágenes */}
      {imagenesValidas.length > 1 && (
        <>
          <button type="button"
            onClick={irAnterior}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-white text-black p-2 rounded-full hover:bg-gray-200 transition-colors z-20 shadow-lg"
            aria-label="Imagen anterior"
            title="Anterior"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button type="button"
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
                type="button"
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
          <div className="absolute top-3 right-3 bg-[#A3395C] text-white px-3 py-1.5 rounded-full text-xs font-bold z-20 shadow-md tracking-wide">
            {imagenActual + 1} / {imagenesValidas.length}
          </div>

          {/* Thumbnails debajo (opcional) */}
          <div className="absolute -bottom-20 left-0 right-0 flex gap-2 justify-center px-2">
            {imagenesValidas.slice(0, 5).map((img, idx) => (
              <button
                type="button"
                key={idx}
                onClick={() => setImagenActual(idx)}
                className={`w-12 h-12 rounded border-2 overflow-hidden transition-all ${
                  idx === imagenActual
                    ? 'border-[#A3395C] scale-105'
                    : 'border-gray-300 dark:border-[#453840] hover:border-gray-400 dark:hover:border-[#A3395C] opacity-70 hover:opacity-100'
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

