import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingBag, Heart, Search, Menu, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import { Separator } from "./ui/separator";
import { FavoritosSheet } from "./FavoritosSheet";
import { CarritoSheet } from "./CarritoSheet";
import { useProductosCombinados } from "../shared/data/useProductosCombinados";
import { useTienda } from "../shared/contexts/TiendaContext";
import type { Categoria } from "../shared/hooks/useCatalogoFiltrado";
import { formatCurrency } from "../shared/utils";

interface TiendaHeaderProps {
  categoriaActiva: Categoria;
  tiendaNavActiva: boolean;
  onIrATienda: (categoria: Categoria) => void;
  onLogoClick: () => void;
  onCheckout: () => void;
  carritoAbierto: boolean;
  onCarritoOpenChange: (open: boolean) => void;
  /** "Mi cuenta" o Iniciar Sesión/Registrarse — distinto según quién use el header. */
  accountSlot: React.ReactNode;
  /** Sección de auth del menú móvil; se omite por completo si no se pasa. */
  mobileAuthSlot?: React.ReactNode;
  /** Reemplaza el buscador (p.ej. la campana de notificaciones del perfil). */
  searchAreaOverride?: React.ReactNode;
}

const FONT_SANS = '"Helvetica Neue", Helvetica, Arial, sans-serif';
const FONT_SERIF = '"Playfair Display", Georgia, "Iowan Old Style", "Palatino Linotype", "Times New Roman", serif';

