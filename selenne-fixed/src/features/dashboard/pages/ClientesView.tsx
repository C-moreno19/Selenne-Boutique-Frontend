import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Eye,
  Edit,
  ChevronRight,
  Mail,
  MapPin,
  User
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { toast } from 'sonner';
import { usePedidosAdmin } from '../../../shared/contexts/PedidosAdminContext';

interface Cliente {
  id: string;
  nombre: string;
  email: string;
  telefono?: string;
  direccion?: string;
  fechaRegistro: string;
  comprasTotales?: number;
  tipo?: string;
}

export const ClientesView: React.FC = () => {
  const { pedidos } = usePedidosAdmin();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);

  const [formData, setFormData] = useState<Partial<Cliente>>({
    nombre: '',
    email: '',
    telefono: '',
    direccion: '',
  });

  const [clientes, setClientes] = useState<Cliente[]>(() => {
    try {
      const stored = localStorage.getItem('selenne_users');
      if (stored) {
        const users = JSON.parse(stored);
        return users.filter((u: any) => u.tipo === 'CLIENTE').map((u: any) => ({
          id: u.id,
          nombre: u.nombre,
          email: u.email,
          telefono: u.telefono,
          direccion: u.direccion,
          fechaRegistro: u.fechaRegistro,
          tipo: u.tipo
        }));
      }
    } catch (e) {
      console.error('Error reading clientes from localStorage', e);
    }
    return [];
  });

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'selenne_users') {
        try {
          const data = e.newValue ? JSON.parse(e.newValue) : [];
          const clientesOnly = Array.isArray(data) ? data.filter((u: any) => u.tipo === 'CLIENTE').map((u: any) => ({
            id: u.id,
            nombre: u.nombre,
            email: u.email,
            telefono: u.telefono,
            direccion: u.direccion,
            fechaRegistro: u.fechaRegistro,
            tipo: u.tipo
          })) : [];
          setClientes(clientesOnly);
        } catch (err) {}
      }
    };
    window.addEventListener('storage', onStorage);

    const reloadClientes = () => {
      try {
        const stored = localStorage.getItem('selenne_users');
        if (stored) {
          const data = JSON.parse(stored);
          const clientesOnly = Array.isArray(data) ? data.filter((u: any) => u.tipo === 'CLIENTE').map((u: any) => ({
            id: u.id,
            nombre: u.nombre,
            email: u.email,
            telefono: u.telefono,
            direccion: u.direccion,
            fechaRegistro: u.fechaRegistro,
            tipo: u.tipo
          })) : [];
          setClientes(clientesOnly);
        }
      } catch (err) {
        console.error('Error reloading clientes:', err);
      }
    };

    const interval = setInterval(reloadClientes, 2000);

    try {
      if ('BroadcastChannel' in window) {
        const ch = new BroadcastChannel('selenne_clientes_channel');
        ch.onmessage = (ev) => {
          const msg = ev.data;
          if (msg?.type === 'cliente_creado' && msg.cliente) {
            reloadClientes();
          }
        };
        return () => { 
          ch.close(); 
          window.removeEventListener('storage', onStorage);
          clearInterval(interval);
        };
      }
    } catch (err) {}

    return () => {
      window.removeEventListener('storage', onStorage);
      clearInterval(interval);
    };
  }, []);

  const filteredClientes = clientes.filter(cliente =>
    cliente.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cliente.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (cliente.telefono && cliente.telefono.includes(searchQuery))
  );

  const handleView = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setViewModalOpen(true);
  };

  const handleEdit = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setFormData({
      nombre: cliente.nombre,
      email: cliente.email,
      telefono: cliente.telefono,
      direccion: cliente.direccion,
    });
    setEditModalOpen(true);
  };

  const handleSaveEdit = () => {
    if (!selectedCliente) return;

    if (!formData.nombre || !formData.email) {
      toast.error('Por favor completa los datos obligatorios');
      return;
    }

    setClientes(prev =>
      prev.map(c => c.id === selectedCliente.id ? { 
        ...c, 
        nombre: formData.nombre || c.nombre,
        email: formData.email || c.email,
        telefono: formData.telefono || c.telefono,
        direccion: formData.direccion || c.direccion,
      } : c)
    );

    setTimeout(() => {
      try {
        const stored = localStorage.getItem('selenne_clientes');
        const arr = stored ? JSON.parse(stored) : [];
        const updated = arr.map((c: any) => c.id === selectedCliente.id ? { ...c, nombre: formData.nombre || c.nombre, email: formData.email || c.email, telefono: formData.telefono || c.telefono, direccion: formData.direccion || c.direccion } : c);
        localStorage.setItem('selenne_clientes', JSON.stringify(updated));
        try { const ch = new BroadcastChannel('selenne_clientes_channel'); ch.postMessage({ type: 'cliente_actualizado', clienteId: selectedCliente.id, cliente: updated.find((x: any) => x.id === selectedCliente.id) }); ch.close(); } catch(e){}
      } catch (e) {}
    }, 0);

    setEditModalOpen(false);
    toast.success('Cliente actualizado correctamente');
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex items-center gap-2 mb-4">
        <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-500">Dashboard</span>
        <ChevronRight className="w-4 h-4 text-gray-400" />
        <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-900">Clientes</span>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <h1 style={{ fontFamily: 'Playfair Display, serif' }} className="text-[36px] text-gray-900">Gestión de Clientes</h1>
          <span className="px-3 py-1 bg-[#d65391] text-white rounded-full text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
            {filteredClientes.length}
          </span>
        </div>
        <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-gray-600">Consulta y gestiona la información de tus clientes</p>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Buscar por nombre, email o teléfono..."
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            style={{ fontFamily: 'Inter, sans-serif' }}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d65391] focus:border-transparent transition-all" />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left" style={{ fontFamily: 'Inter, sans-serif' }}><span className="text-xs uppercase tracking-wider text-gray-600">NOMBRE</span></th>
                <th className="px-6 py-4 text-left" style={{ fontFamily: 'Inter, sans-serif' }}><span className="text-xs uppercase tracking-wider text-gray-600">EMAIL</span></th>
                <th className="px-6 py-4 text-left" style={{ fontFamily: 'Inter, sans-serif' }}><span className="text-xs uppercase tracking-wider text-gray-600">TELÉFONO</span></th>
                <th className="px-6 py-4 text-left" style={{ fontFamily: 'Inter, sans-serif' }}><span className="text-xs uppercase tracking-wider text-gray-600">FECHA REGISTRO</span></th>
                <th className="px-6 py-4 text-left" style={{ fontFamily: 'Inter, sans-serif' }}><span className="text-xs uppercase tracking-wider text-gray-600">ACCIONES</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredClientes.map((cliente) => (
                <tr key={cliente.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-[#d65391] to-[#f8a9c5] rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-gray-900">{cliente.nombre}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-600">{cliente.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4"><span style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-600">{cliente.telefono || '-'}</span></td>
                  <td className="px-6 py-4"><span style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-600">{cliente.fechaRegistro}</span></td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleView(cliente)}
                        className="p-2 text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors" title="Ver detalles">
                        <Eye className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleEdit(cliente)}
                        className="p-2 text-gray-600 hover:bg-yellow-50 hover:text-yellow-600 rounded-lg transition-colors" title="Editar cliente">
                        <Edit className="w-5 h-5" />
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
            Mostrando <span className="text-gray-900">{filteredClientes.length}</span> clientes
          </div>
        </div>
      </div>

      {/* Modal Ver Detalles — estilo Proveedores */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-2xl h-auto flex flex-col p-0 gap-0">
          <DialogHeader className="px-8 pt-6 pb-4 border-b border-gray-200 flex-shrink-0">
            <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }} className="text-2xl">
              {selectedCliente?.nombre}
            </DialogTitle>
            <DialogDescription style={{ fontFamily: 'Inter, sans-serif' }}>
              Cliente desde {selectedCliente?.fechaRegistro}
            </DialogDescription>
          </DialogHeader>

          {selectedCliente && (
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-6 py-6 px-8">

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <h3 style={{ fontFamily: 'Inter, sans-serif' }} className="font-semibold text-gray-800 text-base">👤 Información Personal</h3>
                  </div>
                  <div className="p-6 grid grid-cols-2 gap-6">
                    <div className="flex flex-col gap-1">
                      <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-500 font-medium uppercase">Nombre</p>
                      <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm font-semibold text-gray-900">{selectedCliente.nombre}</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-500 font-medium uppercase">Teléfono</p>
                      <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm font-semibold text-gray-900">{selectedCliente.telefono || '—'}</p>
                    </div>
                    <div className="flex flex-col gap-1 col-span-2">
                      <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-500 font-medium uppercase">Email</p>
                      <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm font-semibold text-gray-900 break-all">{selectedCliente.email}</p>
                    </div>
                    {selectedCliente.direccion && (
                      <div className="flex flex-col gap-1 col-span-2">
                        <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-500 font-medium uppercase">Dirección</p>
                        <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm font-semibold text-gray-900">{selectedCliente.direccion}</p>
                      </div>
                    )}
                  </div>
                </div>

                {(() => {
                  const pedidosCliente = pedidos.filter(
                    p => p.email?.toLowerCase() === selectedCliente.email?.toLowerCase() ||
                         p.cliente?.toLowerCase() === selectedCliente.nombre?.toLowerCase()
                  );
                  if (pedidosCliente.length === 0) return null;
                  return (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                        <h3 style={{ fontFamily: 'Inter, sans-serif' }} className="font-semibold text-gray-800 text-base">📦 Pedidos ({pedidosCliente.length})</h3>
                      </div>
                      <div className="p-6 space-y-3 max-h-48 overflow-y-auto">
                        {pedidosCliente.map((pedido) => (
                          <div key={pedido.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                            <div>
                              <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm font-semibold text-gray-900">{pedido.numeroComprobante}</p>
                              <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-500">{new Date(pedido.fecha).toLocaleDateString('es-CO')}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm font-bold text-gray-900">${pedido.monto?.toLocaleString('es-CO') || '0'}</span>
                              <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                                pedido.estado === 'Completada' ? 'bg-green-100 text-green-700' :
                                pedido.estado === 'Aprobada' ? 'bg-blue-100 text-blue-700' :
                                pedido.estado === 'Pendiente' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>{pedido.estado}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

              </div>
            </div>
          )}

          <DialogFooter className="gap-2 px-8 py-5 border-t border-gray-200 flex-shrink-0">
            <button onClick={() => setViewModalOpen(false)} style={{ fontFamily: 'Inter, sans-serif' }}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">Cerrar</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Editar Cliente — sin cambios */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }} className="text-2xl">Editar Cliente</DialogTitle>
            <DialogDescription style={{ fontFamily: 'Inter, sans-serif' }}>Actualiza la información del cliente</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="cliente-nombre" className="text-sm text-gray-700 block mb-2">Nombre *</Label>
              <Input id="cliente-nombre" type="text" value={formData.nombre || ''}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} placeholder="Nombre del cliente" />
            </div>
            <div>
              <Label htmlFor="cliente-email" className="text-sm text-gray-700 block mb-2">Email *</Label>
              <Input id="cliente-email" type="email" value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="email@ejemplo.com" />
            </div>
            <div>
              <Label htmlFor="cliente-telefono" className="text-sm text-gray-700 block mb-2">Teléfono</Label>
              <Input id="cliente-telefono" type="tel" value={formData.telefono || ''}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })} placeholder="+57 300 000 0000" />
            </div>
            <div>
              <Label htmlFor="cliente-direccion" className="text-sm text-gray-700 block mb-2">Dirección</Label>
              <Input id="cliente-direccion" type="text" value={formData.direccion || ''}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })} placeholder="Calle 123 #45-67, Ciudad" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <button onClick={() => setEditModalOpen(false)} style={{ fontFamily: 'Inter, sans-serif' }}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">Cancelar</button>
            <button onClick={handleSaveEdit} style={{ fontFamily: 'Inter, sans-serif' }}
              className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors">Guardar Cambios</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};