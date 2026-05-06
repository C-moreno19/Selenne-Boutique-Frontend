import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getJson, postJson, getAccessToken } from '../../services/api';
import { apiBase } from '../../services/api';

interface Subcategoria {
  id: string;
  nombre: string;
  hexColor?: string;
}

interface SubcategoriasContextType {
  colores: Subcategoria[];
  tallas: Subcategoria[];
  materiales: Subcategoria[];
  marcas: Subcategoria[];
  categorias: Subcategoria[];
  categoriasRopa: Subcategoria[];
  tiposProducto: Subcategoria[];
  agregarColor: (nombre: string, hexColor?: string) => Promise<void>;
  agregarTalla: (nombre: string) => Promise<void>;
  agregarMaterial: (nombre: string) => Promise<void>;
  agregarMarca: (nombre: string) => Promise<void>;
  agregarCategoria: (nombre: string) => Promise<void>;
  agregarCategoriaRopa: (nombre: string) => Promise<void>;
  agregarTipoProducto: (nombre: string) => Promise<void>;
  eliminarColor: (id: string) => Promise<void>;
  eliminarTalla: (id: string) => Promise<void>;
  eliminarMaterial: (id: string) => Promise<void>;
  eliminarMarca: (id: string) => Promise<void>;
  eliminarCategoria: (id: string) => Promise<void>;
  eliminarCategoriaRopa: (id: string) => Promise<void>;
  eliminarTipoProducto: (id: string) => Promise<void>;
  editarMaterial: (id: string, nombre: string) => Promise<void>;
  editarMarca: (id: string, nombre: string) => Promise<void>;
  editarCategoria: (id: string, nombre: string) => Promise<void>;
  editarTipoProducto: (id: string, nombre: string) => Promise<void>;
  recargar: () => Promise<void>;
}

const SubcategoriasContext = createContext<SubcategoriasContextType | undefined>(undefined);

function mapColor(c: any): Subcategoria {
  return { id: String(c.colorID ?? c.id), nombre: c.nombre, hexColor: c.codigoHex ?? c.hexColor };
}
function mapById(idField: string) {
  return (item: any): Subcategoria => ({ id: String(item[idField] ?? item.id), nombre: item.nombre });
}

function isLoggedIn(): boolean {
  return !!getAccessToken();
}

async function doGet(path: string): Promise<any[]> {
  try {
    const token = getAccessToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(apiBase + path, { headers });
    if (!res.ok) return [];
    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (data?.data && Array.isArray(data.data)) return data.data;
    return [];
  } catch { return []; }
}

async function doPost(path: string, body: object): Promise<any | null> {
  try {
    const data = await postJson(path, body);
    if (data?.data) return data.data;
    return data ?? null;
  } catch { return null; }
}

async function doPut(path: string, body: object): Promise<any | null> {
  try {
    const token = getAccessToken();
    const res = await fetch(apiBase + path, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.data) return data.data;
    return data ?? null;
  } catch { return null; }
}

