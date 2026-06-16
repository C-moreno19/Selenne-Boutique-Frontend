import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getJson, getAccessToken, apiBase, fetchWithAuth } from '../../services/api';
import { toast } from 'sonner';

export interface ProductoAdmin {
  id: string;
  codigo: string;
  nombre: string;
  categoria: string;
  categoriaMain: string;
  marca: string;
  precio: number;          // precioVenta
  precioCompra?: number;   // precio de costo
  precioOferta?: number;   // precio en oferta
  precioOriginal?: number;
  stock: number;
  activo: boolean;
  isSale?: boolean;
  imagen: string;
  imagenes: string[];
  imagenesPorColor?: { [colorName: string]: string[] };
  tallas: string[];
  tallasConStock: { nombre: string; stock: number }[];
  colores: string[];
  variantes: { tallaNombre?: string; colorNombre?: string; stock: number }[];
  agotado: boolean;
  agotadoGeneral: boolean;
  materiales: string[];
  tipoProducto: string;
  descripcion: string;
  categoriaPrincipalID?: number;
  tipoProductoID?: number;
  marcaID?: number;
}

export interface CreateProductoPayload {
  Codigo: string;
  Nombre: string;
  Descripcion?: string;
  CategoriaPrincipalID: number;
  TipoProductoID: number;
  MarcaID: number;
  PrecioVenta: number;
  PrecioOferta?: number;
  Stock: number;
  ImagenPrincipal?: string;
}

interface ProductosContextType {
  productos: ProductoAdmin[];
  loading: boolean;
  crearProducto: (payload: CreateProductoPayload, tallas?: string[], colores?: string[], tallasCtx?: any[], coloresCtx?: any[], imagenes?: string[], materiales?: string[], materialesCtx?: any[]) => Promise<number | false>;
  actualizarProducto: (id: string, payload: Partial<CreateProductoPayload & { Estado: string }>, tallas?: string[], colores?: string[], tallasCtx?: any[], coloresCtx?: any[], imagenes?: string[], materiales?: string[], materialesCtx?: any[]) => Promise<boolean>;
  eliminarProducto: (id: string) => Promise<void>;
  obtenerProducto: (id: string) => ProductoAdmin | undefined;
  recargar: () => Promise<void>;
}

const ProductosContext = createContext<ProductosContextType | undefined>(undefined);

export const useProductos = () => {
  const context = useContext(ProductosContext);
  if (!context) throw new Error('useProductos debe usarse dentro de ProductosProvider');
  return context;
};

// Deduce la categoría de tienda a partir del nombre de categoría BD
function deducirCategoriaMain(categoriaNombre: string, isSale: boolean): string {
  if (isSale) return 'sale';
  const n = (categoriaNombre ?? '').toLowerCase();
  if (n.includes('accesorio') || n.includes('bolso') || n.includes('joya') || n.includes('bijou')) return 'accesorios';
  if (n.includes('caballero') || n.includes('hombre') || n.includes('niño') || n.includes('nino')) return 'hombre';
  return 'mujer'; // default
}

