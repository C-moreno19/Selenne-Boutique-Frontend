import React, { useState, useMemo, useEffect } from "react";
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
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  Zap,
  LogIn,
  SlidersHorizontal,
  Package,
  Globe,
  Lock,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
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
import { useProductosCombinados } from "../../shared/data/useProductosCombinados";
import { useProductos } from "../../shared/contexts/ProductosContext";
import { useTienda } from "../../shared/contexts/TiendaContext";
import { useSubcategorias } from "../../shared/contexts/SubcategoriasContext";
import { getJson } from "../../services/api";
import { formatCurrency } from "../../shared/utils";
import type { Producto } from "../../shared/contexts/TiendaContext";

type Categoria = "mujer" | "accesorios" | "sale";

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
  const [categoriaActiva, setCategoriaActiva] = useState<Categoria>("mujer");
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
  const [mostrarModalLoginCarrito, setMostrarModalLoginCarrito] = useState(false);
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

  const contadorFiltros = useMemo(() => {
    let c = 0;
    if (filtroTipoProducto && filtroTipoProducto !== 'all') c++;
    if (filtroCategoriaRopa && filtroCategoriaRopa !== 'all') c++;
    if (filtroTalla.length > 0) c++;
    if (filtroPrecioMin !== null) c++;
    if (filtroPrecioMax !== null) c++;
    return c;
  }, [filtroTipoProducto, filtroCategoriaRopa, filtroTalla, filtroPrecioMin, filtroPrecioMax]);

  const handleAplicarFiltros = (f: FiltrosAplicados) => {
    setFiltroPrecioMin(f.precioMin);
    setFiltroPrecioMax(f.precioMax);
    setFiltroTalla(f.talla);
    setFiltroTipoProducto(f.tipoProducto);
    setFiltroCategoriaRopa(f.categoriaRopa);
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

  const calcularDescuento = (precio: number, precioOriginal: number) => {
    const descuento = ((precioOriginal - precio) / precioOriginal) * 100;
    return Math.round(descuento);
  };

  const handleAgregarAlCarrito = () => {
    if (!productoSeleccionado || !tallaSeleccionada) return;
    agregarAlCarrito(productoSeleccionado, tallaSeleccionada, colorSeleccionado, cantidadSeleccionada);
    setMostrarModalLoginCarrito(true);
  };

  const handleComprarAhora = () => {
    if (!productoSeleccionado || !tallaSeleccionada) return;
    agregarAlCarrito(productoSeleccionado, tallaSeleccionada, colorSeleccionado, cantidadSeleccionada);
    setMostrarModalLoginCarrito(true);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#FBF8F5] border-b border-[#E7E0DA] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <button
                className="lg:hidden mr-2 p-2 hover:bg-[#EFD9DF] rounded-full"
                onClick={() => setMenuMovilAbierto(!menuMovilAbierto)}
              >
                {menuMovilAbierto ? (
                  <X className="w-6 h-6 text-[#241B22]" />
                ) : (
                  <Menu className="w-6 h-6 text-[#241B22]" />
                )}
              </button>
              <button
                onClick={() => setCategoriaActiva("mujer")}
                className="flex items-center justify-center hover:opacity-75 transition-opacity"
                title="Selenne Boutique — Inicio"
              >
                <span className="text-2xl font-medium tracking-[0.04em] text-[#241B22]" style={{ fontFamily: '"Playfair Display", Georgia, "Iowan Old Style", "Palatino Linotype", "Times New Roman", serif' }}>
                  Selenne Boutique
                </span>
              </button>
            </div>

            {/* Navegación Desktop */}
            <nav className="hidden lg:flex items-center space-x-10">
              <button
                onClick={() => setCategoriaActiva("mujer")}
                style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                className={`group relative py-2 text-[12px] tracking-[0.12em] uppercase font-semibold transition-opacity ${
                  categoriaActiva === "mujer"
                    ? "text-[#A3395C] opacity-100"
                    : "text-[#241B22] opacity-70 hover:opacity-100"
                }`}
              >
                Mujer
                <span className={`absolute left-0 right-0 -bottom-0.5 h-[1.5px] bg-[#A3395C] origin-left transition-transform duration-300 ${categoriaActiva === "mujer" ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`} />
              </button>
              <button
                onClick={() => setCategoriaActiva("accesorios")}
                style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                className={`group relative py-2 text-[12px] tracking-[0.12em] uppercase font-semibold transition-opacity ${
                  categoriaActiva === "accesorios"
                    ? "text-[#A3395C] opacity-100"
                    : "text-[#241B22] opacity-70 hover:opacity-100"
                }`}
              >
                Accesorios
                <span className={`absolute left-0 right-0 -bottom-0.5 h-[1.5px] bg-[#A3395C] origin-left transition-transform duration-300 ${categoriaActiva === "accesorios" ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`} />
              </button>
              <button
                onClick={() => setCategoriaActiva("sale")}
                style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                className={`group relative py-2 text-[12px] tracking-[0.12em] uppercase font-semibold transition-opacity ${
                  categoriaActiva === "sale"
                    ? "text-[#A3395C] opacity-100"
                    : "text-[#241B22] opacity-70 hover:opacity-100"
                }`}
              >
                Sale
                <span className={`absolute left-0 right-0 -bottom-0.5 h-[1.5px] bg-[#A3395C] origin-left transition-transform duration-300 ${categoriaActiva === "sale" ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`} />
              </button>
            </nav>

            {/* Acciones */}
            <div className="flex items-center space-x-2">
              <Sheet open={busquedaModalAbierta} onOpenChange={v => { setBusquedaModalAbierta(v); if (!v) setBusquedaModal(''); }}>
                <SheetTrigger asChild>
                  <button
                    onClick={() => setBusquedaModal('')}
                    className="hidden md:flex items-center gap-2 rounded-full border border-[#E7E0DA] bg-white pl-4 pr-3 py-2 w-[190px] text-left hover:border-[#A3395C] transition-colors"
                  >
                    <Search className="w-4 h-4 text-[#7d6f77] flex-shrink-0" />
                    <span className="text-[13px] text-[#7d6f77]" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
                      Buscar productos…
                    </span>
                  </button>
                </SheetTrigger>
                <SheetTrigger asChild>
                  <button
                    onClick={() => setBusquedaModal('')}
                    className="md:hidden p-2 hover:bg-[#EFD9DF] rounded-full transition-colors"
                    title="Buscar"
                  >
                    <Search className="w-6 h-6 text-[#241B22]" />
                  </button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
                  <SheetHeader className="px-4 py-3 border-b border-gray-100">
                    <SheetTitle style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>Buscar</SheetTitle>
                  </SheetHeader>
                  <div className="mt-0 flex flex-col gap-0 flex-1 overflow-hidden">
                    <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-3">
                      <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      <input
                        autoFocus
                        type="text"
                        value={busquedaModal}
                        onChange={e => setBusquedaModal(e.target.value)}
                        placeholder="Buscar productos..."
                        className="flex-1 text-sm outline-none text-gray-900 placeholder-gray-400"
                        style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                      />
                      {busquedaModal && (
                        <button onClick={() => setBusquedaModal('')} className="text-gray-400 hover:text-gray-600">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="overflow-y-auto flex-1">
                      {busquedaModal.trim() === '' ? (
                        <p className="text-center text-sm text-gray-400 py-10">Empieza a escribir para buscar productos</p>
                      ) : (() => {
                        const resultados = productosData.filter(p =>
                          p.nombre.toLowerCase().includes(busquedaModal.toLowerCase()) ||
                          (p.descripcion || '').toLowerCase().includes(busquedaModal.toLowerCase())
                        );
                        return resultados.length === 0 ? (
                          <p className="text-center text-sm text-gray-400 py-10">Sin resultados para "{busquedaModal}"</p>
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
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                              >
                                <img src={p.imagen} alt={p.nombre} className="w-14 h-14 object-cover flex-shrink-0" />
                                <div className="flex-1 text-left min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>{p.nombre}</p>
                                  {p.descripcion && <p className="text-xs text-gray-400 truncate mt-0.5">{p.descripcion}</p>}
                                  <p className="text-sm font-bold text-gray-900 mt-0.5">{formatPrecio(p.precio)}</p>
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
                className="hidden md:flex items-center gap-1 text-[#241B22] hover:text-[#A3395C] hover:bg-[#EFD9DF]"
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
                className="md:hidden p-2 hover:bg-[#EFD9DF] rounded-full transition-colors"
              >
                <User className="w-6 h-6 text-[#241B22]" />
              </button>
              <Sheet open={favoritosOpen} onOpenChange={setFavoritosOpen}>
                <SheetTrigger asChild>
                  <button className="p-2 hover:bg-[#EFD9DF] rounded-full transition-colors relative">
                    <Heart className="w-6 h-6 text-[#241B22]" />
                    {favoritosValidos.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-[#A3395C] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {favoritosValidos.length}
                      </span>
                    )}
                  </button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
                      Favoritos
                    </SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    {favoritosValidos.length === 0 ? (
                      <div className="text-center py-12">
                        <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 mb-4">No tienes productos en favoritos</p>
                        <Button onClick={() => setFavoritosOpen(false)} className="w-full bg-[#d65391] text-white">
                          Seguir comprando
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {favoritosValidos.map((id) => {
                          const prod = productosData.find(p => p.id === id);
                          if (!prod) return null;
                          return (
                            <div key={id} className="flex items-center gap-3">
                              <img src={prod.imagen} alt={prod.nombre} className="w-16 h-16 object-cover rounded" />
                              <div className="flex-1">
                                <div className="flex justify-between items-center">
                                  <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-medium">{prod.nombre}</span>
                                  <span className="text-sm text-gray-600">{formatPrecio(prod.precio)}</span>
                                </div>
                                <div className="mt-2 flex gap-2">
                                  <Button size="sm" onClick={() => {
                                    setProductoSeleccionado(prod);
                                    const colorInicial = prod.colores?.[0] || '';
                                    const primeraDisponible = prod.tallas?.find((t: string) => {
                                      if (!prod.variantes?.length) return true;
                                      const v = prod.variantes.find(x => x.tallaNombre === t && (!colorInicial || x.colorNombre === colorInicial));
                                      return v ? v.stock > 0 : true;
                                    });
                                    setTallaSeleccionada(primeraDisponible || prod.tallas?.[0] || 'Única');
                                    setColorSeleccionado(colorInicial);
                                    setFavoritosOpen(false);
                                  }}>
                                    Ver
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => toggleFavorito(prod.id)}>
                                    Eliminar
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
              <Sheet open={carritoAbierto} onOpenChange={setCarritoAbierto}>
                <SheetTrigger asChild>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
                    <ShoppingBag className="w-6 h-6 text-gray-700" />
                    {carritoItems.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-[#d65391] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {carritoItems.length}
                      </span>
                    )}
                  </button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
                      Carrito de Compras
                    </SheetTitle>
                  </SheetHeader>
                  <div className="mt-8 space-y-4">
                    {carritoItems.length === 0 ? (
                      <div className="text-center py-12">
                        <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">Tu carrito está vacío</p>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-4">
                          {carritoItems.map((item) => (
                            <div
                              key={`${item.carritoID}`}
                              className="flex gap-4 bg-gray-50 p-3 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                              onClick={() => {
                                const fullProduct = productosData.find(p => p.id === item.id);
                                setProductoSeleccionado(fullProduct || item);
                                setTallaSeleccionada(item.tallaSeleccionada);
                                setColorSeleccionado(item.colorSeleccionado || "");
                                setCantidadSeleccionada(item.cantidad);
                                setImagenActual(0);
                              }}
                            >
                              <img
                                src={item.imagen}
                                alt={item.nombre}
                                className="w-20 h-20 object-cover rounded"
                              />
                              <div className="flex-1">
                                <h4 className="text-sm text-gray-900">{item.nombre}</h4>
                                <p className="text-xs text-gray-500">
                                  Talla: {item.tallaSeleccionada}
                                  {item.colorSeleccionado && ` | Color: ${item.colorSeleccionado}`}
                                </p>
                                <p className="text-sm text-[#d65391] mt-1">
                                  {formatPrecio(item.precio)}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  <button
                                    onClick={(e: React.MouseEvent) => {
                                      e.stopPropagation();
                                      actualizarCantidad(item.carritoID, item.cantidad - 1);
                                    }}
                                    className="p-1 hover:bg-gray-200 rounded"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="text-sm">{item.cantidad}</span>
                                  <button
                                    onClick={(e: React.MouseEvent) => {
                                      e.stopPropagation();
                                      actualizarCantidad(item.carritoID, item.cantidad + 1);
                                    }}
                                    className="p-1 hover:bg-gray-200 rounded"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={(e: React.MouseEvent) => {
                                      e.stopPropagation();
                                      removerDelCarrito(item.carritoID);
                                    }}
                                    className="ml-auto text-xs text-red-500 hover:text-red-700"
                                  >
                                    Eliminar
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <Separator />
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Subtotal:</span>
                            <span className="text-gray-900">{formatPrecio(getTotalCarrito())}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Envío:</span>
                            <span className="text-gray-900">Gratis</span>
                          </div>
                          <Separator />
                          <div className="flex justify-between">
                            <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-lg text-gray-900">
                              Total:
                            </span>
                            <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-lg text-[#d65391]">
                              {formatPrecio(getTotalCarrito())}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-3 text-center">*IVA incluido en el precio</p>
                        </div>
                        <Button
                          onClick={() => {
                            setCarritoAbierto(false);
                            setMostrarModalLoginCarrito(true);
                          }}
                          className="w-full bg-black hover:bg-gray-800 text-white h-11"
                          style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                        >
                          Proceder al Pago
                        </Button>
                      </>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Navegación Móvil */}
          {menuMovilAbierto && (
            <nav className="lg:hidden py-4 space-y-2 border-t border-gray-200">
              <button
                onClick={() => { setCategoriaActiva("mujer"); setMenuMovilAbierto(false); }}
                style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                className={`block w-full text-left px-4 py-2 rounded-lg ${
                  categoriaActiva === "mujer" ? "bg-[#f8a9c5] text-white" : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                Mujer
              </button>
              <button
                onClick={() => { setCategoriaActiva("accesorios"); setMenuMovilAbierto(false); }}
                style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                className={`block w-full text-left px-4 py-2 rounded-lg ${
                  categoriaActiva === "accesorios" ? "bg-[#f8a9c5] text-white" : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                Accesorios
              </button>
              <button
                onClick={() => { setCategoriaActiva("sale"); setMenuMovilAbierto(false); }}
                style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                className={`block w-full text-left px-4 py-2 rounded-lg ${
                  categoriaActiva === "sale" ? "bg-[#f8a9c5] text-white" : "text-gray-700 hover:bg-gray-100"
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
                className="w-full border-[#A3395C] text-[#A3395C] hover:bg-[#EFD9DF]"
                onClick={onNavigateToRegister}
              >
                Registrarse
              </Button>
            </nav>
          )}
        </div>
      </header>

      <div className="flex-1 flex flex-col">
        {/* Bienvenida de marca */}
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center py-4 px-4 bg-[#FBF8F5]"
        >
          <p
            style={{ fontFamily: '"Playfair Display", Georgia, "Iowan Old Style", "Palatino Linotype", "Times New Roman", serif' }}
            className="text-sm sm:text-base italic text-[#7a3350]"
          >
            Prendas que realzan tu belleza y te acompañan a brillar en cada momento
          </p>
        </motion.div>

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
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between gap-3">
              <Select value={ordenar} onValueChange={setOrdenar}>
                <SelectTrigger className="w-52 bg-white h-9 text-sm" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
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
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:border-gray-900 transition-colors">
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
          maxPrecioGlobal={maxPrecioGlobal}
          filtroPrecioMin={filtroPrecioMin}
          filtroPrecioMax={filtroPrecioMax}
          filtroTalla={filtroTalla}
          filtroTipoProducto={filtroTipoProducto}
          filtroCategoriaRopa={filtroCategoriaRopa}
          onAplicar={handleAplicarFiltros}
        />


        {/* Grid de Productos */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="mb-4 flex justify-between items-center">
            <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-gray-600">
              {productosLoading ? 'Cargando productos…' : `${productosFiltrados.length} productos encontrados`}
            </p>
          </div>

          {productosLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="w-full aspect-[3/4] bg-gray-200 rounded" />
                  <div className="h-4 bg-gray-200 rounded mt-3 w-3/4" />
                  <div className="h-4 bg-gray-200 rounded mt-2 w-1/2" />
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
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: Math.min(indiceProducto, 8) * 0.04 }}
                  className="bg-white overflow-hidden group">
                  <div className="relative overflow-hidden">
                    <img
                      src={producto.imagen}
                      alt={producto.nombre}
                      className="w-full h-96 object-cover group-hover:scale-105 transition-transform duration-500 will-change-transform"
                      loading="lazy"
                      decoding="async"
                    />
                    {producto.badge && (
                      <Badge
                        className={`absolute top-3 left-3 ${
                          producto.badge === "Sale"
                            ? "bg-red-500 hover:bg-red-600"
                            : "bg-[#d65391] hover:bg-[#d65391]"
                        }`}
                      >
                        {producto.badge}
                      </Badge>
                    )}
                    <button
                      onClick={() => {
                        setProductoSeleccionado(producto);
                        const colorIni = producto.colores?.[0] || '';
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
                      }}
                      style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                      className="absolute top-3 right-3 bg-white/90 hover:bg-white text-gray-900 text-xs font-bold tracking-widest px-3 py-1.5 transition-colors"
                    >
                      DETALLE
                    </button>
                    <button
                      onClick={() => toggleFavorito(producto.id)}
                      className="absolute bottom-3 right-3 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
                    >
                      <Heart className={`w-5 h-5 ${esFavorito(producto.id) ? "fill-[#d65391] text-[#d65391]" : "text-gray-600"}`} />
                    </button>
                    {producto.agotado && (
                      <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                        <span className="bg-white text-gray-800 text-xs font-bold px-3 py-1 rounded-full shadow">Agotado</span>
                      </div>
                    )}
                  </div>
                  <div className="pt-3 pb-4 px-1">
                    <h3
                      style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                      className="text-gray-900 text-sm font-semibold uppercase tracking-wide mb-1 line-clamp-2"
                    >
                      {producto.nombre}
                    </h3>
                    <div className="flex items-center gap-2">
                      {producto.precioOriginal ? (
                        <>
                          <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-[#d65391]">
                            {formatPrecio(producto.precio)}
                          </span>
                          <span className="text-sm text-gray-400 line-through">
                            {formatPrecio(producto.precioOriginal)}
                          </span>
                        </>
                      ) : (
                        <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-gray-900">
                          {formatPrecio(producto.precio)}
                        </span>
                      )}
                    </div>
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
                className="px-5 py-2 text-sm border border-gray-300 rounded-lg hover:border-[#d65391] hover:text-[#d65391] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Anterior
              </button>
              <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-600">
                {paginaActual} / {totalPaginasLanding}
              </span>
              <button
                onClick={() => { setPaginaActual(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                disabled={paginaActual === totalPaginasLanding}
                style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                className="px-5 py-2 text-sm border border-gray-300 rounded-lg hover:border-[#d65391] hover:text-[#d65391] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Siguiente →
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Modal Detalle Producto */}
      <Dialog open={!!productoSeleccionado} onOpenChange={() => setProductoSeleccionado(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden" style={{ height: '85vh' }}>
          <DialogDescription className="sr-only">
            {productoSeleccionado?.nombre || "Detalle del Producto"}
          </DialogDescription>
          {productoSeleccionado && (() => {
            const imagenesPorColor = productoSeleccionado.imagenesPorColor || {};
            const imgsForColor = colorSeleccionado && imagenesPorColor[colorSeleccionado] && imagenesPorColor[colorSeleccionado].length > 0
              ? imagenesPorColor[colorSeleccionado]
              : (productoSeleccionado.imagenes && productoSeleccionado.imagenes.length > 0 ? productoSeleccionado.imagenes : [productoSeleccionado.imagen]);
            return (
              <div style={{ display: 'flex', height: '85vh', overflow: 'hidden' }}>
                {/* LEFT: Image panel — all dimensions via inline style so nothing depends on Tailwind arbitrary classes */}
                <div style={{ position: 'relative', width: '44%', minWidth: '44%', height: '85vh', overflow: 'hidden', flexShrink: 0, backgroundColor: '#FBF8F5' }}>
                  <ImageCarousel
                    key={`${productoSeleccionado.id}-${colorSeleccionado || 'default'}`}
                    imagenes={imgsForColor}
                    nombre={productoSeleccionado.nombre}
                    className="w-full h-full"
                  />
                </div>

                {/* RIGHT: Details panel */}
                <div style={{ flex: 1, height: '85vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px', padding: '36px 40px', backgroundColor: '#ffffff' }}>

                  {/* Name */}
                  <h1
                    style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                    className="text-2xl font-semibold uppercase tracking-[0.03em] text-[#241B22] leading-tight"
                  >
                    {productoSeleccionado.nombre}
                  </h1>

                  {/* Price */}
                  <div className="flex items-baseline gap-3 -mt-2">
                    <span className="text-xl font-bold text-[#A3395C]">
                      {formatPrecio(productoSeleccionado.precio)}
                    </span>
                    {productoSeleccionado.precioOriginal && (
                      <>
                        <span className="text-sm text-[#7d6f77] line-through">
                          {formatPrecio(productoSeleccionado.precioOriginal)}
                        </span>
                        <span className="text-xs font-semibold text-red-500">
                          -{calcularDescuento(productoSeleccionado.precio, productoSeleccionado.precioOriginal)}%
                        </span>
                      </>
                    )}
                  </div>

                  {/* Description */}
                  {productoSeleccionado.descripcion && (
                    <p className="text-sm text-[#7d6f77] leading-relaxed -mt-2">
                      {productoSeleccionado.descripcion}
                    </p>
                  )}

                  {/* Info icons */}
                  <div className="grid grid-cols-3 gap-1 bg-[#FBF8F5] rounded-lg py-4 px-2">
                    <div className="flex flex-col items-center text-center gap-1.5 px-1">
                      <Package className="w-[18px] h-[18px] text-[#A3395C]" />
                      <span className="text-[10px] uppercase tracking-wide font-semibold text-[#7d6f77] leading-tight">Envío 3-5 días hábiles</span>
                    </div>
                    <div className="flex flex-col items-center text-center gap-1.5 px-1 border-x border-[#E7E0DA]">
                      <Globe className="w-[18px] h-[18px] text-[#A3395C]" />
                      <span className="text-[10px] uppercase tracking-wide font-semibold text-[#7d6f77] leading-tight">Envíos a todo el país</span>
                    </div>
                    <div className="flex flex-col items-center text-center gap-1.5 px-1">
                      <Lock className="w-[18px] h-[18px] text-[#A3395C]" />
                      <span className="text-[10px] uppercase tracking-wide font-semibold text-[#7d6f77] leading-tight">Pago 100% seguro</span>
                    </div>
                  </div>

                  <Separator />

                  {/* Colors */}
                  {(() => {
                    const coloresProducto = productoSeleccionado.colores ?? [];
                    if (coloresProducto.length === 0) return null;
                    return (
                      <div>
                        <p className="text-sm font-semibold text-[#241B22] mb-2">Color</p>
                        <div className="flex gap-3 flex-wrap">
                          {coloresProducto.map((color) => {
                            const hexColor = getColorHex(color);
                            return (
                              <button
                                key={color}
                                onClick={() => {
                                  setColorSeleccionado(color);
                                  const imgsPorColor = productoSeleccionado.imagenesPorColor?.[color];
                                  if (imgsPorColor && imgsPorColor.length > 0) setImagenActual(0);
                                }}
                                className={`w-8 h-8 rounded-full border-2 transition-all ${
                                  colorSeleccionado === color
                                    ? 'border-[#A3395C] ring-2 ring-[#A3395C] ring-offset-2'
                                    : 'border-[#E7E0DA] hover:border-[#A3395C]'
                                }`}
                                style={{ backgroundColor: hexColor }}
                                title={color}
                              />
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
                        <p className="text-sm font-semibold text-[#241B22] mb-2">Talla</p>
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
                                className={`w-12 h-10 rounded-md border text-sm font-medium transition-all ${
                                  sinStock
                                    ? 'border-[#E7E0DA] text-[#c3bab3] bg-[#FBF8F5] cursor-not-allowed line-through'
                                    : seleccionada
                                      ? 'border-[#241B22] bg-[#241B22] text-white'
                                      : 'border-[#E7E0DA] text-[#241B22] hover:border-[#A3395C]'
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
                      <p className="text-sm font-semibold text-[#241B22] mb-2">Material</p>
                      <div className="flex flex-wrap gap-2">
                        {productoSeleccionado.materiales.map((material: string) => (
                          <span key={material} className="px-3 py-1 bg-[#EFD9DF] text-xs font-medium text-[#A3395C] rounded-full">
                            {material}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quantity + Add to cart + Favorite */}
                  <div className="flex items-center gap-3 pt-3 mt-1 border-t border-[#E7E0DA]" style={{ flexShrink: 0 }}>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setCantidadSeleccionada(Math.max(1, cantidadSeleccionada - 1))}
                        className="w-8 h-8 rounded-full border border-[#E7E0DA] flex items-center justify-center hover:bg-[#EFD9DF] transition-colors text-[#241B22]"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-medium w-4 text-center text-[#241B22]">{cantidadSeleccionada}</span>
                      <button
                        onClick={() => setCantidadSeleccionada(cantidadSeleccionada + 1)}
                        className="w-8 h-8 rounded-full border border-[#E7E0DA] flex items-center justify-center hover:bg-[#EFD9DF] transition-colors text-[#241B22]"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <button
                      disabled={productoSeleccionado.agotado}
                      onClick={handleAgregarAlCarrito}
                      className={`flex-1 h-10 rounded-md border text-xs font-semibold uppercase tracking-wider transition-all ${
                        productoSeleccionado.agotado
                          ? 'border-[#E7E0DA] text-[#c3bab3] cursor-not-allowed'
                          : 'border-[#241B22] text-[#241B22] hover:bg-[#241B22] hover:text-white'
                      }`}
                    >
                      {productoSeleccionado.agotado ? 'Agotado' : 'Agregar al Carrito'}
                    </button>
                    <button
                      onClick={() => onNavigateToLogin()}
                      title="Inicia sesión para guardar en favoritos"
                      className="w-10 h-10 rounded-md border border-[#E7E0DA] flex items-center justify-center transition-all flex-shrink-0 text-[#7d6f77] hover:border-[#A3395C] hover:text-[#A3395C]"
                    >
                      <Heart className="w-4 h-4" fill="none" />
                    </button>
                  </div>

                  {/* Buy Now */}
                  <button
                    disabled={productoSeleccionado.agotado}
                    onClick={handleComprarAhora}
                    style={{ flexShrink: 0 }}
                    className={`w-full h-11 rounded-md text-xs font-semibold uppercase tracking-wider text-white transition-all ${
                      productoSeleccionado.agotado ? 'bg-[#E7E0DA] cursor-not-allowed' : 'bg-[#A3395C] hover:bg-[#8a2e4d] shadow-sm hover:shadow-md'
                    }`}
                  >
                    {productoSeleccionado.agotado ? 'Agotado' : 'Comprar Ahora'}
                  </button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>


      {/* Modal Login para Carrito / Compra */}
      <Dialog open={mostrarModalLoginCarrito} onOpenChange={setMostrarModalLoginCarrito}>
        <DialogContent className="max-w-xs w-[90vw] rounded-2xl p-6 text-center">
          <DialogDescription className="sr-only">Iniciar sesión para continuar con la compra</DialogDescription>
          <div className="flex justify-center mb-3">
            <div className="w-12 h-12 rounded-full bg-[#EFD9DF] flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-[#A3395C]" />
            </div>
          </div>
          <DialogHeader className="mb-1">
            <DialogTitle style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xl text-[#241B22]">
              ¡Un paso más!
            </DialogTitle>
          </DialogHeader>
          <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-[#7d6f77] mb-5">
            Para agregar productos al carrito y realizar compras necesitas iniciar sesión.
          </p>
          <div className="space-y-2">
            <Button
              onClick={() => { setMostrarModalLoginCarrito(false); (onNavigateToLoginForCheckout ?? onNavigateToLogin)(); }}
              className="w-full bg-[#A3395C] hover:bg-[#8a2e4d] text-white h-10 text-sm"
              style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
            >
              Iniciar Sesión
            </Button>
            <Button
              onClick={() => { setMostrarModalLoginCarrito(false); onNavigateToRegister(); }}
              variant="outline"
              className="w-full border-[#E7E0DA] text-[#241B22] hover:bg-[#FBF8F5] h-10 text-sm"
              style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
            >
              Crear cuenta
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <StoreFooter telefonoContacto={telefonoContacto} onCategoriaChange={setCategoriaActiva} />
    </div>
  );
};
