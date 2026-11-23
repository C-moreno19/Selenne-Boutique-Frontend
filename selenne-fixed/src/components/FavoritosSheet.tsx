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
const GRADIENT = "linear-gradient(90deg, #0A0A0A 0%, #3B0A45 55%, #5C2A52 100%)";

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
      <SheetContent className="flex flex-col w-full sm:w-[440px] sm:max-w-[440px] p-0 gap-0 bg-white dark:bg-[#0A0A0A]">
        <SheetHeader className="px-6 pt-7 pb-5 border-b border-[#E7E0DA] dark:border-[#3A2E4D] flex-shrink-0 gap-0">
          <SheetTitle
            style={{ fontFamily: FONT_SERIF }}
            className="text-[26px] font-bold text-[#0A0A0A] dark:text-[#F5F3FA] tracking-tight"
          >
            Tus Favoritos
          </SheetTitle>
          {items.length > 0 && (
            <p
              style={{ fontFamily: FONT_SANS }}
              className="text-xs uppercase tracking-[0.15em] font-semibold text-[#5C2A52] mt-1"
            >
              {items.length} {items.length === 1 ? "pieza guardada" : "piezas guardadas"}
            </p>
          )}
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
            <div className="w-20 h-20 rounded-full bg-[#FBF0F4] dark:bg-[#241935] flex items-center justify-center mb-5">
              <Heart className="w-9 h-9 text-[#5C2A52]" strokeWidth={1.5} />
            </div>
            <p style={{ fontFamily: FONT_SERIF }} className="text-lg font-semibold text-[#0A0A0A] dark:text-[#F5F3FA] mb-1.5">
              Aún no tienes favoritos
            </p>
            <p style={{ fontFamily: FONT_SANS }} className="text-sm text-[#7d6f77] dark:text-[#b9aedd] mb-6">
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
                  className="group relative rounded-2xl overflow-hidden bg-[#F7F5FC] dark:bg-[#17101f] border border-transparent hover:border-[#C9A8C3] dark:hover:border-[#3A2E4D] transition-colors cursor-pointer"
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
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 backdrop-blur flex items-center justify-center text-[#5C2A52] hover:bg-[#5C2A52] hover:text-white transition-colors shadow-sm"
                      aria-label="Quitar de favoritos"
                      title="Quitar de favoritos"
                    >
                      <Heart className="w-3.5 h-3.5" fill="currentColor" />
                    </button>
                  </div>
                  <div className="p-2.5">
                    <h4
                      style={{ fontFamily: FONT_SANS }}
                      className="text-xs font-semibold text-[#0A0A0A] dark:text-[#F5F3FA] leading-snug line-clamp-2 mb-1"
                    >
                      {prod.nombre}
                    </h4>
                    <p style={{ fontFamily: FONT_SANS }} className="text-sm font-bold text-[#5C2A52]">
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
