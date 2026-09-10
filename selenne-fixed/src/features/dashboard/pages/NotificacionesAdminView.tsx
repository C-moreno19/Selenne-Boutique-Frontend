import React, { useState } from 'react';
import { ChevronRight, Mail, MessageCircle, AlertCircle, Check, Eye, Trash2, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../../components/ui/dialog';
import { useMensajes } from '../../../shared/contexts/MensajesContext';
import { toast } from '@/lib/toast';

export const NotificacionesAdminView: React.FC = () => {
  const { obtenerMensajesAdmin, obtenerRespuestasClientes, marcarComoLeido, eliminarMensaje } = useMensajes();
  const [filterType, setFilterType] = useState<'todos' | 'respuestas' | 'consultas'>('todos');
  const [selectedMsg, setSelectedMsg] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const respuestas = obtenerRespuestasClientes();
  const todosMsg = obtenerMensajesAdmin();
  const consultas = todosMsg.filter(m => m.tipo === 'consulta' && m.remitente === 'cliente');

  let mensajesFiltrados = todosMsg;
  if (filterType === 'respuestas') mensajesFiltrados = respuestas;
  if (filterType === 'consultas') mensajesFiltrados = consultas;

  const sinLeer = mensajesFiltrados.filter(m => !m.leido).length;

  const handleView = (msg: any) => {
    setSelectedMsg(msg);
    setDetailsOpen(true);
    if (!msg.leido) {
      marcarComoLeido(msg.id);
    }
  };

  const handleDelete = (id: string) => {
    eliminarMensaje(id);
    toast.success('Notificación eliminada');
  };

  const getTypeIcon = (tipo: string) => {
    switch (tipo) {
      case 'respuesta-cliente':
        return <MessageCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      case 'consulta':
        return <Mail className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />;
    }
  };

  const getTypeBadge = (tipo: string) => {
    switch (tipo) {
      case 'respuesta-cliente':
        return (
          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 rounded-full text-xs font-semibold">
            💬 Respuesta
          </span>
        );
      case 'consulta':
        return (
          <span className="px-3 py-1 bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 rounded-full text-xs font-semibold">
            📧 Consulta
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-400 rounded-full text-xs font-semibold">
            ⚠️ Otras
          </span>
        );
    }
  };

  const getMensajePrincipal = (msg: any) => {
    if (msg.tipo === 'respuesta-cliente') {
      return `${msg.email} respondió sobre pago incompleto`;
    }
    if (msg.tipo === 'consulta') {
      return `${msg.email} envió una consulta`;
    }
    return msg.email;
  };

  return (
    <div className="p-8 bg-[#FBF8F5] dark:bg-[#1c151a] min-h-screen">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-4">
        <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-500 dark:text-[#b8a3ac]">
          Dashboard
        </span>
        <ChevronRight className="w-4 h-4 text-gray-400 dark:text-[#b8a3ac]" />
        <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-[#241B22] dark:text-[#F5EDE9]">
          Notificaciones
        </span>
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="admin-page-title text-[36px] text-[#241B22] dark:text-[#F5EDE9]">
            🔔 Notificaciones
          </h1>
          {sinLeer > 0 && (
            <span className="px-3 py-1 bg-red-600 text-white rounded-full text-sm font-bold">
              {sinLeer} sin leer
            </span>
          )}
        </div>
        <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-gray-600 dark:text-[#b8a3ac]">
          Respuestas de clientes y consultas recibidas
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-[#241B22] rounded-xl p-6 shadow-sm border border-[#E7E0DA] dark:border-[#3a2e35] mb-6">
        <div className="flex gap-3">
          <button
            onClick={() => setFilterType('todos')}
            className={`px-4 py-2 rounded-lg transition font-semibold ${
              filterType === 'todos'
                ? 'bg-[#A3395C] text-white'
                : 'bg-gray-100 dark:bg-[#2c2129] text-gray-700 dark:text-[#F5EDE9] hover:bg-gray-200 dark:hover:bg-[#3a2530]'
            }`}
          >
            📋 Todas ({todosMsg.length})
          </button>
          <button
            onClick={() => setFilterType('respuestas')}
            className={`px-4 py-2 rounded-lg transition font-semibold ${
              filterType === 'respuestas'
                ? 'bg-[#A3395C] text-white'
                : 'bg-gray-100 dark:bg-[#2c2129] text-gray-700 dark:text-[#F5EDE9] hover:bg-gray-200 dark:hover:bg-[#3a2530]'
            }`}
          >
            💬 Respuestas ({respuestas.length})
          </button>
          <button
            onClick={() => setFilterType('consultas')}
            className={`px-4 py-2 rounded-lg transition font-semibold ${
              filterType === 'consultas'
                ? 'bg-[#A3395C] text-white'
                : 'bg-gray-100 dark:bg-[#2c2129] text-gray-700 dark:text-[#F5EDE9] hover:bg-gray-200 dark:hover:bg-[#3a2530]'
            }`}
          >
            📧 Consultas ({consultas.length})
          </button>
        </div>
      </div>

      {/* Lista de Notificaciones */}
      <div className="bg-white dark:bg-[#241B22] rounded-xl shadow-sm border border-[#E7E0DA] dark:border-[#3a2e35] overflow-hidden">
        {mensajesFiltrados.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-5xl mb-4">📭</div>
            <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-gray-600 dark:text-[#b8a3ac] text-lg">
              No hay notificaciones en esta categoría
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-[#3a2e35]">
            {mensajesFiltrados.map((msg) => (
              <div
                key={msg.id}
                className={`p-4 hover:bg-[#FBF8F5] dark:hover:bg-[#2c2129] transition cursor-pointer border-l-4 ${
                  !msg.leido
                    ? 'border-l-blue-600 bg-blue-50 dark:bg-blue-950/40'
                    : 'border-l-gray-200 dark:border-l-[#3a2e35] bg-white dark:bg-[#241B22]'
                }`}
                onClick={() => handleView(msg)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {getTypeIcon(msg.tipo)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="font-semibold text-[#241B22] dark:text-[#F5EDE9]">
                          {getMensajePrincipal(msg)}
                        </p>
                        {!msg.leido && (
                          <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                        )}
                      </div>
                      <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-500 dark:text-[#b8a3ac] truncate">
                        {msg.contenido.substring(0, 100)}...
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        {getTypeBadge(msg.tipo)}
                        <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-500 dark:text-[#b8a3ac]">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {msg.fecha}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleView(msg);
                      }}
                      className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded transition"
                      title="Ver detalles"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(msg.id);
                      }}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition"
                      title="Eliminar"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Detalles */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
          <div className="px-8 pt-6 pb-5 flex-shrink-0" style={{ background: 'linear-gradient(90deg, #241B22 0%, #7a3350 55%, #A3395C 100%)' }}>
            <p className="text-[10px] font-bold uppercase tracking-[3px] text-[#EFD9DF] mb-1">Selenne Boutique</p>
            <DialogTitle style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xl font-bold text-white flex items-center gap-2">
              {selectedMsg?.tipo === 'respuesta-cliente' ? <MessageCircle className="w-5 h-5 opacity-80" /> : <Mail className="w-5 h-5 opacity-80" />}
              {selectedMsg?.tipo === 'respuesta-cliente' ? 'Respuesta de Cliente' : 'Consulta'}
            </DialogTitle>
            <DialogDescription className="text-[#EFD9DF] text-sm mt-0.5">
              De: <strong>{selectedMsg?.email}</strong> • {selectedMsg?.fecha}
            </DialogDescription>
          </div>

          {selectedMsg && (
            <div className="space-y-4 px-8 py-6 bg-[#FBF8F5] dark:bg-[#1c151a]">
              {/* Info del Mensaje */}
              <div className="bg-[#FBF8F5] dark:bg-[#241B22] rounded-lg p-4">
                <h3 style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-semibold text-gray-600 dark:text-[#b8a3ac] uppercase mb-2">
                  Información
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-[#b8a3ac]">Cliente</p>
                    <p className="font-semibold text-[#241B22] dark:text-[#F5EDE9]">{selectedMsg.email}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-[#b8a3ac]">Tipo</p>
                    {getTypeBadge(selectedMsg.tipo)}
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-[#b8a3ac]">Venta</p>
                    <p className="font-semibold text-[#241B22] dark:text-[#F5EDE9]">{selectedMsg.idVenta}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-[#b8a3ac]">Fecha</p>
                    <p className="font-semibold text-[#241B22] dark:text-[#F5EDE9]">{selectedMsg.fecha}</p>
                  </div>
                </div>
              </div>

              {/* Contenido del Mensaje */}
              <div className="bg-blue-50 dark:bg-blue-950/40 rounded-lg p-4 border border-blue-200 dark:border-blue-900/50">
                <h3 style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-semibold text-blue-900 dark:text-blue-300 uppercase mb-2">
                  Mensaje
                </h3>
                <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-[#241B22] dark:text-[#F5EDE9] whitespace-pre-wrap">
                  {selectedMsg.contenido}
                </p>
              </div>

              {/* Acciones */}
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    handleDelete(selectedMsg.id);
                    setDetailsOpen(false);
                  }}
                  className="px-4 py-2 bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition"
                >
                  Eliminar
                </button>
                <button
                  onClick={() => setDetailsOpen(false)}
                  className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition"
                  style={{ background: 'linear-gradient(90deg, #241B22 0%, #7a3350 55%, #A3395C 100%)' }}
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
