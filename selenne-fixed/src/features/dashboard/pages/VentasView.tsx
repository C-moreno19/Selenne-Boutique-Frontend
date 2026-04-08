import React, { useState, useEffect, useCallback } from 'react';
import { Search, Eye, Archive, Plus, ChevronRight, Loader2, RefreshCw, Trash2, X, Package } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../../components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { postJson } from '../../../services/api';
import { toast } from 'sonner';
import { getJson } from '../../../services/api';
import api from '../../../services/api';
import { useAuth } from '../../../shared/contexts/AuthContext';

interface PedidoDetalle { productoNombre: string; cantidad: number; precioUnitario: number; subtotal: number; talla?: string; color?: string; }
interface Pedido {
  pedidoID: number; nombreCliente: string; emailCliente: string; telefonoCliente: string;
  direccionEnvio: string; ciudad: string; metodoPago: string;
  subtotal: number; descuento: number; envio: number; total: number;
  estado: string; fechaPedido: string; notas?: string; comprobantePago?: string;
  detalles: PedidoDetalle[];
}

const ESTADOS_ACTIVOS = ['Aprobado'];
const ESTADOS_CAMBIO = ['Completado', 'Cancelado'];
const fmt = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
const estadoColor = (e: string) => {
  if (e === 'Aprobado') return 'bg-blue-100 text-blue-700';
  if (e === 'Completado') return 'bg-green-100 text-green-700';
  return 'bg-red-100 text-red-700';
};

interface VentasViewProps { onNavigateToHistorial?: () => void; }

