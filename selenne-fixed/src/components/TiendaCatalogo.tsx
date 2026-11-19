import React from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { ShoppingBag, Heart, SlidersHorizontal } from "lucide-react";
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
  heroTitle: string;
  onIrATienda: (categoria: Categoria) => void;
  onAbrirCarrito: () => void;
}

export const TiendaCatalogo: React.FC<TiendaCatalogoProps> = ({
  vista,
  categoriaActiva,
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
  } = useCatalogoFiltrado(categoriaActiva);

  const formatPrecio = (precio: number) => formatCurrency(precio);

  const abrirDetalleProducto = (producto: Producto, colorPreferido?: string) => {
    navigate(colorPreferido ? `/producto/${producto.id}?color=${encodeURIComponent(colorPreferido)}` : `/producto/${producto.id}`);
  };

  if (vista === "home") {
    const categorias: { id: Categoria; titulo: string; imagen: string; cta: string }[] = [
      { id: "mujer", titulo: "COLECCIÓN MUJER", imagen: "/banners/banner-mujer.webp", cta: "DESCUBRE MÁS" },
      { id: "accesorios", titulo: "ACCESORIOS", imagen: "/banners/banner-accesorios.webp", cta: "DESCUBRE MÁS" },
      { id: "sale", titulo: "SALE", imagen: "/banners/banner-sale.webp", cta: "DESCUBRE MÁS" },
    ];

    return (
      <>
        {/* Hero de marca */}
        <section
          className="relative flex items-center justify-center text-center px-4 py-28 sm:py-40 overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #241B22 0%, #7a3350 55%, #A3395C 100%)' }}
        >
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <p
              style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
              className="text-white/70 text-xs sm:text-sm font-bold tracking-[0.2em] uppercase mb-5"
            >
              La boutique
            </p>
            <h1
              style={{ fontFamily: '"Playfair Display", Georgia, "Iowan Old Style", "Palatino Linotype", "Times New Roman", serif' }}
              className="text-white text-5xl sm:text-7xl mb-5"
            >
              {heroTitle}
            </h1>
            <p
              style={{ fontFamily: '"Playfair Display", Georgia, "Iowan Old Style", "Palatino Linotype", "Times New Roman", serif' }}
              className="text-white/85 text-base sm:text-xl italic mb-10 max-w-xl mx-auto"
            >
              Prendas que realzan tu belleza y te acompañan a brillar en cada momento
            </p>
            <button
              onClick={() => onIrATienda(categoriaActiva)}
              style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
              className="bg-white text-[#241B22] px-10 py-3.5 text-xs font-bold tracking-widest uppercase hover:scale-[1.03] transition-transform"
            >
              Ver colección
            </button>
          </motion.div>
        </section>

        {/* Banner de newsletter / cupón */}
        <section className="relative overflow-hidden" style={{ background: '#FBF8F5' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
            <div>
              <h2
                style={{ fontFamily: '"Playfair Display", Georgia, "Iowan Old Style", "Palatino Linotype", "Times New Roman", serif' }}
                className="text-2xl sm:text-3xl text-[#241B22] mb-2"
              >
                10% de descuento en tu primera compra
              </h2>
              <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-600">
                Suscríbete y sé la primera en conocer nuestras novedades
              </p>
            </div>
            <button
              onClick={() => onIrATienda(categoriaActiva)}
              style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
              className="bg-[#241B22] text-white px-8 py-3 text-xs font-bold tracking-widest uppercase hover:bg-black transition-colors flex-shrink-0"
            >
              Suscribirme
            </button>
          </div>
        </section>

        {/* Categorías destacadas estilo editorial */}
        <section className="w-full flex flex-col gap-px bg-[#E7E0DA]">
          {categorias.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onIrATienda(cat.id)}
              className="relative group overflow-hidden text-left w-full"
              style={{ aspectRatio: '1750 / 899' }}
            >
              <img
                src={cat.imagen}
                alt={cat.titulo}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
              <div className="absolute bottom-6 right-6 sm:bottom-10 sm:right-10">
                <span
                  onClick={() => onIrATienda(cat.id)}
                  style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                  className="text-white text-xs font-bold tracking-widest uppercase border-b border-white pb-1 flex items-center gap-2"
                >
                  {cat.cta} →
                </span>
              </div>
            </button>
          ))}
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
                onClick={() => onIrATienda(categoriaActiva)}
                style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                className="text-xs font-bold tracking-widest text-[#A3395C] hover:text-[#8a2f45] transition-colors uppercase"
              >
                Ver todo →
              </button>
            </div>
            <div className={`flex gap-4 sm:gap-6 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap sm:overflow-visible ${destacados.length < 4 ? 'sm:justify-center' : ''}`}>
              {destacados.map((producto, indiceDestacado) => (
                <motion.button
                  key={producto.id}
                  onClick={() => abrirDetalleProducto(producto)}
                  initial={{ opacity: 0, y: 20, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.55, delay: indiceDestacado * 0.06, ease: [0.16, 1, 0.3, 1] }}
                  className="text-left flex-shrink-0 w-40 sm:w-56 group"
                >
                  <div className="overflow-hidden mb-3 bg-[#FBF8F5] dark:bg-[#2a2029]">
                    <img
                      src={producto.imagen}
                      alt={producto.nombre}
                      className="w-full h-52 sm:h-64 object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>
                  <p
                    style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                    className="text-[11px] tracking-wide text-gray-900 dark:text-[#F5EDE9] truncate transition-colors group-hover:text-[#A3395C] dark:group-hover:text-[#e0879c]"
                  >
                    {producto.nombre}
                  </p>
                  <p
                    style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                    className="text-[13px] font-bold text-[#241B22] dark:text-[#F5EDE9] mt-0.5"
                  >
                    {formatPrecio(producto.precio)}
                  </p>
                </motion.button>
              ))}
            </div>
          </section>
        )}
      </>
    );
  }

  return (
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
            {productosPagina.map((producto, indiceProducto) => (
              <motion.div
                key={producto.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: Math.min(indiceProducto, 8) * 0.05, ease: [0.16, 1, 0.3, 1] }}
                className="group">
                <div
                  onClick={() => abrirDetalleProducto(producto)}
                  className="relative aspect-[3/4] overflow-hidden bg-[#FBF8F5] dark:bg-[#2a2029] cursor-pointer"
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
                          onAbrirCarrito();
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
                    className="text-gray-900 dark:text-[#F5EDE9] text-[11px] tracking-wide uppercase mb-1.5 line-clamp-2 transition-colors group-hover:text-[#A3395C] dark:group-hover:text-[#e0879c]"
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
                        <span className="text-[#A3395C] font-bold text-[15px]">
                          {formatPrecio(producto.precio)}
                        </span>
                        <span className="text-[13px] text-gray-400 dark:text-[#7d6f77] line-through">
                          {formatPrecio(producto.precioOriginal)}
                        </span>
                      </>
                    ) : (
                      <span className="text-gray-900 dark:text-[#F5EDE9] font-bold text-[15px]">
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
        {totalPaginas > 1 && (
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
              {paginaActual} / {totalPaginas}
            </span>
            <button
              onClick={() => { setPaginaActual(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={paginaActual === totalPaginas}
              style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
              className="px-5 py-2 text-sm border border-gray-300 dark:border-[#453840] dark:text-[#F5EDE9] rounded-lg hover:border-[#A3395C] hover:text-[#A3395C] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Siguiente →
            </button>
          </div>
        )}
      </div>
    </>
  );
};
