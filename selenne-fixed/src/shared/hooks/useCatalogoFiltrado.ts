import { useEffect, useMemo, useState } from "react";
import { useProductosCombinados } from "../data/useProductosCombinados";
import { useProductos } from "../contexts/ProductosContext";
import { useSubcategorias } from "../contexts/SubcategoriasContext";
import { getCategoriaMenu, coincideSubcategoria } from "../data/megaMenu";
import type { FiltrosAplicados } from "../../components/FiltrosPanel";

export type Categoria = "hombre" | "mujer" | "accesorios" | "sale";

const PRODUCTOS_POR_PAGINA = 12;

/**
 * Catálogo filtrado + paginado, compartido entre LandingView y ClienteView
 * (antes duplicado casi byte a byte en los dos archivos).
 *
 * `subInicial` es la subcategoría del mega menú (p.ej. "camisetas") con la
 * que se debe abrir el catálogo al navegar desde el menú.
 */
export function useCatalogoFiltrado(categoriaActiva: Categoria, subInicial?: string) {
  const productosData = useProductosCombinados();
  const { loading: productosLoading } = useProductos();
  const { colores, tallas } = useSubcategorias();

  const [busqueda, setBusqueda] = useState("");
  const [ordenar, setOrdenar] = useState("destacados");
  const [filtroSubcategoria, setFiltroSubcategoria] = useState<string>(subInicial || "");
  const [filtroTalla, setFiltroTalla] = useState<string[]>([]);
  const [filtroColor, setFiltroColor] = useState<string>("");
  const [filtroMaterial, setFiltroMaterial] = useState<string>("");
  const [filtroTipoProducto, setFiltroTipoProducto] = useState<string>("");
  const [filtroCategoriaRopa, setFiltroCategoriaRopa] = useState<string>("");
  const [filtroPrecioMin, setFiltroPrecioMin] = useState<number | null>(null);
  const [filtroPrecioMax, setFiltroPrecioMax] = useState<number | null>(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);

  // Si se navega desde el mega menú con una subcategoría distinta, se adopta.
  useEffect(() => {
    setFiltroSubcategoria(subInicial || "");
  }, [categoriaActiva, subInicial]);

  const categoriaMenu = useMemo(() => getCategoriaMenu(categoriaActiva), [categoriaActiva]);

  const getColorHex = (colorNombre: string): string => {
    const color = colores.find((c) => c.nombre.toLowerCase() === colorNombre.toLowerCase());
    return color?.hexColor || "#808080";
  };

  const productosParaFiltros = useMemo(() => {
    return productosData.filter((p) => {
      if (categoriaActiva === "sale") {
        return p.precioOriginal !== null && p.precioOriginal !== undefined;
      }
      return p.categoria === categoriaActiva;
    });
  }, [categoriaActiva, productosData]);

  const tallasDisponibles = useMemo(() => tallas.map((t) => t.nombre), [tallas]);

  const coloresDisponibles = useMemo(() => {
    const set = new Set<string>();
    productosParaFiltros.forEach((p) => p.colores?.forEach((c) => set.add(c)));
    return Array.from(set);
  }, [productosParaFiltros]);

  const materialesDisponibles = useMemo(() => {
    const set = new Set<string>();
    productosParaFiltros.forEach((p) => {
      if (p.materiales) (Array.isArray(p.materiales) ? p.materiales : [p.materiales]).forEach((m: string) => set.add(m));
    });
    return Array.from(set);
  }, [productosParaFiltros]);

  const tiposProductoDisponibles = useMemo(() => {
    const set = new Set<string>();
    productosData.forEach((p) => set.add(p.tipoProducto));
    return Array.from(set).sort();
  }, [productosData]);

  const categoriasRopaDisponibles = useMemo(() => {
    const set = new Set<string>();
    productosParaFiltros.forEach((p) => {
      if (p.subcategoria) set.add(p.subcategoria);
    });
    return Array.from(set).sort();
  }, [productosParaFiltros]);

  const productosFiltrados = useMemo(() => {
    let productos = productosData.filter((p) => {
      if (categoriaActiva === "sale") {
        return p.precioOriginal !== null && p.precioOriginal !== undefined;
      }
      return p.categoria === categoriaActiva;
    });

    if (busqueda) {
      productos = productos.filter((p) => p.nombre.toLowerCase().includes(busqueda.toLowerCase()));
    }

    if (filtroTipoProducto && filtroTipoProducto !== "all") {
      const filtroLower = filtroTipoProducto.toLowerCase();
      productos = productos.filter((p) => (p.tipoProducto || "").toLowerCase() === filtroLower);
    }

    if (filtroSubcategoria && categoriaMenu) {
      const sub = categoriaMenu.subcategorias.find((s) => s.clave === filtroSubcategoria);
      if (sub) {
        productos = productos.filter((p) => coincideSubcategoria(sub, p.tipoProducto, categoriaMenu));
      }
    }

    if (filtroCategoriaRopa && filtroCategoriaRopa !== "all") {
      const filtroCatLower = filtroCategoriaRopa.toLowerCase();
      productos = productos.filter((p) => (p.subcategoria || "").toLowerCase() === filtroCatLower);
    }

    if (filtroTalla.length > 0) {
      productos = productos.filter((p) => filtroTalla.some((t) => p.tallas.includes(t)));
    }

    if (filtroColor && filtroColor !== "all") {
      productos = productos.filter((p) => p.colores?.includes(filtroColor));
    }

    if (filtroMaterial && filtroMaterial !== "all") {
      productos = productos.filter((p) => p.materiales && p.materiales.includes(filtroMaterial));
    }

    if (filtroPrecioMin !== null) {
      productos = productos.filter((p) => p.precio >= filtroPrecioMin);
    }
    if (filtroPrecioMax !== null) {
      productos = productos.filter((p) => p.precio <= filtroPrecioMax);
    }

    if (ordenar === "precio-menor") {
      productos.sort((a, b) => a.precio - b.precio);
    } else if (ordenar === "precio-mayor") {
      productos.sort((a, b) => b.precio - a.precio);
    } else if (ordenar === "nombre") {
      productos.sort((a, b) => a.nombre.localeCompare(b.nombre));
    }

    return productos;
  }, [categoriaActiva, busqueda, ordenar, filtroTipoProducto, filtroCategoriaRopa, filtroSubcategoria, categoriaMenu, filtroTalla, filtroColor, filtroMaterial, filtroPrecioMin, filtroPrecioMax, productosData]);

  const maxPrecioGlobal = useMemo(() => {
    const precios = productosData.map((p) => p.precio);
    return precios.length ? Math.max(...precios) : 1000000;
  }, [productosData]);

  // Destacados de la home: primeros productos del catalogo completo, sin
  // filtrar por categoria — es la vidriera antes de entrar a comprar.
  const destacados = useMemo(() => productosData.slice(0, 8), [productosData]);

  const contadorFiltros = useMemo(() => {
    let c = 0;
    if (filtroTipoProducto && filtroTipoProducto !== "all") c++;
    if (filtroCategoriaRopa && filtroCategoriaRopa !== "all") c++;
    if (filtroTalla.length > 0) c++;
    if (filtroColor) c++;
    if (filtroMaterial) c++;
    if (filtroPrecioMin !== null) c++;
    if (filtroPrecioMax !== null) c++;
    if (filtroSubcategoria) c++;
    return c;
  }, [filtroTipoProducto, filtroCategoriaRopa, filtroSubcategoria, filtroTalla, filtroColor, filtroMaterial, filtroPrecioMin, filtroPrecioMax]);

  const handleAplicarFiltros = (f: FiltrosAplicados) => {
    setFiltroPrecioMin(f.precioMin);
    setFiltroPrecioMax(f.precioMax);
    setFiltroTalla(f.talla);
    setFiltroTipoProducto(f.tipoProducto);
    setFiltroCategoriaRopa(f.categoriaRopa);
    setFiltroColor(f.color);
    setFiltroMaterial(f.material);
    setFiltrosAbiertos(false);
  };

  const limpiarTodosLosFiltros = () => {
    setBusqueda("");
    setFiltroTalla([]);
    setFiltroColor("");
    setFiltroMaterial("");
    setFiltroTipoProducto("");
    setFiltroCategoriaRopa("");
    setFiltroSubcategoria("");
    setFiltroPrecioMin(null);
    setFiltroPrecioMax(null);
  };

  // Resetear página al cambiar filtros o categoría
  useEffect(() => {
    setPaginaActual(1);
  }, [categoriaActiva, busqueda, ordenar, filtroTipoProducto, filtroCategoriaRopa, filtroSubcategoria, filtroTalla, filtroColor, filtroMaterial, filtroPrecioMin, filtroPrecioMax]);

  const totalPaginas = Math.ceil(productosFiltrados.length / PRODUCTOS_POR_PAGINA);
  const productosPagina = productosFiltrados.slice(
    (paginaActual - 1) * PRODUCTOS_POR_PAGINA,
    paginaActual * PRODUCTOS_POR_PAGINA
  );

  return {
    productosData,
    productosLoading,
    getColorHex,
    busqueda,
    ordenar,
    setOrdenar,
    filtrosAbiertos,
    setFiltrosAbiertos,
    filtroTalla,
    filtroColor,
    filtroMaterial,
    filtroTipoProducto,
    filtroCategoriaRopa,
    filtroSubcategoria,
    setFiltroSubcategoria,
    categoriaMenu,
    filtroPrecioMin,
    filtroPrecioMax,
    tallasDisponibles,
    coloresDisponibles,
    materialesDisponibles,
    tiposProductoDisponibles,
    categoriasRopaDisponibles,
    maxPrecioGlobal,
    destacados,
    contadorFiltros,
    productosFiltrados,
    paginaActual,
    setPaginaActual,
    totalPaginas,
    productosPagina,
    handleAplicarFiltros,
    limpiarTodosLosFiltros,
  };
}
