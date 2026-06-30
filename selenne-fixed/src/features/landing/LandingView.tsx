import React, { useState, useMemo, useEffect, useRef } from "react";
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
  ChevronUp,
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
import { ImageCarousel } from "../../components/figma/ImageCarousel";
import { useProductosCombinados } from "../../shared/data/useProductosCombinados";
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
  const [seccionesAbiertas, setSeccionesAbiertas] = useState({ precio: true, talla: true, tipo: true, categoria: true });
  const [precioMinLocal, setPrecioMinLocal] = useState(0);
  const [precioMaxLocal, setPrecioMaxLocal] = useState(0);
  const [activeRangeThumb, setActiveRangeThumb] = useState<'min' | 'max' | null>(null);
  const rangeContainerRef = useRef<HTMLDivElement>(null);
  const [tallaLocal, setTallaLocal] = useState<string[]>([]);
  const [tipoLocal, setTipoLocal] = useState("");
  const [categoriaLocal, setCategoriaLocal] = useState("");

  const productosData = useProductosCombinados();
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

  const abrirFiltros = () => {
    setPrecioMinLocal(filtroPrecioMin ?? 0);
    setPrecioMaxLocal(filtroPrecioMax ?? maxPrecioGlobal);
    setTallaLocal([...filtroTalla]);
    setTipoLocal(filtroTipoProducto);
    setCategoriaLocal(filtroCategoriaRopa);
    setFiltrosAbiertos(true);
  };

  const getRangeValue = (clientX: number) => {
    if (!rangeContainerRef.current) return 0;
    const rect = rangeContainerRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return Math.round((pct * maxPrecioGlobal) / 1000) * 1000;
  };
  const handleRangePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!rangeContainerRef.current) return;
    const val = getRangeValue(e.clientX);
    const thumb = Math.abs(val - precioMinLocal) <= Math.abs(val - precioMaxLocal) ? 'min' : 'max';
    setActiveRangeThumb(thumb);
    rangeContainerRef.current.setPointerCapture(e.pointerId);
    if (thumb === 'min') setPrecioMinLocal(Math.min(val, precioMaxLocal - 1000));
    else setPrecioMaxLocal(Math.max(val, precioMinLocal + 1000));
  };
  const handleRangePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!activeRangeThumb || !(e.buttons & 1)) return;
    const val = getRangeValue(e.clientX);
    if (activeRangeThumb === 'min') setPrecioMinLocal(Math.min(val, precioMaxLocal - 1000));
    else setPrecioMaxLocal(Math.max(val, precioMinLocal + 1000));
  };
  const handleRangePointerUp = () => setActiveRangeThumb(null);

  const aplicarFiltros = () => {
    setFiltroPrecioMin(precioMinLocal > 0 ? precioMinLocal : null);
    setFiltroPrecioMax(precioMaxLocal < maxPrecioGlobal ? precioMaxLocal : null);
    setFiltroTalla(tallaLocal);
    setFiltroTipoProducto(tipoLocal);
    setFiltroCategoriaRopa(categoriaLocal);
    setFiltrosAbiertos(false);
  };

  const limpiarFiltros = () => {
    setPrecioMinLocal(0);
    setPrecioMaxLocal(maxPrecioGlobal);
    setTallaLocal([]);
    setTipoLocal('');
    setCategoriaLocal('');
  };

  // Resetear página al cambiar filtros o categoría
  useEffect(() => { setPaginaActual(1); }, [categoriaActiva, busqueda, ordenar, filtroTipoProducto, filtroCategoriaRopa, filtroTalla, filtroColor, filtroMaterial, filtroPrecioMin, filtroPrecioMax]);

  const totalPaginasLanding = Math.ceil(productosFiltrados.length / PRODUCTOS_POR_PAGINA);
  const productosPaginaLanding = productosFiltrados.slice((paginaActual - 1) * PRODUCTOS_POR_PAGINA, paginaActual * PRODUCTOS_POR_PAGINA);

  useEffect(() => {
    getJson('/api/config/banco').then((d: any) => {
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
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <button
                className="lg:hidden mr-2 p-2 hover:bg-gray-100 rounded-lg"
                onClick={() => setMenuMovilAbierto(!menuMovilAbierto)}
              >
                {menuMovilAbierto ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
              <button
                onClick={() => setCategoriaActiva("mujer")}
                className="flex items-center justify-center hover:opacity-75 transition-opacity"
                title="Selenne Boutique — Inicio"
              >
                <span className="text-2xl font-bold tracking-wide text-black" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                  Selenne Boutique
                </span>
              </button>
            </div>

            {/* Navegación Desktop */}
            <nav className="hidden lg:flex items-center space-x-8">
              <button
                onClick={() => setCategoriaActiva("mujer")}
                style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                className={`py-2 px-1 border-b-2 transition-colors ${
                  categoriaActiva === "mujer"
                    ? "border-[#d65391] text-[#d65391]"
                    : "border-transparent text-gray-700 hover:text-[#d65391]"
                }`}
              >
                Mujer
              </button>
              <button
                onClick={() => setCategoriaActiva("accesorios")}
                style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                className={`py-2 px-1 border-b-2 transition-colors ${
                  categoriaActiva === "accesorios"
                    ? "border-[#d65391] text-[#d65391]"
                    : "border-transparent text-gray-700 hover:text-[#d65391]"
                }`}
              >
                Accesorios
              </button>
              <button
                onClick={() => setCategoriaActiva("sale")}
                style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                className={`py-2 px-1 border-b-2 transition-colors ${
                  categoriaActiva === "sale"
                    ? "border-[#d65391] text-[#d65391]"
                    : "border-transparent text-gray-700 hover:text-[#d65391]"
                }`}
              >
                Sale
              </button>
            </nav>

            {/* Acciones */}
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onNavigateToLogin}
                className="hidden md:flex items-center gap-1 text-gray-700 hover:text-[#d65391]"
                style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
              >
                <LogIn className="w-4 h-4" />
                Iniciar Sesión
              </Button>
              <Button
                size="sm"
                onClick={onNavigateToRegister}
                className="hidden md:flex bg-[#d65391] hover:bg-[#c04380] text-white"
                style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
              >
                Registrarse
              </Button>
              <button
                onClick={() => onNavigateToLogin()}
                className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <User className="w-6 h-6 text-gray-700" />
              </button>
              <Sheet open={busquedaModalAbierta} onOpenChange={v => { setBusquedaModalAbierta(v); if (!v) setBusquedaModal(''); }}>
                <SheetTrigger asChild>
                  <button
                    onClick={() => setBusquedaModal('')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Buscar"
                  >
                    <Search className="w-6 h-6 text-gray-700" />
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
              <Sheet open={favoritosOpen} onOpenChange={setFavoritosOpen}>
                <SheetTrigger asChild>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
                    <Heart className="w-6 h-6 text-gray-700" />
                    {favoritosValidos.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-[#d65391] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
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
                                      if (!(prod as any).variantes?.length) return true;
                                      const v = (prod as any).variantes.find((x: any) => x.tallaNombre === t && (!colorInicial || x.colorNombre === colorInicial));
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
                className="w-full bg-[#d65391] hover:bg-[#c04380]"
                onClick={onNavigateToLogin}
              >
                <LogIn className="w-4 h-4 mr-2" />
                Iniciar Sesión
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={onNavigateToRegister}
              >
                Registrarse
              </Button>
            </nav>
          )}
        </div>
      </header>

      <div className="flex-1 flex flex-col">
        {/* Banner de categoría */}
        <div className="w-full">
          <img
            src={
              categoriaActiva === "mujer"
                ? "/banners/banner-mujer.png"
                : categoriaActiva === "accesorios"
                ? "/banners/banner-accesorios.png"
                : "/banners/banner-sale.png"
            }
            alt={categoriaActiva}
            className="w-full h-auto block"
          />
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
              <button onClick={abrirFiltros}
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

        {/* Panel de Filtros */}
        {filtrosAbiertos && (
          <>
            <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setFiltrosAbiertos(false)} />
            <div className="fixed right-0 top-0 h-full w-80 bg-white z-50 flex flex-col shadow-2xl" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <span className="text-xs font-bold tracking-widest text-gray-900">APLICAR FILTROS</span>
                <button onClick={() => setFiltrosAbiertos(false)} className="flex items-center gap-1 text-xs font-bold tracking-widest text-gray-900 hover:text-gray-600">
                  CERCA <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {/* PRECIO */}
                <div className="px-5 py-4 border-b border-gray-100">
                  <button onClick={() => setSeccionesAbiertas(s => ({ ...s, precio: !s.precio }))}
                    className="w-full flex items-center justify-between mb-3">
                    <span className="text-xs font-bold tracking-widest text-gray-900">PRECIO</span>
                    <ChevronUp className={`w-4 h-4 text-gray-500 transition-transform ${seccionesAbiertas.precio ? '' : 'rotate-180'}`} />
                  </button>
                  {seccionesAbiertas.precio && (
                    <>
                      <div ref={rangeContainerRef} className="relative h-6 mb-4 cursor-pointer touch-none select-none"
                        onPointerDown={handleRangePointerDown}
                        onPointerMove={handleRangePointerMove}
                        onPointerUp={handleRangePointerUp}>
                        <div className="absolute top-1/2 -translate-y-1/2 w-full h-[2px] bg-gray-200 rounded-full">
                          <div className="absolute h-full bg-black rounded-full"
                            style={{ left: `${(precioMinLocal / maxPrecioGlobal) * 100}%`, width: `${((precioMaxLocal - precioMinLocal) / maxPrecioGlobal) * 100}%` }} />
                        </div>
                        <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-black rounded-full border-2 border-white shadow pointer-events-none"
                          style={{ left: `calc(${(precioMinLocal / maxPrecioGlobal) * 100}% - 8px)` }} />
                        <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-black rounded-full border-2 border-white shadow pointer-events-none"
                          style={{ left: `calc(${(precioMaxLocal / maxPrecioGlobal) * 100}% - 8px)` }} />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 border border-gray-200 rounded px-3 py-2 text-sm text-gray-700">
                          {formatCurrency(precioMinLocal)}
                        </div>
                        <span className="text-gray-400">—</span>
                        <div className="flex-1 border border-gray-200 rounded px-3 py-2 text-sm text-gray-700">
                          {formatCurrency(precioMaxLocal)}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* TALLA */}
                {tallasDisponibles.length > 0 && (
                  <div className="px-5 py-4 border-b border-gray-100">
                    <button onClick={() => setSeccionesAbiertas(s => ({ ...s, talla: !s.talla }))}
                      className="w-full flex items-center justify-between mb-3">
                      <span className="text-xs font-bold tracking-widest text-gray-900">TALLA</span>
                      <ChevronUp className={`w-4 h-4 text-gray-500 transition-transform ${seccionesAbiertas.talla ? '' : 'rotate-180'}`} />
                    </button>
                    {seccionesAbiertas.talla && (
                      <div className="flex flex-wrap gap-2">
                        {tallasDisponibles.map(t => (
                          <button key={t} onClick={() => setTallaLocal(tallaLocal.includes(t) ? tallaLocal.filter(x => x !== t) : [...tallaLocal, t])}
                            className={`px-3 py-1.5 text-sm border rounded transition-colors ${tallaLocal.includes(t) ? 'border-black bg-black text-white' : 'border-gray-300 text-gray-700 hover:border-gray-900'}`}>
                            {t}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TIPO DE PRODUCTO */}
                {tiposProductoDisponibles.length > 0 && (
                  <div className="px-5 py-4 border-b border-gray-100">
                    <button onClick={() => setSeccionesAbiertas(s => ({ ...s, tipo: !s.tipo }))}
                      className="w-full flex items-center justify-between mb-3">
                      <span className="text-xs font-bold tracking-widest text-gray-900">TIPO DE PRODUCTO</span>
                      <ChevronUp className={`w-4 h-4 text-gray-500 transition-transform ${seccionesAbiertas.tipo ? '' : 'rotate-180'}`} />
                    </button>
                    {seccionesAbiertas.tipo && (
                      <div className="flex flex-wrap gap-2">
                        {tiposProductoDisponibles.map(t => (
                          <button key={t} onClick={() => setTipoLocal(tipoLocal === t ? '' : t)}
                            className={`px-3 py-1.5 text-sm border rounded transition-colors ${tipoLocal === t ? 'border-black bg-black text-white' : 'border-gray-300 text-gray-700 hover:border-gray-900'}`}>
                            {t}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* CATEGORÍA */}
                {categoriasRopaDisponibles.length > 0 && (
                  <div className="px-5 py-4 border-b border-gray-100">
                    <button onClick={() => setSeccionesAbiertas(s => ({ ...s, categoria: !s.categoria }))}
                      className="w-full flex items-center justify-between mb-3">
                      <span className="text-xs font-bold tracking-widest text-gray-900">CATEGORÍA</span>
                      <ChevronUp className={`w-4 h-4 text-gray-500 transition-transform ${seccionesAbiertas.categoria ? '' : 'rotate-180'}`} />
                    </button>
                    {seccionesAbiertas.categoria && (
                      <div className="flex flex-wrap gap-2">
                        {categoriasRopaDisponibles.map(c => (
                          <button key={c} onClick={() => setCategoriaLocal(categoriaLocal === c ? '' : c)}
                            className={`px-3 py-1.5 text-sm border rounded transition-colors ${categoriaLocal === c ? 'border-black bg-black text-white' : 'border-gray-300 text-gray-700 hover:border-gray-900'}`}>
                            {c}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Limpiar filtros */}
                {(tallaLocal.length > 0 || tipoLocal || categoriaLocal || precioMinLocal > 0 || precioMaxLocal < maxPrecioGlobal) && (
                  <button onClick={limpiarFiltros} className="w-full px-5 py-3 text-xs text-gray-500 hover:text-gray-900 underline transition-colors">
                    Limpiar filtros
                  </button>
                )}
              </div>

              {/* Footer */}
              <div className="px-5 py-4 border-t border-gray-100">
                <button onClick={aplicarFiltros}
                  className="w-full bg-black text-white py-3 text-xs font-bold tracking-widest hover:bg-gray-800 transition-colors">
                  MOSTRAR ARTÍCULOS
                </button>
              </div>
            </div>
          </>
        )}


        {/* Grid de Productos */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="mb-4 flex justify-between items-center">
            <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-gray-600">
              {productosFiltrados.length} productos encontrados
            </p>
          </div>

          {productosFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No se encontraron productos</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {productosPaginaLanding.map((producto) => (
                <div key={producto.id} className="bg-white overflow-hidden group">
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
                        const colorIni = (producto as any).colores?.[0] || '';
                        const tallasP: string[] = (producto as any).tallas || [];
                        const variantesP: any[] = (producto as any).variantes || [];
                        const tallaIni = tallasP.find((t: string) => {
                          if (!variantesP.length) return true;
                          const v = variantesP.find((x: any) => x.tallaNombre === t && (!colorIni || x.colorNombre === colorIni));
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
                    {(producto as any).agotado && (
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
                </div>
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
            const ps = productoSeleccionado as any;
            const imagenesPorColor = productoSeleccionado.imagenesPorColor || {};
            const imgsForColor = colorSeleccionado && imagenesPorColor[colorSeleccionado] && imagenesPorColor[colorSeleccionado].length > 0
              ? imagenesPorColor[colorSeleccionado]
              : (productoSeleccionado.imagenes && productoSeleccionado.imagenes.length > 0 ? productoSeleccionado.imagenes : [productoSeleccionado.imagen]);
            return (
              <div style={{ display: 'flex', height: '85vh', overflow: 'hidden' }}>
                {/* LEFT: Image panel — all dimensions via inline style so nothing depends on Tailwind arbitrary classes */}
                <div style={{ position: 'relative', width: '44%', minWidth: '44%', height: '85vh', overflow: 'hidden', flexShrink: 0, backgroundColor: '#f9fafb' }}>
                  <ImageCarousel
                    key={`${productoSeleccionado.id}-${colorSeleccionado || 'default'}`}
                    imagenes={imgsForColor}
                    nombre={productoSeleccionado.nombre}
                    className="w-full h-full"
                  />
                </div>

                {/* RIGHT: Details panel */}
                <div style={{ flex: 1, height: '85vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', padding: '28px 32px' }}>

                  {/* Name */}
                  <h1
                    style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                    className="text-3xl font-black uppercase text-gray-900 leading-tight"
                  >
                    {productoSeleccionado.nombre}
                  </h1>

                  {/* Price */}
                  <div className="flex items-baseline gap-3">
                    <span className="text-xl font-bold text-gray-900">
                      {formatPrecio(productoSeleccionado.precio)}
                    </span>
                    {productoSeleccionado.precioOriginal && (
                      <>
                        <span className="text-sm text-gray-400 line-through">
                          {formatPrecio(productoSeleccionado.precioOriginal)}
                        </span>
                        <span className="text-xs font-semibold text-red-500">
                          -{calcularDescuento(productoSeleccionado.precio, productoSeleccionado.precioOriginal)}%
                        </span>
                      </>
                    )}
                  </div>

                  {/* Description */}
                  {(productoSeleccionado.descripcion || ps.descripcion) && (
                    <p className="text-sm text-gray-600 leading-relaxed mt-4 mb-2">
                      {productoSeleccionado.descripcion || ps.descripcion}
                    </p>
                  )}

                  {/* Info icons */}
                  <div className="border-t border-gray-100 pt-3 flex flex-col text-xs text-gray-500">
                    <div className="flex items-center gap-3 py-2 border-b border-gray-100">
                      <Package className="w-4 h-4 flex-shrink-0" />
                      <span className="uppercase tracking-wide font-medium">Envío estándar 3-5 días hábiles</span>
                    </div>
                    <div className="flex items-center gap-3 py-2 border-b border-gray-100">
                      <Globe className="w-4 h-4 flex-shrink-0" />
                      <span className="uppercase tracking-wide font-medium">Envíos a todo el país</span>
                    </div>
                    <div className="flex items-center gap-3 py-2">
                      <Lock className="w-4 h-4 flex-shrink-0" />
                      <span className="uppercase tracking-wide font-medium">Pago 100% seguro y encriptado</span>
                    </div>
                  </div>

                  <Separator />

                  {/* Colors */}
                  {(() => {
                    const coloresProducto = productoSeleccionado.colores ?? [];
                    if (coloresProducto.length === 0) return null;
                    return (
                      <div>
                        <p className="text-sm font-semibold text-gray-900 mb-2">Color</p>
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
                                    ? 'border-gray-900 ring-2 ring-gray-900 ring-offset-2'
                                    : 'border-gray-200 hover:border-gray-500'
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
                    const tallasProducto: string[] = (productoSeleccionado as any).tallas || [];
                    const variantes: any[] = (productoSeleccionado as any).variantes || [];
                    const tallasConStock: any[] = (productoSeleccionado as any).tallasConStock || [];
                    const stockGeneral: number = (productoSeleccionado as any).stock ?? 0;
                    const tallasGlobales = tallas.map((t: any) => t.nombre);
                    const tallasMostrar: string[] = tallasProducto;
                    if (tallasMostrar.length === 0) return null;
                    const todosVariantesCero = variantes.length > 0 && variantes.every((x: any) => (x.stock ?? 0) <= 0);
                    return (
                      <div>
                        <p className="text-sm font-semibold text-gray-900 mb-2">Talla</p>
                        <div className="flex flex-wrap gap-2">
                          {tallasMostrar.map((talla) => {
                            let sinStock = false;
                            let stockDisponible = 0;
                            if (talla === 'Única') {
                              sinStock = stockGeneral <= 0;
                              stockDisponible = stockGeneral;
                            } else if (variantes.length > 0 && !todosVariantesCero) {
                              const colorEfectivo = colorSeleccionado || (productoSeleccionado.colores?.length === 1 ? productoSeleccionado.colores[0] : null);
                              if (colorEfectivo) {
                                const v = variantes.find((x: any) => x.tallaNombre === talla && x.colorNombre === colorEfectivo);
                                stockDisponible = v?.stock ?? 0;
                              } else {
                                stockDisponible = variantes.filter((x: any) => x.tallaNombre === talla).reduce((s: number, x: any) => s + (x.stock ?? 0), 0);
                              }
                              sinStock = stockDisponible <= 0;
                            } else {
                              const tallaInfo = tallasConStock.find((t: any) => t.nombre === talla);
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
                                className={`w-12 h-10 border text-sm font-medium transition-all ${
                                  sinStock
                                    ? 'border-gray-200 text-gray-300 bg-gray-50 cursor-not-allowed line-through'
                                    : seleccionada
                                      ? 'border-gray-900 bg-gray-900 text-white'
                                      : 'border-gray-300 text-gray-700 hover:border-gray-900'
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

                  {/* Quantity + Add to cart + Favorite */}
                  <div className="flex items-center gap-3 mt-1" style={{ flexShrink: 0 }}>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setCantidadSeleccionada(Math.max(1, cantidadSeleccionada - 1))}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-600"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-medium w-4 text-center">{cantidadSeleccionada}</span>
                      <button
                        onClick={() => setCantidadSeleccionada(cantidadSeleccionada + 1)}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-600"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <button
                      disabled={ps.agotado}
                      onClick={handleAgregarAlCarrito}
                      className={`flex-1 h-10 border text-xs font-semibold uppercase tracking-wider transition-all ${
                        ps.agotado
                          ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                          : 'border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white'
                      }`}
                    >
                      {ps.agotado ? 'Agotado' : 'Agregar al Carrito'}
                    </button>
                    <button
                      onClick={() => onNavigateToLogin()}
                      title="Inicia sesión para guardar en favoritos"
                      className="w-10 h-10 border border-gray-300 flex items-center justify-center transition-all flex-shrink-0 text-gray-500 hover:border-[#d65391] hover:text-[#d65391]"
                    >
                      <Heart className="w-4 h-4" fill="none" />
                    </button>
                  </div>

                  {/* Buy Now */}
                  <button
                    disabled={ps.agotado}
                    onClick={handleComprarAhora}
                    style={{ flexShrink: 0 }}
                    className={`w-full h-10 text-xs font-semibold uppercase tracking-wider text-white transition-all ${
                      ps.agotado ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#d65391] hover:bg-[#c04380]'
                    }`}
                  >
                    {ps.agotado ? 'Agotado' : 'Comprar Ahora'}
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
            <div className="w-12 h-12 rounded-full bg-[#d65391]/10 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-[#d65391]" />
            </div>
          </div>
          <DialogHeader className="mb-1">
            <DialogTitle style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xl text-gray-900">
              ¡Un paso más!
            </DialogTitle>
          </DialogHeader>
          <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-500 mb-5">
            Para agregar productos al carrito y realizar compras necesitas iniciar sesión.
          </p>
          <div className="space-y-2">
            <Button
              onClick={() => { setMostrarModalLoginCarrito(false); (onNavigateToLoginForCheckout ?? onNavigateToLogin)(); }}
              className="w-full bg-[#d65391] hover:bg-[#c14a7f] text-white h-10 text-sm"
              style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
            >
              Iniciar Sesión
            </Button>
            <Button
              onClick={() => { setMostrarModalLoginCarrito(false); onNavigateToRegister(); }}
              variant="outline"
              className="w-full border-gray-200 text-gray-600 hover:bg-gray-50 h-10 text-sm"
              style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
            >
              Crear cuenta
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3
                style={{ fontFamily: '"Times New Roman", Times, serif', color: '#ffffff' }}
                className="text-2xl mb-4"
              >
                Selenne Boutique
              </h3>
              <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-gray-400 text-sm">
                Elegancia y estilo en cada prenda
              </p>
            </div>
            <div>
              <h4 style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="mb-4">Compra</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <button onClick={() => setCategoriaActiva("mujer")} className="hover:text-[#f8a9c5]">
                    Mujer
                  </button>
                </li>
                <li>
                  <button onClick={() => setCategoriaActiva("accesorios")} className="hover:text-[#f8a9c5]">
                    Accesorios
                  </button>
                </li>
                <li>
                  <button onClick={() => setCategoriaActiva("sale")} className="hover:text-[#f8a9c5]">
                    Sale
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h4 style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="mb-4">Ayuda</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a
                    href={`https://wa.me/${telefonoContacto.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#f8a9c5]"
                  >
                    Contacto
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="mb-4">Síguenos</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="https://www.instagram.com/selenne_boutique_?igsh=MWJtaXR0Zm85MW13ZQ==" target="_blank" rel="noopener noreferrer" className="hover:text-[#f8a9c5]">Instagram</a></li>
              </ul>
            </div>
          </div>
          <Separator className="my-8 bg-gray-700" />
          <div className="text-center text-sm text-gray-400">
            <p>© 2024 Selenne Boutique. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
