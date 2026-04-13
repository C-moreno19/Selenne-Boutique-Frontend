import React, { useState } from 'react';
import { ArrowLeft, Bell, CheckCheck, Loader2, Package, CheckCircle, XCircle, Truck, CreditCard, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNotificaciones } from '../../shared/hooks/useNotificaciones';

const POR_PAGINA = 10;

interface Props {
  onBack: () => void;
  onVerPedidos?: () => void;
  notifHook: ReturnType<typeof useNotificaciones>;
}

const TIPO_CONFIG: Record<string, { icon: React.ReactNode; bg: string; border: string; text: string; label: string }> = {
  success: {
    icon: <CheckCircle className="w-5 h-5 text-green-600" />,
    bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', label: 'Aprobado',
  },
  error: {
    icon: <XCircle className="w-5 h-5 text-red-500" />,
    bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', label: 'Rechazado',
  },
  warning: {
    icon: <CreditCard className="w-5 h-5 text-amber-600" />,
    bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', label: 'Pago pendiente',
  },
  shipping: {
    icon: <Truck className="w-5 h-5 text-blue-600" />,
    bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', label: 'Enviado',
  },
  info: {
    icon: <Info className="w-5 h-5 text-[#d65391]" />,
    bg: 'bg-[#fdf2f8]', border: 'border-[#f9a8d4]', text: 'text-[#9d174d]', label: 'Notificación',
  },
};

function getTipoConfig(titulo: string, tipo: string) {
  if (titulo.includes('aprobado') || titulo.includes('Aprobado') || tipo === 'success') return TIPO_CONFIG.success;
  if (titulo.includes('rechazado') || titulo.includes('Rechazado') || tipo === 'error') return TIPO_CONFIG.error;
  if (titulo.includes('enviado') || titulo.includes('Enviado') || titulo.includes('camino') || titulo.includes('guía')) return TIPO_CONFIG.shipping;
  if (titulo.includes('pago') || titulo.includes('Pago') || tipo === 'warning') return TIPO_CONFIG.warning;
  return TIPO_CONFIG.info;
}

function formatFecha(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
}

export const MensajesClienteView: React.FC<Props> = ({ onBack, onVerPedidos, notifHook }) => {
  const { notificaciones, loading, noLeidas, marcarLeida, marcarTodas, cargar } = notifHook;
  const [pagina, setPagina] = useState(1);

  const totalPaginas = Math.ceil(notificaciones.length / POR_PAGINA);
  const inicio = (pagina - 1) * POR_PAGINA;
  const paginaItems = notificaciones.slice(inicio, inicio + POR_PAGINA);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 style={{ fontFamily: 'Playfair Display, serif' }} className="text-xl text-gray-900 leading-tight">
                Mis Notificaciones
              </h1>
              {noLeidas > 0 && (
                <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-[#d65391] font-medium">
                  {noLeidas} sin leer
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={cargar} className="p-2 hover:bg-gray-100 rounded-xl transition-colors" title="Actualizar">
              <Loader2 className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
            {noLeidas > 0 && (
              <button onClick={marcarTodas}
                style={{ fontFamily: 'Inter, sans-serif' }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#d65391] hover:bg-[#fdf2f8] rounded-xl transition-colors border border-[#f9a8d4]">
                <CheckCheck className="w-3.5 h-3.5" /> Marcar todo leído
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 space-y-3">
        {loading && notificaciones.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#d65391]" />
            <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-400">Cargando notificaciones...</p>
          </div>
        ) : notificaciones.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-[#fdf2f8] rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-[#d65391]" />
            </div>
            <h3 style={{ fontFamily: 'Playfair Display, serif' }} className="text-lg text-gray-900 mb-2">
              Sin notificaciones
            </h3>
            <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-500">
              Aquí verás los movimientos de tus pedidos
            </p>
          </div>
        ) : (
          <>
            {paginaItems.map(n => {
              const cfg = getTipoConfig(n.titulo, n.tipo);
              return (
                <div key={n.notificacionID}
                  onClick={() => !n.leida && marcarLeida(n.notificacionID)}
                  className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all cursor-pointer hover:shadow-md
                    ${!n.leida ? 'border-l-4 border-l-[#d65391] border-gray-100' : 'border-gray-100'}`}>
                  <div className="p-4 flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg} border ${cfg.border}`}>
                      {cfg.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span style={{ fontFamily: 'Inter, sans-serif' }} className="font-semibold text-sm text-gray-900">
                            {n.titulo}
                          </span>
                          {!n.leida && <span className="w-2 h-2 bg-[#d65391] rounded-full flex-shrink-0" />}
                        </div>
                        <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-400 flex-shrink-0">
                          {formatFecha(n.fechaCreacion)}
                        </span>
                      </div>
                      <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-600 mt-1 leading-relaxed">
                        {n.mensaje}
                      </p>
                      {n.referencia && (
                        <button
                          onClick={e => { e.stopPropagation(); onVerPedidos?.(); }}
                          className="flex items-center gap-1.5 mt-2 hover:text-[#d65391] transition-colors group"
                        >
                          <Package className="w-3 h-3 text-gray-400 group-hover:text-[#d65391]" />
                          <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-400 group-hover:text-[#d65391] underline underline-offset-2">
                            {n.referencia.replace('pedido-', 'Pedido #')}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Paginación */}
            {totalPaginas > 1 && (
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setPagina(p => Math.max(1, p - 1))}
                  disabled={pagina === 1}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-white rounded-xl border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  <ChevronLeft className="w-4 h-4" /> Anterior
                </button>
                <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-500">
                  {pagina} / {totalPaginas}
                </span>
                <button
                  onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
                  disabled={pagina === totalPaginas}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-white rounded-xl border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  Siguiente <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
