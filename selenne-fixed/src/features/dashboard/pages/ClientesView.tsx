import React, { useState, useEffect, useCallback } from 'react';
import { Search, Eye, ChevronRight, User, RefreshCw, Loader2, Package } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../components/ui/dialog';
import { toast } from '@/lib/toast';
import api from '../../../services/api';
import { usePedidosAdmin } from '../../../shared/contexts/PedidosAdminContext';
import { formatCurrency } from '../../../shared/utils';
import { useAuth } from '../../../shared/contexts/AuthContext';

interface Cliente {
  usuarioID: number;
  nombreCompleto: string;
  email: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  documento: string;
  estado: string;
  fechaRegistro: string;
}

export const ClientesView: React.FC = () => {
  const { pedidos } = usePedidosAdmin();
  const { hasPermission } = useAuth();
  const puedeHistorial = hasPermission('clientes:historial');

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [allPedidos, setAllPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [viewOpen, setViewOpen] = useState(false);

  const loadClientes = useCallback(async () => {
    try {
      const [res, pedidosRes] = await Promise.all([
        api.getJson('/api/usuarios'),
        api.getJson('/api/pedidos').catch(() => null),
      ]);
      setAllPedidos(pedidosRes?.data || pedidosRes || []);

      const todos = res?.data || res || [];
      const soloClientes = todos
        .filter((u: any) => {
          const rol = (u.rolNombre ?? u.RolNombre ?? '').toLowerCase();
          return rol === 'cliente' || rol === 'client';
        })
        .map((u: any) => ({
          usuarioID: u.usuarioID ?? u.UsuarioID,
          nombreCompleto: u.nombreCompleto ?? u.NombreCompleto ?? '',
          email: u.email ?? u.Email ?? '',
          telefono: u.telefono ?? u.Telefono ?? '',
          direccion: u.direccion ?? u.Direccion ?? '',
          ciudad: u.ciudad ?? u.Ciudad ?? '',
          documento: u.documento ?? u.Documento ?? '',
          estado: u.estado ?? u.Estado ?? 'activo',
          fechaRegistro: u.fechaRegistro ?? u.FechaRegistro ?? '',
        }));
      setClientes(soloClientes);
    } catch {
      toast.error('Error cargando clientes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadClientes(); }, [loadClientes]);

  const filtered = clientes.filter(c => {
    const q = searchQuery.toLowerCase();
    return (
      c.nombreCompleto.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.telefono.includes(q)
    );
  });

  const getDireccion = (c: Cliente) => {
    if (c.direccion) return c.direccion;
    const pedido = [...allPedidos, ...pedidos]
      .filter((p: any) => (p.emailCliente ?? p.email ?? '').toLowerCase() === c.email.toLowerCase())
      .sort((a: any, b: any) => new Date(b.fechaPedido ?? b.fecha ?? 0).getTime() - new Date(a.fechaPedido ?? a.fecha ?? 0).getTime())[0];
    return pedido?.direccionEnvio || pedido?.direccion || '—';
  };

  const formatFecha = (f: string) => {
    if (!f) return '—';
    try { return new Date(f).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' }); }
    catch { return f; }
  };

  return (
    <div className="p-8 bg-[#FBF8F5] min-h-screen">
      <div className="flex items-center gap-2 mb-4">
        <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-500">Dashboard</span>
        <ChevronRight className="w-4 h-4 text-gray-400" />
        <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-medium text-[#241B22]">Clientes</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="admin-page-title text-4xl text-[#241B22]">Clientes</h1>
          <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-gray-500 text-sm mt-1">
            Usuarios registrados con rol de cliente
          </p>
        </div>
        <button onClick={() => { setLoading(true); loadClientes(); }}
          style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E7E0DA] text-gray-600 rounded-lg hover:bg-[#FBF8F5] text-sm transition">
          <RefreshCw className="w-4 h-4" /> Actualizar
        </button>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-[#E7E0DA] mb-6">
        <div className="flex items-center gap-2 bg-[#FBF8F5] border border-[#E7E0DA] rounded-lg px-3 focus-within:ring-2 focus-within:ring-[#A3395C]">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input type="text" placeholder="Buscar por nombre, email o teléfono..."
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
            className="flex-1 bg-transparent py-2.5 text-sm focus:outline-none" />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-[#E7E0DA] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#A3395C] animate-spin" />
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-[#FBF8F5] border-b border-[#E7E0DA]">
                <tr>
                  {['CLIENTE', 'CORREO ELECTRÓNICO', 'TELÉFONO', 'ESTADO', 'ACCIONES'].map(h => (
                    <th key={h} className="px-5 py-3 text-left">
                      <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs font-semibold uppercase tracking-wider text-gray-400">{h}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(c => (
                  <tr key={c.usuarioID} className="hover:bg-[#FBF8F5]/70 transition">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-white text-sm font-medium">
                            {c.nombreCompleto.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="font-medium text-[#241B22] text-sm">{c.nombreCompleto}</p>
                          <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-400">{formatFecha(c.fechaRegistro)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-600">{c.email}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-600">{c.telefono || '—'}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${c.estado === 'activo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}
                        style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
                        {c.estado === 'activo' ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <button onClick={() => { setSelectedCliente(c); setViewOpen(true); }}
                        className="p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition" title="Ver detalles">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <User className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                      <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-gray-400 text-sm">
                        {searchQuery ? 'No se encontraron clientes con esa búsqueda' : 'Aún no hay clientes registrados'}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="px-5 py-3 border-t border-[#E7E0DA]">
              <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-400">
                {filtered.length} {filtered.length === 1 ? 'cliente' : 'clientes'}
                {searchQuery && ` · búsqueda: "${searchQuery}"`}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Modal Ver */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-2xl h-auto flex flex-col p-0 gap-0">
          <div className="px-8 pt-6 pb-5 flex-shrink-0" style={{ background: 'linear-gradient(90deg, #241B22 0%, #7a3350 55%, #A3395C 100%)' }}>
            <p className="text-[10px] font-bold uppercase tracking-[3px] text-[#EFD9DF] mb-1">Selenne Boutique</p>
            <DialogTitle style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xl font-bold text-white flex items-center gap-2">
              <User className="w-5 h-5 opacity-80" /> {selectedCliente?.nombreCompleto}
            </DialogTitle>
            <DialogDescription style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-[#EFD9DF] text-sm mt-0.5">
              Cliente desde {formatFecha(selectedCliente?.fechaRegistro || '')}
            </DialogDescription>
          </div>
          {selectedCliente && (
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-6 py-6 px-8">
                <div className="bg-white rounded-xl border border-[#E7E0DA] shadow-sm overflow-hidden">
                  <div className="bg-[#FBF8F5] px-6 py-4 border-b border-[#E7E0DA]">
                    <h3 style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="font-semibold text-[#241B22] text-base flex items-center gap-2"><User className="w-4 h-4 text-gray-400" />Información Personal</h3>
                  </div>
                  <div className="p-6 grid grid-cols-2 gap-6">
                    <div className="flex flex-col gap-1">
                      <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-500 uppercase font-medium">Nombre</p>
                      <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-semibold text-[#241B22]">{selectedCliente.nombreCompleto}</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-500 uppercase font-medium">Teléfono</p>
                      <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-semibold text-[#241B22]">{selectedCliente.telefono || '—'}</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-500 uppercase font-medium">Documento</p>
                      <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-semibold text-[#241B22]">{selectedCliente.documento || '—'}</p>
                    </div>
                    <div className="flex flex-col gap-1 col-span-2">
                      <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-500 uppercase font-medium">Email</p>
                      <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-semibold text-[#241B22] break-all">{selectedCliente.email}</p>
                    </div>
                    <div className="flex flex-col gap-1 col-span-2">
                      <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-500 uppercase font-medium">Dirección</p>
                      <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-semibold text-[#241B22]">{getDireccion(selectedCliente)}</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-500 uppercase font-medium">Estado</p>
                      <span className={`inline-flex w-fit px-3 py-1 rounded-full text-xs font-semibold ${selectedCliente.estado === 'activo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {selectedCliente.estado === 'activo' ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>
                </div>
                {puedeHistorial && (() => {
                  const pedidosCliente = pedidos.filter(p =>
                    p.email?.toLowerCase() === selectedCliente.email?.toLowerCase() ||
                    p.cliente?.toLowerCase() === selectedCliente.nombreCompleto?.toLowerCase()
                  );
                  if (pedidosCliente.length === 0) return null;
                  return (
                    <div className="bg-white rounded-xl border border-[#E7E0DA] shadow-sm overflow-hidden">
                      <div className="bg-[#FBF8F5] px-6 py-4 border-b border-[#E7E0DA]">
                        <h3 style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="font-semibold text-[#241B22] text-base flex items-center gap-2"><Package className="w-4 h-4 text-gray-400" />Pedidos ({pedidosCliente.length})</h3>
                      </div>
                      <div className="p-6 space-y-3 max-h-48 overflow-y-auto">
                        {pedidosCliente.map(pedido => (
                          <div key={pedido.id} className="flex justify-between items-center p-3 bg-[#FBF8F5] rounded-xl">
                            <div>
                              <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-semibold text-[#241B22]">{pedido.numeroComprobante}</p>
                              <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-500">{new Date(pedido.fecha).toLocaleDateString('es-CO')}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-bold text-[#241B22]">{formatCurrency(pedido.monto ?? 0)}</span>
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
          <DialogFooter className="gap-2 px-8 py-5 border-t border-[#E7E0DA] flex-shrink-0">
            <button onClick={() => setViewOpen(false)} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">Cerrar</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