function mapProducto(p: any): ProductoAdmin {
  // JSON de .NET viene en camelCase (productoID, categoriaNombre, etc.)
  const isSale = !!(p.precioOferta);
  const categoriaNombre = p.categoriaNombre ?? p.CategoriaNombre ?? p.categoria ?? '';
  const estadoRaw = p.estado ?? p.Estado ?? 'inactivo';
  const activoVal = estadoRaw === 'activo';
  console.log(`[Producto] ID=${p.productoID} nombre=${p.nombre} estado="${estadoRaw}" activo=${activoVal} categoria="${categoriaNombre}" imagen="${p.imagenPrincipal}"`);

  return {
    id: String(p.productoID ?? p.ProductoID ?? p.id ?? ''),
    codigo: p.codigo ?? p.Codigo ?? '',
    nombre: p.nombre ?? p.Nombre ?? '',
    categoria: categoriaNombre,
    categoriaMain: deducirCategoriaMain(categoriaNombre, isSale),
    marca: p.marcaNombre ?? p.MarcaNombre ?? p.marca ?? '',
    precio: Number(p.precioVenta ?? p.PrecioVenta ?? p.precio ?? 0),
    precioCompra: p.precioCompra != null ? Number(p.precioCompra) : p.PrecioCompra != null ? Number(p.PrecioCompra) : undefined,
    precioOferta: p.precioOferta != null ? Number(p.precioOferta) : p.PrecioOferta != null ? Number(p.PrecioOferta) : undefined,
    precioOriginal: p.precioOferta ? Number(p.precioVenta ?? p.PrecioVenta ?? p.precio ?? 0) : undefined,
    stock: Number(p.stock ?? p.Stock ?? 0),
    activo: activoVal,
    isSale,
    imagen: p.imagenPrincipal ?? p.ImagenPrincipal ?? p.imagen ?? '',
    imagenes: (() => {
      const imgs = p.imagenes ?? p.Imagenes ?? [];
      if (!Array.isArray(imgs)) return [];
      // Soporta tanto [{URL, ColorNombre}] como ['url']
      return imgs.map((i: any) => typeof i === 'string' ? i : i?.url ?? i?.URL ?? '').filter(Boolean);
    })(),
    imagenesPorColor: (() => {
      const imgs = p.imagenes ?? p.Imagenes ?? [];
      if (!Array.isArray(imgs)) return {};
      const mapa: Record<string, string[]> = {};
      imgs.forEach((i: any) => {
        const url = typeof i === 'string' ? i : (i?.url ?? i?.URL ?? '');
        const color = typeof i === 'string' ? null : (i?.colorNombre ?? i?.ColorNombre ?? null);
        if (!url) return;
        if (color) {
          if (!mapa[color]) mapa[color] = [];
          mapa[color].push(url);
        }
      });
      return mapa;
    })(),
    tallas: (() => {
      const t = p.tallas ?? p.Tallas ?? [];
      return Array.isArray(t) ? t.map((x: any) => x?.nombre ?? x?.Nombre ?? String(x)).filter(Boolean) : [];
    })(),
    tallasConStock: (() => {
      const t = p.tallas ?? p.Tallas ?? [];
      if (!Array.isArray(t)) return [];
      return t.map((x: any) => ({
        nombre: x?.nombre ?? x?.Nombre ?? String(x),
        stock: x?.stock ?? x?.Stock ?? 10,
      })).filter((x: any) => x.nombre);
    })(),
    variantes: (() => {
      const v = p.variantes ?? p.Variantes ?? [];
      console.log('[Variantes raw]', v);
      if (!Array.isArray(v)) return [];
      return v.map((x: any) => ({
        tallaNombre: x?.tallaNombre ?? x?.TallaNombre ?? undefined,
        colorNombre: x?.colorNombre ?? x?.ColorNombre ?? undefined,
        stock: x?.stock ?? x?.Stock ?? 0,
      }));
    })(),
    agotado: (() => {
      const v = p.variantes ?? p.Variantes ?? [];
      const stockGeneral = Number(p.stock ?? p.Stock ?? 0);
      if (Array.isArray(v) && v.length > 0) {
        const totalVariantes = v.reduce((s: number, x: any) => s + (x?.stock ?? x?.Stock ?? 0), 0);
        // Agotado solo si TANTO variantes como stock general son 0
        return totalVariantes <= 0 && stockGeneral <= 0;
      }
      return stockGeneral <= 0;
    })(),
    agotadoGeneral: p.agotadoGeneral ?? p.AgotadoGeneral ?? (p.stock ?? p.Stock ?? 0) <= 0,
    colores: (() => {
      const c = p.colores ?? p.Colores ?? [];
      return Array.isArray(c) ? c.map((x: any) => x?.nombre ?? x?.Nombre ?? String(x)).filter(Boolean) : [];
    })(),
    materiales: (() => {
      const m = p.materiales ?? p.Materiales ?? [];
      return Array.isArray(m) ? m.filter(Boolean) : [];
    })(),
    tipoProducto: p.tipoNombre ?? p.TipoNombre ?? p.tipoProducto ?? '',
    descripcion: p.descripcion ?? p.Descripcion ?? '',
    categoriaPrincipalID: p.categoriaPrincipalID ?? p.CategoriaPrincipalID,
    tipoProductoID: p.tipoProductoID ?? p.TipoProductoID,
    marcaID: p.marcaID ?? p.MarcaID,
  };
}

function extraerLista(raw: any): ProductoAdmin[] {
  // La API devuelve { success: true, data: [...] }
  const lista = raw?.data ?? raw;
  if (!Array.isArray(lista)) {
    console.warn('[Productos] respuesta inesperada:', raw);
    return [];
  }
  // DEBUG: log first product variantes from raw API
  if (lista.length > 0) {
    console.log('[API raw] primer producto variantes:', lista[0]?.variantes ?? lista[0]?.Variantes ?? 'NO FIELD');
  }
  return lista.map(mapProducto);
}

