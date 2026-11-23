import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronUp, X } from "lucide-react";
import { formatCurrency } from "../shared/utils";

export interface FiltrosAplicados {
  precioMin: number | null;
  precioMax: number | null;
  talla: string[];
  tipoProducto: string;
  categoriaRopa: string;
  color: string;
  material: string;
}

interface FiltrosPanelProps {
  abierto: boolean;
  onClose: () => void;
  tallasDisponibles: string[];
  tiposProductoDisponibles: string[];
  categoriasRopaDisponibles: string[];
  coloresDisponibles: string[];
  materialesDisponibles: string[];
  maxPrecioGlobal: number;
  filtroPrecioMin: number | null;
  filtroPrecioMax: number | null;
  filtroTalla: string[];
  filtroTipoProducto: string;
  filtroCategoriaRopa: string;
  filtroColor: string;
  filtroMaterial: string;
  onAplicar: (filtros: FiltrosAplicados) => void;
}

// Panel lateral de filtros de la tienda (categoria/precio/talla/tipo). El estado de
// "borrador" (los *Local) vive aca adentro y solo se confirma al padre via onAplicar —
// asi el padre no necesita saber nada del drag del slider de precio ni de los toggles.
export function FiltrosPanel({
  abierto,
  onClose,
  tallasDisponibles,
  tiposProductoDisponibles,
  categoriasRopaDisponibles,
  coloresDisponibles,
  materialesDisponibles,
  maxPrecioGlobal,
  filtroPrecioMin,
  filtroPrecioMax,
  filtroTalla,
  filtroTipoProducto,
  filtroCategoriaRopa,
  filtroColor,
  filtroMaterial,
  onAplicar,
}: FiltrosPanelProps) {
  const [seccionesAbiertas, setSeccionesAbiertas] = useState({ precio: true, talla: true, tipo: true, categoria: true, color: true, material: true });
  const [precioMinLocal, setPrecioMinLocal] = useState(0);
  const [precioMaxLocal, setPrecioMaxLocal] = useState(0);
  const [activeRangeThumb, setActiveRangeThumb] = useState<'min' | 'max' | null>(null);
  const rangeContainerRef = useRef<HTMLDivElement>(null);
  const [tallaLocal, setTallaLocal] = useState<string[]>([]);
  const [tipoLocal, setTipoLocal] = useState("");
  const [categoriaLocal, setCategoriaLocal] = useState("");
  const [colorLocal, setColorLocal] = useState("");
  const [materialLocal, setMaterialLocal] = useState("");

  useEffect(() => {
    if (!abierto) return;
    setPrecioMinLocal(filtroPrecioMin ?? 0);
    setPrecioMaxLocal(filtroPrecioMax ?? maxPrecioGlobal);
    setTallaLocal([...filtroTalla]);
    setTipoLocal(filtroTipoProducto);
    setCategoriaLocal(filtroCategoriaRopa);
    setColorLocal(filtroColor);
    setMaterialLocal(filtroMaterial);
    // Solo al abrir: es la inicializacion del borrador, no debe reaccionar a cambios posteriores.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto]);

  const getRangeValue = (clientX: number) => {
    if (!rangeContainerRef.current) return 0;
    const rect = rangeContainerRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return Math.round((pct * maxPrecioGlobal) / 1000) * 1000;
  };
  const handleRangePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!rangeContainerRef.current) return;
    const val = getRangeValue(e.clientX);
    const thumb = Math.abs(val - precioMinLocal) <= Math.abs(val - precioMaxLocal) ? 'min' : 'max';
    setActiveRangeThumb(thumb);
    rangeContainerRef.current.setPointerCapture(e.pointerId);
    if (thumb === 'min') setPrecioMinLocal(Math.min(val, precioMaxLocal - 1000));
    else setPrecioMaxLocal(Math.max(val, precioMinLocal + 1000));
  };
  const handleRangePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!activeRangeThumb || !(e.buttons & 1)) return;
    const val = getRangeValue(e.clientX);
    if (activeRangeThumb === 'min') setPrecioMinLocal(Math.min(val, precioMaxLocal - 1000));
    else setPrecioMaxLocal(Math.max(val, precioMinLocal + 1000));
  };
  const handleRangePointerUp = () => setActiveRangeThumb(null);

  const aplicarFiltros = () => {
    onAplicar({
      precioMin: precioMinLocal > 0 ? precioMinLocal : null,
      precioMax: precioMaxLocal < maxPrecioGlobal ? precioMaxLocal : null,
      talla: tallaLocal,
      tipoProducto: tipoLocal,
      categoriaRopa: categoriaLocal,
      color: colorLocal,
      material: materialLocal,
    });
  };

  const limpiarFiltros = () => {
    setPrecioMinLocal(0);
    setPrecioMaxLocal(maxPrecioGlobal);
    setTallaLocal([]);
    setTipoLocal('');
    setCategoriaLocal('');
    setColorLocal('');
    setMaterialLocal('');
  };

  return (
    <AnimatePresence>
      {abierto && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-black/40 z-40"
            onClick={onClose}
          />
          <motion.div
            key="panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed right-0 top-0 h-full w-80 bg-white dark:bg-[#1e1530] z-50 flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-[#3A2E4D]">
          <span className="text-xs font-bold tracking-widest text-gray-900 dark:text-[#F5F3FA]">APLICAR FILTROS</span>
          <button onClick={onClose} className="flex items-center gap-1 text-xs font-bold tracking-widest text-gray-900 dark:text-[#F5F3FA] hover:text-gray-600 dark:hover:text-[#b9aedd]">
            CERRAR <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* PRECIO */}
          <div className="px-5 py-4 border-b border-gray-100 dark:border-[#3A2E4D]">
            <button onClick={() => setSeccionesAbiertas(s => ({ ...s, precio: !s.precio }))}
              className="w-full flex items-center justify-between mb-3">
              <span className="text-xs font-bold tracking-widest text-gray-900 dark:text-[#F5F3FA]">PRECIO</span>
              <ChevronUp className={`w-4 h-4 text-gray-500 dark:text-[#b9aedd] transition-transform ${seccionesAbiertas.precio ? '' : 'rotate-180'}`} />
            </button>
            {seccionesAbiertas.precio && (
              <>
                <div ref={rangeContainerRef} className="relative h-6 mb-4 cursor-pointer touch-none select-none"
                  onPointerDown={handleRangePointerDown}
                  onPointerMove={handleRangePointerMove}
                  onPointerUp={handleRangePointerUp}>
                  <div className="absolute top-1/2 -translate-y-1/2 w-full h-[2px] bg-gray-200 dark:bg-[#3A2E4D] rounded-full">
                    <div className="absolute h-full bg-black dark:bg-[#5C2A52] rounded-full"
                      style={{ left: `${(precioMinLocal / maxPrecioGlobal) * 100}%`, width: `${((precioMaxLocal - precioMinLocal) / maxPrecioGlobal) * 100}%` }} />
                  </div>
                  <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-black dark:bg-[#5C2A52] rounded-full border-2 border-white dark:border-[#1e1530] shadow pointer-events-none"
                    style={{ left: `calc(${(precioMinLocal / maxPrecioGlobal) * 100}% - 8px)` }} />
                  <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-black dark:bg-[#5C2A52] rounded-full border-2 border-white dark:border-[#1e1530] shadow pointer-events-none"
                    style={{ left: `calc(${(precioMaxLocal / maxPrecioGlobal) * 100}% - 8px)` }} />
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 border border-gray-200 dark:border-[#3A2E4D] rounded px-3 py-2 text-sm text-gray-700 dark:text-[#F5F3FA]">
                    {formatCurrency(precioMinLocal)}
                  </div>
                  <span className="text-gray-400 dark:text-[#b9aedd]">—</span>
                  <div className="flex-1 border border-gray-200 dark:border-[#3A2E4D] rounded px-3 py-2 text-sm text-gray-700 dark:text-[#F5F3FA]">
                    {formatCurrency(precioMaxLocal)}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* TALLA */}
          {tallasDisponibles.length > 0 && (
            <div className="px-5 py-4 border-b border-gray-100 dark:border-[#3A2E4D]">
              <button onClick={() => setSeccionesAbiertas(s => ({ ...s, talla: !s.talla }))}
                className="w-full flex items-center justify-between mb-3">
                <span className="text-xs font-bold tracking-widest text-gray-900 dark:text-[#F5F3FA]">TALLA</span>
                <ChevronUp className={`w-4 h-4 text-gray-500 dark:text-[#b9aedd] transition-transform ${seccionesAbiertas.talla ? '' : 'rotate-180'}`} />
              </button>
              {seccionesAbiertas.talla && (
                <div className="flex flex-wrap gap-2">
                  {tallasDisponibles.map(t => (
                    <button key={t} onClick={() => setTallaLocal(tallaLocal.includes(t) ? tallaLocal.filter(x => x !== t) : [...tallaLocal, t])}
                      className={`px-3 py-1.5 text-sm border rounded transition-colors ${tallaLocal.includes(t) ? 'border-black dark:border-[#5C2A52] bg-black dark:bg-[#5C2A52] text-white' : 'border-gray-300 dark:border-[#3A2E4D] text-gray-700 dark:text-[#F5F3FA] hover:border-gray-900 dark:hover:border-[#5C2A52]'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TIPO DE PRODUCTO */}
          {tiposProductoDisponibles.length > 0 && (
            <div className="px-5 py-4 border-b border-gray-100 dark:border-[#3A2E4D]">
              <button onClick={() => setSeccionesAbiertas(s => ({ ...s, tipo: !s.tipo }))}
                className="w-full flex items-center justify-between mb-3">
                <span className="text-xs font-bold tracking-widest text-gray-900 dark:text-[#F5F3FA]">TIPO DE PRODUCTO</span>
                <ChevronUp className={`w-4 h-4 text-gray-500 dark:text-[#b9aedd] transition-transform ${seccionesAbiertas.tipo ? '' : 'rotate-180'}`} />
              </button>
              {seccionesAbiertas.tipo && (
                <div className="flex flex-wrap gap-2">
                  {tiposProductoDisponibles.map(t => (
                    <button key={t} onClick={() => setTipoLocal(tipoLocal === t ? '' : t)}
                      className={`px-3 py-1.5 text-sm border rounded transition-colors ${tipoLocal === t ? 'border-black dark:border-[#5C2A52] bg-black dark:bg-[#5C2A52] text-white' : 'border-gray-300 dark:border-[#3A2E4D] text-gray-700 dark:text-[#F5F3FA] hover:border-gray-900 dark:hover:border-[#5C2A52]'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CATEGORÍA */}
          {categoriasRopaDisponibles.length > 0 && (
            <div className="px-5 py-4 border-b border-gray-100 dark:border-[#3A2E4D]">
              <button onClick={() => setSeccionesAbiertas(s => ({ ...s, categoria: !s.categoria }))}
                className="w-full flex items-center justify-between mb-3">
                <span className="text-xs font-bold tracking-widest text-gray-900 dark:text-[#F5F3FA]">CATEGORÍA</span>
                <ChevronUp className={`w-4 h-4 text-gray-500 dark:text-[#b9aedd] transition-transform ${seccionesAbiertas.categoria ? '' : 'rotate-180'}`} />
              </button>
              {seccionesAbiertas.categoria && (
                <div className="flex flex-wrap gap-2">
                  {categoriasRopaDisponibles.map(c => (
                    <button key={c} onClick={() => setCategoriaLocal(categoriaLocal === c ? '' : c)}
                      className={`px-3 py-1.5 text-sm border rounded transition-colors ${categoriaLocal === c ? 'border-black dark:border-[#5C2A52] bg-black dark:bg-[#5C2A52] text-white' : 'border-gray-300 dark:border-[#3A2E4D] text-gray-700 dark:text-[#F5F3FA] hover:border-gray-900 dark:hover:border-[#5C2A52]'}`}>
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* COLOR */}
          {coloresDisponibles.length > 0 && (
            <div className="px-5 py-4 border-b border-gray-100 dark:border-[#3A2E4D]">
              <button onClick={() => setSeccionesAbiertas(s => ({ ...s, color: !s.color }))}
                className="w-full flex items-center justify-between mb-3">
                <span className="text-xs font-bold tracking-widest text-gray-900 dark:text-[#F5F3FA]">COLOR</span>
                <ChevronUp className={`w-4 h-4 text-gray-500 dark:text-[#b9aedd] transition-transform ${seccionesAbiertas.color ? '' : 'rotate-180'}`} />
              </button>
              {seccionesAbiertas.color && (
                <div className="flex flex-wrap gap-2">
                  {coloresDisponibles.map(c => (
                    <button key={c} onClick={() => setColorLocal(colorLocal === c ? '' : c)}
                      className={`px-3 py-1.5 text-sm border rounded transition-colors ${colorLocal === c ? 'border-black dark:border-[#5C2A52] bg-black dark:bg-[#5C2A52] text-white' : 'border-gray-300 dark:border-[#3A2E4D] text-gray-700 dark:text-[#F5F3FA] hover:border-gray-900 dark:hover:border-[#5C2A52]'}`}>
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* MATERIAL */}
          {materialesDisponibles.length > 0 && (
            <div className="px-5 py-4 border-b border-gray-100 dark:border-[#3A2E4D]">
              <button onClick={() => setSeccionesAbiertas(s => ({ ...s, material: !s.material }))}
                className="w-full flex items-center justify-between mb-3">
                <span className="text-xs font-bold tracking-widest text-gray-900 dark:text-[#F5F3FA]">MATERIAL</span>
                <ChevronUp className={`w-4 h-4 text-gray-500 dark:text-[#b9aedd] transition-transform ${seccionesAbiertas.material ? '' : 'rotate-180'}`} />
              </button>
              {seccionesAbiertas.material && (
                <div className="flex flex-wrap gap-2">
                  {materialesDisponibles.map(m => (
                    <button key={m} onClick={() => setMaterialLocal(materialLocal === m ? '' : m)}
                      className={`px-3 py-1.5 text-sm border rounded transition-colors ${materialLocal === m ? 'border-black dark:border-[#5C2A52] bg-black dark:bg-[#5C2A52] text-white' : 'border-gray-300 dark:border-[#3A2E4D] text-gray-700 dark:text-[#F5F3FA] hover:border-gray-900 dark:hover:border-[#5C2A52]'}`}>
                      {m}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Limpiar filtros */}
          {(tallaLocal.length > 0 || tipoLocal || categoriaLocal || colorLocal || materialLocal || precioMinLocal > 0 || precioMaxLocal < maxPrecioGlobal) && (
            <button onClick={limpiarFiltros} className="w-full px-5 py-3 text-xs text-gray-500 dark:text-[#b9aedd] hover:text-gray-900 dark:hover:text-[#F5F3FA] underline transition-colors">
              Limpiar filtros
            </button>
          )}
        </div>

        <div className="px-5 py-4 border-t border-gray-100 dark:border-[#3A2E4D]">
          <button onClick={aplicarFiltros}
            className="w-full bg-black text-white py-3 text-xs font-bold tracking-widest hover:bg-gray-800 transition-all duration-200 hover:scale-[1.02]">
            MOSTRAR ARTÍCULOS
          </button>
        </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
