import React, { useState, useMemo, useEffect } from "react";
import {
  ShoppingBag,
  Heart,
  Search,
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
  User,
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
import { usePedidosAdmin } from '../../shared/contexts/PedidosAdminContext';
import { toast } from 'sonner';

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
import { SizeSelector } from "../../components/ui/size-selector";
import { Separator } from "../../components/ui/separator";
import { useProductosCombinados } from "../../shared/data/useProductosCombinados";
import { useTienda } from "../../shared/contexts/TiendaContext";
import { useSubcategorias } from "../../shared/contexts/SubcategoriasContext";
import type { Producto } from "../../shared/contexts/TiendaContext";

type Categoria = "mujer" | "accesorios" | "sale";

interface LandingViewProps {
  onNavigateToLogin: () => void;
  onNavigateToRegister: () => void;
  onNavigateToCheckout?: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onNavigateToLogin,
  onNavigateToRegister,
  onNavigateToCheckout,
}) => {
  const [mostrarTelefono, setMostrarTelefono] = useState(false);
  const [categoriaActiva, setCategoriaActiva] =
    useState<Categoria>("mujer");
  const [busqueda, setBusqueda] = useState("");
  const [productoSeleccionado, setProductoSeleccionado] =
    useState<Producto | null>(null);
  const [tallaSeleccionada, setTallaSeleccionada] =
    useState("");
  const [colorSeleccionado, setColorSeleccionado] =
    useState("");
  const [cantidadSeleccionada, setCantidadSeleccionada] =
    useState(1);
  const [imagenActual, setImagenActual] = useState(0);
  const [ordenar, setOrdenar] = useState("destacados");
  const [menuMovilAbierto, setMenuMovilAbierto] =
    useState(false);
  const [filtroTalla, setFiltroTalla] = useState<string>("");
  const [filtroColor, setFiltroColor] = useState<string>("");
  const [filtroMaterial, setFiltroMaterial] = useState<string>("");
  const [filtroTipoProducto, setFiltroTipoProducto] = useState<string>("");
  const [filtroCategoriaRopa, setFiltroCategoriaRopa] = useState<string>("");
  const [filtroPrecioMin, setFiltroPrecioMin] = useState<number | null>(null);
  const [filtroPrecioMax, setFiltroPrecioMax] = useState<number | null>(null);
  const [mostrarModalLoginPerfil, setMostrarModalLoginPerfil] =
    useState(false);

  const productosData = useProductosCombinados();

  const { colores, tallas } = useSubcategorias();

  const {
    agregarAlCarrito,
    carritoItems,
    favoritos,
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

  // NOTE: quick checkout modal removed — navigation to full checkout handled by parent via `onNavigateToCheckout`

  // Detectar si el producto seleccionado está en el carrito y actualizar automáticamente
  React.useEffect(() => {
    if (productoSeleccionado && carritoItems.length > 0) {
      const itemEnCarrito = carritoItems.find(
        (item) =>
          item.id === productoSeleccionado.id &&
          item.tallaSeleccionada === tallaSeleccionada &&
          item.colorSeleccionado === (colorSeleccionado || '')
      );
      
      if (itemEnCarrito && itemEnCarrito.cantidad !== cantidadSeleccionada) {
        // El producto está en el carrito con estos detalles pero diferente cantidad
        // Actualizar la cantidad
        const diferencia = cantidadSeleccionada - itemEnCarrito.cantidad;
        if (diferencia > 0) {
          for (let i = 0; i < diferencia; i++) {
            actualizarCantidad(itemEnCarrito.id, itemEnCarrito.cantidad + i + 1);
          }
        } else {
          for (let i = 0; i < Math.abs(diferencia); i++) {
            actualizarCantidad(itemEnCarrito.id, itemEnCarrito.cantidad - i - 1);
          }
        }
      }
    }
  }, [cantidadSeleccionada, productoSeleccionado, tallaSeleccionada, colorSeleccionado, carritoItems, actualizarCantidad]);

  // Opciones disponibles para filtros (según categoría)
  const productosParaFiltros = useMemo(() => {
    return productosData.filter((p) => {
      if (categoriaActiva === "sale") {
        return (
          p.precioOriginal !== null &&
          p.precioOriginal !== undefined
        );
      }
      return p.categoria === categoriaActiva;
    });
  }, [categoriaActiva, productosData]);

  // Usar tallas del contexto en lugar de calcularlas de productos
  const tallasDisponibles = useMemo(() => {
    return tallas.map(t => t.nombre);
  }, [tallas]);
  
  // Mantener la variable original por compatibilidad con código que la usa
  const tallasDelContexto = tallas;

  // Solo contar/mostrar favoritos que existen en productosData (limpia IDs obsoletos)
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
      if (p.materiales) set.add(p.materiales);
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

  // Filtrar productos según la categoría activa y filtros
  const productosFiltrados = useMemo(() => {
    let productos = productosData.filter((p) => {
      if (categoriaActiva === "sale") {
        return (
          p.precioOriginal !== null &&
          p.precioOriginal !== undefined
        );
      }
      return p.categoria === categoriaActiva;
    });

    // Búsqueda
    if (busqueda) {
      productos = productos.filter((p) =>
        p.nombre.toLowerCase().includes(busqueda.toLowerCase()),
      );
    }

    // Filtro por tipo de producto
    if (filtroTipoProducto && filtroTipoProducto !== "all") {
      const filtroLower = filtroTipoProducto.toLowerCase();
      productos = productos.filter((p) => (p.tipoProducto || "").toLowerCase() === filtroLower);
    }

    // Filtro por categoría de ropa (Vestido, Blusa, Pantalón, etc.)
    if (filtroCategoriaRopa && filtroCategoriaRopa !== "all") {
      const filtroCatLower = filtroCategoriaRopa.toLowerCase();
      productos = productos.filter((p) => (p.subcategoria || "").toLowerCase() === filtroCatLower);
    }

    // Filtro por talla
    if (filtroTalla && filtroTalla !== "all") {
      productos = productos.filter((p) => p.tallas.includes(filtroTalla));
    }

    // Filtro por color
    if (filtroColor && filtroColor !== "all") {
      productos = productos.filter((p) => p.colores?.includes(filtroColor));
    }

    // Filtro por material
    if (filtroMaterial && filtroMaterial !== "all") {
      productos = productos.filter((p) => p.materiales && p.materiales.includes(filtroMaterial));
    }

    // Filtro por rango de precios
    if (filtroPrecioMin !== null) {
      productos = productos.filter((p) => p.precio >= filtroPrecioMin);
    }
    if (filtroPrecioMax !== null) {
      productos = productos.filter((p) => p.precio <= filtroPrecioMax);
    }

    // Ordenar
    if (ordenar === "precio-menor") {
      productos.sort((a, b) => a.precio - b.precio);
    } else if (ordenar === "precio-mayor") {
      productos.sort((a, b) => b.precio - a.precio);
    } else if (ordenar === "nombre") {
      productos.sort((a, b) =>
        a.nombre.localeCompare(b.nombre),
      );
    }

    return productos;
  }, [categoriaActiva, busqueda, ordenar, filtroTipoProducto, filtroCategoriaRopa, filtroTalla, filtroColor, filtroMaterial, filtroPrecioMin, filtroPrecioMax, productosData]);

  const cambiarImagen = (direccion: "prev" | "next") => {
    if (!productoSeleccionado?.imagenes) return;
    const totalImagenes = productoSeleccionado.imagenes.length;
    if (direccion === "prev") {
      setImagenActual((prev) =>
        prev === 0 ? totalImagenes - 1 : prev - 1,
      );
    } else {
      setImagenActual((prev) =>
        prev === totalImagenes - 1 ? 0 : prev + 1,
      );
    }
  };

  const formatPrecio = (precio: number) => {
    return `$${precio.toLocaleString("es-CO")}`;
  };

  const calcularDescuento = (
    precio: number,
    precioOriginal: number,
  ) => {
    const descuento =
      ((precioOriginal - precio) / precioOriginal) * 100;
    return Math.round(descuento);
  };

  const handleAgregarAlCarrito = () => {
    if (!productoSeleccionado) return;
    const talla = tallaSeleccionada || 'Única';
    agregarAlCarrito(productoSeleccionado, talla, colorSeleccionado || undefined, cantidadSeleccionada);
    setProductoSeleccionado(null);
  };

  

  const handleToggleFavorito = (productoId: number) => {
    toggleFavorito(productoId);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center">
              <button
                className="lg:hidden mr-4 p-2 hover:bg-gray-100 rounded-lg"
                onClick={() =>
                  setMenuMovilAbierto(!menuMovilAbierto)
                }
              >
                {menuMovilAbierto ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
              <h1
                style={{
                  fontFamily: "Playfair Display, serif",
                }}
                className="text-3xl text-gray-900"
              >
                Selenne{" "}
                <span className="text-[#d65391]">Boutique</span>
              </h1>
            </div>

            {/* Navegación Desktop */}
            <nav className="hidden lg:flex items-center space-x-8">
              <button
                onClick={() => setCategoriaActiva("mujer")}
                style={{ fontFamily: "Inter, sans-serif" }}
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
                style={{ fontFamily: "Inter, sans-serif" }}
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
                style={{ fontFamily: "Inter, sans-serif" }}
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
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setMostrarModalLoginPerfil(true)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <User className="w-6 h-6 text-gray-700" />
              </button>
              <Sheet>
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
                    <SheetTitle style={{ fontFamily: 'Playfair Display, serif' }}>
                      Favoritos
                    </SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    {favoritosValidos.length === 0 ? (
                      <div className="text-center py-12">
                        <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 mb-4">No tienes productos en favoritos</p>
                        <Button onClick={() => setMenuMovilAbierto(false)} className="w-full bg-[#d65391] text-white">
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
                                  <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm font-medium">{prod.nombre}</span>
                                  <span className="text-sm text-gray-600">{formatPrecio(prod.precio)}</span>
                                </div>
                                <div className="mt-2 flex gap-2">
                                  <Button size="sm" onClick={() => { setProductoSeleccionado(prod);
                                  console.log('[VerDetalles] tallas:', prod.tallas, 'colores:', prod.colores, 'variantes:', prod.variantes?.slice(0,3));
                                  const colorInicial = prod.colores?.[0] || '';
                                  const primeraDisponible = prod.tallas?.find((t: string) => {
                                    if (!prod.variantes?.length) return true;
                                    const v = prod.variantes.find((x: any) => x.tallaNombre === t && (!colorInicial || x.colorNombre === colorInicial));
                                    return v ? v.stock > 0 : true;
                                  });
                                  setTallaSeleccionada(primeraDisponible || prod.tallas?.[0] || 'Única');
                                  setColorSeleccionado(colorInicial); }}>
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
              <Sheet>
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
                    <SheetTitle
                      style={{
                        fontFamily: "Playfair Display, serif",
                      }}
                    >
                      Carrito de Compras
                    </SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 space-y-4">
                    {carritoItems.length === 0 ? (
                      <div className="text-center py-12">
                        <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 mb-4">Tu carrito está vacío</p>
                        <Button onClick={() => setMenuMovilAbierto(false)} className="w-full bg-[#d65391] text-white">
                          Seguir comprando
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {carritoItems.map((item) => (
                          <div 
                            key={`${item.id}-${item.tallaSeleccionada}`} 
                            className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={() => { 
                              setProductoSeleccionado(item); 
                              setTallaSeleccionada(item.tallaSeleccionada); 
                              setColorSeleccionado(item.colorSeleccionado || ''); 
                              setCantidadSeleccionada(item.cantidad); 
                              setImagenActual(0); 
                            }}
                          >
                            <img src={item.imagen} alt={item.nombre} className="w-16 h-16 object-cover rounded" />
                            <div className="flex-1">
                              <div className="flex justify-between items-center">
                                <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm font-medium">{item.nombre}</span>
                                <span className="text-sm text-gray-600">{formatPrecio(item.precio)}</span>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                Talla: {item.tallaSeleccionada} {item.colorSeleccionado && `| Color: ${item.colorSeleccionado}`}
                              </div>
                              <div className="mt-2 flex items-center gap-2">
                                <button onClick={(e: React.MouseEvent) => { e.stopPropagation(); actualizarCantidad(item.id, item.cantidad - 1); }} className="px-2 py-1 border rounded">-</button>
                                <span className="px-2">{item.cantidad}</span>
                                <button onClick={(e: React.MouseEvent) => { e.stopPropagation(); actualizarCantidad(item.id, item.cantidad + 1); }} className="px-2 py-1 border rounded">+</button>
                                <Button variant="outline" className="ml-4 text-xs" onClick={(e: React.MouseEvent) => { e.stopPropagation(); removerDelCarrito(item.id); }}>Eliminar</Button>
                              </div>
                            </div>
                          </div>
                        ))}

                        <div className="pt-4">
                          <div className="flex justify-between items-center mb-3">
                            <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-700">Total:</span>
                            <span className="text-lg font-semibold">{formatPrecio(carritoItems.reduce((s, it) => s + it.precio * it.cantidad, 0))}</span>
                          </div>
                          <p className="text-xs text-gray-500 mb-4 text-center">*IVA incluido en el precio</p>
                          <Button className="w-full bg-[#d65391] text-white" onClick={() => onNavigateToCheckout ? onNavigateToCheckout() : onNavigateToLogin()}>
                            <ShoppingBag className="w-4 h-4 mr-2" />Ir a Pagar
                          </Button>
                        </div>
                      </div>
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
                onClick={() => {
                  setCategoriaActiva("mujer");
                  setMenuMovilAbierto(false);
                }}
                style={{ fontFamily: "Inter, sans-serif" }}
                className={`block w-full text-left px-4 py-2 rounded-lg ${
                  categoriaActiva === "mujer"
                    ? "bg-[#f8a9c5] text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                Mujer
              </button>
              <button
                onClick={() => {
                  setCategoriaActiva("accesorios");
                  setMenuMovilAbierto(false);
                }}
                style={{ fontFamily: "Inter, sans-serif" }}
                className={`block w-full text-left px-4 py-2 rounded-lg ${
                  categoriaActiva === "accesorios"
                    ? "bg-[#f8a9c5] text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                Accesorios
              </button>
              <button
                onClick={() => {
                  setCategoriaActiva("sale");
                  setMenuMovilAbierto(false);
                }}
                style={{ fontFamily: "Inter, sans-serif" }}
                className={`block w-full text-left px-4 py-2 rounded-lg ${
                  categoriaActiva === "sale"
                    ? "bg-[#f8a9c5] text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                Sale
              </button>
              <Separator className="my-4" />
              <Button
                variant="default"
                className="w-full"
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

      {/* Barra de Búsqueda y Filtros */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          {/* Búsqueda */}
          <div className="relative w-full mb-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Buscar productos..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-10 bg-white w-full"
              style={{ fontFamily: "Inter, sans-serif" }}
            />
          </div>
          
          {/* Filtros principales - Horizontal compacto */}
          <div className="flex gap-3 items-center justify-between w-full">
            {/* Tipo de Producto */}
            <Select value={filtroTipoProducto || "all"} onValueChange={setFiltroTipoProducto}>
              <SelectTrigger className="flex-1 bg-white px-3 py-1 h-9 text-sm">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {tiposProductoDisponibles.map((tipo) => (
                  <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Categoría de Ropa */}
            <Select value={filtroCategoriaRopa || "all"} onValueChange={setFiltroCategoriaRopa}>
              <SelectTrigger className="flex-1 bg-white px-3 py-1 h-9 text-sm">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {categoriasRopaDisponibles.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Rango de Precio */}
            <Input
              type="number"
              placeholder="Min"
              value={filtroPrecioMin === null ? "" : filtroPrecioMin}
              onChange={(e) => setFiltroPrecioMin(e.target.value === "" ? null : parseInt(e.target.value) || null)}
              className="bg-white w-20 px-2 py-1 h-9 text-sm"
            />
            <Input
              type="number"
              placeholder="Máx"
              value={filtroPrecioMax === null ? "" : filtroPrecioMax}
              onChange={(e) => setFiltroPrecioMax(e.target.value === "" ? null : parseInt(e.target.value) || null)}
              className="bg-white w-20 px-2 py-1 h-9 text-sm"
            />

            {/* Talla */}
            <Select value={filtroTalla || "all"} onValueChange={setFiltroTalla}>
              <SelectTrigger className="flex-1 bg-white px-3 py-1 h-9 text-sm">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {tallasDisponibles.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Ordenar por */}
            <Select value={ordenar} onValueChange={setOrdenar}>
              <SelectTrigger className="flex-1 bg-white px-3 py-1 h-9 text-sm">
                <SelectValue placeholder="Destacados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="destacados">Destacados</SelectItem>
                <SelectItem value="precio-menor">Precio: Menor a Mayor</SelectItem>
                <SelectItem value="precio-mayor">Precio: Mayor a Menor</SelectItem>
                <SelectItem value="nombre">Nombre A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Banner de Categoría */}
      <div className="bg-gradient-to-r from-[#d65391] to-[#f8a9c5] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            style={{ fontFamily: "Playfair Display, serif" }}
            className="text-4xl md:text-5xl mb-2"
          >
            {categoriaActiva === "mujer" && "Colección Mujer"}
            {categoriaActiva === "accesorios" && "Accesorios"}
            {categoriaActiva === "sale" && "Sale"}
          </h2>
          <p
            style={{ fontFamily: "Inter, sans-serif" }}
            className="text-lg opacity-90"
          >
            {categoriaActiva === "mujer" &&
              "Descubre nuestra elegante colección de ropa femenina"}
            {categoriaActiva === "accesorios" &&
              "Complementa tu look con nuestros accesorios exclusivos"}
            {categoriaActiva === "sale" &&
              "Productos seleccionados con descuentos especiales"}
          </p>
        </div>
      </div>

      {/* Grid de Productos */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="mb-4 flex justify-between items-center">
          <p
            style={{ fontFamily: "Inter, sans-serif" }}
            className="text-gray-600"
          >
            {productosFiltrados.length} productos encontrados
          </p>
        </div>

        {productosFiltrados.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              No se encontraron productos
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {productosFiltrados.map((producto) => (
              <div
                key={producto.id}
                className="bg-white rounded-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow duration-300 group"
              >
                <div className="relative overflow-hidden">
                  <img
                    src={producto.imagen}
                    alt={producto.nombre}
                    className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-300"
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
                  {producto.agotado && (
                    <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center rounded-t-xl">
                      <span className="bg-white text-gray-800 text-xs font-bold px-3 py-1 rounded-full shadow">
                        Agotado
                      </span>
                    </div>
                  )}
                  {producto.precioOriginal && (
                    <Badge className="absolute top-3 right-3 bg-black hover:bg-black text-white">
                      -
                      {calcularDescuento(
                        producto.precio,
                        producto.precioOriginal,
                      )}
                      %
                    </Badge>
                  )}
                  {producto.nuevo && (
                    <Badge className="absolute top-3 right-3 bg-green-500 hover:bg-green-600">
                      Nuevo
                    </Badge>
                  )}
                  <button
                    onClick={() => handleToggleFavorito(producto.id)}
                    className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
                  >
                    <Heart
                      className={`w-5 h-5 ${
                        esFavorito(producto.id)
                          ? "fill-[#d65391] text-[#d65391]"
                          : "text-gray-600"
                      }`}
                    />
                  </button>
                </div>
                <div className="p-4">
                  <div className="flex items-center mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(producto.rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                    <span className="text-xs text-gray-500 ml-2">
                      {producto.rating}
                    </span>
                  </div>
                  <h3
                    style={{ fontFamily: "Inter, sans-serif" }}
                    className="text-gray-900 mb-2 h-12 line-clamp-2"
                  >
                    {producto.nombre}
                  </h3>
                  <div className="flex items-center gap-2 mb-3">
                    {producto.precioOriginal ? (
                      <>
                        <span
                          style={{
                            fontFamily:
                              "Playfair Display, serif",
                          }}
                          className="text-xl text-[#d65391]"
                        >
                          {formatPrecio(producto.precio)}
                        </span>
                        <span className="text-sm text-gray-400 line-through">
                          {formatPrecio(
                            producto.precioOriginal,
                          )}
                        </span>
                      </>
                    ) : (
                      <span
                        style={{
                          fontFamily: "Playfair Display, serif",
                        }}
                        className="text-xl text-gray-900"
                      >
                        {formatPrecio(producto.precio)}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1 mb-3 flex-wrap">
                    {producto.tallas.map((talla) => (
                      <span
                        key={talla}
                        className="px-2 py-1 text-xs border border-gray-300 rounded"
                      >
                        {talla}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button
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
                      className="flex-1 bg-black hover:bg-gray-800 text-white h-11"
                      style={{
                        fontFamily: "Inter, sans-serif",
                      }}
                    >
                      Ver Detalles
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal de Detalle del Producto */}
      <Dialog
        open={!!productoSeleccionado}
        onOpenChange={() => setProductoSeleccionado(null)}
      >
        <DialogContent className="max-w-xl max-h-[90vh] overflow-hidden p-0 flex flex-col w-[95vw]">
          <DialogDescription className="sr-only">
            {productoSeleccionado?.nombre || "Detalle del Producto"}
          </DialogDescription>
          <div className="overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {/* Encabezado Compacto */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-3 py-2 flex items-center justify-between z-10">
              <div>
                <h1
                  style={{ fontFamily: "Playfair Display, serif" }}
                  className="text-lg font-bold text-gray-900"
                >
                  {productoSeleccionado?.nombre || "Detalle del Producto"}
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  {productoSeleccionado?.codigo} • {productoSeleccionado?.marca}
                </p>
              </div>
              <button
                onClick={() => setProductoSeleccionado(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            {productoSeleccionado && (
              <div className="px-3 py-3">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  
                  {/* SECCIÓN IZQUIERDA: Galería */}
                  <div>
                    <div className="sticky top-32">
                      <div className="relative rounded-md overflow-hidden h-56 bg-gray-100 mb-2 flex items-center justify-center">
                        {productoSeleccionado.badge && (
                          <Badge
                            className={`absolute top-3 right-3 z-10 ${
                              productoSeleccionado.badge === "Sale"
                                ? "bg-red-500 hover:bg-red-600"
                                : "bg-[#d65391] hover:bg-[#d65391]"
                            }`}
                          >
                            {productoSeleccionado.badge}
                          </Badge>
                        )}
                        {/* Imagen principal — si hay color seleccionado, solo mostrar sus imágenes */}
                        {(() => {
                          const imgsPorColor = colorSeleccionado
                            ? (productoSeleccionado.imagenesPorColor?.[colorSeleccionado] || [])
                            : [];
                          const tieneImagenesDeColor = imgsPorColor.length > 0;
                          // Si color seleccionado pero sin imágenes → mostrar placeholder "sin imagen"
                          if (colorSeleccionado && !tieneImagenesDeColor) {
                            return (
                              <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 text-gray-400">
                                <div className="text-4xl mb-2">👗</div>
                                <p className="text-sm">Sin imagen para este color</p>
                              </div>
                            );
                          }
                          // Sin color seleccionado o color con imágenes → mostrar galería normal
                          const galeria = tieneImagenesDeColor ? imgsPorColor : (productoSeleccionado.imagenes || []);
                          const src = galeria?.[imagenActual] || productoSeleccionado.imagen;
                          return (
                            <img
                              src={src}
                              alt={productoSeleccionado.nombre}
                              className="w-full h-full object-cover"
                            />
                          );
                        })()}
                        {productoSeleccionado.imagenes &&
                          productoSeleccionado.imagenes.length > 1 && (
                            <>
                              <button
                                onClick={() => cambiarImagen("prev")}
                                className="absolute left-2 top-1/2 -translate-y-1/2 p-1 bg-white/80 hover:bg-white rounded-full shadow-md transition-colors"
                              >
                                <ChevronLeft className="w-4 h-4 text-gray-700" />
                              </button>
                              <button
                                onClick={() => cambiarImagen("next")}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 bg-white/80 hover:bg-white rounded-full shadow-md transition-colors"
                              >
                                <ChevronRight className="w-4 h-4 text-gray-700" />
                              </button>
                            </>
                          )}
                      </div>
                      
                      {/* Miniaturas — solo del color seleccionado o generales */}
                      {(() => {
                        const imgsPorColor = colorSeleccionado
                          ? (productoSeleccionado.imagenesPorColor?.[colorSeleccionado] || [])
                          : [];
                        const tieneImagenesDeColor = imgsPorColor.length > 0;
                        if (colorSeleccionado && !tieneImagenesDeColor) return null;
                        const galeria = tieneImagenesDeColor ? imgsPorColor : (productoSeleccionado.imagenes || []);
                        return galeria.length > 1 ? (
                          <div className="flex gap-1 mt-1">
                            {galeria.slice(0, 4).map((img, idx) => (
                              <img
                                key={idx}
                                src={img}
                                alt={`Vista ${idx + 1}`}
                                onClick={() => setImagenActual(idx)}
                                className={`w-12 h-12 rounded-md object-cover border-2 cursor-pointer transition-all ${
                                  imagenActual === idx
                                    ? 'border-[#d65391] shadow-md'
                                    : 'border-gray-200 hover:border-[#d65391]'
                                }`}
                              />
                            ))}
                          </div>
                        ) : null;
                      })()}
                    </div>
                  </div>

                  {/* SECCIÓN DERECHA: Información y Controles */}
                  <div className="space-y-2">
                    
                    {/* Rating */}
                    <div className="flex items-center gap-1 mb-2 pb-2 border-b border-gray-200">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i < Math.floor(productoSeleccionado.rating)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-600 font-medium">
                        ({productoSeleccionado.rating})
                      </span>
                    </div>

                    {/* DESCRIPCIÓN */}
                    {productoSeleccionado.descripcion && (
                      <p className="text-xs text-gray-600 leading-relaxed mb-2 pb-2 border-b border-gray-100">
                        {productoSeleccionado.descripcion}
                      </p>
                    )}

                    {/* PRECIOS Y DESCUENTO */}
                    <div className="mb-3">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span
                          style={{ fontFamily: "Playfair Display, serif" }}
                          className="text-2xl font-bold text-gray-900"
                        >
                          {formatPrecio(productoSeleccionado.precio)}
                        </span>
                        {productoSeleccionado.precioOriginal && (
                          <span className="text-sm text-gray-400 line-through">
                            {formatPrecio(productoSeleccionado.precioOriginal)}
                          </span>
                        )}
                        {productoSeleccionado.precioOriginal && (
                          <Badge className="bg-red-500 hover:bg-red-600 text-white text-xs ml-auto">
                            -{calcularDescuento(
                              productoSeleccionado.precio,
                              productoSeleccionado.precioOriginal,
                            )}%
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* SELECTOR DE COLOR */}
                    {productoSeleccionado.colores && productoSeleccionado.colores.length > 0 && (
                      <div>
                        <label className="block text-xs font-semibold text-gray-900 mb-2">
                          Color:
                        </label>
                        <div className="flex gap-4 flex-wrap mb-3">
                          {productoSeleccionado.colores.map((color) => {
                            const hexColor = getColorHex(color);
                            return (
                              <div key={color} className="flex flex-col items-center">
                                <button
                                  onClick={() => {
                                    setColorSeleccionado(color);
                                    // Cambiar a imágenes del color seleccionado
                                    const imgsPorColor = productoSeleccionado.imagenesPorColor?.[color];
                                    if (imgsPorColor && imgsPorColor.length > 0) {
                                      setImagenActual(0);
                                    }
                                  }}
                                  className={`w-10 h-10 rounded-full transition-all border-2 shadow-sm hover:shadow-md ${
                                    colorSeleccionado === color
                                      ? "border-[#d65391] ring-2 ring-[#d65391] ring-offset-2"
                                      : "border-gray-300 hover:border-[#d65391]"
                                  }`}
                                  style={{ backgroundColor: hexColor }}
                                  title={color}
                                />
                                <p className="text-xs text-gray-600 mt-1">{color}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* MATERIAL */}
                    {productoSeleccionado.materiales && productoSeleccionado.materiales.length > 0 && (
                      <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                        <span className="text-base">🧵</span>
                        <span>
                          <span className="font-semibold text-gray-800">Material: </span>
                          {Array.isArray(productoSeleccionado.materiales)
                            ? productoSeleccionado.materiales.join(', ')
                            : productoSeleccionado.materiales}
                        </span>
                      </div>
                    )}

                    {/* SELECTOR DE TALLA */}
                    {(() => {
                      const tallasProducto: string[] = (productoSeleccionado as any).tallas || [];
                      const variantes: any[] = (productoSeleccionado as any).variantes || [];
                      const tallasConStock: any[] = (productoSeleccionado as any).tallasConStock || [];
                      const stockGeneral: number = (productoSeleccionado as any).stock ?? 0;

                      // Si no hay tallas configuradas pero hay stock, mostrar "Talla única"
                      const tallasMostrar: string[] = tallasProducto.length > 0
                        ? tallasProducto
                        : (stockGeneral > 0 ? ['Única'] : []);

                      if (tallasMostrar.length === 0) return null;

                      // ¿Todos los variantes tienen stock 0? → usar tallasConStock como fallback
                      const todosVariantesCero = variantes.length > 0 &&
                        variantes.every((x: any) => (x.stock ?? 0) <= 0);

                      return (
                        <div>
                          <label className="block text-xs font-semibold text-gray-900 mb-2">
                            Selecciona tu talla:
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {tallasMostrar.map((talla) => {
                              let sinStock = false;
                              let stockDisponible = 0;

                              if (talla === 'Única') {
                                sinStock = stockGeneral <= 0;
                                stockDisponible = stockGeneral;
                              } else if (variantes.length > 0 && !todosVariantesCero) {
                                // Hay variantes con stock real
                                const colorEfectivo = colorSeleccionado || (productoSeleccionado.colores?.length === 1 ? productoSeleccionado.colores[0] : null);
                                if (colorEfectivo) {
                                  const v = variantes.find((x: any) => x.tallaNombre === talla && x.colorNombre === colorEfectivo);
                                  stockDisponible = v?.stock ?? 0;
                                } else {
                                  stockDisponible = variantes.filter((x: any) => x.tallaNombre === talla).reduce((s: number, x: any) => s + (x.stock ?? 0), 0);
                                }
                                sinStock = stockDisponible <= 0;
                              } else {
                                // Sin variantes (o todos en cero) → usar tallasConStock
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
                                  className={`relative px-3 py-1.5 rounded-md border text-sm font-medium transition-all
                                    ${sinStock
                                      ? 'border-gray-200 text-gray-300 bg-gray-50 cursor-not-allowed line-through'
                                      : seleccionada
                                        ? 'border-[#d65391] bg-[#d65391] text-white shadow-sm'
                                        : 'border-gray-300 text-gray-700 hover:border-[#d65391]'
                                    }`}
                                  title={sinStock ? 'Agotado en esta talla' : `${talla}${stockDisponible > 0 ? ` — ${stockDisponible} disponibles` : ''}`}
                                >
                                  {talla}
                                  {sinStock && (
                                    <span className="absolute -top-1 -right-1 bg-red-400 text-white text-[9px] px-1 rounded-full">✕</span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}

                    {/* CANTIDAD */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-900 mb-2">
                        Cantidad:
                      </label>
                      <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-2 w-fit">
                        <button
                          onClick={() =>
                            setCantidadSeleccionada(
                              Math.max(1, cantidadSeleccionada - 1),
                            )
                          }
                          className="p-2 hover:bg-white rounded-lg transition-colors"
                        >
                          <Minus className="w-4 h-4 text-gray-600" />
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={cantidadSeleccionada}
                          onChange={(e) => setCantidadSeleccionada(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-10 text-center font-bold text-sm border-0 bg-transparent"
                        />
                        <button
                          onClick={() =>
                            setCantidadSeleccionada(cantidadSeleccionada + 1)
                          }
                          className="p-2 hover:bg-white rounded-lg transition-colors"
                        >
                          <Plus className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    </div>

                    {/* STOCK STATUS */}
                    {productoSeleccionado.agotado ? (
                      <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                        <span className="text-red-500">⚠️</span>
                        <div>
                          <p className="text-sm font-semibold text-red-600">Producto Agotado</p>
                          <p className="text-xs text-red-400">Sin stock disponible por el momento</p>
                        </div>
                      </div>
                    ) : (
                      (() => {
                          const variantes: any[] = (productoSeleccionado as any).variantes || [];
                          const stockGeneral: number = (productoSeleccionado as any).stock ?? 0;
                          const tallasConStock: any[] = (productoSeleccionado as any).tallasConStock || [];
                          const todosVariantesCero = variantes.length > 0 && variantes.every((x: any) => (x.stock ?? 0) <= 0);
                          const colorEfectivo = colorSeleccionado || (productoSeleccionado.colores?.length === 1 ? productoSeleccionado.colores[0] : null);
                          let texto = tallaSeleccionada ? '' : 'Selecciona una talla';
                          let isAgotado = false;

                          if (tallaSeleccionada === 'Única') {
                            isAgotado = stockGeneral <= 0;
                            texto = isAgotado ? 'Agotado' : `${stockGeneral} unidades disponibles`;
                          } else if (variantes.length > 0 && !todosVariantesCero) {
                            if (tallaSeleccionada && colorEfectivo) {
                              const v = variantes.find((x: any) => x.tallaNombre === tallaSeleccionada && x.colorNombre === colorEfectivo);
                              const stockV = v?.stock ?? 0;
                              isAgotado = stockV <= 0;
                              texto = isAgotado ? `Agotado en ${tallaSeleccionada} / ${colorEfectivo}` : `${stockV} unidades en ${tallaSeleccionada} / ${colorEfectivo}`;
                            } else if (tallaSeleccionada) {
                              const total = variantes.filter((x: any) => x.tallaNombre === tallaSeleccionada).reduce((s: number, x: any) => s + (x.stock ?? 0), 0);
                              isAgotado = total <= 0;
                              texto = isAgotado ? `Agotado en ${tallaSeleccionada}` : `${total} unidades en ${tallaSeleccionada}`;
                            } else if (colorEfectivo) {
                              const total = variantes.filter((x: any) => x.colorNombre === colorEfectivo).reduce((s: number, x: any) => s + (x.stock ?? 0), 0);
                              isAgotado = total <= 0;
                              texto = isAgotado ? 'Color agotado' : `${total} unidades en ${colorEfectivo}`;
                            }
                          } else {
                            // Sin variantes o todos en cero → usar tallasConStock o stock general
                            const tallaInfo = tallaSeleccionada ? tallasConStock.find((t: any) => t.nombre === tallaSeleccionada) : null;
                            const stockTotal = tallaInfo ? tallaInfo.stock : stockGeneral;
                            isAgotado = stockTotal <= 0;
                            texto = isAgotado ? 'Agotado' : `${stockTotal} unidades disponibles`;
                          }
                          return (
                            <div className="flex items-center gap-1">
                              <div className={`w-2 h-2 rounded-full ${isAgotado ? 'bg-red-400' : 'bg-green-400'}`}></div>
                              <span className={`text-xs font-medium ${isAgotado ? 'text-red-500' : 'text-green-600'}`}>{texto}</span>
                            </div>
                          );
                        })()
                    )}

                    {/* BOTONES DE ACCIÓN */}
                    <div className="space-y-1 pt-2 border-t border-gray-200">
                          <Button
                        disabled={productoSeleccionado.agotado}
                        onClick={() => {
                          if (!productoSeleccionado || productoSeleccionado.agotado) return;
                          const talla = tallaSeleccionada || 'Única';
                          agregarAlCarrito(productoSeleccionado, talla, colorSeleccionado || undefined, cantidadSeleccionada);
                          setProductoSeleccionado(null);
                          onNavigateToCheckout?.();
                        }}
                        className={`w-full h-9 font-semibold text-xs shadow-md transition-all text-white ${productoSeleccionado.agotado ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#d65391] hover:bg-[#c04380] hover:shadow-lg'}`}
                        style={{ fontFamily: "Inter, sans-serif" }}
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        {productoSeleccionado.agotado ? 'Agotado' : 'Comprar Ahora'}
                      </Button>
                      <Button
                        disabled={productoSeleccionado.agotado}
                        onClick={!productoSeleccionado.agotado ? handleAgregarAlCarrito : undefined}
                        className={`w-full h-9 font-semibold text-xs transition-all text-white ${productoSeleccionado.agotado ? 'bg-gray-300 cursor-not-allowed' : 'bg-black hover:bg-gray-800'}`}
                        style={{ fontFamily: "Inter, sans-serif" }}
                      >
                        <ShoppingBag className="w-4 h-4 mr-2" />
                        Agregar al Carrito
                      </Button>
                      <Button
                        onClick={() =>
                          handleToggleFavorito(productoSeleccionado.id)
                        }
                        variant="outline"
                        className="w-full border-2 border-[#d65391] text-[#d65391] hover:bg-[#d65391] hover:text-white h-9 font-semibold text-xs transition-all"
                        style={{ fontFamily: "Inter, sans-serif" }}
                      >
                        <Heart
                          className={`w-4 h-4 mr-2 ${
                            esFavorito(productoSeleccionado.id)
                              ? "fill-current"
                              : ""
                          }`}
                        />
                        {esFavorito(productoSeleccionado.id)
                          ? "En Favoritos"
                          : "Agregar a Favoritos"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick checkout removed — use full Checkout page instead */}

      

      {/* Modal de Login para Perfil */}
      <Dialog
        open={mostrarModalLoginPerfil}
        onOpenChange={setMostrarModalLoginPerfil}
      >
        <DialogContent className="max-w-xs w-[90vw] rounded-2xl p-6 text-center">
          <DialogDescription className="sr-only">Iniciar sesión para ver tu perfil</DialogDescription>
          <div className="flex justify-center mb-3">
            <div className="w-12 h-12 rounded-full bg-[#d65391]/10 flex items-center justify-center">
              <LogIn className="w-5 h-5 text-[#d65391]" />
            </div>
          </div>
          <DialogHeader className="mb-1">
            <DialogTitle style={{ fontFamily: "Playfair Display, serif" }} className="text-xl text-gray-900">
              Inicia sesión
            </DialogTitle>
          </DialogHeader>
          <p style={{ fontFamily: "Inter, sans-serif" }} className="text-sm text-gray-500 mb-5">
            Para ver tu perfil e historial de compras necesitas una cuenta.
          </p>
          <div className="space-y-2">
            <Button
              onClick={() => { setMostrarModalLoginPerfil(false); onNavigateToLogin(); }}
              className="w-full bg-[#d65391] hover:bg-[#c14a7f] text-white h-10 text-sm"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Iniciar Sesión
            </Button>
            <Button
              onClick={() => { setMostrarModalLoginPerfil(false); onNavigateToRegister(); }}
              variant="outline"
              className="w-full border-gray-200 text-gray-600 hover:bg-gray-50 h-10 text-sm"
              style={{ fontFamily: "Inter, sans-serif" }}
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
                style={{
                  fontFamily: "Playfair Display, serif",
                }}
                className="text-2xl mb-4"
              >
                Selenne{" "}
                <span className="text-[#f8a9c5]">Boutique</span>
              </h3>
              <p
                style={{ fontFamily: "Inter, sans-serif" }}
                className="text-gray-400 text-sm"
              >
                Elegancia y estilo en cada prenda
              </p>
            </div>
            <div>
              <h4
                style={{ fontFamily: "Inter, sans-serif" }}
                className="mb-4"
              >
                Compra
              </h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <button
                    onClick={() => setCategoriaActiva("mujer")}
                    className="hover:text-[#f8a9c5]"
                  >
                    Mujer
                  </button>
                </li>
                <li>
                  <button
                    onClick={() =>
                      setCategoriaActiva("accesorios")
                    }
                    className="hover:text-[#f8a9c5]"
                  >
                    Accesorios
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setCategoriaActiva("sale")}
                    className="hover:text-[#f8a9c5]"
                  >
                    Sale
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h4
                style={{ fontFamily: "Inter, sans-serif" }}
                className="mb-4"
              >
                Ayuda
              </h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <button
                    onClick={() => setMostrarTelefono((s) => !s)}
                    className="hover:text-[#f8a9c5] text-left"
                    aria-expanded={mostrarTelefono}
                  >
                    Contacto
                  </button>
                </li>
                {mostrarTelefono && (
                  <li className="text-sm text-gray-300 mt-2">
                    <a href="tel:+573001234567" className="hover:text-[#f8a9c5]">
                      +57 300 123 4567
                    </a>
                  </li>
                )}
              </ul>
            </div>
            <div>
              <h4
                style={{ fontFamily: "Inter, sans-serif" }}
                className="mb-4"
              >
                Síguenos
              </h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-[#f8a9c5]">
                    Instagram
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#f8a9c5]">
                    Facebook
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#f8a9c5]">
                    Pinterest
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <Separator className="my-8 bg-gray-700" />
          <div className="text-center text-sm text-gray-400">
            <p>
              © 2024 Selenne Boutique. Todos los derechos
              reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};