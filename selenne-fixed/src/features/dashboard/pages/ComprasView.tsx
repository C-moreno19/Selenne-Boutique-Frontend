import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Eye, Edit, Trash2, ChevronRight, Loader2, RefreshCw, X, Package, Archive, ClipboardList } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../../components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { getJson, postJson, putJson } from '../../../services/api';
import api from '../../../services/api';

interface Proveedor { proveedorID: number; nombre: string; documento?: string; }
interface Producto { productoID: number; nombre: string; codigo: string; precioVenta: number; }
interface DetalleCompra { productoID: number; nombreProducto: string; cantidad: number; precioUnitario: number; total: number; }
interface Compra {
  compraID: number; proveedorID: number; proveedorNombre?: string; proveedorDocumento?: string;
  ordenFactura: string; fecha: string; total: number; estado: string; notas?: string;
  detalles?: DetalleCompra[];
}

const ESTADOS = ['Pendiente', 'En Proceso', 'Completado', 'Cancelado'];
const ESTADOS_ACTIVOS = ['Pendiente', 'En Proceso'];
const fmt = (n: number) => `$${new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)} COP`;
const estadoColor = (e: string) => {
  if (e === 'Pendiente') return 'bg-yellow-100 text-yellow-700';
  if (e === 'En Proceso') return 'bg-blue-100 text-blue-700';
  if (e === 'Completado') return 'bg-green-100 text-green-700';
  return 'bg-red-100 text-red-700';
};

interface ComprasViewProps { onNavigateToHistorial?: () => void; }

