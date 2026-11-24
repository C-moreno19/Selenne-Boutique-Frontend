import React, { useState, useEffect, useCallback } from 'react';
import { Search, Eye, ArrowLeft, ChevronRight, Loader2, RefreshCw, Trash2, User, CreditCard, ShoppingBag, Check, X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from '../../../components/ui/dialog';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
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
  if (e === 'Completado' || e === 'Completada') return 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400';
  if (e === 'Enviado') return 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400';
  if (e === 'Rechazado' || e === 'Rechazada') return 'bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400';
  if (e === 'Devuelto') return 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400';
  return 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400';
};
const estadoBadgeClass = (e: string) => {
  if (e === 'Completado' || e === 'Completada') return 'bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400 border-green-200 dark:border-green-900/50';
  if (e === 'Enviado') return 'bg-[#F7F5FC] dark:bg-[#17101f] text-[#5C2A52] border-pink-200 dark:border-[#241935]';
  if (e === 'Aprobado' || e === 'Aprobada') return 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/50';
  if (e === 'Rechazado' || e === 'Rechazada') return 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-900/50';
  if (e === 'Devuelto') return 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900/50';
  return 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50';
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
  const [devolucionOpen, setDevolucionOpen] = useState(false);
  const [motivoDevolucion, setMotivoDevolucion] = useState('');

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
      setPedidos(all.filter((p: Pedido) => ['Completado', 'Completada', 'Enviado', 'Cancelado', 'Cancelada', 'Rechazado', 'Rechazada', 'Devuelto'].includes(p.estado)));
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

  const marcarDevuelto = async () => {
    if (!selectedPedido) return;
    setSaving(true);
    try {
      await api.fetchWithAuth(`/api/pedidos/${selectedPedido.pedidoID}/estado`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ NuevoEstado: 'Devuelto', Notas: motivoDevolucion || null }),
      });
      toast.success('Pedido marcado como devuelto');
      setDevolucionOpen(false); setViewOpen(false); setMotivoDevolucion('');
      loadData();
    } catch (e: any) { toast.error(e?.data?.message || 'Error registrando la devolución'); }
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
      <Loader2 className="w-8 h-8 animate-spin text-[#5C2A52]" />
    </div>
  );

  return (
    <div className="p-8 bg-[#F7F5FC] dark:bg-[#17101f] min-h-screen">
      <div className="flex items-center gap-2 mb-4">
        <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-500 dark:text-[#b9aedd]">Dashboard</span>
        <ChevronRight className="w-4 h-4 text-gray-400 dark:text-[#b9aedd]" />
        <button type="button" onClick={onBack} className="text-sm text-gray-500 dark:text-[#b9aedd] hover:text-gray-700 dark:hover:text-[#F5F3FA]">Gestión de Ventas</button>
        <ChevronRight className="w-4 h-4 text-gray-400 dark:text-[#b9aedd]" />
        <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-medium text-[#0A0A0A] dark:text-[#F5F3FA]">Historial</span>
      </div>
      <div className="flex items-center gap-4 mb-6">
        <button type="button" title="Volver" onClick={onBack} className="p-2 text-gray-500 dark:text-[#b9aedd] hover:bg-gray-100 dark:hover:bg-[#221830] rounded-none transition">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="admin-page-title text-4xl text-[#0A0A0A] dark:text-[#F5F3FA]">Historial de Ventas</h1>
      </div>

      <div className="bg-white dark:bg-[#1e1530] rounded-none p-6 shadow-sm border border-[#E7E0DA] dark:border-[#3A2E4D] flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-[#b9aedd]" />
          <input type="text" placeholder="Buscar por cliente o email..." value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
            className="w-full pl-12 pr-4 py-3 bg-[#F7F5FC] dark:bg-[#17101f] border border-[#E7E0DA] dark:border-[#3A2E4D] rounded-none focus:outline-none focus:ring-2 focus:ring-[#5C2A52]" />
        </div>
        <button type="button" title="Actualizar" onClick={() => { setLoading(true); loadData(); }} className="px-4 py-3 bg-white dark:bg-[#1e1530] border border-[#E7E0DA] dark:border-[#3A2E4D] text-gray-700 dark:text-[#F5F3FA] rounded-none hover:bg-[#F7F5FC] dark:hover:bg-[#221830] transition">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="bg-white dark:bg-[#1e1530] rounded-none shadow-sm border border-[#E7E0DA] dark:border-[#3A2E4D] overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#F7F5FC] dark:bg-[#17101f] border-b border-[#E7E0DA] dark:border-[#3A2E4D]">
            <tr>
              {['#', 'CLIENTE', 'FECHA', 'TOTAL', 'ESTADO', 'ACCIONES'].map(h => (
                <th key={h} className="px-6 py-4 text-left">
                  <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-[#b9aedd]">{h}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-[#3A2E4D]">
            {filtered.map((p, idx) => (
              <tr key={p.pedidoID} className="hover:bg-[#F7F5FC] dark:hover:bg-[#221830] transition">
                <td className="px-6 py-4"><span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="font-medium text-[#0A0A0A] dark:text-[#F5F3FA]">#{idx + 1}</span></td>
                <td className="px-6 py-4">
                  <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="font-medium text-[#0A0A0A] dark:text-[#F5F3FA]">{p.nombreCliente}</p>
                  <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-500 dark:text-[#b9aedd]">{p.emailCliente}</p>
                </td>
                <td className="px-6 py-4"><span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-600 dark:text-[#b9aedd]">{new Date(p.fechaPedido).toLocaleDateString('es-CO')}</span></td>
                <td className="px-6 py-4"><span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="font-semibold">{fmt(p.total)}</span></td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${estadoColor(p.estado)}`} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>{p.estado}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => { setSelectedPedido(p); setViewOpen(true); }}
                      className="p-2 text-gray-500 dark:text-[#b9aedd] hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400 rounded-none transition" title="Ver detalles">
                      <Eye className="w-5 h-5" />
                    </button>
                    {puedeAdmin && (
                      <button type="button" onClick={() => { setSelectedPedido(p); setDeleteOpen(true); }}
                        className="p-2 text-gray-500 dark:text-[#b9aedd] hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-400 rounded-none transition" title="Eliminar">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400 dark:text-[#b9aedd]" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>No hay registros en el historial</td></tr>
            )}
          </tbody>
        </table>
        <div className="px-6 py-4 border-t border-[#E7E0DA] dark:border-[#3A2E4D]">
          <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-500 dark:text-[#b9aedd]">
            <span className="font-medium text-[#0A0A0A] dark:text-[#F5F3FA]">{filtered.length}</span> registros en historial
          </span>
        </div>
      </div>

      {/* Modal Ver */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="w-[440px] flex flex-col p-0 gap-0 max-h-[85vh]">
          <DialogTitle className="sr-only">Detalle de pedido</DialogTitle>
          <DialogDescription className="sr-only">Información del pedido del historial</DialogDescription>

          {/* Header */}
          <div className="px-6 pt-6 pb-4 flex-shrink-0 pr-14" style={{ background: 'linear-gradient(90deg, #0A0A0A 0%, #3B0A45 55%, #5C2A52 100%)' }}>
            <p className="text-[10px] font-bold uppercase tracking-[3px] text-[#C9A8C3] mb-1">District Store</p>
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-xl font-bold text-white">Detalle de venta</h2>
              <span className={`mt-1 px-3 py-1 text-xs font-semibold border rounded-full flex items-center gap-1.5 flex-shrink-0 ${estadoBadgeClass(selectedPedido?.estado ?? '')}`}>
                <Check className="w-3 h-3" />{selectedPedido?.estado}
              </span>
            </div>
            <p className="text-xs text-[#C9A8C3] mt-2">
              {selectedPedido?.fechaPedido ? new Date(selectedPedido.fechaPedido).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : ''}
            </p>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 bg-[#F7F5FC] dark:bg-[#17101f]">
            {selectedPedido && (
              <>
                {/* Cliente + Pago */}
                <div className="bg-white dark:bg-[#1e1530] rounded-none p-4 border border-[#E7E0DA] dark:border-[#3A2E4D]">
                  <p className="text-[10px] font-semibold text-gray-400 dark:text-[#b9aedd] uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" /> Información del cliente
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-400 dark:text-[#b9aedd] mb-1">Nombre</p>
                      <p className="text-sm font-semibold text-[#0A0A0A] dark:text-[#F5F3FA]">{selectedPedido.nombreCliente}</p>
                    </div>
                    {selectedPedido.telefonoCliente && (
                      <div>
                        <p className="text-xs text-gray-400 dark:text-[#b9aedd] mb-1">Teléfono</p>
                        <p className="text-sm font-semibold text-[#0A0A0A] dark:text-[#F5F3FA]">{selectedPedido.telefonoCliente}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-gray-400 dark:text-[#b9aedd] mb-1">Método de pago</p>
                      <p className="text-sm font-semibold text-[#0A0A0A] dark:text-[#F5F3FA] capitalize">{selectedPedido.metodoPago}</p>
                    </div>
                    {selectedPedido.documentoCliente && (
                      <div>
                        <p className="text-xs text-gray-400 dark:text-[#b9aedd] mb-1">Documento</p>
                        <p className="text-sm font-semibold text-[#0A0A0A] dark:text-[#F5F3FA]">{selectedPedido.documentoCliente}</p>
                      </div>
                    )}
                    <div className="col-span-2">
                      <p className="text-xs text-gray-400 dark:text-[#b9aedd] mb-1">Email</p>
                      <p className="text-sm font-semibold text-[#0A0A0A] dark:text-[#F5F3FA] break-all">{selectedPedido.emailCliente}</p>
                    </div>
                    {selectedPedido.ciudad && (
                      <div className="col-span-2">
                        <p className="text-xs text-gray-400 dark:text-[#b9aedd] mb-1">Ciudad</p>
                        <p className="text-sm font-semibold text-[#0A0A0A] dark:text-[#F5F3FA]">{selectedPedido.ciudad}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Productos */}
                {selectedPedido.detalles.length > 0 && (
                  <div className="bg-white dark:bg-[#1e1530] rounded-none p-4 border border-[#E7E0DA] dark:border-[#3A2E4D]">
                    <p className="text-[10px] font-semibold text-gray-400 dark:text-[#b9aedd] uppercase tracking-widest mb-3 flex items-center gap-1.5">
                      <ShoppingBag className="w-3.5 h-3.5" /> Productos
                    </p>
                    <div className="space-y-2">
                      {selectedPedido.detalles.map((d, i) => (
                        <div key={i} className="flex items-center gap-3 bg-white dark:bg-[#1e1530] rounded-none p-2.5 border border-[#E7E0DA] dark:border-[#3A2E4D]">
                          <div className="w-8 h-8 rounded-none flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                            style={{ background: '#5C2A52' }}>
                            {d.cantidad}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#0A0A0A] dark:text-[#F5F3FA] truncate">{d.productoNombre}</p>
                            <div className="flex gap-1.5 mt-0.5 flex-wrap">
                              {d.talla && <span className="text-[10px] bg-gray-100 dark:bg-[#221830] text-gray-500 dark:text-[#b9aedd] px-1.5 py-0.5 rounded">T: {d.talla}</span>}
                              {d.color && <span className="text-[10px] bg-[#F7F5FC] dark:bg-[#241935] px-1.5 py-0.5 rounded text-[#5C2A52]">{d.color}</span>}
                            </div>
                          </div>
                          <p className="text-sm font-bold text-[#0A0A0A] dark:text-[#F5F3FA] flex-shrink-0">{fmt(d.subtotal)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Total */}
                <div className="flex items-center justify-between rounded-none px-4 py-3 bg-gradient-to-br from-[#e7c2ce] to-[#C9A8C3] dark:from-[#241935] dark:to-[#4a3540]">
                  <p className="text-sm font-semibold text-gray-600 dark:text-[#b9aedd]">Total</p>
                  <p className="text-xl font-bold text-[#3B0A45] dark:text-[#e7a5c0]">{fmt(selectedPedido.total)}</p>
                </div>

                {/* Nota */}
                {selectedPedido.notas && (
                  <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-none px-4 py-3">
                    <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1">Nota</p>
                    <p className="text-sm text-amber-800 dark:text-amber-300">{selectedPedido.notas}</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-[#F7F5FC] dark:bg-[#17101f] border-t border-[#E7E0DA] dark:border-[#3A2E4D] flex items-center justify-center gap-2 flex-shrink-0">
            {selectedPedido?.estado === 'Enviado' && (
              <button type="button" onClick={marcarCompletado} disabled={saving}
                className="flex items-center gap-2 px-5 py-2 text-white text-sm font-semibold rounded-full disabled:opacity-50 transition-all hover:opacity-90 shadow-md"
                style={{ background: 'linear-gradient(135deg, #2d6a4f 0%, #1b4332 100%)' }}>
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Marcar completado
              </button>
            )}
            {(selectedPedido?.estado === 'Completado' || selectedPedido?.estado === 'Completada') && (
              <button type="button" onClick={() => setDevolucionOpen(true)} disabled={saving}
                className="flex items-center gap-2 px-5 py-2 text-white text-sm font-semibold rounded-full disabled:opacity-50 transition-all hover:opacity-90 shadow-md"
                style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)' }}>
                Marcar como devuelto
              </button>
            )}
            <button type="button" onClick={() => setViewOpen(false)}
              className="px-6 py-2 rounded-full border border-[#E7E0DA] dark:border-[#3A2E4D] bg-white dark:bg-[#1e1530] text-gray-500 dark:text-[#b9aedd] text-sm font-medium hover:bg-[#F7F5FC] dark:hover:bg-[#221830] transition-all shadow-sm">
              Cerrar
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Eliminar */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="¿Eliminar registro?"
        description={<>Vas a eliminar el registro de <strong>{selectedPedido?.nombreCliente}</strong>. Esta acción no se puede deshacer.</>}
        onConfirm={eliminar}
        loading={saving}
      />

      {/* Modal Devolución */}
      <Dialog open={devolucionOpen} onOpenChange={v => { if (!saving) { setDevolucionOpen(v); if (!v) setMotivoDevolucion(''); } }}>
        <DialogContent className="max-w-md p-0 overflow-hidden gap-0">
          <div className="px-6 pt-6 pb-4 border-b border-[#E7E0DA] dark:border-[#3A2E4D]">
            <DialogTitle className="text-xl font-semibold text-[#0A0A0A] dark:text-[#F5F3FA]">Marcar como devuelto</DialogTitle>
            <DialogDescription className="text-sm text-gray-500 dark:text-[#b9aedd]">
              Pedido de <strong className="text-gray-700 dark:text-[#F5F3FA]">{selectedPedido?.nombreCliente}</strong>. El stock de los productos se restaurará automáticamente.
            </DialogDescription>
          </div>
          <div className="px-6 py-5 bg-[#F7F5FC] dark:bg-[#17101f]">
            <label className="text-sm font-medium text-gray-700 dark:text-[#F5F3FA] mb-1.5 block">Motivo (opcional)</label>
            <textarea value={motivoDevolucion} onChange={e => setMotivoDevolucion(e.target.value)}
              placeholder="Ej: Talla incorrecta, producto defectuoso..."
              rows={3}
              className="w-full px-3 py-2.5 border border-purple-200 dark:border-purple-900/50 rounded-none text-sm focus:outline-none focus:border-purple-500 resize-none bg-white dark:bg-[#1e1530] transition" />
          </div>
          <div className="px-6 py-4 border-t border-[#E7E0DA] dark:border-[#3A2E4D] bg-[#F7F5FC] dark:bg-[#17101f] flex gap-2">
            <button type="button" onClick={() => setDevolucionOpen(false)}
              className="flex-1 py-2.5 rounded-full border border-[#E7E0DA] dark:border-[#3A2E4D] bg-white dark:bg-[#1e1530] text-gray-500 dark:text-[#b9aedd] hover:bg-[#F7F5FC] dark:hover:bg-[#221830] transition-all text-sm font-medium shadow-sm">
              Cancelar
            </button>
            <button type="button" onClick={marcarDevuelto} disabled={saving}
              className="flex-1 py-2.5 text-white rounded-none disabled:opacity-50 flex items-center justify-center gap-2 transition hover:opacity-90 text-sm font-semibold"
              style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)' }}>
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Confirmar devolución
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};