import React, { useState, useMemo, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  ShoppingBag,
  Heart,
  Search,
  User,
  Menu,
  X,
  Star,
  Minus,
  Plus,
  ChevronLeft,
  ChevronRight,
  Zap,
  LogIn,
  SlidersHorizontal,
  Package,
  Globe,
  Lock,
  Check,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { ThemeToggle } from "../../components/ThemeToggle";
import { Badge } from "../../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../../components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Separator } from "../../components/ui/separator";
import { StoreFooter } from "../../components/StoreFooter";
import { FiltrosPanel, type FiltrosAplicados } from "../../components/FiltrosPanel";
import { EstadoVacioProductos } from "../../components/EstadoVacioProductos";
import { ImageCarousel } from "../../components/figma/ImageCarousel";
import { ResenasProducto } from "../../components/ResenasProducto";
import { Estrellas } from "../../components/Estrellas";
import { CarritoSheet } from "../../components/CarritoSheet";
import { FavoritosSheet } from "../../components/FavoritosSheet";
import { useProductosCombinados } from "../../shared/data/useProductosCombinados";
import { useProductos } from "../../shared/contexts/ProductosContext";
import { useTienda } from "../../shared/contexts/TiendaContext";
import { useSubcategorias } from "../../shared/contexts/SubcategoriasContext";
import { getJson } from "../../services/api";
import { formatCurrency } from "../../shared/utils";
import type { Producto } from "../../shared/contexts/TiendaContext";

type Categoria = "mujer" | "accesorios" | "sale";
type Vista = "home" | "tienda";

interface LandingViewProps {
  onNavigateToLogin: () => void;
  onNavigateToRegister: () => void;
  onNavigateToCheckout?: () => void;
  onNavigateToLoginForCheckout?: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onNavigateToLogin,
  onNavigateToRegister,
  onNavigateToCheckout,
  onNavigateToLoginForCheckout,
}) => {
  const [mostrarTelefono, setMostrarTelefono] = useState(false);
  const [telefonoContacto, setTelefonoContacto] = useState('+57 304 292 8493');
  const navigate = useNavigate();
  const { categoria: categoriaUrl } = useParams<{ categoria?: string }>();
  // La categoria y la vista viven en la URL (/, /tienda/:categoria), no en
  // estado local: asi son compartibles y el back/forward del navegador funciona.
  const categoriaActiva: Categoria = categoriaUrl === "accesorios" || categoriaUrl === "sale" ? categoriaUrl : "mujer";
  const vista: Vista = categoriaUrl ? "tienda" : "home";

  const irATienda = (categoria: Categoria) => {
    navigate(`/tienda/${categoria}`);
    window.scrollTo({ top: 0 });
  };
  const [busqueda, setBusqueda] = useState("");
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [tallaSeleccionada, setTallaSeleccionada] = useState("");
  const [colorSeleccionado, setColorSeleccionado] = useState("");
  const [cantidadSeleccionada, setCantidadSeleccionada] = useState(1);
  const [imagenActual, setImagenActual] = useState(0);
  const [ordenar, setOrdenar] = useState("destacados");
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
  const [favoritosOpen, setFavoritosOpen] = useState(false);
  const [carritoAbierto, setCarritoAbierto] = useState(false);
  const [busquedaModalAbierta, setBusquedaModalAbierta] = useState(false);
  const [busquedaModal, setBusquedaModal] = useState('');
  const [filtroTalla, setFiltroTalla] = useState<string[]>([]);
  const [filtroColor, setFiltroColor] = useState<string>("");
  const [filtroMaterial, setFiltroMaterial] = useState<string>("");
  const [filtroTipoProducto, setFiltroTipoProducto] = useState<string>("");
  const [filtroCategoriaRopa, setFiltroCategoriaRopa] = useState<string>("");
  const [filtroPrecioMin, setFiltroPrecioMin] = useState<number | null>(null);
  const [filtroPrecioMax, setFiltroPrecioMax] = useState<number | null>(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const PRODUCTOS_POR_PAGINA = 12;
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);

  const productosData = useProductosCombinados();
  const { loading: productosLoading } = useProductos();
  const { colores, tallas } = useSubcategorias();

  const {
    carritoItems,
    favoritos,
    agregarAlCarrito,
    removerDelCarrito,
    actualizarCantidad,
    toggleFavorito,
    esFavorito,
    getTotalCarrito,
  } = useTienda();

  const getColorHex = (colorNombre: string): string => {
    const color = colores.find(c => c.nombre.toLowerCase() === colorNombre.toLowerCase());
    return color?.hexColor || '#808080';
  };

  const productosParaFiltros = useMemo(() => {
    return productosData.filter((p) => {
      if (categoriaActiva === "sale") {
        return p.precioOriginal !== null && p.precioOriginal !== undefined;
      }
      return p.categoria === categoriaActiva;
    });
  }, [categoriaActiva, productosData]);

  const tallasDisponibles = useMemo(() => {
    return tallas.map(t => t.nombre);
  }, [tallas]);

  const favoritosValidos = useMemo(
    () => favoritos.filter(id => productosData.some(p => p.id === id)),
    [favoritos, productosData]
  );

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
      productos = productos.filter((p) =>
        p.nombre.toLowerCase().includes(busqueda.toLowerCase()),
      );
    }

    if (filtroTipoProducto && filtroTipoProducto !== "all") {
      const filtroLower = filtroTipoProducto.toLowerCase();
      productos = productos.filter((p) => (p.tipoProducto || "").toLowerCase() === filtroLower);
    }

    if (filtroCategoriaRopa && filtroCategoriaRopa !== "all") {
      const filtroCatLower = filtroCategoriaRopa.toLowerCase();
      productos = productos.filter((p) => (p.subcategoria || "").toLowerCase() === filtroCatLower);
    }

    if (filtroTalla.length > 0) {
      productos = productos.filter((p) => filtroTalla.some(t => p.tallas.includes(t)));
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
  }, [categoriaActiva, busqueda, ordenar, filtroTipoProducto, filtroCategoriaRopa, filtroTalla, filtroColor, filtroMaterial, filtroPrecioMin, filtroPrecioMax, productosData]);

  const maxPrecioGlobal = useMemo(() => {
    const precios = productosData.map(p => p.precio);
    return precios.length ? Math.max(...precios) : 1000000;
  }, [productosData]);

  // Destacados de la home: primeros productos del catalogo completo, sin
  // filtrar por categoria — es la vidriera antes de entrar a comprar.
  const destacados = useMemo(() => productosData.slice(0, 8), [productosData]);

  const contadorFiltros = useMemo(() => {
    let c = 0;
    if (filtroTipoProducto && filtroTipoProducto !== 'all') c++;
    if (filtroCategoriaRopa && filtroCategoriaRopa !== 'all') c++;
    if (filtroTalla.length > 0) c++;
    if (filtroColor) c++;
    if (filtroMaterial) c++;
    if (filtroPrecioMin !== null) c++;
    if (filtroPrecioMax !== null) c++;
    return c;
  }, [filtroTipoProducto, filtroCategoriaRopa, filtroTalla, filtroColor, filtroMaterial, filtroPrecioMin, filtroPrecioMax]);

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
    setBusqueda('');
    setFiltroTalla([]);
    setFiltroColor('');
    setFiltroMaterial('');
    setFiltroTipoProducto('');
    setFiltroCategoriaRopa('');
    setFiltroPrecioMin(null);
    setFiltroPrecioMax(null);
  };

  // Resetear página al cambiar filtros o categoría
  useEffect(() => { setPaginaActual(1); }, [categoriaActiva, busqueda, ordenar, filtroTipoProducto, filtroCategoriaRopa, filtroTalla, filtroColor, filtroMaterial, filtroPrecioMin, filtroPrecioMax]);

  const totalPaginasLanding = Math.ceil(productosFiltrados.length / PRODUCTOS_POR_PAGINA);
  const productosPaginaLanding = productosFiltrados.slice((paginaActual - 1) * PRODUCTOS_POR_PAGINA, paginaActual * PRODUCTOS_POR_PAGINA);

  useEffect(() => {
    getJson('/api/config/banco').then((d: { data?: { whatsapp?: string } }) => {
      if (d?.data?.whatsapp) {
        const n = d.data.whatsapp.replace(/\D/g, '');
        setTelefonoContacto(`+${n.slice(0, 2)} ${n.slice(2, 5)} ${n.slice(5, 8)} ${n.slice(8)}`);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (productoSeleccionado) {
      const productoActualizado = productosData.find(p => p.id === productoSeleccionado.id);
      if (productoActualizado) {
        setProductoSeleccionado(productoActualizado);
      }
    }
  }, [productosData]);

  useEffect(() => {
    if (productoSeleccionado) {
      if (productoSeleccionado.colores && productoSeleccionado.colores.length > 0) {
        setColorSeleccionado(prev => prev || (productoSeleccionado.colores?.[0] ?? ''));
      } else {
        setColorSeleccionado('');
      }
      setImagenActual(0);
    }
  }, [productoSeleccionado]);

  const cambiarImagen = (direccion: "prev" | "next") => {
    if (!productoSeleccionado?.imagenes) return;
    const totalImagenes = productoSeleccionado.imagenes.length;
    if (direccion === "prev") {
      setImagenActual((prev) => prev === 0 ? totalImagenes - 1 : prev - 1);
    } else {
      setImagenActual((prev) => prev === totalImagenes - 1 ? 0 : prev + 1);
    }
  };

  const formatPrecio = (precio: number) => formatCurrency(precio);

  // Abre el modal de detalle con la primera talla/color disponibles ya
  // preseleccionados. Compartido entre la grilla principal y Destacados.
  const abrirDetalleProducto = (producto: Producto, colorPreferido?: string) => {
    setProductoSeleccionado(producto);
    const colorIni = colorPreferido || producto.colores?.[0] || '';
    const tallasP: string[] = producto.tallas || [];
    const variantesP = producto.variantes || [];
    const tallaIni = tallasP.find((t: string) => {
      if (!variantesP.length) return true;
      const v = variantesP.find(x => x.tallaNombre === t && (!colorIni || x.colorNombre === colorIni));
      return v ? v.stock > 0 : true;
    });
    setTallaSeleccionada(tallaIni || tallasP[0] || 'Única');
    setColorSeleccionado(colorIni);
    setCantidadSeleccionada(1);
    setImagenActual(0);
  };

  const calcularDescuento = (precio: number, precioOriginal: number) => {
    const descuento = ((precioOriginal - precio) / precioOriginal) * 100;
    return Math.round(descuento);
  };

  const handleAgregarAlCarrito = () => {
    if (!productoSeleccionado || !tallaSeleccionada) return;
    agregarAlCarrito(productoSeleccionado, tallaSeleccionada, colorSeleccionado, cantidadSeleccionada);
  };

  const handleComprarAhora = () => {
    if (!productoSeleccionado || !tallaSeleccionada) return;
    agregarAlCarrito(productoSeleccionado, tallaSeleccionada, colorSeleccionado, cantidadSeleccionada);
    onNavigateToCheckout?.();
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#2a2029] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#FBF8F5] dark:bg-[#2a2029] border-b border-[#E7E0DA] dark:border-[#453840] shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                className="lg:hidden mr-1 sm:mr-2 p-2 hover:bg-[#EFD9DF] dark:hover:bg-[#3a2530] rounded-full"
                onClick={() => setMenuMovilAbierto(!menuMovilAbierto)}
                aria-label={menuMovilAbierto ? 'Cerrar menú' : 'Abrir menú'}
                aria-expanded={menuMovilAbierto}
              >
                {menuMovilAbierto ? (
                  <X className="w-6 h-6 text-[#241B22] dark:text-[#F5EDE9]" />
                ) : (
                  <Menu className="w-6 h-6 text-[#241B22] dark:text-[#F5EDE9]" />
                )}
              </button>
              <button
                onClick={() => { navigate("/"); window.scrollTo({ top: 0 }); }}
                className="flex items-center justify-center hover:opacity-75 transition-opacity"
                title="Selenne Boutique — Inicio"
              >
                <span className="text-lg sm:text-2xl font-medium tracking-[0.04em] text-[#241B22] dark:text-[#F5EDE9] whitespace-nowrap" style={{ fontFamily: '"Playfair Display", Georgia, "Iowan Old Style", "Palatino Linotype", "Times New Roman", serif' }}>
                  Selenne Boutique
                </span>
              </button>
            </div>

            {/* Navegación Desktop */}
            <nav className="hidden lg:flex items-center space-x-10">
              <button
                onClick={() => irATienda("mujer")}
                style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                className={`group relative py-2 text-[12px] tracking-[0.12em] uppercase font-semibold transition-opacity ${
                  vista === "tienda" && categoriaActiva === "mujer"
                    ? "text-[#A3395C] opacity-100"
                    : "text-[#241B22] dark:text-[#F5EDE9] opacity-70 hover:opacity-100"
                }`}
              >
                Mujer
                <span className={`absolute left-0 right-0 -bottom-0.5 h-[1.5px] bg-[#A3395C] origin-left transition-transform duration-300 ${vista === "tienda" && categoriaActiva === "mujer" ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`} />
              </button>
              <button
                onClick={() => irATienda("accesorios")}
                style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                className={`group relative py-2 text-[12px] tracking-[0.12em] uppercase font-semibold transition-opacity ${
                  vista === "tienda" && categoriaActiva === "accesorios"
                    ? "text-[#A3395C] opacity-100"
                    : "text-[#241B22] dark:text-[#F5EDE9] opacity-70 hover:opacity-100"
                }`}
              >
                Accesorios
                <span className={`absolute left-0 right-0 -bottom-0.5 h-[1.5px] bg-[#A3395C] origin-left transition-transform duration-300 ${vista === "tienda" && categoriaActiva === "accesorios" ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`} />
              </button>
              <button
                onClick={() => irATienda("sale")}
                style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                className={`group relative py-2 text-[12px] tracking-[0.12em] uppercase font-semibold transition-opacity ${
                  vista === "tienda" && categoriaActiva === "sale"
                    ? "text-[#A3395C] opacity-100"
                    : "text-[#241B22] dark:text-[#F5EDE9] opacity-70 hover:opacity-100"
                }`}
              >
                Sale
                <span className={`absolute left-0 right-0 -bottom-0.5 h-[1.5px] bg-[#A3395C] origin-left transition-transform duration-300 ${vista === "tienda" && categoriaActiva === "sale" ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`} />
              </button>
            </nav>

            {/* Acciones */}
            <div className="flex items-center space-x-0.5 sm:space-x-2">
              <ThemeToggle buttonClassName="p-1.5 sm:p-2 hover:bg-[#EFD9DF] dark:hover:bg-[#3a2530] rounded-full transition-colors" iconClassName="w-[18px] h-[18px] sm:w-5 sm:h-5 text-[#241B22] dark:text-[#F5EDE9]" />
              <Sheet open={busquedaModalAbierta} onOpenChange={v => { setBusquedaModalAbierta(v); if (!v) setBusquedaModal(''); }}>
                <SheetTrigger asChild>
                  <button
                    onClick={() => setBusquedaModal('')}
                    className="hidden md:flex items-center gap-2 rounded-full border border-[#E7E0DA] dark:border-[#453840] bg-white dark:bg-[#322631] pl-4 pr-3 py-2 w-[190px] text-left hover:border-[#A3395C] transition-colors"
                  >
                    <Search className="w-4 h-4 text-[#7d6f77] dark:text-[#b8a3ac] flex-shrink-0" />
                    <span className="text-[13px] text-[#7d6f77] dark:text-[#b8a3ac]" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
                      Buscar productos…
                    </span>
                  </button>
                </SheetTrigger>
                <SheetTrigger asChild>
                  <button
                    onClick={() => setBusquedaModal('')}
                    className="md:hidden p-1.5 sm:p-2 hover:bg-[#EFD9DF] dark:hover:bg-[#3a2530] rounded-full transition-colors"
                    title="Buscar"
                    aria-label="Buscar"
                  >
                    <Search className="w-[18px] h-[18px] sm:w-6 sm:h-6 text-[#241B22] dark:text-[#F5EDE9]" />
                  </button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
                  <SheetHeader className="px-4 py-3 border-b border-gray-100 dark:border-[#453840]">
                    <SheetTitle style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>Buscar</SheetTitle>
                  </SheetHeader>
                  <div className="mt-0 flex flex-col gap-0 flex-1 overflow-hidden">
                    <div className="flex items-center gap-2 border-b border-gray-200 dark:border-[#453840] px-4 py-3">
                      <Search className="w-5 h-5 text-gray-400 dark:text-[#b8a3ac] flex-shrink-0" />
                      <input
                        autoFocus
                        type="text"
                        value={busquedaModal}
                        onChange={e => setBusquedaModal(e.target.value)}
                        placeholder="Buscar productos..."
                        className="flex-1 text-sm outline-none text-gray-900 dark:text-[#F5EDE9] placeholder-gray-400 dark:placeholder-[#b8a3ac] bg-transparent"
                        style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                      />
                      {busquedaModal && (
                        <button onClick={() => setBusquedaModal('')} className="text-gray-400 hover:text-gray-600 dark:text-[#b8a3ac] dark:hover:text-[#F5EDE9]">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="overflow-y-auto flex-1">
                      {busquedaModal.trim() === '' ? (
                        <p className="text-center text-sm text-gray-400 dark:text-[#b8a3ac] py-10">Empieza a escribir para buscar productos</p>
                      ) : (() => {
                        const resultados = productosData.filter(p =>
                          p.nombre.toLowerCase().includes(busquedaModal.toLowerCase()) ||
                          (p.descripcion || '').toLowerCase().includes(busquedaModal.toLowerCase())
                        );
                        return resultados.length === 0 ? (
                          <p className="text-center text-sm text-gray-400 dark:text-[#b8a3ac] py-10">Sin resultados para "{busquedaModal}"</p>
                        ) : (
                          <div>
                            {resultados.map(p => (
                              <button key={p.id} type="button"
                                onClick={() => {
                                  setProductoSeleccionado(p);
                                  setTallaSeleccionada(p.tallas[0] || '');
                                  setColorSeleccionado(p.colores?.[0] || '');
                                  setCantidadSeleccionada(1);
                                  setImagenActual(0);
                                  setBusquedaModalAbierta(false);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#362b34] transition-colors border-b border-gray-100 dark:border-[#453840] last:border-b-0"
                              >
                                <img src={p.imagen} alt={p.nombre} className="w-14 h-14 object-cover flex-shrink-0" />
                                <div className="flex-1 text-left min-w-0">
                                  <p className="text-sm font-medium text-gray-900 dark:text-[#F5EDE9] truncate" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>{p.nombre}</p>
                                  {p.descripcion && <p className="text-xs text-gray-400 dark:text-[#b8a3ac] truncate mt-0.5">{p.descripcion}</p>}
                                  <p className="text-sm font-bold text-gray-900 dark:text-[#F5EDE9] mt-0.5">{formatPrecio(p.precio)}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
              <Button
                variant="ghost"
                size="sm"
                onClick={onNavigateToLogin}
                className="hidden md:flex items-center gap-1 text-[#241B22] dark:text-[#F5EDE9] hover:text-[#A3395C] hover:bg-[#EFD9DF] dark:hover:bg-[#3a2530]"
                style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
              >
                <LogIn className="w-4 h-4" />
                Iniciar Sesión
              </Button>
              <Button
                size="sm"
                onClick={onNavigateToRegister}
                className="hidden md:flex text-white border-0 transition-transform hover:scale-105"
                style={{
                  fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
                  background: 'linear-gradient(90deg, #241B22 0%, #7a3350 55%, #A3395C 100%)',
                }}
              >
                Registrarse
              </Button>
              <button
                onClick={() => onNavigateToLogin()}
                className="md:hidden p-1.5 sm:p-2 hover:bg-[#EFD9DF] dark:hover:bg-[#3a2530] rounded-full transition-colors"
                aria-label="Iniciar sesión"
                title="Iniciar sesión"
              >
                <User className="w-[18px] h-[18px] sm:w-6 sm:h-6 text-[#241B22] dark:text-[#F5EDE9]" />
              </button>
              <FavoritosSheet
                open={favoritosOpen}
                onOpenChange={setFavoritosOpen}
                favoritos={favoritosValidos}
                productos={productosData}
                formatPrecio={formatPrecio}
                onQuitar={toggleFavorito}
                onVer={(prod) => {
                  const colorInicial = prod.colores?.[0] || '';
                  const primeraDisponible = prod.tallas?.find((t: string) => {
                    if (!prod.variantes?.length) return true;
                    const v = prod.variantes.find(x => x.tallaNombre === t && (!colorInicial || x.colorNombre === colorInicial));
                    return v ? v.stock > 0 : true;
                  });
                  setProductoSeleccionado(prod);
                  setTallaSeleccionada(primeraDisponible || prod.tallas?.[0] || 'Única');
                  setColorSeleccionado(colorInicial);
                  setFavoritosOpen(false);
                }}
                trigger={
                  <button
                    className="p-1.5 sm:p-2 hover:bg-[#EFD9DF] dark:hover:bg-[#3a2530] rounded-full transition-colors relative"
                    aria-label="Favoritos"
                    title="Favoritos"
                  >
                    <Heart className="w-[18px] h-[18px] sm:w-6 sm:h-6 text-[#241B22] dark:text-[#F5EDE9]" />
                    {favoritosValidos.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-[#A3395C] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {favoritosValidos.length}
                      </span>
                    )}
                  </button>
                }
              />
              <CarritoSheet
                open={carritoAbierto}
                onOpenChange={setCarritoAbierto}
                items={carritoItems}
                formatPrecio={formatPrecio}
                total={getTotalCarrito()}
                onActualizarCantidad={actualizarCantidad}
                onRemover={removerDelCarrito}
                onCheckout={() => onNavigateToCheckout?.()}
                onVerProducto={(item) => {
                  const fullProduct = productosData.find(p => p.id === item.id);
                  setProductoSeleccionado(fullProduct || item);
                  setTallaSeleccionada(item.tallaSeleccionada);
                  setColorSeleccionado(item.colorSeleccionado || "");
                  setCantidadSeleccionada(item.cantidad);
                  setImagenActual(0);
                  setCarritoAbierto(false);
                }}
                trigger={
                  <button
                    className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-[#3a2530] rounded-lg transition-colors relative"
                    aria-label="Carrito"
                    title="Carrito"
                  >
                    <ShoppingBag className="w-[18px] h-[18px] sm:w-6 sm:h-6 text-gray-700 dark:text-[#F5EDE9]" />
                    {carritoItems.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-[#A3395C] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {carritoItems.length}
                      </span>
                    )}
                  </button>
                }
              />
            </div>
          </div>

          {/* Navegación Móvil */}
          {menuMovilAbierto && (
            <nav className="lg:hidden py-4 space-y-2 border-t border-gray-200 dark:border-[#453840]">
              <button
                onClick={() => { irATienda("mujer"); setMenuMovilAbierto(false); }}
                style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                className={`block w-full text-left px-4 py-2 rounded-lg ${
                  vista === "tienda" && categoriaActiva === "mujer" ? "bg-[#f8a9c5] text-white" : "text-gray-700 dark:text-[#F5EDE9] hover:bg-gray-100 dark:hover:bg-[#362b34]"
                }`}
              >
                Mujer
              </button>
              <button
                onClick={() => { irATienda("accesorios"); setMenuMovilAbierto(false); }}
                style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                className={`block w-full text-left px-4 py-2 rounded-lg ${
                  vista === "tienda" && categoriaActiva === "accesorios" ? "bg-[#f8a9c5] text-white" : "text-gray-700 dark:text-[#F5EDE9] hover:bg-gray-100 dark:hover:bg-[#362b34]"
                }`}
              >
                Accesorios
              </button>
              <button
                onClick={() => { irATienda("sale"); setMenuMovilAbierto(false); }}
                style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                className={`block w-full text-left px-4 py-2 rounded-lg ${
                  vista === "tienda" && categoriaActiva === "sale" ? "bg-[#f8a9c5] text-white" : "text-gray-700 dark:text-[#F5EDE9] hover:bg-gray-100 dark:hover:bg-[#362b34]"
                }`}
              >
                Sale
              </button>
              <Separator className="my-4" />
              <Button
                variant="default"
                className="w-full text-white border-0"
                style={{ background: 'linear-gradient(90deg, #241B22 0%, #7a3350 55%, #A3395C 100%)' }}
                onClick={onNavigateToLogin}
              >
                <LogIn className="w-4 h-4 mr-2" />
                Iniciar Sesión
              </Button>
              <Button
                variant="outline"
                className="w-full border-[#A3395C] text-[#A3395C] hover:bg-[#EFD9DF] dark:hover:bg-[#3a2530]"
                onClick={onNavigateToRegister}
              >
                Registrarse
              </Button>
            </nav>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {vista === "home" && (
        <>
        {/* Hero de marca */}
        <section
          className="relative flex items-center justify-center text-center px-4 py-24 sm:py-32 overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #241B22 0%, #7a3350 55%, #A3395C 100%)' }}
        >
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <h1
              style={{ fontFamily: '"Playfair Display", Georgia, "Iowan Old Style", "Palatino Linotype", "Times New Roman", serif' }}
              className="text-white text-4xl sm:text-6xl mb-4"
            >
              Selenne Boutique
            </h1>
            <p
              style={{ fontFamily: '"Playfair Display", Georgia, "Iowan Old Style", "Palatino Linotype", "Times New Roman", serif' }}
              className="text-white/85 text-base sm:text-lg italic mb-8"
            >
              Prendas que realzan tu belleza y te acompañan a brillar en cada momento
            </p>
            <button
              onClick={() => irATienda(categoriaActiva)}
              style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
              className="bg-white text-[#241B22] px-8 py-3 text-xs font-bold tracking-widest uppercase hover:scale-[1.03] transition-transform"
            >
              Ver colección
            </button>
          </motion.div>
        </section>

        {/* Destacados */}
        {destacados.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
            <div className="flex items-end justify-between mb-6">
              <h2
                style={{ fontFamily: '"Playfair Display", Georgia, "Iowan Old Style", "Palatino Linotype", "Times New Roman", serif' }}
                className="text-2xl sm:text-3xl text-[#241B22] dark:text-[#F5EDE9]"
              >
                Destacados
              </h2>
              <button
                onClick={() => irATienda(categoriaActiva)}
                style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                className="text-xs font-bold tracking-widest text-[#A3395C] hover:text-[#8a2f45] transition-colors uppercase"
              >
                Ver todo →
              </button>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-4 sm:overflow-visible">
              {destacados.map((producto, indiceDestacado) => (
                <motion.button
                  key={producto.id}
                  onClick={() => abrirDetalleProducto(producto)}
                  initial={{ opacity: 0, y: 20, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.55, delay: indiceDestacado * 0.06, ease: [0.16, 1, 0.3, 1] }}
                  className="text-left flex-shrink-0 w-40 sm:w-auto group"
                >
                  <div className="rounded-xl overflow-hidden mb-2 border border-[#F0C9D9] dark:border-[#A3395C]/50 shadow-sm transition-shadow duration-300 group-hover:shadow-lg">
                    <img
                      src={producto.imagen}
                      alt={producto.nombre}
                      className="w-full h-52 sm:h-64 object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>
                  <p
                    style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                    className="text-sm text-gray-900 dark:text-[#F5EDE9] truncate transition-colors group-hover:text-[#A3395C] dark:group-hover:text-[#e0879c]"
                  >
                    {producto.nombre}
                  </p>
                  <p
                    style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                    className="text-sm text-[#A3395C]"
                  >
                    {formatPrecio(producto.precio)}
                  </p>
                </motion.button>
              ))}
            </div>
          </section>
        )}
        </>
        )}

        {vista === "tienda" && (
        <>
        {/* Banner de categoría */}
        <div className="w-full relative overflow-hidden" style={{ aspectRatio: '1750 / 899' }}>
          <AnimatePresence>
            <motion.img
              key={categoriaActiva}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              src={
                categoriaActiva === "mujer"
                  ? "/banners/banner-mujer.webp"
                  : categoriaActiva === "accesorios"
                  ? "/banners/banner-accesorios.webp"
                  : "/banners/banner-sale.webp"
              }
              alt={categoriaActiva}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </AnimatePresence>
        </div>

        {/* Barra de Búsqueda y Filtros */}
        <div className="bg-white dark:bg-[#2a2029] border-b border-gray-200 dark:border-[#453840]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between gap-3">
              <Select value={ordenar} onValueChange={setOrdenar}>
                <SelectTrigger className="w-52 bg-white dark:bg-[#322631] dark:text-[#F5EDE9] dark:border-[#453840] h-9 text-sm" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="destacados">Ordenar: Destacados</SelectItem>
                  <SelectItem value="precio-menor">Precio: Menor a Mayor</SelectItem>
                  <SelectItem value="precio-mayor">Precio: Mayor a Menor</SelectItem>
                  <SelectItem value="nombre">Nombre A-Z</SelectItem>
                </SelectContent>
              </Select>
              <button onClick={() => setFiltrosAbiertos(true)}
                style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-[#453840] dark:text-[#F5EDE9] rounded-lg text-sm font-medium hover:border-gray-900 dark:hover:border-[#A3395C] transition-colors">
                <SlidersHorizontal className="w-4 h-4" />
                FILTROS
                {contadorFiltros > 0 && (
                  <span className="bg-black text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">{contadorFiltros}</span>
                )}
              </button>
            </div>
          </div>
        </div>

        <FiltrosPanel
          abierto={filtrosAbiertos}
          onClose={() => setFiltrosAbiertos(false)}
          tallasDisponibles={tallasDisponibles}
          tiposProductoDisponibles={tiposProductoDisponibles}
          categoriasRopaDisponibles={categoriasRopaDisponibles}
          coloresDisponibles={coloresDisponibles}
          materialesDisponibles={materialesDisponibles}
          maxPrecioGlobal={maxPrecioGlobal}
          filtroPrecioMin={filtroPrecioMin}
          filtroPrecioMax={filtroPrecioMax}
          filtroTalla={filtroTalla}
          filtroTipoProducto={filtroTipoProducto}
          filtroCategoriaRopa={filtroCategoriaRopa}
          filtroColor={filtroColor}
          filtroMaterial={filtroMaterial}
          onAplicar={handleAplicarFiltros}
        />


        {/* Grid de Productos */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="mb-4 flex justify-between items-center">
            <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-gray-600 dark:text-[#b8a3ac]">
              {productosLoading
                ? 'Cargando productos…'
                : `${productosFiltrados.length} ${productosFiltrados.length === 1 ? 'producto encontrado' : 'productos encontrados'}`}
            </p>
          </div>

          {productosLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="w-full aspect-[3/4] bg-gray-200 dark:bg-[#362b34] rounded" />
                  <div className="h-4 bg-gray-200 dark:bg-[#362b34] rounded mt-3 w-3/4" />
                  <div className="h-4 bg-gray-200 dark:bg-[#362b34] rounded mt-2 w-1/2" />
                </div>
              ))}
            </div>
          ) : productosFiltrados.length === 0 ? (
            <EstadoVacioProductos
              busqueda={busqueda}
              hayFiltrosActivos={contadorFiltros > 0}
              onLimpiarTodo={limpiarTodosLosFiltros}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {productosPaginaLanding.map((producto, indiceProducto) => (
                <motion.div
                  key={producto.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: Math.min(indiceProducto, 8) * 0.05, ease: [0.16, 1, 0.3, 1] }}
                  className="group">
                  <div
                    onClick={() => abrirDetalleProducto(producto)}
                    className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-[#FBF8F5] dark:bg-[#2a2029] cursor-pointer"
                  >
                    <img
                      src={producto.imagen}
                      alt={producto.nombre}
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06] will-change-transform"
                      loading="lazy"
                      decoding="async"
                    />
                    {producto.badge && (
                      <Badge
                        className={`absolute top-3.5 left-3.5 border-0 backdrop-blur-sm ${
                          producto.badge === "Sale" ? "bg-red-500/90 hover:bg-red-500/90" : "bg-[#A3395C]/90 hover:bg-[#A3395C]/90"
                        }`}
                      >
                        {producto.badge}
                      </Badge>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleFavorito(producto.id); }}
                      title="Añadir a favoritos"
                      className="absolute top-3.5 right-3.5 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 dark:bg-[#241B22]/90 backdrop-blur-sm shadow-sm hover:scale-110 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A3395C] focus-visible:ring-offset-1"
                    >
                      <Heart className={`w-4 h-4 transition-colors ${esFavorito(producto.id) ? "fill-[#A3395C] text-[#A3395C]" : "text-gray-500 dark:text-[#b8a3ac]"}`} />
                    </button>
                    {producto.agotado ? (
                      <div className="absolute inset-0 bg-white/70 dark:bg-black/60 backdrop-blur-[1px] flex items-center justify-center">
                        <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="bg-[#241B22] text-white text-[11px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full">
                          Agotado
                        </span>
                      </div>
                    ) : (
                      <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            agregarAlCarrito(producto, producto.tallas[0] || 'Única', producto.colores?.[0] || '');
                            setCarritoAbierto(true);
                          }}
                          style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                          className="w-full flex items-center justify-center gap-2 bg-[#241B22]/95 dark:bg-[#A3395C]/95 backdrop-blur-sm text-white text-[11px] font-bold uppercase tracking-widest py-3 hover:bg-black dark:hover:bg-[#8a2e4d] transition-colors"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          Agregar al carrito
                        </button>
                      </div>
                    )}
                  </div>

                  <div onClick={() => abrirDetalleProducto(producto)} className="pt-3.5 cursor-pointer">
                    <h3
                      style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                      className="text-gray-900 dark:text-[#F5EDE9] text-[13px] font-medium mb-1 line-clamp-2 transition-colors group-hover:text-[#A3395C] dark:group-hover:text-[#e0879c]"
                    >
                      {producto.nombre}
                    </h3>
                    {(producto.totalValoraciones ?? 0) > 0 && (
                      <div className="mb-1.5">
                        <Estrellas valor={producto.rating ?? 0} size={11} />
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      {producto.precioOriginal ? (
                        <>
                          <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-[#A3395C] font-bold text-[15px]">
                            {formatPrecio(producto.precio)}
                          </span>
                          <span className="text-[13px] text-gray-400 dark:text-[#7d6f77] line-through">
                            {formatPrecio(producto.precioOriginal)}
                          </span>
                        </>
                      ) : (
                        <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-gray-900 dark:text-[#F5EDE9] font-bold text-[15px]">
                          {formatPrecio(producto.precio)}
                        </span>
                      )}
                    </div>
                    {producto.colores && producto.colores.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-2">
                        {producto.colores.slice(0, 5).map((color) => (
                          <button
                            key={color}
                            onClick={(e) => { e.stopPropagation(); abrirDetalleProducto(producto, color); }}
                            title={color}
                            className="w-[16px] h-[16px] rounded-full border border-black/10 dark:border-white/15 hover:scale-125 hover:ring-2 hover:ring-[#A3395C] hover:ring-offset-1 transition-all"
                            style={{ backgroundColor: getColorHex(color) }}
                          />
                        ))}
                        {producto.colores.length > 5 && (
                          <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-[10px] text-gray-400 dark:text-[#b8a3ac] font-medium">+{producto.colores.length - 5}</span>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Paginación */}
          {totalPaginasLanding > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8 mb-4">
              <button
                onClick={() => { setPaginaActual(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                disabled={paginaActual === 1}
                style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                className="px-5 py-2 text-sm border border-gray-300 dark:border-[#453840] dark:text-[#F5EDE9] rounded-lg hover:border-[#A3395C] hover:text-[#A3395C] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Anterior
              </button>
              <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-600 dark:text-[#b8a3ac]">
                {paginaActual} / {totalPaginasLanding}
              </span>
              <button
                onClick={() => { setPaginaActual(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                disabled={paginaActual === totalPaginasLanding}
                style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                className="px-5 py-2 text-sm border border-gray-300 dark:border-[#453840] dark:text-[#F5EDE9] rounded-lg hover:border-[#A3395C] hover:text-[#A3395C] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Siguiente →
              </button>
            </div>
          )}
        </div>
        </>
        )}
      </main>

      {/* Modal Detalle Producto */}
      <Dialog open={!!productoSeleccionado} onOpenChange={() => setProductoSeleccionado(null)}>
        <DialogContent className="max-w-4xl w-[92vw] sm:w-full p-0 overflow-y-auto sm:overflow-hidden rounded-2xl duration-300 data-[state=open]:slide-in-from-bottom-3" style={{ maxHeight: '90vh' }}>
          <DialogDescription className="sr-only">
            {productoSeleccionado?.nombre || "Detalle del Producto"}
          </DialogDescription>
          {productoSeleccionado && (() => {
            const imagenesPorColor = productoSeleccionado.imagenesPorColor || {};
            const imgsDelColor = colorSeleccionado ? (imagenesPorColor[colorSeleccionado] || []) : [];
            // Si el color elegido tiene su propio set de fotos, usar SOLO esas —
            // nunca mezclar con la foto principal ni con fotos de otros colores.
            const imgsGenerales = productoSeleccionado.imagenes && productoSeleccionado.imagenes.length > 0 ? productoSeleccionado.imagenes : [productoSeleccionado.imagen];
            const imgsForColor = imgsDelColor.length > 0
              ? [...new Set(imgsDelColor)]
              : [...new Set([productoSeleccionado.imagen, ...imgsGenerales].filter(Boolean))];
            return (
              <div className="flex flex-col sm:flex-row sm:max-h-[85vh]">
                {/* LEFT: Image panel */}
                <div className="relative w-full h-72 sm:w-[54%] sm:min-w-[54%] sm:h-auto flex-shrink-0 overflow-hidden rounded-t-2xl sm:rounded-t-none sm:rounded-l-2xl bg-[#FBF8F5] dark:bg-[#2a2029]">
                  <ImageCarousel
                    key={`${productoSeleccionado.id}-${colorSeleccionado || 'default'}`}
                    imagenes={imgsForColor}
                    nombre={productoSeleccionado.nombre}
                    className="w-full h-full"
                  />
                </div>

                {/* RIGHT: Details panel */}
                <div className="flex-1 flex flex-col gap-4 p-5 sm:p-8 sm:overflow-y-auto bg-white dark:bg-[#322631]">

                  {/* Name + Favorite */}
                  <div className="flex items-start justify-between gap-3">
                    <h2
                      style={{ fontFamily: '"Playfair Display", Georgia, "Iowan Old Style", "Palatino Linotype", "Times New Roman", serif' }}
                      className="text-2xl font-bold uppercase tracking-[0.01em] text-[#241B22] dark:text-[#F5EDE9] leading-tight"
                    >
                      {productoSeleccionado.nombre}
                    </h2>
                    <button
                      onClick={() => toggleFavorito(productoSeleccionado.id)}
                      title={esFavorito(productoSeleccionado.id) ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                      className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all flex-shrink-0 ${
                        esFavorito(productoSeleccionado.id)
                          ? 'border-[#A3395C] bg-[#A3395C] text-white'
                          : 'border-[#E7E0DA] dark:border-[#453840] text-[#7d6f77] dark:text-[#b8a3ac] hover:border-[#A3395C] hover:text-[#A3395C]'
                      }`}
                    >
                      <Heart className="w-4 h-4" fill={esFavorito(productoSeleccionado.id) ? 'currentColor' : 'none'} />
                    </button>
                  </div>

                  {/* Price + Rating */}
                  <div className="flex items-center justify-between -mt-2" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
                    <div className="flex items-baseline gap-3">
                      <span className="text-xl font-bold text-[#A3395C]">
                        {formatPrecio(productoSeleccionado.precio)}
                      </span>
                      {productoSeleccionado.precioOriginal && (
                        <>
                          <span className="text-sm text-[#7d6f77] dark:text-[#b8a3ac] line-through">
                            {formatPrecio(productoSeleccionado.precioOriginal)}
                          </span>
                          <span className="text-xs font-semibold text-red-500">
                            -{calcularDescuento(productoSeleccionado.precio, productoSeleccionado.precioOriginal)}%
                          </span>
                        </>
                      )}
                    </div>
                    <Estrellas valor={productoSeleccionado.rating ?? 0} total={productoSeleccionado.totalValoraciones ?? 0} size={13} />
                  </div>

                  {/* Trust row compacta */}
                  <div className="grid grid-cols-3 gap-1 bg-[#FBF8F5] dark:bg-[#2a2029] rounded-xl py-3 px-2">
                    <div className="flex flex-col items-center text-center gap-1.5 px-1">
                      <Package className="w-[16px] h-[16px] text-[#A3395C]" strokeWidth={1.75} />
                      <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-[9.5px] uppercase tracking-wide font-semibold text-[#7d6f77] dark:text-[#b8a3ac] leading-tight">3-5 días</span>
                    </div>
                    <div className="flex flex-col items-center text-center gap-1.5 px-1 border-x border-[#E7E0DA] dark:border-[#453840]">
                      <Globe className="w-[16px] h-[16px] text-[#A3395C]" strokeWidth={1.75} />
                      <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-[9.5px] uppercase tracking-wide font-semibold text-[#7d6f77] dark:text-[#b8a3ac] leading-tight">Todo el país</span>
                    </div>
                    <div className="flex flex-col items-center text-center gap-1.5 px-1">
                      <Lock className="w-[16px] h-[16px] text-[#A3395C]" strokeWidth={1.75} />
                      <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-[9.5px] uppercase tracking-wide font-semibold text-[#7d6f77] dark:text-[#b8a3ac] leading-tight">Pago seguro</span>
                    </div>
                  </div>

                  {/* Description */}
                  {productoSeleccionado.descripcion && (
                    <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-[#7d6f77] dark:text-[#b8a3ac] leading-relaxed">
                      {productoSeleccionado.descripcion}
                    </p>
                  )}

                  <Separator />

                  {/* Colors */}
                  {(() => {
                    const coloresProducto = productoSeleccionado.colores ?? [];
                    if (coloresProducto.length === 0) return null;
                    return (
                      <div>
                        <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-semibold text-[#241B22] dark:text-[#F5EDE9] mb-2">Color</p>
                        <div className="flex gap-3 flex-wrap">
                          {coloresProducto.map((color) => {
                            const hexColor = getColorHex(color);
                            const seleccionado = colorSeleccionado === color;
                            return (
                              <button
                                key={color}
                                onClick={() => {
                                  setColorSeleccionado(color);
                                  const imgsPorColor = productoSeleccionado.imagenesPorColor?.[color];
                                  if (imgsPorColor && imgsPorColor.length > 0) setImagenActual(0);
                                }}
                                className={`relative w-9 h-9 rounded-full border transition-all ${
                                  seleccionado
                                    ? 'border-[#241B22] dark:border-[#F5EDE9] scale-110'
                                    : 'border-[#E7E0DA] dark:border-[#453840] hover:scale-105'
                                }`}
                                style={{ backgroundColor: hexColor }}
                                title={color}
                              >
                                {seleccionado && (
                                  <span className="absolute inset-0 flex items-center justify-center">
                                    <Check className="w-4 h-4 drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]" style={{ color: '#fff' }} strokeWidth={3} />
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Sizes */}
                  {(() => {
                    const tallasProducto: string[] = productoSeleccionado.tallas || [];
                    const variantes = productoSeleccionado.variantes || [];
                    // tallasConStock nunca viene poblado en el objeto que produce useProductosCombinados
                    const tallasConStock: { nombre: string; stock: number }[] = [];
                    const stockGeneral: number = productoSeleccionado.stock ?? 0;
                    const tallasMostrar: string[] = tallasProducto;
                    if (tallasMostrar.length === 0) return null;
                    const todosVariantesCero = variantes.length > 0 && variantes.every(x => (x.stock ?? 0) <= 0);
                    return (
                      <div>
                        <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-semibold text-[#241B22] dark:text-[#F5EDE9] mb-2">Talla</p>
                        <div className="flex flex-wrap gap-2">
                          {tallasMostrar.map((talla) => {
                            let sinStock = false;
                            let stockDisponible: number;
                            if (talla === 'Única') {
                              sinStock = stockGeneral <= 0;
                              stockDisponible = stockGeneral;
                            } else if (variantes.length > 0 && !todosVariantesCero) {
                              const colorEfectivo = colorSeleccionado || (productoSeleccionado.colores?.length === 1 ? productoSeleccionado.colores[0] : null);
                              if (colorEfectivo) {
                                const v = variantes.find(x => x.tallaNombre === talla && x.colorNombre === colorEfectivo);
                                stockDisponible = v?.stock ?? 0;
                              } else {
                                stockDisponible = variantes.filter(x => x.tallaNombre === talla).reduce((s, x) => s + (x.stock ?? 0), 0);
                              }
                              sinStock = stockDisponible <= 0;
                            } else {
                              const tallaInfo = tallasConStock.find(t => t.nombre === talla);
                              const stockTalla = tallaInfo ? tallaInfo.stock : (stockGeneral > 0 ? stockGeneral : 10);
                              sinStock = stockTalla <= 0;
                              stockDisponible = stockTalla;
                            }
                            const seleccionada = tallaSeleccionada === talla;
                            return (
                              <button
                                key={talla}
                                type="button"
                                disabled={sinStock}
                                onClick={() => !sinStock && setTallaSeleccionada(talla)}
                                className={`min-w-10 h-10 px-3 rounded-full border text-sm font-medium transition-all ${
                                  sinStock
                                    ? 'border-[#E7E0DA] dark:border-[#453840] text-[#c3bab3] dark:text-[#5a4d52] bg-[#FBF8F5] dark:bg-[#2a2029] cursor-not-allowed line-through'
                                    : seleccionada
                                      ? 'border-[#241B22] bg-[#241B22] text-white'
                                      : 'border-[#E7E0DA] dark:border-[#453840] text-[#241B22] dark:text-[#F5EDE9] hover:border-[#A3395C]'
                                }`}
                                title={sinStock ? 'Agotado' : `${talla} — ${stockDisponible} disponibles`}
                              >
                                {talla}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Materials */}
                  {productoSeleccionado.materiales && productoSeleccionado.materiales.length > 0 && (
                    <div>
                      <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-semibold text-[#241B22] dark:text-[#F5EDE9] mb-2">Material</p>
                      <div className="flex flex-wrap gap-2">
                        {productoSeleccionado.materiales.map((material: string) => (
                          <span key={material} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="px-3 py-1 bg-[#EFD9DF] dark:bg-[#3a2530] text-xs font-medium text-[#A3395C] rounded-full">
                            {material}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Cantidad + Agregar al carrito */}
                  <div className="flex items-center gap-3 pt-3 mt-1 border-t border-[#E7E0DA] dark:border-[#453840]" style={{ flexShrink: 0, fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
                    <div className="flex items-center gap-1 bg-[#FBF8F5] dark:bg-[#2a2029] rounded-full border border-[#E7E0DA] dark:border-[#453840] p-1 flex-shrink-0">
                      <button
                        onClick={() => setCantidadSeleccionada(Math.max(1, cantidadSeleccionada - 1))}
                        className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#EFD9DF] dark:hover:bg-[#3a2530] transition-colors text-[#241B22] dark:text-[#F5EDE9]"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-semibold w-6 text-center text-[#241B22] dark:text-[#F5EDE9]">{cantidadSeleccionada}</span>
                      <button
                        onClick={() => setCantidadSeleccionada(cantidadSeleccionada + 1)}
                        className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#EFD9DF] dark:hover:bg-[#3a2530] transition-colors text-[#241B22] dark:text-[#F5EDE9]"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <button
                      disabled={productoSeleccionado.agotado}
                      onClick={handleAgregarAlCarrito}
                      className={`flex-1 h-11 rounded-full border text-xs font-semibold uppercase tracking-wider transition-all ${
                        productoSeleccionado.agotado
                          ? 'border-[#E7E0DA] dark:border-[#453840] text-[#c3bab3] dark:text-[#5a4d52] cursor-not-allowed'
                          : 'border-[#241B22] dark:border-[#F5EDE9] text-[#241B22] dark:text-[#F5EDE9] hover:bg-[#241B22] hover:text-white dark:hover:bg-[#F5EDE9] dark:hover:text-[#241B22]'
                      }`}
                    >
                      {productoSeleccionado.agotado ? 'Agotado' : 'Agregar al Carrito'}
                    </button>
                  </div>

                  {/* Comprar ahora — CTA principal */}
                  <button
                    disabled={productoSeleccionado.agotado}
                    onClick={handleComprarAhora}
                    style={productoSeleccionado.agotado ? { flexShrink: 0, fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' } : { flexShrink: 0, fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', background: 'linear-gradient(90deg, #241B22 0%, #7a3350 55%, #A3395C 100%)' }}
                    className={`w-full h-12 rounded-full text-xs font-semibold uppercase tracking-wider text-white transition-all ${
                      productoSeleccionado.agotado ? 'bg-[#E7E0DA] dark:bg-[#453840] cursor-not-allowed' : 'shadow-md hover:shadow-lg hover:scale-[1.01]'
                    }`}
                  >
                    {productoSeleccionado.agotado ? 'Agotado' : 'Comprar Ahora'}
                  </button>

                  <Separator />
                  <ResenasProducto
                    productoId={productoSeleccionado.id}
                    promedio={productoSeleccionado.rating ?? 0}
                    total={productoSeleccionado.totalValoraciones ?? 0}
                    puedeEscribir={false}
                  />
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>


      <StoreFooter telefonoContacto={telefonoContacto} onCategoriaChange={irATienda} />
    </div>
  );
};
