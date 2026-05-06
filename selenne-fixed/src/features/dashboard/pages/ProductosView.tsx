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
import { apiBase, getAccessToken } from '../../../services/api';

const fmt = (n?: number) =>
  n != null ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n) : '—';

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
  imagenesPorColor: Record<string, string[]>;
}

const EMPTY: FormData = {
  nombre: '', codigo: '', descripcion: '',
  categoriaPrincipalID: '', tipoProductoID: '', marcaID: '',
  precioCompra: '', precioVenta: '', precioOferta: '',
  stock: '0', imagenPrincipal: '',
  tallasSeleccionadas: [], coloresSeleccionados: [], materialesSeleccionados: [], variantes: [],
  imagenesPorColor: {},
};

// Input de precio tipo tarjeta — sin flechas del navegador
const PriceCard: React.FC<{
  label: string; value: string; required?: boolean; note?: string;
  color?: 'default' | 'pink';
  onChange: (v: string) => void;
}> = ({ label, value, required, note, color = 'default', onChange }) => (
  <div className={`rounded-xl border-2 p-4 transition-colors focus-within:border-[#d65391] ${
    color === 'pink' ? 'border-[#d65391]/30 bg-pink-50/40' : 'border-gray-200 bg-white'
  }`}>
    <p style={{ fontFamily: 'Inter, sans-serif' }} className={`text-xs font-semibold uppercase tracking-wide mb-3 ${color === 'pink' ? 'text-[#d65391]/70' : 'text-gray-500'}`}>
      {label}{required && <span className="text-red-500 ml-1">*</span>}
    </p>
    <div className="flex items-baseline gap-1">
      <span className={`text-sm font-medium ${color === 'pink' ? 'text-[#d65391]/50' : 'text-gray-400'}`}>$</span>
      <input
        inputMode="numeric"
        value={value}
        onChange={e => onChange(e.target.value.replace(/[^0-9]/g, ''))}
        placeholder={required ? '0' : '—'}
        style={{ fontFamily: 'Inter, sans-serif' }}
        className={`flex-1 text-xl font-bold outline-none bg-transparent w-full min-w-0 ${
          color === 'pink' ? 'text-[#d65391] placeholder:text-[#d65391]/25' : 'text-gray-900 placeholder:text-gray-300'
        }`}
      />
    </div>
    <p style={{ fontFamily: 'Inter, sans-serif' }} className={`text-xs mt-1 ${color === 'pink' ? 'text-[#d65391]/40' : 'text-gray-400'}`}>
      {note || 'COP'}
    </p>
  </div>
);

