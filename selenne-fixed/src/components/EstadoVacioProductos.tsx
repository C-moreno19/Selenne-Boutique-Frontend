import { PackageSearch } from "lucide-react";

interface EstadoVacioProductosProps {
  busqueda: string;
  hayFiltrosActivos: boolean;
  onLimpiarTodo: () => void;
}

// Estado vacio de la grilla de productos. El mensaje cambia segun si el vacio
// vino de una busqueda, de filtros aplicados, o de que la categoria realmente
// no tiene productos todavia (en ese caso no hay nada que "limpiar").
export function EstadoVacioProductos({ busqueda, hayFiltrosActivos, onLimpiarTodo }: EstadoVacioProductosProps) {
  const puedeLimpiar = !!busqueda || hayFiltrosActivos;

  const titulo = busqueda
    ? `Sin resultados para "${busqueda}"`
    : hayFiltrosActivos
    ? "Ningún producto coincide con estos filtros"
    : "Todavía no hay productos en esta categoría";

  const subtitulo = puedeLimpiar
    ? "Probá con otra búsqueda o quitá algunos filtros."
    : "Estamos actualizando el catálogo — volvé a mirar pronto.";

  return (
    <div className="flex flex-col items-center justify-center text-center py-20 px-4">
      <div className="w-14 h-14 rounded-full bg-[#F7F5FC] dark:bg-[#221830] flex items-center justify-center mb-4">
        <PackageSearch className="w-6 h-6 text-[#5C2A52]" />
      </div>
      <p
        className="text-gray-900 dark:text-[#F5F3FA] text-base font-medium"
        style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
      >
        {titulo}
      </p>
      <p className="text-gray-500 dark:text-[#b9aedd] text-sm mt-1 max-w-xs">{subtitulo}</p>
      {puedeLimpiar && (
        <button
          onClick={onLimpiarTodo}
          className="mt-5 px-5 py-2 text-xs font-bold tracking-widest border border-gray-300 dark:border-[#3A2E4D] dark:text-[#F5F3FA] rounded-lg hover:border-[#5C2A52] hover:text-[#5C2A52] transition-colors"
        >
          VER TODO EL CATÁLOGO
        </button>
      )}
    </div>
  );
}
