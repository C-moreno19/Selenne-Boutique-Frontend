import React, { useState, useEffect } from 'react';
import { ChevronRight, CheckCircle, XCircle, Download, Eye, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../../components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Textarea } from '../../../components/ui/textarea';
import { toast } from 'sonner';
import { usePedidosAdmin, type Pedido } from '../../../shared/contexts/PedidosAdminContext';
import { useMensajes } from '../../../shared/contexts/MensajesContext';

export const PedidosView: React.FC = () => {
  const { pedidos, aprobarPedido, rechazarPedido, actualizarPedido } = usePedidosAdmin();
  const { crearMensaje } = useMensajes();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEstado, setFilterEstado] = useState<'Pendiente' | 'Aprobada' | 'Rechazada' | 'Completada' | 'Todos'>('Todos');
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [razonRechazo, setRazonRechazo] = useState('');
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);
  const [reclamoDialogOpen, setReclamoDialogOpen] = useState(false);
  const [montoFaltante, setMontoFaltante] = useState('');
  const [mensajeReclamo, setMensajeReclamo] = useState('');

  // DEBUG: Mostrar todos los pedidos en consola
  console.log('📦 PedidosView - Pedidos del contexto:', pedidos);
  console.log('📦 Total pedidos:', pedidos.length);
  console.log('📦 Mostrando estado:', filterEstado);

  // Log cuando abre el modal con el pedido seleccionado
  useEffect(() => {
    if (viewModalOpen && selectedPedido) {
      console.log('🔍 [MODAL ABIERTO] Pedido seleccionado:', {
        id: selectedPedido.id,
        cliente: selectedPedido.cliente,
        metodoPago: selectedPedido.metodoPago,
        estado: selectedPedido.estado,
        items: selectedPedido.items,
        itemsLength: selectedPedido.items?.length || 0,
        tiene_items_array: Array.isArray(selectedPedido.items),
        full: selectedPedido
      });
    }
  }, [viewModalOpen, selectedPedido]);

  const filteredPedidos = pedidos.filter(pedido => {
    const query = (searchQuery || '').toLowerCase().trim();
    const matchesSearch = (pedido.cliente || '').toLowerCase().includes(query) ||
                         (pedido.numeroComprobante || '').toLowerCase().includes(query);
    const matchesEstado = filterEstado === 'Todos' || pedido.estado === filterEstado;
    return matchesSearch && matchesEstado;
  });

  const handleView = (pedido: Pedido) => {
    setSelectedPedido(pedido);
    setViewModalOpen(true);
  };

  const handleAprobar = (pedido: Pedido) => {
    setSelectedPedido(pedido);
    setApproveDialogOpen(true);
  };

  const handleRechazar = (pedido: Pedido) => {
    setSelectedPedido(pedido);
    setRejectDialogOpen(true);
  };

  const handleCompletar = (pedido: Pedido) => {
    setSelectedPedido(pedido);
    setCompleteDialogOpen(true);
  };

  const confirmAprobar = () => {
    if (!selectedPedido) return;
    
    aprobarPedido(selectedPedido.id);
    
    // Crear mensaje de aprobación para el cliente
    crearMensaje({
      idVenta: selectedPedido.idVenta || selectedPedido.id,
      emailCliente: selectedPedido.email,
      remitente: 'admin',
      contenido: `¡Hola ${selectedPedido.cliente}! Tu pago de $${selectedPedido.monto.toLocaleString('es-CO')} ha sido aprobado. Tu pedido será procesado en breve. Referencia: ${selectedPedido.numeroComprobante}`,
      tipo: 'aprobacion'
    });
    
    toast.success(`Pago de ${selectedPedido.cliente} aprobado`);
    setApproveDialogOpen(false);
    setViewModalOpen(false);
  };

  const confirmRechazar = () => {
    if (!selectedPedido || !razonRechazo.trim()) {
      toast.error('Por favor ingresa una razón de rechazo');
      return;
    }
    
    rechazarPedido(selectedPedido.id, razonRechazo);
    
    // Enviar notificación de rechazo
    crearMensaje({
      idVenta: selectedPedido.idVenta || selectedPedido.id,
      emailCliente: selectedPedido.email,
      remitente: 'admin',
      contenido: `Hola ${selectedPedido.cliente}, tu pago ha sido rechazado. Razón: ${razonRechazo}. Por favor, contacta con el equipo de soporte.`,
      tipo: 'rechazo'
    });
    
    toast.success(`Pago rechazado. Notificación enviada a ${selectedPedido.email}`);
    setRejectDialogOpen(false);
    setViewModalOpen(false);
    setRazonRechazo('');
  };

  const confirmCompletar = () => {
    if (!selectedPedido) return;

    // Actualizar pedido a estado Completada
    actualizarPedido(selectedPedido.id, { estado: 'Completada' });

    // Crear mensaje de finalización
    crearMensaje({
      idVenta: selectedPedido.idVenta || selectedPedido.id,
      emailCliente: selectedPedido.email,
      remitente: 'admin',
      contenido: `¡Hola ${selectedPedido.cliente}! Tu pedido ha sido marcado como completado. Gracias por comprar con nosotros.`,
      tipo: 'notificacion'
    });

    toast.success(`Pedido de ${selectedPedido.cliente} marcado como completado`);
    setCompleteDialogOpen(false);
    setViewModalOpen(false);
  };

  const enviarReclamoPago = () => {
    if (!selectedPedido || !montoFaltante) {
      toast.error('Por favor ingresa el monto faltante.');
      return;
    }

    const monto = parseFloat(montoFaltante);
    if (isNaN(monto) || monto <= 0) {
      toast.error('El monto debe ser un número válido mayor a 0.');
      return;
    }

    // Crear mensaje con opciones de pago
    const mensajeFinal = mensajeReclamo || `Hola ${selectedPedido.cliente}, hemos revisado tu pago por transferencia y encontramos que hace falta $${monto.toLocaleString('es-CO')}. 

Por favor tienes dos opciones:
1️⃣ Completar el pago: Envía el monto faltante de $${monto.toLocaleString('es-CO')} a nuestra cuenta bancaria.
2️⃣ Solicitar reembolso: Si prefieres no completar el pago, podemos procesar un reembolso del dinero que enviaste.

Responde a este correo para indicar qué opción prefieres. Gracias.`;

    crearMensaje({
      idVenta: selectedPedido.idVenta || selectedPedido.id,
      emailCliente: selectedPedido.email,
      emailAdmin: 'admin@seleneboutique.com', // Email del admin para recibir respuestas
      remitente: 'admin',
      contenido: mensajeFinal,
      tipo: 'pago-incompleto',
      destinatarios: ['cliente', 'admin'] // Se envía a cliente pero las respuestas van a admin
    });

    toast.success(`Correo enviado a ${selectedPedido.cliente} informando del monto faltante.`);
    setReclamoDialogOpen(false);
    setMontoFaltante('');
    setMensajeReclamo('');
  };

  const formatPrecio = (precio?: number) => {
    if (precio === undefined || precio === null) return '$0';
    return `$${precio.toLocaleString('es-CO')}`;
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'Pendiente':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">⏳ Pendiente</span>;
      case 'Aprobada':
        return <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">📦 Aprobada</span>;
      case 'Completada':
        return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">✓ Completada</span>;
      case 'Rechazada':
        return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">✕ Rechazada</span>;
      default:
        return null;
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-4">
        <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-500">
          Ventas
        </span>
        <ChevronRight className="w-4 h-4 text-gray-400" />
        <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-900">
          Pedidos
        </span>
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <h1 style={{ fontFamily: 'Playfair Display, serif' }} className="text-[36px] text-gray-900">
            Gestión de Pedidos
          </h1>
          <span className="px-3 py-1 bg-[#d65391] text-white rounded-full text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
            {filteredPedidos.length}
          </span>
        </div>
        <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-gray-600">
          Aprueba o rechaza pagos por transferencia de clientes
        </p>
      </div>

      {/* Layout Principal */}
      <div className="space-y-6">
        {/* Barra de Herramientas */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar por cliente o comprobante..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ fontFamily: 'Inter, sans-serif' }}
                  className="w-full pl-4 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d65391] focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="w-full sm:w-48">
              <Select value={filterEstado} onValueChange={(value: string) => setFilterEstado(value as 'Pendiente' | 'Aprobada' | 'Rechazada' | 'Completada' | 'Todos')}>
                <SelectTrigger aria-label="Filtrar por estado" className="w-full h-[42px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">📋 Todos los pedidos</SelectItem>
                  <SelectItem value="Pendiente">⏳ Pendiente (sin revisar)</SelectItem>
                  <SelectItem value="Aprobada">✅ Aprobada (confirmada)</SelectItem>
                  <SelectItem value="Completada">✓ Completada (entregada)</SelectItem>
                  <SelectItem value="Rechazada">❌ Rechazada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left" style={{ fontFamily: 'Inter, sans-serif' }}>
                    <span className="text-xs uppercase tracking-wider text-gray-600 font-bold">👤 CLIENTE</span>
                  </th>
                  <th className="px-6 py-4 text-left" style={{ fontFamily: 'Inter, sans-serif' }}>
                    <span className="text-xs uppercase tracking-wider text-gray-600">COMPROBANTE</span>
                  </th>
                  <th className="px-6 py-4 text-left" style={{ fontFamily: 'Inter, sans-serif' }}>
                    <span className="text-xs uppercase tracking-wider text-gray-600">TELÉFONO</span>
                  </th>
                  <th className="px-6 py-4 text-left" style={{ fontFamily: 'Inter, sans-serif' }}>
                    <span className="text-xs uppercase tracking-wider text-gray-600">BANCO</span>
                  </th>
                  <th className="px-6 py-4 text-left" style={{ fontFamily: 'Inter, sans-serif' }}>
                    <span className="text-xs uppercase tracking-wider text-gray-600">CUENTA</span>
                  </th>
                  <th className="px-6 py-4 text-left" style={{ fontFamily: 'Inter, sans-serif' }}>
                    <span className="text-xs uppercase tracking-wider text-gray-600">MONTO</span>
                  </th>
                  <th className="px-6 py-4 text-left" style={{ fontFamily: 'Inter, sans-serif' }}>
                    <span className="text-xs uppercase tracking-wider text-gray-600">FECHA</span>
                  </th>
                  <th className="px-6 py-4 text-left" style={{ fontFamily: 'Inter, sans-serif' }}>
                    <span className="text-xs uppercase tracking-wider text-gray-600">ESTADO</span>
                  </th>
                  <th className="px-6 py-4 text-left" style={{ fontFamily: 'Inter, sans-serif' }}>
                    <span className="text-xs uppercase tracking-wider text-gray-600">ACCIONES</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPedidos.map((pedido) => (
                  <tr key={pedido.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-gray-900 font-bold text-sm">
                          {pedido.cliente}
                        </span>
                        <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-500 mt-1">
                          {pedido.email}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-gray-900 font-medium">
                        {pedido.numeroComprobante}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-600">
                        {pedido.telefono || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-900 font-medium">
                        {pedido.banco}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-900 font-medium">
                        {pedido.cuenta}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span style={{ fontFamily: 'Playfair Display, serif' }} className="text-gray-900 font-semibold">
                        {formatPrecio(pedido.monto)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-600">
                        {new Date(pedido.fecha).toLocaleDateString('es-CO')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {getEstadoBadge(pedido.estado)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleView(pedido)}
                          className="p-2 text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
                          title="Ver comprobante"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        {pedido.estado === 'Pendiente' && (
                          <>
                            <button
                              onClick={() => handleAprobar(pedido)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Aprobar pago"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleRechazar(pedido)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Rechazar pago"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          </>
                        )}
                        {pedido.estado === 'Aprobada' && (
                          <>
                            <button
                              onClick={() => handleCompletar(pedido)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Aceptar pedido contra entrega"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleRechazar(pedido)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Rechazar pedido"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Ver Comprobante */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="!max-w-5xl">
          <DialogHeader className="sticky top-0 bg-white z-10 pb-4 border-b -mx-6 px-6 pt-0">
            <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }} className="text-2xl">
              Pedido #{selectedPedido?.numeroComprobante}
            </DialogTitle>
            <DialogDescription style={{ fontFamily: 'Inter, sans-serif' }} className="text-gray-600">
              {selectedPedido?.fecha} • ID Venta: {selectedPedido?.idVenta}
            </DialogDescription>
          </DialogHeader>

          {selectedPedido && (
            <div className="space-y-4">
              {/* Estado y Monto */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-blue-50 rounded-lg p-3">
                  <label style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-blue-600 uppercase tracking-wide font-semibold block mb-1">
                    Estado
                  </label>
                  {getEstadoBadge(selectedPedido.estado)}
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <label style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-green-600 uppercase tracking-wide font-semibold block mb-1">
                    Monto Total
                  </label>
                  <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-base font-semibold text-green-700">
                    ${selectedPedido.monto?.toLocaleString('es-CO') || '0'}
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-3">
                  <label style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-purple-600 uppercase tracking-wide font-semibold block mb-1">
                    Método Pago
                  </label>
                  <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm font-semibold text-purple-700">
                    {selectedPedido.metodoPago}
                  </p>
                </div>
              </div>

              {/* Información del Cliente */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                <h3 style={{ fontFamily: 'Playfair Display, serif' }} className="text-base font-semibold mb-3 text-blue-900">
                  👤 Información Completa del Cliente
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {/* Fila 1: Nombre y Documento */}
                  <div className="bg-white rounded p-3 shadow-sm">
                    <label style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-600 uppercase font-semibold block mb-1">
                      📛 Nombre
                    </label>
                    <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm font-bold text-gray-900">
                      {selectedPedido.cliente}
                    </p>
                  </div>
                  <div className="bg-white rounded p-3 shadow-sm">
                    <label style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-600 uppercase font-semibold block mb-1">
                      🆔 Documento
                    </label>
                    <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm font-bold text-gray-900">
                      {selectedPedido.numeroDocumento || 'N/A'}
                    </p>
                  </div>

                  {/* Fila 2: Email y Teléfono */}
                  <div className="bg-white rounded p-3 shadow-sm">
                    <label style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-600 uppercase font-semibold block mb-1">
                      ✉️ Email
                    </label>
                    <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs font-semibold text-gray-900 break-all">
                      {selectedPedido.email}
                    </p>
                  </div>
                  <div className="bg-white rounded p-3 shadow-sm">
                    <label style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-600 uppercase font-semibold block mb-1">
                      📞 Teléfono
                    </label>
                    <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm font-bold text-gray-900">
                      {selectedPedido.telefono || 'N/A'}
                    </p>
                  </div>

                  {/* Fila 3: Ciudad y Dirección */}
                  <div className="bg-white rounded p-3 shadow-sm">
                    <label style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-600 uppercase font-semibold block mb-1">
                      🏙️ Ciudad
                    </label>
                    <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm font-bold text-gray-900">
                      {selectedPedido.ciudad || 'N/A'}
                    </p>
                  </div>
                  <div className="bg-white rounded p-3 shadow-sm">
                    <label style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-600 uppercase font-semibold block mb-1">
                      📍 Barrio/Zona
                    </label>
                    <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm font-bold text-gray-900">
                      {selectedPedido.barrio || selectedPedido.zona || 'No especificado'}
                    </p>
                  </div>

                  {/* Dirección completa - full width */}
                  <div className="bg-white rounded p-3 shadow-sm col-span-2">
                    <label style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-600 uppercase font-semibold block mb-1">
                      🏠 Dirección Completa
                    </label>
                    <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm font-semibold text-gray-900 leading-relaxed">
                      {selectedPedido.direccion || 'No especificada'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Items Comprados */}
              {selectedPedido.items && selectedPedido.items.length > 0 ? (
                <div className="border-t pt-4">
                  <h3 style={{ fontFamily: 'Playfair Display, serif' }} className="text-base font-semibold mb-3 text-gray-900">
                    🛍️ Productos Comprados ({selectedPedido.items.length})
                  </h3>
                  <div className="space-y-3 max-h-[40vh] overflow-y-auto">
                    {selectedPedido.items.map((item: any, idx: number) => (
                      <div key={idx} className="bg-gradient-to-r from-gray-50 to-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition">
                        <div className="grid grid-cols-4 gap-4 items-center">
                          {/* Nombre y Descripción */}
                          <div className="col-span-2">
                            <p style={{ fontFamily: 'Inter, sans-serif' }} className="font-semibold text-gray-900">
                              {item.nombre}
                            </p>
                            <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-600 mt-1">
                              {item.tallaSeleccionada && `Talla: ${item.tallaSeleccionada}`}
                              {item.colorSeleccionado && ` • ${item.colorSeleccionado}`}
                            </p>
                          </div>

                          {/* Cantidad */}
                          <div className="text-center">
                            <label style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-500 uppercase font-semibold block mb-1">
                              Cantidad
                            </label>
                            <p className="font-bold text-lg text-gray-900">{item.cantidad}</p>
                          </div>

                          {/* Precio */}
                          <div className="text-right">
                            <label style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-500 uppercase font-semibold block mb-1">
                              Precio
                            </label>
                            <p className="font-bold text-gray-900">
                              ${item.precio?.toLocaleString('es-CO')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="border-t pt-4">
                  <h3 style={{ fontFamily: 'Playfair Display, serif' }} className="text-base font-semibold mb-3 text-gray-900">
                    🛍️ Productos
                  </h3>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                    <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-yellow-800">
                      ⚠️ Sin información de productos
                    </p>
                  </div>
                </div>
              )}

              {/* Información de Transferencia */}
              {selectedPedido.metodoPago === 'Transferencia' && (
                <div className="border-t pt-3 bg-yellow-50 rounded-lg p-3">
                  <h3 style={{ fontFamily: 'Playfair Display, serif' }} className="text-base font-semibold mb-2 text-yellow-900">
                    💳 Transferencia
                  </h3>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <div className="bg-white rounded p-2">
                      <label style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-600 uppercase block">
                        Banco
                      </label>
                      <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm font-semibold text-gray-900">
                        {selectedPedido.banco || 'N/A'}
                      </p>
                    </div>
                    <div className="bg-white rounded p-2 col-span-2">
                      <label style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-600 uppercase block">
                        Número de Cuenta
                      </label>
                      <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm font-semibold text-gray-900">
                        {selectedPedido.cuenta || 'N/A'}
                      </p>
                    </div>
                  </div>
                  {selectedPedido.comprobante && (
                    <div className="bg-white rounded p-2">
                      <label style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-600 uppercase block mb-1">
                        Comprobante
                      </label>
                      {selectedPedido.comprobante.startsWith('data:') || selectedPedido.comprobante.includes('base64') ? (
                        <div className="w-full flex justify-center">
                          <img
                            src={selectedPedido.comprobante}
                            alt="Comprobante"
                            className="max-w-full max-h-[40vh] object-contain rounded border border-gray-200"
                          />
                        </div>
                      ) : (
                        <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-600">
                          {selectedPedido.comprobante}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Sección de Reclamación de Pago para Transferencias Pendientes */}
              {selectedPedido.estado === 'Pendiente' && selectedPedido.metodoPago === 'Transferencia' && (
                <div className="border-t pt-4 bg-red-50 rounded-lg p-4">
                  <h3 style={{ fontFamily: 'Playfair Display, serif' }} className="text-base font-semibold mb-3 text-red-900">
                    💌 Comunicación: Pago Incompleto
                  </h3>
                  <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-red-800 mb-4">
                    Si falta dinero en el pago, usa el formulario de abajo para notificar al cliente.
                  </p>
                  
                  <div className="space-y-3">
                    {/* Monto Faltante */}
                    <div>
                      <label style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-600 uppercase font-semibold block mb-1">
                        💰 Monto Faltante
                      </label>
                      <input
                        type="number"
                        placeholder="Ej: 50000"
                        value={montoFaltante}
                        onChange={(e) => setMontoFaltante(e.target.value)}
                        className="w-full px-3 py-2 border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    
                    {/* Mensaje Personalizado */}
                    <div>
                      <label style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-600 uppercase font-semibold block mb-1">
                        📝 Mensaje Personalizado (Opcional)
                      </label>
                      <Textarea
                        placeholder="Escriba un mensaje personalizado. Si lo deja vacío, se usará el mensaje automático."
                        value={mensajeReclamo}
                        onChange={(e) => setMensajeReclamo(e.target.value)}
                        className="w-full px-3 py-2 border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none h-24"
                      />
                    </div>
                    
                    {/* Botón para Enviar */}
                    <button
                      onClick={() => setReclamoDialogOpen(true)}
                      style={{ fontFamily: 'Inter, sans-serif' }}
                      className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
                    >
                      📧 Enviar Correo al Cliente
                    </button>
                  </div>
                </div>
              )}

              {/* Notas */}
              {selectedPedido.notas && (
                <div className="border-t pt-4 bg-blue-50 rounded-lg p-4">
                  <h3 style={{ fontFamily: 'Playfair Display, serif' }} className="text-lg font-semibold mb-2 text-blue-900">
                    Notas del Pedido
                  </h3>
                  <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-gray-900 whitespace-pre-wrap">
                    {selectedPedido.notas}
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {selectedPedido?.estado === 'Pendiente' && (
              <>
                <button
                  onClick={() => handleRechazar(selectedPedido)}
                  style={{ fontFamily: 'Inter, sans-serif' }}
                  className="px-6 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                >
                  Rechazar
                </button>
                <button
                  onClick={() => handleAprobar(selectedPedido)}
                  style={{ fontFamily: 'Inter, sans-serif' }}
                  className="px-6 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                >
                  Aprobar
                </button>
              </>
            )}
            <button
              onClick={() => setViewModalOpen(false)}
              style={{ fontFamily: 'Inter, sans-serif' }}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cerrar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Aprobar */}
      <AlertDialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ fontFamily: 'Playfair Display, serif' }}>
              ¿Aprobar pago?
            </AlertDialogTitle>
            <AlertDialogDescription style={{ fontFamily: 'Inter, sans-serif' }}>
              {selectedPedido && (
                <>
                  ¿Confirmas que el pago de {selectedPedido.cliente} por{' '}
                  <span className="font-semibold">{formatPrecio(selectedPedido.monto)}</span> es válido?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel style={{ fontFamily: 'Inter, sans-serif' }}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAprobar}
              style={{ fontFamily: 'Inter, sans-serif' }}
              className="bg-green-600 hover:bg-green-700"
            >
              Aprobar Pago
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog Rechazar */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ fontFamily: 'Playfair Display, serif' }}>
              Rechazar Pago
            </AlertDialogTitle>
            <AlertDialogDescription style={{ fontFamily: 'Inter, sans-serif' }}>
              {selectedPedido && `Rechaza la transferencia de ${selectedPedido.cliente}`}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4">
            <div>
              <label style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-700 block mb-2">
                Razón del rechazo *
              </label>
              <Textarea
                placeholder="Explicar por qué se rechaza este pago..."
                value={razonRechazo}
                onChange={(e) => setRazonRechazo(e.target.value)}
                style={{ fontFamily: 'Inter, sans-serif' }}
                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-500 mt-1">
                El cliente recibirá un email con esta razón y se le reenviará el QR para que reintentar
              </p>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel style={{ fontFamily: 'Inter, sans-serif' }}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRechazar}
              style={{ fontFamily: 'Inter, sans-serif' }}
              className="bg-red-600 hover:bg-red-700"
            >
              Rechazar Pago
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Alert Dialog Marcar como Completada */}
      <AlertDialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <AlertDialogContent style={{ fontFamily: 'Inter, sans-serif' }}>
          <AlertDialogHeader>
            <AlertDialogTitle>Marcar como Completada</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Confirmas que el pedido de {selectedPedido?.cliente} con referencia {selectedPedido?.numeroComprobante} ha sido completado y entregado?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCompletar}
              className="bg-green-600 hover:bg-green-700"
            >
              Sí, Completar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Alert Dialog Enviar Reclamo de Pago */}
      <AlertDialog open={reclamoDialogOpen} onOpenChange={setReclamoDialogOpen}>
        <AlertDialogContent style={{ fontFamily: 'Inter, sans-serif' }}>
          <AlertDialogHeader>
            <AlertDialogTitle>Enviar Comunicación: Pago Incompleto</AlertDialogTitle>
            <AlertDialogDescription>
              Se enviará un correo a <strong>{selectedPedido?.cliente}</strong> ({selectedPedido?.email}) informando que falta <strong>${montoFaltante}</strong> por recibir.
              
              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p style={{ fontSize: '12px' }} className="text-blue-900 whitespace-pre-wrap">
                  El cliente recibirá dos opciones:
                  1️⃣ Completar el pago del monto faltante
                  2️⃣ Solicitar reembolso del dinero enviado
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={enviarReclamoPago}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Enviar Correo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>    </div>
  );
};