export const ProductosView: React.FC = () => {
  const { crearProducto, actualizarProducto, eliminarProducto, recargar } = useProductos();
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
  const [activeTab, setActiveTab] = useState<'info' | 'variantes' | 'imagenes'>('info');
  const [uploadingColorImg, setUploadingColorImg] = useState<string | null>(null);

  // Imagen pendiente de subir (archivo local)
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

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

  const resetImageState = () => {
    setImageFile(null);
    setImagePreview('');
  };

  const subirImagenColor = async (colorNombre: string, file: File) => {
    if (file.size > 5 * 1024 * 1024) { toast.error('La imagen no puede superar 5MB'); return; }
    setUploadingColorImg(colorNombre);
    try {
      const token = getAccessToken() || '';
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${apiBase}/api/upload/imagen`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data?.message || 'Error subiendo imagen'); return; }
      const url: string = data?.data?.url || data?.url || '';
      if (!url) { toast.error('No se recibió la URL de la imagen'); return; }
      setForm(f => ({
        ...f,
        imagenesPorColor: {
          ...f.imagenesPorColor,
          [colorNombre]: [...(f.imagenesPorColor[colorNombre] || []), url],
        },
      }));
    } catch { toast.error('Error subiendo imagen'); }
    finally { setUploadingColorImg(null); }
  };

  const quitarImagenColor = (colorNombre: string, url: string) => {
    setForm(f => ({
      ...f,
      imagenesPorColor: {
        ...f.imagenesPorColor,
        [colorNombre]: (f.imagenesPorColor[colorNombre] || []).filter(u => u !== url),
      },
    }));
  };

  const openCreate = () => {
    setForm(EMPTY);
    setIsEditing(false);
    setActiveTab('info');
    resetImageState();
    setFormOpen(true);
  };

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
      imagenesPorColor: p.imagenesPorColor || {},
    });
    setIsEditing(true);
    setActiveTab('info');
    resetImageState();
    setFormOpen(true);
  };

  const handleImageFile = (file: File) => {
    if (file.size > 5 * 1024 * 1024) { toast.error('La imagen no puede superar 5MB'); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const uploadImageFile = async (id: string, file: File) => {
    setUploadingImg(true);
    try {
      const token = getAccessToken() || '';

      // 1. Subir archivo al servidor
      const fd = new FormData();
      fd.append('file', file);
      const uploadRes = await fetch(`${apiBase}/api/upload/imagen`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: fd,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        toast.error(uploadData?.message || 'Error subiendo imagen');
        return;
      }
      const url: string = uploadData?.data?.url || uploadData?.url || '';
      if (!url) { toast.error('No se recibió la URL de la imagen'); return; }

      // 2. Asociar la URL al producto
      await fetch(`${apiBase}/api/productos/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ImagenPrincipal: url }),
      });

      setForm(f => ({ ...f, imagenPrincipal: url }));
      toast.success('Imagen subida correctamente');
      await recargar();
    } catch (e: any) {
      console.error('Upload error:', e);
      toast.error('Error subiendo imagen');
    } finally {
      setUploadingImg(false);
    }
  };

  const toggleTalla = (nombre: string) => {
    if (form.tallasSeleccionadas.includes(nombre)) {
      setForm(f => ({ ...f, tallasSeleccionadas: f.tallasSeleccionadas.filter(t => t !== nombre), variantes: f.variantes.filter(v => v.tallaNombre !== nombre) }));
    } else {
      setForm(f => {
        const defaultStock = Math.max(1, Number(f.stock) || 1);
        const newVariantes = [...f.variantes];
        f.coloresSeleccionados.forEach(color => {
          if (!newVariantes.find(v => v.tallaNombre === nombre && v.colorNombre === color))
            newVariantes.push({ tallaNombre: nombre, colorNombre: color, stock: defaultStock });
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
        const defaultStock = Math.max(1, Number(f.stock) || 1);
        const newVariantes = [...f.variantes];
        f.tallasSeleccionadas.forEach(talla => {
          if (!newVariantes.find(v => v.tallaNombre === talla && v.colorNombre === nombre))
            newVariantes.push({ tallaNombre: talla, colorNombre: nombre, stock: defaultStock });
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
        Codigo: form.codigo,
        Nombre: form.nombre,
        Descripcion: form.descripcion,
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

      payload.imagenesPorColor = Object.keys(form.imagenesPorColor).length > 0 ? form.imagenesPorColor : undefined;

      if (isEditing && selectedProduct) {
        const ok = await actualizarProducto(
          selectedProduct.id, payload,
          form.tallasSeleccionadas, form.coloresSeleccionados, tallas, colores,
          form.imagenPrincipal ? [form.imagenPrincipal] : [],
          form.materialesSeleccionados, materiales
        );
        if (ok) {
          if (imageFile) await uploadImageFile(selectedProduct.id, imageFile);
          toast.success('Producto actualizado');
          setFormOpen(false);
        } else {
          toast.error('Error guardando producto');
        }
      } else {
        const newId = await crearProducto(
          payload,
          form.tallasSeleccionadas, form.coloresSeleccionados, tallas, colores,
          undefined, form.materialesSeleccionados, materiales
        );
        if (newId) {
          if (imageFile) await uploadImageFile(String(newId), imageFile);
          toast.success('Producto creado');
          setFormOpen(false);
        } else {
          toast.error('Error creando producto');
        }
      }
    } catch (e: any) {
      toast.error(e?.data?.message || 'Error guardando producto');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedProduct) return;
    setSaving(true);
    try {
      await eliminarProducto(selectedProduct.id);
      toast.success('Producto eliminado');
      setDeleteOpen(false);
    } catch (e: any) {
      toast.error(e?.message || 'No se pudo eliminar el producto');
    } finally {
      setSaving(false);
    }
  };

  // Vista previa de la imagen en el formulario
  const currentImageSrc = imagePreview || (form.imagenPrincipal
    ? (form.imagenPrincipal.startsWith('http') ? form.imagenPrincipal : `http://localhost:5000${form.imagenPrincipal}`)
    : '');

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-4">
        <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-500">Dashboard</span>
        <ChevronRight className="w-4 h-4 text-gray-400" />
        <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm font-medium text-gray-900">Inventario</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontFamily: 'Playfair Display, serif' }} className="text-4xl text-gray-900">Inventario de Productos</h1>
          <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-gray-500 text-sm mt-1">
            {todosLosProductos.length} productos · los <strong>publicados</strong> son visibles para los clientes
          </p>
        </div>
        {puedeCrear && (
          <button onClick={openCreate} style={{ fontFamily: 'Inter, sans-serif' }}
            className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 flex items-center gap-2 transition-colors">
            <Plus className="w-5 h-5" /> Nuevo Producto
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-wrap gap-3 mb-6">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Buscar por nombre o referencia..." value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)} style={{ fontFamily: 'Inter, sans-serif' }}
            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#d65391]" />
        </div>
        <Select value={categoriaFiltro} onValueChange={setCategoriaFiltro}>
          <SelectTrigger className="w-44 h-10 border-gray-200 text-sm"><SelectValue placeholder="Categoría" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas las categorías</SelectItem>
            {categorias_unicas.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={estadoFiltro} onValueChange={setEstadoFiltro}>
          <SelectTrigger className="w-40 h-10 border-gray-200 text-sm"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="publicado">Publicados</SelectItem>
            <SelectItem value="no_publicado">No publicados</SelectItem>
            <SelectItem value="agotado">Agotados</SelectItem>
          </SelectContent>
        </Select>
        {(searchQuery || categoriaFiltro !== 'todas' || estadoFiltro !== 'todos') && (
          <button onClick={() => { setSearchQuery(''); setCategoriaFiltro('todas'); setEstadoFiltro('todos'); }}
            className="px-3 py-2 text-gray-400 hover:text-gray-600 flex items-center gap-1 text-sm">
            <X className="w-4 h-4" /> Limpiar
          </button>
        )}
        <span style={{ fontFamily: 'Inter, sans-serif' }} className="ml-auto self-center text-sm text-gray-500">
          <strong className="text-gray-800">{filtered.length}</strong> de <strong className="text-gray-800">{todosLosProductos.length}</strong>
        </span>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 w-14"></th>
                {['PRODUCTO', 'MARCA / CATEGORÍA', 'COSTO', 'VENTA', 'OFERTA', 'STOCK', 'TALLAS', 'PUBLICADO', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left">
                    <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs font-semibold uppercase tracking-wider text-gray-400">{h}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-gray-50/70 transition-colors">
                  {/* Imagen */}
                  <td className="px-4 py-3">
                    {p.imagen ? (
                      <img src={p.imagen} alt={p.nombre} className="w-11 h-11 object-cover rounded-lg border border-gray-200" />
                    ) : (
                      <div className="w-11 h-11 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Package className="w-4 h-4 text-gray-300" />
                      </div>
                    )}
                  </td>
                  {/* Nombre + código */}
                  <td className="px-4 py-3">
                    <p style={{ fontFamily: 'Inter, sans-serif' }} className="font-semibold text-gray-900 text-sm">{p.nombre}</p>
                    {p.codigo && <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-400 font-mono mt-0.5">{p.codigo}</p>}
                  </td>
                  {/* Marca / Categoría */}
                  <td className="px-4 py-3">
                    <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-700">{p.marca || '—'}</p>
                    <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-400">{p.categoria}</p>
                  </td>
                  {/* Costo */}
                  <td className="px-4 py-3">
                    <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-500">{fmt(p.precioCompra)}</span>
                  </td>
                  {/* Venta */}
                  <td className="px-4 py-3">
                    <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm font-semibold text-gray-900">{fmt(p.precio)}</span>
                  </td>
                  {/* Oferta */}
                  <td className="px-4 py-3">
                    {p.precioOferta
                      ? <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm font-semibold text-[#d65391]">{fmt(p.precioOferta)}</span>
                      : <span className="text-gray-300 text-sm">—</span>}
                  </td>
                  {/* Stock */}
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold ${stockColor(p.stock)}`}>
                      {p.stock === 0 ? 'Agotado' : `${p.stock} uds`}
                    </span>
                  </td>
                  {/* Tallas / Colores */}
                  <td className="px-4 py-3">
                    {p.tallas.length > 0 ? (
                      <div className="flex flex-col gap-0.5">
                        <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-600">
                          {p.tallas.slice(0, 3).join(', ')}{p.tallas.length > 3 ? ` +${p.tallas.length - 3}` : ''}
                        </span>
                        {p.colores.length > 0 && (
                          <div className="flex gap-1">
                            {p.colores.slice(0, 4).map(c => {
                              const hex = colores.find((x: any) => x.nombre === c)?.hexColor || '#ccc';
                              return <span key={c} className="w-3 h-3 rounded-full border border-gray-300 inline-block" style={{ backgroundColor: hex }} title={c} />;
                            })}
                            {p.colores.length > 4 && <span className="text-xs text-gray-400">+{p.colores.length - 4}</span>}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-orange-500 font-medium">Sin tallas</span>
                    )}
                  </td>
                  {/* Toggle publicado */}
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleEstado(p)}
                      disabled={!puedeEditar}
                      style={{ fontFamily: 'Inter, sans-serif' }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        p.activo
                          ? 'bg-green-50 text-green-700 border-green-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
                          : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-green-50 hover:text-green-700 hover:border-green-200'
                      } ${!puedeEditar ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      title={p.activo ? 'Clic para ocultar' : 'Clic para publicar'}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${p.activo ? 'bg-green-500' : 'bg-gray-400'}`} />
                      {p.activo ? 'Publicado' : 'Oculto'}
                    </button>
                  </td>
                  {/* Acciones */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setSelectedProduct(p); setViewOpen(true); }}
                        className="p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors" title="Ver detalle">
                        <Eye className="w-4 h-4" />
                      </button>
                      {puedeEditar && (
                        <button onClick={() => openEdit(p)}
                          className="p-1.5 text-gray-400 hover:bg-amber-50 hover:text-amber-600 rounded-lg transition-colors" title="Editar">
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      {puedeEliminar && (
                        <button onClick={() => { setSelectedProduct(p); setDeleteOpen(true); }}
                          className="p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors" title="Eliminar">
                          <Trash2 className="w-4 h-4" />
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
        <div className="px-6 py-3 border-t border-gray-100">
          <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-400">
            {filtered.length} de {todosLosProductos.length} productos
          </span>
        </div>
      </div>

      {/* ═══ MODAL VER ═══ */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-2xl h-auto flex flex-col p-0 gap-0">
          <DialogHeader className="px-8 pt-6 pb-4 border-b border-gray-200 flex-shrink-0">
            <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }} className="text-2xl">{selectedProduct?.nombre}</DialogTitle>
            <DialogDescription style={{ fontFamily: 'Inter, sans-serif' }}>
              {selectedProduct?.codigo && <span className="font-mono">{selectedProduct.codigo}</span>}
              {selectedProduct?.marca && <span> · {selectedProduct.marca}</span>}
            </DialogDescription>
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
                      { label: 'Precio de Costo', value: fmt(selectedProduct.precioCompra), cls: 'text-gray-900' },
                      { label: 'Precio de Venta', value: fmt(selectedProduct.precio), cls: 'text-gray-900' },
                      { label: 'Precio Oferta', value: selectedProduct.precioOferta ? fmt(selectedProduct.precioOferta) : 'Sin oferta', cls: selectedProduct.precioOferta ? 'text-[#d65391]' : 'text-gray-300' },
                    ].map(({ label, value, cls }) => (
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
                      ['Marca', selectedProduct.marca || '—'],
                      ['Tipo de Prenda', selectedProduct.tipoProducto || '—'],
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

                {/* Variantes */}
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
                              <td className="py-3 text-gray-700 font-medium">{v.tallaNombre || '—'}</td>
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
                className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors">
                Editar
              </button>
            )}
            <button onClick={() => setViewOpen(false)} style={{ fontFamily: 'Inter, sans-serif' }}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
              Cerrar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ MODAL CREAR / EDITAR ═══ */}
      <Dialog open={formOpen} onOpenChange={open => { if (!saving) setFormOpen(open); }}>
        <DialogContent className="max-w-3xl h-auto flex flex-col p-0 gap-0">
          <DialogHeader className="px-8 pt-6 pb-4 border-b border-gray-200 flex-shrink-0">
            <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }} className="text-2xl">
              {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
            </DialogTitle>
            <DialogDescription style={{ fontFamily: 'Inter, sans-serif' }}>
              {isEditing ? `Modifica la información de ${selectedProduct?.nombre}` : 'Completa los datos para registrar un nuevo artículo'}
            </DialogDescription>
          </DialogHeader>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 px-8 flex-shrink-0">
            {[
              { key: 'info', label: 'Información y Precios' },
              { key: 'variantes', label: 'Tallas, Colores y Stock' },
              { key: 'imagenes', label: 'Imágenes' },
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

              {/* ── TAB INFO ── */}
              {activeTab === 'info' && (
                <>
                  {/* Sección: Datos básicos + Foto */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                      <h3 style={{ fontFamily: 'Inter, sans-serif' }} className="font-semibold text-gray-800 text-base">📋 Datos del Artículo</h3>
                    </div>
                    <div className="p-6">
                      <div className="flex gap-6 items-start">
                        {/* Foto */}
                        <div className="flex-shrink-0">
                          <Label style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm font-medium text-gray-700 mb-2 block">Foto</Label>
                          <label className={`relative flex flex-col items-center justify-center w-32 h-32 rounded-xl border-2 border-dashed cursor-pointer transition-colors overflow-hidden group ${
                            currentImageSrc ? 'border-transparent' : 'border-gray-300 hover:border-[#d65391] bg-gray-50 hover:bg-pink-50'
                          } ${uploadingImg ? 'opacity-60 pointer-events-none' : ''}`}>
                            {currentImageSrc ? (
                              <>
                                <img src={currentImageSrc} alt="preview" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Upload className="w-5 h-5 text-white" />
                                </div>
                              </>
                            ) : (
                              <div className="flex flex-col items-center gap-1 pointer-events-none">
                                {uploadingImg ? <Loader2 className="w-6 h-6 text-[#d65391] animate-spin" /> : <ImageIcon className="w-7 h-7 text-gray-300" />}
                                <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-400 text-center px-2">
                                  {uploadingImg ? 'Subiendo...' : 'Subir foto'}
                                </p>
                              </div>
                            )}
                            <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden"
                              disabled={uploadingImg}
                              onChange={e => { const f = e.target.files?.[0]; if (f) handleImageFile(f); e.target.value = ''; }} />
                          </label>
                          {currentImageSrc && (
                            <button onClick={() => { resetImageState(); setForm(f => ({ ...f, imagenPrincipal: '' })); }}
                              style={{ fontFamily: 'Inter, sans-serif' }}
                              className="mt-1 text-xs text-red-400 hover:text-red-600 w-full text-center transition-colors">
                              Quitar
                            </button>
                          )}
                          <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-400 text-center mt-1">JPG, PNG · 5MB</p>
                        </div>

                        {/* Campos */}
                        <div className="flex-1 grid grid-cols-2 gap-4">
                          <div className="col-span-2">
                            <Label style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm font-medium text-gray-700 mb-1 block">Nombre <span className="text-red-500">*</span></Label>
                            <Input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                              placeholder="Ej: Vestido Floral Primavera" className="h-10 border-gray-300" />
                          </div>
                          <div>
                            <Label style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm font-medium text-gray-700 mb-1 block">Referencia / Código</Label>
                            <Input value={form.codigo} onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))}
                              placeholder="Ej: VES-001" className="h-10 border-gray-300 font-mono" />
                          </div>
                          <div>
                            <Label style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm font-medium text-gray-700 mb-1 block">Categoría <span className="text-red-500">*</span></Label>
                            <Select value={form.categoriaPrincipalID} onValueChange={v => setForm(f => ({ ...f, categoriaPrincipalID: v }))}>
                              <SelectTrigger className="h-10 border-gray-300"><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                              <SelectContent>{categorias.map((c: any) => <SelectItem key={c.id} value={String(c.id)}>{c.nombre}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm font-medium text-gray-700 mb-1 block">Marca</Label>
                            <Select value={form.marcaID} onValueChange={v => setForm(f => ({ ...f, marcaID: v }))}>
                              <SelectTrigger className="h-10 border-gray-300"><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                              <SelectContent>{marcas.map((m: any) => <SelectItem key={m.id} value={String(m.id)}>{m.nombre}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm font-medium text-gray-700 mb-1 block">Tipo de Prenda</Label>
                            <Select value={form.tipoProductoID} onValueChange={v => setForm(f => ({ ...f, tipoProductoID: v }))}>
                              <SelectTrigger className="h-10 border-gray-300"><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                              <SelectContent>{tiposProducto.map((t: any) => <SelectItem key={t.id} value={String(t.id)}>{t.nombre}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      {/* Descripción */}
                      <div className="mt-4">
                        <Label style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm font-medium text-gray-700 mb-1 block">Descripción</Label>
                        <Textarea value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                          placeholder="Describe el artículo: tela, diseño, ocasión de uso..." className="border-gray-300 resize-none" rows={2} />
                      </div>
                    </div>
                  </div>

                  {/* Sección: Precios */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                      <h3 style={{ fontFamily: 'Inter, sans-serif' }} className="font-semibold text-gray-800 text-base">💰 Precios y Stock</h3>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <PriceCard label="Precio Costo" value={form.precioCompra} note="Lo que pagaste"
                          onChange={v => setForm(f => ({ ...f, precioCompra: v }))} />
                        <PriceCard label="Precio de Venta" value={form.precioVenta} required note="Precio al cliente"
                          onChange={v => setForm(f => ({ ...f, precioVenta: v }))} />
                        <PriceCard label="Precio Oferta" value={form.precioOferta} note="Opcional" color="pink"
                          onChange={v => setForm(f => ({ ...f, precioOferta: v }))} />
                      </div>
                      <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                        <div className="flex-1">
                          <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm font-medium text-gray-700">Stock general</p>
                          <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-400 mt-0.5">Si usas variantes por talla/color, el stock se suma automáticamente.</p>
                        </div>
                        <Input type="number" min="0" value={form.stock}
                          onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                          className="w-24 h-10 border-gray-300 text-center font-semibold" />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* ── TAB VARIANTES ── */}
              {activeTab === 'variantes' && (
                <>
                  {/* Tallas */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                      <h3 style={{ fontFamily: 'Inter, sans-serif' }} className="font-semibold text-gray-800 text-base">📏 Tallas disponibles</h3>
                    </div>
                    <div className="p-6 flex flex-wrap gap-3">
                      {tallas.map((t: any) => (
                        <button key={t.id} onClick={() => toggleTalla(t.nombre)} style={{ fontFamily: 'Inter, sans-serif' }}
                          className={`px-5 py-2 rounded-lg text-sm border font-medium transition-colors ${form.tallasSeleccionadas.includes(t.nombre) ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
                          {t.nombre}
                        </button>
                      ))}
                      {tallas.length === 0 && <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-400">No hay tallas registradas.</p>}
                    </div>
                  </div>

                  {/* Colores */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                      <h3 style={{ fontFamily: 'Inter, sans-serif' }} className="font-semibold text-gray-800 text-base">🎨 Colores disponibles</h3>
                    </div>
                    <div className="p-6 flex flex-wrap gap-3">
                      {colores.map((c: any) => (
                        <button key={c.id} onClick={() => toggleColor(c.nombre)} style={{ fontFamily: 'Inter, sans-serif' }}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm border transition-colors ${form.coloresSeleccionados.includes(c.nombre) ? 'border-[#d65391] bg-pink-50 text-[#d65391]' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'}`}>
                          {c.codigoHex && <span className="w-4 h-4 rounded-full border border-gray-200 flex-shrink-0" style={{ background: c.codigoHex }} />}
                          {c.nombre}
                        </button>
                      ))}
                      {colores.length === 0 && <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-400">No hay colores registrados.</p>}
                    </div>
                  </div>

                  {/* Stock por combinación */}
                  {form.variantes.length > 0 ? (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                        <h3 style={{ fontFamily: 'Inter, sans-serif' }} className="font-semibold text-gray-800 text-base">
                          📦 Stock por combinación <span className="font-normal text-gray-400 text-sm">· {form.variantes.length} variantes</span>
                        </h3>
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
                                <td className="py-3 text-right">
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

                  {/* Materiales */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                      <h3 style={{ fontFamily: 'Inter, sans-serif' }} className="font-semibold text-gray-800 text-base">🧵 Materiales / Composición</h3>
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
                      {materiales.length === 0 && <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-400">No hay materiales registrados.</p>}
                    </div>
                  </div>
                </>
              )}

              {/* ── TAB IMÁGENES ── */}
              {activeTab === 'imagenes' && (
                <>
                  {/* Imagen principal */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                      <h3 style={{ fontFamily: 'Inter, sans-serif' }} className="font-semibold text-gray-800 text-base">🖼️ Imagen Principal</h3>
                      <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-400 mt-1">La imagen que se muestra en la lista de productos</p>
                    </div>
                    <div className="p-6 flex items-start gap-4">
                      {(imagePreview || form.imagenPrincipal) ? (
                        <img
                          src={imagePreview || (form.imagenPrincipal.startsWith('http') ? form.imagenPrincipal : `http://localhost:5000${form.imagenPrincipal}`)}
                          alt="Principal"
                          className="w-24 h-24 object-cover rounded-xl border border-gray-200"
                        />
                      ) : (
                        <div className="w-24 h-24 bg-gray-100 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-gray-300" />
                        </div>
                      )}
                      <div className="flex flex-col gap-2">
                        <label className="cursor-pointer px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                          <Upload className="w-4 h-4" />
                          {uploadingImg ? 'Subiendo...' : 'Cambiar imagen'}
                          <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden"
                            disabled={uploadingImg}
                            onChange={e => { const f = e.target.files?.[0]; if (f) handleImageFile(f); e.target.value = ''; }} />
                        </label>
                        {(imagePreview || form.imagenPrincipal) && (
                          <button onClick={() => { resetImageState(); setForm(f => ({ ...f, imagenPrincipal: '' })); }}
                            style={{ fontFamily: 'Inter, sans-serif' }}
                            className="text-xs text-red-400 hover:text-red-600 text-left transition-colors">
                            Quitar imagen
                          </button>
                        )}
                        <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-400">JPG, PNG, WebP · máx. 5MB</p>
                      </div>
                    </div>
                  </div>

                  {/* Imágenes por color */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                      <h3 style={{ fontFamily: 'Inter, sans-serif' }} className="font-semibold text-gray-800 text-base">🎨 Imágenes por Color</h3>
                      <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-400 mt-1">Cuando el cliente elija un color, verá solo las fotos de ese color</p>
                    </div>
                    <div className="p-6">
                      {form.coloresSeleccionados.length === 0 ? (
                        <div className="text-center py-10 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                          <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-400">
                            Primero selecciona los colores en la pestaña <strong>"Tallas, Colores y Stock"</strong>
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-6">
                          {form.coloresSeleccionados.map(colorNombre => {
                            const imgColor = colores.find((c: any) => c.nombre === colorNombre);
                            const hex = imgColor?.hexColor || '#ccc';
                            const imgs = form.imagenesPorColor[colorNombre] || [];
                            const subiendo = uploadingColorImg === colorNombre;
                            return (
                              <div key={colorNombre} className="border border-gray-100 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-3">
                                  <span className="w-5 h-5 rounded-full border border-gray-200 flex-shrink-0" style={{ background: hex }} />
                                  <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm font-semibold text-gray-700">{colorNombre}</span>
                                  <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-400">({imgs.length} foto{imgs.length !== 1 ? 's' : ''})</span>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                  {imgs.map(url => (
                                    <div key={url} className="relative group">
                                      <img
                                        src={url.startsWith('http') ? url : `http://localhost:5000${url}`}
                                        alt={colorNombre}
                                        className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                                      />
                                      <button
                                        onClick={() => quitarImagenColor(colorNombre, url)}
                                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center shadow-sm hover:bg-red-600 transition-colors"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ))}
                                  <label className={`w-20 h-20 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${subiendo ? 'border-gray-200 bg-gray-50' : 'border-gray-300 hover:border-[#d65391] hover:bg-pink-50'}`}>
                                    {subiendo
                                      ? <Loader2 className="w-5 h-5 text-[#d65391] animate-spin" />
                                      : <><Plus className="w-5 h-5 text-gray-400" /><span style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-400 mt-1">Agregar</span></>
                                    }
                                    <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden"
                                      disabled={!!uploadingColorImg}
                                      onChange={e => { const f = e.target.files?.[0]; if (f) subirImagenColor(colorNombre, f); e.target.value = ''; }} />
                                  </label>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

            </div>
          </div>

          <DialogFooter className="gap-2 px-8 py-5 border-t border-gray-200 flex-shrink-0">
            <button onClick={() => setFormOpen(false)} disabled={saving} style={{ fontFamily: 'Inter, sans-serif' }}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50">
              Cancelar
            </button>
            <button onClick={guardar} disabled={saving || uploadingImg} style={{ fontFamily: 'Inter, sans-serif' }}
              className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2 transition-colors">
              {(saving || uploadingImg) && <Loader2 className="w-4 h-4 animate-spin" />}
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
