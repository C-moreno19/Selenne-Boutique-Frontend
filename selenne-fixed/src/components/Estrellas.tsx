import { Star } from 'lucide-react';

interface EstrellasProps {
  valor: number;
  total?: number;
  onChange?: (v: number) => void;
  size?: number;
  className?: string;
}

// Estrellas de calificación. Si se pasa onChange, funciona como selector
// interactivo (para escribir una reseña); si no, es solo de lectura.
export function Estrellas({ valor, total, onChange, size = 16, className }: EstrellasProps) {
  const interactivo = !!onChange;
  return (
    <div className={`flex items-center gap-1 ${className ?? ''}`}>
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map(i => (
          <button
            key={i}
            type="button"
            disabled={!interactivo}
            onClick={() => onChange?.(i)}
            className={interactivo ? 'cursor-pointer' : 'cursor-default'}
            aria-label={interactivo ? `Calificar con ${i} estrella${i > 1 ? 's' : ''}` : undefined}
          >
            <Star
              width={size}
              height={size}
              className={i <= Math.round(valor) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-[#5a4d52]'}
            />
          </button>
        ))}
      </div>
      {total !== undefined && (
        <span className="text-xs text-gray-500 dark:text-[#b8a3ac]">
          {total > 0 ? `${valor.toFixed(1)} (${total})` : 'Sin reseñas aún'}
        </span>
      )}
    </div>
  );
}
