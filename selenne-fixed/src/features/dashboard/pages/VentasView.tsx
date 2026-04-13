import React, { useState, useEffect, useCallback } from 'react';
import { Search, Eye, Archive, Plus, ChevronRight, Loader2, RefreshCw, Trash2, X, Package, Truck } from 'lucide-react';
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

interface PedidoDetalle { productoNombre: string; imagenProducto?: string; cantidad: number; precioUnitario: number; subtotal: number; talla?: string; color?: string; }
interface ProductoSimple { productoID: number; nombre: string; precio: number; tallas: { tallaID: number; nombre: string }[]; colores: { colorID: number; nombre: string }[]; }
interface ItemVenta { productoID: number; productoNombre: string; precio: number; tallaID?: number; tallaNombre?: string; colorID?: number; colorNombre?: string; cantidad: number; subtotal: number; }
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
  const [emailGuiaOpen, setEmailGuiaOpen] = useState(false);
  const [numeroGuia, setNumeroGuia] = useState('');
  const [transportadora, setTransportadora] = useState('');
  const [fotoGuia, setFotoGuia] = useState<File | null>(null);
  const [nombreCliente, setNombreCliente] = useState('');
  const [emailCliente, setEmailCliente] = useState('');
  const [telefonoCliente, setTelefonoCliente] = useState('');
  const [documentoCliente, setDocumentoCliente] = useState('');
  const [metodoPago, setMetodoPago] = useState('Transferencia');
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
        tallas: (p.tallas ?? p.Tallas ?? []).map((t: any) => ({ tallaID: t.tallaID ?? t.TallaID, nombre: t.nombre ?? t.Nombre ?? '' })),
        colores: (p.colores ?? p.Colores ?? []).map((c: any) => ({ colorID: c.colorID ?? c.ColorID, nombre: c.nombre ?? c.Nombre ?? '' })),
      })) : []);
    } catch { }
  };

  const agregarItemVenta = () => {
    if (productosDisponibles.length === 0) return;
    const p = productosDisponibles[0];
    setItemsVenta(prev => [...prev, { productoID: p.productoID, productoNombre: p.nombre, precio: p.precio, cantidad: 1, subtotal: p.precio }]);
  };

  const actualizarItemVenta = (idx: number, field: string, value: any) => {
    setItemsVenta(prev => {
      const updated = [...prev];
      const item = { ...updated[idx] };
      if (field === 'productoID') {
        const prod = productosDisponibles.find(p => p.productoID === Number(value));
        if (prod) { item.productoID = prod.productoID; item.productoNombre = prod.nombre; item.precio = prod.precio; item.tallaID = undefined; item.tallaNombre = undefined; item.colorID = undefined; item.colorNombre = undefined; item.subtotal = prod.precio * item.cantidad; }
      } else if (field === 'cantidad') {
        item.cantidad = Math.max(1, Number(value)); item.subtotal = item.precio * item.cantidad;
      } else if (field === 'tallaID') {
        const prod = productosDisponibles.find(p => p.productoID === item.productoID);
        const t = prod?.tallas.find(t => t.tallaID === Number(value));
        item.tallaID = t?.tallaID; item.tallaNombre = t?.nombre;
      } else if (field === 'colorID') {
        const prod = productosDisponibles.find(p => p.productoID === item.productoID);
        const c = prod?.colores.find(c => c.colorID === Number(value));
        item.colorID = c?.colorID; item.colorNombre = c?.nombre;
      }
      updated[idx] = item;
      return updated;
    });
  };

  const resetNuevaVenta = () => {
    setNombreCliente(''); setEmailCliente(''); setTelefonoCliente(''); setDocumentoCliente('');
    setNotasVenta(''); setItemsVenta([]);
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
      toast.success('Correo de envío enviado');
      setEmailGuiaOpen(false);
      setNumeroGuia('');
      setTransportadora('');
      setFotoGuia(null);
    } catch (e: any) { toast.error(e?.data?.message || e?.message || 'Error enviando correo de envío'); }
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
            <button onClick={() => { setNuevaVentaOpen(true); loadProductos(); }} style={{ fontFamily: 'Inter, sans-serif' }}
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
            {filtered.map((p, idx) => (
              <tr key={p.pedidoID} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4"><span style={{ fontFamily: 'Inter, sans-serif' }} className="font-medium text-gray-900">#{idx + 1}</span></td>
                <td className="px-6 py-4">
                  <p style={{ fontFamily: 'Inter, sans-serif' }} className="font-medium text-gray-900">{p.nombreCliente}</p>
                  <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-500">{p.emailCliente}</p>
                </td>
                <td className="px-6 py-4"><span style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-600">{new Date(p.fechaPedido).toLocaleDateString('es-CO')}</span></td>
                <td className="px-6 py-4"><span style={{ fontFamily: 'Inter, sans-serif' }} className="font-semibold">{fmt(p.total)}</span></td>
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
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${estadoColor(p.estado)}`} style={{ fontFamily: 'Inter, sans-serif' }}>{p.estado}</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setSelectedPedido(p); setViewOpen(true); }}
                      className="p-2 text-gray-500 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors" title="Ver detalles">
                      <Eye className="w-5 h-5" />
                    </button>
                    <button onClick={() => { setSelectedPedido(p); setEmailGuiaOpen(true); }}
                      className="p-2 text-gray-500 hover:bg-green-50 hover:text-green-600 rounded-lg transition-colors" title="Enviar correo de guía">
                      <Truck className="w-5 h-5" />
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
                        <div key={i} className="flex gap-4 items-start p-4 bg-gray-50 rounded-xl">
                          {d.imagenProducto && (
                            <img src={d.imagenProducto} alt={d.productoNombre}
                              className="w-16 h-16 object-cover rounded-lg flex-shrink-0 border border-gray-200" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm font-semibold text-gray-900">{d.productoNombre}</p>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {d.talla && <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">Talla: {d.talla}</span>}
                              {d.color && <span className="text-xs bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full">Color: {d.color}</span>}
                              <span className="text-xs text-gray-500">{d.cantidad} x {fmt(d.precioUnitario)}</span>
                            </div>
                          </div>
                          <p style={{ fontFamily: 'Inter, sans-serif' }} className="font-bold text-gray-900 flex-shrink-0">{fmt(d.subtotal)}</p>
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
      {/* Modal Email Guía */}
      <Dialog open={emailGuiaOpen} onOpenChange={v => { setEmailGuiaOpen(v); if (!v) { setNumeroGuia(''); setTransportadora(''); setFotoGuia(null); } }}>
        <DialogContent className="max-w-md flex flex-col p-0 gap-0 max-h-[90vh]">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100 flex-shrink-0">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 bg-[#fce7f3] rounded-xl flex items-center justify-center flex-shrink-0">
                <Truck className="w-5 h-5 text-[#d65391]" />
              </div>
              <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }} className="text-xl">
                Notificación de Envío
              </DialogTitle>
            </div>
            <DialogDescription style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-500 ml-12">
              Para <strong className="text-gray-700">{selectedPedido?.nombreCliente}</strong> · pedido <strong className="text-gray-700">#{selectedPedido?.pedidoID}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm font-medium text-gray-700">Número de guía</Label>
                <Input value={numeroGuia} onChange={e => setNumeroGuia(e.target.value)}
                  placeholder="Ej: 123456789" className="h-10 border-gray-200 rounded-xl bg-gray-50 focus:ring-[#d65391]" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm font-medium text-gray-700">Transportadora</Label>
                <Input value={transportadora} onChange={e => setTransportadora(e.target.value)}
                  placeholder="Ej: Servientrega" className="h-10 border-gray-200 rounded-xl bg-gray-50 focus:ring-[#d65391]" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm font-medium text-gray-700">
                Foto del paquete <span className="text-gray-400 font-normal">(opcional)</span>
              </Label>
              <label className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-[#d65391] hover:bg-[#fdf2f8] transition-colors">
                <Package className="w-5 h-5 text-gray-400" />
                <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-500">
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
            <button onClick={() => setEmailGuiaOpen(false)} style={{ fontFamily: 'Inter, sans-serif' }}
              className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors text-sm font-medium">
              Cancelar
            </button>
            <button onClick={enviarEmailGuia} disabled={saving} style={{ fontFamily: 'Inter, sans-serif' }}
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
            <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }} className="text-2xl">Nueva Venta Manual</DialogTitle>
            <DialogDescription style={{ fontFamily: 'Inter, sans-serif' }}>Registra una venta directamente sin pasar por el checkout del cliente</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-8 space-y-6">
            {/* Datos del cliente */}
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
                  <Label style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm font-medium text-gray-700">Documento <span className="text-gray-400 text-xs">(opcional)</span></Label>
                  <Input value={documentoCliente} onChange={e => setDocumentoCliente(e.target.value)} placeholder="Cédula o NIT" className="h-10 border-gray-300" />
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
                <div className="flex flex-col gap-2">
                  <Label style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm font-medium text-gray-700">Notas</Label>
                  <Input value={notasVenta} onChange={e => setNotasVenta(e.target.value)} placeholder="Observaciones de la venta..." className="h-10 border-gray-300" />
                </div>
              </div>
            </div>

            {/* Productos */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex items-center justify-between">
                <p style={{ fontFamily: 'Inter, sans-serif' }} className="font-semibold text-sm text-gray-700">📦 Productos <span className="text-red-500">*</span></p>
                <button onClick={agregarItemVenta} disabled={productosDisponibles.length === 0}
                  style={{ fontFamily: 'Inter, sans-serif' }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#d65391] text-white text-xs font-semibold rounded-lg hover:bg-[#c14a7f] disabled:opacity-40 transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Agregar producto
                </button>
              </div>
              <div className="p-6">
                {itemsVenta.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <Package className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                    <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-400">Agrega al menos un producto</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {itemsVenta.map((item, idx) => {
                      const prod = productosDisponibles.find(p => p.productoID === item.productoID);
                      return (
                        <div key={idx} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                          <div className="flex justify-between items-center mb-3">
                            <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs font-semibold text-gray-400 uppercase">Producto #{idx + 1}</span>
                            <button type="button" title="Eliminar producto" onClick={() => setItemsVenta(prev => prev.filter((_, i) => i !== idx))}
                              className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1 col-span-2">
                              <Label style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs font-medium text-gray-600">Producto</Label>
                              <Select value={String(item.productoID)} onValueChange={v => actualizarItemVenta(idx, 'productoID', v)}>
                                <SelectTrigger className="h-9 bg-white border-gray-300 text-sm"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {productosDisponibles.map(p => <SelectItem key={p.productoID} value={String(p.productoID)}>{p.nombre}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                            {prod && prod.tallas.length > 0 && (
                              <div className="flex flex-col gap-1">
                                <Label style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs font-medium text-gray-600">Talla</Label>
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
                                <Label style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs font-medium text-gray-600">Color</Label>
                                <Select value={item.colorID ? String(item.colorID) : ''} onValueChange={v => actualizarItemVenta(idx, 'colorID', v)}>
                                  <SelectTrigger className="h-9 bg-white border-gray-300 text-sm"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                                  <SelectContent>
                                    {prod.colores.map(c => <SelectItem key={c.colorID} value={String(c.colorID)}>{c.nombre}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                            <div className="flex flex-col gap-1">
                              <Label style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs font-medium text-gray-600">Cantidad</Label>
                              <Input type="number" min="1" value={item.cantidad} onChange={e => actualizarItemVenta(idx, 'cantidad', e.target.value)} className="h-9 bg-white border-gray-300 text-sm" />
                            </div>
                            <div className="flex flex-col gap-1">
                              <Label style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs font-medium text-gray-600">Subtotal</Label>
                              <div className="h-9 flex items-center px-3 bg-pink-50 border border-pink-200 rounded-lg">
                                <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm font-bold text-[#d65391]">{fmt(item.subtotal)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div className="flex justify-end pt-2 border-t border-gray-200">
                      <div className="text-right">
                        <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-500">Total</p>
                        <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-2xl font-bold text-[#d65391]">{fmt(itemsVenta.reduce((s, i) => s + i.subtotal, 0))}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="px-8 py-5 border-t border-gray-200 flex-shrink-0 gap-2">
            <button onClick={() => { setNuevaVentaOpen(false); resetNuevaVenta(); }}
              style={{ fontFamily: 'Inter, sans-serif' }} className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">Cancelar</button>
            <button onClick={async () => {
              if (!nombreCliente.trim()) { toast.error('El nombre es obligatorio'); return; }
              if (itemsVenta.length === 0) { toast.error('Agrega al menos un producto'); return; }
              setSaving(true);
              try {
                await postJson('/api/pedidos', {
                  NombreCliente: nombreCliente,
                  DocumentoCliente: documentoCliente || undefined,
                  EmailCliente: emailCliente || 'sin-email@selenne.com',
                  TelefonoCliente: telefonoCliente || 'N/A',
                  DireccionEnvio: 'Venta presencial',
                  Ciudad: 'N/A',
                  MetodoPago: metodoPago,
                  Notas: notasVenta,
                  Items: itemsVenta.map(i => ({ ProductoID: i.productoID, Cantidad: i.cantidad, TallaID: i.tallaID, ColorID: i.colorID, TallaNombre: i.tallaNombre, ColorNombre: i.colorNombre })),
                });
                toast.success('Venta registrada correctamente');
                setNuevaVentaOpen(false); resetNuevaVenta(); loadData();
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