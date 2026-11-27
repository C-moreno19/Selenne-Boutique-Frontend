import React, { useMemo, useState, useEffect } from 'react';
import { Search, Eye, Edit, Trash2, ChevronRight, Package, X, Loader2, Plus, Upload, Image as ImageIcon, ClipboardList, FileText, Tag, Ruler, Palette, Layers, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../../components/ui/dialog';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Textarea } from '../../../components/ui/textarea';
import { toast } from '@/lib/toast';
import { useProductos, ProductoAdmin, CreateProductoPayload } from '../../../shared/contexts/ProductosContext';
import { useSubcategorias } from '../../../shared/contexts/SubcategoriasContext';
import { useProductosAdmin } from '../../../shared/data/useProductosAdmin';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { apiBase, getAccessToken } from '../../../services/api';

const fmt = (n?: number) =>
  n != null ? `$${new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)} COP` : '—';

const stockColor = (stock: number) => {
  if (stock === 0) return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40';
  if (stock < 5) return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40';
  return 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/40';
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
  imagenesAdicionales: string[];
}

const EMPTY: FormData = {
  nombre: '', codigo: '', descripcion: '',
  categoriaPrincipalID: '', tipoProductoID: '', marcaID: '',
  precioCompra: '', precioVenta: '', precioOferta: '',
  stock: '0', imagenPrincipal: '',
  tallasSeleccionadas: [], coloresSeleccionados: [], materialesSeleccionados: [], variantes: [],
  imagenesPorColor: {},
  imagenesAdicionales: [],
};

// Input de precio tipo tarjeta — sin flechas del navegador
const PriceCard: React.FC<{
  label: string; value: string; required?: boolean; note?: string;
  color?: 'default' | 'pink';
  onChange: (v: string) => void;
}> = ({ label, value, required, note, color = 'default', onChange }) => (
  <div className={`rounded-none border-2 p-4 transition focus-within:border-[#5C2A52] ${
    color === 'pink' ? 'border-[#5C2A52]/30 bg-[#C9A8C3]/40 dark:bg-[#241935]/40' : 'border-[#E7E0DA] dark:border-[#3A2E4D] bg-white dark:bg-[#1e1530]'
  }`}>
    <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className={`text-xs font-semibold uppercase tracking-wide mb-3 ${color === 'pink' ? 'text-[#5C2A52]/70' : 'text-gray-500 dark:text-[#b9aedd]'}`}>
      {label}{required && <span className="text-red-500 ml-1">*</span>}
    </p>
    <div className="flex items-baseline gap-1">
      <span className={`text-sm font-medium ${color === 'pink' ? 'text-[#5C2A52]/50' : 'text-gray-400 dark:text-[#b9aedd]'}`}>$</span>
      <input
        inputMode="numeric"
        value={value}
        onChange={e => onChange(e.target.value.replace(/[^0-9]/g, ''))}
        placeholder={required ? '0' : '—'}
        style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
        className={`flex-1 text-xl font-bold outline-none bg-transparent w-full min-w-0 ${
          color === 'pink' ? 'text-[#5C2A52] placeholder:text-[#5C2A52]/25' : 'text-[#0A0A0A] dark:text-[#F5F3FA] placeholder:text-gray-300 dark:text-[#5a4d52] dark:placeholder:text-[#5a4d52]'
        }`}
      />
    </div>
    <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className={`text-xs mt-1 ${color === 'pink' ? 'text-[#5C2A52]/40' : 'text-gray-400 dark:text-[#b9aedd]'}`}>
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
  const [sortBy, setSortBy] = useState<'nombre' | 'precio' | 'stock' | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const toggleSort = (campo: 'nombre' | 'precio' | 'stock') => {
    if (sortBy === campo) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(campo);
      setSortDir('asc');
    }
  };
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
  const [uploadingAdicional, setUploadingAdicional] = useState(false);

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
    if (estadoFiltro === 'stock_bajo') list = list.filter(p => p.stockBajo);
    if (sortBy) {
      const dir = sortDir === 'asc' ? 1 : -1;
      list = [...list].sort((a, b) => {
        if (sortBy === 'nombre') return a.nombre.localeCompare(b.nombre) * dir;
        if (sortBy === 'precio') return ((a.precio ?? 0) - (b.precio ?? 0)) * dir;
        return ((a.stock ?? 0) - (b.stock ?? 0)) * dir;
      });
    }
    return list;
  }, [todosLosProductos, searchQuery, categoriaFiltro, estadoFiltro, sortBy, sortDir]);

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

  const subirImagenAdicional = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) { toast.error('La imagen no puede superar 5MB'); return; }
    setUploadingAdicional(true);
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
      setForm(f => ({ ...f, imagenesAdicionales: [...f.imagenesAdicionales, url] }));
    } catch { toast.error('Error subiendo imagen'); }
    finally { setUploadingAdicional(false); }
  };

  const quitarImagenAdicional = (url: string) => {
    setForm(f => ({ ...f, imagenesAdicionales: f.imagenesAdicionales.filter(u => u !== url) }));
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
      tallasSeleccionadas: p.tallas?.length
        ? p.tallas
        : [...new Set((p.variantes || []).map((v: any) => v.tallaNombre).filter(Boolean))],
      coloresSeleccionados: p.colores?.length
        ? p.colores
        : [...new Set((p.variantes || []).map((v: any) => v.colorNombre).filter(Boolean))],
      materialesSeleccionados: p.materiales || [],
      variantes: p.variantes?.map(v => ({ tallaNombre: v.tallaNombre || '', colorNombre: v.colorNombre || '', stock: v.stock })) || [],
      imagenesPorColor: p.imagenesPorColor || {},
      imagenesAdicionales: (() => {
        const colorImgs = new Set(Object.values(p.imagenesPorColor || {}).flat());
        const mainImg = p.imagen || '';
        // Usar todas las imágenes no-color, excluyendo la principal
        return (p.imagenes || []).filter(url => url && url !== mainImg && !colorImgs.has(url));
      })(),
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

  // "Talla unica" (u "Unica") es una designacion de que la prenda no tiene
  // tallas especificas, asi que no puede coexistir con S/M/L/etc en el mismo
  // producto: seleccionar una desmarca la otra.
  const esTallaUnica = (nombre: string) => {
    const n = nombre.trim().toLowerCase();
    return n === 'única' || n === 'unica' || n === 'talla única' || n === 'talla unica';
  };

  const toggleTalla = (nombre: string) => {
    if (form.tallasSeleccionadas.includes(nombre)) {
      setForm(f => ({ ...f, tallasSeleccionadas: f.tallasSeleccionadas.filter(t => t !== nombre), variantes: f.variantes.filter(v => v.tallaNombre !== nombre) }));
    } else {
      setForm(f => {
        // Las variantes NUEVAS arrancan en 0 — el campo "Stock" es el total a
        // repartir entre combinaciones, no el valor de cada una (si se copiara
        // el total a cada combinación, el stock se multiplicaría en vez de
        // repartirse). El admin distribuye manualmente con el contador
        // "X / Y unidades distribuidas" de más abajo como guía.
        // Talla unica es excluyente con el resto: al elegir una se descarta la otra.
        const tallasSeleccionadas = esTallaUnica(nombre)
          ? [nombre]
          : [...f.tallasSeleccionadas.filter(t => !esTallaUnica(t)), nombre];
        const newVariantes = f.variantes.filter(v => tallasSeleccionadas.includes(v.tallaNombre));
        if (f.coloresSeleccionados.length === 0) {
          // Sin colores: variante solo por talla
          if (!newVariantes.find(v => v.tallaNombre === nombre && !v.colorNombre))
            newVariantes.push({ tallaNombre: nombre, colorNombre: '', stock: 0 });
        } else {
          f.coloresSeleccionados.forEach(color => {
            if (!newVariantes.find(v => v.tallaNombre === nombre && v.colorNombre === color))
              newVariantes.push({ tallaNombre: nombre, colorNombre: color, stock: 0 });
          });
        }
        return { ...f, tallasSeleccionadas, variantes: newVariantes };
      });
    }
  };

  const toggleColor = (nombre: string) => {
    if (form.coloresSeleccionados.includes(nombre)) {
      setForm(f => {
        const restantesColores = f.coloresSeleccionados.filter(c => c !== nombre);
        let newVariantes = f.variantes.filter(v => v.colorNombre !== nombre);
        // Si queda sin colores, recrear variantes sin color para las tallas
        // seleccionadas conservando lo que ya estaba repartido por talla
        // (sumando sus colores), en vez de resetear al total del producto.
        if (restantesColores.length === 0) {
          newVariantes = f.tallasSeleccionadas.map(talla => ({
            tallaNombre: talla,
            colorNombre: '',
            stock: f.variantes.filter(v => v.tallaNombre === talla).reduce((s, v) => s + (Number(v.stock) || 0), 0),
          }));
        }
        return { ...f, coloresSeleccionados: restantesColores, variantes: newVariantes };
      });
    } else {
      setForm(f => {
        // Ver nota en toggleTalla: las variantes nuevas arrancan en 0, no en
        // el total del producto, para no multiplicar el stock.
        // Quitar variantes sin color (reemplazadas por las de color específico)
        const newVariantes = f.variantes.filter(v => v.colorNombre !== '');
        f.tallasSeleccionadas.forEach(talla => {
          if (!newVariantes.find(v => v.tallaNombre === talla && v.colorNombre === nombre))
            newVariantes.push({ tallaNombre: talla, colorNombre: nombre, stock: 0 });
        });
        return { ...f, coloresSeleccionados: [...f.coloresSeleccionados, nombre], variantes: newVariantes };
      });
    }
  };

  const updateStock = (tallaNombre: string, colorNombre: string, stock: number) => {
    setForm(f => ({ ...f, variantes: f.variantes.map(v => v.tallaNombre === tallaNombre && (v.colorNombre || '') === (colorNombre || '') ? { ...v, stock } : v) }));
  };

  // El tipo de producto elegido puede marcar que no usa tallas/colores (ej.
  // anillos, collares): en ese caso el formulario se simplifica a solo
  // stock general + galeria de fotos, sin pedir variantes.
  const tipoSeleccionado = tiposProducto.find((t: any) => t.id === form.tipoProductoID);
  const esSinVariantes = !!tipoSeleccionado?.sinVariantes;

  // Si el tipo elegido cambia a uno "sin variantes", se limpian tallas/colores
  // que hubieran quedado seleccionados con el tipo anterior.
  useEffect(() => {
    if (esSinVariantes && (form.tallasSeleccionadas.length > 0 || form.coloresSeleccionados.length > 0 || form.variantes.length > 0)) {
      setForm(f => ({ ...f, tallasSeleccionadas: [], coloresSeleccionados: [], variantes: [] }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [esSinVariantes]);

  const guardar = async () => {
    if (!form.nombre.trim()) { toast.error('El nombre es obligatorio'); return; }
    if (!form.precioVenta || Number(form.precioVenta) <= 0) { toast.error('El precio de venta es obligatorio'); return; }
    if (!form.categoriaPrincipalID) { toast.error('Selecciona una categoría'); return; }
    if (form.variantes.length > 0) {
      const totalStock = Number(form.stock) || 0;
      const sumaVariantes = form.variantes.reduce((s, v) => s + (Number(v.stock) || 0), 0);
      if (totalStock > 0 && sumaVariantes > totalStock) {
        toast.error(`El stock distribuido (${sumaVariantes}) supera el stock total (${totalStock}). Ajusta las cantidades.`);
        return;
      }
    }
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
          [...(form.imagenPrincipal ? [form.imagenPrincipal] : []), ...form.imagenesAdicionales],
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
          form.imagenesAdicionales.length > 0 ? form.imagenesAdicionales : undefined,
          form.materialesSeleccionados, materiales
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


  return (
    <div className="p-8 bg-[#F7F5FC] dark:bg-[#17101f] min-h-screen">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-4">
        <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-500 dark:text-[#b9aedd]">Dashboard</span>
        <ChevronRight className="w-4 h-4 text-[#C9A8C3]" />
        <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-medium text-[#0A0A0A] dark:text-[#F5F3FA]">Inventario</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="admin-page-title text-4xl text-[#0A0A0A] dark:text-[#F5F3FA]">Inventario de Productos</h1>
          <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-gray-500 dark:text-[#b9aedd] text-sm mt-1">
            {todosLosProductos.length} productos · los <strong>publicados</strong> son visibles para los clientes
          </p>
        </div>
        {puedeCrear && (
          <button onClick={openCreate} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
            className="px-6 py-3 bg-gradient-to-r from-[#0A0A0A] via-[#3B0A45] to-[#5C2A52] text-white rounded-none hover:opacity-90 flex items-center gap-2 transition">
            <Plus className="w-5 h-5" /> Nuevo Producto
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-[#1e1530] rounded-none p-4 shadow-sm border border-[#E7E0DA] dark:border-[#3A2E4D] flex flex-wrap gap-3 mb-6">
        <div className="flex-1 min-w-[200px] flex items-center gap-2 bg-[#F7F5FC] dark:bg-[#17101f] border border-[#E7E0DA] dark:border-[#3A2E4D] rounded-none px-3 focus-within:ring-2 focus-within:ring-[#5C2A52]">
          <Search className="w-4 h-4 text-gray-400 dark:text-[#b9aedd] shrink-0" />
          <input type="text" placeholder="Buscar por nombre o referencia..." value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
            className="flex-1 bg-transparent py-2.5 text-sm focus:outline-none" />
        </div>
        <Select value={categoriaFiltro} onValueChange={setCategoriaFiltro}>
          <SelectTrigger className="w-44 h-10 border-[#E7E0DA] dark:border-[#3A2E4D] text-sm"><SelectValue placeholder="Categoría" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas las categorías</SelectItem>
            {categorias_unicas.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={estadoFiltro} onValueChange={setEstadoFiltro}>
          <SelectTrigger className="w-40 h-10 border-[#E7E0DA] dark:border-[#3A2E4D] text-sm"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="publicado">Publicados</SelectItem>
            <SelectItem value="no_publicado">No publicados</SelectItem>
            <SelectItem value="agotado">Agotados</SelectItem>
            <SelectItem value="stock_bajo">Stock bajo</SelectItem>
          </SelectContent>
        </Select>
        {(searchQuery || categoriaFiltro !== 'todas' || estadoFiltro !== 'todos') && (
          <button onClick={() => { setSearchQuery(''); setCategoriaFiltro('todas'); setEstadoFiltro('todos'); }}
            className="px-3 py-2 text-gray-400 dark:text-[#b9aedd] hover:text-gray-600 dark:text-[#b9aedd] dark:hover:text-[#F5F3FA] flex items-center gap-1 text-sm">
            <X className="w-4 h-4" /> Limpiar
          </button>
        )}
        <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="ml-auto self-center text-sm text-gray-500 dark:text-[#b9aedd]">
          <strong className="text-[#0A0A0A] dark:text-[#F5F3FA]">{filtered.length}</strong> de <strong className="text-[#0A0A0A] dark:text-[#F5F3FA]">{todosLosProductos.length}</strong>
        </span>
      </div>

      {/* Tabla */}
      <div className="bg-white dark:bg-[#1e1530] rounded-none shadow-sm border border-[#E7E0DA] dark:border-[#3A2E4D] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-[#0A0A0A] via-[#3B0A45] to-[#5C2A52]">
              <tr>
                <th className="px-4 py-3 w-14"></th>
                {([
                  { label: 'PRODUCTO', campo: 'nombre' as const },
                  { label: 'MARCA / CATEGORÍA', campo: null },
                  { label: 'COSTO', campo: null },
                  { label: 'PRECIO', campo: 'precio' as const },
                  { label: 'STOCK', campo: 'stock' as const },
                  { label: 'TALLAS', campo: null },
                  { label: 'PUBLICADO', campo: null },
                  { label: '', campo: null },
                ]).map(({ label, campo }) => (
                  <th key={label || 'acciones'} className="px-4 py-3 text-left">
                    {campo ? (
                      <button
                        onClick={() => toggleSort(campo)}
                        style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                        className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-[#C9A8C3] hover:text-white transition-colors"
                      >
                        {label}
                        {sortBy === campo
                          ? (sortDir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)
                          : <ArrowUpDown className="w-3 h-3 opacity-40" />}
                      </button>
                    ) : (
                      <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs font-semibold uppercase tracking-wider text-[#C9A8C3]">{label}</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-[#3A2E4D]">
              {filtered.map(p => (
                <tr key={p.id} className="group relative hover:bg-[#F7F5FC] dark:hover:bg-[#17101f]/70 transition">
                  {/* Imagen */}
                  <td className="px-4 py-3">
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#5C2A52] scale-y-0 group-hover:scale-y-100 transition-transform origin-center" />
                    {p.imagen ? (
                      <img src={p.imagen} alt={p.nombre} className="w-14 h-14 object-cover rounded-none border border-[#E7E0DA] dark:border-[#3A2E4D] shadow-sm" />
                    ) : (
                      <div className="w-14 h-14 bg-gray-100 dark:bg-[#221830] rounded-none flex items-center justify-center">
                        <Package className="w-5 h-5 text-gray-300 dark:text-[#5a4d52]" />
                      </div>
                    )}
                  </td>
                  {/* Nombre + código */}
                  <td className="px-4 py-3">
                    <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="font-semibold text-[#0A0A0A] dark:text-[#F5F3FA] text-sm">{p.nombre}</p>
                    {p.codigo && <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-400 dark:text-[#b9aedd] font-mono mt-0.5">{p.codigo}</p>}
                  </td>
                  {/* Marca / Categoría */}
                  <td className="px-4 py-3">
                    <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-700 dark:text-[#F5F3FA]">{p.marca || '—'}</p>
                    <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-400 dark:text-[#b9aedd]">{p.categoria}</p>
                  </td>
                  {/* Costo */}
                  <td className="px-4 py-3">
                    <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-500 dark:text-[#b9aedd]">{fmt(p.precioCompra)}</span>
                  </td>
                  {/* Precio (venta + oferta combinados) */}
                  <td className="px-4 py-3">
                    {p.precioOferta ? (
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5">
                          <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-semibold text-[#5C2A52]">{fmt(p.precioOferta)}</span>
                          {p.precio > 0 && (
                            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400">
                              -{Math.round((1 - p.precioOferta / p.precio) * 100)}%
                            </span>
                          )}
                        </div>
                        <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-400 dark:text-[#b9aedd] line-through">{fmt(p.precio)}</span>
                      </div>
                    ) : (
                      <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-semibold text-[#0A0A0A] dark:text-[#F5F3FA]">{fmt(p.precio)}</span>
                    )}
                  </td>
                  {/* Stock */}
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-none text-xs font-semibold ${stockColor(p.stock)}`}>
                      {p.stock === 0 ? 'Agotado' : p.stockBajo ? `${p.stock} uds · Bajo` : `${p.stock} uds`}
                    </span>
                  </td>
                  {/* Tallas / Colores */}
                  <td className="px-4 py-3">
                    {p.tallas.length > 0 ? (
                      <div className="flex flex-col gap-0.5">
                        <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-600 dark:text-[#b9aedd]">
                          {p.tallas.slice(0, 3).join(', ')}{p.tallas.length > 3 ? ` +${p.tallas.length - 3}` : ''}
                        </span>
                        {p.colores.length > 0 && (
                          <div className="flex gap-1">
                            {p.colores.slice(0, 4).map(c => {
                              const hex = colores.find((x: any) => x.nombre === c)?.hexColor || '#ccc';
                              return <span key={c} className="w-3 h-3 rounded-full border border-gray-300 dark:border-[#3A2E4D] inline-block" style={{ backgroundColor: hex }} title={c} />;
                            })}
                            {p.colores.length > 4 && <span className="text-xs text-gray-400 dark:text-[#b9aedd]">+{p.colores.length - 4}</span>}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-orange-500 font-medium">Sin tallas</span>
                    )}
                  </td>
                  {/* Toggle publicado */}
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleEstado(p)}
                      disabled={!puedeEditar}
                      style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        p.activo
                          ? 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/50 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-900/50'
                          : 'bg-gray-100 dark:bg-[#221830] text-gray-500 dark:text-[#b9aedd] border-[#E7E0DA] dark:border-[#3A2E4D] hover:bg-green-50 dark:hover:bg-green-950/40 hover:text-green-700 dark:hover:text-green-400 hover:border-green-200 dark:hover:border-green-900/50'
                      } ${!puedeEditar ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      title={p.activo ? 'Clic para ocultar' : 'Clic para publicar'}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${p.activo ? 'bg-green-500' : 'bg-gray-400 dark:bg-[#5a4d52]'}`} />
                      {p.activo ? 'Publicado' : 'Oculto'}
                    </button>
                  </td>
                  {/* Acciones */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setSelectedProduct(p); setViewOpen(true); }}
                        className="p-1.5 text-gray-400 dark:text-[#b9aedd] hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400 rounded-none transition" title="Ver detalle">
                        <Eye className="w-4 h-4" />
                      </button>
                      {puedeEditar && (
                        <button onClick={() => openEdit(p)}
                          className="p-1.5 text-gray-400 dark:text-[#b9aedd] hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-600 dark:hover:text-amber-400 rounded-none transition" title="Editar">
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      {puedeEliminar && (
                        <button onClick={() => { setSelectedProduct(p); setDeleteOpen(true); }}
                          className="p-1.5 text-gray-400 dark:text-[#b9aedd] hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-400 rounded-none transition" title="Eliminar">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="px-6 py-16 text-center">
                  <Package className="w-12 h-12 text-gray-200 dark:text-[#3A2E4D] mx-auto mb-3" />
                  <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-gray-400 dark:text-[#b9aedd]">No se encontraron productos</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 border-t border-[#E7E0DA] dark:border-[#3A2E4D]">
          <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-400 dark:text-[#b9aedd]">
            {filtered.length} de {todosLosProductos.length} productos
          </span>
        </div>
      </div>

      {/* ═══ MODAL VER ═══ */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-2xl h-auto flex flex-col p-0 gap-0">
          <div className="px-8 pt-6 pb-5 flex-shrink-0" style={{ background: 'linear-gradient(90deg, #0A0A0A 0%, #3B0A45 55%, #5C2A52 100%)' }}>
            <p className="text-[10px] font-bold uppercase tracking-[3px] text-[#C9A8C3] mb-1">District Store</p>
            <DialogTitle style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xl font-bold text-white flex items-center gap-2">
              <Package className="w-5 h-5 opacity-80" /> {selectedProduct?.nombre}
            </DialogTitle>
            <DialogDescription style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-[#C9A8C3] text-sm mt-0.5">
              {selectedProduct?.codigo && <span className="font-mono">{selectedProduct.codigo}</span>}
              {selectedProduct?.marca && <span> · {selectedProduct.marca}</span>}
            </DialogDescription>
          </div>
          {selectedProduct && (
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-6 py-6 px-8">

                {/* Imagen + precios */}
                <div className="flex gap-6 items-start">
                  {selectedProduct.imagen ? (
                    <img src={selectedProduct.imagen} alt={selectedProduct.nombre}
                      className="w-32 h-32 object-cover rounded-none border border-[#E7E0DA] dark:border-[#3A2E4D] flex-shrink-0" />
                  ) : (
                    <div className="w-32 h-32 bg-gray-100 dark:bg-[#221830] rounded-none flex items-center justify-center flex-shrink-0 border border-[#E7E0DA] dark:border-[#3A2E4D]">
                      <Package className="w-8 h-8 text-gray-300 dark:text-[#5a4d52]" />
                    </div>
                  )}
                  <div className="flex-1 grid grid-cols-3 gap-4">
                    {[
                      { label: 'Precio de Costo', value: fmt(selectedProduct.precioCompra), cls: 'text-[#0A0A0A] dark:text-[#F5F3FA]' },
                      { label: 'Precio de Venta', value: fmt(selectedProduct.precio), cls: 'text-[#0A0A0A] dark:text-[#F5F3FA]' },
                      { label: 'Precio Oferta', value: selectedProduct.precioOferta ? fmt(selectedProduct.precioOferta) : 'Sin oferta', cls: selectedProduct.precioOferta ? 'text-[#5C2A52]' : 'text-gray-300 dark:text-[#5a4d52]' },
                    ].map(({ label, value, cls }) => (
                      <div key={label} className="bg-[#F7F5FC] dark:bg-[#17101f] rounded-none p-4">
                        <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-500 dark:text-[#b9aedd] mb-2 uppercase tracking-wide">{label}</p>
                        <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className={`text-base font-bold ${cls}`}>{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Info general */}
                <div className="bg-white dark:bg-[#1e1530] rounded-none border border-[#E7E0DA] dark:border-[#3A2E4D] shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-[#0A0A0A] via-[#3B0A45] to-[#5C2A52] px-6 py-4">
                    <h3 style={{ fontFamily: '"Playfair Display", Georgia, serif' }} className="font-semibold text-white text-base flex items-center gap-2"><ClipboardList className="w-4 h-4 text-[#C9A8C3]" />Información General</h3>
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
                        <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-500 dark:text-[#b9aedd] font-medium uppercase">{label}</p>
                        <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-semibold text-[#0A0A0A] dark:text-[#F5F3FA]">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Variantes */}
                {selectedProduct.variantes?.length > 0 && (
                  <div className="bg-white dark:bg-[#1e1530] rounded-none border border-[#E7E0DA] dark:border-[#3A2E4D] shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-r from-[#0A0A0A] via-[#3B0A45] to-[#5C2A52] px-6 py-4">
                      <h3 style={{ fontFamily: '"Playfair Display", Georgia, serif' }} className="font-semibold text-white text-base flex items-center gap-2"><Package className="w-4 h-4 text-[#C9A8C3]" />Stock por Talla y Color</h3>
                    </div>
                    <div className="p-6">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-[#E7E0DA] dark:border-[#3A2E4D]">
                            <th className="pb-3 text-left text-xs text-gray-500 dark:text-[#b9aedd] uppercase font-semibold">Talla</th>
                            <th className="pb-3 text-left text-xs text-gray-500 dark:text-[#b9aedd] uppercase font-semibold">Color</th>
                            <th className="pb-3 text-right text-xs text-gray-500 dark:text-[#b9aedd] uppercase font-semibold">Stock</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-[#3A2E4D]">
                          {selectedProduct.variantes.map((v, i) => (
                            <tr key={i}>
                              <td className="py-3 text-gray-700 dark:text-[#F5F3FA] font-medium">{v.tallaNombre || '—'}</td>
                              <td className="py-3 text-gray-700 dark:text-[#F5F3FA]">{v.colorNombre || '—'}</td>
                              <td className="py-3 text-right">
                                <span className={`px-2 py-1 rounded-none text-xs font-semibold ${stockColor(v.stock)}`}>
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
                  <div className="bg-white dark:bg-[#1e1530] rounded-none border border-[#E7E0DA] dark:border-[#3A2E4D] shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-r from-[#0A0A0A] via-[#3B0A45] to-[#5C2A52] px-6 py-4">
                      <h3 style={{ fontFamily: '"Playfair Display", Georgia, serif' }} className="font-semibold text-white text-base flex items-center gap-2"><FileText className="w-4 h-4 text-[#C9A8C3]" />Descripción</h3>
                    </div>
                    <div className="p-6">
                      <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-700 dark:text-[#F5F3FA] leading-relaxed">{selectedProduct.descripcion}</p>
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}
          <DialogFooter className="gap-2 px-8 py-5 border-t border-[#E7E0DA] dark:border-[#3A2E4D] flex-shrink-0">
            {puedeEditar && selectedProduct && (
              <button onClick={() => { setViewOpen(false); openEdit(selectedProduct); }}
                style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                className="px-6 py-2 bg-gradient-to-r from-[#0A0A0A] via-[#3B0A45] to-[#5C2A52] text-white rounded-none hover:opacity-90 transition">
                Editar
              </button>
            )}
            <button onClick={() => setViewOpen(false)} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
              className="px-6 py-2 bg-gray-100 dark:bg-[#221830] text-gray-700 dark:text-[#F5F3FA] rounded-none hover:bg-gray-200 dark:hover:bg-[#241935] transition">
              Cerrar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ MODAL CREAR / EDITAR ═══ */}
      <Dialog open={formOpen} onOpenChange={open => { if (!saving) setFormOpen(open); }}>
        <DialogContent className="max-w-3xl h-auto flex flex-col p-0 gap-0">
          <DialogHeader className="px-8 pt-6 pb-4 border-b border-[#E7E0DA] dark:border-[#3A2E4D] flex-shrink-0">
            <DialogTitle style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-2xl">
              {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
            </DialogTitle>
            <DialogDescription style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
              {isEditing ? `Modifica la información de ${selectedProduct?.nombre}` : 'Completa los datos para registrar un nuevo artículo'}
            </DialogDescription>
          </DialogHeader>

          {/* Tabs — con indicadores de progreso para guiar al admin paso a paso */}
          {(() => {
            const infoCompleta = !!(form.nombre.trim() && form.categoriaPrincipalID && form.precioVenta && Number(form.precioVenta) > 0);
            const variantesCompletas = esSinVariantes || form.tallasSeleccionadas.length > 0;
            const coloresSinFotos = form.coloresSeleccionados.filter(c => (form.imagenesPorColor[c]?.length || 0) === 0);
            const faltaImagenPrincipal = !form.imagenPrincipal && !imagePreview;
            const imagenesOk = !faltaImagenPrincipal && coloresSinFotos.length === 0;
            const tabs = [
              { key: 'info', label: 'Información y Precios', ok: infoCompleta },
              { key: 'variantes', label: 'Tallas, Colores y Stock', ok: variantesCompletas },
              { key: 'imagenes', label: 'Imágenes', ok: imagenesOk, warn: !imagenesOk },
            ];
            return (
              <div className="flex border-b border-[#E7E0DA] dark:border-[#3A2E4D] px-8 flex-shrink-0">
                {tabs.map(tab => (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
                    style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                    className={`px-5 py-3 text-sm font-medium border-b-2 transition flex items-center gap-2 ${activeTab === tab.key ? 'border-[#5C2A52] text-[#5C2A52]' : 'border-transparent text-gray-500 dark:text-[#b9aedd] hover:text-gray-700 dark:text-[#F5F3FA] dark:hover:text-[#F5F3FA]'}`}>
                    {tab.label}
                    {tab.ok ? (
                      <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px]">✓</span>
                    ) : tab.warn ? (
                      <span className="w-4 h-4 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center text-[10px] font-bold">!</span>
                    ) : null}
                  </button>
                ))}
              </div>
            );
          })()}

          <div className="flex-1 overflow-y-auto max-h-[65vh]">
            <div className="space-y-6 py-6 px-8">

              {/* ── TAB INFO ── */}
              {activeTab === 'info' && (
                <div key="info" className="animate-fade-slide-in space-y-6">
                  {/* Sección: Datos básicos + Foto */}
                  <div className="bg-white dark:bg-[#1e1530] rounded-none border border-[#E7E0DA] dark:border-[#3A2E4D] shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-r from-[#0A0A0A] via-[#3B0A45] to-[#5C2A52] px-6 py-4">
                      <h3 style={{ fontFamily: '"Playfair Display", Georgia, serif' }} className="font-semibold text-white text-base flex items-center gap-2"><ClipboardList className="w-4 h-4 text-[#C9A8C3]" />Datos del Artículo</h3>
                    </div>
                    <div className="p-6">
                      <div className="flex gap-6 items-start">
                        {/* Campos */}
                        <div className="flex-1 grid grid-cols-2 gap-4">
                          <div className="col-span-2">
                            <Label style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-medium text-gray-700 dark:text-[#F5F3FA] mb-1 block">Nombre <span className="text-red-500">*</span></Label>
                            <Input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                              placeholder="Ej: Vestido Floral Primavera" className="h-10 border-gray-300 dark:border-[#3A2E4D]" />
                          </div>
                          <div>
                            <Label style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-medium text-gray-700 dark:text-[#F5F3FA] mb-1 block">Categoría <span className="text-red-500">*</span></Label>
                            <Select value={form.categoriaPrincipalID} onValueChange={v => setForm(f => {
                              const nuevaCatNombre = categorias.find((c: any) => String(c.id) === v)?.nombre?.toLowerCase();
                              const tipoSigueValido = tiposProducto.find((t: any) => String(t.id) === f.tipoProductoID && (
                                !t.categoriasAplicables || t.categoriasAplicables.split(',').includes(nuevaCatNombre)
                              ));
                              return { ...f, categoriaPrincipalID: v, tipoProductoID: tipoSigueValido ? f.tipoProductoID : '' };
                            })}>
                              <SelectTrigger className="h-10 border-gray-300 dark:border-[#3A2E4D]"><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                              <SelectContent>{categorias.map((c: any) => <SelectItem key={c.id} value={String(c.id)}>{c.nombre}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-medium text-gray-700 dark:text-[#F5F3FA] mb-1 block">Marca</Label>
                            <Select value={form.marcaID} onValueChange={v => setForm(f => ({ ...f, marcaID: v }))}>
                              <SelectTrigger className="h-10 border-gray-300 dark:border-[#3A2E4D]"><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                              <SelectContent>{marcas.map((m: any) => <SelectItem key={m.id} value={String(m.id)}>{m.nombre}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-medium text-gray-700 dark:text-[#F5F3FA] mb-1 block">Tipo de Prenda</Label>
                            {(() => {
                              const catNombre = categorias.find((c: any) => String(c.id) === form.categoriaPrincipalID)?.nombre?.toLowerCase();
                              const tiposFiltrados = tiposProducto.filter((t: any) =>
                                !t.categoriasAplicables || !catNombre || t.categoriasAplicables.split(',').includes(catNombre)
                              );
                              return (
                                <Select value={form.tipoProductoID} onValueChange={v => setForm(f => ({ ...f, tipoProductoID: v }))}>
                                  <SelectTrigger className="h-10 border-gray-300 dark:border-[#3A2E4D]"><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                                  <SelectContent>{tiposFiltrados.map((t: any) => <SelectItem key={t.id} value={String(t.id)}>{t.nombre}</SelectItem>)}</SelectContent>
                                </Select>
                              );
                            })()}
                          </div>
                        </div>
                      </div>

                      {/* Descripción */}
                      <div className="mt-4">
                        <Label style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-medium text-gray-700 dark:text-[#F5F3FA] mb-1 block">Descripción</Label>
                        <Textarea value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                          placeholder="Describe el artículo: tela, diseño, ocasión de uso..." className="border-gray-300 dark:border-[#3A2E4D] resize-none" rows={2} />
                      </div>
                    </div>
                  </div>

                  {/* Sección: Precios */}
                  <div className="bg-white dark:bg-[#1e1530] rounded-none border border-[#E7E0DA] dark:border-[#3A2E4D] shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-r from-[#0A0A0A] via-[#3B0A45] to-[#5C2A52] px-6 py-4">
                      <h3 style={{ fontFamily: '"Playfair Display", Georgia, serif' }} className="font-semibold text-white text-base flex items-center gap-2"><Tag className="w-4 h-4 text-[#C9A8C3]" />Precios y Stock</h3>
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
                      <div className="flex items-center gap-4 pt-4 border-t border-[#E7E0DA] dark:border-[#3A2E4D]">
                        <div className="flex-1">
                          <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-medium text-gray-700 dark:text-[#F5F3FA]">Stock general</p>
                          <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-400 dark:text-[#b9aedd] mt-0.5">Si usas variantes por talla/color, el stock se suma automáticamente.</p>
                        </div>
                        <Input type="number" min="0" value={form.stock}
                          onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                          onFocus={e => e.target.select()}
                          className="w-24 h-10 border-gray-300 dark:border-[#3A2E4D] text-center font-semibold" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB VARIANTES ── */}
              {activeTab === 'variantes' && esSinVariantes && (
                <div key="variantes-simple" className="animate-fade-slide-in">
                  <div className="text-center py-12 bg-[#F7F5FC] dark:bg-[#17101f] rounded-none border-2 border-dashed border-[#E7E0DA] dark:border-[#3A2E4D]">
                    <Package className="w-10 h-10 mx-auto mb-3 text-gray-300 dark:text-[#5a4d52]" />
                    <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-medium text-gray-600 dark:text-[#F5F3FA]">
                      "{tipoSeleccionado?.nombre}" no usa tallas ni colores
                    </p>
                    <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-400 dark:text-[#b9aedd] mt-1">
                      El stock se controla con el campo "Stock general" de la pestaña Información y Precios.
                    </p>
                  </div>
                </div>
              )}
              {activeTab === 'variantes' && !esSinVariantes && (
                <div key="variantes" className="animate-fade-slide-in space-y-6">
                  {/* Tallas */}
                  <div className="bg-white dark:bg-[#1e1530] rounded-none border border-[#E7E0DA] dark:border-[#3A2E4D] shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-r from-[#0A0A0A] via-[#3B0A45] to-[#5C2A52] px-6 py-4">
                      <h3 style={{ fontFamily: '"Playfair Display", Georgia, serif' }} className="font-semibold text-white text-base flex items-center gap-2"><Ruler className="w-4 h-4 text-[#C9A8C3]" />Tallas disponibles</h3>
                    </div>
                    <div className="p-6 flex flex-wrap gap-3">
                      {tallas.map((t: any) => (
                        <button key={t.id} onClick={() => toggleTalla(t.nombre)} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                          className={`px-5 py-2 rounded-none text-sm border font-medium transition ${form.tallasSeleccionadas.includes(t.nombre) ? 'bg-[#0A0A0A] text-white border-[#0A0A0A]' : 'bg-white dark:bg-[#1e1530] text-gray-600 dark:text-[#b9aedd] border-[#E7E0DA] dark:border-[#3A2E4D] hover:border-gray-400 dark:hover:border-[#5a4d52]'}`}>
                          {t.nombre}
                        </button>
                      ))}
                      {tallas.length === 0 && <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-400 dark:text-[#b9aedd]">No hay tallas registradas.</p>}
                    </div>
                  </div>

                  {/* Colores */}
                  <div className="bg-white dark:bg-[#1e1530] rounded-none border border-[#E7E0DA] dark:border-[#3A2E4D] shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-r from-[#0A0A0A] via-[#3B0A45] to-[#5C2A52] px-6 py-4">
                      <h3 style={{ fontFamily: '"Playfair Display", Georgia, serif' }} className="font-semibold text-white text-base flex items-center gap-2"><Palette className="w-4 h-4 text-[#C9A8C3]" />Colores disponibles</h3>
                    </div>
                    <div className="p-6 flex flex-wrap gap-3">
                      {colores.map((c: any) => (
                        <button key={c.id} onClick={() => toggleColor(c.nombre)} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                          className={`flex items-center gap-2 px-4 py-2 rounded-none text-sm border transition ${form.coloresSeleccionados.includes(c.nombre) ? 'border-[#5C2A52] bg-[#C9A8C3] dark:bg-[#241935] text-[#5C2A52]' : 'bg-white dark:bg-[#1e1530] border-[#E7E0DA] dark:border-[#3A2E4D] text-gray-600 dark:text-[#b9aedd] hover:border-gray-400 dark:hover:border-[#5a4d52]'}`}>
                          {c.codigoHex && <span className="w-4 h-4 rounded-full border border-[#E7E0DA] dark:border-[#3A2E4D] flex-shrink-0" style={{ background: c.codigoHex }} />}
                          {c.nombre}
                        </button>
                      ))}
                      {colores.length === 0 && <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-400 dark:text-[#b9aedd]">No hay colores registrados.</p>}
                    </div>
                  </div>

                  {/* Stock por combinación */}
                  {form.variantes.length > 0 ? (
                    <div className="bg-white dark:bg-[#1e1530] rounded-none border border-[#E7E0DA] dark:border-[#3A2E4D] shadow-sm overflow-hidden">
                      <div className="bg-gradient-to-r from-[#0A0A0A] via-[#3B0A45] to-[#5C2A52] px-6 py-4">
                        <h3 style={{ fontFamily: '"Playfair Display", Georgia, serif' }} className="font-semibold text-white text-base flex items-center gap-2">
                          <Package className="w-4 h-4 text-[#C9A8C3]" />Stock por combinación <span className="font-normal text-gray-400 dark:text-[#b9aedd] text-sm">· {form.variantes.length} variantes</span>
                        </h3>
                        {(() => {
                          const total = Number(form.stock) || 0;
                          const usado = form.variantes.reduce((s, v) => s + (Number(v.stock) || 0), 0);
                          const restante = total - usado;
                          if (total === 0) return null;
                          return (
                            <p className={`text-xs mt-1 font-medium ${restante < 0 ? 'text-red-500' : restante === 0 ? 'text-emerald-600' : 'text-gray-500 dark:text-[#b9aedd]'}`}>
                              {usado} / {total} unidades distribuidas{restante > 0 ? ` · ${restante} disponibles` : restante < 0 ? ` · ${Math.abs(restante)} excedidos` : ' · completo'}
                            </p>
                          );
                        })()}
                      </div>
                      <div className="p-6">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-[#E7E0DA] dark:border-[#3A2E4D]">
                              <th className="pb-3 text-left text-xs text-gray-500 dark:text-[#b9aedd] uppercase font-semibold">Talla</th>
                              <th className="pb-3 text-left text-xs text-gray-500 dark:text-[#b9aedd] uppercase font-semibold">Color</th>
                              <th className="pb-3 text-right text-xs text-gray-500 dark:text-[#b9aedd] uppercase font-semibold">Stock (unidades)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50 dark:divide-[#3A2E4D]">
                            {form.variantes.map((v, i) => (
                              <tr key={i}>
                                <td className="py-3 font-medium text-gray-700 dark:text-[#F5F3FA]">{v.tallaNombre || '—'}</td>
                                <td className="py-3 text-gray-700 dark:text-[#F5F3FA]">{v.colorNombre || <span className="text-gray-400 dark:text-[#b9aedd] italic text-xs">sin color</span>}</td>
                                <td className="py-3 text-right">
                                  <Input type="number" min="0" value={v.stock === 0 ? '' : v.stock}
                                    placeholder="0"
                                    onChange={e => updateStock(v.tallaNombre, v.colorNombre, e.target.value === '' ? 0 : Number(e.target.value))}
                                    onFocus={e => e.target.select()}
                                    className="h-8 w-24 ml-auto border-gray-300 dark:border-[#3A2E4D] text-center text-sm" />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-[#F7F5FC] dark:bg-[#17101f] rounded-none border-2 border-dashed border-[#E7E0DA] dark:border-[#3A2E4D]">
                      <Package className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-[#5a4d52]" />
                      <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-400 dark:text-[#b9aedd]">Selecciona al menos una talla para configurar el stock por variante</p>
                    </div>
                  )}

                  {/* Materiales */}
                  <div className="bg-white dark:bg-[#1e1530] rounded-none border border-[#E7E0DA] dark:border-[#3A2E4D] shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-r from-[#0A0A0A] via-[#3B0A45] to-[#5C2A52] px-6 py-4">
                      <h3 style={{ fontFamily: '"Playfair Display", Georgia, serif' }} className="font-semibold text-white text-base flex items-center gap-2"><Layers className="w-4 h-4 text-[#C9A8C3]" />Materiales / Composición</h3>
                    </div>
                    <div className="p-6 flex flex-wrap gap-3">
                      {materiales.map((m: any) => (
                        <button key={m.id} onClick={() => setForm(f => ({
                          ...f,
                          materialesSeleccionados: f.materialesSeleccionados.includes(m.nombre)
                            ? f.materialesSeleccionados.filter(x => x !== m.nombre)
                            : [...f.materialesSeleccionados, m.nombre]
                        }))} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                          className={`px-4 py-2 rounded-none text-sm border transition ${form.materialesSeleccionados.includes(m.nombre) ? 'bg-[#5C2A52] text-white border-[#5C2A52]' : 'bg-white dark:bg-[#1e1530] text-gray-600 dark:text-[#b9aedd] border-[#E7E0DA] dark:border-[#3A2E4D] hover:border-[#5C2A52]'}`}>
                          {m.nombre}
                        </button>
                      ))}
                      {materiales.length === 0 && <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-400 dark:text-[#b9aedd]">No hay materiales registrados.</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB IMÁGENES ── */}
              {activeTab === 'imagenes' && (
                <div key="imagenes" className="animate-fade-slide-in space-y-6">
                  {/* Imagen principal */}
                  <div className="bg-white dark:bg-[#1e1530] rounded-none border border-[#E7E0DA] dark:border-[#3A2E4D] shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-r from-[#0A0A0A] via-[#3B0A45] to-[#5C2A52] px-6 py-4">
                      <h3 style={{ fontFamily: '"Playfair Display", Georgia, serif' }} className="font-semibold text-white text-base flex items-center gap-2"><ImageIcon className="w-4 h-4 text-[#C9A8C3]" />Imagen Principal</h3>
                      <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-400 dark:text-[#b9aedd] mt-1">La imagen que se muestra en la lista de productos</p>
                    </div>
                    <div className="p-6 flex items-start gap-4">
                      {(imagePreview || form.imagenPrincipal) ? (
                        <img
                          src={imagePreview || (form.imagenPrincipal.startsWith('http') ? form.imagenPrincipal : `${apiBase}${form.imagenPrincipal}`)}
                          alt="Principal"
                          className="w-24 h-24 object-cover rounded-none border border-[#E7E0DA] dark:border-[#3A2E4D]"
                        />
                      ) : (
                        <div className="w-24 h-24 bg-gray-100 dark:bg-[#221830] rounded-none border-2 border-dashed border-[#E7E0DA] dark:border-[#3A2E4D] flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-gray-300 dark:text-[#5a4d52]" />
                        </div>
                      )}
                      <div className="flex flex-col gap-2">
                        <label className="cursor-pointer px-4 py-2 bg-gray-100 dark:bg-[#221830] hover:bg-gray-200 dark:hover:bg-[#241935] text-gray-700 dark:text-[#F5F3FA] rounded-none text-sm font-medium transition flex items-center gap-2" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
                          <Upload className="w-4 h-4" />
                          {uploadingImg ? 'Subiendo...' : 'Cambiar imagen'}
                          <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden"
                            disabled={uploadingImg}
                            onChange={e => { const f = e.target.files?.[0]; if (f) handleImageFile(f); e.target.value = ''; }} />
                        </label>
                        {(imagePreview || form.imagenPrincipal) && (
                          <button onClick={() => { resetImageState(); setForm(f => ({ ...f, imagenPrincipal: '' })); }}
                            style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                            className="text-xs text-red-400 hover:text-red-600 text-left transition">
                            Quitar imagen
                          </button>
                        )}
                        <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-400 dark:text-[#b9aedd]">JPG, PNG, WebP · máx. 5MB</p>
                      </div>
                    </div>
                  </div>

                  {/* Imágenes por color */}
                  <div className="bg-white dark:bg-[#1e1530] rounded-none border border-[#E7E0DA] dark:border-[#3A2E4D] shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-r from-[#0A0A0A] via-[#3B0A45] to-[#5C2A52] px-6 py-4">
                      <h3 style={{ fontFamily: '"Playfair Display", Georgia, serif' }} className="font-semibold text-white text-base flex items-center gap-2"><Palette className="w-4 h-4 text-[#C9A8C3]" />Imágenes por Color</h3>
                      <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-400 dark:text-[#b9aedd] mt-1">Sube aquí todas las fotos de este producto. Cuando el cliente elija un color, verá solo las fotos que subiste para ese color — sube al menos una foto por cada color para que ninguna quede escondida.</p>
                    </div>
                    <div className="p-6">
                      {form.coloresSeleccionados.length === 0 ? (
                        <div className="text-center py-10 bg-[#F7F5FC] dark:bg-[#17101f] rounded-none border-2 border-dashed border-[#E7E0DA] dark:border-[#3A2E4D]">
                          <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-400 dark:text-[#b9aedd]">
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
                            const sinFotos = imgs.length === 0;
                            return (
                              <div key={colorNombre} className={`border rounded-none p-4 ${sinFotos ? 'border-amber-300 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/10' : 'border-[#E7E0DA] dark:border-[#3A2E4D]'}`}>
                                <div className="flex items-center gap-2 mb-3">
                                  <span className="w-5 h-5 rounded-full border border-[#E7E0DA] dark:border-[#3A2E4D] flex-shrink-0" style={{ background: hex }} />
                                  <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-semibold text-gray-700 dark:text-[#F5F3FA]">{colorNombre}</span>
                                  {sinFotos ? (
                                    <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-[11px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/40 px-2 py-0.5">
                                      Sin fotos — los clientes no verán este color
                                    </span>
                                  ) : (
                                    <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-400 dark:text-[#b9aedd]">({imgs.length} foto{imgs.length !== 1 ? 's' : ''})</span>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-3">
                                  {imgs.map(url => (
                                    <div key={url} className="relative group">
                                      <img
                                        src={url.startsWith('http') ? url : `${apiBase}${url}`}
                                        alt={colorNombre}
                                        className="w-20 h-20 object-cover rounded-none border border-[#E7E0DA] dark:border-[#3A2E4D]"
                                      />
                                      <button
                                        onClick={() => quitarImagenColor(colorNombre, url)}
                                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center shadow-sm hover:bg-red-600 transition"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ))}
                                  <label className={`w-20 h-20 border-2 border-dashed rounded-none flex flex-col items-center justify-center cursor-pointer transition ${subiendo ? 'border-[#E7E0DA] dark:border-[#3A2E4D] bg-[#F7F5FC] dark:bg-[#17101f]' : 'border-gray-300 dark:border-[#3A2E4D] hover:border-[#5C2A52] hover:bg-[#C9A8C3] dark:hover:bg-[#241935]'}`}>
                                    {subiendo
                                      ? <Loader2 className="w-5 h-5 text-[#5C2A52] animate-spin" />
                                      : <><Plus className="w-5 h-5 text-[#C9A8C3]" /><span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-400 dark:text-[#b9aedd] mt-1">Agregar</span></>
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

                  {/* Galería sin color específico: solo aplica a productos sin colores (ej. accesorios con Talla Única) */}
                  {form.coloresSeleccionados.length === 0 && (
                    <div className="bg-white dark:bg-[#1e1530] rounded-none border border-[#E7E0DA] dark:border-[#3A2E4D] shadow-sm overflow-hidden">
                      <div className="bg-gradient-to-r from-[#0A0A0A] via-[#3B0A45] to-[#5C2A52] px-6 py-4">
                        <h3 style={{ fontFamily: '"Playfair Display", Georgia, serif' }} className="font-semibold text-white text-base flex items-center gap-2"><ImageIcon className="w-4 h-4 text-[#C9A8C3]" />Galería de fotos</h3>
                        <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-400 dark:text-[#b9aedd] mt-1">Este producto no tiene colores, así que estas son todas sus fotos de la galería</p>
                      </div>
                      <div className="p-6">
                        <div className="flex flex-wrap gap-3">
                          {form.imagenesAdicionales.map(url => (
                            <div key={url} className="relative group">
                              <img
                                src={url.startsWith('http') ? url : `${apiBase}${url}`}
                                alt="adicional"
                                className="w-20 h-20 object-cover rounded-none border border-[#E7E0DA] dark:border-[#3A2E4D]"
                              />
                              <button
                                onClick={() => quitarImagenAdicional(url)}
                                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center shadow-sm hover:bg-red-600 transition"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                          <label className={`w-20 h-20 border-2 border-dashed rounded-none flex flex-col items-center justify-center cursor-pointer transition ${uploadingAdicional ? 'border-[#E7E0DA] dark:border-[#3A2E4D] bg-[#F7F5FC] dark:bg-[#17101f]' : 'border-gray-300 dark:border-[#3A2E4D] hover:border-[#5C2A52] hover:bg-[#C9A8C3] dark:hover:bg-[#241935]'}`}>
                            {uploadingAdicional
                              ? <Loader2 className="w-5 h-5 text-[#5C2A52] animate-spin" />
                              : <><Plus className="w-5 h-5 text-[#C9A8C3]" /><span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-400 dark:text-[#b9aedd] mt-1">Agregar</span></>
                            }
                            <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden"
                              disabled={uploadingAdicional}
                              onChange={e => { const f = e.target.files?.[0]; if (f) subirImagenAdicional(f); e.target.value = ''; }} />
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {form.imagenesAdicionales.length > 0 && form.coloresSeleccionados.length > 0 && (
                    <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-none p-4">
                      <ImageIcon className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                      <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-amber-800 dark:text-amber-300">
                        Este producto tiene {form.imagenesAdicionales.length} foto{form.imagenesAdicionales.length !== 1 ? 's' : ''} sin color asignado que no se van a mostrar (porque el producto sí tiene colores). Súbelas de nuevo en <strong>"Imágenes por Color"</strong> arriba, en el color que corresponda.
                      </p>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>

          <DialogFooter className="gap-2 px-8 py-5 border-t border-[#E7E0DA] dark:border-[#3A2E4D] flex-shrink-0">
            <button onClick={() => setFormOpen(false)} disabled={saving} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
              className="px-6 py-2 bg-gray-100 dark:bg-[#221830] text-gray-700 dark:text-[#F5F3FA] rounded-none hover:bg-gray-200 dark:hover:bg-[#241935] transition disabled:opacity-50">
              Cancelar
            </button>
            <button onClick={guardar} disabled={saving || uploadingImg} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
              className="px-6 py-2 bg-gradient-to-r from-[#0A0A0A] via-[#3B0A45] to-[#5C2A52] text-white rounded-none hover:opacity-90 disabled:opacity-50 flex items-center gap-2 transition">
              {(saving || uploadingImg) && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEditing ? 'Guardar Cambios' : 'Crear Producto'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ MODAL ELIMINAR ═══ */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="¿Eliminar producto?"
        description={<>Vas a eliminar <strong>{selectedProduct?.nombre}</strong>. Esta acción no se puede deshacer.</>}
        onConfirm={confirmDelete}
        loading={saving}
      />
    </div>
  );
};
