import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner@2.0.3';

export interface Producto {
  id: number;
  nombre: string;
  precio: number;
  precioOriginal?: number | null;
  imagen: string;
  imagenes?: string[];
  imagenesPorColor?: Record<string, string[]>;
  categoria: 'mujer' | 'accesorios' | 'sale';
  subcategoria?: string; // Categoría de ropa: Vestido, Blusa, Pantalón, etc.
  tipoProducto: string;
  tallas: string[];
  colores?: string[];
  materiales?: string[];
  rating: number;
  badge?: string | null;
  nuevo: boolean;
}

interface CarritoItem extends Producto {
  cantidad: number;
  tallaSeleccionada: string;
  colorSeleccionado?: string;
}

export interface Pedido {
  id: string;
  fecha: string;
  items: CarritoItem[];
  total: number;
  estado: 'pendiente' | 'confirmado' | 'enviado' | 'entregado';
  metodoPago: 'contra-entrega' | 'transferencia';
  datosEnvio: {
    nombre: string;
    documento: string;
    direccion: string;
    ciudad: string;
    telefono: string;
    notas?: string;
  };
}

interface TiendaContextType {
  carritoItems: CarritoItem[];
  favoritos: number[];
  pedidos: Pedido[];
  agregarAlCarrito: (producto: Producto, talla: string, color?: string, cantidad?: number) => void;
  removerDelCarrito: (id: number) => void;
  actualizarCantidad: (id: number, cantidad: number) => void;
  toggleFavorito: (id: number) => void;
  esFavorito: (id: number) => boolean;
  getTotalCarrito: () => number;
  limpiarCarrito: () => void;
  agregarPedido: (datosEnvio: Pedido['datosEnvio'], metodoPago: 'contra-entrega' | 'transferencia') => void;
}

const TiendaContext = createContext<TiendaContextType | undefined>(undefined);

export const useTienda = () => {
  const context = useContext(TiendaContext);
  if (!context) {
    throw new Error('useTienda debe usarse dentro de TiendaProvider');
  }
  return context;
};

interface TiendaProviderProps {
  children: ReactNode;
}

export const TiendaProvider: React.FC<TiendaProviderProps> = ({ children }) => {
  const [carritoItems, setCarritoItems] = useState<CarritoItem[]>(() => {
    const saved = localStorage.getItem('selenne_carrito');
    return saved ? JSON.parse(saved) : [];
  });

  const [favoritos, setFavoritos] = useState<number[]>(() => {
    const saved = localStorage.getItem('selenne_favoritos');
    return saved ? JSON.parse(saved) : [];
  });

  const [pedidos, setPedidos] = useState<Pedido[]>(() => {
    const saved = localStorage.getItem('selenne_pedidos');
    return saved ? JSON.parse(saved) : [];
  });

  // Guardar carrito en localStorage
  useEffect(() => {
    localStorage.setItem('selenne_carrito', JSON.stringify(carritoItems));
  }, [carritoItems]);

  // Guardar favoritos en localStorage
  useEffect(() => {
    localStorage.setItem('selenne_favoritos', JSON.stringify(favoritos));
  }, [favoritos]);

  // Guardar pedidos en localStorage
  useEffect(() => {
    localStorage.setItem('selenne_pedidos', JSON.stringify(pedidos));
  }, [pedidos]);

  const agregarAlCarrito = (producto: Producto, talla: string, color?: string, cantidad: number = 1) => {
    setCarritoItems(items => {
      const existente = items.find(
        item => item.id === producto.id && item.tallaSeleccionada === talla && (item.colorSeleccionado || '') === (color || '')
      );

      if (existente) {
        toast.success('Cantidad actualizada', {
          description: `${producto.nombre} - Talla ${talla} (+${cantidad})`
        });
        return items.map(item =>
          item.id === producto.id && item.tallaSeleccionada === talla && (item.colorSeleccionado || '') === (color || '')
            ? { ...item, cantidad: item.cantidad + cantidad }
            : item
        );
      } else {
        toast.success('Producto agregado', {
          description: `${producto.nombre} - Talla ${talla} x${cantidad}`
        });
        return [...items, { 
          ...producto, 
          cantidad: cantidad, 
          tallaSeleccionada: talla,
          colorSeleccionado: color || '' 
        }];
      }
    });
  };

  const removerDelCarrito = (id: number) => {
    setCarritoItems(items => items.filter(item => item.id !== id));
    toast.success('Producto eliminado del carrito');
  };

  const actualizarCantidad = (id: number, cantidad: number) => {
    if (cantidad < 1) {
      removerDelCarrito(id);
      return;
    }
    setCarritoItems(items =>
      items.map(item =>
        item.id === id ? { ...item, cantidad } : item
      )
    );
  };

  const toggleFavorito = (id: number) => {
    setFavoritos(favs => {
      if (favs.includes(id)) {
        toast.info('Eliminado de favoritos');
        return favs.filter(fav => fav !== id);
      } else {
        toast.success('Agregado a favoritos', {
          description: 'Producto guardado en tu lista de deseos'
        });
        return [...favs, id];
      }
    });
  };

  const esFavorito = (id: number) => favoritos.includes(id);

  const getTotalCarrito = () => {
    return carritoItems.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
  };

  const limpiarCarrito = () => {
    setCarritoItems([]);
  };

  const agregarPedido = (datosEnvio: Pedido['datosEnvio'], metodoPago: 'contra-entrega' | 'transferencia') => {
    const nuevoPedido: Pedido = {
      id: `PED-${Date.now()}`,
      fecha: new Date().toISOString(),
      items: [...carritoItems],
      total: getTotalCarrito(),
      estado: metodoPago === 'transferencia' ? 'pendiente' : 'confirmado',
      metodoPago,
      datosEnvio
    };
    setPedidos(prev => [...prev, nuevoPedido]);
  };

  return (
    <TiendaContext.Provider
      value={{
        carritoItems,
        favoritos,
        pedidos,
        agregarAlCarrito,
        removerDelCarrito,
        actualizarCantidad,
        toggleFavorito,
        esFavorito,
        getTotalCarrito,
        limpiarCarrito,
        agregarPedido
      }}
    >
      {children}
    </TiendaContext.Provider>
  );
};