async function doDelete(path: string): Promise<boolean> {
  try {
    const token = getAccessToken();
    const res = await fetch(apiBase + path, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
    return res.ok;
  } catch { return false; }
}

export const SubcategoriasProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [colores, setColores] = useState<Subcategoria[]>([]);
  const [tallas, setTallas] = useState<Subcategoria[]>([]);
  const [materiales, setMateriales] = useState<Subcategoria[]>([]);
  const [marcas, setMarcas] = useState<Subcategoria[]>([]);
  const [categorias, setCategorias] = useState<Subcategoria[]>([]);
  const [categoriasRopa, setCategoriasRopa] = useState<Subcategoria[]>([]);
  const [tiposProducto, setTiposProducto] = useState<Subcategoria[]>([]);

  const cargarTodo = async () => {
    const [c, t, mat, mar, cat, tip] = await Promise.all([
      doGet('/api/colores'),
      doGet('/api/tallas'),
      doGet('/api/materiales'),
      doGet('/api/marcas'),
      doGet('/api/categorias'),
      doGet('/api/tipos-producto'),
    ]);
    setColores(c.map(mapColor));
    setTallas(t.map(mapById('tallaID')));
    setMateriales(mat.map(mapById('materialID')));
    setMarcas(mar.map(mapById('marcaID')));
    setCategorias(cat.map(mapById('categoriaPrincipalID')));
    setCategoriasRopa(cat.map(mapById('categoriaPrincipalID')));
    setTiposProducto(tip.map(mapById('tipoProductoID')));
  };

  useEffect(() => {
    cargarTodo();

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'accessToken') cargarTodo();
    };
    const handleLogin = () => cargarTodo();
    window.addEventListener('storage', handleStorage);
    window.addEventListener('auth:login', handleLogin);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('auth:login', handleLogin);
    };
  }, []);

  const agregarColor = async (nombre: string, hexColor?: string) => {
    const n = await doPost('/api/colores', { nombre, codigoHex: hexColor });
    if (n) setColores(p => [...p, mapColor(n)]);
  };
  const eliminarColor = async (id: string) => {
    if (await doDelete(`/api/colores/${id}`)) setColores(p => p.filter(c => c.id !== id));
  };

  const agregarTalla = async (nombre: string) => {
    const n = await doPost('/api/tallas', { nombre, orden: 0 });
    if (n) setTallas(p => [...p, mapById('tallaID')(n)]);
  };
  const eliminarTalla = async (id: string) => {
    if (await doDelete(`/api/tallas/${id}`)) setTallas(p => p.filter(t => t.id !== id));
  };

  const agregarMaterial = async (nombre: string) => {
    const n = await doPost('/api/materiales', { nombre });
    if (n) setMateriales(p => [...p, mapById('materialID')(n)]);
  };
  const eliminarMaterial = async (id: string) => {
    if (await doDelete(`/api/materiales/${id}`)) setMateriales(p => p.filter(m => m.id !== id));
  };

  const agregarMarca = async (nombre: string) => {
    const n = await doPost('/api/marcas', { nombre });
    if (n) setMarcas(p => [...p, mapById('marcaID')(n)]);
  };
  const eliminarMarca = async (id: string) => {
    if (await doDelete(`/api/marcas/${id}`)) setMarcas(p => p.filter(m => m.id !== id));
  };

  const agregarCategoria = async (nombre: string) => {
    const n = await doPost('/api/categorias', { nombre });
    if (n) {
      const mapped = mapById('categoriaPrincipalID')(n);
      setCategorias(p => [...p, mapped]);
      setCategoriasRopa(p => [...p, mapped]);
    }
  };
  const eliminarCategoria = async (id: string) => {
    if (await doDelete(`/api/categorias/${id}`)) {
      setCategorias(p => p.filter(c => c.id !== id));
      setCategoriasRopa(p => p.filter(c => c.id !== id));
    }
  };

  const agregarTipoProducto = async (nombre: string) => {
    const n = await doPost('/api/tipos-producto', { nombre });
    if (n) setTiposProducto(p => [...p, mapById('tipoProductoID')(n)]);
  };
  const eliminarTipoProducto = async (id: string) => {
    if (await doDelete(`/api/tipos-producto/${id}`)) setTiposProducto(p => p.filter(t => t.id !== id));
  };

  const editarMaterial = async (id: string, nombre: string) => {
    const n = await doPut(`/api/materiales/${id}`, { nombre });
    if (n) setMateriales(p => p.map(m => m.id === id ? { ...m, nombre } : m));
  };
  const editarMarca = async (id: string, nombre: string) => {
    const n = await doPut(`/api/marcas/${id}`, { nombre });
    if (n) setMarcas(p => p.map(m => m.id === id ? { ...m, nombre } : m));
  };
  const editarCategoria = async (id: string, nombre: string) => {
    const n = await doPut(`/api/categorias/${id}`, { nombre });
    if (n) {
      setCategorias(p => p.map(c => c.id === id ? { ...c, nombre } : c));
      setCategoriasRopa(p => p.map(c => c.id === id ? { ...c, nombre } : c));
    }
  };
  const editarTipoProducto = async (id: string, nombre: string) => {
    const n = await doPut(`/api/tipos-producto/${id}`, { nombre });
    if (n) setTiposProducto(p => p.map(t => t.id === id ? { ...t, nombre } : t));
  };

  return (
    <SubcategoriasContext.Provider value={{
      colores, tallas, materiales, marcas, categorias, categoriasRopa, tiposProducto,
      agregarColor, agregarTalla, agregarMaterial, agregarMarca,
      agregarCategoria, agregarCategoriaRopa: agregarCategoria, agregarTipoProducto,
      eliminarColor, eliminarTalla, eliminarMaterial, eliminarMarca,
      eliminarCategoria, eliminarCategoriaRopa: eliminarCategoria, eliminarTipoProducto,
      editarMaterial, editarMarca, editarCategoria, editarTipoProducto,
      recargar: cargarTodo,
    }}>
      {children}
    </SubcategoriasContext.Provider>
  );
};

export const useSubcategorias = () => {
  const context = useContext(SubcategoriasContext);
  if (!context) throw new Error('useSubcategorias debe usarse dentro de SubcategoriasProvider');
  return context;
};