export const TiendaHeader: React.FC<TiendaHeaderProps> = ({
  categoriaActiva,
  tiendaNavActiva,
  onIrATienda,
  onLogoClick,
  onCheckout,
  carritoAbierto,
  onCarritoOpenChange,
  accountSlot,
  mobileAuthSlot,
  searchAreaOverride,
}) => {
  const navigate = useNavigate();
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
  const [favoritosOpen, setFavoritosOpen] = useState(false);
  const [busquedaModalAbierta, setBusquedaModalAbierta] = useState(false);
  const [busquedaModal, setBusquedaModal] = useState("");

  const productosData = useProductosCombinados();
  const {
    carritoItems,
    favoritos,
    actualizarCantidad,
    removerDelCarrito,
    toggleFavorito,
    getTotalCarrito,
  } = useTienda();

  const formatPrecio = (precio: number) => formatCurrency(precio);

  const navLinkClass = (categoria: Categoria) =>
    `group relative py-2 text-[12px] tracking-[0.12em] uppercase font-semibold transition-opacity ${
      tiendaNavActiva && categoriaActiva === categoria
        ? "text-[#A3395C] opacity-100"
        : "text-[#241B22] dark:text-[#F5EDE9] opacity-70 hover:opacity-100"
    }`;

  const navUnderlineClass = (categoria: Categoria) =>
    `absolute left-0 right-0 -bottom-0.5 h-[1.5px] bg-[#A3395C] origin-left transition-transform duration-300 ${
      tiendaNavActiva && categoriaActiva === categoria ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
    }`;

  const mobileNavLinkClass = (categoria: Categoria) =>
    `block w-full text-left px-4 py-2 rounded-lg text-[13px] tracking-[0.08em] uppercase font-semibold ${
      tiendaNavActiva && categoriaActiva === categoria
        ? "bg-[#A3395C] text-white"
        : "text-[#241B22] dark:text-[#F5EDE9] hover:bg-[#EFD9DF] dark:hover:bg-[#3a2530]"
    }`;

  return (
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
              onClick={onLogoClick}
              className="flex items-center justify-center hover:opacity-75 transition-opacity"
              title="Selenne Boutique — Inicio"
            >
              <span className="text-lg sm:text-2xl font-medium tracking-[0.04em] text-[#241B22] dark:text-[#F5EDE9] whitespace-nowrap" style={{ fontFamily: FONT_SERIF }}>
                Selenne Boutique
              </span>
            </button>
          </div>

          {/* Navegación Desktop */}
          <nav className="hidden lg:flex items-center space-x-10">
            <button onClick={() => onIrATienda("mujer")} style={{ fontFamily: FONT_SANS }} className={navLinkClass("mujer")}>
              Mujer
              <span className={navUnderlineClass("mujer")} />
            </button>
            <button onClick={() => onIrATienda("accesorios")} style={{ fontFamily: FONT_SANS }} className={navLinkClass("accesorios")}>
              Accesorios
              <span className={navUnderlineClass("accesorios")} />
            </button>
            <button onClick={() => onIrATienda("sale")} style={{ fontFamily: FONT_SANS }} className={navLinkClass("sale")}>
              Sale
              <span className={navUnderlineClass("sale")} />
            </button>
          </nav>

          {/* Acciones */}
          <div className="flex items-center space-x-0.5 sm:space-x-2">
            {searchAreaOverride ?? (
              <Sheet open={busquedaModalAbierta} onOpenChange={v => { setBusquedaModalAbierta(v); if (!v) setBusquedaModal(''); }}>
                <SheetTrigger asChild>
                  <button
                    onClick={() => setBusquedaModal('')}
                    className="hidden md:flex items-center gap-2 rounded-full border border-[#E7E0DA] dark:border-[#453840] bg-white dark:bg-[#322631] pl-4 pr-3 py-2 w-[190px] text-left hover:border-[#A3395C] transition-colors"
                  >
                    <Search className="w-4 h-4 text-[#7d6f77] dark:text-[#b8a3ac] flex-shrink-0" />
                    <span className="text-[13px] text-[#7d6f77] dark:text-[#b8a3ac]" style={{ fontFamily: FONT_SANS }}>
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
                    <SheetTitle style={{ fontFamily: FONT_SANS }}>Buscar</SheetTitle>
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
                        style={{ fontFamily: FONT_SANS }}
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
                                  setBusquedaModalAbierta(false);
                                  navigate(`/producto/${p.id}`);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#362b34] transition-colors border-b border-gray-100 dark:border-[#453840] last:border-b-0"
                              >
                                <img src={p.imagen} alt={p.nombre} className="w-14 h-14 object-cover flex-shrink-0" />
                                <div className="flex-1 text-left min-w-0">
                                  <p className="text-sm font-medium text-gray-900 dark:text-[#F5EDE9] truncate" style={{ fontFamily: FONT_SANS }}>{p.nombre}</p>
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
            )}

            {accountSlot}

            <FavoritosSheet
              open={favoritosOpen}
              onOpenChange={setFavoritosOpen}
              favoritos={favoritos}
              productos={productosData}
              formatPrecio={formatPrecio}
              onQuitar={toggleFavorito}
              onVer={(prod) => {
                setFavoritosOpen(false);
                navigate(`/producto/${prod.id}`);
              }}
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
              onOpenChange={onCarritoOpenChange}
              items={carritoItems}
              formatPrecio={formatPrecio}
              total={getTotalCarrito()}
              onActualizarCantidad={actualizarCantidad}
              onRemover={removerDelCarrito}
              onCheckout={onCheckout}
              onVerProducto={(item) => {
                onCarritoOpenChange(false);
                navigate(`/producto/${item.id}`);
              }}
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
          </div>
        </div>

        {/* Navegación Móvil */}
        {menuMovilAbierto && (
          <nav className="lg:hidden py-4 space-y-2 border-t border-[#E7E0DA] dark:border-[#453840]">
            <button onClick={() => { onIrATienda("mujer"); setMenuMovilAbierto(false); }} className={mobileNavLinkClass("mujer")}>
              Mujer
            </button>
            <button onClick={() => { onIrATienda("accesorios"); setMenuMovilAbierto(false); }} className={mobileNavLinkClass("accesorios")}>
              Accesorios
            </button>
            <button onClick={() => { onIrATienda("sale"); setMenuMovilAbierto(false); }} className={mobileNavLinkClass("sale")}>
              Sale
            </button>
            {mobileAuthSlot && (
              <>
                <Separator className="my-4" />
                {mobileAuthSlot}
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  );
};
