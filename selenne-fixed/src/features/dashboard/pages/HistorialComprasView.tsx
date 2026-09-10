import React, { useState, useEffect, useCallback } from 'react';
import { Search, Eye, Trash2, ChevronRight, Loader2, RefreshCw, ArrowLeft, Package } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../../components/ui/alert-dialog';
import { toast } from '@/lib/toast';
import { getJson } from '../../../services/api';
import api from '../../../services/api';
import { useAuth } from '../../../shared/contexts/AuthContext';

interface DetalleCompra { productoID: number; nombreProducto: string; cantidad: number; precioUnitario: number; total: number; }
interface Compra {
  compraID: number; proveedorID: number; proveedorNombre?: string;
  ordenFactura: string; fecha: string; total: number; estado: string; notas?: string;
  detalles?: DetalleCompra[];
}

const fmt = (n: number) => `$${new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)} COP`;
const estadoColor = (e: string) => e === 'Completado' ? 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400';

interface HistorialComprasViewProps { onBack?: () => void; }

export const HistorialComprasView: React.FC<HistorialComprasViewProps> = ({ onBack }) => {
  const { hasPermission } = useAuth();
  const puedeAdmin = hasPermission('compras:eliminar');
  const [compras, setCompras] = useState<Compra[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedCompra, setSelectedCompra] = useState<Compra | null>(null);

  const loadData = useCallback(async () => {
    try {
      const res = await getJson('/api/compras');
      const all = (res?.data || res || []).map((c: any): Compra => ({
        compraID: c.compraID ?? c.CompraID,
        proveedorID: c.proveedorID ?? c.ProveedorID,
        proveedorNombre: c.proveedor?.nombre ?? c.Proveedor?.Nombre ?? '',
        ordenFactura: c.ordenFactura ?? c.OrdenFactura ?? '',
        fecha: c.fecha ?? c.Fecha ?? '',
        total: c.total ?? c.Total ?? 0,
        estado: c.estado ?? c.Estado ?? '',
        notas: c.notas ?? c.Notas ?? '',
        detalles: (c.detalles ?? c.Detalles ?? []).map((d: any) => ({
          productoID: d.productoID ?? d.ProductoID,
          nombreProducto: d.producto?.nombre ?? d.Producto?.Nombre ?? d.nombreProducto ?? '',
          cantidad: d.cantidad ?? d.Cantidad ?? 0,
          precioUnitario: d.precioUnitario ?? d.PrecioUnitario ?? 0,
          total: d.total ?? d.Total ?? 0,
        })),
      }));
      setCompras(all.filter((c: Compra) => c.estado === 'Completado' || c.estado === 'Cancelado'));
    } catch { toast.error('Error cargando historial'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const eliminarCompra = async () => {
    if (!selectedCompra) return;
    setSaving(true);
    try {
      await api.fetchWithAuth(`/api/compras/${selectedCompra.compraID}`, { method: 'DELETE' });
      toast.success('Compra eliminada');
      setDeleteOpen(false);
      loadData();
    } catch { toast.error('Error eliminando compra'); }
    finally { setSaving(false); }
  };

  const filtered = compras.filter(c => {
    const q = searchQuery.toLowerCase();
    return c.ordenFactura.toLowerCase().includes(q) || (c.proveedorNombre || '').toLowerCase().includes(q);
  });

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-8 h-8 animate-spin text-[#A3395C]" />
    </div>
  );

  return (
    <div className="p-8 bg-[#FBF8F5] dark:bg-[#2a2029] min-h-screen">
      <div className="flex items-center gap-2 mb-4">
        <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-500 dark:text-[#b8a3ac]">Dashboard</span>
        <ChevronRight className="w-4 h-4 text-gray-400 dark:text-[#b8a3ac]" />
        <button onClick={onBack} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-500 dark:text-[#b8a3ac] hover:text-gray-700 dark:hover:text-[#F5EDE9]">Gestión de Compras</button>
        <ChevronRight className="w-4 h-4 text-gray-400 dark:text-[#b8a3ac]" />
        <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-medium text-[#241B22] dark:text-[#F5EDE9]">Historial</span>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2 text-gray-500 dark:text-[#b8a3ac] hover:bg-gray-100 dark:hover:bg-[#362b34] rounded-lg transition">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="admin-page-title text-4xl text-[#241B22] dark:text-[#F5EDE9]">Historial de Compras</h1>
      </div>

      <div className="bg-white dark:bg-[#322631] rounded-xl p-6 shadow-sm border border-[#E7E0DA] dark:border-[#453840] flex flex-col lg:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-[#b8a3ac]" />
          <input type="text" placeholder="Buscar por orden o proveedor..." value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
            className="w-full pl-12 pr-4 py-3 bg-[#FBF8F5] dark:bg-[#2a2029] border border-[#E7E0DA] dark:border-[#453840] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A3395C]" />
        </div>
        <button onClick={() => { setLoading(true); loadData(); }} className="px-4 py-3 bg-white dark:bg-[#322631] border border-[#E7E0DA] dark:border-[#453840] text-gray-700 dark:text-[#F5EDE9] rounded-lg hover:bg-[#FBF8F5] dark:hover:bg-[#362b34] transition">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="bg-white dark:bg-[#322631] rounded-xl shadow-sm border border-[#E7E0DA] dark:border-[#453840] overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#FBF8F5] dark:bg-[#2a2029] border-b border-[#E7E0DA] dark:border-[#453840]">
            <tr>
              {['ORDEN FACTURA', 'PROVEEDOR', 'FECHA', 'TOTAL', 'ESTADO', 'ACCIONES'].map(h => (
                <th key={h} className="px-6 py-4 text-left">
                  <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-[#b8a3ac]">{h}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-[#453840]">
            {filtered.map(compra => (
              <tr key={compra.compraID} className="hover:bg-[#FBF8F5] dark:hover:bg-[#362b34] transition">
                <td className="px-6 py-4"><span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="font-medium text-[#241B22] dark:text-[#F5EDE9]">{compra.ordenFactura}</span></td>
                <td className="px-6 py-4"><span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-gray-700 dark:text-[#F5EDE9]">{compra.proveedorNombre || '—'}</span></td>
                <td className="px-6 py-4"><span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-600 dark:text-[#b8a3ac]">{new Date(compra.fecha).toLocaleDateString('es-CO')}</span></td>
                <td className="px-6 py-4"><span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="font-semibold text-[#241B22] dark:text-[#F5EDE9]">{fmt(compra.total)}</span></td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${estadoColor(compra.estado)}`} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
                    {compra.estado}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setSelectedCompra(compra); setViewOpen(true); }}
                      className="p-2 text-gray-500 dark:text-[#b8a3ac] hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition" title="Ver detalles">
                      <Eye className="w-5 h-5" />
                    </button>
                    {puedeAdmin && (
                      <button onClick={() => { setSelectedCompra(compra); setDeleteOpen(true); }}
                        className="p-2 text-gray-500 dark:text-[#b8a3ac] hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition" title="Eliminar">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400 dark:text-[#b8a3ac]" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>No hay compras en el historial</td></tr>
            )}
          </tbody>
        </table>
        <div className="px-6 py-4 border-t border-[#E7E0DA] dark:border-[#453840]">
          <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-500 dark:text-[#b8a3ac]">
            Mostrando <span className="font-medium text-[#241B22] dark:text-[#F5EDE9]">{filtered.length}</span> compras en historial
          </span>
        </div>
      </div>

      {/* Modal Ver Detalles */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
          <div className="px-8 pt-6 pb-5 flex-shrink-0" style={{ background: 'linear-gradient(90deg, #241B22 0%, #7a3350 55%, #A3395C 100%)' }}>
            <p className="text-[10px] font-bold uppercase tracking-[3px] text-[#EFD9DF] mb-1">Selenne Boutique</p>
            <DialogTitle style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xl font-bold text-white flex items-center gap-2">
              <Package className="w-5 h-5 opacity-80" /> Detalles de Compra
            </DialogTitle>
          </div>
          {selectedCompra && (
            <div className="space-y-4 py-5 px-8 bg-[#FBF8F5] dark:bg-[#2a2029]">
              <div className="grid grid-cols-2 gap-4">
                <div><p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-500 dark:text-[#b8a3ac]">Orden / Factura</p><p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="font-semibold">{selectedCompra.ordenFactura}</p></div>
                <div><p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-500 dark:text-[#b8a3ac]">Proveedor</p><p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="font-semibold">{selectedCompra.proveedorNombre}</p></div>
                <div><p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-500 dark:text-[#b8a3ac]">Fecha</p><p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>{new Date(selectedCompra.fecha).toLocaleDateString('es-CO')}</p></div>
                <div><p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-500 dark:text-[#b8a3ac]">Estado</p>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${estadoColor(selectedCompra.estado)}`}>{selectedCompra.estado}</span>
                </div>
                <div className="col-span-2"><p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-500 dark:text-[#b8a3ac]">Total</p><p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xl font-bold text-[#A3395C]">{fmt(selectedCompra.total)}</p></div>
                {selectedCompra.notas && <div className="col-span-2"><p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-500 dark:text-[#b8a3ac]">Notas</p><p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm">{selectedCompra.notas}</p></div>}
              </div>
              {selectedCompra.detalles && selectedCompra.detalles.length > 0 && (
                <div>
                  <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs font-semibold text-gray-500 dark:text-[#b8a3ac] uppercase mb-2">Productos</p>
                  <div className="space-y-2">
                    {selectedCompra.detalles.map((d, i) => (
                      <div key={i} className="flex justify-between items-center p-3 bg-[#FBF8F5] dark:bg-[#2a2029] rounded-lg">
                        <div><p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-medium">{d.nombreProducto}</p><p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-500 dark:text-[#b8a3ac]">{d.cantidad} x {fmt(d.precioUnitario)}</p></div>
                        <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="font-semibold text-sm">{fmt(d.total)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="px-8 py-4 border-t border-[#E7E0DA] dark:border-[#453840] bg-white dark:bg-[#322631] flex-shrink-0">
            <button onClick={() => setViewOpen(false)} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="px-6 py-2 bg-gray-100 dark:bg-[#362b34] text-gray-700 dark:text-[#F5EDE9] rounded-lg hover:bg-gray-200 dark:hover:bg-[#3a2530] transition">Cerrar</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Modal Eliminar */}
      <AlertDialog open={deleteOpen} onOpenChange={v => { if (!saving) setDeleteOpen(v); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>¿Eliminar compra?</AlertDialogTitle>
            <AlertDialogDescription style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
              Vas a eliminar la compra <strong>{selectedCompra?.ordenFactura}</strong>. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={eliminarCompra} disabled={saving}
              className="bg-red-600 hover:bg-red-700 flex items-center gap-2" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};