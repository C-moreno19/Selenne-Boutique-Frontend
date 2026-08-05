import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getJson, getAccessToken, apiBase, fetchWithAuth } from '../../services/api';
import { toast } from '@/lib/toast';
import type { Subcategoria } from './SubcategoriasContext';

// El backend responde en camelCase (ver comentario en mapProducto), pero el codigo
// defensivamente tambien acepta PascalCase por si algun endpoint viejo lo devuelve asi.
type RawImagenItem = string | { url?: string; URL?: string; colorNombre?: string; ColorNombre?: string };
type RawNombreItem = string | { nombre?: string; Nombre?: string };
type RawNombreStockItem = string | { nombre?: string; Nombre?: string; stock?: number; Stock?: number };
interface RawVarianteItem { tallaNombre?: string; TallaNombre?: string; colorNombre?: string; ColorNombre?: string; stock?: number; Stock?: number }

interface RawProducto {
  productoID?: number | string; ProductoID?: number | string; id?: number | string;
  codigo?: string; Codigo?: string;
  nombre?: string; Nombre?: string;
  categoriaNombre?: string; CategoriaNombre?: string; categoria?: string;
  estado?: string; Estado?: string;
  marcaNombre?: string; MarcaNombre?: string; marca?: string;
  precioVenta?: number; PrecioVenta?: number; precio?: number;
  precioCompra?: number; PrecioCompra?: number;
  precioOferta?: number; PrecioOferta?: number;
  stock?: number; Stock?: number;
  imagenPrincipal?: string; ImagenPrincipal?: string; imagen?: string;
  imagenes?: RawImagenItem[]; Imagenes?: RawImagenItem[];
  tallas?: RawNombreStockItem[]; Tallas?: RawNombreStockItem[];
  variantes?: RawVarianteItem[]; Variantes?: RawVarianteItem[];
  agotadoGeneral?: boolean; AgotadoGeneral?: boolean;
  colores?: RawNombreItem[]; Colores?: RawNombreItem[];
  materiales?: RawNombreItem[]; Materiales?: RawNombreItem[];
  tipoNombre?: string; TipoNombre?: string; tipoProducto?: string;
  descripcion?: string; Descripcion?: string;
  categoriaPrincipalID?: number; CategoriaPrincipalID?: number;
  tipoProductoID?: number; TipoProductoID?: number;
  marcaID?: number; MarcaID?: number;
}

interface ApiError { status?: number; data?: { message?: string; error?: string } | null }

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
  imagenesPorColor?: Record<string, string[]>;
  variantes?: { tallaNombre?: string; colorNombre?: string; stock: number }[];
}

