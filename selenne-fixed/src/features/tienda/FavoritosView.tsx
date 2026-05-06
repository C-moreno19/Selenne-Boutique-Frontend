import React from 'react';
import { ArrowLeft, Heart, Star, ShoppingBag } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { useTienda } from '../../shared/contexts/TiendaContext';
import { useProductosCombinados } from '../../shared/data/useProductosCombinados';

interface FavoritosViewProps {
  onBack: () => void;
  onVerDetalles: (producto: any) => void;
  onAgregarAlCarrito: (producto: any) => void;
}

export const FavoritosView: React.FC<FavoritosViewProps> = ({
  onBack,
  onVerDetalles,
}) => {
  const { favoritos, toggleFavorito } = useTienda();
  const productosData = useProductosCombinados();

  const productosFavoritos = productosData.filter(p => favoritos.includes(p.id));

  const formatPrecio = (precio: number) =>
    `$${precio.toLocaleString('es-CO')}`;

  const calcularDescuento = (precio: number, precioOriginal: number) =>
    Math.round(((precioOriginal - precio) / precioOriginal) * 100);

  return (
    <div className="min-h-screen bg-white">
      {/* Banner */}
      <div className="pt-8 pb-2 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2
          style={{ fontFamily: "Playfair Display, serif", fontSize: "32px", fontWeight: 700, letterSpacing: "0.08em" }}
          className="text-[#1a1a1a] uppercase"
        >
          Favoritos
        </h2>
        <p style={{ fontFamily: "Inter, sans-serif" }} className="text-sm text-gray-500 mt-1">
          {productosFavoritos.length} {productosFavoritos.length === 1 ? 'producto guardado' : 'productos guardados'}
        </p>
      </div>
      <div style={{ height: "2px", backgroundColor: "#d65391" }} />

      {/* Contenido */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {productosFavoritos.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="w-24 h-24 text-gray-300 mx-auto mb-6" />
            <h2 className="text-3xl text-gray-900 mb-4 font-playfair">No tienes favoritos aún</h2>
            <p className="text-gray-600 mb-8 font-inter">
              Comienza a agregar productos a tus favoritos para verlos aquí
            </p>
            <Button
              onClick={onBack}
              className="bg-[#d65391] hover:bg-[#c04380] text-white h-11 font-inter"
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
                    <Badge className="absolute top-10 left-3 bg-black hover:bg-black text-white">
                      -{calcularDescuento(producto.precio, producto.precioOriginal)}%
                    </Badge>
                  )}
                  <button
                    onClick={() => toggleFavorito(producto.id)}
                    className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
                    title="Quitar de favoritos"
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
                          i < Math.floor(producto.rating ?? 0)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="text-xs text-gray-500 ml-2">{producto.rating}</span>
                  </div>
                  <h3 className="text-gray-900 mb-2 h-12 line-clamp-2 font-inter">{producto.nombre}</h3>
                  <div className="flex items-center gap-2 mb-3">
                    {producto.precioOriginal ? (
                      <>
                        <span className="text-xl text-[#d65391] font-playfair">{formatPrecio(producto.precio)}</span>
                        <span className="text-sm text-gray-400 line-through">{formatPrecio(producto.precioOriginal)}</span>
                      </>
                    ) : (
                      <span className="text-xl text-gray-900 font-playfair">{formatPrecio(producto.precio)}</span>
                    )}
                  </div>
                  <div className="flex gap-1 mb-3 flex-wrap">
                    {producto.tallas.map((talla) => (
                      <span key={talla} className="px-2 py-1 text-xs border border-gray-300 rounded font-inter">
                        {talla}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => onVerDetalles(producto)}
                      className="flex-1 bg-black hover:bg-gray-800 text-white h-11 font-inter"
                    >
                      Ver Detalles
                    </Button>
                    <Button
                      onClick={() => onVerDetalles(producto)}
                      className="px-3 bg-[#d65391] hover:bg-[#c04380] text-white h-11"
                      title="Seleccionar talla y agregar al carrito"
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
