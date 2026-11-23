import type { Categoria } from "../hooks/useCatalogoFiltrado";

export interface SubcategoriaMenu {
  /** Clave usada en la URL (?sub=...) y para filtrar por tipoProducto. */
  clave: string;
  /** Texto mostrado en el menú. */
  etiqueta: string;
  /** Fragmentos (en minúscula) que matchean contra el tipoProducto real del producto. */
  match: string[];
}

export interface CategoriaMenu {
  categoria: Categoria;
  etiqueta: string;
  subcategorias: SubcategoriaMenu[];
}

// Estructura comercial simple: Hombre y Mujer comparten la misma organización,
// Accesorios tiene la suya. "Pantalones" incluye jeans como tipo de pantalón,
// no como categoría aparte.
const PRENDAS: SubcategoriaMenu[] = [
  { clave: "camisetas", etiqueta: "Camisetas", match: ["camiseta", "t-shirt", "tshirt"] },
  { clave: "camisas", etiqueta: "Camisas", match: ["camisa"] },
  { clave: "pantalones", etiqueta: "Pantalones", match: ["pantalon", "pantalón", "jean"] },
  { clave: "conjuntos", etiqueta: "Conjuntos", match: ["conjunto", "set"] },
];

const ACCESORIOS: SubcategoriaMenu[] = [
  { clave: "gorras", etiqueta: "Gorras", match: ["gorra", "cap"] },
  { clave: "bolsos", etiqueta: "Bolsos", match: ["bolso", "cartera", "bag"] },
  { clave: "otros", etiqueta: "Otros accesorios", match: [] },
];

export const MEGA_MENU: CategoriaMenu[] = [
  { categoria: "hombre", etiqueta: "Hombre", subcategorias: PRENDAS },
  { categoria: "mujer", etiqueta: "Mujer", subcategorias: PRENDAS },
  { categoria: "accesorios", etiqueta: "Accesorios", subcategorias: ACCESORIOS },
];

/** ¿El tipoProducto de un producto pertenece a esta subcategoría del menú? */
export function coincideSubcategoria(sub: SubcategoriaMenu, tipoProducto: string, categoria: CategoriaMenu): boolean {
  const t = (tipoProducto || "").toLowerCase();
  if (sub.clave === "otros") {
    // "Otros accesorios" = lo que no cae en ninguna subcategoría explícita de esa categoría.
    return !categoria.subcategorias.some((s) => s.clave !== "otros" && s.match.some((m) => t.includes(m)));
  }
  return sub.match.some((m) => t.includes(m));
}

export function getCategoriaMenu(categoria: Categoria): CategoriaMenu | undefined {
  return MEGA_MENU.find((c) => c.categoria === categoria);
}