interface ProductosContextType {
  productos: ProductoAdmin[];
  loading: boolean;
  crearProducto: (payload: CreateProductoPayload, tallas?: string[], colores?: string[], tallasCtx?: Subcategoria[], coloresCtx?: Subcategoria[], imagenes?: string[], materiales?: string[], materialesCtx?: Subcategoria[]) => Promise<number | false>;
  actualizarProducto: (id: string, payload: Partial<CreateProductoPayload & { Estado: string }>, tallas?: string[], colores?: string[], tallasCtx?: Subcategoria[], coloresCtx?: Subcategoria[], imagenes?: string[], materiales?: string[], materialesCtx?: Subcategoria[]) => Promise<boolean>;
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

function mapProducto(p: RawProducto): ProductoAdmin {
  // JSON de .NET viene en camelCase (productoID, categoriaNombre, etc.)
  const isSale = !!(p.precioOferta);
  const categoriaNombre = p.categoriaNombre ?? p.CategoriaNombre ?? p.categoria ?? '';
  const estadoRaw = p.estado ?? p.Estado ?? 'inactivo';
  const activoVal = estadoRaw === 'activo';

  const toHttps = (url: string) =>
    url ? url.replace('http://selenne-boutique-backend.onrender.com', 'https://selenne-boutique-backend.onrender.com') : url;

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
    imagen: toHttps(p.imagenPrincipal ?? p.ImagenPrincipal ?? p.imagen ?? ''),
    imagenes: (() => {
      const imgs = p.imagenes ?? p.Imagenes ?? [];
      if (!Array.isArray(imgs)) return [];
      return imgs
        .filter((i) => typeof i === 'string' || !(i.colorNombre ?? i.ColorNombre))
        .map((i) => toHttps(typeof i === 'string' ? i : (i.url ?? i.URL ?? '')))
        .filter(Boolean);
    })(),
    imagenesPorColor: (() => {
      const imgs = p.imagenes ?? p.Imagenes ?? [];
      if (!Array.isArray(imgs)) return {};
      const mapa: Record<string, string[]> = {};
      imgs.forEach((i) => {
        const url = toHttps(typeof i === 'string' ? i : (i.url ?? i.URL ?? ''));
        const color = typeof i === 'string' ? null : (i.colorNombre ?? i.ColorNombre ?? null);
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
      return Array.isArray(t) ? t.map((x) => (typeof x === 'string' ? x : (x.nombre ?? x.Nombre ?? String(x)))).filter(Boolean) : [];
    })(),
    tallasConStock: (() => {
      const t = p.tallas ?? p.Tallas ?? [];
      if (!Array.isArray(t)) return [];
      return t.map((x) => ({
        nombre: typeof x === 'string' ? x : (x.nombre ?? x.Nombre ?? String(x)),
        stock: typeof x === 'string' ? 10 : (x.stock ?? x.Stock ?? 10),
      })).filter((x) => x.nombre);
    })(),
    variantes: (() => {
      const v = p.variantes ?? p.Variantes ?? [];
      if (!Array.isArray(v)) return [];
      return v.map((x) => ({
        tallaNombre: x.tallaNombre ?? x.TallaNombre ?? undefined,
        colorNombre: x.colorNombre ?? x.ColorNombre ?? undefined,
        stock: x.stock ?? x.Stock ?? 0,
      }));
    })(),
    agotado: (() => {
      const v = p.variantes ?? p.Variantes ?? [];
      const stockGeneral = Number(p.stock ?? p.Stock ?? 0);
      if (Array.isArray(v) && v.length > 0) {
        const totalVariantes = v.reduce((s, x) => s + (x.stock ?? x.Stock ?? 0), 0);
        // Agotado solo si TANTO variantes como stock general son 0
        return totalVariantes <= 0 && stockGeneral <= 0;
      }
      return stockGeneral <= 0;
    })(),
    agotadoGeneral: p.agotadoGeneral ?? p.AgotadoGeneral ?? (p.stock ?? p.Stock ?? 0) <= 0,
    colores: (() => {
      const c = p.colores ?? p.Colores ?? [];
      return Array.isArray(c) ? c.map((x) => (typeof x === 'string' ? x : (x.nombre ?? x.Nombre ?? String(x)))).filter(Boolean) : [];
    })(),
    materiales: (() => {
      const m = p.materiales ?? p.Materiales ?? [];
      return Array.isArray(m) ? m.map((x) => (typeof x === 'string' ? x : (x.nombre ?? x.Nombre ?? String(x)))).filter(Boolean) : [];
    })(),
    tipoProducto: p.tipoNombre ?? p.TipoNombre ?? p.tipoProducto ?? '',
    descripcion: p.descripcion ?? p.Descripcion ?? '',
    categoriaPrincipalID: p.categoriaPrincipalID ?? p.CategoriaPrincipalID,
    tipoProductoID: p.tipoProductoID ?? p.TipoProductoID,
    marcaID: p.marcaID ?? p.MarcaID,
  };
}

function extraerLista(raw: unknown): ProductoAdmin[] {
  // La API devuelve { success: true, data: [...] }
  const obj = raw as { data?: unknown } | null | undefined;
  const lista = obj?.data ?? raw;
  if (!Array.isArray(lista)) {
    console.warn('[Productos] respuesta inesperada:', raw);
    return [];
  }

  return (lista as RawProducto[]).map(mapProducto);
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
    }) as { data?: { productoID?: number; ProductoID?: number } } | null;
    const id = data?.data?.productoID ?? data?.data?.ProductoID;
    return { ok: true, id };
  } catch (e) {
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
  } catch (e) {
    const err = e as ApiError;
    console.error(`[Productos] ${method} ${path} error:`, err?.status, err?.data);
    return false;
  }
}

