import { useEffect, useState, useCallback } from 'react';
import { Check, X, Trash2, ShieldCheck, Loader2, Star as StarIcon } from 'lucide-react';
import { getJson, putJson, deleteJson } from '../../../services/api';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { toast } from '@/lib/toast';
import type { Valoracion } from '../../../types/models';

const TABS: { value: string; label: string }[] = [
  { value: 'pendiente', label: 'Pendientes' },
  { value: 'aprobado', label: 'Aprobadas' },
  { value: 'rechazado', label: 'Rechazadas' },
];

export const ResenasView: React.FC = () => {
  const { hasPermission } = useAuth();
  const puedeModerar = hasPermission('productos:editar');

  const [tab, setTab] = useState('pendiente');
  const [resenas, setResenas] = useState<Valoracion[]>([]);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState<number | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const r = await getJson<{ data?: Valoracion[] }>(`/api/admin/valoraciones?estado=${tab}`);
      setResenas(r?.data ?? []);
    } catch {
      toast.error('No se pudieron cargar las reseñas');
      setResenas([]);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { cargar(); }, [cargar]);

  const moderar = async (id: number, nuevoEstado: 'aprobado' | 'rechazado') => {
    setProcesando(id);
    try {
      await putJson(`/api/admin/valoraciones/${id}/estado`, { NuevoEstado: nuevoEstado });
      toast.success(nuevoEstado === 'aprobado' ? 'Reseña aprobada' : 'Reseña rechazada');
      setResenas(prev => prev.filter(r => r.valoracionID !== id));
    } catch {
      toast.error('No se pudo actualizar la reseña');
    } finally {
      setProcesando(null);
    }
  };

  const eliminar = async (id: number) => {
    if (!confirm('¿Eliminar esta reseña permanentemente?')) return;
    setProcesando(id);
    try {
      await deleteJson(`/api/admin/valoraciones/${id}`);
      toast.success('Reseña eliminada');
      setResenas(prev => prev.filter(r => r.valoracionID !== id));
    } catch {
      toast.error('No se pudo eliminar la reseña');
    } finally {
      setProcesando(null);
    }
  };

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-6">
        <h1 style={{ fontFamily: '"Playfair Display", Georgia, serif' }} className="text-3xl text-[#241B22] dark:text-[#F5EDE9] mb-1">Reseñas</h1>
        <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-500 dark:text-[#b8a3ac]">
          Modera las reseñas que los clientes dejan en los productos.
        </p>
      </div>

      <div className="flex gap-2 mb-6 border-b border-[#E7E0DA] dark:border-[#453840]">
        {TABS.map(t => (
          <button key={t.value} onClick={() => setTab(t.value)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              tab === t.value
                ? 'border-[#A3395C] text-[#A3395C]'
                : 'border-transparent text-gray-500 dark:text-[#b8a3ac] hover:text-gray-700 dark:hover:text-[#F5EDE9]'
            }`}
            style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
      ) : resenas.length === 0 ? (
        <div className="text-center py-16 text-gray-400 dark:text-[#b8a3ac] text-sm" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
          No hay reseñas {tab === 'pendiente' ? 'pendientes' : tab === 'aprobado' ? 'aprobadas' : 'rechazadas'}.
        </div>
      ) : (
        <div className="space-y-3">
          {resenas.map(r => (
            <div key={r.valoracionID} className="bg-white dark:bg-[#322631] rounded-xl border border-[#E7E0DA] dark:border-[#453840] p-4 flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-semibold text-sm text-[#241B22] dark:text-[#F5EDE9]">{r.productoNombre ?? `Producto #${r.productoID}`}</span>
                  {r.verificadoCompra && (
                    <span className="flex items-center gap-1 text-[10px] font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/40 px-1.5 py-0.5 rounded-full">
                      <ShieldCheck className="w-3 h-3" /> Compra verificada
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map(i => (
                      <StarIcon key={i} width={14} height={14} className={i <= r.puntuacion ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
                    ))}
                  </div>
                  <span className="text-xs text-gray-400 dark:text-[#b8a3ac]">
                    {r.nombreUsuario} · {new Date(r.fechaCreacion).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                </div>
                {r.comentario && (
                  <p className="text-sm text-gray-600 dark:text-[#b8a3ac]">{r.comentario}</p>
                )}
              </div>

              {puedeModerar && (
                <div className="flex sm:flex-col gap-2 flex-shrink-0">
                  {tab !== 'aprobado' && (
                    <button onClick={() => moderar(r.valoracionID, 'aprobado')} disabled={procesando === r.valoracionID}
                      className="h-9 px-3 text-xs font-semibold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/40 rounded-lg flex items-center gap-1.5 hover:opacity-80 disabled:opacity-50">
                      <Check className="w-3.5 h-3.5" /> Aprobar
                    </button>
                  )}
                  {tab !== 'rechazado' && (
                    <button onClick={() => moderar(r.valoracionID, 'rechazado')} disabled={procesando === r.valoracionID}
                      className="h-9 px-3 text-xs font-semibold text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 rounded-lg flex items-center gap-1.5 hover:opacity-80 disabled:opacity-50">
                      <X className="w-3.5 h-3.5" /> Rechazar
                    </button>
                  )}
                  <button onClick={() => eliminar(r.valoracionID)} disabled={procesando === r.valoracionID}
                    className="h-9 px-3 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 rounded-lg flex items-center gap-1.5 hover:opacity-80 disabled:opacity-50">
                    <Trash2 className="w-3.5 h-3.5" /> Eliminar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
