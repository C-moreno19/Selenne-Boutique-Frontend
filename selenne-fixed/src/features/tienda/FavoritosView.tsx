import React from 'react';
import { ArrowLeft, Heart, Star, ShoppingBag } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { useTienda } from '../../shared/contexts/TiendaContext';
import { productos as productosData } from '../../shared/data/productos';

interface FavoritosViewProps {
  onBack: () => void;
  onVerDetalles: (producto: any) => void;
  onAgregarAlCarrito: (producto: any) => void;
}

export const FavoritosView: React.FC<FavoritosViewProps> = ({ 
  onBack, 
  onVerDetalles,
  onAgregarAlCarrito 
}) => {
  const { favoritos, toggleFavorito } = useTienda();

  const productosFavoritos = productosData.filter(p => favoritos.includes(p.id));

  const formatPrecio = (precio: number) => {
    return `$${precio.toLocaleString('es-CO')}`;
  };

  const calcularDescuento = (precio: number, precioOriginal: number) => {
    const descuento = ((precioOriginal - precio) / precioOriginal) * 100;
    return Math.round(descuento);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Banner */}
      <div className="bg-gradient-to-r from-[#d65391] to-[#f8a9c5] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center mb-2">
            <Heart className="w-10 h-10 mr-3 fill-white" />
            <h1
              style={{ fontFamily: 'Playfair Display, serif' }}
              className="text-4xl md:text-5xl"
            >
              Mis Favoritos
            </h1>
          </div>
          <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-lg opacity-90">
            {productosFavoritos.length} {productosFavoritos.length === 1 ? 'producto guardado' : 'productos guardados'}
          </p>
        </div>
      </div>

      {/* Contenido */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {productosFavoritos.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="w-24 h-24 text-gray-300 mx-auto mb-6" />
            <h2
              style={{ fontFamily: 'Playfair Display, serif' }}
              className="text-3xl text-gray-900 mb-4"
            >
              No tienes favoritos aún
            </h2>
            <p className="text-gray-600 mb-8">
              Comienza a agregar productos a tus favoritos para verlos aquí
            </p>
            <Button
              onClick={onBack}
              className="bg-[#d65391] hover:bg-[#c04380] text-white h-11"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Explorar Productos
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {productosFavoritos.map((producto) => (
              <div
                key={producto.id}
                className="bg-white rounded-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow duration-300 group"
              >
                <div className="relative overflow-hidden">
                  <img
                    src={producto.imagen}
                    alt={producto.nombre}
                    className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {producto.badge && (
                    <Badge
                      className={`absolute top-3 left-3 ${
                        producto.badge === 'Sale'
                          ? 'bg-red-500 hover:bg-red-600'
                          : 'bg-[#d65391] hover:bg-[#d65391]'
                      }`}
                    >
                      {producto.badge}
                    </Badge>
                  )}
                  {producto.precioOriginal && (
                    <Badge className="absolute top-3 right-3 bg-black hover:bg-black text-white">
                      -{calcularDescuento(producto.precio, producto.precioOriginal)}%
                    </Badge>
                  )}
                  {producto.nuevo && (
                    <Badge className="absolute top-3 right-3 bg-green-500 hover:bg-green-600">
                      Nuevo
                    </Badge>
                  )}
                  <button
                    onClick={() => toggleFavorito(producto.id)}
                    className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
                  >
                    <Heart className="w-5 h-5 fill-[#d65391] text-[#d65391]" />
                  </button>
                </div>
                <div className="p-4">
                  <div className="flex items-center mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(producto.rating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="text-xs text-gray-500 ml-2">{producto.rating}</span>
                  </div>
                  <h3
                    style={{ fontFamily: 'Inter, sans-serif' }}
                    className="text-gray-900 mb-2 h-12 line-clamp-2"
                  >
                    {producto.nombre}
                  </h3>
                  <div className="flex items-center gap-2 mb-3">
                    {producto.precioOriginal ? (
                      <>
                        <span
                          style={{ fontFamily: 'Playfair Display, serif' }}
                          className="text-xl text-[#d65391]"
                        >
                          {formatPrecio(producto.precio)}
                        </span>
                        <span className="text-sm text-gray-400 line-through">
                          {formatPrecio(producto.precioOriginal)}
                        </span>
                      </>
                    ) : (
                      <span
                        style={{ fontFamily: 'Playfair Display, serif' }}
                        className="text-xl text-gray-900"
                      >
                        {formatPrecio(producto.precio)}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1 mb-3 flex-wrap">
                    {producto.tallas.map((talla) => (
                      <span
                        key={talla}
                        className="px-2 py-1 text-xs border border-gray-300 rounded"
                      >
                        {talla}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => onVerDetalles(producto)}
                      className="flex-1 bg-black hover:bg-gray-800 text-white h-11"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                      Ver Detalles
                    </Button>
                    <Button
                      onClick={() => onAgregarAlCarrito(producto)}
                      className="px-3 bg-[#d65391] hover:bg-[#c04380] text-white h-11"
                      title="Agregar al carrito"
                    >
                      <ShoppingBag className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