export const ProductosProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [productos, setProductos] = useState<ProductoAdmin[]>([]);
  const [loading, setLoading] = useState(true);

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
    tallasCtx: Subcategoria[],
    coloresCtx: Subcategoria[]
  ) => {
    console.log('[Sync] tallas recibidas:', tallas, '| ctx:', tallasCtx.map(t => t.nombre));
    console.log('[Sync] colores recibidos:', colores, '| ctx:', coloresCtx.map(c => c.nombre));

    const tallaIDs = tallas
      .map(nombre => {
        const ctx = tallasCtx.find(t => t.nombre === nombre);
        if (!ctx) return null;
        // Use stock from talla object if available (formato {nombre, stock}); `nombre` es
        // string por firma, pero se preserva el chequeo duck-typed original por compatibilidad.
        const stockVal = (nombre as unknown as { stock?: number })?.stock ?? 10;
        return { TallaID: Number(ctx.id), Stock: stockVal };
      })
      .filter(Boolean);

    const colorIDs = colores
      .map(nombre => coloresCtx.find(c => c.nombre === nombre))
      .filter((c): c is Subcategoria => Boolean(c))
      .map(c => Number(c.id));

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

  const sincronizarMateriales = async (id: string, materiales: string[], materialesCtx: Subcategoria[]) => {
    const materialIDs = materiales
      .map(nombre => materialesCtx.find(m => m.nombre === nombre))
      .filter((m): m is Subcategoria => Boolean(m))
      .map(m => Number((m as unknown as { materialID?: number }).materialID ?? m.id));
    console.log('[Sync] materialIDs a enviar:', materialIDs);
    await mutarProducto('POST', `/api/productos/${id}/materiales`, { MaterialIDs: materialIDs });
  };

  const sincronizarVariantes = async (id: string, variantes: {tallaNombre?: string; colorNombre?: string; stock: number}[]) => {
    console.log('[Sync] variantes a enviar:', variantes);
    await mutarProducto('POST', `/api/productos/${id}/variantes`, { Variantes: variantes });
  };

  const crearProducto = async (
    payload: CreateProductoPayload,
    tallas?: string[],
    colores?: string[],
    tallasCtx?: Subcategoria[],
    coloresCtx?: Subcategoria[],
    imagenes?: string[],
    materiales?: string[],
    materialesCtx?: Subcategoria[]
  ): Promise<number | false> => {
    const res = await mutarProductoConId('POST', '/api/productos', payload);
    if (res.ok && res.id) {
      await sincronizarTallasColores(String(res.id), tallas || [], colores || [], tallasCtx || [], coloresCtx || []);
      if (imagenes?.length || payload.imagenesPorColor) await sincronizarImagenes(String(res.id), imagenes || [], payload.imagenesPorColor);
      if (payload.variantes?.length) await sincronizarVariantes(String(res.id), payload.variantes);
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
    tallasCtx?: Subcategoria[],
    coloresCtx?: Subcategoria[],
    imagenes?: string[],
    materiales?: string[],
    materialesCtx?: Subcategoria[]
  ): Promise<boolean> => {
    const ok = await mutarProducto('PUT', `/api/productos/${id}`, payload);
    if (ok) {
      // Only sync if explicitly provided (undefined means "don't touch")
      if (tallas !== undefined) await sincronizarTallasColores(id, tallas, colores || [], tallasCtx || [], coloresCtx || []);
      if (imagenes !== undefined) await sincronizarImagenes(id, imagenes, payload.imagenesPorColor);
      if (payload.variantes !== undefined) await sincronizarVariantes(id, payload.variantes);
      if (materiales !== undefined && materialesCtx?.length) await sincronizarMateriales(id, materiales, materialesCtx);
      await cargarProductos();
    }
    return ok;
  };

  const eliminarProducto = async (id: string) => {
    try {
      await fetchWithAuth(`/api/productos/${id}`, { method: 'DELETE' });
      setProductos(prev => prev.filter(p => p.id !== id));
    } catch (e) {
      const err = e as ApiError;
      const msg = err?.data?.message || err?.data?.error || 'No se puede eliminar este producto. Puede tener pedidos u órdenes asociadas.';
      throw new Error(msg, { cause: e });
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