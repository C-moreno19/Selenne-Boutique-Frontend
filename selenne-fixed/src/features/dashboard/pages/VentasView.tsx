import React, { useState } from 'react';
import { Search, Eye, ChevronRight, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../../components/ui/dialog';
import { toast } from 'sonner';
import { usePermisos } from '../../../shared/contexts/PermisosContext';
import { usePedidosAdmin } from '../../../shared/contexts/PedidosAdminContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';

interface VentasViewProps {
  onNavigateToNuevaVenta?: () => void;
}

export const VentasView: React.FC<VentasViewProps> = ({ onNavigateToNuevaVenta }) => {
  const { canDelete } = usePermisos();
  const { pedidos } = usePedidosAdmin();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEstado, setFilterEstado] = useState<'Todos' | 'Aprobada' | 'Pendiente' | 'Completada' | 'Rechazada'>('Todos');
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedPedido, setSelectedPedido] = useState<any>(null);

  // Filtrar pedidos por estado seleccionado
  const filteredByEstado = filterEstado === 'Todos' 
    ? pedidos 
    : pedidos.filter(p => p.estado === filterEstado);

  const filteredVentas = filteredByEstado.filter(pedido => {
    const searchLower = searchQuery.toLowerCase();
    return (
      pedido.id.toLowerCase().includes(searchLower) ||
      (pedido.email ? pedido.email.toLowerCase().includes(searchLower) : false) ||
      (pedido.cliente ? pedido.cliente.toLowerCase().includes(searchLower) : false) ||
      (pedido.estado ? pedido.estado.toLowerCase().includes(searchLower) : false)
    );
  });

  const handleView = (pedido: any) => {
    setSelectedPedido(pedido);
    setViewModalOpen(true);
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Completada': return 'bg-green-100 text-green-800';
      case 'Aprobada': return 'bg-blue-100 text-blue-800';
      case 'Pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'Rechazada': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatPrecio = (precio: number) => `$'{precio.toLocaleString('es-CO')}`;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-4">
        <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-500">
          Dashboard
        </span>
        <ChevronRight className="w-4 h-4 text-gray-400" />
        <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-900">
          Gestión de Ventas
        </span>
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <h1 style={{ fontFamily: 'Playfair Display, serif' }} className="text-[36px] text-gray-900">
            Gestión de Ventas
          </h1>
          <span className="px-3 py-1 bg-[#d65391] text-white rounded-full text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
            {filteredVentas.length}
          </span>
        </div>
        <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-gray-600">
          Administra tus ventas y transacciones
        </p>
      </div>

      {/* Layout Tabla */}
      <div className="space-y-6">
        {/* Barra de Herramientas */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar pedidos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ fontFamily: 'Inter, sans-serif' }}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d65391] focus:border-transparent transition-all"
                />
              </div>
            </div>

            <Select value={filterEstado} onValueChange={(value: any) => setFilterEstado(value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos los estados</SelectItem>
                <SelectItem value="Aprobada">Aprobada</SelectItem>
                <SelectItem value="Pendiente">Pendiente</SelectItem>
                <SelectItem value="Completada">Completada</SelectItem>
                <SelectItem value="Rechazada">Rechazada</SelectItem>
              </SelectContent>
            </Select>

            <button
              onClick={() => toast.success('Exportando pedidos...')}
              style={{ fontFamily: 'Inter, sans-serif' }}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 whitespace-nowrap"
              title="Descargar pedidos"
            >
              <Download className="w-5 h-5" />
              Exportar
            </button>
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left" style={{ fontFamily: 'Inter, sans-serif' }}>
                    <span className="text-xs uppercase tracking-wider text-gray-600">ID PEDIDO</span>
                  </th>
                  <th className="px-6 py-4 text-left" style={{ fontFamily: 'Inter, sans-serif' }}>
                    <span className="text-xs uppercase tracking-wider text-gray-600">CLIENTE</span>
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
                {filteredVentas.map((pedido) => (
                  <tr key={pedido.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-gray-900">
                        {pedido.id}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-gray-900 font-medium block">
                          {pedido.cliente}
                        </span>
                        <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-500">
                          {pedido.email}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs $'{getEstadoColor(pedido.estado)}`}
                        style={{ fontFamily: 'Inter, sans-serif' }}
                      >
                        {pedido.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleView(pedido)}
                          className="p-2 text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
                          title="Ver detalles"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 bg-white border-t border-gray-100">
            <div className="text-sm text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>
              Mostrando <span className="text-gray-900">{filteredVentas.length}</span> de {pedidos.length} pedidos {filterEstado !== 'Todos' && `en estado "${filterEstado}"`}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Ver Detalles */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="!max-w-5xl">
          <DialogHeader className="sticky top-0 bg-white z-10 pb-4 border-b -mx-6 px-6 pt-0">
            <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }} className="text-2xl">
              Detalles del Pedido #{selectedPedido?.numeroComprobante}
            </DialogTitle>
            <DialogDescription style={{ fontFamily: 'Inter, sans-serif' }} className="text-gray-600">
              Información completa del pedido - {selectedPedido?.fecha}
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
                  <p className={`text-base font-semibold ${
                    selectedPedido.estado === 'Completada' ? 'text-green-600' : 
                    selectedPedido.estado === 'Aprobada' ? 'text-blue-600' :
                    selectedPedido.estado === 'Pendiente' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {selectedPedido.estado}
                  </p>
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
              {selectedPedido.items && selectedPedido.items.length > 0 && (
                <div className="border-t pt-3 max-h-[40vh] overflow-y-auto">
                  <h3 style={{ fontFamily: 'Playfair Display, serif' }} className="text-base font-semibold mb-2 sticky top-0 bg-white pb-2">
                    🛍️ Productos ({selectedPedido.items.length})
                  </h3>
                  <div className="space-y-2">
                    {selectedPedido.items.map((item: any, idx: number) => (
                      <div key={idx} className="bg-gradient-to-r from-gray-50 to-white rounded-lg p-3 border border-gray-200 hover:shadow-md transition">
                        <div className="flex gap-3">
                          {/* Imagen del Producto */}
                          <div className="flex-shrink-0">
                            {item.imagen ? (
                              <img
                                src={item.imagen}
                                alt={item.nombre}
                                className="w-20 h-20 object-cover rounded border border-gray-300"
                              />
                            ) : (
                              <div className="w-20 h-20 bg-gray-300 rounded border border-gray-300 flex items-center justify-center">
                                <span className="text-xs text-gray-600">Sin imagen</span>
                              </div>
                            )}
                          </div>

                          {/* Información del Producto */}
                          <div className="flex-1 grid grid-cols-2 gap-2">
                            {/* Nombre y Atributos */}
                            <div className="col-span-2">
                              <p style={{ fontFamily: 'Inter, sans-serif' }} className="font-semibold text-gray-900 text-sm">
                                {item.nombre}
                              </p>
                              <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-600 mt-0.5">
                                {item.tallaSeleccionada && `Talla: ${item.tallaSeleccionada}`}
                                {item.colorSeleccionado && ` • ${item.colorSeleccionado}`}
                              </p>
                            </div>

                            {/* Precio */}
                            <div>
                              <label style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-500 uppercase font-semibold block mb-0.5">
                                Precio
                              </label>
                              <p className="font-semibold text-gray-900 text-sm">
                                ${item.precio?.toLocaleString('es-CO')}
                              </p>
                            </div>

                            {/* Cantidad */}
                            <div>
                              <label style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-500 uppercase font-semibold block mb-0.5">
                                Cantidad
                              </label>
                              <p className="font-semibold text-gray-900 text-sm">{item.cantidad}x</p>
                            </div>

                            {/* Subtotal */}
                            <div className="col-span-2 pt-1 border-t border-gray-200">
                              <div className="flex justify-between items-center">
                                <label style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-600 font-semibold">
                                  Subtotal:
                                </label>
                                <p className="font-bold text-green-700 text-sm">
                                  ${(item.cantidad * item.precio)?.toLocaleString('es-CO')}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Información de Pago (Transferencia) */}
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
                        <img
                          src={selectedPedido.comprobante}
                          alt="Comprobante"
                          className="max-w-full h-auto border border-gray-200 rounded"
                        />
                      ) : (
                        <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-600">
                          {selectedPedido.comprobante}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Notas */}
              {selectedPedido.notas && (
                <div className="border-t pt-3 bg-blue-50 rounded-lg p-3">
                  <h3 style={{ fontFamily: 'Playfair Display, serif' }} className="text-base font-semibold mb-1 text-blue-900">
                    📝 Notas
                  </h3>
                  <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-900 whitespace-pre-wrap">
                    {selectedPedido.notas}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