async function cargarDesdeApi(soloActivos = false): Promise<ProductoAdmin[]> {
  try {
    const path = soloActivos ? '/api/productos?estado=activo' : '/api/productos?estado=activo';
    if (getAccessToken()) {
      const raw = await getJson(path);
      return extraerLista(raw);
    } else {
      const res = await fetch(apiBase + '/api/productos?estado=activo', { cache: 'no-store' });
      if (!res.ok) return [];
      return extraerLista(await res.json());
    }
  } catch (e) {
    console.error('[Productos] error:', e);
    return [];
  }
}

// Para el dashboard: carga TODOS (activos + inactivos)
async function cargarTodosDesdeApi(): Promise<ProductoAdmin[]> {
  try {
    const token = getAccessToken();
    if (!token) return [];

    // Carga activos e inactivos en paralelo
    const [activos, inactivos] = await Promise.all([
      fetch(apiBase + '/api/productos?estado=activo', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      }).then(r => r.json()),
      fetch(apiBase + '/api/productos?estado=inactivo', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      }).then(r => r.json()),
    ]);

    const listaActivos = extraerLista(activos);
    const listaInactivos = extraerLista(inactivos).map(p => ({ ...p, activo: false }));

    return [...listaActivos, ...listaInactivos];
  } catch (e) {
    console.error('[Productos] error cargando todos:', e);
    return [];
  }
}

async function mutarProductoConId(method: string, path: string, body?: object): Promise<{ok: boolean, id?: number}> {
  try {
    const data = await fetchWithAuth(path, {
      method,
      body: body ? JSON.stringify(body) : undefined,
    });
    const id = data?.data?.productoID ?? data?.data?.ProductoID;
    return { ok: true, id };
  } catch (e: any) {
    console.error(`[Productos] ${method} ${path} error:`, e);
    return { ok: false };
  }
}

async function mutarProducto(method: string, path: string, body?: object): Promise<boolean> {
  try {
    await fetchWithAuth(path, {
      method,
      body: body ? JSON.stringify(body) : undefined,
    });
    return true;
  } catch (e: any) {
    console.error(`[Productos] ${method} ${path} error:`, e?.status, e?.data);
    return false;
  }
}

