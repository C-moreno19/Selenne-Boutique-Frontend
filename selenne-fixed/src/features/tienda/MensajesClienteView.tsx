import React, { useState } from 'react';
import { ArrowLeft, Bell, CheckCheck, Loader2, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { useNotificaciones } from '../../shared/hooks/useNotificaciones';
import { NotificacionCard } from '../../components/NotificacionCard';

const POR_PAGINA = 10;
const FONT_SANS = '"Helvetica Neue", Helvetica, Arial, sans-serif';
const FONT_SERIF = '"Playfair Display", Georgia, "Iowan Old Style", "Palatino Linotype", "Times New Roman", serif';

interface Props {
  onBack: () => void;
  onVerPedidos?: () => void;
  notifHook: ReturnType<typeof useNotificaciones>;
}

export const MensajesClienteView: React.FC<Props> = ({ onBack, onVerPedidos, notifHook }) => {
  const { notificaciones, loading, noLeidas, marcarLeida, marcarTodas, eliminarTodas, cargar } = notifHook;
  const [pagina, setPagina] = useState(1);

  const totalPaginas = Math.ceil(notificaciones.length / POR_PAGINA);
  const inicio = (pagina - 1) * POR_PAGINA;
  const paginaItems = notificaciones.slice(inicio, inicio + POR_PAGINA);

  return (
    <div className="min-h-screen bg-[#FBF8F5] dark:bg-[#2a2029] flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-[#322631] border-b border-gray-100 dark:border-[#453840] sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-[#3a2530] rounded-xl transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-[#b8a3ac]" />
            </button>
            <div>
              <h1 style={{ fontFamily: FONT_SERIF }} className="text-xl text-gray-900 dark:text-[#F5EDE9] leading-tight">
                Mis Notificaciones
              </h1>
              {noLeidas > 0 && (
                <p style={{ fontFamily: FONT_SANS }} className="text-xs text-[#A3395C] font-medium">
                  {noLeidas} sin leer
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={cargar} className="p-2 hover:bg-gray-100 dark:hover:bg-[#3a2530] rounded-xl transition-colors" title="Actualizar">
              <Loader2 className={`w-4 h-4 text-gray-400 dark:text-[#b8a3ac] ${loading ? 'animate-spin' : ''}`} />
            </button>
            {noLeidas > 0 && (
              <button onClick={marcarTodas}
                style={{ fontFamily: FONT_SANS }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#A3395C] hover:bg-[#fdf2f8] dark:hover:bg-[#3a2530] rounded-xl transition-colors border border-[#f9a8d4] dark:border-[#5a3a48]">
                <CheckCheck className="w-3.5 h-3.5" /> Marcar todo leído
              </button>
            )}
            {notificaciones.length > 0 && (
              <button onClick={eliminarTodas}
                style={{ fontFamily: FONT_SANS }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-[#b8a3ac] hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 rounded-xl transition-colors border border-gray-200 dark:border-[#453840] hover:border-red-200 dark:hover:border-red-900/50">
                <Trash2 className="w-3.5 h-3.5" /> Limpiar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 space-y-3">
        {loading && notificaciones.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#A3395C]" />
            <p style={{ fontFamily: FONT_SANS }} className="text-sm text-gray-400 dark:text-[#b8a3ac]">Cargando notificaciones...</p>
          </div>
        ) : notificaciones.length === 0 ? (
          <div className="bg-white dark:bg-[#322631] rounded-2xl border border-gray-100 dark:border-[#453840] shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-[#fdf2f8] dark:bg-[#3a2530] rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-[#A3395C]" />
            </div>
            <h3 style={{ fontFamily: FONT_SANS }} className="text-lg text-gray-900 dark:text-[#F5EDE9] mb-2">
              Sin notificaciones
            </h3>
            <p style={{ fontFamily: FONT_SANS }} className="text-sm text-gray-500 dark:text-[#b8a3ac]">
              Aquí verás los movimientos de tus pedidos
            </p>
          </div>
        ) : (
          <>
            {paginaItems.map(n => (
              <NotificacionCard
                key={n.notificacionID}
                notif={n}
                onClick={() => !n.leida && marcarLeida(n.notificacionID)}
                onVerReferencia={onVerPedidos}
              />
            ))}

            {/* Paginación */}
            {totalPaginas > 1 && (
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setPagina(p => Math.max(1, p - 1))}
                  disabled={pagina === 1}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 dark:text-[#b8a3ac] hover:bg-white dark:hover:bg-[#322631] rounded-xl border border-gray-200 dark:border-[#453840] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  style={{ fontFamily: FONT_SANS }}
                >
                  <ChevronLeft className="w-4 h-4" /> Anterior
                </button>
                <span style={{ fontFamily: FONT_SANS }} className="text-xs text-gray-500 dark:text-[#b8a3ac]">
                  {pagina} / {totalPaginas}
                </span>
                <button
                  onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
                  disabled={pagina === totalPaginas}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 dark:text-[#b8a3ac] hover:bg-white dark:hover:bg-[#322631] rounded-xl border border-gray-200 dark:border-[#453840] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  style={{ fontFamily: FONT_SANS }}
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
