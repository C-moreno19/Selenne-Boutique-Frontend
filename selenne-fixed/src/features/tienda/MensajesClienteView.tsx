import React from 'react';
import { ArrowLeft, Mail } from 'lucide-react';
import { useMensajes } from '../../shared/contexts/MensajesContext';
import { useAuth } from '../../shared/contexts/AuthContext';
import { Button } from '../../components/ui/button';

interface MensajesClienteViewProps {
  onBack: () => void;
}

export const MensajesClienteView: React.FC<MensajesClienteViewProps> = ({ onBack }) => {
  const { user } = useAuth();
  const { obtenerMensajesPorCliente, marcarComoLeido } = useMensajes();

  const mensajes = user?.email ? obtenerMensajesPorCliente(user.email) : [];

  const getTipoBadge = (tipo: string) => {
    const configs: Record<string, { bg: string; text: string; label: string }> = {
      aprobacion: { bg: 'bg-green-100', text: 'text-green-700', label: '✓ Aprobado' },
      rechazo: { bg: 'bg-red-100', text: 'text-red-700', label: '✗ Rechazado' },
      notificacion: { bg: 'bg-blue-100', text: 'text-blue-700', label: '📢 Notificación' },
      consulta: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '❓ Consulta' },
    };
    return configs[tipo] || configs.notificacion;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>
            <div>
              <h1 style={{ fontFamily: 'Playfair Display, serif' }} className="text-2xl text-gray-900">
                Mis Mensajes
              </h1>
              <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-600">
                Notificaciones sobre tus compras y consultas
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {mensajes.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 style={{ fontFamily: 'Inter, sans-serif' }} className="text-lg font-medium text-gray-900 mb-2">
              No tienes mensajes
            </h3>
            <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-gray-600">
              Los mensajes de tus compras aparecerán aquí
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {mensajes.map((msg) => {
              const config = getTipoBadge(msg.tipo);
              return (
                <div
                  key={msg.id}
                  className={`bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer ${
                    !msg.leido ? 'border-l-4 border-l-[#d65391]' : ''
                  }`}
                  onClick={() => marcarComoLeido(msg.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${config.bg} ${config.text}`}
                        >
                          {config.label}
                        </span>
                        {!msg.leido && (
                          <span className="w-2 h-2 bg-[#d65391] rounded-full"></span>
                        )}
                      </div>
                      <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-gray-900 break-word">
                        {msg.contenido}
                      </p>
                      <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-500 mt-2">
                        {msg.fecha} • Referencia: {msg.idVenta}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
