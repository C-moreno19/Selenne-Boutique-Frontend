import React, { useState, useEffect, useCallback } from 'react';
import { Search, Eye, ArrowLeft, ChevronRight, Loader2, RefreshCw, Trash2, User, CreditCard, ShoppingBag, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from '../../../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../../components/ui/alert-dialog';
import { toast } from '@/lib/toast';
import { getJson } from '../../../services/api';
import api from '../../../services/api';
import { useAuth } from '../../../shared/contexts/AuthContext';

interface PedidoDetalle { productoNombre: string; cantidad: number; precioUnitario: number; subtotal: number; talla?: string; color?: string; }
interface Pedido {
  pedidoID: number; nombreCliente: string; emailCliente: string;
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
  if (e === 'Enviado') return 'bg-pink-50 text-[#d65391] border-pink-200';
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
        emailCliente: p.emailCliente ?? '', metodoPago: p.metodoPago ?? '',
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
      <Loader2 className="w-8 h-8 animate-spin text-[#d65391]" />
    </div>
  );

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex items-center gap-2 mb-4">
        <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-500">Dashboard</span>
        <ChevronRight className="w-4 h-4 text-gray-400" />
        <button type="button" onClick={onBack} className="text-sm text-gray-500 hover:text-gray-700">Gestión de Ventas</button>
        <ChevronRight className="w-4 h-4 text-gray-400" />
        <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-medium text-gray-900">Historial</span>
      </div>
      <div className="flex items-center gap-4 mb-6">
        <button type="button" title="Volver" onClick={onBack} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 style={{ fontFamily: '"Times New Roman", Times, serif' }} className="text-4xl text-gray-900">Historial de Ventas</h1>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Buscar por cliente o email..." value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d65391]" />
        </div>
        <button type="button" title="Actualizar" onClick={() => { setLoading(true); loadData(); }} className="px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
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
              <tr key={p.pedidoID} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4"><span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="font-medium text-gray-900">#{idx + 1}</span></td>
                <td className="px-6 py-4">
                  <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="font-medium text-gray-900">{p.nombreCliente}</p>
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
                      className="p-2 text-gray-500 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors" title="Ver detalles">
                      <Eye className="w-5 h-5" />
                    </button>
                    {puedeAdmin && (
                      <button type="button" onClick={() => { setSelectedPedido(p); setDeleteOpen(true); }}
                        className="p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors" title="Eliminar">
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
        <div className="px-6 py-4 border-t border-gray-100">
          <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-500">
            <span className="font-medium text-gray-800">{filtered.length}</span> registros en historial
          </span>
        </div>
      </div>

      {/* Modal Ver */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="w-[420px] flex flex-col p-0 gap-0 overflow-hidden max-h-[88vh]">
          <DialogTitle className="sr-only">Detalle de pedido</DialogTitle>
          <DialogDescription className="sr-only">Información del pedido del historial</DialogDescription>

          {/* Header */}
          <div className="bg-pink-50 px-4 py-3 pr-12 flex items-center gap-2.5 border-b border-pink-100 flex-shrink-0">
            <div className="w-7 h-7 bg-[#d65391] rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">S</div>
            <span className="text-xs font-bold tracking-[3px] text-[#d65391] uppercase">Selenne Boutique</span>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto bg-gray-50 px-4 py-4 space-y-3">
            {/* Avatar + título + badge */}
            <div className="flex items-start gap-4 pb-3 border-b border-pink-100">
              <div className="w-11 h-11 bg-[#d65391] rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                {selectedPedido?.nombreCliente?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-bold text-gray-900 leading-tight">Detalle de pedido</p>
                <p className="text-[#d65391] font-semibold text-sm">{selectedPedido?.nombreCliente}</p>
                <p className="text-gray-400 text-xs">{selectedPedido?.emailCliente}</p>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${estadoBadgeClass(selectedPedido?.estado ?? '')}`}>
                  <Check className="w-3 h-3" />
                  {selectedPedido?.estado}
                </span>
                <span className="text-xs text-gray-400">
                  {selectedPedido?.fechaPedido ? new Date(selectedPedido.fechaPedido).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                </span>
              </div>
            </div>

            {selectedPedido && (
              <>
                {/* Cliente + Pago */}
                <div className="border border-pink-100 rounded-xl overflow-hidden bg-white shadow-sm">
                  <div className="grid grid-cols-2 divide-x divide-pink-100">
                    <div className="p-3 flex items-start gap-3">
                      <div className="w-8 h-8 bg-pink-50 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-[#d65391]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-400 mb-1">Cliente</p>
                        <p className="text-sm font-bold text-gray-900 truncate">{selectedPedido.nombreCliente}</p>
                        <p className="text-xs text-gray-500 mt-0.5 break-all">{selectedPedido.emailCliente}</p>
                      </div>
                    </div>
                    <div className="p-3 flex items-start gap-3">
                      <div className="w-8 h-8 bg-pink-50 rounded-full flex items-center justify-center flex-shrink-0">
                        <CreditCard className="w-4 h-4 text-[#d65391]" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Método de pago</p>
                        <p className="text-sm font-bold text-gray-900 capitalize">{selectedPedido.metodoPago}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Productos */}
                {selectedPedido.detalles.length > 0 && (
                  <div className="border border-pink-100 rounded-xl p-3 bg-white shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-pink-50 rounded-full flex items-center justify-center flex-shrink-0">
                        <ShoppingBag className="w-4 h-4 text-[#d65391]" />
                      </div>
                      <p className="text-sm font-semibold text-gray-700">Productos</p>
                    </div>
                    <div className="space-y-2">
                      {selectedPedido.detalles.map((d, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <span className="w-5 h-5 bg-pink-50 border border-pink-100 rounded-full flex items-center justify-center text-xs font-bold text-[#d65391] flex-shrink-0">
                            {d.cantidad}
                          </span>
                          <span className="flex-1 text-sm text-gray-800 truncate">{d.productoNombre}</span>
                          <span className="text-sm font-bold text-gray-900 flex-shrink-0">{fmt(d.subtotal)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Total */}
                <div className="bg-white border border-pink-200 rounded-xl px-4 py-3 flex items-center justify-between shadow-sm">
                  <span className="text-base font-semibold text-[#d65391]">Total</span>
                  <span className="text-xl font-bold text-[#d65391]">{fmt(selectedPedido.total)}</span>
                </div>

                {/* Nota */}
                {selectedPedido.notas && (
                  <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3">
                    <p className="text-[10px] font-bold text-amber-600 uppercase mb-1">Nota</p>
                    <p className="text-sm text-amber-800">{selectedPedido.notas}</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 bg-white border-t border-pink-50 flex items-center justify-end gap-3 flex-shrink-0">
            {selectedPedido?.estado === 'Enviado' && (
              <button type="button" onClick={marcarCompletado} disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-full hover:bg-green-700 disabled:opacity-50 transition-colors">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Marcar completado
              </button>
            )}
            <button type="button" onClick={() => setViewOpen(false)}
              className="px-6 py-2 bg-[#d65391] text-white text-sm font-semibold rounded-full hover:bg-[#c0426f] transition-colors">
              Cerrar
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Eliminar */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar registro?</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a eliminar el registro de <strong>{selectedPedido?.nombreCliente}</strong>. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
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