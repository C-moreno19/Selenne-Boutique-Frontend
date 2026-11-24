import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Eye, Edit, Trash2, ChevronRight, Loader2, RefreshCw, X, Package, Archive, ClipboardList } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../../components/ui/dialog';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { toast } from '@/lib/toast';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { getJson, postJson, putJson } from '../../../services/api';
import api from '../../../services/api';

interface Proveedor { proveedorID: number; nombre: string; documento?: string; }
interface Producto { productoID: number; nombre: string; codigo: string; precioVenta: number; precioCompra?: number; }
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
  if (e === 'Pendiente') return 'bg-yellow-100 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-400';
  if (e === 'En Proceso') return 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400';
  if (e === 'Completado') return 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400';
  return 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400';
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
          precioCompra: p.precioCompra ?? p.PrecioCompra ?? 0,
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
    setDetalles(prev => [...prev, { productoID: p.productoID, nombreProducto: p.nombre, cantidad: 1, precioUnitario: p.precioCompra ?? 0, total: p.precioCompra ?? 0 }]);
  };

  const actualizarDetalle = (idx: number, field: string, value: any) => {
    setDetalles(prev => {
      const updated = [...prev];
      if (field === 'productoID') {
        const prod = productos.find(p => p.productoID === Number(value));
        if (prod) updated[idx] = { ...updated[idx], productoID: prod.productoID, nombreProducto: prod.nombre, precioUnitario: prod.precioCompra ?? 0, total: updated[idx].cantidad * (prod.precioCompra ?? 0) };
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
    } catch (e: any) { toast.error(e?.data?.message || e?.message || 'Error registrando compra'); }
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
      <div className="bg-white dark:bg-[#1e1530] rounded-none border border-[#E7E0DA] dark:border-[#3A2E4D] shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-[#0A0A0A] via-[#3B0A45] to-[#5C2A52] px-6 py-4">
          <h3 style={{ fontFamily: '"Playfair Display", Georgia, serif' }} className="font-semibold text-white text-base flex items-center gap-2"><ClipboardList className="w-4 h-4 text-[#C9A8C3]" />Información de la Compra</h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <Label style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-medium text-gray-700 dark:text-[#F5F3FA]">Proveedor <span className="text-red-500">*</span></Label>
            <Select value={proveedorID} onValueChange={v => setProveedorID(v)}>
              <SelectTrigger className={`h-10 ${formErrors.proveedor ? 'border-red-500' : 'border-gray-300 dark:border-[#3A2E4D]'}`}>
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
              <div className="flex items-center gap-2 px-3 py-2 bg-[#F7F5FC] dark:bg-[#17101f] border border-[#E7E0DA] dark:border-[#3A2E4D] rounded-none">
                <span className="text-xs text-gray-500 dark:text-[#b9aedd] font-medium">NIT / Documento:</span>
                <span className="text-sm text-[#0A0A0A] dark:text-[#F5F3FA] font-semibold">
                  {proveedorSeleccionado.documento
                    ? proveedorSeleccionado.documento
                    : <span className="text-gray-400 dark:text-[#b9aedd] font-normal italic">No registrado</span>}
                </span>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-medium text-gray-700 dark:text-[#F5F3FA]">Orden / N° Factura <span className="text-red-500">*</span></Label>
            <Input value={ordenFactura} onChange={e => setOrdenFactura(e.target.value)}
              placeholder="Ej: FAC-2024-001" className={`h-10 ${formErrors.ordenFactura ? 'border-red-500' : 'border-gray-300 dark:border-[#3A2E4D]'}`} />
            {formErrors.ordenFactura && <p className="text-red-500 text-xs">{formErrors.ordenFactura}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <Label style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-medium text-gray-700 dark:text-[#F5F3FA]">Fecha de Compra</Label>
            <Input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="h-10 border-gray-300 dark:border-[#3A2E4D]" />
          </div>
          <div className="flex flex-col gap-2">
            <Label style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-medium text-gray-700 dark:text-[#F5F3FA]">Notas (opcional)</Label>
            <Input value={notas} onChange={e => setNotas(e.target.value)} placeholder="Observaciones..." className="h-10 border-gray-300 dark:border-[#3A2E4D]" />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1e1530] rounded-none border border-[#E7E0DA] dark:border-[#3A2E4D] shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-[#0A0A0A] via-[#3B0A45] to-[#5C2A52] px-6 py-4 flex items-center justify-between">
          <h3 style={{ fontFamily: '"Playfair Display", Georgia, serif' }} className="font-semibold text-white text-base flex items-center gap-2"><Package className="w-4 h-4 text-[#C9A8C3]" />Productos <span className="text-red-500">*</span></h3>
          <button onClick={agregarDetalle} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
            className="px-4 py-2 bg-[#5C2A52] text-white rounded-none hover:bg-[#3B0A45] text-sm flex items-center gap-2 transition font-medium">
            <Plus className="w-4 h-4" /> Agregar producto
          </button>
        </div>
        <div className="p-6">
          {formErrors.detalles && <p className="text-red-500 text-sm mb-4">{formErrors.detalles}</p>}
          {detalles.length === 0 ? (
            <div className="text-center py-10 text-gray-400 dark:text-[#b9aedd] bg-[#F7F5FC] dark:bg-[#17101f] rounded-none border-2 border-dashed border-[#E7E0DA] dark:border-[#3A2E4D]">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-medium">Aún no has agregado productos</p>
              <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs mt-1">Haz clic en "Agregar producto" para comenzar</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {detalles.map((d, idx) => (
                <div key={idx} className="bg-[#F7F5FC] dark:bg-[#17101f] rounded-none p-5 border border-[#E7E0DA] dark:border-[#3A2E4D]">
                  <div className="flex justify-between items-center mb-4">
                    <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs font-semibold text-gray-400 dark:text-[#b9aedd] uppercase tracking-wide">Producto #{idx + 1}</span>
                    <button onClick={() => setDetalles(prev => prev.filter((_, i) => i !== idx))}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-none transition">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <Label style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-medium text-gray-700 dark:text-[#F5F3FA]">Producto</Label>
                      <Select value={String(d.productoID)} onValueChange={v => actualizarDetalle(idx, 'productoID', v)}>
                        <SelectTrigger className="h-10 bg-white dark:bg-[#1e1530] border-gray-300 dark:border-[#3A2E4D]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {productos.map(p => <SelectItem key={p.productoID} value={String(p.productoID)}>{p.nombre} ({p.codigo})</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-medium text-gray-700 dark:text-[#F5F3FA]">Cantidad</Label>
                      <Input type="number" min="1" value={d.cantidad || ''} onChange={e => actualizarDetalle(idx, 'cantidad', e.target.value)} className="h-10 bg-white dark:bg-[#1e1530] border-gray-300 dark:border-[#3A2E4D]" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-medium text-gray-700 dark:text-[#F5F3FA]">Precio Costo</Label>
                      <Input type="number" min="0" value={d.precioUnitario || ''} onChange={e => actualizarDetalle(idx, 'precioUnitario', e.target.value)} className="h-10 bg-white dark:bg-[#1e1530] border-gray-300 dark:border-[#3A2E4D]" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-medium text-gray-700 dark:text-[#F5F3FA]">Total</Label>
                      <div className="h-10 flex items-center px-3 bg-pink-50 dark:bg-[#241935] border border-pink-200 dark:border-[#4a3540] rounded-none">
                        <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-bold text-[#5C2A52]">{fmt(d.total)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex justify-end pt-3 border-t border-[#E7E0DA] dark:border-[#3A2E4D] mt-2">
                <div className="text-right">
                  <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-500 dark:text-[#b9aedd] mb-1">Total de la compra</p>
                  <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-2xl font-bold text-[#5C2A52]">{fmt(totalCompra)}</p>
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
      <Loader2 className="w-8 h-8 animate-spin text-[#5C2A52]" />
    </div>
  );

  return (
    <div className="p-8 bg-[#F7F5FC] dark:bg-[#17101f] min-h-screen">
      <div className="flex items-center gap-2 mb-4">
        <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-500 dark:text-[#b9aedd]">Dashboard</span>
        <ChevronRight className="w-4 h-4 text-[#C9A8C3]" />
        <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-medium text-[#0A0A0A] dark:text-[#F5F3FA]">Gestión de Compras</span>
      </div>
      <h1 className="admin-page-title text-4xl text-[#0A0A0A] dark:text-[#F5F3FA] mb-6">Gestión de Compras</h1>

      <div className="bg-white dark:bg-[#1e1530] rounded-none p-6 shadow-sm border border-[#E7E0DA] dark:border-[#3A2E4D] flex flex-col lg:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#C9A8C3]" />
          <input type="text" placeholder="Buscar por orden o proveedor..." value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
            className="w-full pl-12 pr-4 py-3 bg-[#F7F5FC] dark:bg-[#17101f] border border-[#E7E0DA] dark:border-[#3A2E4D] rounded-none focus:outline-none focus:ring-2 focus:ring-[#5C2A52]" />
        </div>
        <div className="flex gap-3">
          <button onClick={() => { setLoading(true); loadData(); }} className="px-4 py-3 bg-white dark:bg-[#1e1530] border border-[#E7E0DA] dark:border-[#3A2E4D] text-gray-700 dark:text-[#F5F3FA] rounded-none hover:bg-[#F7F5FC] dark:hover:bg-[#221830] transition">
            <RefreshCw className="w-5 h-5" />
          </button>
          <button onClick={onNavigateToHistorial} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
            className="px-4 py-3 bg-white dark:bg-[#1e1530] border border-[#E7E0DA] dark:border-[#3A2E4D] text-gray-700 dark:text-[#F5F3FA] rounded-none hover:bg-[#F7F5FC] dark:hover:bg-[#221830] flex items-center gap-2 transition">
            <Archive className="w-5 h-5" /> Compras Finalizadas
          </button>
          {puedeCrear && (
            <button onClick={() => { resetForm(); setNuevaOpen(true); }} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
              className="px-6 py-3 bg-gradient-to-r from-[#0A0A0A] via-[#3B0A45] to-[#5C2A52] text-white rounded-none hover:opacity-90 flex items-center gap-2 transition">
              <Plus className="w-5 h-5" /> Nueva Compra
            </button>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-[#1e1530] rounded-none shadow-sm border border-[#E7E0DA] dark:border-[#3A2E4D] overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#F7F5FC] dark:bg-[#17101f] border-b border-[#E7E0DA] dark:border-[#3A2E4D]">
            <tr>
              {['ORDEN FACTURA', 'PROVEEDOR', 'FECHA', 'TOTAL', 'ESTADO', 'ACCIONES'].map(h => (
                <th key={h} className="px-6 py-4 text-left">
                  <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-[#b9aedd]">{h}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-[#3A2E4D]">
            {filtered.map(compra => (
              <tr key={compra.compraID} className="hover:bg-[#F7F5FC] dark:hover:bg-[#221830] transition">
                <td className="px-6 py-4"><span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="font-medium text-[#0A0A0A] dark:text-[#F5F3FA]">{compra.ordenFactura}</span></td>
                <td className="px-6 py-4"><span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-gray-700 dark:text-[#F5F3FA]">{compra.proveedorNombre || '—'}</span></td>
                <td className="px-6 py-4"><span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-600 dark:text-[#b9aedd]">{new Date(compra.fecha).toLocaleDateString('es-CO')}</span></td>
                <td className="px-6 py-4"><span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="font-semibold text-[#0A0A0A] dark:text-[#F5F3FA]">{fmt(compra.total)}</span></td>
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
                      className="p-2 text-gray-500 dark:text-[#b9aedd] hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400 rounded-none transition" title="Ver detalles">
                      <Eye className="w-5 h-5" />
                    </button>
                    {puedeEditar && (
                      <button onClick={() => openEdit(compra)}
                        className="p-2 text-gray-500 dark:text-[#b9aedd] hover:bg-yellow-50 dark:hover:bg-yellow-950/40 hover:text-yellow-600 dark:hover:text-yellow-400 rounded-none transition" title="Editar">
                        <Edit className="w-5 h-5" />
                      </button>
                    )}
                    {puedeEliminar && (
                      <button onClick={() => { setSelectedCompra(compra); setDeleteOpen(true); }}
                        className="p-2 text-gray-500 dark:text-[#b9aedd] hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-400 rounded-none transition" title="Eliminar">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400 dark:text-[#b9aedd]" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>No hay compras activas</td></tr>
            )}
          </tbody>
        </table>
        <div className="px-6 py-4 border-t border-[#E7E0DA] dark:border-[#3A2E4D]">
          <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-500 dark:text-[#b9aedd]">
            Mostrando <span className="font-medium text-[#0A0A0A] dark:text-[#F5F3FA]">{filtered.length}</span> de <span className="font-medium text-[#0A0A0A] dark:text-[#F5F3FA]">{compras.length}</span> compras activas
          </span>
        </div>
      </div>

      {/* Modal Nueva Compra */}
      <Dialog open={nuevaOpen} onOpenChange={v => { setNuevaOpen(v); if (!v) resetForm(); }}>
        <DialogContent className="max-w-3xl h-auto flex flex-col p-0 gap-0">
          <DialogHeader className="px-8 pt-6 pb-4 border-b border-[#E7E0DA] dark:border-[#3A2E4D] flex-shrink-0">
            <DialogTitle style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-2xl">Nueva Compra</DialogTitle>
            <DialogDescription style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>Registra una nueva compra a proveedor</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto max-h-[75vh]">
            {formBodyJSX}
          </div>
          <DialogFooter className="gap-2 px-8 py-5 border-t border-[#E7E0DA] dark:border-[#3A2E4D] flex-shrink-0">
            <button onClick={() => { setNuevaOpen(false); resetForm(); }} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
              className="px-6 py-2 bg-gray-100 dark:bg-[#221830] text-gray-700 dark:text-[#F5F3FA] rounded-none hover:bg-gray-200 dark:hover:bg-[#241935] transition">Cancelar</button>
            <button onClick={guardarCompra} disabled={saving} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
              className="px-6 py-2 bg-gradient-to-r from-[#0A0A0A] via-[#3B0A45] to-[#5C2A52] text-white rounded-none hover:opacity-90 disabled:opacity-50 flex items-center gap-2 transition">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Registrar Compra
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Editar Compra */}
      <Dialog open={editOpen} onOpenChange={v => { setEditOpen(v); if (!v) resetForm(); }}>
        <DialogContent className="max-w-3xl h-auto flex flex-col p-0 gap-0">
          <DialogHeader className="px-8 pt-6 pb-4 border-b border-[#E7E0DA] dark:border-[#3A2E4D] flex-shrink-0">
            <DialogTitle style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-2xl">Editar Compra</DialogTitle>
            <DialogDescription style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>Modifica los datos de la compra</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto max-h-[75vh]">
            {formBodyJSX}
          </div>
          <DialogFooter className="gap-2 px-8 py-5 border-t border-[#E7E0DA] dark:border-[#3A2E4D] flex-shrink-0">
            <button onClick={() => { setEditOpen(false); resetForm(); }} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
              className="px-6 py-2 bg-gray-100 dark:bg-[#221830] text-gray-700 dark:text-[#F5F3FA] rounded-none hover:bg-gray-200 dark:hover:bg-[#241935] transition">Cancelar</button>
            <button onClick={actualizarCompra} disabled={saving} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
              className="px-6 py-2 bg-gradient-to-r from-[#0A0A0A] via-[#3B0A45] to-[#5C2A52] text-white rounded-none hover:opacity-90 disabled:opacity-50 flex items-center gap-2 transition">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Guardar Cambios
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Ver Detalles */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-2xl h-auto flex flex-col p-0 gap-0">
          <div className="px-8 pt-6 pb-5 flex-shrink-0" style={{ background: 'linear-gradient(90deg, #0A0A0A 0%, #3B0A45 55%, #5C2A52 100%)' }}>
            <p className="text-[10px] font-bold uppercase tracking-[3px] text-[#C9A8C3] mb-1">District Store</p>
            <DialogTitle style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xl font-bold text-white flex items-center gap-2">
              <Package className="w-5 h-5 opacity-80" /> Detalles de Compra
            </DialogTitle>
          </div>
          {selectedCompra && (
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-6 py-6 px-8">
                <div className="bg-white dark:bg-[#1e1530] rounded-none border border-[#E7E0DA] dark:border-[#3A2E4D] shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-[#0A0A0A] via-[#3B0A45] to-[#5C2A52] px-6 py-4">
                    <h3 style={{ fontFamily: '"Playfair Display", Georgia, serif' }} className="font-semibold text-white text-base">📋 Información General</h3>
                  </div>
                  <div className="p-6 grid grid-cols-2 gap-6">
                    <div className="flex flex-col gap-1"><p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-500 dark:text-[#b9aedd] font-medium uppercase">Doc. Proveedor</p><p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-semibold text-[#0A0A0A] dark:text-[#F5F3FA]">{selectedCompra.proveedorDocumento || '—'}</p></div>
                    <div className="flex flex-col gap-1"><p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-500 dark:text-[#b9aedd] font-medium uppercase">Orden / Factura</p><p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-semibold text-[#0A0A0A] dark:text-[#F5F3FA]">{selectedCompra.ordenFactura}</p></div>
                    <div className="flex flex-col gap-1"><p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-500 dark:text-[#b9aedd] font-medium uppercase">Proveedor</p><p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-semibold text-[#0A0A0A] dark:text-[#F5F3FA]">{selectedCompra.proveedorNombre}</p></div>
                    <div className="flex flex-col gap-1"><p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-500 dark:text-[#b9aedd] font-medium uppercase">Fecha</p><p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-semibold text-[#0A0A0A] dark:text-[#F5F3FA]">{new Date(selectedCompra.fecha).toLocaleDateString('es-CO')}</p></div>
                    <div className="flex flex-col gap-1"><p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-500 dark:text-[#b9aedd] font-medium uppercase">Estado</p><span className={`px-3 py-1 rounded-full text-xs font-medium w-fit ${estadoColor(selectedCompra.estado)}`}>{selectedCompra.estado}</span></div>
                    <div className="flex flex-col gap-1"><p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-500 dark:text-[#b9aedd] font-medium uppercase">Total</p><p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-2xl font-bold text-[#5C2A52]">{fmt(selectedCompra.total)}</p></div>
                    {selectedCompra.notas && <div className="flex flex-col gap-1 col-span-2"><p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-500 dark:text-[#b9aedd] font-medium uppercase">Notas</p><p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-700 dark:text-[#F5F3FA]">{selectedCompra.notas}</p></div>}
                  </div>
                </div>
                {loadingDetalle ? (
                  <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-[#C9A8C3]" /></div>
                ) : selectedCompra.detalles && selectedCompra.detalles.length > 0 ? (
                  <div className="bg-white dark:bg-[#1e1530] rounded-none border border-[#E7E0DA] dark:border-[#3A2E4D] shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-r from-[#0A0A0A] via-[#3B0A45] to-[#5C2A52] px-6 py-4">
                      <h3 style={{ fontFamily: '"Playfair Display", Georgia, serif' }} className="font-semibold text-white text-base">📦 Productos comprados</h3>
                    </div>
                    <div className="p-6 space-y-3">
                      {selectedCompra.detalles.map((d, i) => (
                        <div key={i} className="flex justify-between items-center p-4 bg-[#F7F5FC] dark:bg-[#17101f] rounded-none">
                          <div>
                            <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-semibold text-[#0A0A0A] dark:text-[#F5F3FA]">{d.nombreProducto}</p>
                            <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-500 dark:text-[#b9aedd] mt-0.5">Cantidad: <span className="font-medium text-gray-700 dark:text-[#F5F3FA]">{d.cantidad}</span> &nbsp;·&nbsp; Precio unitario: <span className="font-medium text-gray-700 dark:text-[#F5F3FA]">{fmt(d.precioUnitario)}</span></p>
                          </div>
                          <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="font-bold text-[#0A0A0A] dark:text-[#F5F3FA]">{fmt(d.total)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 px-8 py-5 border-t border-[#E7E0DA] dark:border-[#3A2E4D] flex-shrink-0">
            <button onClick={() => setViewOpen(false)} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="px-6 py-2 bg-gray-100 dark:bg-[#221830] text-gray-700 dark:text-[#F5F3FA] rounded-none hover:bg-gray-200 dark:hover:bg-[#241935] transition">Cerrar</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Eliminar */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="¿Eliminar compra?"
        description={<>Vas a eliminar la compra <strong>{selectedCompra?.ordenFactura}</strong>. Esta acción no se puede deshacer.</>}
        onConfirm={eliminarCompra}
        loading={saving}
      />
    </div>
  );
};