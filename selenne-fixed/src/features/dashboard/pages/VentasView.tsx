import React, { useState, useEffect, useCallback } from 'react';
import { Search, Eye, Archive, Plus, ChevronRight, Loader2, RefreshCw, Trash2, X, Package, Truck, User, ShoppingBag, CreditCard, MapPin, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../../components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { postJson } from '../../../services/api';
import { toast } from '@/lib/toast';
import { getJson } from '../../../services/api';
import api from '../../../services/api';
import { useAuth } from '../../../shared/contexts/AuthContext';

interface PedidoDetalle { productoNombre: string; imagenProducto?: string; cantidad: number; precioUnitario: number; subtotal: number; talla?: string; color?: string; }
interface ProductoSimple { productoID: number; nombre: string; precio: number; stock: number; tallas: { tallaID: number; nombre: string }[]; colores: { colorID: number; nombre: string }[]; }
interface ItemVenta { productoID: number; productoNombre: string; precio: number; stock: number; tallaID?: number; tallaNombre?: string; colorID?: number; colorNombre?: string; cantidad: number; subtotal: number; }
interface Pedido {
  pedidoID: number; nombreCliente: string; emailCliente: string; telefonoCliente: string;
  direccionEnvio: string; ciudad: string; metodoPago: string;
  subtotal: number; descuento: number; envio: number; total: number;
  estado: string; fechaPedido: string; notas?: string; comprobantePago?: string;
  detalles: PedidoDetalle[];
}

const ESTADOS_ACTIVOS = ['Aprobado', 'Aprobada'];
const ESTADOS_CAMBIO = ['Completado', 'Cancelado'];
const fmt = (n: number) => `$${new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)} COP`;
const estadoColor = (e: string) => {
  if (e === 'Aprobado') return 'bg-blue-100 text-blue-700';
  if (e === 'Completado') return 'bg-green-100 text-green-700';
  return 'bg-red-100 text-red-700';
};
const estadoBadgeClass = (e: string) => {
  if (e === 'Completado' || e === 'Completada') return 'bg-green-50 text-green-600 border-green-200';
  if (e === 'Enviado') return 'bg-pink-50 text-[#d65391] border-pink-200';
  if (e === 'Aprobado' || e === 'Aprobada') return 'bg-blue-50 text-blue-600 border-blue-200';
  if (e === 'Rechazado' || e === 'Rechazada') return 'bg-orange-50 text-orange-600 border-orange-200';
  return 'bg-red-50 text-red-600 border-red-200';
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
  const [emailGuiaOpen, setEmailGuiaOpen] = useState(false);
  const [numeroGuia, setNumeroGuia] = useState('');
  const [transportadora, setTransportadora] = useState('');
  const [fotoGuia, setFotoGuia] = useState<File | null>(null);
  const [nombreCliente, setNombreCliente] = useState('');
  const [emailCliente, setEmailCliente] = useState('');
  const [telefonoCliente, setTelefonoCliente] = useState('');
  const [documentoCliente, setDocumentoCliente] = useState('');
  const [metodoPago, setMetodoPago] = useState('Transferencia');
  const [ventaErrors, setVentaErrors] = useState({ nombreCliente: '', emailCliente: '', telefonoCliente: '', documentoCliente: '' });
  const [notasVenta, setNotasVenta] = useState('');
  const [productosDisponibles, setProductosDisponibles] = useState<ProductoSimple[]>([]);
  const [itemsVenta, setItemsVenta] = useState<ItemVenta[]>([]);

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
          productoNombre: d.productoNombre ?? '', imagenProducto: d.imagenProducto ?? '',
          cantidad: d.cantidad ?? 0, precioUnitario: d.precioUnitario ?? 0,
          subtotal: d.subtotal ?? 0, talla: d.talla ?? '', color: d.color ?? '',
        })),
      }));
      setPedidos(all.filter((p: Pedido) => ESTADOS_ACTIVOS.includes(p.estado)));
    } catch { toast.error('Error cargando ventas'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const loadProductos = async () => {
    try {
      const res = await getJson('/api/productos?estado=activo');
      const data = res?.data || res || [];
      setProductosDisponibles(Array.isArray(data) ? data.map((p: any) => ({
        productoID: p.productoID ?? p.ProductoID,
        nombre: p.nombre ?? p.Nombre ?? '',
        precio: p.precioOferta ?? p.precioVenta ?? p.PrecioVenta ?? 0,
        stock: p.stock ?? p.Stock ?? 0,
        tallas: (p.tallas ?? p.Tallas ?? []).map((t: any) => ({ tallaID: t.tallaID ?? t.TallaID, nombre: t.nombre ?? t.Nombre ?? '' })),
        colores: (p.colores ?? p.Colores ?? []).map((c: any) => ({ colorID: c.colorID ?? c.ColorID, nombre: c.nombre ?? c.Nombre ?? '' })),
      })) : []);
    } catch { }
  };

  const agregarItemVenta = () => {
    if (productosDisponibles.length === 0) return;
    const p = productosDisponibles[0];
    setItemsVenta(prev => [...prev, { productoID: p.productoID, productoNombre: p.nombre, precio: p.precio, cantidad: 1, subtotal: p.precio, stock: p.stock }]);
  };

  const actualizarItemVenta = (idx: number, field: string, value: any) => {
    setItemsVenta(prev => {
      const updated = [...prev];
      const item = { ...updated[idx] };
      if (field === 'productoID') {
        const prod = productosDisponibles.find(p => p.productoID === Number(value));
        if (prod) { item.productoID = prod.productoID; item.productoNombre = prod.nombre; item.precio = prod.precio; item.stock = prod.stock; item.tallaID = undefined; item.tallaNombre = undefined; item.colorID = undefined; item.colorNombre = undefined; item.cantidad = Math.min(item.cantidad, prod.stock || 1); item.subtotal = prod.precio * item.cantidad; }
      } else if (field === 'cantidad') {
        const maxStock = item.stock ?? Infinity;
        item.cantidad = Math.min(Math.max(1, Number(value)), maxStock); item.subtotal = item.precio * item.cantidad;
      } else if (field === 'tallaID') {
        const prod = productosDisponibles.find(p => p.productoID === item.productoID);
        const t = prod?.tallas.find(t => t.tallaID === Number(value));
        item.tallaID = t?.tallaID; item.tallaNombre = t?.nombre;
      } else if (field === 'colorID') {
        const prod = productosDisponibles.find(p => p.productoID === item.productoID);
        const c = prod?.colores.find(c => c.colorID === Number(value));
        item.colorID = c?.colorID; item.colorNombre = c?.nombre;
      } else if (field === 'precio') {
        const val = Number(value);
        if (!isNaN(val) && val >= 0) { item.precio = val; item.subtotal = val * item.cantidad; }
      }
      updated[idx] = item;
      return updated;
    });
  };

  const resetNuevaVenta = () => {
    setNombreCliente(''); setEmailCliente(''); setTelefonoCliente(''); setDocumentoCliente('');
    setNotasVenta(''); setItemsVenta([]);
    setVentaErrors({ nombreCliente: '', emailCliente: '', telefonoCliente: '', documentoCliente: '' });
  };

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

  const enviarEmailGuia = async () => {
    if (!selectedPedido) return;
    setSaving(true);
    try {
      const form = new FormData();
      if (numeroGuia) form.append('NumeroGuia', numeroGuia);
      if (transportadora) form.append('Transportadora', transportadora);
      if (fotoGuia) form.append('Foto', fotoGuia);
      await api.fetchWithAuth(`/api/pedidos/${selectedPedido.pedidoID}/email-guia`, {
        method: 'POST',
        body: form,
      });
      toast.success('Notificación de envío enviada correctamente');
      setEmailGuiaOpen(false);
      setNumeroGuia('');
      setTransportadora('');
      setFotoGuia(null);
      loadData();
    } catch (e: any) { toast.error(e?.data?.message || e?.message || 'Error enviando notificación'); }
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
        <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-medium text-gray-900">Gestión de Ventas</span>
      </div>
      <h1 style={{ fontFamily: '"Times New Roman", Times, serif' }} className="text-4xl text-gray-900 mb-6">Gestión de Ventas</h1>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Buscar por cliente o email..." value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d65391]" />
        </div>
        <div className="flex gap-3">
          <button onClick={() => { setLoading(true); loadData(); }} className="px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            <RefreshCw className="w-5 h-5" />
          </button>
          <button onClick={onNavigateToHistorial} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
            className="px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors">
            <Archive className="w-5 h-5" /> Historial de Ventas
          </button>
          {puedeCrear && (
            <button onClick={() => { setNuevaVentaOpen(true); loadProductos(); }} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
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
                  <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs font-semibold uppercase tracking-wider text-gray-500">{h}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((p, idx) => (
              <tr key={p.pedidoID} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4"><span className="font-medium text-gray-900">#{p.pedidoID}</span></td>
                <td className="px-6 py-4">
                  <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="font-medium text-gray-900">{p.nombreCliente}</p>
                  <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-500">{p.emailCliente}</p>
                </td>
                <td className="px-6 py-4"><span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-600">{new Date(p.fechaPedido).toLocaleDateString('es-CO')}</span></td>
                <td className="px-6 py-4"><span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="font-semibold">{fmt(p.total)}</span></td>
                <td className="px-6 py-4">
                  {puedeEditar ? (
                    <Select value={p.estado} onValueChange={(v: string) => cambiarEstado(p, v)}>
                      <SelectTrigger className={`h-8 w-36 text-xs font-medium rounded-full border-0 ${estadoColor(p.estado)}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Aprobado">Aprobado</SelectItem>
                        {ESTADOS_CAMBIO.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${estadoColor(p.estado)}`} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>{p.estado}</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setSelectedPedido(p); setViewOpen(true); }}
                      className="p-2 text-gray-500 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors" title="Ver detalles">
                      <Eye className="w-5 h-5" />
                    </button>
                    {puedeEditar && (
                      <button onClick={() => { setSelectedPedido(p); setEmailGuiaOpen(true); }}
                        className="p-2 text-gray-500 hover:bg-green-50 hover:text-green-600 rounded-lg transition-colors" title="Enviar correo de guía">
                        <Truck className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>No hay ventas aprobadas</td></tr>
            )}
          </tbody>
        </table>
        <div className="px-6 py-4 border-t border-gray-100">
          <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-500">
            <span className="font-medium text-gray-800">{filtered.length}</span> ventas aprobadas
          </span>
        </div>
      </div>

      {/* Modal Ver Detalles */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="w-[420px] flex flex-col p-0 gap-0 overflow-hidden max-h-[88vh]">
          <DialogTitle className="sr-only">Detalle de venta</DialogTitle>
          <DialogDescription className="sr-only">Detalle de la venta del cliente</DialogDescription>

          {/* Header con gradiente */}
          <div style={{ background: 'linear-gradient(180deg, #ad1457 0%, #f48fb1 100%)' }}
            className="px-5 pt-4 pb-5 pr-12 flex-shrink-0">
            <div className="flex items-center gap-2.5 mb-4">
              <div style={{ background: 'rgba(255,255,255,0.25)', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '6px' }}
                className="w-7 h-7 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">S</div>
              <span className="text-xs font-bold tracking-[3px] text-white uppercase">Selenne Boutique</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div style={{ background: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.35)', borderRadius: '8px' }}
                  className="w-10 h-10 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {selectedPedido?.nombreCliente?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-white font-bold text-sm leading-tight">Detalle de venta</p>
                  <p style={{ color: '#fce4ec' }} className="text-xs">{selectedPedido?.nombreCliente}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`px-2.5 py-0.5 text-xs font-semibold border rounded-md ${estadoBadgeClass(selectedPedido?.estado ?? '')}`}>
                  {selectedPedido?.estado}
                </span>
                <span style={{ color: '#fce4ec' }} className="text-xs">
                  {selectedPedido?.fechaPedido ? new Date(selectedPedido.fechaPedido).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto bg-gray-50 px-4 py-4 space-y-3">
            {selectedPedido && (
              <>
                {/* Cliente + Pago */}
                <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                  <div className="grid grid-cols-2 divide-x divide-gray-100">
                    <div className="p-3 flex items-start gap-3">
                      <div className="w-8 h-8 bg-pink-50 rounded-md flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4" style={{ color: '#ad1457' }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Cliente</p>
                        <p className="text-sm font-bold text-gray-900 truncate">{selectedPedido.nombreCliente}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{selectedPedido.telefonoCliente}</p>
                      </div>
                    </div>
                    <div className="p-3 flex items-start gap-3">
                      <div className="w-8 h-8 bg-pink-50 rounded-md flex items-center justify-center flex-shrink-0">
                        <CreditCard className="w-4 h-4" style={{ color: '#ad1457' }} />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Método de pago</p>
                        <p className="text-sm font-bold text-gray-900 capitalize">{selectedPedido.metodoPago}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dirección */}
                {(selectedPedido.direccionEnvio || selectedPedido.ciudad) && (
                  <div className="border border-gray-200 rounded-lg p-3 bg-white shadow-sm flex items-start gap-3">
                    <div className="w-8 h-8 bg-pink-50 rounded-md flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4" style={{ color: '#ad1457' }} />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Dirección de envío</p>
                      <p className="text-sm font-bold text-gray-900">{selectedPedido.direccionEnvio || '—'}</p>
                      {selectedPedido.ciudad && <p className="text-xs text-gray-500 mt-0.5">{selectedPedido.ciudad}</p>}
                    </div>
                  </div>
                )}

                {/* Productos */}
                {selectedPedido.detalles.length > 0 && (
                  <div className="border border-gray-200 rounded-lg bg-white shadow-sm overflow-hidden">
                    <div className="flex items-center gap-3 px-3 py-2.5 border-b border-gray-100">
                      <div className="w-8 h-8 bg-pink-50 rounded-md flex items-center justify-center flex-shrink-0">
                        <ShoppingBag className="w-4 h-4" style={{ color: '#ad1457' }} />
                      </div>
                      <p className="text-[10px] font-bold text-gray-600 uppercase tracking-wide">Productos</p>
                    </div>
                    <div className="px-3 py-2 space-y-2">
                      {selectedPedido.detalles.map((d, i) => (
                        <div key={i} className="flex items-center gap-3">
                          {d.imagenProducto
                            ? <img src={d.imagenProducto} alt={d.productoNombre} className="w-10 h-10 object-cover rounded-md flex-shrink-0 border border-gray-100" />
                            : <span style={{ background: '#ad1457', borderRadius: '4px' }} className="w-5 h-5 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">{d.cantidad}</span>
                          }
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-800 truncate">{d.productoNombre}</p>
                            <div className="flex gap-1.5 mt-0.5 flex-wrap">
                              {d.talla && <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded">T: {d.talla}</span>}
                              {d.color && <span className="text-[10px] bg-pink-50 px-2 py-0.5 rounded" style={{ color: '#ad1457' }}>{d.color}</span>}
                            </div>
                          </div>
                          <span className="text-sm font-bold text-gray-900 flex-shrink-0">{fmt(d.subtotal)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Total */}
                <div style={{ background: '#ad1457', borderRadius: '8px' }} className="px-4 py-3 flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-widest">Total</span>
                  <span className="text-xl font-bold text-white">{fmt(selectedPedido.total)}</span>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 bg-white border-t border-gray-200 flex justify-end flex-shrink-0">
            <button type="button" onClick={() => setViewOpen(false)}
              className="px-6 py-2 text-white text-sm font-semibold rounded-md transition-colors"
              style={{ background: '#ad1457' }}>
              Cerrar
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Email Guía */}
      <Dialog open={emailGuiaOpen} onOpenChange={v => { setEmailGuiaOpen(v); if (!v) { setNumeroGuia(''); setTransportadora(''); setFotoGuia(null); } }}>
        <DialogContent className="max-w-md flex flex-col p-0 gap-0 max-h-[90vh]">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100 flex-shrink-0">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 bg-[#fce7f3] rounded-xl flex items-center justify-center flex-shrink-0">
                <Truck className="w-5 h-5 text-[#d65391]" />
              </div>
              <DialogTitle style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xl">
                Notificación de Envío
              </DialogTitle>
            </div>
            <DialogDescription style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-500 ml-12">
              Para <strong className="text-gray-700">{selectedPedido?.nombreCliente}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-medium text-gray-700">Número de guía</Label>
                <Input value={numeroGuia} onChange={e => setNumeroGuia(e.target.value)}
                  placeholder="Ej: 123456789" className="h-10 border-gray-200 rounded-xl bg-gray-50 focus:ring-[#d65391]" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-medium text-gray-700">Transportadora</Label>
                <Input value={transportadora} onChange={e => setTransportadora(e.target.value)}
                  placeholder="Ej: Servientrega" className="h-10 border-gray-200 rounded-xl bg-gray-50 focus:ring-[#d65391]" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-medium text-gray-700">
                Foto del paquete <span className="text-gray-400 font-normal">(opcional)</span>
              </Label>
              <label className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-[#d65391] hover:bg-[#fdf2f8] transition-colors">
                <Package className="w-5 h-5 text-gray-400" />
                <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-500">
                  {fotoGuia ? fotoGuia.name : 'Seleccionar imagen del paquete...'}
                </span>
                <input type="file" accept="image/*" title="Foto del paquete" className="hidden"
                  onChange={e => setFotoGuia(e.target.files?.[0] ?? null)} />
              </label>
              {fotoGuia && (
                <div className="flex items-center justify-between text-xs text-[#9d174d] bg-[#fdf2f8] border border-[#f9a8d4] px-3 py-2 rounded-lg">
                  <span className="flex items-center gap-1.5"><Package className="w-3 h-3" /> {fotoGuia.name}</span>
                  <button type="button" title="Quitar foto" onClick={() => setFotoGuia(null)} className="text-gray-400 hover:text-red-500 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="px-6 py-4 border-t border-gray-100 flex-shrink-0 flex gap-2">
            <button onClick={() => setEmailGuiaOpen(false)} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
              className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors text-sm font-medium">
              Cancelar
            </button>
            <button onClick={enviarEmailGuia} disabled={saving} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
              className="flex-1 py-2.5 bg-[#d65391] text-white rounded-xl hover:bg-[#c0426f] disabled:opacity-50 flex items-center justify-center gap-2 transition-colors text-sm font-medium">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
              Enviar notificación
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Nueva Venta Manual */}
      <Dialog open={nuevaVentaOpen} onOpenChange={v => { setNuevaVentaOpen(v); if (!v) resetNuevaVenta(); }}>
        <DialogContent className="max-w-2xl flex flex-col p-0 gap-0 max-h-[90vh]">
          <DialogHeader className="px-8 pt-6 pb-4 border-b border-gray-200 flex-shrink-0">
            <DialogTitle style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-2xl">Nueva Venta Manual</DialogTitle>
            <DialogDescription style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>Registra una venta directamente sin pasar por el checkout del cliente</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-8 space-y-6">
            {/* Datos del cliente */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="font-semibold text-sm text-gray-700 flex items-center gap-2"><User className="w-4 h-4 text-gray-400" />Datos del Cliente</p>
              </div>
              <div className="p-6 grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-medium text-gray-700">Nombre <span className="text-red-500">*</span></Label>
                  <Input value={nombreCliente} onChange={e => {
                    const val = e.target.value;
                    if (val && !/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]*$/.test(val)) {
                      setVentaErrors(prev => ({ ...prev, nombreCliente: 'Solo se permiten letras' }));
                      return;
                    }
                    setVentaErrors(prev => ({ ...prev, nombreCliente: '' }));
                    setNombreCliente(val);
                  }} placeholder="Nombre del cliente" className={`h-10 ${ventaErrors.nombreCliente ? 'border-red-500' : 'border-gray-300'}`} />
                  {ventaErrors.nombreCliente && <p className="text-xs text-red-500 mt-1">{ventaErrors.nombreCliente}</p>}
                </div>
                <div className="flex flex-col gap-2">
                  <Label style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-medium text-gray-700">Documento <span className="text-gray-400 text-xs">(opcional)</span></Label>
                  <Input value={documentoCliente} onChange={e => {
                    const val = e.target.value;
                    if (val && !/^\d*$/.test(val)) {
                      setVentaErrors(prev => ({ ...prev, documentoCliente: 'Solo se permiten números' }));
                      return;
                    }
                    setVentaErrors(prev => ({ ...prev, documentoCliente: '' }));
                    setDocumentoCliente(val);
                  }} placeholder="Cédula o NIT" className={`h-10 ${ventaErrors.documentoCliente ? 'border-red-500' : 'border-gray-300'}`} />
                  {ventaErrors.documentoCliente && <p className="text-xs text-red-500 mt-1">{ventaErrors.documentoCliente}</p>}
                </div>
                <div className="flex flex-col gap-2">
                  <Label style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-medium text-gray-700">Email <span className="text-red-500">*</span></Label>
                  <Input type="email" value={emailCliente} onChange={e => {
                    const val = e.target.value;
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (val && !emailRegex.test(val)) {
                      setVentaErrors(prev => ({ ...prev, emailCliente: 'Formato de email inválido' }));
                    } else {
                      setVentaErrors(prev => ({ ...prev, emailCliente: '' }));
                    }
                    setEmailCliente(val);
                  }} placeholder="email@ejemplo.com" className={`h-10 ${ventaErrors.emailCliente ? 'border-red-500' : 'border-gray-300'}`} />
                  {ventaErrors.emailCliente && <p className="text-xs text-red-500 mt-1">{ventaErrors.emailCliente}</p>}
                </div>
                <div className="flex flex-col gap-2">
                  <Label style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-medium text-gray-700">Teléfono <span className="text-red-500">*</span></Label>
                  <Input value={telefonoCliente} onChange={e => {
                    const val = e.target.value;
                    if (val && !/^\d*$/.test(val)) {
                      setVentaErrors(prev => ({ ...prev, telefonoCliente: 'Solo se permiten números' }));
                      return;
                    }
                    setVentaErrors(prev => ({ ...prev, telefonoCliente: '' }));
                    setTelefonoCliente(val);
                  }} placeholder="3001234567" className={`h-10 ${ventaErrors.telefonoCliente ? 'border-red-500' : 'border-gray-300'}`} />
                  {ventaErrors.telefonoCliente && <p className="text-xs text-red-500 mt-1">{ventaErrors.telefonoCliente}</p>}
                </div>
                <div className="flex flex-col gap-2">
                  <Label style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-medium text-gray-700">Método de Pago</Label>
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
                <div className="flex flex-col gap-2">
                  <Label style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-medium text-gray-700">Notas</Label>
                  <Input value={notasVenta} onChange={e => setNotasVenta(e.target.value)} placeholder="Observaciones de la venta..." className="h-10 border-gray-300" />
                </div>
              </div>
            </div>

            {/* Productos */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex items-center justify-between">
                <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="font-semibold text-sm text-gray-700 flex items-center gap-2"><Package className="w-4 h-4 text-gray-400" />Productos <span className="text-red-500">*</span></p>
                <button onClick={agregarItemVenta} disabled={productosDisponibles.length === 0}
                  style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#d65391] text-white text-xs font-semibold rounded-lg hover:bg-[#c14a7f] disabled:opacity-40 transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Agregar producto
                </button>
              </div>
              <div className="p-6">
                {itemsVenta.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <Package className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                    <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-400">Agrega al menos un producto</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {itemsVenta.map((item, idx) => {
                      const prod = productosDisponibles.find(p => p.productoID === item.productoID);
                      return (
                        <div key={idx} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                          <div className="flex justify-between items-center mb-3">
                            <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs font-semibold text-gray-400 uppercase">Producto #{idx + 1}</span>
                            <button type="button" title="Eliminar producto" onClick={() => setItemsVenta(prev => prev.filter((_, i) => i !== idx))}
                              className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1 col-span-2">
                              <Label style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs font-medium text-gray-600">Producto</Label>
                              <Select value={String(item.productoID)} onValueChange={v => actualizarItemVenta(idx, 'productoID', v)}>
                                <SelectTrigger className="h-9 bg-white border-gray-300 text-sm"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {productosDisponibles.map(p => <SelectItem key={p.productoID} value={String(p.productoID)}>{p.nombre}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                            {prod && prod.tallas.length > 0 && (
                              <div className="flex flex-col gap-1">
                                <Label style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs font-medium text-gray-600">Talla</Label>
                                <Select value={item.tallaID ? String(item.tallaID) : ''} onValueChange={v => actualizarItemVenta(idx, 'tallaID', v)}>
                                  <SelectTrigger className="h-9 bg-white border-gray-300 text-sm"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                                  <SelectContent>
                                    {prod.tallas.map(t => <SelectItem key={t.tallaID} value={String(t.tallaID)}>{t.nombre}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                            {prod && prod.colores.length > 0 && (
                              <div className="flex flex-col gap-1">
                                <Label style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs font-medium text-gray-600">Color</Label>
                                <Select value={item.colorID ? String(item.colorID) : ''} onValueChange={v => actualizarItemVenta(idx, 'colorID', v)}>
                                  <SelectTrigger className="h-9 bg-white border-gray-300 text-sm"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                                  <SelectContent>
                                    {prod.colores.map(c => <SelectItem key={c.colorID} value={String(c.colorID)}>{c.nombre}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                            <div className="flex flex-col gap-1">
                              <Label style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs font-medium text-gray-600">
                                Cantidad
                                {item.stock > 0 && (
                                  <span className="ml-2 text-gray-400 font-normal">
                                    (máx: <span className={item.cantidad >= item.stock ? 'text-red-500 font-semibold' : 'text-green-600 font-semibold'}>{item.stock}</span>)
                                  </span>
                                )}
                              </Label>
                              <Input
                                type="number" min="1" max={item.stock || undefined}
                                value={item.cantidad}
                                onChange={e => actualizarItemVenta(idx, 'cantidad', e.target.value)}
                                className={`h-9 bg-white text-sm ${item.cantidad >= item.stock && item.stock > 0 ? 'border-orange-400 focus:ring-orange-400' : 'border-gray-300'}`}
                              />
                              {item.stock === 0 && (
                                <p className="text-xs text-red-500 font-medium">Sin stock disponible</p>
                              )}
                            </div>
                            <div className="flex flex-col gap-1">
                              <Label style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs font-medium text-gray-600">Precio Unit. ($)</Label>
                              <Input type="number" min="0" step="1000" value={item.precio} onChange={e => actualizarItemVenta(idx, 'precio', e.target.value)} className="h-9 bg-white border-gray-300 text-sm" />
                            </div>
                            <div className="flex flex-col gap-1 col-span-2">
                              <Label style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs font-medium text-gray-600">Subtotal</Label>
                              <div className="h-9 flex items-center px-3 bg-pink-50 border border-pink-200 rounded-lg">
                                <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-bold text-[#d65391]">{fmt(item.subtotal)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div className="flex justify-end pt-2 border-t border-gray-200">
                      <div className="text-right">
                        <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-500">Total</p>
                        <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-2xl font-bold text-[#d65391]">{fmt(itemsVenta.reduce((s, i) => s + i.subtotal, 0))}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="px-8 py-5 border-t border-gray-200 flex-shrink-0 gap-2">
            <button onClick={() => { setNuevaVentaOpen(false); resetNuevaVenta(); }}
              style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">Cancelar</button>
            <button onClick={async () => {
              if (!nombreCliente.trim()) { toast.error('El nombre es obligatorio'); return; }
              if (!emailCliente.trim()) { toast.error('El email del cliente es obligatorio'); return; }
              if (!telefonoCliente.trim()) { toast.error('El teléfono del cliente es obligatorio'); return; }
              if (itemsVenta.length === 0) { toast.error('Agrega al menos un producto'); return; }
              setSaving(true);
              try {
                await postJson('/api/pedidos', {
                  NombreCliente: nombreCliente,
                  DocumentoCliente: documentoCliente || undefined,
                  EmailCliente: emailCliente,
                  TelefonoCliente: telefonoCliente,
                  DireccionEnvio: 'Venta presencial',
                  Ciudad: 'N/A',
                  MetodoPago: metodoPago,
                  Notas: notasVenta,
                  Estado: 'Aprobado',
                  Items: itemsVenta.map(i => ({ ProductoID: i.productoID, Cantidad: i.cantidad, TallaID: i.tallaID, ColorID: i.colorID, TallaNombre: i.tallaNombre, ColorNombre: i.colorNombre, PrecioUnitario: i.precio > 0 ? i.precio : undefined })),
                });
                toast.success('Venta registrada correctamente');
                setNuevaVentaOpen(false); resetNuevaVenta(); loadData();
              } catch (e: any) {
                toast.error(e?.data?.message || 'Error registrando venta');
              } finally { setSaving(false); }
            }} disabled={saving} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
              className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2 transition-colors">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Registrar Venta
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};