export const VentasView: React.FC<VentasViewProps> = ({ onNavigateToHistorial }) => {
  const { hasPermission } = useAuth();
  const puedeCrear = hasPermission('ventas:crear');
  const puedeEditar = hasPermission('ventas:editar');
  const puedeEliminar = hasPermission('ventas:eliminar');

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [nuevaVentaOpen, setNuevaVentaOpen] = useState(false);
  const [nombreCliente, setNombreCliente] = useState('');
  const [emailCliente, setEmailCliente] = useState('');
  const [telefonoCliente, setTelefonoCliente] = useState('');
  const [metodoPago, setMetodoPago] = useState('Transferencia');
  const [notasVenta, setNotasVenta] = useState('');

  const loadData = useCallback(async () => {
    try {
      const res = await getJson('/api/pedidos');
      const all = (res?.data || res || []).map((p: any): Pedido => ({
        pedidoID: p.pedidoID, nombreCliente: p.nombreCliente ?? '',
        emailCliente: p.emailCliente ?? '', telefonoCliente: p.telefonoCliente ?? '',
        direccionEnvio: p.direccionEnvio ?? '', ciudad: p.ciudad ?? '',
        metodoPago: p.metodoPago ?? '', subtotal: p.subtotal ?? 0,
        descuento: p.descuento ?? 0, envio: p.envio ?? 0, total: p.total ?? 0,
        estado: p.estado ?? '', fechaPedido: p.fechaPedido ?? '',
        notas: p.notas ?? '', comprobantePago: p.comprobantePago ?? '',
        detalles: (p.detalles ?? []).map((d: any) => ({
          productoNombre: d.productoNombre ?? '', cantidad: d.cantidad ?? 0,
          precioUnitario: d.precioUnitario ?? 0, subtotal: d.subtotal ?? 0,
          talla: d.talla ?? '', color: d.color ?? '',
        })),
      }));
      setPedidos(all.filter((p: Pedido) => ESTADOS_ACTIVOS.includes(p.estado)));
    } catch { toast.error('Error cargando ventas'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = pedidos.filter(p => {
    const q = searchQuery.toLowerCase();
    return p.nombreCliente.toLowerCase().includes(q) || p.emailCliente.toLowerCase().includes(q);
  });

  const cambiarEstado = async (pedido: Pedido, estado: string) => {
    setSaving(true);
    try {
      await api.fetchWithAuth(`/api/pedidos/${pedido.pedidoID}/estado`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ NuevoEstado: estado }),
      });
      toast.success(`Venta marcada como ${estado}`);
      loadData();
    } catch { toast.error('Error cambiando estado'); }
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
        <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-500">Dashboard</span>
        <ChevronRight className="w-4 h-4 text-gray-400" />
        <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm font-medium text-gray-900">Gestión de Ventas</span>
      </div>
      <h1 style={{ fontFamily: 'Playfair Display, serif' }} className="text-4xl text-gray-900 mb-6">Gestión de Ventas</h1>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Buscar por cliente o email..." value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)} style={{ fontFamily: 'Inter, sans-serif' }}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d65391]" />
        </div>
        <div className="flex gap-3">
          <button onClick={() => { setLoading(true); loadData(); }} className="px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            <RefreshCw className="w-5 h-5" />
          </button>
          <button onClick={onNavigateToHistorial} style={{ fontFamily: 'Inter, sans-serif' }}
            className="px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors">
            <Archive className="w-5 h-5" /> Historial de Ventas
          </button>
          {puedeCrear && (
            <button onClick={() => setNuevaVentaOpen(true)} style={{ fontFamily: 'Inter, sans-serif' }}
              className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 flex items-center gap-2 transition-colors">
              <Plus className="w-5 h-5" /> Nueva Venta
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['#', 'CLIENTE', 'FECHA', 'TOTAL', 'ESTADO', 'ACCIONES'].map(h => (
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
                <td className="px-6 py-4">
                  {puedeEditar ? (
                    <Select value={p.estado} onValueChange={v => cambiarEstado(p, v)}>
                      <SelectTrigger className={`h-8 w-36 text-xs font-medium rounded-full border-0 ${estadoColor(p.estado)}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Aprobado">Aprobado</SelectItem>
                        {ESTADOS_CAMBIO.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${estadoColor(p.estado)}`} style={{ fontFamily: 'Inter, sans-serif' }}>{p.estado}</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setSelectedPedido(p); setViewOpen(true); }}
                      className="p-2 text-gray-500 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors" title="Ver detalles">
                      <Eye className="w-5 h-5" />
                    </button>
                    {puedeEliminar && (
                      <button onClick={() => { setSelectedPedido(p); setDeleteOpen(true); }}
                        className="p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors" title="Eliminar">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400" style={{ fontFamily: 'Inter, sans-serif' }}>No hay ventas aprobadas</td></tr>
            )}
          </tbody>
        </table>
        <div className="px-6 py-4 border-t border-gray-100">
          <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-500">
            <span className="font-medium text-gray-800">{filtered.length}</span> ventas aprobadas
          </span>
        </div>
      </div>

      {/* Modal Ver Detalles */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-2xl h-auto flex flex-col p-0 gap-0">
          <DialogHeader className="px-8 pt-6 pb-4 border-b border-gray-200 flex-shrink-0">
            <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }} className="text-2xl">
              Detalles Venta #{selectedPedido?.pedidoID}
            </DialogTitle>
            <DialogDescription style={{ fontFamily: 'Inter, sans-serif' }}>
              {selectedPedido?.nombreCliente} — {selectedPedido?.emailCliente}
            </DialogDescription>
          </DialogHeader>
          {selectedPedido && (
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-6 py-6 px-8">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <h3 style={{ fontFamily: 'Inter, sans-serif' }} className="font-semibold text-gray-800 text-base">👤 Cliente</h3>
                  </div>
                  <div className="p-6 grid grid-cols-2 gap-6">
                    {[['Nombre', selectedPedido.nombreCliente], ['Email', selectedPedido.emailCliente],
                      ['Teléfono', selectedPedido.telefonoCliente], ['Ciudad', selectedPedido.ciudad],
                      ['Dirección', selectedPedido.direccionEnvio], ['Método de pago', selectedPedido.metodoPago],
                    ].map(([label, value]) => (
                      <div key={label} className="flex flex-col gap-1">
                        <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-500 font-medium uppercase">{label}</p>
                        <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm font-semibold text-gray-900">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
                {selectedPedido.detalles.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                      <h3 style={{ fontFamily: 'Inter, sans-serif' }} className="font-semibold text-gray-800 text-base">📦 Productos</h3>
                    </div>
                    <div className="p-6 space-y-3">
                      {selectedPedido.detalles.map((d, i) => (
                        <div key={i} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                          <div>
                            <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm font-semibold text-gray-900">{d.productoNombre}</p>
                            <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-500 mt-0.5">
                              {d.cantidad} x {fmt(d.precioUnitario)} {d.talla && `• Talla: ${d.talla}`} {d.color && `• Color: ${d.color}`}
                            </p>
                          </div>
                          <p style={{ fontFamily: 'Inter, sans-serif' }} className="font-bold text-gray-900">{fmt(d.subtotal)}</p>
                        </div>
                      ))}
                      <div className="flex justify-between pt-3 border-t border-gray-200">
                        <p style={{ fontFamily: 'Inter, sans-serif' }} className="font-bold text-gray-900 text-lg">Total</p>
                        <p style={{ fontFamily: 'Inter, sans-serif' }} className="font-bold text-[#d65391] text-2xl">{fmt(selectedPedido.total)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 px-8 py-5 border-t border-gray-200 flex-shrink-0">
            <button onClick={() => setViewOpen(false)} style={{ fontFamily: 'Inter, sans-serif' }}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">Cerrar</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Eliminar */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ fontFamily: 'Playfair Display, serif' }}>¿Eliminar venta?</AlertDialogTitle>
            <AlertDialogDescription style={{ fontFamily: 'Inter, sans-serif' }}>
              Vas a eliminar la venta #{selectedPedido?.pedidoID} de <strong>{selectedPedido?.nombreCliente}</strong>. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel style={{ fontFamily: 'Inter, sans-serif' }}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={eliminar} disabled={saving}
              className="bg-red-600 hover:bg-red-700 flex items-center gap-2" style={{ fontFamily: 'Inter, sans-serif' }}>
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Modal Nueva Venta Manual */}
      <Dialog open={nuevaVentaOpen} onOpenChange={setNuevaVentaOpen}>
        <DialogContent className="max-w-2xl h-auto flex flex-col p-0 gap-0">
          <DialogHeader className="px-8 pt-6 pb-4 border-b border-gray-200 flex-shrink-0">
            <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }} className="text-2xl">Nueva Venta Manual</DialogTitle>
            <DialogDescription style={{ fontFamily: 'Inter, sans-serif' }}>Registra una venta directamente sin pasar por el checkout del cliente</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-8 space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                <p style={{ fontFamily: 'Inter, sans-serif' }} className="font-semibold text-sm text-gray-700">👤 Datos del Cliente</p>
              </div>
              <div className="p-6 grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm font-medium text-gray-700">Nombre <span className="text-red-500">*</span></Label>
                  <Input value={nombreCliente} onChange={e => setNombreCliente(e.target.value)} placeholder="Nombre del cliente" className="h-10 border-gray-300" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm font-medium text-gray-700">Email</Label>
                  <Input type="email" value={emailCliente} onChange={e => setEmailCliente(e.target.value)} placeholder="email@ejemplo.com" className="h-10 border-gray-300" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm font-medium text-gray-700">Teléfono</Label>
                  <Input value={telefonoCliente} onChange={e => setTelefonoCliente(e.target.value)} placeholder="+57 300 123 4567" className="h-10 border-gray-300" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm font-medium text-gray-700">Método de Pago</Label>
                  <Select value={metodoPago} onValueChange={setMetodoPago}>
                    <SelectTrigger className="h-10 border-gray-300"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Transferencia">Transferencia</SelectItem>
                      <SelectItem value="Efectivo">Efectivo</SelectItem>
                      <SelectItem value="Tarjeta">Tarjeta</SelectItem>
                      <SelectItem value="Contra Entrega">Contra Entrega</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2 col-span-2">
                  <Label style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm font-medium text-gray-700">Notas</Label>
                  <Input value={notasVenta} onChange={e => setNotasVenta(e.target.value)} placeholder="Observaciones de la venta..." className="h-10 border-gray-300" />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="px-8 py-5 border-t border-gray-200 flex-shrink-0 gap-2">
            <button onClick={() => { setNuevaVentaOpen(false); setNombreCliente(''); setEmailCliente(''); setTelefonoCliente(''); setNotasVenta(''); }}
              style={{ fontFamily: 'Inter, sans-serif' }} className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">Cancelar</button>
            <button onClick={async () => {
              if (!nombreCliente.trim()) { toast.error('El nombre es obligatorio'); return; }
              setSaving(true);
              try {
                await postJson('/api/pedidos', {
                  NombreCliente: nombreCliente,
                  EmailCliente: emailCliente || 'sin-email@selenne.com',
                  TelefonoCliente: telefonoCliente || 'N/A',
                  DireccionEnvio: 'Venta presencial',
                  Ciudad: 'N/A',
                  MetodoPago: metodoPago,
                  Notas: notasVenta,
                  Items: [],
                });
                toast.error('Para registrar una venta manual necesitas agregar productos. Esta función estará disponible próximamente.');
              } catch (e: any) {
                toast.error(e?.data?.message || 'Error registrando venta');
              } finally { setSaving(false); }
            }} disabled={saving} style={{ fontFamily: 'Inter, sans-serif' }}
              className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2 transition-colors">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Registrar Venta
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};