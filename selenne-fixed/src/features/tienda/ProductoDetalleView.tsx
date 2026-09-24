import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams, Link } from "react-router-dom";
import {
  ChevronLeft,
  Heart,
  Package,
  Globe,
  Lock,
  Check,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  User as UserIcon,
} from "lucide-react";
import { Separator } from "../../components/ui/separator";
import { ThemeToggle } from "../../components/ThemeToggle";
import { StoreFooter } from "../../components/StoreFooter";
import { CuponBanner } from "../../components/CuponBanner";
import { ImageCarousel } from "../../components/figma/ImageCarousel";
import { ResenasProducto } from "../../components/ResenasProducto";
import { Estrellas } from "../../components/Estrellas";
import { CarritoSheet } from "../../components/CarritoSheet";
import { FavoritosSheet } from "../../components/FavoritosSheet";
import { useProductosCombinados } from "../../shared/data/useProductosCombinados";
import { useTienda } from "../../shared/contexts/TiendaContext";
import { useSubcategorias } from "../../shared/contexts/SubcategoriasContext";
import { useAuth } from "../../shared/contexts/AuthContext";
import { formatCurrency } from "../../shared/utils";

const FONT_SERIF = '"Playfair Display", Georgia, "Iowan Old Style", "Palatino Linotype", "Times New Roman", serif';
const FONT_SANS = '"Helvetica Neue", Helvetica, Arial, sans-serif';
const GRADIENT = "linear-gradient(90deg, #241B22 0%, #7a3350 55%, #A3395C 100%)";

