import React, { useState, useEffect, useCallback } from 'react';
import { Search, Eye, ArrowLeft, ChevronRight, Loader2, RefreshCw, Trash2, User, CreditCard, ShoppingBag, Check, X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from '../../../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../../components/ui/alert-dialog';
import { toast } from '@/lib/toast';
import { getJson } from '../../../services/api';
import api from '../../../services/api';
import { useAuth } from '../../../shared/contexts/AuthContext';

interface PedidoDetalle { productoNombre: string; cantidad: number; precioUnitario: number; subtotal: number; talla?: string; color?: string; }
interface Pedido {
  pedidoID: number; nombreCliente: string; emailCliente: string;
  telefonoCliente: string; documentoCliente: string; ciudad: string;
  metodoPago: string; total: number; estado: string; fechaPedido: string;
  notas?: string; detalles: PedidoDetalle[];
}

const fmt = (n: number) => `$${new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)} COP`;
const estadoColor = (e: string) => {
  if (e === 'Completado' || e === 'Completada') return 'bg-green-100 text-green-700';
  if (e === 'Enviado') return 'bg-blue-100 text-blue-700';
  if (e === 'Rechazado' || e === 'Rechazada') return 'bg-orange-100 text-orange-700';
  return 'bg-red-100 text-red-700';
};
const estadoBadgeClass = (e: string) => {
  if (e === 'Completado' || e === 'Completada') return 'bg-green-50 text-green-600 border-green-200';
  if (e === 'Enviado') return 'bg-[#FBF8F5] text-[#A3395C] border-pink-200';
  if (e === 'Aprobado' || e === 'Aprobada') return 'bg-blue-50 text-blue-600 border-blue-200';
  if (e === 'Rechazado' || e === 'Rechazada') return 'bg-orange-50 text-orange-600 border-orange-200';
  return 'bg-red-50 text-red-600 border-red-200';
};

interface HistorialVentasViewProps { onBack?: () => void; }

export const HistorialVentasView: React.FC<HistorialVentasViewProps> = ({ onBack }) => {
  const { hasPermission } = useAuth();
  const puedeAdmin = hasPermission('ventas:eliminar');

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await getJson('/api/pedidos');
      const all = (res?.data || res || []).map((p: any): Pedido => ({
        pedidoID: p.pedidoID, nombreCliente: p.nombreCliente ?? '',
        emailCliente: p.emailCliente ?? '', telefonoCliente: p.telefonoCliente ?? '',
        documentoCliente: p.documentoCliente ?? '', ciudad: p.ciudad ?? '',
        metodoPago: p.metodoPago ?? '',
        total: p.total ?? 0, estado: p.estado ?? '', fechaPedido: p.fechaPedido ?? '',
        notas: p.notas ?? '',
        detalles: (p.detalles ?? []).map((d: any) => ({
          productoNombre: d.productoNombre ?? '', cantidad: d.cantidad ?? 0,
          precioUnitario: d.precioUnitario ?? 0, subtotal: d.subtotal ?? 0,
          talla: d.talla ?? '', color: d.color ?? '',
        })),
      }));
      setPedidos(all.filter((p: Pedido) => ['Completado', 'Completada', 'Enviado', 'Cancelado', 'Cancelada', 'Rechazado', 'Rechazada'].includes(p.estado)));
    } catch { toast.error('Error cargando historial'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = pedidos.filter(p => {
    const q = searchQuery.toLowerCase();
    return p.nombreCliente.toLowerCase().includes(q) || p.emailCliente.toLowerCase().includes(q);
  });

  const marcarCompletado = async () => {
    if (!selectedPedido) return;
    setSaving(true);
    try {
      await api.fetchWithAuth(`/api/pedidos/${selectedPedido.pedidoID}/estado`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ NuevoEstado: 'Completado' }),
      });
      toast.success('Pedido marcado como completado');
      setViewOpen(false);
      loadData();
    } catch { toast.error('Error actualizando estado'); }
    finally { setSaving(false); }
  };

  const eliminar = async () => {
    if (!selectedPedido) return;
    setSaving(true);
    try {
      await api.fetchWithAuth(`/api/pedidos/${selectedPedido.pedidoID}`, { method: 'DELETE' });
      toast.success('Pedido eliminado');
      setDeleteOpen(false); loadData();
    } catch { toast.error('Error eliminando pedido'); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-8 h-8 animate-spin text-[#A3395C]" />
    </div>
  );

  return (
    <div className="p-8 bg-[#FBF8F5] min-h-screen">
      <div className="flex items-center gap-2 mb-4">
        <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-500">Dashboard</span>
        <ChevronRight className="w-4 h-4 text-gray-400" />
        <button type="button" onClick={onBack} className="text-sm text-gray-500 hover:text-gray-700">Gestión de Ventas</button>
        <ChevronRight className="w-4 h-4 text-gray-400" />
        <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-medium text-[#241B22]">Historial</span>
      </div>
      <div className="flex items-center gap-4 mb-6">
        <button type="button" title="Volver" onClick={onBack} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="admin-page-title text-4xl text-[#241B22]">Historial de Ventas</h1>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-[#E7E0DA] flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Buscar por cliente o email..." value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
            className="w-full pl-12 pr-4 py-3 bg-[#FBF8F5] border border-[#E7E0DA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A3395C]" />
        </div>
        <button type="button" title="Actualizar" onClick={() => { setLoading(true); loadData(); }} className="px-4 py-3 bg-white border border-[#E7E0DA] text-gray-700 rounded-lg hover:bg-[#FBF8F5] transition">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-[#E7E0DA] overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#FBF8F5] border-b border-[#E7E0DA]">
            <tr>
              {['#', 'CLIENTE', 'FECHA', 'TOTAL', 'ESTADO', 'ACCIONES'].map(h => (
                <th key={h} className="px-6 py-4 text-left">
                  <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs font-semibold uppercase tracking-wider text-gray-500">{h}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((p, idx) => (
              <tr key={p.pedidoID} className="hover:bg-[#FBF8F5] transition">
                <td className="px-6 py-4"><span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="font-medium text-[#241B22]">#{idx + 1}</span></td>
                <td className="px-6 py-4">
                  <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="font-medium text-[#241B22]">{p.nombreCliente}</p>
                  <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-500">{p.emailCliente}</p>
                </td>
                <td className="px-6 py-4"><span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-600">{new Date(p.fechaPedido).toLocaleDateString('es-CO')}</span></td>
                <td className="px-6 py-4"><span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="font-semibold">{fmt(p.total)}</span></td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${estadoColor(p.estado)}`} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>{p.estado}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => { setSelectedPedido(p); setViewOpen(true); }}
                      className="p-2 text-gray-500 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition" title="Ver detalles">
                      <Eye className="w-5 h-5" />
                    </button>
                    {puedeAdmin && (
                      <button type="button" onClick={() => { setSelectedPedido(p); setDeleteOpen(true); }}
                        className="p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition" title="Eliminar">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>No hay registros en el historial</td></tr>
            )}
          </tbody>
        </table>
        <div className="px-6 py-4 border-t border-[#E7E0DA]">
          <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-500">
            <span className="font-medium text-[#241B22]">{filtered.length}</span> registros en historial
          </span>
        </div>
      </div>

      {/* Modal Ver */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="w-[440px] flex flex-col p-0 gap-0 max-h-[85vh]">
          <DialogTitle className="sr-only">Detalle de pedido</DialogTitle>
          <DialogDescription className="sr-only">Información del pedido del historial</DialogDescription>

          {/* Header */}
          <div className="px-6 pt-6 pb-4 flex-shrink-0 pr-14" style={{ background: 'linear-gradient(90deg, #241B22 0%, #7a3350 55%, #A3395C 100%)' }}>
            <p className="text-[10px] font-bold uppercase tracking-[3px] text-[#EFD9DF] mb-1">Selenne Boutique</p>
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-xl font-bold text-white">Detalle de venta</h2>
              <span className={`mt-1 px-3 py-1 text-xs font-semibold border rounded-full flex items-center gap-1.5 flex-shrink-0 ${estadoBadgeClass(selectedPedido?.estado ?? '')}`}>
                <Check className="w-3 h-3" />{selectedPedido?.estado}
              </span>
            </div>
            <p className="text-xs text-[#EFD9DF] mt-2">
              {selectedPedido?.fechaPedido ? new Date(selectedPedido.fechaPedido).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : ''}
            </p>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 bg-[#FBF8F5]">
            {selectedPedido && (
              <>
                {/* Cliente + Pago */}
                <div className="bg-white rounded-xl p-4 border border-[#E7E0DA]">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" /> Información del cliente
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Nombre</p>
                      <p className="text-sm font-semibold text-[#241B22]">{selectedPedido.nombreCliente}</p>
                    </div>
                    {selectedPedido.telefonoCliente && (
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Teléfono</p>
                        <p className="text-sm font-semibold text-[#241B22]">{selectedPedido.telefonoCliente}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Método de pago</p>
                      <p className="text-sm font-semibold text-[#241B22] capitalize">{selectedPedido.metodoPago}</p>
                    </div>
                    {selectedPedido.documentoCliente && (
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Documento</p>
                        <p className="text-sm font-semibold text-[#241B22]">{selectedPedido.documentoCliente}</p>
                      </div>
                    )}
                    <div className="col-span-2">
                      <p className="text-xs text-gray-400 mb-1">Email</p>
                      <p className="text-sm font-semibold text-[#241B22] break-all">{selectedPedido.emailCliente}</p>
                    </div>
                    {selectedPedido.ciudad && (
                      <div className="col-span-2">
                        <p className="text-xs text-gray-400 mb-1">Ciudad</p>
                        <p className="text-sm font-semibold text-[#241B22]">{selectedPedido.ciudad}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Productos */}
                {selectedPedido.detalles.length > 0 && (
                  <div className="bg-white rounded-xl p-4 border border-[#E7E0DA]">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                      <ShoppingBag className="w-3.5 h-3.5" /> Productos
                    </p>
                    <div className="space-y-2">
                      {selectedPedido.detalles.map((d, i) => (
                        <div key={i} className="flex items-center gap-3 bg-white rounded-lg p-2.5 border border-[#E7E0DA]">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                            style={{ background: '#A3395C' }}>
                            {d.cantidad}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#241B22] truncate">{d.productoNombre}</p>
                            <div className="flex gap-1.5 mt-0.5 flex-wrap">
                              {d.talla && <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">T: {d.talla}</span>}
                              {d.color && <span className="text-[10px] bg-[#FBF8F5] px-1.5 py-0.5 rounded" style={{ color: '#A3395C' }}>{d.color}</span>}
                            </div>
                          </div>
                          <p className="text-sm font-bold text-[#241B22] flex-shrink-0">{fmt(d.subtotal)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Total */}
                <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: 'linear-gradient(135deg, #e7c2ce 0%, #EFD9DF 100%)' }}>
                  <p className="text-sm font-semibold text-gray-600">Total</p>
                  <p className="text-xl font-bold" style={{ color: '#8a2e4d' }}>{fmt(selectedPedido.total)}</p>
                </div>

                {/* Nota */}
                {selectedPedido.notas && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                    <p className="text-xs font-semibold text-amber-600 mb-1">Nota</p>
                    <p className="text-sm text-amber-800">{selectedPedido.notas}</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-[#FBF8F5] border-t border-[#E7E0DA] flex items-center justify-center gap-2 flex-shrink-0">
            {selectedPedido?.estado === 'Enviado' && (
              <button type="button" onClick={marcarCompletado} disabled={saving}
                className="flex items-center gap-2 px-5 py-2 text-white text-sm font-semibold rounded-full disabled:opacity-50 transition-all hover:opacity-90 shadow-md"
                style={{ background: 'linear-gradient(135deg, #2d6a4f 0%, #1b4332 100%)' }}>
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Marcar completado
              </button>
            )}
            <button type="button" onClick={() => setViewOpen(false)}
              className="px-6 py-2 rounded-full border border-[#E7E0DA] bg-white text-gray-500 text-sm font-medium hover:bg-[#FBF8F5] transition-all shadow-sm">
              Cerrar
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Eliminar */}
      <AlertDialog open={deleteOpen} onOpenChange={v => { if (!saving) setDeleteOpen(v); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar registro?</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a eliminar el registro de <strong>{selectedPedido?.nombreCliente}</strong>. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={eliminar} disabled={saving}
              className="bg-red-600 hover:bg-red-700 flex items-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};