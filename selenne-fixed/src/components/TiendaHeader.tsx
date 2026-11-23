import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingBag, Heart, Search, Menu, X, ChevronDown } from "lucide-react";
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
import { MEGA_MENU } from "../shared/data/megaMenu";
import { Logo } from "./Logo";
import { formatCurrency } from "../shared/utils";

interface TiendaHeaderProps {
  categoriaActiva: Categoria;
  tiendaNavActiva: boolean;
  onIrATienda: (categoria: Categoria, sub?: string) => void;
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
  const [megaMenuAbierto, setMegaMenuAbierto] = useState<Categoria | null>(null);
  const [acordeonMovil, setAcordeonMovil] = useState<Categoria | null>(null);

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
        ? "text-[#5C2A52] opacity-100"
        : "text-[#0A0A0A] dark:text-[#F5F3FA] opacity-70 hover:opacity-100"
    }`;

  const navUnderlineClass = (categoria: Categoria) =>
    `absolute left-0 right-0 -bottom-0.5 h-[1.5px] bg-[#5C2A52] origin-left transition-transform duration-300 ${
      tiendaNavActiva && categoriaActiva === categoria ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
    }`;

  const mobileNavLinkClass = (categoria: Categoria) =>
    `block w-full text-left px-4 py-2 rounded-none text-[13px] tracking-[0.08em] uppercase font-semibold ${
      tiendaNavActiva && categoriaActiva === categoria
        ? "bg-[#5C2A52] text-white"
        : "text-[#0A0A0A] dark:text-[#F5F3FA] hover:bg-[#C9A8C3] dark:hover:bg-[#241935]"
    }`;

  return (
    <header className="sticky top-0 z-50 bg-[#F7F5FC] dark:bg-[#17101f] border-b border-[#E7E0DA] dark:border-[#3A2E4D] shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center h-20 gap-3">
          {/* Izquierda: menú móvil + nav desktop */}
          <div className="flex items-center gap-1 sm:gap-2 justify-self-start">
            <button
              className="lg:hidden p-2 hover:bg-[#C9A8C3] dark:hover:bg-[#241935] rounded-none"
              onClick={() => setMenuMovilAbierto(!menuMovilAbierto)}
              aria-label={menuMovilAbierto ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={menuMovilAbierto}
            >
              {menuMovilAbierto ? (
                <X className="w-6 h-6 text-[#0A0A0A] dark:text-[#F5F3FA]" />
              ) : (
                <Menu className="w-6 h-6 text-[#0A0A0A] dark:text-[#F5F3FA]" />
              )}
            </button>

            {/* Navegación Desktop */}
            <nav className="hidden lg:flex items-center space-x-8">
              {(["hombre", "mujer", "accesorios"] as const).map((cat) => {
                const menu = MEGA_MENU.find((m) => m.categoria === cat)!;
                return (
                  <div
                    key={cat}
                    className="relative"
                    onMouseEnter={() => setMegaMenuAbierto(cat)}
                    onMouseLeave={() => setMegaMenuAbierto((prev) => (prev === cat ? null : prev))}
                  >
                    <button onClick={() => onIrATienda(cat)} style={{ fontFamily: FONT_SANS }} className={navLinkClass(cat)}>
                      {menu.etiqueta}
                      <span className={navUnderlineClass(cat)} />
                    </button>

                    {megaMenuAbierto === cat && (
                      <div
                        className="absolute left-1/2 -translate-x-1/2 top-full pt-3 z-50"
                        onMouseEnter={() => setMegaMenuAbierto(cat)}
                        onMouseLeave={() => setMegaMenuAbierto(null)}
                      >
                        <div className="bg-white dark:bg-[#17101f] border border-[#E7E0DA] dark:border-[#3A2E4D] shadow-xl min-w-[220px] py-3">
                          {menu.subcategorias.map((sub) => (
                            <button
                              key={sub.clave}
                              onClick={() => { onIrATienda(cat, sub.clave); setMegaMenuAbierto(null); }}
                              style={{ fontFamily: FONT_SANS }}
                              className="block w-full text-left px-5 py-2 text-[13px] text-[#0A0A0A] dark:text-[#F5F3FA] hover:bg-[#C9A8C3] dark:hover:bg-[#241935] hover:text-[#5C2A52] transition-colors whitespace-nowrap"
                            >
                              {sub.etiqueta}
                            </button>
                          ))}
                          <div className="border-t border-[#E7E0DA] dark:border-[#3A2E4D] mt-2 pt-2">
                            <button
                              onClick={() => { onIrATienda(cat); setMegaMenuAbierto(null); }}
                              style={{ fontFamily: FONT_SANS }}
                              className="block w-full text-left px-5 py-2 text-[11px] font-bold uppercase tracking-wider text-[#5C2A52] hover:text-[#3B0A45] transition-colors whitespace-nowrap"
                            >
                              Ver todo {menu.etiqueta.toLowerCase()} →
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              <button onClick={() => onIrATienda("sale")} style={{ fontFamily: FONT_SANS }} className={navLinkClass("sale")}>
                Sale
                <span className={navUnderlineClass("sale")} />
              </button>
            </nav>
          </div>

          {/* Centro: Logo */}
          <div className="justify-self-center">
            <button
              onClick={onLogoClick}
              className="flex items-center gap-2 hover:opacity-75 transition-opacity"
              title="District Store — Inicio"
            >
              <Logo className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0" />
              <span className="text-lg sm:text-2xl font-black uppercase tracking-[0.02em] text-[#0A0A0A] dark:text-[#F5F3FA] whitespace-nowrap" style={{ fontFamily: FONT_SERIF }}>
                District Store
              </span>
            </button>
          </div>

          {/* Acciones */}
          <div className="flex items-center space-x-0.5 sm:space-x-2 justify-self-end">
            {searchAreaOverride ?? (
              <Sheet open={busquedaModalAbierta} onOpenChange={v => { setBusquedaModalAbierta(v); if (!v) setBusquedaModal(''); }}>
                <SheetTrigger asChild>
                  <button
                    onClick={() => setBusquedaModal('')}
                    className="hidden md:flex items-center gap-2 rounded-none border border-[#E7E0DA] dark:border-[#3A2E4D] bg-white dark:bg-[#1e1530] pl-4 pr-3 py-2 w-[190px] text-left hover:border-[#5C2A52] transition-colors"
                  >
                    <Search className="w-4 h-4 text-[#7d6f77] dark:text-[#b9aedd] flex-shrink-0" />
                    <span className="text-[13px] text-[#7d6f77] dark:text-[#b9aedd]" style={{ fontFamily: FONT_SANS }}>
                      Buscar productos…
                    </span>
                  </button>
                </SheetTrigger>
                <SheetTrigger asChild>
                  <button
                    onClick={() => setBusquedaModal('')}
                    className="md:hidden p-1.5 sm:p-2 hover:bg-[#C9A8C3] dark:hover:bg-[#241935] rounded-none transition-colors"
                    title="Buscar"
                    aria-label="Buscar"
                  >
                    <Search className="w-[18px] h-[18px] sm:w-6 sm:h-6 text-[#0A0A0A] dark:text-[#F5F3FA]" />
                  </button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
                  <SheetHeader className="px-4 py-3 border-b border-gray-100 dark:border-[#3A2E4D]">
                    <SheetTitle style={{ fontFamily: FONT_SANS }}>Buscar</SheetTitle>
                  </SheetHeader>
                  <div className="mt-0 flex flex-col gap-0 flex-1 overflow-hidden">
                    <div className="flex items-center gap-2 border-b border-gray-200 dark:border-[#3A2E4D] px-4 py-3">
                      <Search className="w-5 h-5 text-gray-400 dark:text-[#b9aedd] flex-shrink-0" />
                      <input
                        autoFocus
                        type="text"
                        value={busquedaModal}
                        onChange={e => setBusquedaModal(e.target.value)}
                        placeholder="Buscar productos..."
                        className="flex-1 text-sm outline-none text-gray-900 dark:text-[#F5F3FA] placeholder-gray-400 dark:placeholder-[#b9aedd] bg-transparent"
                        style={{ fontFamily: FONT_SANS }}
                      />
                      {busquedaModal && (
                        <button onClick={() => setBusquedaModal('')} className="text-gray-400 hover:text-gray-600 dark:text-[#b9aedd] dark:hover:text-[#F5F3FA]">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="overflow-y-auto flex-1">
                      {busquedaModal.trim() === '' ? (
                        <p className="text-center text-sm text-gray-400 dark:text-[#b9aedd] py-10">Empieza a escribir para buscar productos</p>
                      ) : (() => {
                        const resultados = productosData.filter(p =>
                          p.nombre.toLowerCase().includes(busquedaModal.toLowerCase()) ||
                          (p.descripcion || '').toLowerCase().includes(busquedaModal.toLowerCase())
                        );
                        return resultados.length === 0 ? (
                          <p className="text-center text-sm text-gray-400 dark:text-[#b9aedd] py-10">Sin resultados para "{busquedaModal}"</p>
                        ) : (
                          <div>
                            {resultados.map(p => (
                              <button key={p.id} type="button"
                                onClick={() => {
                                  setBusquedaModalAbierta(false);
                                  navigate(`/producto/${p.id}`);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#221830] transition-colors border-b border-gray-100 dark:border-[#3A2E4D] last:border-b-0"
                              >
                                <img src={p.imagen} alt={p.nombre} className="w-14 h-14 object-cover flex-shrink-0" />
                                <div className="flex-1 text-left min-w-0">
                                  <p className="text-sm font-medium text-gray-900 dark:text-[#F5F3FA] truncate" style={{ fontFamily: FONT_SANS }}>{p.nombre}</p>
                                  {p.descripcion && <p className="text-xs text-gray-400 dark:text-[#b9aedd] truncate mt-0.5">{p.descripcion}</p>}
                                  <p className="text-sm font-bold text-gray-900 dark:text-[#F5F3FA] mt-0.5">{formatPrecio(p.precio)}</p>
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
                  className="p-1.5 sm:p-2 hover:bg-[#C9A8C3] dark:hover:bg-[#241935] rounded-none transition-colors relative"
                  aria-label="Favoritos"
                  title="Favoritos"
                >
                  <Heart className="w-[18px] h-[18px] sm:w-6 sm:h-6 text-[#0A0A0A] dark:text-[#F5F3FA]" />
                  {favoritos.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[#5C2A52] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
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
                  className="p-1.5 sm:p-2 hover:bg-[#C9A8C3] dark:hover:bg-[#241935] rounded-none transition-colors relative"
                  aria-label="Carrito"
                  title="Carrito"
                >
                  <ShoppingBag className="w-[18px] h-[18px] sm:w-6 sm:h-6 text-[#0A0A0A] dark:text-[#F5F3FA]" />
                  {carritoItems.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[#5C2A52] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
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
          <nav className="lg:hidden py-4 space-y-2 border-t border-[#E7E0DA] dark:border-[#3A2E4D]">
            {(["hombre", "mujer", "accesorios"] as const).map((cat) => {
              const menu = MEGA_MENU.find((m) => m.categoria === cat)!;
              const abierto = acordeonMovil === cat;
              return (
                <div key={cat}>
                  <button
                    onClick={() => setAcordeonMovil(abierto ? null : cat)}
                    className={`${mobileNavLinkClass(cat)} flex items-center justify-between`}
                  >
                    {menu.etiqueta}
                    <ChevronDown className={`w-4 h-4 transition-transform ${abierto ? "rotate-180" : ""}`} />
                  </button>
                  {abierto && (
                    <div className="pl-4 pr-2 py-1 space-y-0.5">
                      <button
                        onClick={() => { onIrATienda(cat); setMenuMovilAbierto(false); setAcordeonMovil(null); }}
                        className="block w-full text-left px-4 py-2 rounded-none text-[12px] uppercase tracking-wide font-bold text-[#5C2A52]"
                      >
                        Ver todo
                      </button>
                      {menu.subcategorias.map((sub) => (
                        <button
                          key={sub.clave}
                          onClick={() => { onIrATienda(cat, sub.clave); setMenuMovilAbierto(false); setAcordeonMovil(null); }}
                          className="block w-full text-left px-4 py-2 rounded-none text-[13px] text-[#0A0A0A] dark:text-[#F5F3FA] hover:bg-[#C9A8C3] dark:hover:bg-[#241935]"
                        >
                          {sub.etiqueta}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
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
