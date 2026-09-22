import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import { Button } from "./ui/button";
import { Heart } from "lucide-react";
import type { Producto } from "../shared/contexts/TiendaContext";

const FONT_SERIF = '"Playfair Display", Georgia, "Iowan Old Style", "Palatino Linotype", "Times New Roman", serif';
const FONT_SANS = '"Helvetica Neue", Helvetica, Arial, sans-serif';
const GRADIENT = "linear-gradient(90deg, #241B22 0%, #7a3350 55%, #A3395C 100%)";

interface FavoritosSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: React.ReactNode;
  favoritos: number[];
  productos: Producto[];
  formatPrecio: (n: number) => string;
  onVer: (producto: Producto) => void;
  onQuitar: (id: number) => void;
}

export const FavoritosSheet: React.FC<FavoritosSheetProps> = ({
  open,
  onOpenChange,
  trigger,
  favoritos,
  productos,
  formatPrecio,
  onVer,
  onQuitar,
}) => {
  const items = favoritos
    .map((id) => productos.find((p) => p.id === id))
    .filter((p): p is Producto => !!p);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="flex flex-col w-full sm:w-[440px] sm:max-w-[440px] p-0 gap-0 bg-white dark:bg-[#241B22]">
        <SheetHeader className="px-6 pt-7 pb-5 border-b border-[#E7E0DA] dark:border-[#453840] flex-shrink-0 gap-0">
          <SheetTitle
            style={{ fontFamily: FONT_SERIF }}
            className="text-[26px] font-bold text-[#241B22] dark:text-[#F5EDE9] tracking-tight"
          >
            Tus Favoritos
          </SheetTitle>
          {items.length > 0 && (
            <p
              style={{ fontFamily: FONT_SANS }}
              className="text-xs uppercase tracking-[0.15em] font-semibold text-[#A3395C] mt-1"
            >
              {items.length} {items.length === 1 ? "pieza guardada" : "piezas guardadas"}
            </p>
          )}
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
            <div className="w-20 h-20 rounded-full bg-[#FBF0F4] dark:bg-[#3a2530] flex items-center justify-center mb-5">
              <Heart className="w-9 h-9 text-[#A3395C]" strokeWidth={1.5} />
            </div>
            <p style={{ fontFamily: FONT_SERIF }} className="text-lg font-semibold text-[#241B22] dark:text-[#F5EDE9] mb-1.5">
              Aún no tienes favoritos
            </p>
            <p style={{ fontFamily: FONT_SANS }} className="text-sm text-[#7d6f77] dark:text-[#b8a3ac] mb-6">
              Guarda las piezas que te enamoren y encuéntralas aquí.
            </p>
            <Button
              onClick={() => onOpenChange(false)}
              style={{ fontFamily: FONT_SANS, background: GRADIENT }}
              className="text-white border-0 px-6"
            >
              Descubrir productos
            </Button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-5 py-5">
            <div className="grid grid-cols-2 gap-3.5">
              {items.map((prod) => (
                <div
                  key={prod.id}
                  className="group relative rounded-2xl overflow-hidden bg-[#FBF8F5] dark:bg-[#2a2029] border border-transparent hover:border-[#EFD9DF] dark:hover:border-[#453840] transition-colors cursor-pointer"
                  onClick={() => onVer(prod)}
                >
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <img
                      src={prod.imagen}
                      alt={prod.nombre}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <button
                      onClick={(e) => { e.stopPropagation(); onQuitar(prod.id); }}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 backdrop-blur flex items-center justify-center text-[#A3395C] hover:bg-[#A3395C] hover:text-white transition-colors shadow-sm"
                      aria-label="Quitar de favoritos"
                      title="Quitar de favoritos"
                    >
                      <Heart className="w-3.5 h-3.5" fill="currentColor" />
                    </button>
                  </div>
                  <div className="p-2.5">
                    <h4
                      style={{ fontFamily: FONT_SANS }}
                      className="text-xs font-semibold text-[#241B22] dark:text-[#F5EDE9] leading-snug line-clamp-2 mb-1"
                    >
                      {prod.nombre}
                    </h4>
                    <p style={{ fontFamily: FONT_SANS }} className="text-sm font-bold text-[#A3395C]">
                      {formatPrecio(prod.precio)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
