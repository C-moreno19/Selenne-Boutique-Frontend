import React, { useState } from 'react';
import { Heart, ShoppingCart, Star, ChevronLeft, ChevronRight } from 'lucide-react';

interface RecommendedProduct {
  id: string;
  nombre: string;
  imagen: string;
  precio: number;
  precioOriginal?: number;
  rating: number;
  reviews: number;
  badge?: string;
  badgeColor?: 'red' | 'green' | 'blue' | 'yellow';
}

interface ProductRecommendationsProps {
  title?: string;
  description?: string;
  products: RecommendedProduct[];
  onProductClick?: (productId: string) => void;
  onAddToCart?: (productId: string) => void;
  onAddToFavorites?: (productId: string) => void;
  className?: string;
}

const badgeColors = {
  red: 'bg-red-100 text-red-800',
  green: 'bg-green-100 text-green-800',
  blue: 'bg-blue-100 text-blue-800',
  yellow: 'bg-yellow-100 text-yellow-800',
};

export const ProductRecommendations: React.FC<ProductRecommendationsProps> = ({
  title = 'También te podría interesar',
  description = 'Productos similares basados en tu actividad',
  products,
  onProductClick,
  onAddToCart,
  onAddToFavorites,
  className = '',
}) => {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const containerRef = React.useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!containerRef.current) return;

    const scrollAmount = 320; // Card width + gap
    const newPosition =
      direction === 'left'
        ? Math.max(0, scrollPosition - scrollAmount)
        : scrollPosition + scrollAmount;

    setScrollPosition(newPosition);
    containerRef.current.scrollTo({
      left: newPosition,
      behavior: 'smooth',
    });
  };

  const handleFavoriteToggle = (productId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(productId)) {
      newFavorites.delete(productId);
    } else {
      newFavorites.add(productId);
    }
    setFavorites(newFavorites);
    onAddToFavorites?.(productId);
  };

  const hasScroll = products.length > 3;
  const discount = (original: number, current: number) => {
    return Math.round(((original - current) / original) * 100);
  };

  return (
    <div className={`py-12 ${className}`}>
      {/* Header */}
      <div className="mb-8 px-4 sm:px-0">
        <h2
          style={{ fontFamily: 'Playfair Display, serif' }}
          className="text-3xl font-bold text-gray-900 mb-2"
        >
          {title}
        </h2>
        <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-gray-600">
          {description}
        </p>
      </div>

      {/* Carousel Container */}
      <div className="relative">
        {/* Scroll Buttons */}
        {hasScroll && (
          <>
            <button
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow hidden sm:flex items-center justify-center w-10 h-10"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>

            <button
              onClick={() => scroll('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow hidden sm:flex items-center justify-center w-10 h-10"
            >
              <ChevronRight className="w-5 h-5 text-gray-700" />
            </button>
          </>
        )}

        {/* Products Container */}
        <div
          ref={containerRef}
          className="overflow-x-auto scrollbar-hide scroll-smooth"
          style={{ scrollBehavior: 'smooth' }}
        >
          <div className="flex gap-6 px-4 sm:px-0 pb-4">
            {products.map((product) => (
              <div
                key={product.id}
                className="flex-shrink-0 w-full sm:w-80 group"
              >
                {/* Card */}
                <div className="bg-white rounded-xl overflow-hidden border border-gray-100 hover:border-[#d65391] transition-all duration-300 cursor-pointer flex flex-col h-full">
                  {/* Image Container */}
                  <div
                    onClick={() => onProductClick?.(product.id)}
                    className="relative bg-gray-100 aspect-square overflow-hidden"
                  >
                    <img
                      src={product.imagen}
                      alt={product.nombre}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />

                    {/* Badge */}
                    {product.badge && (
                      <div
                        className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-semibold ${
                          badgeColors[product.badgeColor || 'green']
                        }`}
                      >
                        {product.badge}
                      </div>
                    )}

                    {/* Discount Badge */}
                    {product.precioOriginal && (
                      <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                        -{discount(product.precioOriginal, product.precio)}%
                      </div>
                    )}

                    {/* Favorite Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFavoriteToggle(product.id);
                      }}
                      className={`absolute bottom-4 right-4 p-2 rounded-full transition-all duration-200 ${
                        favorites.has(product.id)
                          ? 'bg-red-500 text-white'
                          : 'bg-white text-gray-900 hover:bg-[#d65391] hover:text-white'
                      }`}
                    >
                      <Heart
                        className="w-5 h-5"
                        fill={favorites.has(product.id) ? 'currentColor' : 'none'}
                      />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-4 flex flex-col flex-grow">
                    {/* Product Name */}
                    <h3
                      style={{ fontFamily: 'Playfair Display, serif' }}
                      className="font-semibold text-gray-900 mb-2 line-clamp-2 cursor-pointer hover:text-[#d65391] transition-colors"
                      onClick={() => onProductClick?.(product.id)}
                    >
                      {product.nombre}
                    </h3>

                    {/* Rating */}
                    <div className="flex items-center gap-1 mb-3">
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(product.rating)
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span
                        style={{ fontFamily: 'Inter, sans-serif' }}
                        className="text-xs text-gray-500 ml-1"
                      >
                        ({product.reviews})
                      </span>
                    </div>

                    {/* Price */}
                    <div className="mb-4">
                      <div className="flex items-baseline gap-2">
                        <span
                          style={{ fontFamily: 'Playfair Display, serif' }}
                          className="text-xl font-bold text-[#d65391]"
                        >
                          ${product.precio.toLocaleString()}
                        </span>
                        {product.precioOriginal && (
                          <span
                            style={{ fontFamily: 'Inter, sans-serif' }}
                            className="text-sm text-gray-500 line-through"
                          >
                            ${product.precioOriginal.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Add to Cart Button */}
                    <button
                      onClick={() => onAddToCart?.(product.id)}
                      className="w-full mt-auto bg-gradient-to-r from-[#d65391] to-[#f8a9c5] hover:shadow-lg text-white font-medium py-2 rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Agregar al carrito
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductRecommendations;
