import { useEffect, useState } from 'react';
import { MessageSquare, ShieldCheck, Loader2 } from 'lucide-react';
import { Estrellas } from './Estrellas';
import { getJson, postJson } from '../services/api';
import { toast } from '@/lib/toast';
import type { Valoracion } from '../types/models';

interface ResenasProductoProps {
  productoId: number;
  promedio: number;
  total: number;
  puedeEscribir: boolean;
}

// Lista de reseñas aprobadas de un producto, con formulario para escribir una
// nueva (solo si el usuario esta logueado, sin exigir compra previa — el
// backend igual marca "Compra verificada" si aplica). Se usa en toda la tienda.
export function ResenasProducto({ productoId, promedio, total, puedeEscribir }: ResenasProductoProps) {
  const [resenas, setResenas] = useState<Valoracion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [formAbierto, setFormAbierto] = useState(false);
  const [puntuacion, setPuntuacion] = useState(0);
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    let cancelado = false;
    setCargando(true);
    getJson<{ data?: Valoracion[] }>(`/api/valoraciones/producto/${productoId}`)
      .then(r => { if (!cancelado) setResenas(r?.data ?? []); })
      .catch(() => { if (!cancelado) setResenas([]); })
      .finally(() => { if (!cancelado) setCargando(false); });
    return () => { cancelado = true; };
  }, [productoId]);

  const enviarResena = async () => {
    if (puntuacion < 1) { toast.error('Selecciona una calificación de 1 a 5 estrellas.'); return; }
    setEnviando(true);
    try {
      await postJson('/api/valoraciones', { ProductoID: productoId, Puntuacion: puntuacion, Comentario: comentario.trim() || null });
      toast.success('¡Gracias! Tu reseña se publicará cuando un administrador la apruebe.');
      setFormAbierto(false);
      setPuntuacion(0);
      setComentario('');
    } catch (e: any) {
      toast.error(e?.data?.message || 'No se pudo enviar tu reseña.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="pt-2">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-[#0A0A0A] dark:text-[#F5F3FA] mb-1">Reseñas</p>
          <Estrellas valor={promedio} total={total} size={15} />
        </div>
        {puedeEscribir && !formAbierto && (
          <button type="button" onClick={() => setFormAbierto(true)}
            className="text-xs font-semibold text-[#5C2A52] hover:underline flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5" /> Escribir reseña
          </button>
        )}
      </div>

      {formAbierto && (
        <div className="rounded-xl border border-gray-200 dark:border-[#3A2E4D] p-4 mb-4 space-y-3">
          <Estrellas valor={puntuacion} onChange={setPuntuacion} size={22} />
          <textarea value={comentario} onChange={e => setComentario(e.target.value)}
            placeholder="Cuéntanos qué te pareció (opcional)"
            className="w-full text-sm border rounded-xl border-gray-200 dark:border-[#3A2E4D] bg-white dark:bg-[#17101f] text-gray-900 dark:text-[#F5F3FA] p-3 min-h-[70px] resize-none focus:outline-none focus:border-[#5C2A52]" />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => { setFormAbierto(false); setPuntuacion(0); setComentario(''); }}
              className="h-9 px-4 text-xs text-gray-600 dark:text-[#b9aedd] border border-gray-200 dark:border-[#3A2E4D] rounded-xl hover:bg-gray-50 dark:hover:bg-[#221830]">
              Cancelar
            </button>
            <button type="button" onClick={enviarResena} disabled={enviando}
              className="h-9 px-4 text-xs font-semibold text-white bg-gradient-to-r from-[#0A0A0A] via-[#3B0A45] to-[#5C2A52] rounded-xl flex items-center gap-2 disabled:opacity-50">
              {enviando && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {enviando ? 'Enviando...' : 'Enviar reseña'}
            </button>
          </div>
        </div>
      )}

      {cargando ? (
        <p className="text-xs text-gray-400 dark:text-[#b9aedd]">Cargando reseñas...</p>
      ) : resenas.length === 0 ? (
        <p className="text-xs text-gray-400 dark:text-[#b9aedd]">Todavía no hay reseñas para este producto.</p>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
          {resenas.map(r => (
            <div key={r.valoracionID} className="rounded-xl border border-gray-100 dark:border-[#3A2E4D] p-3">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[#0A0A0A] dark:text-[#F5F3FA]">{r.nombreUsuario}</span>
                  {r.verificadoCompra && (
                    <span className="flex items-center gap-1 text-[10px] font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/40 px-1.5 py-0.5 rounded-full">
                      <ShieldCheck className="w-3 h-3" /> Compra verificada
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-gray-400 dark:text-[#b9aedd]">
                  {new Date(r.fechaCreacion).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
              </div>
              <Estrellas valor={r.puntuacion} size={13} />
              {r.comentario && (
                <p className="text-sm text-gray-600 dark:text-[#b9aedd] mt-1.5">{r.comentario}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