export const ComprasView: React.FC<ComprasViewProps> = ({ onNavigateToHistorial }) => {
  const { hasPermission } = useAuth();
  const puedeCrear = hasPermission('compras:crear');
  const puedeEditar = hasPermission('compras:editar');
  const puedeEliminar = hasPermission('compras:eliminar');

  const [compras, setCompras] = useState<Compra[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [nuevaOpen, setNuevaOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [estadoOpen, setEstadoOpen] = useState(false);
  const [selectedCompra, setSelectedCompra] = useState<Compra | null>(null);
  const [saving, setSaving] = useState(false);
  const [nuevoEstado, setNuevoEstado] = useState('');
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  const [proveedorID, setProveedorID] = useState('');
  const [ordenFactura, setOrdenFactura] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [notas, setNotas] = useState('');
  const [detalles, setDetalles] = useState<DetalleCompra[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const loadData = useCallback(async () => {
    try {
      const [comprasRes, provRes, prodRes] = await Promise.allSettled([
        getJson('/api/compras'), getJson('/api/proveedores'), getJson('/api/productos?estado=activo'),
      ]);
      
      if (provRes.status === 'fulfilled') {
        const provData = provRes.value?.data || provRes.value || [];
        setProveedores(Array.isArray(provData) ? provData.map((p: any) => ({
          proveedorID: p.proveedorID ?? p.ProveedorID,
          nombre: p.nombre ?? p.Nombre ?? '',
          documento: p.documento ?? p.Documento ?? undefined,
        })) : []);
      }

      if (prodRes.status === 'fulfilled') {
        const prodData = prodRes.value?.data || prodRes.value || [];
        setProductos(Array.isArray(prodData) ? prodData.map((p: any) => ({
          productoID: p.productoID ?? p.ProductoID,
          nombre: p.nombre ?? p.Nombre ?? '',
          codigo: p.codigo ?? p.Codigo ?? '',
          precioVenta: p.precioVenta ?? p.PrecioVenta ?? 0,
        })) : []);
      }

      if (comprasRes.status === 'fulfilled') {
        const comprasData = comprasRes.value?.data || comprasRes.value || [];
        setCompras(Array.isArray(comprasData) ? comprasData.map((c: any): Compra => ({
          compraID: c.compraID ?? c.CompraID,
          proveedorID: c.proveedorID ?? c.ProveedorID,
          proveedorNombre: c.proveedor?.nombre ?? c.Proveedor?.Nombre ?? '',
          proveedorDocumento: c.proveedor?.documento ?? c.Proveedor?.Documento ?? '',
          ordenFactura: c.ordenFactura ?? '',
          fecha: c.fecha ?? '',
          total: c.total ?? 0,
          estado: c.estado ?? 'Pendiente',
          notas: c.notas ?? '',
          detalles: (c.detalles ?? []).map((d: any) => ({
            productoID: d.productoID,
            nombreProducto: d.nombreProducto ?? '',
            cantidad: d.cantidad ?? 0,
            precioUnitario: d.precioUnitario ?? 0,
            total: d.total ?? 0,
          })),
        })).filter((c: Compra) => ESTADOS_ACTIVOS.includes(c.estado)) : []);
      }
    } catch { }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = compras.filter(c => {
    const q = searchQuery.toLowerCase();
    return c.ordenFactura.toLowerCase().includes(q) || (c.proveedorNombre || '').toLowerCase().includes(q);
  });

  const resetForm = () => {
    setProveedorID(''); setOrdenFactura(''); setFecha(new Date().toISOString().split('T')[0]);
    setNotas(''); setDetalles([]); setFormErrors({});
  };

  const openView = async (c: Compra) => {
    setSelectedCompra(c);
    setViewOpen(true);
    setLoadingDetalle(true);
    try {
      const res = await getJson(`/api/compras/${c.compraID}`);
      const data = res?.data || res;
      setSelectedCompra({
        ...c,
        proveedorDocumento: data?.proveedor?.documento ?? c.proveedorDocumento ?? '',
        detalles: (data?.detalles ?? []).map((d: any) => ({
          productoID: d.productoID,
          nombreProducto: d.nombreProducto ?? '',
          cantidad: d.cantidad ?? 0,
          precioUnitario: d.precioUnitario ?? 0,
          total: d.total ?? 0,
        })),
      });
    } catch { }
    finally { setLoadingDetalle(false); }
  };

  const openEdit = (c: Compra) => {
    setSelectedCompra(c);
    setProveedorID(String(c.proveedorID));
    setOrdenFactura(c.ordenFactura);
    setFecha(c.fecha.split('T')[0]);
    setNotas(c.notas || '');
    setDetalles(c.detalles || []);
    setFormErrors({});
    setEditOpen(true);
  };

  const agregarDetalle = () => {
    if (productos.length === 0) { toast.error('No hay productos registrados'); return; }
    const p = productos[0];
    setDetalles(prev => [...prev, { productoID: p.productoID, nombreProducto: p.nombre, cantidad: 1, precioUnitario: p.precioVenta, total: p.precioVenta }]);
  };

  const actualizarDetalle = (idx: number, field: string, value: any) => {
    setDetalles(prev => {
      const updated = [...prev];
      if (field === 'productoID') {
        const prod = productos.find(p => p.productoID === Number(value));
        if (prod) updated[idx] = { ...updated[idx], productoID: prod.productoID, nombreProducto: prod.nombre, precioUnitario: prod.precioVenta, total: updated[idx].cantidad * prod.precioVenta };
      } else if (field === 'cantidad') {
        updated[idx] = { ...updated[idx], cantidad: Number(value), total: Number(value) * updated[idx].precioUnitario };
      } else if (field === 'precioUnitario') {
        updated[idx] = { ...updated[idx], precioUnitario: Number(value), total: updated[idx].cantidad * Number(value) };
      }
      return updated;
    });
  };

  const totalCompra = detalles.reduce((s, d) => s + d.total, 0);

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!proveedorID) errors.proveedor = 'El proveedor es obligatorio';
    if (!ordenFactura.trim()) errors.ordenFactura = 'La orden de factura es obligatoria';
    if (detalles.length === 0) errors.detalles = 'Agrega al menos un producto';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const guardarCompra = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await postJson('/api/compras', {
        ProveedorID: Number(proveedorID), OrdenFactura: ordenFactura, Fecha: fecha, Total: totalCompra, Notas: notas,
        Detalles: detalles.map(d => ({ ProductoID: d.productoID, Cantidad: d.cantidad, PrecioUnitario: d.precioUnitario, Total: d.total }))
      });
      toast.success('Compra registrada');
      setNuevaOpen(false); resetForm(); loadData();
    } catch (e: any) { toast.error(e?.data?.message || 'Error registrando compra'); }
    finally { setSaving(false); }
  };

  const actualizarCompra = async () => {
    if (!validate() || !selectedCompra) return;
    setSaving(true);
    try {
      await api.fetchWithAuth(`/api/compras/${selectedCompra.compraID}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ProveedorID: Number(proveedorID), OrdenFactura: ordenFactura, Fecha: fecha, Total: totalCompra, Notas: notas }),
      });
      toast.success('Compra actualizada');
      setEditOpen(false); resetForm(); loadData();
    } catch { toast.error('Error actualizando compra'); }
    finally { setSaving(false); }
  };

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

  const cambiarEstado = async (compra: Compra, estado: string) => {
    setSaving(true);
    try {
      await putJson(`/api/compras/${compra.compraID}/estado`, { Estado: estado });
      toast.success(`Estado cambiado a ${estado}`);
      loadData();
    } catch (e: any) { toast.error(`Error: ${e.message}`); }
    finally { setSaving(false); }
  };

  const proveedorSeleccionado = proveedores.find(p => String(p.proveedorID) === proveedorID) ?? null;

  const formBodyJSX = (
    <div className="space-y-6 py-6 px-8">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h3 style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="font-semibold text-gray-800 text-base flex items-center gap-2"><ClipboardList className="w-4 h-4 text-gray-400" />Información de la Compra</h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <Label style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-medium text-gray-700">Proveedor <span className="text-red-500">*</span></Label>
            <Select value={proveedorID} onValueChange={v => setProveedorID(v)}>
              <SelectTrigger className={`h-10 ${formErrors.proveedor ? 'border-red-500' : 'border-gray-300'}`}>
                <SelectValue placeholder="Selecciona un proveedor..." />
              </SelectTrigger>
              <SelectContent>
                {proveedores.length === 0
                  ? <SelectItem value="none" disabled>No hay proveedores registrados</SelectItem>
                  : proveedores.map(p => <SelectItem key={p.proveedorID} value={String(p.proveedorID)}>{p.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
            {formErrors.proveedor && <p className="text-red-500 text-xs">{formErrors.proveedor}</p>}
            {proveedorSeleccionado && (
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                <span className="text-xs text-gray-500 font-medium">NIT / Documento:</span>
                <span className="text-sm text-gray-800 font-semibold">
                  {proveedorSeleccionado.documento
                    ? proveedorSeleccionado.documento
                    : <span className="text-gray-400 font-normal italic">No registrado</span>}
                </span>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-medium text-gray-700">Orden / N° Factura <span className="text-red-500">*</span></Label>
            <Input value={ordenFactura} onChange={e => setOrdenFactura(e.target.value)}
              placeholder="Ej: FAC-2024-001" className={`h-10 ${formErrors.ordenFactura ? 'border-red-500' : 'border-gray-300'}`} />
            {formErrors.ordenFactura && <p className="text-red-500 text-xs">{formErrors.ordenFactura}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <Label style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-medium text-gray-700">Fecha de Compra</Label>
            <Input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="h-10 border-gray-300" />
          </div>
          <div className="flex flex-col gap-2">
            <Label style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-medium text-gray-700">Notas (opcional)</Label>
            <Input value={notas} onChange={e => setNotas(e.target.value)} placeholder="Observaciones..." className="h-10 border-gray-300" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="font-semibold text-gray-800 text-base flex items-center gap-2"><Package className="w-4 h-4 text-gray-400" />Productos <span className="text-red-500">*</span></h3>
          <button onClick={agregarDetalle} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
            className="px-4 py-2 bg-[#d65391] text-white rounded-lg hover:bg-[#c14a7f] text-sm flex items-center gap-2 transition-colors font-medium">
            <Plus className="w-4 h-4" /> Agregar producto
          </button>
        </div>
        <div className="p-6">
          {formErrors.detalles && <p className="text-red-500 text-sm mb-4">{formErrors.detalles}</p>}
          {detalles.length === 0 ? (
            <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-medium">Aún no has agregado productos</p>
              <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs mt-1">Haz clic en "Agregar producto" para comenzar</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {detalles.map((d, idx) => (
                <div key={idx} className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Producto #{idx + 1}</span>
                    <button onClick={() => setDetalles(prev => prev.filter((_, i) => i !== idx))}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <Label style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-medium text-gray-700">Producto</Label>
                      <Select value={String(d.productoID)} onValueChange={v => actualizarDetalle(idx, 'productoID', v)}>
                        <SelectTrigger className="h-10 bg-white border-gray-300"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {productos.map(p => <SelectItem key={p.productoID} value={String(p.productoID)}>{p.nombre} ({p.codigo})</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-medium text-gray-700">Cantidad</Label>
                      <Input type="number" min="1" value={d.cantidad} onChange={e => actualizarDetalle(idx, 'cantidad', e.target.value)} className="h-10 bg-white border-gray-300" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-medium text-gray-700">Precio Unit.</Label>
                      <Input type="number" min="0" value={d.precioUnitario} onChange={e => actualizarDetalle(idx, 'precioUnitario', e.target.value)} className="h-10 bg-white border-gray-300" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-medium text-gray-700">Total</Label>
                      <div className="h-10 flex items-center px-3 bg-pink-50 border border-pink-200 rounded-lg">
                        <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-bold text-[#d65391]">{fmt(d.total)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex justify-end pt-3 border-t border-gray-200 mt-2">
                <div className="text-right">
                  <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-500 mb-1">Total de la compra</p>
                  <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-2xl font-bold text-[#d65391]">{fmt(totalCompra)}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

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
        <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-medium text-gray-900">Gestión de Compras</span>
      </div>
      <h1 style={{ fontFamily: '"Times New Roman", Times, serif' }} className="text-4xl text-gray-900 mb-6">Gestión de Compras</h1>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col lg:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Buscar por orden o proveedor..." value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d65391]" />
        </div>
        <div className="flex gap-3">
          <button onClick={() => { setLoading(true); loadData(); }} className="px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            <RefreshCw className="w-5 h-5" />
          </button>
          <button onClick={onNavigateToHistorial} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
            className="px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors">
            <Archive className="w-5 h-5" /> Compras Finalizadas
          </button>
          {puedeCrear && (
            <button onClick={() => { resetForm(); setNuevaOpen(true); }} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
              className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 flex items-center gap-2 transition-colors">
              <Plus className="w-5 h-5" /> Nueva Compra
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['ORDEN FACTURA', 'PROVEEDOR', 'FECHA', 'TOTAL', 'ESTADO', 'ACCIONES'].map(h => (
                <th key={h} className="px-6 py-4 text-left">
                  <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs font-semibold uppercase tracking-wider text-gray-500">{h}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(compra => (
              <tr key={compra.compraID} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4"><span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="font-medium text-gray-900">{compra.ordenFactura}</span></td>
                <td className="px-6 py-4"><span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-gray-700">{compra.proveedorNombre || '—'}</span></td>
                <td className="px-6 py-4"><span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-600">{new Date(compra.fecha).toLocaleDateString('es-CO')}</span></td>
                <td className="px-6 py-4"><span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="font-semibold text-gray-900">{fmt(compra.total)}</span></td>
                <td className="px-6 py-4">
                  {puedeEditar ? (
                    <Select value={compra.estado} onValueChange={v => cambiarEstado(compra, v)}>
                      <SelectTrigger className={`h-8 w-36 text-xs font-medium rounded-full border-0 ${estadoColor(compra.estado)}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ESTADOS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${estadoColor(compra.estado)}`} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
                      {compra.estado}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => openView(compra)}
                      className="p-2 text-gray-500 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors" title="Ver detalles">
                      <Eye className="w-5 h-5" />
                    </button>
                    {puedeEditar && (
                      <button onClick={() => openEdit(compra)}
                        className="p-2 text-gray-500 hover:bg-yellow-50 hover:text-yellow-600 rounded-lg transition-colors" title="Editar">
                        <Edit className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>No hay compras activas</td></tr>
            )}
          </tbody>
        </table>
        <div className="px-6 py-4 border-t border-gray-100">
          <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-500">
            Mostrando <span className="font-medium text-gray-800">{filtered.length}</span> de <span className="font-medium text-gray-800">{compras.length}</span> compras activas
          </span>
        </div>
      </div>

      {/* Modal Nueva Compra */}
      <Dialog open={nuevaOpen} onOpenChange={v => { setNuevaOpen(v); if (!v) resetForm(); }}>
        <DialogContent className="max-w-3xl h-auto flex flex-col p-0 gap-0">
          <DialogHeader className="px-8 pt-6 pb-4 border-b border-gray-200 flex-shrink-0">
            <DialogTitle style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-2xl">Nueva Compra</DialogTitle>
            <DialogDescription style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>Registra una nueva compra a proveedor</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto max-h-[75vh]">
            {formBodyJSX}
          </div>
          <DialogFooter className="gap-2 px-8 py-5 border-t border-gray-200 flex-shrink-0">
            <button onClick={() => { setNuevaOpen(false); resetForm(); }} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">Cancelar</button>
            <button onClick={guardarCompra} disabled={saving} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
              className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2 transition-colors">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Registrar Compra
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Editar Compra */}
      <Dialog open={editOpen} onOpenChange={v => { setEditOpen(v); if (!v) resetForm(); }}>
        <DialogContent className="max-w-3xl h-auto flex flex-col p-0 gap-0">
          <DialogHeader className="px-8 pt-6 pb-4 border-b border-gray-200 flex-shrink-0">
            <DialogTitle style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-2xl">Editar Compra</DialogTitle>
            <DialogDescription style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>Modifica los datos de la compra</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto max-h-[75vh]">
            {formBodyJSX}
          </div>
          <DialogFooter className="gap-2 px-8 py-5 border-t border-gray-200 flex-shrink-0">
            <button onClick={() => { setEditOpen(false); resetForm(); }} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">Cancelar</button>
            <button onClick={actualizarCompra} disabled={saving} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
              className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2 transition-colors">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Guardar Cambios
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Ver Detalles */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-2xl h-auto flex flex-col p-0 gap-0">
          <DialogHeader className="px-8 pt-6 pb-4 border-b border-gray-200 flex-shrink-0">
            <DialogTitle style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-2xl">Detalles de Compra</DialogTitle>
          </DialogHeader>
          {selectedCompra && (
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-6 py-6 px-8">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <h3 style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="font-semibold text-gray-800 text-base">📋 Información General</h3>
                  </div>
                  <div className="p-6 grid grid-cols-2 gap-6">
                    <div className="flex flex-col gap-1"><p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-500 font-medium uppercase">Doc. Proveedor</p><p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-semibold text-gray-900">{selectedCompra.proveedorDocumento || '—'}</p></div>
                    <div className="flex flex-col gap-1"><p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-500 font-medium uppercase">Orden / Factura</p><p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-semibold text-gray-900">{selectedCompra.ordenFactura}</p></div>
                    <div className="flex flex-col gap-1"><p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-500 font-medium uppercase">Proveedor</p><p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-semibold text-gray-900">{selectedCompra.proveedorNombre}</p></div>
                    <div className="flex flex-col gap-1"><p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-500 font-medium uppercase">Fecha</p><p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-semibold text-gray-900">{new Date(selectedCompra.fecha).toLocaleDateString('es-CO')}</p></div>
                    <div className="flex flex-col gap-1"><p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-500 font-medium uppercase">Estado</p><span className={`px-3 py-1 rounded-full text-xs font-medium w-fit ${estadoColor(selectedCompra.estado)}`}>{selectedCompra.estado}</span></div>
                    <div className="flex flex-col gap-1"><p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-500 font-medium uppercase">Total</p><p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-2xl font-bold text-[#d65391]">{fmt(selectedCompra.total)}</p></div>
                    {selectedCompra.notas && <div className="flex flex-col gap-1 col-span-2"><p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-500 font-medium uppercase">Notas</p><p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-700">{selectedCompra.notas}</p></div>}
                  </div>
                </div>
                {loadingDetalle ? (
                  <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
                ) : selectedCompra.detalles && selectedCompra.detalles.length > 0 ? (
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                      <h3 style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="font-semibold text-gray-800 text-base">📦 Productos comprados</h3>
                    </div>
                    <div className="p-6 space-y-3">
                      {selectedCompra.detalles.map((d, i) => (
                        <div key={i} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                          <div>
                            <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-semibold text-gray-900">{d.nombreProducto}</p>
                            <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-500 mt-0.5">Cantidad: <span className="font-medium text-gray-700">{d.cantidad}</span> &nbsp;·&nbsp; Precio unitario: <span className="font-medium text-gray-700">{fmt(d.precioUnitario)}</span></p>
                          </div>
                          <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="font-bold text-gray-900">{fmt(d.total)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 px-8 py-5 border-t border-gray-200 flex-shrink-0">
            <button onClick={() => setViewOpen(false)} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">Cerrar</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};