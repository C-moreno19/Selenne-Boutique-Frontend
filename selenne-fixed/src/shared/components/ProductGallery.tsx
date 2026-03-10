import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, Share2, Heart } from 'lucide-react';

interface ProductImage {
  src: string;
  alt: string;
}

interface ProductGalleryProps {
  images: ProductImage[];
  productName: string;
  onFavoriteClick?: (isFavorite: boolean) => void;
  isFavorite?: boolean;
  className?: string;
}

export const ProductGallery: React.FC<ProductGalleryProps> = ({
  images,
  productName,
  onFavoriteClick,
  isFavorite = false,
  className = '',
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isZomed, setIsZomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [isFavoritedLocal, setIsFavoritedLocal] = useState(isFavorite);

  const currentImage = images[currentImageIndex];

  const handleNext = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  };

  const handleFavoriteClick = () => {
    const newFavorited = !isFavoritedLocal;
    setIsFavoritedLocal(newFavorited);
    onFavoriteClick?.(newFavorited);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Image Display */}
      <div className="relative bg-gray-100 rounded-xl overflow-hidden aspect-square cursor-zoom-in group">
        {/* Main Image */}
        <img
          src={currentImage.src}
          alt={currentImage.alt}
          className={`w-full h-full object-cover transition-transform duration-300 ${
            isZomed ? 'scale-150' : 'scale-100'
          }`}
          onMouseEnter={() => setIsZomed(true)}
          onMouseLeave={() => setIsZomed(false)}
          onMouseMove={handleMouseMove}
          style={
            isZomed
              ? {
                  transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                }
              : undefined
          }
        />

        {/* Action Buttons Overlay */}
        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={handleFavoriteClick}
            className={`p-2 rounded-full backdrop-blur transition-all duration-200 ${
              isFavoritedLocal
                ? 'bg-red-500 text-white'
                : 'bg-white text-gray-900 hover:bg-red-500 hover:text-white'
            }`}
          >
            <Heart className="w-5 h-5" fill={isFavoritedLocal ? 'currentColor' : 'none'} />
          </button>

          <button className="p-2 rounded-full bg-white text-gray-900 hover:bg-[#d65391] hover:text-white transition-all duration-200">
            <Share2 className="w-5 h-5" />
          </button>

          <button className="p-2 rounded-full bg-white text-gray-900 hover:bg-[#d65391] hover:text-white transition-all duration-200">
            <ZoomIn className="w-5 h-5" />
          </button>
        </div>

        {/* Zoom Indicator */}
        {isZomed && (
          <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-xs font-medium">
            Zoom activo
          </div>
        )}

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white bg-opacity-80 hover:bg-opacity-100 text-gray-900 transition-all duration-200 opacity-0 group-hover:opacity-100"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white bg-opacity-80 hover:bg-opacity-100 text-gray-900 transition-all duration-200 opacity-0 group-hover:opacity-100"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail Images */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-3">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={`relative aspect-square rounded-lg overflow-hidden transition-all duration-200 ${
                currentImageIndex === index
                  ? 'ring-2 ring-[#d65391]'
                  : 'hover:ring-2 hover:ring-gray-300 opacity-70 hover:opacity-100'
              }`}
            >
              <img
                src={image.src}
                alt={image.alt}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Image Counter */}
      {images.length > 1 && (
        <div
          style={{ fontFamily: 'Inter, sans-serif' }}
          className="text-center text-sm text-gray-500"
        >
          {currentImageIndex + 1} / {images.length}
        </div>
      )}
    </div>
  );
};

export default ProductGallery;
