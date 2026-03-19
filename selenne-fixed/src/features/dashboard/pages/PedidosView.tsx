import React, { useState, useEffect, useCallback } from 'react';
import { Search, Eye, CheckCircle, XCircle, ChevronRight, Loader2, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../../components/ui/alert-dialog';
import { Textarea } from '../../../components/ui/textarea';
import { Label } from '../../../components/ui/label';
import { toast } from 'sonner';
import { getJson } from '../../../services/api';
import api from '../../../services/api';
import { useAuth } from '../../../shared/contexts/AuthContext';

interface PedidoDetalle { productoNombre: string; cantidad: number; precioUnitario: number; subtotal: number; talla?: string; color?: string; }
interface Pedido {
  pedidoID: number; clienteID: number; nombreCliente: string; emailCliente: string;
  telefonoCliente: string; direccionEnvio: string; ciudad: string; metodoPago: string;
  subtotal: number; descuento: number; envio: number; total: number;
  estado: string; fechaPedido: string; notas?: string; comprobantePago?: string;
  detalles: PedidoDetalle[];
}

const fmt = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

export const PedidosView: React.FC = () => {
  const { hasPermission } = useAuth();
  const puedeAdmin = hasPermission('admin:dashboard');

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [aprobarOpen, setAprobarOpen] = useState(false);
  const [rechazarOpen, setRechazarOpen] = useState(false);
  const [razonRechazo, setRazonRechazo] = useState('');

  const loadData = useCallback(async () => {
    try {
      const res = await getJson('/api/pedidos');
      const all = (res?.data || res || []).map((p: any): Pedido => ({
        pedidoID: p.pedidoID,
        clienteID: p.clienteID,
        nombreCliente: p.nombreCliente ?? '',
        emailCliente: p.emailCliente ?? '',
        telefonoCliente: p.telefonoCliente ?? '',
        direccionEnvio: p.direccionEnvio ?? '',
        ciudad: p.ciudad ?? '',
        metodoPago: p.metodoPago ?? '',
        subtotal: p.subtotal ?? 0,
        descuento: p.descuento ?? 0,
        envio: p.envio ?? 0,
        total: p.total ?? 0,
        estado: p.estado ?? 'Pendiente',
        fechaPedido: p.fechaPedido ?? '',
        notas: p.notas ?? '',
        comprobantePago: p.comprobantePago ?? '',
        detalles: (p.detalles ?? []).map((d: any) => ({
          productoNombre: d.productoNombre ?? '',
          cantidad: d.cantidad ?? 0,
          precioUnitario: d.precioUnitario ?? 0,
          subtotal: d.subtotal ?? 0,
          talla: d.talla ?? '',
          color: d.color ?? '',
        })),
      }));
      setPedidos(all.filter((p: Pedido) => p.estado === 'Pendiente'));
    } catch { toast.error('Error cargando pedidos'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = pedidos.filter(p => {
    const q = searchQuery.toLowerCase();
    return p.nombreCliente.toLowerCase().includes(q) || p.emailCliente.toLowerCase().includes(q);
  });

  const cambiarEstado = async (pedido: Pedido, estado: string, notas?: string) => {
    setSaving(true);
    try {
      await api.fetchWithAuth(`/api/pedidos/${pedido.pedidoID}/estado`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ NuevoEstado: estado, Notas: notas }),
      });
      toast.success(`Pedido ${estado.toLowerCase()} correctamente`);
      setAprobarOpen(false); setRechazarOpen(false); setRazonRechazo('');
      loadData();
    } catch { toast.error('Error cambiando estado'); }
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
        <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-500">Dashboard</span>
        <ChevronRight className="w-4 h-4 text-gray-400" />
        <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm font-medium text-gray-900">Pedidos Pendientes</span>
      </div>
      <h1 style={{ fontFamily: 'Playfair Display, serif' }} className="text-4xl text-gray-900 mb-6">Pedidos Pendientes</h1>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Buscar por cliente o email..." value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)} style={{ fontFamily: 'Inter, sans-serif' }}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d65391]" />
        </div>
        <button onClick={() => { setLoading(true); loadData(); }} className="px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['#', 'CLIENTE', 'FECHA', 'TOTAL', 'MÉTODO PAGO', 'COMPROBANTE', 'ACCIONES'].map(h => (
                <th key={h} className="px-6 py-4 text-left">
                  <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs font-semibold uppercase tracking-wider text-gray-500">{h}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(p => (
              <tr key={p.pedidoID} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4"><span style={{ fontFamily: 'Inter, sans-serif' }} className="font-medium text-gray-900">#{p.pedidoID}</span></td>
                <td className="px-6 py-4">
                  <p style={{ fontFamily: 'Inter, sans-serif' }} className="font-medium text-gray-900">{p.nombreCliente}</p>
                  <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-500">{p.emailCliente}</p>
                </td>
                <td className="px-6 py-4"><span style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-600">{new Date(p.fechaPedido).toLocaleDateString('es-CO')}</span></td>
                <td className="px-6 py-4"><span style={{ fontFamily: 'Inter, sans-serif' }} className="font-semibold">{fmt(p.total)}</span></td>
                <td className="px-6 py-4"><span style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-600">{p.metodoPago}</span></td>
                <td className="px-6 py-4">
                  {p.comprobantePago ? (
                    <a href={`http://localhost:5000${p.comprobantePago}`} target="_blank" rel="noreferrer"
                      style={{ fontFamily: 'Inter, sans-serif' }} className="text-[#d65391] text-sm underline hover:text-[#c14a7f]">
                      Ver comprobante
                    </a>
                  ) : <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-400">Sin comprobante</span>}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setSelectedPedido(p); setViewOpen(true); }}
                      className="p-2 text-gray-500 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors" title="Ver detalles">
                      <Eye className="w-5 h-5" />
                    </button>
                    {puedeAdmin && (
                      <>
                        <button onClick={() => { setSelectedPedido(p); setAprobarOpen(true); }}
                          className="p-2 text-gray-500 hover:bg-green-50 hover:text-green-600 rounded-lg transition-colors" title="Aprobar">
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        <button onClick={() => { setSelectedPedido(p); setRechazarOpen(true); }}
                          className="p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors" title="Rechazar">
                          <XCircle className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-400" style={{ fontFamily: 'Inter, sans-serif' }}>No hay pedidos pendientes</td></tr>
            )}
          </tbody>
        </table>
        <div className="px-6 py-4 border-t border-gray-100">
          <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-500">
            <span className="font-medium text-gray-800">{filtered.length}</span> pedidos pendientes
          </span>
        </div>
      </div>

      {/* Modal Ver Detalles */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-200">
            <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }} className="text-2xl">Detalles del Pedido #{selectedPedido?.pedidoID}</DialogTitle>
          </DialogHeader>
          {selectedPedido && (
            <div className="p-6 space-y-5">
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                  <p style={{ fontFamily: 'Inter, sans-serif' }} className="font-semibold text-sm text-gray-700">👤 Cliente</p>
                </div>
                <div className="p-5 grid grid-cols-2 gap-3">
                  {[
                    ['Nombre', selectedPedido.nombreCliente],
                    ['Email', selectedPedido.emailCliente],
                    ['Teléfono', selectedPedido.telefonoCliente],
                    ['Ciudad', selectedPedido.ciudad],
                    ['Dirección', selectedPedido.direccionEnvio],
                    ['Método de pago', selectedPedido.metodoPago],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-500">{label}</p>
                      <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm font-medium text-gray-900">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {selectedPedido.detalles.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                    <p style={{ fontFamily: 'Inter, sans-serif' }} className="font-semibold text-sm text-gray-700">📦 Productos</p>
                  </div>
                  <div className="p-5 space-y-2">
                    {selectedPedido.detalles.map((d, i) => (
                      <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm font-medium">{d.productoNombre}</p>
                          <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-500">
                            {d.cantidad} x {fmt(d.precioUnitario)} {d.talla && `• Talla: ${d.talla}`} {d.color && `• Color: ${d.color}`}
                          </p>
                        </div>
                        <p style={{ fontFamily: 'Inter, sans-serif' }} className="font-semibold text-sm">{fmt(d.subtotal)}</p>
                      </div>
                    ))}
                    <div className="flex justify-between pt-2 border-t border-gray-200">
                      <p style={{ fontFamily: 'Inter, sans-serif' }} className="font-bold text-gray-900">Total</p>
                      <p style={{ fontFamily: 'Inter, sans-serif' }} className="font-bold text-[#d65391] text-lg">{fmt(selectedPedido.total)}</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedPedido.comprobantePago && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                    <p style={{ fontFamily: 'Inter, sans-serif' }} className="font-semibold text-sm text-gray-700">🧾 Comprobante de Pago</p>
                  </div>
                  <div className="p-5">
                    <img src={`http://localhost:5000${selectedPedido.comprobantePago}`} alt="Comprobante"
                      className="max-w-full rounded-lg border border-gray-200" />
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="px-6 pb-6 gap-2">
            {puedeAdmin && (
              <>
                <button onClick={() => { setViewOpen(false); setAprobarOpen(true); }}
                  style={{ fontFamily: 'Inter, sans-serif' }}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  Aprobar
                </button>
                <button onClick={() => { setViewOpen(false); setRechazarOpen(true); }}
                  style={{ fontFamily: 'Inter, sans-serif' }}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                  Rechazar
                </button>
              </>
            )}
            <button onClick={() => setViewOpen(false)} style={{ fontFamily: 'Inter, sans-serif' }}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">Cerrar</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Aprobar */}
      <AlertDialog open={aprobarOpen} onOpenChange={setAprobarOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ fontFamily: 'Playfair Display, serif' }}>¿Aprobar pedido?</AlertDialogTitle>
            <AlertDialogDescription style={{ fontFamily: 'Inter, sans-serif' }}>
              El pedido #{selectedPedido?.pedidoID} de <strong>{selectedPedido?.nombreCliente}</strong> pasará a Gestión de Ventas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel style={{ fontFamily: 'Inter, sans-serif' }}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => selectedPedido && cambiarEstado(selectedPedido, 'Aprobado')}
              disabled={saving} className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
              style={{ fontFamily: 'Inter, sans-serif' }}>
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Aprobar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal Rechazar */}
      <Dialog open={rechazarOpen} onOpenChange={setRechazarOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-200">
            <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }}>Rechazar pedido</DialogTitle>
            <DialogDescription style={{ fontFamily: 'Inter, sans-serif' }}>
              Pedido #{selectedPedido?.pedidoID} de {selectedPedido?.nombreCliente}
            </DialogDescription>
          </DialogHeader>
          <div className="p-6">
            <Label style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm font-medium text-gray-700 mb-2 block">
              Razón del rechazo (opcional)
            </Label>
            <Textarea value={razonRechazo} onChange={e => setRazonRechazo(e.target.value)}
              placeholder="Ej: Comprobante ilegible, pago insuficiente..."
              className="border-gray-300 resize-none" rows={3} />
          </div>
          <DialogFooter className="px-6 pb-6 gap-2">
            <button onClick={() => setRechazarOpen(false)} style={{ fontFamily: 'Inter, sans-serif' }}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">Cancelar</button>
            <button onClick={() => selectedPedido && cambiarEstado(selectedPedido, 'Rechazado', razonRechazo)}
              disabled={saving} style={{ fontFamily: 'Inter, sans-serif' }}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2 transition-colors">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Rechazar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};