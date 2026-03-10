import React, { useMemo, useState } from 'react';
import { Plus, Search, ChevronRight, Eye, Edit, Trash2, CheckCircle2, Circle, Tag, Shirt, Ruler, Palette, Package, X, Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../../components/ui/alert-dialog';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Badge } from '../../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Textarea } from '../../../components/ui/textarea';
import { toast } from 'sonner';
import { useProductos, ProductoAdmin } from '../../../shared/contexts/ProductosContext';
import { useSubcategorias } from '../../../shared/contexts/SubcategoriasContext';
import { useProductosAdmin } from '../../../shared/data/useProductosAdmin';

interface Product extends ProductoAdmin {}

export const ProductosView: React.FC = () => {
  const { crearProducto, actualizarProducto, eliminarProducto } = useProductos();
  const { colores, tallas, materiales, marcas, categorias, categoriasRopa, tiposProducto } = useSubcategorias();
  const todosLosProductos = useProductosAdmin(); // Obtener todos los productos (locales + admin)
  const [searchQuery, setSearchQuery] = useState('');
  const [precioMin, setPrecioMin] = useState<number | ''>('');
  const [precioMax, setPrecioMax] = useState<number | ''>('');
  const [estadoFiltro, setEstadoFiltro] = useState<'todos' | 'activo' | 'inactivo'>('todos');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Product>>({});
  const [createForm, setCreateForm] = useState<Partial<Product>>({
    nombre: '',
    codigo: '',
    categoria: '',
    categoriaMain: '',
    marca: '',
    precio: 0,
    precioOriginal: 0,
    stock: 0,
    activo: true,
    isSale: false,
    imagen: '',
    imagenes: [],
    imagenesPorColor: {},
    tallas: [],
    colores: [],
    materiales: [],
    tipoProducto: '',
    descripcion: ''
  });
  const [editImageUrl, setEditImageUrl] = useState('');
  const [createImageUrl, setCreateImageUrl] = useState('');
  const [createErrors, setCreateErrors] = useState<{[key: string]: string}>({});
  const [editErrors, setEditErrors] = useState<{[key: string]: string}>({});
  const [editColorSelection, setEditColorSelection] = useState<{ color: string; imageUrl: string }>({ color: '', imageUrl: '' });
  const [createColorSelection, setCreateColorSelection] = useState<{ color: string; imageUrl: string }>({ color: '', imageUrl: '' });

  // Los productos ahora vienen de useProductosAdmin que combina productos locales + del contexto

  const filteredProducts = useMemo(() => {
    let filtered = todosLosProductos;

    // Filtro de búsqueda
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      filtered = filtered.filter(p => (
        p.nombre.toLowerCase().includes(q) ||
        p.codigo.toLowerCase().includes(q) ||
        p.categoria.toLowerCase().includes(q)
      ));
    }

    // Filtro de precio mínimo
    if (precioMin !== '') {
      filtered = filtered.filter(p => p.precio >= precioMin);
    }

    // Filtro de precio máximo
    if (precioMax !== '') {
      filtered = filtered.filter(p => p.precio <= precioMax);
    }

    // Filtro de estado
    if (estadoFiltro === 'activo') {
      filtered = filtered.filter(p => p.activo);
    } else if (estadoFiltro === 'inactivo') {
      filtered = filtered.filter(p => !p.activo);
    }

    return filtered;
  }, [todosLosProductos, searchQuery, precioMin, precioMax, estadoFiltro]);

  // pagination removed — show full filtered list

  const handleToggleActivo = (id: string) => {
    const product = todosLosProductos.find(p => p.id === id);
    if (product) {
      actualizarProducto(id, { activo: !product.activo });
    }
    toast.success('Estado del producto actualizado');
  };

  const handleView = (product: Product) => {
    setSelectedProduct(product);
    setIsViewModalOpen(true);
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    // Mantener imagenesPorColor como está — no mezclar con imagenes generales
    const imagenesPorColor = product.imagenesPorColor || {};
    setEditForm({ ...product, categoriaMain: product.categoria || product.categoriaMain, imagenesPorColor });
    setEditErrors({});
    setEditColorSelection({ color: '', imageUrl: '' });
    setIsEditModalOpen(true);
  };

  const handleCreate = () => {
    setCreateErrors({});
    setIsCreateModalOpen(true);
  };

  const handleDelete = (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedProduct) {
      await eliminarProducto(selectedProduct.id);
      toast.success('Producto eliminado exitosamente');
      setIsDeleteModalOpen(false);
      setSelectedProduct(null);
    }
  };

  // Funciones para manejar archivos
  // Nota: fileToBase64 eliminado — siempre subimos al servidor para obtener URL real

  // Manejo de imágenes por color
  const addColorToForm = (color: string, isEdit: boolean = false) => {
    if (!color || !color.trim()) return;
    if (isEdit) {
      const current = editForm.colores || [];
      if (!current.includes(color)) {
        updateEditForm('colores', [...current, color]);
        const imgs = editForm.imagenesPorColor || {};
        updateEditForm('imagenesPorColor', { ...imgs, [color]: imgs[color] || [] });
        // auto-seleccionar el color recién agregado
        setEditColorSelection({ ...editColorSelection, color });
      }
    } else {
      const current = createForm.colores || [];
      if (!current.includes(color)) {
        updateCreateForm('colores', [...current, color]);
        const imgs = createForm.imagenesPorColor || {};
        updateCreateForm('imagenesPorColor', { ...imgs, [color]: imgs[color] || [] });
        // auto-seleccionar el color recién agregado
        setCreateColorSelection({ ...createColorSelection, color });
      }
    }
  };

  const handleFileUploadForColor = async (files: FileList, color: string, isEdit: boolean = false) => {
    if (!color) {
      toast.error('Selecciona primero un color');
      return;
    }
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        toast.loading(`Subiendo "${file.name}"...`, { id: `color-upload-${i}` });
        const url = await uploadImageToServer(file);
        if (url) {
          if (isEdit) {
            const imgsMap = editForm.imagenesPorColor || {};
            const arr = imgsMap[color] || [];
            updateEditForm('imagenesPorColor', { ...imgsMap, [color]: [...arr, url] });
          } else {
            const imgsMap = createForm.imagenesPorColor || {};
            const arr = imgsMap[color] || [];
            updateCreateForm('imagenesPorColor', { ...imgsMap, [color]: [...arr, url] });
          }
          toast.success(`Imagen subida para color ${color}`, { id: `color-upload-${i}` });
        } else {
          toast.dismiss(`color-upload-${i}`);
        }
      } catch (error) {
        toast.error(`Error al subir "${file.name}"`, { id: `color-upload-${i}` });
      }
    }
  };

  const addImageUrlForColor = (url: string, color: string, isEdit: boolean = false) => {
    if (!url.trim()) {
      toast.error('Por favor ingresa una URL válida');
      return;
    }
    if (!color) {
      toast.error('Selecciona primero un color');
      return;
    }
    if (isEdit) {
      const imgsMap = editForm.imagenesPorColor || {};
      const arr = imgsMap[color] || [];
      updateEditForm('imagenesPorColor', { ...imgsMap, [color]: [...arr, url] });
    } else {
      const imgsMap = createForm.imagenesPorColor || {};
      const arr = imgsMap[color] || [];
      updateCreateForm('imagenesPorColor', { ...imgsMap, [color]: [...arr, url] });
    }
    toast.success('Imagen agregada');
  };

  const removeImageByColor = (color: string, index: number, isEdit: boolean = false) => {
    if (isEdit) {
      const imgsMap = editForm.imagenesPorColor || {};
      const arr = imgsMap[color] || [];
      updateEditForm('imagenesPorColor', { ...imgsMap, [color]: arr.filter((_, i) => i !== index) });
    } else {
      const imgsMap = createForm.imagenesPorColor || {};
      const arr = imgsMap[color] || [];
      updateCreateForm('imagenesPorColor', { ...imgsMap, [color]: arr.filter((_, i) => i !== index) });
    }
    toast.success('Imagen eliminada');
  };

  const uploadImageToServer = async (file: File): Promise<string | null> => {
    try {
      const token = localStorage.getItem('accessToken');
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('http://localhost:5000/api/upload/imagen', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err?.message || 'Error al subir imagen');
        return null;
      }
      const data = await res.json();
      return data?.data?.url ?? null;
    } catch {
      toast.error('No se pudo conectar con el servidor para subir la imagen');
      return null;
    }
  };

  const handleFileUpload = async (files: FileList, isEdit: boolean = false) => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        toast.loading(`Subiendo "${file.name}"...`, { id: `upload-${i}` });
        const url = await uploadImageToServer(file);
        if (url) {
          if (isEdit) {
            const currentImages = editForm.imagenes || [];
            updateEditForm('imagenes', [...currentImages, url]);
          } else {
            const currentImages = createForm.imagenes || [];
            updateCreateForm('imagenes', [...currentImages, url]);
          }
          toast.success(`Imagen "${file.name}" subida`, { id: `upload-${i}` });
        } else {
          toast.dismiss(`upload-${i}`);
        }
      } catch (error) {
        toast.error(`Error al subir "${file.name}"`, { id: `upload-${i}` });
      }
    }
  };

  const addImageUrl = (url: string, isEdit: boolean = false) => {
    if (!url.trim()) {
      toast.error('Por favor ingresa una URL válida');
      return;
    }
    if (isEdit) {
      const currentImages = editForm.imagenes || [];
      updateEditForm('imagenes', [...currentImages, url]);
      setEditImageUrl('');
    } else {
      const currentImages = createForm.imagenes || [];
      updateCreateForm('imagenes', [...currentImages, url]);
      setCreateImageUrl('');
    }
    toast.success('Imagen agregada');
  };

  const removeImage = (index: number, isEdit: boolean = false) => {
    if (isEdit) {
      const currentImages = editForm.imagenes || [];
      updateEditForm('imagenes', currentImages.filter((_, i) => i !== index));
    } else {
      const currentImages = createForm.imagenes || [];
      updateCreateForm('imagenes', currentImages.filter((_, i) => i !== index));
    }
    toast.success('Imagen eliminada');
  };

  const handleSaveEdit = async () => {
    if (Object.values(editErrors).some(error => error !== '')) {
      toast.error('Por favor, corrige los errores antes de guardar');
      return;
    }
    if (!selectedProduct || !editForm.nombre) {
      toast.error('El nombre es obligatorio');
      return;
    }

    // Resolver IDs desde los nombres seleccionados
    const categoriaPrincipalEditObj = categorias.find(c => c.nombre === editForm.categoriaMain);
    const marcaObj = marcas.find(m => m.nombre === editForm.marca);
    const tipoObj = tiposProducto.find(t => t.nombre === editForm.tipoProducto);

    const catID = categoriaPrincipalEditObj ? Number(categoriaPrincipalEditObj.id) : selectedProduct.categoriaPrincipalID ?? 1;
    const marcID = marcaObj ? Number(marcaObj.id) : selectedProduct.marcaID ?? 1;
    const tipID = tipoObj ? Number(tipoObj.id) : selectedProduct.tipoProductoID ?? 1;

    // Nunca guardar base64 — solo URLs reales
    const imagenEdit = (editForm.imagen || '').startsWith('data:') ? '' : (editForm.imagen || '');

    const payload = {
      Nombre: editForm.nombre,
      Descripcion: editForm.descripcion,
      CategoriaPrincipalID: catID,
      TipoProductoID: tipID,
      MarcaID: marcID,
      PrecioVenta: editForm.precio ?? 0,
      PrecioOferta: (editForm.precioOriginal && editForm.precioOriginal > 0 && editForm.precioOriginal > (editForm.precio ?? 0)) ? editForm.precioOriginal : undefined,
      Stock: Math.max(0, editForm.stock ?? 0),
      ImagenPrincipal: imagenEdit || undefined,
      Estado: editForm.activo ? 'activo' : 'inactivo',
    };

    // Imágenes generales (sin color asignado)
    const imagenesEditUrls: string[] = (editForm.imagenes || []).filter((u: string) => u && !u.startsWith('data:'));
    // Pasar imagenesPorColor en el payload para que se envíe con ColorNombre
    const payloadConImagenes = { ...payload, imagenesPorColor: editForm.imagenesPorColor || {} };
    console.log('[Edit] imagenesEditUrls:', imagenesEditUrls, 'imagenesPorColor:', editForm.imagenesPorColor);
    const ok = await actualizarProducto(selectedProduct.id, payloadConImagenes, editForm.tallas || [], editForm.colores || [], tallas, colores, imagenesEditUrls, editForm.materiales || [], materiales);
    if (ok) {
      toast.success('Producto actualizado exitosamente');
      setIsEditModalOpen(false);
      setSelectedProduct(null);
      setEditForm({});
      setEditErrors({});
    } else {
      toast.error('Error al actualizar el producto');
    }
  };

  const handleSaveCreate = async () => {
    if (Object.values(createErrors).some(error => error !== '')) {
      toast.error('Por favor, corrige los errores antes de guardar');
      return;
    }
    if (!createForm.nombre) {
      toast.error('El nombre del producto es obligatorio');
      return;
    }
    if (!createForm.categoriaMain) {
      toast.error('Selecciona una Categoría Principal');
      return;
    }
    // Auto-generar código si está vacío
    if (!createForm.codigo) {
      updateCreateForm('codigo', `PROD-${Date.now()}`);
    }

    // Resolver IDs desde los nombres seleccionados
    const categoriaPrincipalObj = categorias.find(c => c.nombre === createForm.categoriaMain);
    const marcaObj = marcas.find(m => m.nombre === createForm.marca);
    const tipoObj = tiposProducto.find(t => t.nombre === createForm.tipoProducto);

    if (!categoriaPrincipalObj) { toast.error('Selecciona una Categoría Principal'); return; }
    // Marca y tipo usan fallback al primero disponible si no se seleccionó
    const marcaFinal = marcaObj ?? marcas[0];
    const tipoFinal = tipoObj ?? tiposProducto[0];
    if (!marcaFinal) { toast.error('No hay marcas disponibles, crea una primero'); return; }
    if (!tipoFinal) { toast.error('No hay tipos de producto disponibles'); return; }

    // Nunca guardar base64 — solo URLs reales
    const imagen = (createForm.imagen || '').startsWith('data:') ? '' : (createForm.imagen || '');

    const payload = {
      Codigo: createForm.codigo || `PROD-${Date.now()}`,
      Nombre: createForm.nombre,
      Descripcion: createForm.descripcion ?? '',
      CategoriaPrincipalID: Number(categoriaPrincipalObj.id),
      TipoProductoID: Number(tipoFinal.id),
      MarcaID: Number(marcaFinal.id),
      PrecioVenta: createForm.precio ?? 0,
      PrecioOferta: (createForm.precioOriginal && createForm.precioOriginal > 0 && createForm.precioOriginal > (createForm.precio ?? 0)) ? createForm.precioOriginal : undefined,
      Stock: Math.max(0, createForm.stock ?? 0),
      ImagenPrincipal: imagen || undefined,
    };

    const imagenesUrls: string[] = (createForm.imagenes || []).filter((u: string) => u && !u.startsWith('data:'));
    const payloadConImagenes = { ...payload, imagenesPorColor: createForm.imagenesPorColor || {} };
    console.log('[Create] imagenesUrls:', imagenesUrls, 'imagenesPorColor:', createForm.imagenesPorColor);
    const ok = await crearProducto(payloadConImagenes, createForm.tallas || [], createForm.colores || [], tallas, colores, imagenesUrls, createForm.materiales || [], materiales);
    if (ok) {
      toast.success('Producto creado exitosamente');
      setIsCreateModalOpen(false);
      setCreateForm({
        nombre: '', codigo: '', categoria: '', categoriaMain: '', marca: '',
        precio: 0, precioOriginal: 0, stock: 0, activo: true, isSale: false,
        imagen: '', imagenes: [], imagenesPorColor: {}, tallas: [], colores: [],
        materiales: [], tipoProducto: '', descripcion: ''
      });
      setCreateImageUrl('');
      setCreateErrors({});
      setCreateColorSelection({ color: '', imageUrl: '' });
    } else {
      toast.error('Error al crear el producto. Verifica que el código no esté duplicado.');
    }
  };

  const updateEditForm = (field: string, value: any) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const updateCreateForm = (field: string, value: any) => {
    setCreateForm(prev => ({ ...prev, [field]: value }));
  };

  const formatPrecio = (precio: number) => {
    return `$${precio.toLocaleString('es-CO')}`;
  };

  const calcularDescuento = (precio: number, precioOriginal: number) => {
    if (!precioOriginal) return 0;
    const descuento = ((precioOriginal - precio) / precioOriginal) * 100;
    return Math.round(descuento);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm text-gray-500">Dashboard</span>
        <ChevronRight className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-900">Gestión de Productos</span>
      </div>

      <div className="mb-6 flex items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar productos..."
              className="pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#d65391] focus:border-transparent"
            />
          </div>
          <button 
            onClick={handleCreate}
            className="px-4 py-2 bg-[#d65391] text-white rounded-md hover:bg-[#c84a8f] transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nuevo Producto
          </button>
        </div>
      </div>

      {/* Grid de Productos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map(product => (
          <div key={product.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            {/* Imagen del Producto */}
            <div className="relative">
              <img 
                src={product.imagen} 
                alt={product.nombre} 
                className="w-full h-48 object-cover"
              />
              {product.precioOriginal && (
                <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
                  -{calcularDescuento(product.precio, product.precioOriginal)}%
                </div>
              )}
              <div className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-medium ${
                product.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
              }`}>
                {product.activo ? 'Activo' : 'Inactivo'}
              </div>
            </div>

            {/* Información del Producto */}
            <div className="p-4">
              <div className="mb-2">
                <h3 className="font-semibold text-gray-900 text-lg mb-1">{product.nombre}</h3>
                <p className="text-sm text-gray-600">{product.codigo}</p>
              </div>

              {/* Precios */}
              <div className="mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-[#d65391]">{formatPrecio(product.precio)}</span>
                  {product.precioOriginal && (
                    <span className="text-sm text-gray-500 line-through">{formatPrecio(product.precioOriginal)}</span>
                  )}
                </div>
                <p className="text-sm text-gray-600">Stock: {product.stock} unidades</p>
              </div>

              {/* Especificaciones del Producto */}
              <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[#d65391]" />
                  <span className="text-gray-600">{product.categoria}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-pink-600" />
                  <span className="text-gray-600">{product.categoriaMain}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shirt className="w-4 h-4 text-purple-600" />
                  <span className="text-gray-600">{product.marca}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-green-600" />
                  <span className="text-gray-600">{product.tallas.join(', ')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-yellow-600" />
                  <span className="text-gray-600">{product.colores.join(', ')}</span>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => handleView(product)}
                    className="p-2 text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
                    title="Ver detalles"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleEdit(product)}
                    className="p-2 text-gray-600 hover:bg-yellow-50 hover:text-yellow-600 rounded-lg transition-colors"
                    title="Editar producto"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(product)}
                    className="p-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                    title="Eliminar producto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={() => handleToggleActivo(product.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    product.activo 
                      ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  title={product.activo ? 'Desactivar producto' : 'Activar producto'}
                >
                  {product.activo ? 'Activo' : 'Inactivo'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No se encontraron productos</p>
          <button className="px-4 py-2 bg-[#d65391] text-white rounded-md hover:bg-[#c84a8f] transition-colors">
            Agregar primer producto
          </button>
        </div>
      )}

      {/* Modal de Ver Detalles */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Detalles del Producto</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-6">
              <div className="flex gap-6">
                <img 
                  src={selectedProduct.imagen} 
                  alt={selectedProduct.nombre} 
                  className="w-40 h-40 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold">{selectedProduct.nombre}</h3>
                  <p className="text-gray-600 text-lg">{selectedProduct.codigo}</p>
                  <div className="flex items-center gap-4 mt-4">
                    <p className="text-2xl font-bold text-[#d65391]">{formatPrecio(selectedProduct.precio)}</p>
                    {selectedProduct.precioOriginal && (
                      <p className="text-lg text-gray-500 line-through">{formatPrecio(selectedProduct.precioOriginal)}</p>
                    )}
                  </div>
                  <p className="text-lg text-gray-600 mt-2">Stock: {selectedProduct.stock} unidades</p>
                  <div className="flex items-center gap-2 mt-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      selectedProduct.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {selectedProduct.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <strong className="text-gray-700 block mb-1">Categoría:</strong>
                  <span className="text-gray-900">{selectedProduct.categoria}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <strong className="text-gray-700 block mb-1">Categoría Principal:</strong>
                  <span className="text-gray-900">{selectedProduct.categoriaMain}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <strong className="text-gray-700 block mb-1">Marca:</strong>
                  <span className="text-gray-900">{selectedProduct.marca}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <strong className="text-gray-700 block mb-1">Tallas:</strong>
                  <span className="text-gray-900">{selectedProduct.tallas.join(', ')}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <strong className="text-gray-700 block mb-1">Colores:</strong>
                  <span className="text-gray-900">{selectedProduct.colores.join(', ')}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <strong className="text-gray-700 block mb-1">Materiales:</strong>
                  <span className="text-gray-900">{Array.isArray(selectedProduct.materiales) ? selectedProduct.materiales.join(', ') : selectedProduct.materiales}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg col-span-3">
                  <strong className="text-gray-700 block mb-1">Descripción:</strong>
                  <p className="text-gray-900 leading-relaxed">{selectedProduct.descripcion}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Editar */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Producto</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* PASO 1: Información Básica */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Paso 1: Información Básica</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-nombre">Nombre *</Label>
                    <Input
                      id="edit-nombre"
                      value={editForm.nombre || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        updateEditForm('nombre', value);
                        if (!/^[a-zA-Z\s]+$/.test(value)) {
                          setEditErrors({...editErrors, nombre: 'Solo se permiten letras y espacios'});
                        } else {
                          setEditErrors({...editErrors, nombre: ''});
                        }
                      }}
                      placeholder="Nombre del producto"
                    />
                    {editErrors.nombre && <p className="text-red-500 text-sm">{editErrors.nombre}</p>}
                  </div>
                  <div>
                    <Label htmlFor="edit-codigo">Código *</Label>
                    <Input
                      id="edit-codigo"
                      value={editForm.codigo || ''}
                      onChange={(e) => updateEditForm('codigo', e.target.value)}
                      placeholder="Código único"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-categoria">Categoría *</Label>
                    <Select value={editForm.categoria || ''} onValueChange={(value) => updateEditForm('categoria', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoriasRopa.map((categoria) => (
                          <SelectItem key={categoria.id} value={categoria.nombre}>{categoria.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-categoriaMain">Categoría Principal *</Label>
                    <Select value={editForm.categoriaMain || ''} onValueChange={(value) => updateEditForm('categoriaMain', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar categoría principal" />
                      </SelectTrigger>
                      <SelectContent>
                        {categorias.map((cat) => (
                          <SelectItem key={cat.id} value={cat.nombre}>{cat.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-marca">Marca</Label>
                    <Select value={editForm.marca || ''} onValueChange={(value) => updateEditForm('marca', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar marca" />
                      </SelectTrigger>
                      <SelectContent>
                        {marcas.map((marca) => (
                          <SelectItem key={marca.id} value={marca.nombre}>
                            {marca.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {editErrors.marca && <p className="text-red-500 text-sm">{editErrors.marca}</p>}
                  </div>
                  <div>
                    <Label htmlFor="edit-tipoProducto">Tipo de Producto</Label>
                    <Select value={editForm.tipoProducto || ''} onValueChange={(value) => updateEditForm('tipoProducto', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {tiposProducto.map((tipo) => (
                          <SelectItem key={tipo.id} value={tipo.nombre}>{tipo.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Imagen Principal */}
              <div className="mt-3">
                <Label htmlFor="edit-imagen">Imagen Principal</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="edit-imagen"
                    value={editForm.imagen || ''}
                    onChange={(e) => updateEditForm('imagen', e.target.value)}
                    placeholder="https://... pega URL o sube desde PC"
                  />
                  {editForm.imagen && !editForm.imagen.startsWith('data:') && (
                    <img src={editForm.imagen} alt="preview" className="w-12 h-12 object-cover rounded border" />
                  )}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-3 py-1.5 rounded border border-gray-300 flex items-center gap-1">
                    <Upload className="w-3 h-3" />
                    Subir desde PC
                    <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                      if (e.target.files?.[0]) {
                        toast.loading('Subiendo imagen...', { id: 'main-img-edit' });
                        const url = await uploadImageToServer(e.target.files[0]);
                        if (url) { updateEditForm('imagen', url); toast.success('Imagen subida', { id: 'main-img-edit' }); }
                        else toast.dismiss('main-img-edit');
                        e.target.value = '';
                      }
                    }} />
                  </label>
                  <span className="text-xs text-gray-400">o pega una URL arriba</span>
                </div>
              </div>
            </div>

            {/* PASO 2: Especificaciones (Colores, Tallas, Materiales) */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Paso 2: Especificaciones</h3>
              <div className="space-y-4">
                {/* COLORES - PRIMERO */}
                <div>
                  <Label className="font-medium mb-2 block">Colores Disponibles</Label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {colores.map(color => (
                      <button
                        key={color.id}
                        type="button"
                        onClick={() => {
                          const currentColores = editForm.colores || [];
                          const newColores = currentColores.includes(color.nombre)
                            ? currentColores.filter(c => c !== color.nombre)
                            : [...currentColores, color.nombre];
                          updateEditForm('colores', newColores);
                        }}
                        className={`px-3 py-1 border rounded font-medium transition-all ${
                          (editForm.colores || []).includes(color.nombre)
                            ? 'bg-[#d65391] text-white border-[#d65391]'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {color.nombre}
                      </button>
                    ))}
                  </div>
                  {editForm.colores && editForm.colores.length > 0 && (
                    <div className="bg-white border border-green-300 rounded p-3">
                      <p className="text-sm text-gray-600 mb-1">Colores seleccionados:</p>
                      <div className="flex gap-2 flex-wrap">
                        {editForm.colores.map(c => (
                          <Badge key={c} className="bg-[#d65391]">{c}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Tallas */}
                <div>
                  <Label className="font-medium mb-2 block">Tallas</Label>
                  <div className="flex flex-wrap gap-2">
                    {tallas.map(talla => (
                      <button
                        key={talla.id}
                        type="button"
                        onClick={() => {
                          const currentTallas = editForm.tallas || [];
                          const newTallas = currentTallas.includes(talla.nombre)
                            ? currentTallas.filter(t => t !== talla.nombre)
                            : [...currentTallas, talla.nombre];
                          updateEditForm('tallas', newTallas);
                        }}
                        className={`px-3 py-1 border rounded ${
                          (editForm.tallas || []).includes(talla.nombre)
                            ? 'bg-[#d65391] text-white border-[#d65391]'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {talla.nombre}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Materiales */}
                <div>
                  <Label className="font-medium mb-2 block">Materiales</Label>
                  <div className="flex flex-wrap gap-2">
                    {materiales.map(material => (
                      <button
                        key={material.id}
                        type="button"
                        onClick={() => {
                          const currentMateriales = editForm.materiales || [];
                          const newMateriales = currentMateriales.includes(material.nombre)
                            ? currentMateriales.filter(m => m !== material.nombre)
                            : [...currentMateriales, material.nombre];
                          updateEditForm('materiales', newMateriales);
                        }}
                        className={`px-3 py-1 border rounded ${
                          (editForm.materiales || []).includes(material.nombre)
                            ? 'bg-[#d65391] text-white border-[#d65391]'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {material.nombre}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* PASO 3: Precios y Stock */}
            <div className="bg-white border-2 border-gray-100 rounded-lg p-5 shadow-sm">
              <h3 style={{ fontFamily: 'Playfair Display, serif' }} className="font-semibold text-gray-900 mb-4 text-lg">💰 Paso 3: Precios y Stock</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="edit-precio">Precio *</Label>
                    <Input
                      id="edit-precio"
                      type="number"
                      value={editForm.precio ?? ''}
                      onChange={(e) => updateEditForm('precio', e.target.value ? parseInt(e.target.value) : null)}
                      placeholder="Ingresa el precio"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-precio-original">Precio Tachado (si hay oferta)</Label>
                    <Input
                      id="edit-precio-original"
                      type="number"
                      value={editForm.precioOriginal ?? ''}
                      onChange={(e) => updateEditForm('precioOriginal', e.target.value ? parseInt(e.target.value) : null)}
                      placeholder="Ingresa el precio"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-stock">Stock</Label>
                    <Input
                      id="edit-stock"
                      type="number"
                      value={editForm.stock ?? ''}
                      onChange={(e) => updateEditForm('stock', e.target.value ? Math.max(0, parseInt(e.target.value)) : 0)}
                      placeholder="Ingresa el stock"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="edit-activo"
                      checked={editForm.activo || false}
                      onChange={(e) => updateEditForm('activo', e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="edit-activo">Producto activo</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="edit-issale"
                      checked={editForm.isSale ?? false}
                      onChange={(e) => updateEditForm('isSale', e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="edit-issale">Marcar como SALE</Label>
                  </div>
                </div>
              </div>
            </div>

            {/* PASO 4: Imágenes por Color */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Paso 4: Imágenes por Color</h3>
              {!editForm.colores || editForm.colores.length === 0 ? (
                <div className="bg-yellow-50 border border-yellow-300 rounded p-3 mb-4">
                  <p className="text-sm text-yellow-800">⚠️ Primero selecciona al menos un color en el Paso 2 para poder agregar imágenes</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Selector de Color - VISIBLE */}
                  <div>
                    <Label className="font-medium mb-2 block">Selecciona color para las imágenes:</Label>
                    <Select value={editColorSelection.color || ''} onValueChange={(v)=> setEditColorSelection({ ...editColorSelection, color: v })}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Elige un color..." />
                      </SelectTrigger>
                      <SelectContent>
                        {(editForm.colores || []).map((c:any) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {editColorSelection.color && (
                    <>
                      {/* Cargar desde archivo */}
                      <div className="border-2 border-dashed border-amber-300 rounded-lg p-4 bg-white">
                        <div className="flex items-center gap-2 mb-3">
                          <Upload className="w-5 h-5 text-amber-600" />
                          <span className="text-sm text-gray-700 font-medium">Sube imágenes para el color <span className="text-[#d65391] font-bold">{editColorSelection.color}</span></span>
                        </div>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files) {
                              handleFileUploadForColor(e.target.files, editColorSelection.color || '', true);
                              e.target.value = '';
                            }
                          }}
                          className="w-full cursor-pointer"
                        />
                      </div>

                      {/* Agregar URL */}
                      <div className="flex gap-2">
                        <Input
                          placeholder={`Pegar URL de imagen para ${editColorSelection.color}...`}
                          value={editColorSelection.imageUrl || ''}
                          onChange={(e) => setEditColorSelection({ ...editColorSelection, imageUrl: e.target.value })}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              addImageUrlForColor(editColorSelection.imageUrl || '', editColorSelection.color || '', true);
                              setEditColorSelection({ ...editColorSelection, imageUrl: '' });
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            addImageUrlForColor(editColorSelection.imageUrl || '', editColorSelection.color || '', true);
                            setEditColorSelection({ ...editColorSelection, imageUrl: '' });
                          }}
                          className="px-4 py-2 bg-[#d65391] text-white rounded-md hover:bg-[#c84a8f] whitespace-nowrap"
                        >
                          Agregar URL
                        </button>
                      </div>
                    </>
                  )}

                  {/* Galería por Color */}
                  {/* Imágenes por color — muestra cada color con sus imágenes */}
                  {editForm.imagenesPorColor && Object.keys(editForm.imagenesPorColor).some((c: any) => (editForm.imagenesPorColor||{})[c]?.length > 0) && (
                    <div className="mt-4">
                      <Label className="font-medium mb-2 block text-gray-800">📸 Imágenes guardadas por color:</Label>
                      {Object.keys(editForm.imagenesPorColor).map((c: any) => {
                        const imgs = (editForm.imagenesPorColor||{})[c] || [];
                        if (imgs.length === 0) return null;
                        return (
                          <div key={c} className="mb-3 bg-white p-3 rounded-lg border border-gray-200">
                            <p className="text-sm font-semibold text-gray-800 mb-2">{c} <span className="text-xs font-normal text-gray-500">({imgs.length} imagen{imgs.length !== 1 ? 'es' : ''})</span></p>
                            <div className="flex flex-wrap gap-3">
                              {imgs.map((img: string, idx: number) => (
                                <div key={idx} className="relative w-20 h-20 flex-shrink-0">
                                  <img src={img} alt={`${c} ${idx+1}`} className="w-full h-full object-cover rounded-lg border-2 border-gray-200" />
                                  <button
                                    type="button"
                                    onClick={() => removeImageByColor(c, idx, true)}
                                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-md transition-all hover:scale-110 z-10"
                                    title="Eliminar imagen"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* PASO 5: Descripción */}
            <div>
              <Label htmlFor="edit-descripcion" className="font-medium">Descripción del Producto</Label>
              <Textarea
                id="edit-descripcion"
                value={editForm.descripcion || ''}
                onChange={(e) => updateEditForm('descripcion', e.target.value)}
                placeholder="Describe el producto aquí..."
                rows={3}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <button 
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSaveEdit}
              className="px-4 py-2 bg-[#d65391] text-white rounded-md hover:bg-[#c84a8f]"
            >
              Guardar Cambios
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Crear Producto */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }} className="text-2xl">Crear Nuevo Producto</DialogTitle>
            <DialogDescription style={{ fontFamily: 'Inter, sans-serif' }}>
              Completa todos los pasos para agregar un nuevo producto al catálogo
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 bg-gradient-to-b from-white to-gray-50 p-6 rounded-lg">
            {/* PASO 1: Información Básica */}
            <div className="bg-white border-2 border-gray-100 rounded-lg p-5 shadow-sm">
              <h3 style={{ fontFamily: 'Playfair Display, serif' }} className="font-semibold text-gray-900 mb-4 text-lg">📦 Paso 1: Información Básica</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="create-nombre">Nombre *</Label>
                    <Input
                      id="create-nombre"
                      value={createForm.nombre || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        updateCreateForm('nombre', value);
                        if (!/^[a-zA-Z\s]+$/.test(value)) {
                          setCreateErrors({...createErrors, nombre: 'Solo se permiten letras y espacios'});
                        } else {
                          setCreateErrors({...createErrors, nombre: ''});
                        }
                      }}
                      placeholder="Nombre del producto"
                    />
                    {createErrors.nombre && <p className="text-red-500 text-sm">{createErrors.nombre}</p>}
                  </div>
                  <div>
                    <Label htmlFor="create-codigo">Código *</Label>
                    <Input
                      id="create-codigo"
                      value={createForm.codigo || ''}
                      onChange={(e) => updateCreateForm('codigo', e.target.value)}
                      placeholder="Código único"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="create-categoria">Categoría *</Label>
                    <Select value={createForm.categoria || ''} onValueChange={(value) => updateCreateForm('categoria', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoriasRopa.map((categoria) => (
                          <SelectItem key={categoria.id} value={categoria.nombre}>{categoria.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="create-categoriaMain">Categoría Principal *</Label>
                    <Select value={createForm.categoriaMain || ''} onValueChange={(value) => updateCreateForm('categoriaMain', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar categoría principal" />
                      </SelectTrigger>
                      <SelectContent>
                        {categorias.map((cat) => (
                          <SelectItem key={cat.id} value={cat.nombre}>{cat.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="create-marca">Marca</Label>
                    <Select value={createForm.marca || ''} onValueChange={(value) => updateCreateForm('marca', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar marca" />
                      </SelectTrigger>
                      <SelectContent>
                        {marcas.map((marca) => (
                          <SelectItem key={marca.id} value={marca.nombre}>
                            {marca.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {createErrors.marca && <p className="text-red-500 text-sm">{createErrors.marca}</p>}
                  </div>
                  <div>
                    <Label htmlFor="create-tipoProducto">Tipo de Producto</Label>
                    <Select value={createForm.tipoProducto || ''} onValueChange={(value) => updateCreateForm('tipoProducto', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {tiposProducto.map((tipo) => (
                          <SelectItem key={tipo.id} value={tipo.nombre}>{tipo.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

                          {/* Imagen Principal */}
              <div className="mt-4 px-5 pb-5">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Imagen Principal
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={createForm.imagen || ''}
                    onChange={(e) => updateCreateForm('imagen', e.target.value)}
                    placeholder="https://... pega URL o sube desde PC"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#d65391]"
                  />
                  {createForm.imagen && !createForm.imagen.startsWith('data:') && (
                    <img src={createForm.imagen} alt="preview" className="w-12 h-12 object-cover rounded border flex-shrink-0" />
                  )}
                </div>
              </div>

            {/* PASO 2: Especificaciones (Colores, Tallas, Materiales) */}
            <div className="bg-white border-2 border-gray-100 rounded-lg p-5 shadow-sm">
              <h3 style={{ fontFamily: 'Playfair Display, serif' }} className="font-semibold text-gray-900 mb-4 text-lg">🎨 Paso 2: Especificaciones</h3>
              <div className="space-y-5">
                {/* COLORES - PRIMERO */}
                <div>
                  <Label className="font-medium mb-2 block">Colores Disponibles</Label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {colores.map(color => (
                      <button
                        key={color.id}
                        type="button"
                        onClick={() => {
                          const currentColores = createForm.colores || [];
                          const newColores = currentColores.includes(color.nombre)
                            ? currentColores.filter(c => c !== color.nombre)
                            : [...currentColores, color.nombre];
                          updateCreateForm('colores', newColores);
                        }}
                        className={`px-3 py-1 border rounded font-medium transition-all ${
                          (createForm.colores || []).includes(color.nombre)
                            ? 'bg-[#d65391] text-white border-[#d65391]'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {color.nombre}
                      </button>
                    ))}
                  </div>
                  {createForm.colores && createForm.colores.length > 0 && (
                    <div className="bg-white border border-green-300 rounded p-3">
                      <p className="text-sm text-gray-600 mb-1">Colores seleccionados:</p>
                      <div className="flex gap-2 flex-wrap">
                        {createForm.colores.map(c => (
                          <Badge key={c} className="bg-[#d65391]">{c}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Tallas */}
                <div>
                  <Label className="font-medium mb-2 block">Tallas</Label>
                  <div className="flex flex-wrap gap-2">
                    {tallas.map(talla => (
                      <button
                        key={talla.id}
                        type="button"
                        onClick={() => {
                          const currentTallas = createForm.tallas || [];
                          const newTallas = currentTallas.includes(talla.nombre)
                            ? currentTallas.filter(t => t !== talla.nombre)
                            : [...currentTallas, talla.nombre];
                          updateCreateForm('tallas', newTallas);
                        }}
                        className={`px-3 py-1 border rounded ${
                          (createForm.tallas || []).includes(talla.nombre)
                            ? 'bg-[#d65391] text-white border-[#d65391]'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {talla.nombre}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Materiales */}
                <div>
                  <Label className="font-medium mb-2 block">Materiales</Label>
                  <div className="flex flex-wrap gap-2">
                    {materiales.map(material => (
                      <button
                        key={material.id}
                        type="button"
                        onClick={() => {
                          const currentMateriales = createForm.materiales || [];
                          const newMateriales = currentMateriales.includes(material.nombre)
                            ? currentMateriales.filter(m => m !== material.nombre)
                            : [...currentMateriales, material.nombre];
                          updateCreateForm('materiales', newMateriales);
                        }}
                        className={`px-3 py-1 border rounded ${
                          (createForm.materiales || []).includes(material.nombre)
                            ? 'bg-[#d65391] text-white border-[#d65391]'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {material.nombre}
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            {/* PASO 3: Precios y Stock */}
            <div className="bg-white border-2 border-gray-100 rounded-lg p-5 shadow-sm">
              <h3 style={{ fontFamily: 'Playfair Display, serif' }} className="font-semibold text-gray-900 mb-4 text-lg">💰 Paso 3: Precios y Stock</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="create-precio">Precio *</Label>
                    <Input
                      id="create-precio"
                      type="number"
                      value={createForm.precio ?? ''}
                      onChange={(e) => updateCreateForm('precio', e.target.value ? parseInt(e.target.value) : null)}
                      placeholder="Ingresa el precio"
                    />
                  </div>
                  <div>
                    <Label htmlFor="create-precio-original">Precio Tachado (si hay oferta)</Label>
                    <Input
                      id="create-precio-original"
                      type="number"
                      value={createForm.precioOriginal ?? ''}
                      onChange={(e) => updateCreateForm('precioOriginal', e.target.value ? parseInt(e.target.value) : null)}
                      placeholder="Ingresa el precio"
                    />
                  </div>
                  <div>
                    <Label htmlFor="create-stock">Stock</Label>
                    <Input
                      id="create-stock"
                      type="number"
                      value={createForm.stock ?? ''}
                      onChange={(e) => updateCreateForm('stock', e.target.value ? Math.max(0, parseInt(e.target.value)) : 0)}
                      placeholder="Ingresa el stock"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="create-activo"
                      checked={createForm.activo ?? true}
                      onChange={(e) => updateCreateForm('activo', e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="create-activo">Producto activo</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="create-issale"
                      checked={createForm.isSale ?? false}
                      onChange={(e) => updateCreateForm('isSale', e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="create-issale">Marcar como SALE</Label>
                  </div>
                </div>
              </div>
            </div>

            {/* PASO 4: Imágenes por Color */}
            <div className="bg-white border-2 border-gray-100 rounded-lg p-5 shadow-sm">
              <h3 style={{ fontFamily: 'Playfair Display, serif' }} className="font-semibold text-gray-900 mb-4 text-lg">🖼️ Paso 4: Imágenes por Color</h3>
              {!createForm.colores || createForm.colores.length === 0 ? (
                <div className="bg-blue-50 border border-blue-300 rounded p-4 mb-4">
                  <p className="text-sm text-blue-800">ℹ️ Primero selecciona al menos un color en el Paso 2 para poder agregar imágenes</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Selector de Color - VISIBLE */}
                  <div>
                    <Label className="font-medium mb-2 block">Selecciona color para las imágenes:</Label>
                    <Select value={createColorSelection.color || ''} onValueChange={(v)=> setCreateColorSelection({ ...createColorSelection, color: v })}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Elige un color..." />
                      </SelectTrigger>
                      <SelectContent>
                        {(createForm.colores || []).map((c:any) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {createColorSelection.color && (
                    <>
                      {/* Cargar desde archivo */}
                      <div className="border-2 border-dashed border-amber-300 rounded-lg p-4 bg-white">
                        <div className="flex items-center gap-2 mb-3">
                          <Upload className="w-5 h-5 text-amber-600" />
                          <span className="text-sm text-gray-700 font-medium">Sube imágenes para el color <span className="text-[#d65391] font-bold">{createColorSelection.color}</span></span>
                        </div>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files) {
                              handleFileUploadForColor(e.target.files, createColorSelection.color || '', false);
                              e.target.value = '';
                            }
                          }}
                          className="w-full cursor-pointer"
                        />
                      </div>

                      {/* Agregar URL */}
                      <div className="flex gap-2">
                        <Input
                          placeholder={`Pegar URL de imagen para ${createColorSelection.color}...`}
                          value={createColorSelection.imageUrl || ''}
                          onChange={(e) => setCreateColorSelection({ ...createColorSelection, imageUrl: e.target.value })}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              addImageUrlForColor(createColorSelection.imageUrl || '', createColorSelection.color || '', false);
                              setCreateColorSelection({ ...createColorSelection, imageUrl: '' });
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            addImageUrlForColor(createColorSelection.imageUrl || '', createColorSelection.color || '', false);
                            setCreateColorSelection({ ...createColorSelection, imageUrl: '' });
                          }}
                          className="px-4 py-2 bg-[#d65391] text-white rounded-md hover:bg-[#c84a8f] whitespace-nowrap"
                        >
                          Agregar URL
                        </button>
                      </div>
                    </>
                  )}

                  {/* Galería por Color */}
                  {createForm.imagenesPorColor && Object.keys(createForm.imagenesPorColor).length > 0 && (
                    <div className="mt-4">
                      <Label className="font-medium mb-2 block">Imágenes agregadas:</Label>
                      {(Object.keys(createForm.imagenesPorColor) || []).map((c:any) => (
                        <div key={c} className="mb-4 bg-white p-3 rounded border border-gray-200">
                          <p className="text-sm font-medium text-gray-900 mb-2">{c} ({(createForm.imagenesPorColor||{})[c]?.length || 0} imágenes)</p>
                          <div className="grid grid-cols-6 gap-2">
                            {((createForm.imagenesPorColor||{})[c] || []).map((img:string, idx:number) => (
                              <div key={idx} className="relative group">
                                <img src={img} alt={`${c} ${idx}`} className="w-full h-16 object-cover rounded border border-gray-200" />
                                <span className="absolute left-1 top-1 bg-black bg-opacity-70 text-white text-xs px-1 rounded">{c}</span>
                                <button type="button" onClick={()=> removeImageByColor(c, idx, false)} className="absolute -top-2 -right-2 bg-gradient-to-br from-red-600 to-red-700 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200 w-5 h-5 flex items-center justify-center" title="Eliminar imagen"> <X className="w-3 h-3" /> </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* PASO 5: Descripción */}
            <div className="bg-white border-2 border-gray-100 rounded-lg p-5 shadow-sm">
              <h3 style={{ fontFamily: 'Playfair Display, serif' }} className="font-semibold text-gray-900 mb-4 text-lg">📝 Paso 5: Descripción</h3>
              <Label htmlFor="create-descripcion" className="font-medium">Descripción del Producto</Label>
              <Textarea
                id="create-descripcion"
                value={createForm.descripcion || ''}
                onChange={(e) => updateCreateForm('descripcion', e.target.value)}
                placeholder="Describe el producto aquí..."
                rows={3}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <button 
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSaveCreate}
              className="px-4 py-2 bg-[#d65391] text-white rounded-md hover:bg-[#c84a8f]"
            >
              Crear Producto
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El producto "{selectedProduct?.nombre}" será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProductosView;