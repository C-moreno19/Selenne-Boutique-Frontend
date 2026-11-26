import React from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { ShoppingBag, Heart, SlidersHorizontal, Truck, PackageCheck, Wallet } from "lucide-react";
import { Badge } from "./ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { FiltrosPanel } from "./FiltrosPanel";
import { EstadoVacioProductos } from "./EstadoVacioProductos";
import { Estrellas } from "./Estrellas";
import { useTienda } from "../shared/contexts/TiendaContext";
import { useCatalogoFiltrado, type Categoria } from "../shared/hooks/useCatalogoFiltrado";
import { formatCurrency } from "../shared/utils";
import type { Producto } from "../shared/contexts/TiendaContext";

interface TiendaCatalogoProps {
  vista: "home" | "tienda";
  categoriaActiva: Categoria;
  subInicial?: string;
  heroTitle: string;
  onIrATienda: (categoria: Categoria) => void;
  onAbrirCarrito: () => void;
}

export const TiendaCatalogo: React.FC<TiendaCatalogoProps> = ({
  vista,
  categoriaActiva,
  subInicial,
  heroTitle,
  onIrATienda,
  onAbrirCarrito,
}) => {
  const navigate = useNavigate();
  const { agregarAlCarrito, toggleFavorito, esFavorito } = useTienda();

  const {
    productosLoading,
    getColorHex,
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
    busqueda,
  } = useCatalogoFiltrado(categoriaActiva, subInicial);

  const formatPrecio = (precio: number) => formatCurrency(precio);

  const abrirDetalleProducto = (producto: Producto, colorPreferido?: string) => {
    navigate(colorPreferido ? `/producto/${producto.id}?color=${encodeURIComponent(colorPreferido)}` : `/producto/${producto.id}`);
  };

  if (vista === "home") {
    return (
      <>
        {/* Hero de marca */}
        <section className="relative flex items-center px-6 sm:px-16 py-28 sm:py-40 overflow-hidden bg-black">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src="/backgrounds/hero-sale.mp4" type="video/mp4" />
          </video>
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(90deg, rgba(10,5,15,0.88) 0%, rgba(59,10,69,0.7) 45%, rgba(92,42,82,0.35) 100%)' }}
          />
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative max-w-xl text-left"
          >
            <p
              style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
              className="text-white/70 text-xs sm:text-sm font-bold tracking-[0.2em] uppercase mb-5"
            >
              District Store
            </p>
            <h1
              style={{ fontFamily: '"Playfair Display", Georgia, "Iowan Old Style", "Palatino Linotype", "Times New Roman", serif' }}
              className="text-white text-5xl sm:text-7xl mb-5 leading-[1.05]"
            >
              {heroTitle}
            </h1>
            <p
              style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
              className="text-white/85 text-base sm:text-xl mb-10"
            >
              Streetwear y esenciales para hombre y mujer. Compra en línea y recíbelo en casa.
            </p>
            <button
              onClick={() => onIrATienda(categoriaActiva)}
              style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
              className="bg-white text-[#0A0A0A] px-10 py-3.5 text-xs font-bold tracking-widest uppercase hover:scale-[1.03] transition-transform inline-flex items-center gap-2"
            >
              Ver colección →
            </button>
          </motion.div>
        </section>

        {/* Fila de confianza */}
        <section className="bg-[#0A0A0A] border-b border-[#3A2E4D]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {[
              { icon: Truck, texto: "Envíos a todo el país" },
              { icon: PackageCheck, texto: "Stock real, sin sorpresas" },
              { icon: Wallet, texto: "Paga como prefieras" },
            ].map(({ icon: Icon, texto }) => (
              <div key={texto} className="flex items-center justify-center sm:justify-start gap-3">
                <Icon className="w-5 h-5 text-[#9b6fa8] flex-shrink-0" strokeWidth={1.75} />
                <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-white/80">
                  {texto}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Destacados */}
        {(() => {
          const productosAMostrar = destacados;
          if (productosAMostrar.length === 0 && !productosLoading) return null;
          return (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
            <div className="flex items-end justify-between mb-6">
              <h2
                style={{ fontFamily: '"Playfair Display", Georgia, "Iowan Old Style", "Palatino Linotype", "Times New Roman", serif' }}
                className="text-2xl sm:text-3xl text-[#0A0A0A] dark:text-[#F5F3FA]"
              >
                Destacados
              </h2>
              <button
                onClick={() => onIrATienda(categoriaActiva)}
                style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                className="text-xs font-bold tracking-widest text-[#5C2A52] hover:text-[#3B0A45] transition-colors uppercase"
              >
                Ver todo →
              </button>
            </div>
            {productosAMostrar.length === 0 && productosLoading ? (
              <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap sm:overflow-visible">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex-shrink-0 w-40 sm:w-56">
                    <div className="w-full h-52 sm:h-64 bg-[#F7F5FC] dark:bg-[#17101f] animate-pulse mb-3" />
                    <div className="h-3 w-3/4 bg-[#F7F5FC] dark:bg-[#17101f] animate-pulse mb-1.5" />
                    <div className="h-3 w-1/3 bg-[#F7F5FC] dark:bg-[#17101f] animate-pulse" />
                  </div>
                ))}
              </div>
            ) : (
            <div className={`flex gap-4 sm:gap-6 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap sm:overflow-visible ${productosAMostrar.length < 4 ? 'sm:justify-center' : ''}`}>
              {productosAMostrar.map((producto, indiceDestacado) => (
                <motion.button
                  key={producto.id}
                  onClick={() => abrirDetalleProducto(producto)}
                  initial={{ opacity: 0, y: 20, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.55, delay: indiceDestacado * 0.06, ease: [0.16, 1, 0.3, 1] }}
                  className="text-left flex-shrink-0 w-40 sm:w-56 group"
                >
                  <div className="overflow-hidden mb-3 bg-[#F7F5FC] dark:bg-[#17101f]">
                    <img
                      src={producto.imagen}
                      alt={producto.nombre}
                      className="w-full h-52 sm:h-64 object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>
                  <p
                    style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                    className="text-[11px] tracking-wide text-gray-900 dark:text-[#F5F3FA] truncate transition-colors group-hover:text-[#5C2A52] dark:group-hover:text-[#C4A8E0]"
                  >
                    {producto.nombre}
                  </p>
                  <p
                    style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                    className="text-[13px] font-bold text-[#0A0A0A] dark:text-[#F5F3FA] mt-0.5"
                  >
                    {formatPrecio(producto.precio)}
                  </p>
                </motion.button>
              ))}
            </div>
            )}
          </section>
          );
        })()}
      </>
    );
  }

  return (
    <>
      {/* Banner de categoría */}
      <div className="w-full relative overflow-hidden bg-black" style={{ aspectRatio: '1750 / 899' }}>
        <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover">
          <source src="/backgrounds/hero-sale.mp4" type="video/mp4" />
        </video>
        <AnimatePresence mode="wait">
          <motion.div
            key={categoriaActiva}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 flex items-center justify-center"
            style={{
              background: categoriaActiva === 'sale'
                ? 'linear-gradient(135deg, rgba(0,0,0,0.75) 0%, rgba(40,0,0,0.6) 55%, rgba(80,0,0,0.45) 100%)'
                : 'linear-gradient(135deg, rgba(10,10,10,0.55) 0%, rgba(59,10,69,0.45) 55%, rgba(92,42,82,0.3) 100%)',
            }}
          >
            <span
              style={{ fontFamily: '"Playfair Display", Georgia, "Iowan Old Style", "Palatino Linotype", "Times New Roman", serif' }}
              className={`text-4xl sm:text-6xl tracking-wide uppercase ${categoriaActiva === 'sale' ? 'text-red-600' : 'text-white'}`}
            >
              {categoriaActiva}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Subcategorías rápidas (mismo agrupado del mega menú) */}
      {categoriaMenu && (
        <div className="bg-[#F7F5FC] dark:bg-[#17101f] border-b border-gray-200 dark:border-[#3A2E4D]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setFiltroSubcategoria("")}
              style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
              className={`flex-shrink-0 px-4 py-1.5 text-xs font-bold uppercase tracking-wide border transition-colors ${
                !filtroSubcategoria
                  ? "border-[#0A0A0A] bg-[#0A0A0A] text-white dark:border-[#F5F3FA] dark:bg-[#F5F3FA] dark:text-[#0A0A0A]"
                  : "border-[#E7E0DA] dark:border-[#3A2E4D] text-[#0A0A0A] dark:text-[#F5F3FA] hover:border-[#5C2A52]"
              }`}
            >
              Todo
            </button>
            {categoriaMenu.subcategorias.map((sub) => (
              <button
                key={sub.clave}
                onClick={() => setFiltroSubcategoria(sub.clave)}
                style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                className={`flex-shrink-0 px-4 py-1.5 text-xs font-bold uppercase tracking-wide border transition-colors ${
                  filtroSubcategoria === sub.clave
                    ? "border-[#0A0A0A] bg-[#0A0A0A] text-white dark:border-[#F5F3FA] dark:bg-[#F5F3FA] dark:text-[#0A0A0A]"
                    : "border-[#E7E0DA] dark:border-[#3A2E4D] text-[#0A0A0A] dark:text-[#F5F3FA] hover:border-[#5C2A52]"
                }`}
              >
                {sub.etiqueta}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Barra de Búsqueda y Filtros */}
      <div className="bg-white dark:bg-[#17101f] border-b border-gray-200 dark:border-[#3A2E4D]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-3">
            <Select value={ordenar} onValueChange={setOrdenar}>
              <SelectTrigger className="w-52 bg-white dark:bg-[#1e1530] dark:text-[#F5F3FA] dark:border-[#3A2E4D] h-9 text-sm" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
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
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-[#3A2E4D] dark:text-[#F5F3FA] rounded-none text-sm font-medium hover:border-gray-900 dark:hover:border-[#5C2A52] transition-colors">
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
      {(() => {
        const productosGrid = productosPagina;

        return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="mb-4 flex justify-between items-center">
          <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-gray-600 dark:text-[#b9aedd]">
            {productosLoading
              ? 'Cargando productos…'
              : `${productosFiltrados.length} ${productosFiltrados.length === 1 ? 'producto encontrado' : 'productos encontrados'}`}
          </p>
        </div>

        {productosLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="w-full aspect-[3/4] bg-gray-200 dark:bg-[#221830] rounded" />
                <div className="h-4 bg-gray-200 dark:bg-[#221830] rounded mt-3 w-3/4" />
                <div className="h-4 bg-gray-200 dark:bg-[#221830] rounded mt-2 w-1/2" />
              </div>
            ))}
          </div>
        ) : productosGrid.length === 0 ? (
          <EstadoVacioProductos
            busqueda={busqueda}
            hayFiltrosActivos={contadorFiltros > 0}
            onLimpiarTodo={limpiarTodosLosFiltros}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {productosGrid.map((producto, indiceProducto) => (
              <motion.div
                key={producto.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: Math.min(indiceProducto, 8) * 0.05, ease: [0.16, 1, 0.3, 1] }}
                className="group">
                <div
                  onClick={() => abrirDetalleProducto(producto)}
                  className="relative aspect-[3/4] overflow-hidden bg-[#F7F5FC] dark:bg-[#17101f] cursor-pointer"
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
                        producto.badge === "Sale" ? "bg-red-500/90 hover:bg-red-500/90" : "bg-[#5C2A52]/90 hover:bg-[#5C2A52]/90"
                      }`}
                    >
                      {producto.badge}
                    </Badge>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleFavorito(producto.id); }}
                    title="Añadir a favoritos"
                    className="absolute top-3.5 right-3.5 w-8 h-8 flex items-center justify-center rounded-none bg-white/90 dark:bg-[#0A0A0A]/90 backdrop-blur-sm shadow-sm hover:scale-110 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C2A52] focus-visible:ring-offset-1"
                  >
                    <Heart className={`w-4 h-4 transition-colors ${esFavorito(producto.id) ? "fill-[#5C2A52] text-[#5C2A52]" : "text-gray-500 dark:text-[#b9aedd]"}`} />
                  </button>
                  {producto.agotado ? (
                    <div className="absolute inset-0 bg-white/70 dark:bg-black/60 backdrop-blur-[1px] flex items-center justify-center">
                      <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="bg-[#0A0A0A] text-white text-[11px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-none">
                        Agotado
                      </span>
                    </div>
                  ) : (
                    <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          agregarAlCarrito(producto, producto.tallas[0] || 'Única', producto.colores?.[0] || '');
                          onAbrirCarrito();
                        }}
                        style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                        className="w-full flex items-center justify-center gap-2 bg-[#0A0A0A]/95 dark:bg-[#5C2A52]/95 backdrop-blur-sm text-white text-[11px] font-bold uppercase tracking-widest py-3 hover:bg-black dark:hover:bg-[#3B0A45] transition-colors"
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
                    className="text-gray-900 dark:text-[#F5F3FA] text-[11px] tracking-wide uppercase mb-1.5 line-clamp-2 transition-colors group-hover:text-[#5C2A52] dark:group-hover:text-[#C4A8E0]"
                  >
                    {producto.nombre}
                  </h3>
                  {(producto.totalValoraciones ?? 0) > 0 && (
                    <div className="mb-1.5">
                      <Estrellas valor={producto.rating ?? 0} size={11} />
                    </div>
                  )}
                  <div className="flex items-center gap-2" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
                    {producto.precioOriginal ? (
                      <>
                        <span className="text-[#5C2A52] font-bold text-[15px]">
                          {formatPrecio(producto.precio)}
                        </span>
                        <span className="text-[13px] text-gray-400 dark:text-[#7d6f77] line-through">
                          {formatPrecio(producto.precioOriginal)}
                        </span>
                      </>
                    ) : (
                      <span className="text-gray-900 dark:text-[#F5F3FA] font-bold text-[15px]">
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
                          className="w-[16px] h-[16px] rounded-full border border-black/10 dark:border-white/15 hover:scale-125 hover:ring-2 hover:ring-[#5C2A52] hover:ring-offset-1 transition-all"
                          style={{ backgroundColor: getColorHex(color) }}
                        />
                      ))}
                      {producto.colores.length > 5 && (
                        <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-[10px] text-gray-400 dark:text-[#b9aedd] font-medium">+{producto.colores.length - 5}</span>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Paginación */}
        {totalPaginas > 1 && (
          <div className="flex items-center justify-center gap-4 mt-8 mb-4">
            <button
              onClick={() => { setPaginaActual(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={paginaActual === 1}
              style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
              className="px-5 py-2 text-sm border border-gray-300 dark:border-[#3A2E4D] dark:text-[#F5F3FA] rounded-none hover:border-[#5C2A52] hover:text-[#5C2A52] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ← Anterior
            </button>
            <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-600 dark:text-[#b9aedd]">
              {paginaActual} / {totalPaginas}
            </span>
            <button
              onClick={() => { setPaginaActual(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={paginaActual === totalPaginas}
              style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
              className="px-5 py-2 text-sm border border-gray-300 dark:border-[#3A2E4D] dark:text-[#F5F3FA] rounded-none hover:border-[#5C2A52] hover:text-[#5C2A52] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Siguiente →
            </button>
          </div>
        )}
      </div>
        );
      })()}
    </>
  );
};
