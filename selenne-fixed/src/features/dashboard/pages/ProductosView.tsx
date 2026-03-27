import React, { useMemo, useState } from 'react';
import { Search, Eye, Edit, Trash2, ChevronRight, Package, X, Loader2, Plus, Upload, Image as ImageIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../../components/ui/alert-dialog';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Textarea } from '../../../components/ui/textarea';
import { toast } from 'sonner';
import { useProductos, ProductoAdmin, CreateProductoPayload } from '../../../shared/contexts/ProductosContext';
import { useSubcategorias } from '../../../shared/contexts/SubcategoriasContext';
import { useProductosAdmin } from '../../../shared/data/useProductosAdmin';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { postForm } from '../../../services/api';

const fmt = (n?: number) => n != null ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n) : '—';
const stockColor = (stock: number) => {
  if (stock === 0) return 'text-red-600 bg-red-50';
  if (stock < 5) return 'text-orange-600 bg-orange-50';
  return 'text-green-700 bg-green-50';
};

interface Variante { tallaNombre: string; colorNombre: string; stock: number; }
interface FormData {
  nombre: string; codigo: string; descripcion: string;
  categoriaPrincipalID: string; tipoProductoID: string; marcaID: string;
  precioCompra: string; precioVenta: string; precioOferta: string;
  stock: string; imagenPrincipal: string;
  tallasSeleccionadas: string[]; coloresSeleccionados: string[]; materialesSeleccionados: string[];
  variantes: Variante[];
}
const EMPTY: FormData = {
  nombre: '', codigo: '', descripcion: '',
  categoriaPrincipalID: '', tipoProductoID: '', marcaID: '',
  precioCompra: '', precioVenta: '', precioOferta: '',
  stock: '0', imagenPrincipal: '',
  tallasSeleccionadas: [], coloresSeleccionados: [], materialesSeleccionados: [], variantes: [],
};

