import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import { Button } from "./ui/button";
import { Minus, Plus, ShoppingBag, Truck, Check } from "lucide-react";
import type { Producto } from "../shared/contexts/TiendaContext";

export interface CarritoItemLike extends Producto {
  carritoID: number;
  cantidad: number;
  tallaSeleccionada: string;
  colorSeleccionado?: string;
}

const FONT_SERIF = '"Playfair Display", Georgia, "Iowan Old Style", "Palatino Linotype", "Times New Roman", serif';
const FONT_SANS = '"Helvetica Neue", Helvetica, Arial, sans-serif';
const GRADIENT = "linear-gradient(90deg, #0A0A0A 0%, #3B0A45 55%, #5C2A52 100%)";

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
  estaSeleccionado: (carritoID: number) => boolean;
  onToggleSeleccion: (carritoID: number) => void;
  onToggleTodos: (valor: boolean) => void;
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
  estaSeleccionado,
  onToggleSeleccion,
  onToggleTodos,
}) => {
  const todosSeleccionados = items.length > 0 && items.every(i => estaSeleccionado(i.carritoID));
  const hayAlgunoSeleccionado = items.some(i => estaSeleccionado(i.carritoID));
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="flex flex-col w-full sm:w-[440px] sm:max-w-[440px] p-0 gap-0 bg-white dark:bg-[#0A0A0A]">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-[#E7E0DA] dark:border-[#3A2E4D] flex-shrink-0 gap-0">
          <SheetTitle
            style={{ fontFamily: FONT_SANS }}
            className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.15em] text-[#0A0A0A] dark:text-[#F5F3FA]"
          >
            <ShoppingBag className="w-[18px] h-[18px]" />
            Bolsa de compras
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
            <div className="w-20 h-20 bg-[#F7F5FC] dark:bg-[#241935] flex items-center justify-center mb-5">
              <ShoppingBag className="w-9 h-9 text-[#5C2A52]" strokeWidth={1.5} />
            </div>
            <p style={{ fontFamily: FONT_SERIF }} className="text-lg font-semibold text-[#0A0A0A] dark:text-[#F5F3FA] mb-1.5">
              Tu carrito está vacío
            </p>
            <p style={{ fontFamily: FONT_SANS }} className="text-sm text-[#7d6f77] dark:text-[#b9aedd] mb-6">
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
            {/* Franja de envío gratis */}
            <div className="flex-shrink-0 px-6 py-3 border-b border-[#E7E0DA] dark:border-[#3A2E4D]">
              <div className="flex items-center gap-2" style={{ fontFamily: FONT_SANS }}>
                <Truck className="w-4 h-4 text-[#5C2A52] flex-shrink-0" strokeWidth={1.75} />
                <span className="text-xs font-semibold uppercase tracking-wide text-[#0A0A0A] dark:text-[#F5F3FA]">
                  Disfruta envío gratis en tu pedido
                </span>
              </div>
            </div>

            {/* Seleccionar todos */}
            <div className="flex-shrink-0 px-6 py-2.5 border-b border-[#E7E0DA] dark:border-[#3A2E4D] flex items-center justify-between">
              <button
                onClick={() => onToggleTodos(!todosSeleccionados)}
                className="flex items-center gap-2"
              >
                <span className={`w-4 h-4 border flex items-center justify-center flex-shrink-0 ${
                  todosSeleccionados ? "bg-[#0A0A0A] dark:bg-[#F5F3FA] border-[#0A0A0A] dark:border-[#F5F3FA]" : "border-[#E7E0DA] dark:border-[#3A2E4D]"
                }`}>
                  {todosSeleccionados && <Check className="w-3 h-3 text-white dark:text-[#0A0A0A]" strokeWidth={3} />}
                </span>
                <span style={{ fontFamily: FONT_SANS }} className="text-xs font-semibold uppercase tracking-wide text-[#0A0A0A] dark:text-[#F5F3FA]">
                  Seleccionar todos
                </span>
              </button>
              <span style={{ fontFamily: FONT_SANS }} className="text-xs text-[#a89ca2] dark:text-[#8a7a82]">
                {items.filter(i => estaSeleccionado(i.carritoID)).length} de {items.length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
              {items.map((item) => {
                const seleccionado = estaSeleccionado(item.carritoID);
                return (
                <div key={item.carritoID} className={`flex gap-4 transition-opacity ${seleccionado ? "" : "opacity-50"}`}>
                  <button
                    onClick={() => onToggleSeleccion(item.carritoID)}
                    aria-label={seleccionado ? "Quitar de la compra" : "Incluir en la compra"}
                    className={`w-5 h-5 mt-1.5 border flex items-center justify-center flex-shrink-0 ${
                      seleccionado ? "bg-[#0A0A0A] dark:bg-[#F5F3FA] border-[#0A0A0A] dark:border-[#F5F3FA]" : "border-[#E7E0DA] dark:border-[#3A2E4D]"
                    }`}
                  >
                    {seleccionado && <Check className="w-3.5 h-3.5 text-white dark:text-[#0A0A0A]" strokeWidth={3} />}
                  </button>
                  <button
                    onClick={() => onVerProducto(item)}
                    className="w-24 h-28 flex-shrink-0 overflow-hidden bg-[#F7F5FC] dark:bg-[#17101f]"
                  >
                    <img
                      src={item.imagen}
                      alt={item.nombre}
                      className="w-full h-full object-cover"
                    />
                  </button>
                  <div className="flex-1 min-w-0 flex flex-col">
                    <button
                      onClick={() => onVerProducto(item)}
                      style={{ fontFamily: FONT_SANS }}
                      className="text-left text-xs font-bold uppercase tracking-wide text-[#0A0A0A] dark:text-[#F5F3FA] leading-snug hover:text-[#5C2A52] transition-colors"
                    >
                      {item.nombre}
                    </button>
                    <p style={{ fontFamily: FONT_SANS }} className="text-sm text-[#7d6f77] dark:text-[#b9aedd] mt-1">
                      {formatPrecio(item.precio)}
                    </p>
                    {(item.tallaSeleccionada || item.colorSeleccionado) && (
                      <p style={{ fontFamily: FONT_SANS }} className="text-[11px] text-[#a89ca2] dark:text-[#8a7a82] mt-0.5">
                        {[item.tallaSeleccionada && `Talla ${item.tallaSeleccionada}`, item.colorSeleccionado].filter(Boolean).join(" · ")}
                      </p>
                    )}

                    <div className="flex items-center gap-1 border border-[#E7E0DA] dark:border-[#3A2E4D] mt-2 w-fit">
                      <button
                        onClick={() => onActualizarCantidad(item.carritoID, item.cantidad - 1)}
                        className="w-7 h-7 flex items-center justify-center hover:bg-[#C9A8C3] dark:hover:bg-[#3A2E4D] transition-colors text-[#0A0A0A] dark:text-[#F5F3FA]"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span style={{ fontFamily: FONT_SANS }} className="text-xs font-semibold w-6 text-center text-[#0A0A0A] dark:text-[#F5F3FA]">
                        {item.cantidad}
                      </span>
                      <button
                        onClick={() => onActualizarCantidad(item.carritoID, item.cantidad + 1)}
                        className="w-7 h-7 flex items-center justify-center hover:bg-[#C9A8C3] dark:hover:bg-[#3A2E4D] transition-colors text-[#0A0A0A] dark:text-[#F5F3FA]"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      onClick={() => onRemover(item.carritoID)}
                      style={{ fontFamily: FONT_SANS }}
                      className="text-left text-[11px] font-semibold uppercase tracking-wide text-[#a89ca2] dark:text-[#8a7a82] hover:text-[#5C2A52] underline underline-offset-2 mt-2 w-fit"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
                );
              })}
            </div>

            <div className="flex-shrink-0 border-t border-[#E7E0DA] dark:border-[#3A2E4D] px-6 pt-5 pb-6 bg-white dark:bg-[#0A0A0A] space-y-3">
              <div className="flex justify-between items-baseline">
                <span style={{ fontFamily: FONT_SANS }} className="text-sm font-bold uppercase tracking-wide text-[#0A0A0A] dark:text-[#F5F3FA]">
                  Subtotal
                </span>
                <span style={{ fontFamily: FONT_SERIF }} className="text-xl font-bold text-[#0A0A0A] dark:text-[#F5F3FA]">
                  {formatPrecio(total)}
                </span>
              </div>
              <p style={{ fontFamily: FONT_SANS }} className="text-[11px] text-[#a89ca2] dark:text-[#8a7a82] -mt-1">
                Impuestos y envío calculados al finalizar la compra
              </p>

              <Button
                onClick={() => { onOpenChange(false); onCheckout(); }}
                disabled={!hayAlgunoSeleccionado}
                style={{ fontFamily: FONT_SANS, background: hayAlgunoSeleccionado ? GRADIENT : undefined }}
                className="w-full text-white border-0 h-12 mt-1 text-sm font-semibold uppercase tracking-wider transition-transform duration-200 hover:scale-[1.02] shadow-md hover:shadow-lg disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed"
              >
                {hayAlgunoSeleccionado ? "Finalizar Compra" : "Selecciona al menos un producto"}
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};
