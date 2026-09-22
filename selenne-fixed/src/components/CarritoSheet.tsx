import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { Minus, Plus, Trash2, ShoppingBag, Package, Globe, ShieldCheck } from "lucide-react";
import type { Producto } from "../shared/contexts/TiendaContext";

export interface CarritoItemLike extends Producto {
  carritoID: number;
  cantidad: number;
  tallaSeleccionada: string;
  colorSeleccionado?: string;
}

const FONT_SERIF = '"Playfair Display", Georgia, "Iowan Old Style", "Palatino Linotype", "Times New Roman", serif';
const FONT_SANS = '"Helvetica Neue", Helvetica, Arial, sans-serif';
const GRADIENT = "linear-gradient(90deg, #241B22 0%, #7a3350 55%, #A3395C 100%)";

interface CarritoSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: React.ReactNode;
  items: CarritoItemLike[];
  formatPrecio: (n: number) => string;
  total: number;
  onActualizarCantidad: (carritoID: number, cantidad: number) => void;
  onRemover: (carritoID: number) => void;
  onVerProducto: (item: CarritoItemLike) => void;
  onCheckout: () => void;
}

export const CarritoSheet: React.FC<CarritoSheetProps> = ({
  open,
  onOpenChange,
  trigger,
  items,
  formatPrecio,
  total,
  onActualizarCantidad,
  onRemover,
  onVerProducto,
  onCheckout,
}) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="flex flex-col w-full sm:w-[440px] sm:max-w-[440px] p-0 gap-0 bg-white dark:bg-[#241B22]">
        <SheetHeader className="px-6 pt-7 pb-5 border-b border-[#E7E0DA] dark:border-[#453840] flex-shrink-0 gap-0">
          <SheetTitle
            style={{ fontFamily: FONT_SERIF }}
            className="text-[26px] font-bold text-[#241B22] dark:text-[#F5EDE9] tracking-tight"
          >
            Tu Carrito
          </SheetTitle>
          {items.length > 0 && (
            <p
              style={{ fontFamily: FONT_SANS }}
              className="text-xs uppercase tracking-[0.15em] font-semibold text-[#A3395C] mt-1"
            >
              {items.length} {items.length === 1 ? "artículo" : "artículos"}
            </p>
          )}
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
            <div className="w-20 h-20 rounded-full bg-[#FBF0F4] dark:bg-[#3a2530] flex items-center justify-center mb-5">
              <ShoppingBag className="w-9 h-9 text-[#A3395C]" strokeWidth={1.5} />
            </div>
            <p style={{ fontFamily: FONT_SERIF }} className="text-lg font-semibold text-[#241B22] dark:text-[#F5EDE9] mb-1.5">
              Tu carrito está vacío
            </p>
            <p style={{ fontFamily: FONT_SANS }} className="text-sm text-[#7d6f77] dark:text-[#b8a3ac] mb-6">
              Descubre nuestras piezas y encuentra tu favorita.
            </p>
            <Button
              onClick={() => onOpenChange(false)}
              style={{ fontFamily: FONT_SANS, background: GRADIENT }}
              className="text-white border-0 px-6"
            >
              Explorar la tienda
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {items.map((item) => (
                <div
                  key={item.carritoID}
                  className="group relative flex gap-3.5 bg-[#FBF8F5] dark:bg-[#2a2029] p-3 rounded-2xl border border-transparent hover:border-[#EFD9DF] dark:hover:border-[#453840] transition-colors cursor-pointer"
                  onClick={() => onVerProducto(item)}
                >
                  <img
                    src={item.imagen}
                    alt={item.nombre}
                    className="w-[72px] h-[72px] object-cover rounded-xl flex-shrink-0 bg-white"
                  />
                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <h4
                        style={{ fontFamily: FONT_SANS }}
                        className="text-sm font-semibold text-[#241B22] dark:text-[#F5EDE9] leading-snug line-clamp-2 pr-1"
                      >
                        {item.nombre}
                      </h4>
                      <button
                        onClick={(e) => { e.stopPropagation(); onRemover(item.carritoID); }}
                        className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[#c3bab3] hover:text-white hover:bg-[#A3395C] transition-colors"
                        aria-label="Eliminar del carrito"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <span
                        style={{ fontFamily: FONT_SANS }}
                        className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-white dark:bg-[#3a2530] text-[#7d6f77] dark:text-[#b8a3ac] border border-[#E7E0DA] dark:border-[#453840]"
                      >
                        Talla {item.tallaSeleccionada}
                      </span>
                      {item.colorSeleccionado && (
                        <span
                          style={{ fontFamily: FONT_SANS }}
                          className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-white dark:bg-[#3a2530] text-[#7d6f77] dark:text-[#b8a3ac] border border-[#E7E0DA] dark:border-[#453840]"
                        >
                          {item.colorSeleccionado}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-auto pt-2">
                      <div className="flex items-center gap-1 bg-white dark:bg-[#3a2530] rounded-full border border-[#E7E0DA] dark:border-[#453840] p-0.5">
                        <button
                          onClick={(e) => { e.stopPropagation(); onActualizarCantidad(item.carritoID, item.cantidad - 1); }}
                          className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-[#EFD9DF] dark:hover:bg-[#453840] transition-colors text-[#241B22] dark:text-[#F5EDE9]"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span style={{ fontFamily: FONT_SANS }} className="text-xs font-semibold w-4 text-center text-[#241B22] dark:text-[#F5EDE9]">
                          {item.cantidad}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); onActualizarCantidad(item.carritoID, item.cantidad + 1); }}
                          className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-[#EFD9DF] dark:hover:bg-[#453840] transition-colors text-[#241B22] dark:text-[#F5EDE9]"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span style={{ fontFamily: FONT_SANS }} className="text-sm font-bold text-[#A3395C]">
                        {formatPrecio(item.precio * item.cantidad)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex-shrink-0 border-t border-[#E7E0DA] dark:border-[#453840] px-6 pt-5 pb-6 bg-white dark:bg-[#241B22] space-y-3">
              <div className="flex justify-between items-center" style={{ fontFamily: FONT_SANS }}>
                <span className="text-sm text-[#7d6f77] dark:text-[#b8a3ac]">Subtotal</span>
                <span className="text-sm font-semibold text-[#241B22] dark:text-[#F5EDE9]">{formatPrecio(total)}</span>
              </div>
              <div className="flex justify-between items-center" style={{ fontFamily: FONT_SANS }}>
                <span className="text-sm text-[#7d6f77] dark:text-[#b8a3ac]">Envío</span>
                <span className="text-sm font-semibold text-[#3a9b6b]">Gratis</span>
              </div>
              <Separator className="bg-[#E7E0DA] dark:bg-[#453840]" />
              <div className="flex justify-between items-baseline">
                <span style={{ fontFamily: FONT_SERIF }} className="text-lg font-bold text-[#241B22] dark:text-[#F5EDE9]">
                  Total
                </span>
                <span style={{ fontFamily: FONT_SERIF }} className="text-xl font-bold text-[#A3395C]">
                  {formatPrecio(total)}
                </span>
              </div>
              <p style={{ fontFamily: FONT_SANS }} className="text-[11px] text-[#a89ca2] dark:text-[#8a7a82] text-center -mt-1">
                IVA incluido en el precio
              </p>

              <div className="grid grid-cols-3 gap-1 bg-[#FBF8F5] dark:bg-[#2a2029] rounded-xl py-3 px-2">
                <div className="flex flex-col items-center text-center gap-1.5 px-1">
                  <Package className="w-[17px] h-[17px] text-[#A3395C]" strokeWidth={1.75} />
                  <span style={{ fontFamily: FONT_SANS }} className="text-[9.5px] uppercase tracking-wide font-semibold text-[#7d6f77] dark:text-[#b8a3ac] leading-tight">
                    Envío 3-5 días
                  </span>
                </div>
                <div className="flex flex-col items-center text-center gap-1.5 px-1 border-x border-[#E7E0DA] dark:border-[#453840]">
                  <Globe className="w-[17px] h-[17px] text-[#A3395C]" strokeWidth={1.75} />
                  <span style={{ fontFamily: FONT_SANS }} className="text-[9.5px] uppercase tracking-wide font-semibold text-[#7d6f77] dark:text-[#b8a3ac] leading-tight">
                    A todo el país
                  </span>
                </div>
                <div className="flex flex-col items-center text-center gap-1.5 px-1">
                  <ShieldCheck className="w-[17px] h-[17px] text-[#A3395C]" strokeWidth={1.75} />
                  <span style={{ fontFamily: FONT_SANS }} className="text-[9.5px] uppercase tracking-wide font-semibold text-[#7d6f77] dark:text-[#b8a3ac] leading-tight">
                    Pago seguro
                  </span>
                </div>
              </div>

              <Button
                onClick={() => { onOpenChange(false); onCheckout(); }}
                style={{ fontFamily: FONT_SANS, background: GRADIENT }}
                className="w-full text-white border-0 h-12 mt-1 text-sm font-semibold uppercase tracking-wider transition-transform duration-200 hover:scale-[1.02] shadow-md hover:shadow-lg"
              >
                Proceder al Pago
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};
