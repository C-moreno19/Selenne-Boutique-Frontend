import React, { useState } from 'react';
import { ChevronRight, Mail, MessageCircle, AlertCircle, Check, Eye, Trash2, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../../components/ui/dialog';
import { useMensajes } from '../../../shared/contexts/MensajesContext';
import { toast } from 'sonner';

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
        return <MessageCircle className="w-5 h-5 text-blue-600" />;
      case 'consulta':
        return <Mail className="w-5 h-5 text-purple-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getTypeBadge = (tipo: string) => {
    switch (tipo) {
      case 'respuesta-cliente':
        return (
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
            💬 Respuesta
          </span>
        );
      case 'consulta':
        return (
          <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
            📧 Consulta
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
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
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-4">
        <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-500">
          Dashboard
        </span>
        <ChevronRight className="w-4 h-4 text-gray-400" />
        <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-900">
          Notificaciones
        </span>
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <h1 style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-[36px] text-gray-900">
            🔔 Notificaciones
          </h1>
          {sinLeer > 0 && (
            <span className="px-3 py-1 bg-red-600 text-white rounded-full text-sm font-bold">
              {sinLeer} sin leer
            </span>
          )}
        </div>
        <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-gray-600">
          Respuestas de clientes y consultas recibidas
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
        <div className="flex gap-3">
          <button
            onClick={() => setFilterType('todos')}
            className={`px-4 py-2 rounded-lg transition-colors font-semibold ${
              filterType === 'todos'
                ? 'bg-[#d65391] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📋 Todas ({todosMsg.length})
          </button>
          <button
            onClick={() => setFilterType('respuestas')}
            className={`px-4 py-2 rounded-lg transition-colors font-semibold ${
              filterType === 'respuestas'
                ? 'bg-[#d65391] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            💬 Respuestas ({respuestas.length})
          </button>
          <button
            onClick={() => setFilterType('consultas')}
            className={`px-4 py-2 rounded-lg transition-colors font-semibold ${
              filterType === 'consultas'
                ? 'bg-[#d65391] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📧 Consultas ({consultas.length})
          </button>
        </div>
      </div>

      {/* Lista de Notificaciones */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {mensajesFiltrados.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-5xl mb-4">📭</div>
            <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-gray-600 text-lg">
              No hay notificaciones en esta categoría
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {mensajesFiltrados.map((msg) => (
              <div
                key={msg.id}
                className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer border-l-4 ${
                  !msg.leido
                    ? 'border-l-blue-600 bg-blue-50'
                    : 'border-l-gray-200 bg-white'
                }`}
                onClick={() => handleView(msg)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {getTypeIcon(msg.tipo)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="font-semibold text-gray-900">
                          {getMensajePrincipal(msg)}
                        </p>
                        {!msg.leido && (
                          <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                        )}
                      </div>
                      <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-500 truncate">
                        {msg.contenido.substring(0, 100)}...
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        {getTypeBadge(msg.tipo)}
                        <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-500">
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
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Ver detalles"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(msg.id);
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-2xl">
              {selectedMsg?.tipo === 'respuesta-cliente' ? '💬 Respuesta de Cliente' : '📧 Consulta'}
            </DialogTitle>
            <DialogDescription>
              De: <strong>{selectedMsg?.email}</strong> • {selectedMsg?.fecha}
            </DialogDescription>
          </DialogHeader>

          {selectedMsg && (
            <div className="space-y-4">
              {/* Info del Mensaje */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-semibold text-gray-600 uppercase mb-2">
                  Información
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Cliente</p>
                    <p className="font-semibold text-gray-900">{selectedMsg.email}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Tipo</p>
                    {getTypeBadge(selectedMsg.tipo)}
                  </div>
                  <div>
                    <p className="text-gray-600">Venta</p>
                    <p className="font-semibold text-gray-900">{selectedMsg.idVenta}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Fecha</p>
                    <p className="font-semibold text-gray-900">{selectedMsg.fecha}</p>
                  </div>
                </div>
              </div>

              {/* Contenido del Mensaje */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h3 style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-semibold text-blue-900 uppercase mb-2">
                  Mensaje
                </h3>
                <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-gray-900 whitespace-pre-wrap">
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
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                >
                  Eliminar
                </button>
                <button
                  onClick={() => setDetailsOpen(false)}
                  className="px-4 py-2 bg-[#d65391] text-white rounded-lg hover:bg-[#c04580] transition-colors"
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
