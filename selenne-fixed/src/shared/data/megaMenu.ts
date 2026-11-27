import type { Categoria } from "../hooks/useCatalogoFiltrado";
import type { Subcategoria } from "../contexts/SubcategoriasContext";

export interface SubcategoriaMenu {
  /** Clave usada en la URL (?sub=...) y para filtrar por tipoProducto. */
  clave: string;
  /** Texto mostrado en el menú. */
  etiqueta: string;
  /** Nombre real del Tipo de Producto (tal cual se guarda en el producto). */
  tipoNombre: string;
}

export interface CategoriaMenu {
  categoria: Categoria;
  etiqueta: string;
  subcategorias: SubcategoriaMenu[];
}

const ETIQUETAS: Record<Categoria, string> = {
  hombre: "Hombre",
  mujer: "Mujer",
  accesorios: "Accesorios",
  sale: "Sale",
};

const slugificar = (nombre: string) =>
  nombre.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

/**
 * Construye el menú de subcategorías de una categoría a partir de los Tipos
 * de Producto reales (admin > Catálogo > Tipos de Producto), en vez de una
 * lista fija en código — así un tipo nuevo aparece solo en el filtro/menú
 * de las categorías donde se marcó que aplica (o en todas si no se marcó
 * ninguna).
 */
export function buildCategoriaMenu(categoria: Categoria, tiposProducto: Subcategoria[]): CategoriaMenu {
  const subcategorias = tiposProducto
    .filter((t) => {
      const claves = (t.categoriasAplicables || "").split(",").filter(Boolean);
      return claves.length === 0 || claves.includes(categoria);
    })
    .map((t) => ({ clave: slugificar(t.nombre), etiqueta: t.nombre, tipoNombre: t.nombre.toLowerCase() }));
  return { categoria, etiqueta: ETIQUETAS[categoria], subcategorias };
}

/** ¿El tipoProducto de un producto pertenece a esta subcategoría del menú? */
export function coincideSubcategoria(sub: SubcategoriaMenu, tipoProducto: string): boolean {
  return (tipoProducto || "").toLowerCase() === sub.tipoNombre;
}