export const ProductosProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [productos, setProductos] = useState<ProductoAdmin[]>([]);
  const [loading, setLoading] = useState(false);

  const cargarProductos = async () => {
    setLoading(true);
    const lista = getAccessToken() ? await cargarTodosDesdeApi() : await cargarDesdeApi();
    console.log(`[Productos] cargados: ${lista.length}`);
    setProductos(lista);
    setLoading(false);
  };

  useEffect(() => {
    cargarProductos();

    const handleLogin = () => cargarProductos();
    const handleLogout = () => cargarProductos(); // recarga en modo público

    window.addEventListener('auth:login', handleLogin);
    window.addEventListener('auth:logout', handleLogout);
    return () => {
      window.removeEventListener('auth:login', handleLogin);
      window.removeEventListener('auth:logout', handleLogout);
    };
  }, []);

  const sincronizarTallasColores = async (
    id: string,
    tallas: string[],
    colores: string[],
    tallasCtx: any[],
    coloresCtx: any[]
  ) => {
    console.log('[Sync] tallas recibidas:', tallas, '| ctx:', tallasCtx.map((t:any)=>t.nombre));
    console.log('[Sync] colores recibidos:', colores, '| ctx:', coloresCtx.map((c:any)=>c.nombre));

    const tallaIDs = tallas
      .map(nombre => {
        const ctx = tallasCtx.find((t: any) => t.nombre === nombre);
        if (!ctx) return null;
        // Use stock from talla object if available (formato {nombre, stock})
        const stockVal = (nombre as any)?.stock ?? 10;
        return { TallaID: Number(ctx.id), Stock: stockVal };
      })
      .filter(Boolean);

    const colorIDs = colores
      .map(nombre => coloresCtx.find((c: any) => c.nombre === nombre))
      .filter(Boolean)
      .map((c: any) => Number(c.id));

    console.log('[Sync] tallaIDs a enviar:', tallaIDs);
    console.log('[Sync] colorIDs a enviar:', colorIDs);

    // Siempre sincronizar (incluso array vacío para limpiar)
    const okTallas = await mutarProducto('POST', `/api/productos/${id}/tallas`, { Tallas: tallaIDs });
    const okColores = await mutarProducto('POST', `/api/productos/${id}/colores`, { ColorIDs: colorIDs });
    if (!okTallas || !okColores) {
      toast.error('Error guardando tallas/colores. Verifica tu sesión e inténtalo de nuevo.');
    }
  };

  const sincronizarImagenes = async (
    id: string,
    imagenes: string[],
    imagenesPorColor?: Record<string, string[]>
  ) => {
    // Construir lista con ColorNombre para cada imagen
    const listaImagenes: {URL: string, ColorNombre?: string}[] = [];
    // Primero imágenes generales (sin color)
    imagenes.filter(Boolean).forEach(url => listaImagenes.push({ URL: url }));
    // Luego imágenes por color
    if (imagenesPorColor) {
      Object.entries(imagenesPorColor).forEach(([color, urls]) => {
        (urls || []).filter(Boolean).forEach(url => {
          // Solo agregar si no está ya en la lista
          if (!listaImagenes.find(i => i.URL === url)) {
            listaImagenes.push({ URL: url, ColorNombre: color });
          }
        });
      });
    }
    console.log('[Sync] imagenes a enviar:', listaImagenes);
    await mutarProducto('POST', `/api/productos/${id}/imagenes`, { Imagenes: listaImagenes });
  };

  const sincronizarMateriales = async (id: string, materiales: string[], materialesCtx: any[]) => {
    const materialIDs = materiales
      .map(nombre => materialesCtx.find((m: any) => m.nombre === nombre))
      .filter(Boolean)
      .map((m: any) => Number(m.id));
    console.log('[Sync] materialIDs a enviar:', materialIDs);
    await mutarProducto('POST', `/api/productos/${id}/materiales`, { MaterialIDs: materialIDs });
  };

  const sincronizarVariantes = async (id: string, variantes: {tallaNombre?: string; colorNombre?: string; stock: number}[]) => {
    if (!variantes.length) return;
    console.log('[Sync] variantes a enviar:', variantes);
    await mutarProducto('POST', `/api/productos/${id}/variantes`, { Variantes: variantes });
  };

  const crearProducto = async (
    payload: CreateProductoPayload,
    tallas?: string[],
    colores?: string[],
    tallasCtx?: any[],
    coloresCtx?: any[],
    imagenes?: string[],
    materiales?: string[],
    materialesCtx?: any[]
  ): Promise<number | false> => {
    const res = await mutarProductoConId('POST', '/api/productos', payload);
    if (res.ok && res.id) {
      await sincronizarTallasColores(String(res.id), tallas || [], colores || [], tallasCtx || [], coloresCtx || []);
      if (imagenes?.length || payload.imagenesPorColor) await sincronizarImagenes(String(res.id), imagenes || [], (payload as any).imagenesPorColor);
      if ((payload as any).variantes?.length) await sincronizarVariantes(String(res.id), (payload as any).variantes);
      if (materiales?.length && materialesCtx?.length) await sincronizarMateriales(String(res.id), materiales, materialesCtx);
      await cargarProductos();
      return res.id;
    }
    return false;
  };

  const actualizarProducto = async (
    id: string,
    payload: Partial<CreateProductoPayload & { Estado: string }>,
    tallas?: string[],
    colores?: string[],
    tallasCtx?: any[],
    coloresCtx?: any[],
    imagenes?: string[],
    materiales?: string[],
    materialesCtx?: any[]
  ): Promise<boolean> => {
    const ok = await mutarProducto('PUT', `/api/productos/${id}`, payload);
    if (ok) {
      // Only sync if explicitly provided (undefined means "don't touch")
      if (tallas !== undefined) await sincronizarTallasColores(id, tallas, colores || [], tallasCtx || [], coloresCtx || []);
      if (imagenes !== undefined) await sincronizarImagenes(id, imagenes, (payload as any).imagenesPorColor);
      if ((payload as any).variantes !== undefined) await sincronizarVariantes(id, (payload as any).variantes);
      if (materiales !== undefined && materialesCtx?.length) await sincronizarMateriales(id, materiales, materialesCtx);
      await cargarProductos();
    }
    return ok;
  };

  const eliminarProducto = async (id: string) => {
    try {
      await fetchWithAuth(`/api/productos/${id}`, { method: 'DELETE' });
      await cargarProductos();
    } catch (e: any) {
      const msg = e?.data?.message || e?.data?.error || 'No se puede eliminar este producto. Puede tener pedidos u órdenes asociadas.';
      throw new Error(msg);
    }
  };

  const obtenerProducto = (id: string) => productos.find(p => p.id === id);

  return (
    <ProductosContext.Provider value={{
      productos, loading,
      crearProducto, actualizarProducto, eliminarProducto,
      obtenerProducto, recargar: cargarProductos,
    }}>
      {children}
    </ProductosContext.Provider>
  );
};