export const ProductosView: React.FC = () => {
  const { crearProducto, actualizarProducto, eliminarProducto } = useProductos();
  const { colores, tallas, marcas, categorias, tiposProducto, materiales } = useSubcategorias();
  const todosLosProductos = useProductosAdmin();
  const { hasPermission } = useAuth();
  const puedeEditar = hasPermission('productos:editar');
  const puedeEliminar = hasPermission('productos:eliminar');
  const puedeCrear = hasPermission('productos:crear');

  const [searchQuery, setSearchQuery] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas');
  const [estadoFiltro, setEstadoFiltro] = useState('todos');
  const [selectedProduct, setSelectedProduct] = useState<ProductoAdmin | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [form, setForm] = useState<FormData>(EMPTY);
  const [activeTab, setActiveTab] = useState<'info' | 'variantes' | 'imagen'>('info');

  const categorias_unicas = useMemo(() =>
    [...new Set(todosLosProductos.map(p => p.categoria))].filter(Boolean),
    [todosLosProductos]
  );

  const filtered = useMemo(() => {
    let list = todosLosProductos;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p => p.nombre.toLowerCase().includes(q) || p.codigo.toLowerCase().includes(q));
    }
    if (categoriaFiltro !== 'todas') list = list.filter(p => p.categoria === categoriaFiltro);
    if (estadoFiltro === 'publicado') list = list.filter(p => p.activo);
    if (estadoFiltro === 'no_publicado') list = list.filter(p => !p.activo);
    if (estadoFiltro === 'agotado') list = list.filter(p => p.stock === 0);
    return list;
  }, [todosLosProductos, searchQuery, categoriaFiltro, estadoFiltro]);

  const toggleEstado = async (p: ProductoAdmin) => {
    if (!puedeEditar) return;
    try {
      await actualizarProducto(p.id, { Estado: p.activo ? 'inactivo' : 'activo' });
      toast.success(p.activo ? 'Producto despublicado' : 'Producto publicado');
    } catch { toast.error('Error cambiando estado'); }
  };

  const openCreate = () => { setForm(EMPTY); setIsEditing(false); setActiveTab('info'); setFormOpen(true); };

  const openEdit = (p: ProductoAdmin) => {
    setSelectedProduct(p);
    setForm({
      nombre: p.nombre, codigo: p.codigo, descripcion: p.descripcion || '',
      categoriaPrincipalID: String(p.categoriaPrincipalID || ''),
      tipoProductoID: String(p.tipoProductoID || ''),
      marcaID: String(p.marcaID || ''),
      precioCompra: p.precioCompra != null ? String(p.precioCompra) : '',
      precioVenta: String(p.precio),
      precioOferta: p.precioOferta != null ? String(p.precioOferta) : '',
      stock: String(p.stock),
      imagenPrincipal: p.imagen || '',
      tallasSeleccionadas: p.tallas || [],
      coloresSeleccionados: p.colores || [],
      materialesSeleccionados: p.materiales || [],
      variantes: p.variantes?.map(v => ({ tallaNombre: v.tallaNombre || '', colorNombre: v.colorNombre || '', stock: v.stock })) || [],
    });
    setIsEditing(true); setActiveTab('info'); setFormOpen(true);
  };

  const toggleTalla = (nombre: string) => {
    if (form.tallasSeleccionadas.includes(nombre)) {
      setForm(f => ({ ...f, tallasSeleccionadas: f.tallasSeleccionadas.filter(t => t !== nombre), variantes: f.variantes.filter(v => v.tallaNombre !== nombre) }));
    } else {
      setForm(f => {
        const newVariantes = [...f.variantes];
        f.coloresSeleccionados.forEach(color => {
          if (!newVariantes.find(v => v.tallaNombre === nombre && v.colorNombre === color))
            newVariantes.push({ tallaNombre: nombre, colorNombre: color, stock: 0 });
        });
        return { ...f, tallasSeleccionadas: [...f.tallasSeleccionadas, nombre], variantes: newVariantes };
      });
    }
  };

  const toggleColor = (nombre: string) => {
    if (form.coloresSeleccionados.includes(nombre)) {
      setForm(f => ({ ...f, coloresSeleccionados: f.coloresSeleccionados.filter(c => c !== nombre), variantes: f.variantes.filter(v => v.colorNombre !== nombre) }));
    } else {
      setForm(f => {
        const newVariantes = [...f.variantes];
        f.tallasSeleccionadas.forEach(talla => {
          if (!newVariantes.find(v => v.tallaNombre === talla && v.colorNombre === nombre))
            newVariantes.push({ tallaNombre: talla, colorNombre: nombre, stock: 0 });
        });
        return { ...f, coloresSeleccionados: [...f.coloresSeleccionados, nombre], variantes: newVariantes };
      });
    }
  };

  const updateStock = (tallaNombre: string, colorNombre: string, stock: number) => {
    setForm(f => ({ ...f, variantes: f.variantes.map(v => v.tallaNombre === tallaNombre && v.colorNombre === colorNombre ? { ...v, stock } : v) }));
  };

  const guardar = async () => {
    if (!form.nombre.trim()) { toast.error('El nombre es obligatorio'); return; }
    if (!form.precioVenta || Number(form.precioVenta) <= 0) { toast.error('El precio de venta es obligatorio'); return; }
    if (!form.categoriaPrincipalID) { toast.error('Selecciona una categoría'); return; }
    setSaving(true);
    try {
      const payload: any = {
        Codigo: form.codigo, Nombre: form.nombre, Descripcion: form.descripcion,
        CategoriaPrincipalID: Number(form.categoriaPrincipalID),
        TipoProductoID: Number(form.tipoProductoID) || 1,
        MarcaID: Number(form.marcaID) || 1,
        PrecioVenta: Number(form.precioVenta),
        PrecioOferta: form.precioOferta ? Number(form.precioOferta) : undefined,
        PrecioCompra: form.precioCompra ? Number(form.precioCompra) : undefined,
        Stock: Number(form.stock) || 0,
        ImagenPrincipal: form.imagenPrincipal || undefined,
        variantes: form.variantes,
      };
      let ok: boolean;
      if (isEditing && selectedProduct) {
        ok = await actualizarProducto(selectedProduct.id, payload, form.tallasSeleccionadas, form.coloresSeleccionados, tallas, colores, form.imagenPrincipal ? [form.imagenPrincipal] : undefined, form.materialesSeleccionados, materiales);
      } else {
        ok = await crearProducto(payload, form.tallasSeleccionadas, form.coloresSeleccionados, tallas, colores, form.imagenPrincipal ? [form.imagenPrincipal] : undefined, form.materialesSeleccionados, materiales);
      }
      if (ok) { toast.success(isEditing ? 'Producto actualizado' : 'Producto creado'); setFormOpen(false); }
      else toast.error('Error guardando producto');
    } catch (e: any) { toast.error(e?.data?.message || 'Error guardando producto'); }
    finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    if (!selectedProduct) return;
    setSaving(true);
    try { await eliminarProducto(selectedProduct.id); toast.success('Producto eliminado'); setDeleteOpen(false); }
    catch { toast.error('Error eliminando producto'); }
    finally { setSaving(false); }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex items-center gap-2 mb-4">
        <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-500">Dashboard</span>
        <ChevronRight className="w-4 h-4 text-gray-400" />
        <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm font-medium text-gray-900">Inventario</span>
      </div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontFamily: 'Playfair Display, serif' }} className="text-4xl text-gray-900">Inventario de Productos</h1>
          <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-gray-500 text-sm mt-1">{todosLosProductos.length} productos en total</p>
        </div>
        {puedeCrear && (
          <button onClick={openCreate} style={{ fontFamily: 'Inter, sans-serif' }}
            className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 flex items-center gap-2 transition-colors">
            <Plus className="w-5 h-5" /> Nuevo Producto
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Buscar por nombre o código..." value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)} style={{ fontFamily: 'Inter, sans-serif' }}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d65391]" />
        </div>
        <Select value={categoriaFiltro} onValueChange={setCategoriaFiltro}>
          <SelectTrigger className="w-48 h-12 border-gray-200"><SelectValue placeholder="Categoría" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas las categorías</SelectItem>
            {categorias_unicas.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={estadoFiltro} onValueChange={setEstadoFiltro}>
          <SelectTrigger className="w-44 h-12 border-gray-200"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="publicado">Publicado</SelectItem>
            <SelectItem value="no_publicado">No publicado</SelectItem>
            <SelectItem value="agotado">Agotado</SelectItem>
          </SelectContent>
        </Select>
        {(searchQuery || categoriaFiltro !== 'todas' || estadoFiltro !== 'todos') && (
          <button onClick={() => { setSearchQuery(''); setCategoriaFiltro('todas'); setEstadoFiltro('todos'); }}
            className="px-4 py-3 text-gray-400 hover:text-gray-600 flex items-center gap-1 text-sm">
            <X className="w-4 h-4" /> Limpiar
          </button>
        )}
        <span style={{ fontFamily: 'Inter, sans-serif' }} className="ml-auto self-center text-sm text-gray-500">
          Mostrando <strong>{filtered.length}</strong> de <strong>{todosLosProductos.length}</strong> productos
        </span>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left w-16"></th>
                {['PRODUCTO', 'CATEGORÍA', 'P. COSTO', 'P. VENTA', 'P. OFERTA', 'STOCK', 'PUBLICADO', 'ACCIONES'].map(h => (
                  <th key={h} className="px-6 py-4 text-left">
                    <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs font-semibold uppercase tracking-wider text-gray-500">{h}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    {p.imagen ? (
                      <img src={p.imagen} alt={p.nombre} className="w-12 h-12 object-cover rounded-lg border border-gray-200" />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Package className="w-5 h-5 text-gray-300" />
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <p style={{ fontFamily: 'Inter, sans-serif' }} className="font-semibold text-gray-900">{p.nombre}</p>
                    <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-400 mt-0.5">{p.codigo}</p>
                  </td>
                  <td className="px-6 py-4"><span style={{ fontFamily: 'Inter, sans-serif' }} className="text-gray-600">{p.categoria}</span></td>
                  <td className="px-6 py-4"><span style={{ fontFamily: 'Inter, sans-serif' }} className="text-gray-500 text-sm">{fmt(p.precioCompra)}</span></td>
                  <td className="px-6 py-4"><span style={{ fontFamily: 'Inter, sans-serif' }} className="font-semibold text-gray-900">{fmt(p.precio)}</span></td>
                  <td className="px-6 py-4">
                    {p.precioOferta ? (
                      <span style={{ fontFamily: 'Inter, sans-serif' }} className="font-semibold text-[#d65391]">{fmt(p.precioOferta)}</span>
                    ) : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold ${stockColor(p.stock)}`}>
                      {p.stock === 0 ? 'Agotado' : `${p.stock} uds`}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => toggleEstado(p)} disabled={!puedeEditar}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${p.activo ? 'bg-[#d65391]' : 'bg-gray-200'} ${!puedeEditar ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${p.activo ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                    <p style={{ fontFamily: 'Inter, sans-serif' }} className={`text-xs mt-1 ${p.activo ? 'text-[#d65391]' : 'text-gray-400'}`}>
                      {p.activo ? 'Publicado' : 'No publicado'}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setSelectedProduct(p); setViewOpen(true); }}
                        className="p-2 text-gray-500 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors" title="Ver">
                        <Eye className="w-5 h-5" />
                      </button>
                      {puedeEditar && (
                        <button onClick={() => openEdit(p)}
                          className="p-2 text-gray-500 hover:bg-yellow-50 hover:text-yellow-600 rounded-lg transition-colors" title="Editar">
                          <Edit className="w-5 h-5" />
                        </button>
                      )}
                      {puedeEliminar && (
                        <button onClick={() => { setSelectedProduct(p); setDeleteOpen(true); }}
                          className="p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors" title="Eliminar">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="px-6 py-16 text-center">
                  <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                  <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-gray-400">No se encontraron productos</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-gray-100">
          <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-500">
            Mostrando <span className="font-medium text-gray-800">{filtered.length}</span> de <span className="font-medium text-gray-800">{todosLosProductos.length}</span> productos
          </span>
        </div>
      </div>

      {/* ═══ MODAL VER ═══ */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-2xl h-auto flex flex-col p-0 gap-0">
          <DialogHeader className="px-8 pt-6 pb-4 border-b border-gray-200 flex-shrink-0">
            <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }} className="text-2xl">{selectedProduct?.nombre}</DialogTitle>
            <DialogDescription style={{ fontFamily: 'Inter, sans-serif' }}>Código: {selectedProduct?.codigo}</DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-6 py-6 px-8">

                {/* Imagen + precios */}
                <div className="flex gap-6 items-start">
                  {selectedProduct.imagen ? (
                    <img src={selectedProduct.imagen} alt={selectedProduct.nombre}
                      className="w-32 h-32 object-cover rounded-xl border border-gray-200 flex-shrink-0" />
                  ) : (
                    <div className="w-32 h-32 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 border border-gray-200">
                      <Package className="w-8 h-8 text-gray-300" />
                    </div>
                  )}
                  <div className="flex-1 grid grid-cols-3 gap-4">
                    {[
                      ['Precio de Costo', fmt(selectedProduct.precioCompra), 'text-gray-900'],
                      ['Precio de Venta', fmt(selectedProduct.precio), 'text-gray-900'],
                      ['Precio Oferta', selectedProduct.precioOferta ? fmt(selectedProduct.precioOferta) : 'Sin oferta', selectedProduct.precioOferta ? 'text-[#d65391]' : 'text-gray-300'],
                    ].map(([label, value, cls]) => (
                      <div key={label} className="bg-gray-50 rounded-xl p-4">
                        <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-500 mb-2 uppercase tracking-wide">{label}</p>
                        <p style={{ fontFamily: 'Inter, sans-serif' }} className={`text-base font-bold ${cls}`}>{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Info general */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <h3 style={{ fontFamily: 'Inter, sans-serif' }} className="font-semibold text-gray-800 text-base">📋 Información General</h3>
                  </div>
                  <div className="p-6 grid grid-cols-2 gap-6">
                    {[
                      ['Categoría', selectedProduct.categoria],
                      ['Marca', selectedProduct.marca],
                      ['Tipo', selectedProduct.tipoProducto],
                      ['Stock Total', `${selectedProduct.stock} unidades`],
                      ['Estado', selectedProduct.activo ? '✅ Publicado' : '⭕ No publicado'],
                      ['Materiales', selectedProduct.materiales?.join(', ') || '—'],
                    ].map(([label, value]) => (
                      <div key={label} className="flex flex-col gap-1">
                        <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-500 font-medium uppercase">{label}</p>
                        <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm font-semibold text-gray-900">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stock variantes */}
                {selectedProduct.variantes?.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                      <h3 style={{ fontFamily: 'Inter, sans-serif' }} className="font-semibold text-gray-800 text-base">📦 Stock por Talla y Color</h3>
                    </div>
                    <div className="p-6">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-100">
                            <th className="pb-3 text-left text-xs text-gray-500 uppercase font-semibold">Talla</th>
                            <th className="pb-3 text-left text-xs text-gray-500 uppercase font-semibold">Color</th>
                            <th className="pb-3 text-right text-xs text-gray-500 uppercase font-semibold">Stock</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {selectedProduct.variantes.map((v, i) => (
                            <tr key={i}>
                              <td className="py-3 text-gray-700">{v.tallaNombre || '—'}</td>
                              <td className="py-3 text-gray-700">{v.colorNombre || '—'}</td>
                              <td className="py-3 text-right">
                                <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${stockColor(v.stock)}`}>
                                  {v.stock === 0 ? 'Agotado' : v.stock}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Descripción */}
                {selectedProduct.descripcion && (
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                      <h3 style={{ fontFamily: 'Inter, sans-serif' }} className="font-semibold text-gray-800 text-base">📝 Descripción</h3>
                    </div>
                    <div className="p-6">
                      <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-700 leading-relaxed">{selectedProduct.descripcion}</p>
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}
          <DialogFooter className="gap-2 px-8 py-5 border-t border-gray-200 flex-shrink-0">
            {puedeEditar && selectedProduct && (
              <button onClick={() => { setViewOpen(false); openEdit(selectedProduct); }}
                style={{ fontFamily: 'Inter, sans-serif' }}
                className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors">Editar</button>
            )}
            <button onClick={() => setViewOpen(false)} style={{ fontFamily: 'Inter, sans-serif' }}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">Cerrar</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ MODAL CREAR / EDITAR ═══ */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-3xl h-auto flex flex-col p-0 gap-0">
          <DialogHeader className="px-8 pt-6 pb-4 border-b border-gray-200 flex-shrink-0">
            <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }} className="text-2xl">
              {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
            </DialogTitle>
            <DialogDescription style={{ fontFamily: 'Inter, sans-serif' }}>
              {isEditing ? 'Modifica la información del producto' : 'Completa los datos para registrar un nuevo producto'}
            </DialogDescription>
          </DialogHeader>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 px-8 flex-shrink-0">
            {[
              { key: 'info', label: '📋 Información' },
              { key: 'variantes', label: '📦 Tallas, Colores y Stock' },
              { key: 'imagen', label: '🖼 Imagen' },
            ].map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
                style={{ fontFamily: 'Inter, sans-serif' }}
                className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key ? 'border-[#d65391] text-[#d65391]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto max-h-[65vh]">
            <div className="space-y-6 py-6 px-8">

              {/* ── INFO ── */}
              {activeTab === 'info' && (
                <>
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                      <h3 style={{ fontFamily: 'Inter, sans-serif' }} className="font-semibold text-gray-800 text-base">📋 Datos Básicos</h3>
                    </div>
                    <div className="p-6 grid grid-cols-2 gap-6">
                      <div className="flex flex-col gap-2 col-span-2">
                        <Label style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm font-medium text-gray-700">Nombre <span className="text-red-500">*</span></Label>
                        <Input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                          placeholder="Ej: Vestido Floral Verano" className="h-10 border-gray-300" />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm font-medium text-gray-700">Código / Referencia</Label>
                        <Input value={form.codigo} onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))}
                          placeholder="Ej: VES-001" className="h-10 border-gray-300" />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm font-medium text-gray-700">Categoría <span className="text-red-500">*</span></Label>
                        <Select value={form.categoriaPrincipalID} onValueChange={v => setForm(f => ({ ...f, categoriaPrincipalID: v }))}>
                          <SelectTrigger className="h-10 border-gray-300"><SelectValue placeholder="Selecciona categoría..." /></SelectTrigger>
                          <SelectContent>
                            {categorias.map((c: any) => <SelectItem key={c.id} value={String(c.id)}>{c.nombre}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm font-medium text-gray-700">Tipo de Producto</Label>
                        <Select value={form.tipoProductoID} onValueChange={v => setForm(f => ({ ...f, tipoProductoID: v }))}>
                          <SelectTrigger className="h-10 border-gray-300"><SelectValue placeholder="Selecciona tipo..." /></SelectTrigger>
                          <SelectContent>
                            {tiposProducto.map((t: any) => <SelectItem key={t.id} value={String(t.id)}>{t.nombre}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm font-medium text-gray-700">Marca</Label>
                        <Select value={form.marcaID} onValueChange={v => setForm(f => ({ ...f, marcaID: v }))}>
                          <SelectTrigger className="h-10 border-gray-300"><SelectValue placeholder="Selecciona marca..." /></SelectTrigger>
                          <SelectContent>
                            {marcas.map((m: any) => <SelectItem key={m.id} value={String(m.id)}>{m.nombre}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex flex-col gap-2 col-span-2">
                        <Label style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm font-medium text-gray-700">Descripción</Label>
                        <Textarea value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                          placeholder="Descripción del producto..." className="border-gray-300 resize-none" rows={3} />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                      <h3 style={{ fontFamily: 'Inter, sans-serif' }} className="font-semibold text-gray-800 text-base">💰 Precios y Stock</h3>
                    </div>
                    <div className="p-6 grid grid-cols-2 gap-6">
                      <div className="flex flex-col gap-2">
                        <Label style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm font-medium text-gray-700">Precio de Costo</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                          <Input type="number" min="0" value={form.precioCompra}
                            onChange={e => setForm(f => ({ ...f, precioCompra: e.target.value }))}
                            placeholder="0" className="h-10 border-gray-300 pl-7" />
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm font-medium text-gray-700">Precio de Venta <span className="text-red-500">*</span></Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                          <Input type="number" min="0" value={form.precioVenta}
                            onChange={e => setForm(f => ({ ...f, precioVenta: e.target.value }))}
                            placeholder="0" className="h-10 border-gray-300 pl-7" />
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm font-medium text-gray-700">Precio de Oferta <span className="text-gray-400 font-normal text-xs">(opcional)</span></Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                          <Input type="number" min="0" value={form.precioOferta}
                            onChange={e => setForm(f => ({ ...f, precioOferta: e.target.value }))}
                            placeholder="Sin oferta" className="h-10 border-gray-300 pl-7" />
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm font-medium text-gray-700">Stock General</Label>
                        <Input type="number" min="0" value={form.stock}
                          onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                          className="h-10 border-gray-300" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                      <h3 style={{ fontFamily: 'Inter, sans-serif' }} className="font-semibold text-gray-800 text-base">🧵 Materiales</h3>
                    </div>
                    <div className="p-6 flex flex-wrap gap-3">
                      {materiales.map((m: any) => (
                        <button key={m.id} onClick={() => setForm(f => ({
                          ...f,
                          materialesSeleccionados: f.materialesSeleccionados.includes(m.nombre)
                            ? f.materialesSeleccionados.filter(x => x !== m.nombre)
                            : [...f.materialesSeleccionados, m.nombre]
                        }))} style={{ fontFamily: 'Inter, sans-serif' }}
                          className={`px-4 py-2 rounded-lg text-sm border transition-colors ${form.materialesSeleccionados.includes(m.nombre) ? 'bg-[#d65391] text-white border-[#d65391]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#d65391]'}`}>
                          {m.nombre}
                        </button>
                      ))}
                      {materiales.length === 0 && <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-400">No hay materiales registrados</p>}
                    </div>
                  </div>
                </>
              )}

              {/* ── VARIANTES ── */}
              {activeTab === 'variantes' && (
                <>
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                      <h3 style={{ fontFamily: 'Inter, sans-serif' }} className="font-semibold text-gray-800 text-base">📏 Tallas disponibles</h3>
                    </div>
                    <div className="p-6 flex flex-wrap gap-3">
                      {tallas.map((t: any) => (
                        <button key={t.id} onClick={() => toggleTalla(t.nombre)}
                          style={{ fontFamily: 'Inter, sans-serif' }}
                          className={`px-5 py-2 rounded-lg text-sm border font-medium transition-colors ${form.tallasSeleccionadas.includes(t.nombre) ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
                          {t.nombre}
                        </button>
                      ))}
                      {tallas.length === 0 && <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-400">No hay tallas registradas</p>}
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                      <h3 style={{ fontFamily: 'Inter, sans-serif' }} className="font-semibold text-gray-800 text-base">🎨 Colores disponibles</h3>
                    </div>
                    <div className="p-6 flex flex-wrap gap-3">
                      {colores.map((c: any) => (
                        <button key={c.id} onClick={() => toggleColor(c.nombre)}
                          style={{ fontFamily: 'Inter, sans-serif' }}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm border transition-colors ${form.coloresSeleccionados.includes(c.nombre) ? 'border-[#d65391] bg-pink-50 text-[#d65391]' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'}`}>
                          {c.codigoHex && <span className="w-4 h-4 rounded-full border border-gray-200 flex-shrink-0" style={{ background: c.codigoHex }} />}
                          {c.nombre}
                        </button>
                      ))}
                      {colores.length === 0 && <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-400">No hay colores registrados</p>}
                    </div>
                  </div>

                  {form.variantes.length > 0 ? (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                        <h3 style={{ fontFamily: 'Inter, sans-serif' }} className="font-semibold text-gray-800 text-base">📦 Stock por combinación</h3>
                      </div>
                      <div className="p-6">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-100">
                              <th className="pb-3 text-left text-xs text-gray-500 uppercase font-semibold">Talla</th>
                              <th className="pb-3 text-left text-xs text-gray-500 uppercase font-semibold">Color</th>
                              <th className="pb-3 text-right text-xs text-gray-500 uppercase font-semibold">Stock (unidades)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {form.variantes.map((v, i) => (
                              <tr key={i}>
                                <td className="py-3 font-medium text-gray-700">{v.tallaNombre || '—'}</td>
                                <td className="py-3 text-gray-700">{v.colorNombre || '—'}</td>
                                <td className="py-3">
                                  <Input type="number" min="0" value={v.stock}
                                    onChange={e => updateStock(v.tallaNombre, v.colorNombre, Number(e.target.value))}
                                    className="h-8 w-24 ml-auto border-gray-300 text-center text-sm" />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                      <Package className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                      <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-400">Selecciona tallas y colores para configurar el stock por variante</p>
                    </div>
                  )}
                </>
              )}

              {/* ── IMAGEN ── */}
              {activeTab === 'imagen' && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <h3 style={{ fontFamily: 'Inter, sans-serif' }} className="font-semibold text-gray-800 text-base">🖼 Imagen Principal</h3>
                  </div>
                  <div className="p-6 flex gap-6 items-start">
                    {form.imagenPrincipal ? (
                      <div className="relative flex-shrink-0">
                        <img src={form.imagenPrincipal.startsWith('http') ? form.imagenPrincipal : `http://localhost:5000${form.imagenPrincipal}`}
                          alt="Principal" className="w-36 h-36 object-cover rounded-xl border border-gray-200" />
                        <button onClick={() => setForm(f => ({ ...f, imagenPrincipal: '' }))}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-36 h-36 bg-gray-100 rounded-xl flex flex-col items-center justify-center flex-shrink-0 border-2 border-dashed border-gray-200">
                        <ImageIcon className="w-8 h-8 text-gray-300 mb-1" />
                        <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-400">Sin imagen</p>
                      </div>
                    )}
                    <div className="flex-1 flex flex-col gap-3">
                      {isEditing ? (
                        <label className={`flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${uploadingImg ? 'border-[#d65391] bg-pink-50' : 'border-gray-200 hover:border-[#d65391] hover:bg-pink-50'}`}>
                          <div className="flex flex-col items-center pointer-events-none">
                            {uploadingImg ? (
                              <Loader2 className="w-8 h-8 text-[#d65391] animate-spin mb-2" />
                            ) : (
                              <Upload className="w-8 h-8 text-gray-400 mb-2" />
                            )}
                            <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-600 font-medium">
                              {uploadingImg ? 'Subiendo imagen...' : 'Haz clic para seleccionar'}
                            </p>
                            <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP · Máx 5MB</p>
                          </div>
                          <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden"
                            disabled={!isEditing || uploadingImg}
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file || !selectedProduct) return;
                              if (file.size > 5 * 1024 * 1024) { toast.error('La imagen no puede superar 5MB'); return; }
                              setUploadingImg(true);
                              try {
                                const fd = new FormData();
                                fd.append('archivo', file);
                                const res = await postForm(`/api/productos/${selectedProduct.id}/upload-imagen`, fd);
                                const url = res?.data?.url || res?.url;
                                if (url) { setForm(f => ({ ...f, imagenPrincipal: url })); toast.success('Imagen subida correctamente'); }
                                else toast.error('Error subiendo imagen');
                              } catch { toast.error('Error subiendo imagen'); }
                              finally { setUploadingImg(false); e.target.value = ''; }
                            }} />
                        </label>
                      ) : (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                          <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-yellow-700">
                            ⚠️ Primero crea el producto, luego edítalo para subir la imagen.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

          <DialogFooter className="gap-2 px-8 py-5 border-t border-gray-200 flex-shrink-0">
            <button onClick={() => setFormOpen(false)} style={{ fontFamily: 'Inter, sans-serif' }}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">Cancelar</button>
            <button onClick={guardar} disabled={saving} style={{ fontFamily: 'Inter, sans-serif' }}
              className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2 transition-colors">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEditing ? 'Guardar Cambios' : 'Crear Producto'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ MODAL ELIMINAR ═══ */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ fontFamily: 'Playfair Display, serif' }}>¿Eliminar producto?</AlertDialogTitle>
            <AlertDialogDescription style={{ fontFamily: 'Inter, sans-serif' }}>
              Vas a eliminar <strong>{selectedProduct?.nombre}</strong>. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel style={{ fontFamily: 'Inter, sans-serif' }}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={saving}
              className="bg-red-600 hover:bg-red-700 flex items-center gap-2" style={{ fontFamily: 'Inter, sans-serif' }}>
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
};