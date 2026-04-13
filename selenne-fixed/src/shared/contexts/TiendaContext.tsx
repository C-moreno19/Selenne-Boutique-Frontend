import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { toast } from 'sonner';
import api from '../../services/api';

export interface Producto {
  id: number;
  nombre: string;
  precio: number;
  precioOriginal?: number | null;
  imagen: string;
  imagenes?: string[];
  imagenesPorColor?: Record<string, string[]>;
  categoria: 'mujer' | 'accesorios' | 'sale';
  subcategoria?: string;
  tipoProducto: string;
  tallas: string[];
  colores?: string[];
  materiales?: string[];
  rating: number;
  badge?: string | null;
  nuevo: boolean;
}

interface CarritoItem extends Producto {
  carritoID: number; // ID del registro en BD
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
  removerDelCarrito: (carritoID: number) => void;
  actualizarCantidad: (carritoID: number, cantidad: number) => void;
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

// Returns true if a valid auth token exists
const isLoggedIn = () => !!localStorage.getItem('accessToken');

export const TiendaProvider: React.FC<TiendaProviderProps> = ({ children }) => {
  const [carritoItems, setCarritoItems] = useState<CarritoItem[]>([]);
  const [favoritos, setFavoritos] = useState<number[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>(() => {
    const saved = localStorage.getItem('selenne_pedidos');
    return saved ? JSON.parse(saved) : [];
  });

  // Prevent concurrent loads
  const loadingRef = useRef(false);

  const loadFromApi = async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    try {
      const [carritoRes, favRes] = await Promise.all([
        api.getJson('/api/carrito').catch(() => null),
        api.getJson('/api/favoritos').catch(() => null),
      ]);

      if (carritoRes) {
        const items: CarritoItem[] = (carritoRes?.data || carritoRes || []).map((c: any) => ({
          carritoID: c.carritoID,
          id: c.productoID,
          nombre: c.productoNombre,
          imagen: c.imagenProducto || '',
          precio: c.precioUnitario,
          precioOriginal: null,
          categoria: 'mujer' as const,
          tipoProducto: '',
          tallas: [],
          rating: 0,
          nuevo: false,
          cantidad: c.cantidad,
          tallaSeleccionada: c.tallaSeleccionada || '',
          colorSeleccionado: c.colorSeleccionado || '',
        }));
        setCarritoItems(items);
      }

      if (favRes) {
        const ids: number[] = favRes?.data || favRes || [];
        setFavoritos(ids);
      }
    } catch (_) {
      // not logged in or network error — keep empty
    } finally {
      loadingRef.current = false;
    }
  };

  const clearLocalState = () => {
    setCarritoItems([]);
    setFavoritos([]);
  };

  // Load on mount if already logged in
  useEffect(() => {
    if (isLoggedIn()) {
      loadFromApi();
    }
  }, []);

  // Listen to auth events
  useEffect(() => {
    const onLogin = () => loadFromApi();
    const onLogout = () => clearLocalState();
    window.addEventListener('auth:login', onLogin);
    window.addEventListener('auth:logout', onLogout);
    return () => {
      window.removeEventListener('auth:login', onLogin);
      window.removeEventListener('auth:logout', onLogout);
    };
  }, []);

  // Persist pedidos in localStorage (they're local only)
  useEffect(() => {
    localStorage.setItem('selenne_pedidos', JSON.stringify(pedidos));
  }, [pedidos]);

  const agregarAlCarrito = async (producto: Producto, talla: string, color?: string, cantidad: number = 1) => {
    try {
      await api.postJson('/api/carrito/items', {
        ProductoID: producto.id,
        Cantidad: cantidad,
        TallaSeleccionada: talla,
        ColorSeleccionado: color || '',
      });

      // Reload cart from API to get correct carritoIDs
      const res = await api.getJson('/api/carrito');
      const items: CarritoItem[] = (res?.data || res || []).map((c: any) => ({
        carritoID: c.carritoID,
        id: c.productoID,
        nombre: c.productoNombre,
        imagen: c.imagenProducto || '',
        precio: c.precioUnitario,
        precioOriginal: null,
        categoria: 'mujer' as const,
        tipoProducto: '',
        tallas: [],
        rating: 0,
        nuevo: false,
        cantidad: c.cantidad,
        tallaSeleccionada: c.tallaSeleccionada || '',
        colorSeleccionado: c.colorSeleccionado || '',
      }));
      setCarritoItems(items);

      const existing = carritoItems.find(
        i => i.id === producto.id && i.tallaSeleccionada === talla && (i.colorSeleccionado || '') === (color || '')
      );
      if (existing) {
        toast.success('Cantidad actualizada', { description: `${producto.nombre} - Talla ${talla} (+${cantidad})` });
      } else {
        toast.success('Producto agregado', { description: `${producto.nombre} - Talla ${talla} x${cantidad}` });
      }
    } catch (_) {
      toast.error('No se pudo agregar al carrito');
    }
  };

  const removerDelCarrito = async (carritoID: number) => {
    try {
      await api.deleteJson(`/api/carrito/items/${carritoID}`);
      setCarritoItems(items => items.filter(item => item.carritoID !== carritoID));
      toast.success('Producto eliminado del carrito');
    } catch (_) {
      toast.error('No se pudo eliminar del carrito');
    }
  };

  const actualizarCantidad = async (carritoID: number, cantidad: number) => {
    if (cantidad < 1) {
      removerDelCarrito(carritoID);
      return;
    }
    try {
      await api.putJson(`/api/carrito/items/${carritoID}`, { Cantidad: cantidad });
      setCarritoItems(items =>
        items.map(item => item.carritoID === carritoID ? { ...item, cantidad } : item)
      );
    } catch (_) {
      toast.error('No se pudo actualizar la cantidad');
    }
  };

  const toggleFavorito = async (id: number) => {
    const esFav = favoritos.includes(id);
    try {
      if (esFav) {
        await api.deleteJson(`/api/favoritos/${id}`);
        setFavoritos(favs => favs.filter(fav => fav !== id));
        toast.info('Eliminado de favoritos');
      } else {
        await api.postJson(`/api/favoritos/${id}`, {});
        setFavoritos(favs => [...favs, id]);
        toast.success('Agregado a favoritos', { description: 'Producto guardado en tu lista de deseos' });
      }
    } catch (_) {
      toast.error('No se pudo actualizar favoritos');
    }
  };

  const esFavorito = (id: number) => favoritos.includes(id);

  const getTotalCarrito = () => {
    return carritoItems.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
  };

  const limpiarCarrito = async () => {
    try {
      await api.deleteJson('/api/carrito');
      setCarritoItems([]);
    } catch (_) {
      setCarritoItems([]);
    }
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
