import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { toast } from 'sonner';
import api, { getAccessToken } from '../../services/api';

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
  carritoID: number;
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
  if (!context) throw new Error('useTienda debe usarse dentro de TiendaProvider');
  return context;
};

// ── localStorage keys para invitados ────────────────────────────────────────
const GUEST_CART_KEY = 'selenne_guest_cart';
const GUEST_FAV_KEY  = 'selenne_guest_favoritos';

const loadGuestCart = (): CarritoItem[] => {
  try { return JSON.parse(localStorage.getItem(GUEST_CART_KEY) || '[]'); } catch { return []; }
};
const loadGuestFav = (): number[] => {
  try { return JSON.parse(localStorage.getItem(GUEST_FAV_KEY) || '[]'); } catch { return []; }
};
const saveGuestCart = (items: CarritoItem[]) =>
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
const saveGuestFav = (ids: number[]) =>
  localStorage.setItem(GUEST_FAV_KEY, JSON.stringify(ids));
const clearGuestData = () => {
  localStorage.removeItem(GUEST_CART_KEY);
  localStorage.removeItem(GUEST_FAV_KEY);
};

const isLoggedIn = () => !!getAccessToken();

// ── Provider ─────────────────────────────────────────────────────────────────
export const TiendaProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [carritoItems, setCarritoItems] = useState<CarritoItem[]>(() =>
    isLoggedIn() ? [] : loadGuestCart()
  );
  const [favoritos, setFavoritos] = useState<number[]>(() =>
    isLoggedIn() ? [] : loadGuestFav()
  );
  const [pedidos, setPedidos] = useState<Pedido[]>(() => {
    try { return JSON.parse(localStorage.getItem('selenne_pedidos') || '[]'); } catch { return []; }
  });

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
      // not logged in or network error
    } finally {
      loadingRef.current = false;
    }
  };

  // Al hacer login: fusionar datos de invitado con el servidor y luego cargar
  const mergeGuestAndLoad = async () => {
    const guestCart = loadGuestCart();
    const guestFavs = loadGuestFav();

    // Subir carrito de invitado al servidor
    for (const item of guestCart) {
      try {
        await api.postJson('/api/carrito/items', {
          ProductoID: item.id,
          Cantidad: item.cantidad,
          TallaSeleccionada: item.tallaSeleccionada,
          ColorSeleccionado: item.colorSeleccionado || '',
        });
      } catch (_) {}
    }

    // Subir favoritos de invitado al servidor
    for (const id of guestFavs) {
      try {
        await api.postJson(`/api/favoritos/${id}`, {});
      } catch (_) {}
    }

    clearGuestData();
    await loadFromApi();
  };

  const clearLocalState = () => {
    setCarritoItems([]);
    setFavoritos([]);
  };

  // Cargar desde API si ya hay sesión al montar
  useEffect(() => {
    if (isLoggedIn()) loadFromApi();
  }, []);

  // Escuchar eventos de auth
  useEffect(() => {
    const onLogin  = () => mergeGuestAndLoad();
    const onLogout = () => clearLocalState();
    window.addEventListener('auth:login',  onLogin);
    window.addEventListener('auth:logout', onLogout);
    return () => {
      window.removeEventListener('auth:login',  onLogin);
      window.removeEventListener('auth:logout', onLogout);
    };
  }, []);

  // Persistir pedidos locales
  useEffect(() => {
    localStorage.setItem('selenne_pedidos', JSON.stringify(pedidos));
  }, [pedidos]);

  // ── Carrito ───────────────────────────────────────────────────────────────
  const agregarAlCarrito = async (producto: Producto, talla: string, color?: string, cantidad: number = 1) => {
    if (!isLoggedIn()) {
      // Modo invitado: guardar en localStorage
      setCarritoItems(prev => {
        const existing = prev.find(
          i => i.id === producto.id && i.tallaSeleccionada === talla && (i.colorSeleccionado || '') === (color || '')
        );
        const updated = existing
          ? prev.map(i => i.carritoID === existing.carritoID ? { ...i, cantidad: i.cantidad + cantidad } : i)
          : [...prev, { ...producto, carritoID: -Date.now(), cantidad, tallaSeleccionada: talla, colorSeleccionado: color || '' }];
        saveGuestCart(updated);
        return updated;
      });
      toast.success('Producto agregado', { description: `${producto.nombre} - Talla ${talla} x${cantidad}` });
      return;
    }

    try {
      await api.postJson('/api/carrito/items', {
        ProductoID: producto.id,
        Cantidad: cantidad,
        TallaSeleccionada: talla,
        ColorSeleccionado: color || '',
      });

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
    if (!isLoggedIn()) {
      setCarritoItems(prev => {
        const updated = prev.filter(i => i.carritoID !== carritoID);
        saveGuestCart(updated);
        return updated;
      });
      toast.success('Producto eliminado del carrito');
      return;
    }
    try {
      await api.deleteJson(`/api/carrito/items/${carritoID}`);
      setCarritoItems(items => items.filter(item => item.carritoID !== carritoID));
      toast.success('Producto eliminado del carrito');
    } catch (_) {
      toast.error('No se pudo eliminar del carrito');
    }
  };

  const actualizarCantidad = async (carritoID: number, cantidad: number) => {
    if (cantidad < 1) { removerDelCarrito(carritoID); return; }

    if (!isLoggedIn()) {
      setCarritoItems(prev => {
        const updated = prev.map(i => i.carritoID === carritoID ? { ...i, cantidad } : i);
        saveGuestCart(updated);
        return updated;
      });
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

  // ── Favoritos ─────────────────────────────────────────────────────────────
  const toggleFavorito = async (id: number) => {
    if (!isLoggedIn()) {
      setFavoritos(prev => {
        const esFav = prev.includes(id);
        const updated = esFav ? prev.filter(f => f !== id) : [...prev, id];
        saveGuestFav(updated);
        if (esFav) toast.info('Eliminado de favoritos');
        else toast.success('Agregado a favoritos', { description: 'Producto guardado en tu lista de deseos' });
        return updated;
      });
      return;
    }
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

  const getTotalCarrito = () =>
    carritoItems.reduce((sum, item) => sum + item.precio * item.cantidad, 0);

  const limpiarCarrito = async () => {
    if (!isLoggedIn()) {
      setCarritoItems([]);
      clearGuestData();
      return;
    }
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
      datosEnvio,
    };
    setPedidos(prev => [...prev, nuevoPedido]);
  };

  return (
    <TiendaContext.Provider value={{
      carritoItems, favoritos, pedidos,
      agregarAlCarrito, removerDelCarrito, actualizarCantidad,
      toggleFavorito, esFavorito, getTotalCarrito,
      limpiarCarrito, agregarPedido,
    }}>
      {children}
    </TiendaContext.Provider>
  );
};