export const ProductoDetalleView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const productosData = useProductosCombinados();
  const { colores } = useSubcategorias();
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

  const producto = productosData.find((p) => p.id === Number(id));

  const [tallaSeleccionada, setTallaSeleccionada] = useState("");
  const [colorSeleccionado, setColorSeleccionado] = useState("");
  const [cantidadSeleccionada, setCantidadSeleccionada] = useState(1);
  const [carritoAbierto, setCarritoAbierto] = useState(false);
  const [favoritosOpen, setFavoritosOpen] = useState(false);
  const [telefonoContacto] = useState("+57 304 292 8493");

  // Preseleccionar la primera talla/color disponibles cuando cambia el producto.
  useEffect(() => {
    if (!producto) return;
    const colorPreferido = searchParams.get("color");
    const colorIni = (colorPreferido && producto.colores?.includes(colorPreferido))
      ? colorPreferido
      : (producto.colores?.[0] || "");
    setColorSeleccionado(colorIni);
    const tallasP = producto.tallas || [];
    const variantesP = producto.variantes || [];
    const tallaIni = tallasP.find((t: string) => {
      if (!variantesP.length) return true;
      const v = variantesP.find((x) => x.tallaNombre === t && (!colorIni || x.colorNombre === colorIni));
      return v ? v.stock > 0 : true;
    });
    setTallaSeleccionada(tallaIni || tallasP[0] || "Única");
    setCantidadSeleccionada(1);
    window.scrollTo({ top: 0 });
  }, [producto?.id]);

  useEffect(() => {
    if (producto) document.title = `${producto.nombre} — Selenne Boutique`;
    return () => { document.title = "Selenne Boutique"; };
  }, [producto?.nombre]);

  const formatPrecio = (precio: number) => formatCurrency(precio);

  const getColorHex = (colorNombre: string): string => {
    const color = colores.find((c) => c.nombre.toLowerCase() === colorNombre.toLowerCase());
    return color?.hexColor || "#808080";
  };

  const calcularDescuento = (precio: number, precioOriginal: number) => {
    const descuento = ((precioOriginal - precio) / precioOriginal) * 100;
    return Math.round(descuento);
  };

  const irATienda = (categoria: "mujer" | "accesorios" | "sale") => {
    navigate(`/tienda/${categoria}`);
  };

  const handleAgregarAlCarrito = () => {
    if (!producto || !tallaSeleccionada) return;
    agregarAlCarrito(producto, tallaSeleccionada, colorSeleccionado, cantidadSeleccionada);
  };

  const handleCompraDirecta = () => {
    if (!producto || !tallaSeleccionada) return;
    agregarAlCarrito(producto, tallaSeleccionada, colorSeleccionado, cantidadSeleccionada);
    navigate("/checkout");
  };

  if (!producto) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#2a2029] flex flex-col items-center justify-center gap-4 px-4 text-center">
        <p style={{ fontFamily: FONT_SERIF }} className="text-2xl text-[#241B22] dark:text-[#F5EDE9]">
          Producto no encontrado
        </p>
        <Link
          to="/"
          className="text-sm font-semibold uppercase tracking-wider text-white px-6 py-3 rounded-full"
          style={{ background: GRADIENT, fontFamily: FONT_SANS }}
        >
          Volver a la tienda
        </Link>
      </div>
    );
  }

  const imagenesPorColor = producto.imagenesPorColor || {};
  const colorKey = colorSeleccionado?.toLowerCase();
  const normalizedMap: Record<string, string[]> = {};
  Object.entries(imagenesPorColor).forEach(([k, v]) => { normalizedMap[k.toLowerCase()] = v; });
  const imgsForColor = (() => {
    const imgsDelColor = (colorKey && normalizedMap[colorKey]) || [];
    if (imgsDelColor.length > 0) return [...new Set(imgsDelColor)];
    const imgsGenerales = producto.imagenes && producto.imagenes.length > 0
      ? producto.imagenes
      : (producto.imagen ? [producto.imagen] : []);
    return [...new Set([producto.imagen, ...imgsGenerales].filter(Boolean))];
  })();

  return (
    <div className="min-h-screen bg-white dark:bg-[#2a2029] flex flex-col">
      <header className="sticky top-0 z-50 bg-[#FBF8F5] dark:bg-[#2a2029] border-b border-[#E7E0DA] dark:border-[#453840] shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link
              to="/"
              className="flex items-center justify-center hover:opacity-75 transition-opacity"
              title="Selenne Boutique — Inicio"
            >
              <span
                style={{ fontFamily: FONT_SERIF }}
                className="text-lg sm:text-2xl font-medium tracking-[0.04em] text-[#241B22] dark:text-[#F5EDE9] whitespace-nowrap"
              >
                Selenne Boutique
              </span>
            </Link>

            <nav className="hidden lg:flex items-center space-x-10">
              {(["mujer", "accesorios", "sale"] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => irATienda(cat)}
                  className="py-2 text-[12px] tracking-[0.12em] uppercase font-semibold text-[#241B22] dark:text-[#F5EDE9] opacity-70 hover:opacity-100 transition-opacity"
                >
                  {cat === "mujer" ? "Mujer" : cat === "accesorios" ? "Accesorios" : "Sale"}
                </button>
              ))}
            </nav>

            <div className="flex items-center space-x-0.5 sm:space-x-4">
              <ThemeToggle buttonClassName="p-1.5 sm:p-2 hover:bg-[#EFD9DF] dark:hover:bg-[#3a2530] rounded-full transition-colors" iconClassName="w-[18px] h-[18px] sm:w-5 sm:h-5 text-[#241B22] dark:text-[#F5EDE9]" />
              <button
                onClick={() => navigate("/")}
                className="hidden md:flex p-1.5 sm:p-2 hover:bg-[#EFD9DF] dark:hover:bg-[#3a2530] rounded-full transition-colors"
                title="Buscar"
                aria-label="Buscar"
              >
                <Search className="w-[18px] h-[18px] sm:w-5 sm:h-5 text-[#241B22] dark:text-[#F5EDE9]" />
              </button>
              <FavoritosSheet
                open={favoritosOpen}
                onOpenChange={setFavoritosOpen}
                favoritos={favoritos}
                productos={productosData}
                formatPrecio={formatPrecio}
                onQuitar={toggleFavorito}
                onVer={(p) => navigate(`/producto/${p.id}`)}
                trigger={
                  <button
                    className="p-1.5 sm:p-2 hover:bg-[#EFD9DF] dark:hover:bg-[#3a2530] rounded-full transition-colors relative"
                    aria-label="Favoritos"
                    title="Favoritos"
                  >
                    <Heart className="w-[18px] h-[18px] sm:w-6 sm:h-6 text-[#241B22] dark:text-[#F5EDE9]" />
                    {favoritos.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-[#A3395C] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {favoritos.length}
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
                onCheckout={() => navigate("/checkout")}
                onVerProducto={(item) => navigate(`/producto/${item.id}`)}
                trigger={
                  <button
                    className="p-1.5 sm:p-2 hover:bg-[#EFD9DF] dark:hover:bg-[#3a2530] rounded-full transition-colors relative"
                    aria-label="Carrito"
                    title="Carrito"
                  >
                    <ShoppingBag className="w-[18px] h-[18px] sm:w-6 sm:h-6 text-[#241B22] dark:text-[#F5EDE9]" />
                    {carritoItems.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-[#A3395C] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {carritoItems.length}
                      </span>
                    )}
                  </button>
                }
              />
              <button
                onClick={() => navigate(user ? "/dashboard" : "/login")}
                className="p-1.5 sm:p-2 hover:bg-[#EFD9DF] dark:hover:bg-[#3a2530] rounded-full transition-colors"
                aria-label="Mi cuenta"
                title={user ? "Mi cuenta" : "Iniciar sesión"}
              >
                <UserIcon className="w-[18px] h-[18px] sm:w-6 sm:h-6 text-[#241B22] dark:text-[#F5EDE9]" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <CuponBanner />

      <div className="max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 pt-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#7d6f77] dark:text-[#b8a3ac] hover:text-[#A3395C] dark:hover:text-[#A3395C] transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Volver
        </button>
      </div>

      <div className="max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 py-3 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:gap-8 lg:gap-10">
          {/* LEFT: Image panel — sin marco, tipo editorial */}
          <div className="relative w-full h-[380px] sm:h-auto sm:w-[52%] sm:self-start sm:aspect-[4/5] lg:self-stretch lg:aspect-auto lg:max-h-[600px] flex-shrink-0 overflow-hidden rounded-xl bg-[#FBF8F5] dark:bg-[#2a2029]">
            <ImageCarousel
              key={`${producto.id}-${colorSeleccionado || "default"}`}
              imagenes={imgsForColor}
              nombre={producto.nombre}
              className="w-full h-full"
            />
          </div>

          {/* RIGHT: Details panel */}
          <div className="flex-1 flex flex-col gap-4 pt-5 sm:pt-0">
            <div>
              <p style={{ fontFamily: FONT_SANS }} className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#A3395C] mb-2">
                {[producto.tipoProducto, producto.subcategoria].filter(Boolean).join(" · ") || "Selenne Boutique"}
              </p>
              <div className="flex items-start justify-between gap-3">
                <h1
                  style={{ fontFamily: FONT_SERIF }}
                  className="text-2xl sm:text-3xl font-bold uppercase tracking-[0.01em] text-[#241B22] dark:text-[#F5EDE9] leading-[1.1]"
                >
                  {producto.nombre}
                </h1>
                <button
                  onClick={() => toggleFavorito(producto.id)}
                  title={esFavorito(producto.id) ? "Quitar de favoritos" : "Agregar a favoritos"}
                  className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all flex-shrink-0 ${
                    esFavorito(producto.id)
                      ? "border-[#A3395C] bg-[#A3395C] text-white"
                      : "border-[#E7E0DA] dark:border-[#453840] text-[#7d6f77] dark:text-[#b8a3ac] hover:border-[#A3395C] hover:text-[#A3395C]"
                  }`}
                >
                  <Heart className="w-4 h-4" fill={esFavorito(producto.id) ? "currentColor" : "none"} />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between" style={{ fontFamily: FONT_SANS }}>
              <div className="flex items-baseline gap-3">
                <span className="text-xl font-bold text-[#A3395C]">{formatPrecio(producto.precio)}</span>
                {producto.precioOriginal && (
                  <>
                    <span className="text-sm text-[#7d6f77] dark:text-[#b8a3ac] line-through">
                      {formatPrecio(producto.precioOriginal)}
                    </span>
                    <span className="text-xs font-semibold text-red-500">
                      -{calcularDescuento(producto.precio, producto.precioOriginal)}%
                    </span>
                  </>
                )}
              </div>
              <Estrellas valor={producto.rating ?? 0} total={producto.totalValoraciones ?? 0} size={13} />
            </div>

            {producto.descripcion && (
              <p style={{ fontFamily: FONT_SANS }} className="text-sm text-[#7d6f77] dark:text-[#b8a3ac] leading-relaxed">
                {producto.descripcion}
              </p>
            )}

            <Separator />

            {producto.colores && producto.colores.length > 0 && (
              <div>
                <p style={{ fontFamily: FONT_SANS }} className="text-sm font-semibold text-[#241B22] dark:text-[#F5EDE9] mb-2">Color</p>
                <div className="flex gap-3 flex-wrap">
                  {producto.colores.map((color) => {
                    const hexColor = getColorHex(color);
                    const seleccionado = colorSeleccionado === color;
                    return (
                      <button
                        key={color}
                        onClick={() => setColorSeleccionado(color)}
                        className={`relative w-9 h-9 rounded-full border transition-all ${
                          seleccionado
                            ? "border-[#241B22] dark:border-[#F5EDE9] scale-110"
                            : "border-[#E7E0DA] dark:border-[#453840] hover:scale-105"
                        }`}
                        style={{ backgroundColor: hexColor }}
                        title={color}
                      >
                        {seleccionado && (
                          <span className="absolute inset-0 flex items-center justify-center">
                            <Check className="w-4 h-4 drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]" style={{ color: "#fff" }} strokeWidth={3} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {(() => {
              const tallasProducto: string[] = producto.tallas || [];
              const variantes = producto.variantes || [];
              const stockGeneral: number = producto.stock ?? 0;
              if (tallasProducto.length === 0) return null;
              const todosVariantesCero = variantes.length > 0 && variantes.every((x) => (x.stock ?? 0) <= 0);
              return (
                <div>
                  <p style={{ fontFamily: FONT_SANS }} className="text-sm font-semibold text-[#241B22] dark:text-[#F5EDE9] mb-2">Talla</p>
                  <div className="flex flex-wrap gap-2">
                    {tallasProducto.map((talla) => {
                      let sinStock = false;
                      let stockDisponible: number;
                      if (talla === "Única") {
                        sinStock = stockGeneral <= 0;
                        stockDisponible = stockGeneral;
                      } else if (variantes.length > 0 && !todosVariantesCero) {
                        const colorEfectivo = colorSeleccionado || (producto.colores?.length === 1 ? producto.colores[0] : null);
                        if (colorEfectivo) {
                          const v = variantes.find((x) => x.tallaNombre === talla && x.colorNombre === colorEfectivo);
                          stockDisponible = v?.stock ?? 0;
                        } else {
                          stockDisponible = variantes.filter((x) => x.tallaNombre === talla).reduce((s, x) => s + (x.stock ?? 0), 0);
                        }
                        sinStock = stockDisponible <= 0;
                      } else {
                        stockDisponible = stockGeneral > 0 ? stockGeneral : 10;
                        sinStock = stockDisponible <= 0;
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
                              ? "border-[#E7E0DA] dark:border-[#453840] text-[#c3bab3] dark:text-[#5a4d52] bg-[#FBF8F5] dark:bg-[#2a2029] cursor-not-allowed line-through"
                              : seleccionada
                                ? "border-[#241B22] bg-[#241B22] text-white"
                                : "border-[#E7E0DA] dark:border-[#453840] text-[#241B22] dark:text-[#F5EDE9] hover:border-[#A3395C]"
                          }`}
                          title={sinStock ? "Agotado" : `${talla} — ${stockDisponible} disponibles`}
                        >
                          {talla}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {producto.materiales && producto.materiales.length > 0 && (
              <div>
                <p style={{ fontFamily: FONT_SANS }} className="text-sm font-semibold text-[#241B22] dark:text-[#F5EDE9] mb-2">Material</p>
                <div className="flex flex-wrap gap-2">
                  {producto.materiales.map((material: string) => (
                    <span key={material} style={{ fontFamily: FONT_SANS }} className="px-3 py-1 bg-[#EFD9DF] dark:bg-[#3a2530] text-xs font-medium text-[#A3395C] rounded-full">
                      {material}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 pt-3 mt-1 border-t border-[#E7E0DA] dark:border-[#453840]" style={{ flexShrink: 0, fontFamily: FONT_SANS }}>
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
                onClick={handleAgregarAlCarrito}
                disabled={!tallaSeleccionada || producto.agotado}
                className={`flex-1 h-11 rounded-full border text-xs font-semibold uppercase tracking-wider transition-all ${
                  !tallaSeleccionada || producto.agotado
                    ? "border-[#E7E0DA] dark:border-[#453840] text-[#c3bab3] dark:text-[#5a4d52] cursor-not-allowed"
                    : "border-[#241B22] dark:border-[#F5EDE9] text-[#241B22] dark:text-[#F5EDE9] hover:bg-[#241B22] hover:text-white dark:hover:bg-[#F5EDE9] dark:hover:text-[#241B22]"
                }`}
              >
                {producto.agotado ? "Agotado" : "Agregar al Carrito"}
              </button>
            </div>

            <button
              onClick={handleCompraDirecta}
              disabled={!tallaSeleccionada || producto.agotado}
              style={!tallaSeleccionada || producto.agotado ? { flexShrink: 0, fontFamily: FONT_SANS } : { flexShrink: 0, fontFamily: FONT_SANS, background: GRADIENT }}
              className={`w-full h-12 rounded-full text-xs font-semibold uppercase tracking-wider text-white transition-all ${
                !tallaSeleccionada || producto.agotado ? "bg-[#E7E0DA] dark:bg-[#453840] cursor-not-allowed" : "shadow-md hover:shadow-lg hover:scale-[1.01]"
              }`}
            >
              {producto.agotado ? "Agotado" : "Comprar Ahora"}
            </button>

            <div className="flex flex-col gap-2.5 pt-1" style={{ fontFamily: FONT_SANS }}>
              <div className="flex items-center gap-2.5 text-xs text-[#7d6f77] dark:text-[#b8a3ac]">
                <Package className="w-4 h-4 text-[#A3395C] flex-shrink-0" strokeWidth={1.75} />
                <span>Entrega en 3-5 días hábiles</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-[#7d6f77] dark:text-[#b8a3ac]">
                <Globe className="w-4 h-4 text-[#A3395C] flex-shrink-0" strokeWidth={1.75} />
                <span>Envíos a todo el país</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-[#7d6f77] dark:text-[#b8a3ac]">
                <Lock className="w-4 h-4 text-[#A3395C] flex-shrink-0" strokeWidth={1.75} />
                <span>Pago 100% seguro</span>
              </div>
            </div>

            <Separator />
            <ResenasProducto
              productoId={producto.id}
              promedio={producto.rating ?? 0}
              total={producto.totalValoraciones ?? 0}
              puedeEscribir={!!user}
            />
          </div>
        </div>
      </div>

      {(() => {
        const relacionados = productosData
          .filter((p) => p.id !== producto.id && p.categoria === producto.categoria)
          .slice(0, 4);
        if (relacionados.length === 0) return null;
        return (
          <div className="max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 py-8 sm:py-10 border-t border-[#E7E0DA] dark:border-[#453840]">
            <h2
              style={{ fontFamily: FONT_SERIF }}
              className="text-lg sm:text-xl font-bold uppercase tracking-[0.01em] text-[#241B22] dark:text-[#F5EDE9] mb-5"
            >
              También te podría gustar
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
              {relacionados.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => navigate(`/producto/${p.id}`)}
                  className="text-left group"
                >
                  <div className="aspect-[4/5] rounded-xl overflow-hidden bg-[#FBF8F5] dark:bg-[#2a2029] mb-3">
                    <img
                      src={p.imagen}
                      alt={p.nombre}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                  <p style={{ fontFamily: FONT_SANS }} className="text-sm font-medium text-[#241B22] dark:text-[#F5EDE9] truncate">
                    {p.nombre}
                  </p>
                  <p className="text-sm font-bold text-[#A3395C]">{formatPrecio(p.precio)}</p>
                </button>
              ))}
            </div>
          </div>
        );
      })()}

      <StoreFooter telefonoContacto={telefonoContacto} onCategoriaChange={irATienda} />
    </div>
  );
};

export default ProductoDetalleView;
