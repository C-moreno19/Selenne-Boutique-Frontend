import React, { useState, useEffect } from 'react';
import { Plus, Search, Eye, Trash2, ChevronRight, Package, Tag, Shirt, Ruler, Palette } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../../components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { toast } from 'sonner@2.0.3';
// pagination removed — reverted to original listing
import { usePermisos } from '../../../shared/contexts/PermisosContext';
import { useComprasAdmin, type Compra as CompraType } from '../../../shared/contexts/ComprasAdminContext';

interface ProductoComprado {
  id?: string;
  nombre: string;
  cantidad: number;
  precio: number;
  precioUnitario: number;
  // Especificaciones del producto
  categoria: string;
  marca: string;
  talla: string;
  color: string;
  material: string;
  tipoProducto: string;
  sku: string;
}

// Usar el tipo Compra del contexto pero redefinir con ProductoComprado para compatibilidad
interface Compra extends CompraType {
  productos: ProductoComprado[];
}

interface ComprasViewProps {
  onNavigateToNuevaCompra?: () => void;
}

export const ComprasView: React.FC<ComprasViewProps> = ({ onNavigateToNuevaCompra }) => {
  const { canDelete } = usePermisos();
  const { compras, proveedores, anularCompra } = useComprasAdmin();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedCompra, setSelectedCompra] = useState<Compra | null>(null);

  const [formData, setFormData] = useState<Partial<Compra>>({
    proveedor: '',
    total: 0,
    productos: [],
  });

  const filteredCompras = compras.filter(compra => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      compra.ordenFactura.toLowerCase().includes(query) ||
      compra.proveedor.toLowerCase().includes(query) ||
      compra.fecha.includes(query) ||
      compra.total.toString().includes(query) ||
      compra.productos.some(p => 
        p.nombre.toLowerCase().includes(query) ||
        p.categoria.toLowerCase().includes(query) ||
        (p.marca?.toLowerCase().includes(query) ?? false) ||
        p.sku.toLowerCase().includes(query)
      )
    );
  });

  // pagination removed — show full filtered list

  const handleView = (compra: Compra) => {
    setSelectedCompra(compra);
    setViewModalOpen(true);
  };

  const handleEdit = (compra: Compra) => {
    setSelectedCompra(compra);
    setFormData({ ...compra });
    setEditModalOpen(true);
  };

  const handleDelete = (compra: Compra) => {
    if (!canDelete()) {
      toast.error('No tienes permisos para anular compras');
      return;
    }
    setSelectedCompra(compra);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (selectedCompra) {
      anularCompra(selectedCompra.id);
      toast.success('Compra anulada correctamente');
      setDeleteModalOpen(false);
      setSelectedCompra(null);
    }
  };

  const handleSaveEdit = () => {
    if (selectedCompra) {
      toast.success('Compra actualizada correctamente');
      setEditModalOpen(false);
    }
  };

  const handleCreateCompra = () => {
    if (!formData.proveedor || !formData.productos || formData.productos.length === 0) {
      toast.error('Debes completar los campos obligatorios y agregar al menos un producto');
      return;
    }

    const totalCalculado = formData.productos.reduce((sum, p) => sum + p.precio, 0);
    const nuevaCompra: Compra = {
      id: String(compras.length + 1),
      ordenFactura: `OF-2024-${String(compras.length + 1).padStart(3, '0')}`,
      proveedor: formData.proveedor || '',
      fecha: formData.fecha || new Date().toISOString().split('T')[0],
      total: totalCalculado,
      estado: 'Activa',
      productos: formData.productos
    };

    setCompras(prev => [...prev, nuevaCompra]);
    setFormData({
      proveedor: '',
      total: 0,
      productos: [],
    });
    toast.success('Compra creada correctamente');
  };

  const formatPrecio = (precio?: number) => {
    if (precio === undefined || precio === null) return '$0';
    return `$${precio.toLocaleString('es-CO')}`;
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-4">
        <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-500">
          Dashboard
        </span>
        <ChevronRight className="w-4 h-4 text-gray-400" />
        <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-900">
          Gestión de Compras
        </span>
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <h1 style={{ fontFamily: 'Playfair Display, serif' }} className="text-[36px] text-gray-900">
            Gestión de Compras
          </h1>
          <span className="px-3 py-1 bg-[#d65391] text-white rounded-full text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
            {filteredCompras.length}
          </span>
        </div>
        <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-gray-600">
          Administra las compras a proveedores
        </p>
      </div>

      {/* Layout Principal */}
      <div className="space-y-6">
          {/* Barra de Herramientas */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar compras..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ fontFamily: 'Inter, sans-serif' }}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d65391] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <button
                onClick={() => onNavigateToNuevaCompra?.()}
                style={{ fontFamily: 'Inter, sans-serif' }}
                className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                <Plus className="w-5 h-5" />
                Nueva Compra
              </button>
            </div>
          </div>

          {/* Tabla */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left" style={{ fontFamily: 'Inter, sans-serif' }}>
                      <span className="text-xs uppercase tracking-wider text-gray-600">ORDEN DE FACTURA</span>
                    </th>
                    <th className="px-6 py-4 text-left" style={{ fontFamily: 'Inter, sans-serif' }}>
                      <span className="text-xs uppercase tracking-wider text-gray-600">PROVEEDOR</span>
                    </th>
                    <th className="px-6 py-4 text-left" style={{ fontFamily: 'Inter, sans-serif' }}>
                      <span className="text-xs uppercase tracking-wider text-gray-600">FECHA</span>
                    </th>
                    <th className="px-6 py-4 text-left" style={{ fontFamily: 'Inter, sans-serif' }}>
                      <span className="text-xs uppercase tracking-wider text-gray-600">TOTAL</span>
                    </th>
                    <th className="px-6 py-4 text-left" style={{ fontFamily: 'Inter, sans-serif' }}>
                      <span className="text-xs uppercase tracking-wider text-gray-600">ESTADO</span>
                    </th>
                    <th className="px-6 py-4 text-left" style={{ fontFamily: 'Inter, sans-serif' }}>
                      <span className="text-xs uppercase tracking-wider text-gray-600">ACCIONES</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCompras.map((compra) => (
                    <tr key={compra.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-gray-900">
                          {compra.ordenFactura}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-gray-900">
                          {compra.proveedor}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-600">
                          {new Date(compra.fecha).toLocaleDateString('es-CO')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-gray-900">
                          {formatPrecio(compra.total)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {compra.estado === 'Activa' ? (
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                            ✓ Activa
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                            ✕ Anulada
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleView(compra)}
                            className="p-2 text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
                            title="Ver detalles"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(compra)}
                            disabled={compra.estado === 'Anulada'}
                            className={`p-2 rounded-lg transition-colors ${
                              compra.estado === 'Anulada'
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'text-gray-600 hover:bg-red-50 hover:text-red-600'
                            }`}
                            title={compra.estado === 'Anulada' ? 'Esta compra ya está anulada' : 'Anular compra'}
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 bg-white border-t border-gray-100">
              <div className="text-sm text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>
                Mostrando <span className="text-gray-900">{filteredCompras.length}</span> compras
              </div>
            </div>
          </div>
      </div>

      {/* Modal Ver Detalles */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }} className="text-2xl">
              Detalles de la Compra
            </DialogTitle>
            <DialogDescription style={{ fontFamily: 'Inter, sans-serif' }} className="text-gray-600">
              Consulta toda la información de esta compra
            </DialogDescription>
          </DialogHeader>
          {selectedCompra && (
            <div className="space-y-6">
              {/* Información General */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <label style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-600 block mb-1">
                    Orden de Factura
                  </label>
                  <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-lg text-gray-900">
                    {selectedCompra.ordenFactura}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <label style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-600 block mb-1">
                    Proveedor
                  </label>
                  <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-lg text-gray-900">
                    {selectedCompra.proveedor}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <label style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-600 block mb-1">
                    Fecha
                  </label>
                  <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-lg text-gray-900">
                    {new Date(selectedCompra.fecha).toLocaleDateString('es-CO')}
                  </p>
                </div>
              </div>

              {/* Productos Comprados */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Package className="w-5 h-5 text-[#d65391]" />
                  <h3 style={{ fontFamily: 'Playfair Display, serif' }} className="text-xl text-gray-900">
                    Productos Comprados
                  </h3>
                </div>
                <div className="space-y-4">
                  {selectedCompra.productos.map((prod, idx) => (
                    <div key={idx} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      {/* Cabecera del Producto */}
                      <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-100">
                        <div>
                          <h4 style={{ fontFamily: 'Playfair Display, serif' }} className="text-lg text-gray-900 mb-1">
                            {prod.nombre}
                          </h4>
                          <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-500">
                            SKU: {prod.sku}
                          </p>
                        </div>
                        <div className="text-right">
                          <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-600">
                            Cantidad: {prod.cantidad}
                          </p>
                          <p style={{ fontFamily: 'Playfair Display, serif' }} className="text-xl text-[#d65391]">
                            {formatPrecio(prod.precio)}
                          </p>
                        </div>
                      </div>

                      {/* Especificaciones del Producto */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-[#d65391] bg-opacity-10 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Tag className="w-5 h-5 text-[#d65391]" />
                          </div>
                          <div>
                            <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-500 mb-0.5">
                              Categoría
                            </p>
                            <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-900">
                              {prod.categoria}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Package className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-500 mb-0.5">
                              Tipo
                            </p>
                            <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-900">
                              {prod.tipoProducto}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Shirt className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-500 mb-0.5">
                              Marca
                            </p>
                            <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-900">
                              {prod.marca}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Ruler className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-500 mb-0.5">
                              Talla
                            </p>
                            <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-900">
                              {prod.talla}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Palette className="w-5 h-5 text-yellow-600" />
                          </div>
                          <div>
                            <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-500 mb-0.5">
                              Color
                            </p>
                            <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-900">
                              {prod.color}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Package className="w-5 h-5 text-orange-600" />
                          </div>
                          <div>
                            <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-500 mb-0.5">
                              Material
                            </p>
                            <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-900">
                              {prod.material}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Precios Desglosados */}
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex justify-between items-center">
                          <div>
                            <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-500">
                              Precio Unitario
                            </p>
                            <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-900">
                              {formatPrecio(prod.precioUnitario)}
                            </p>
                          </div>
                          <div className="text-center">
                            <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-500">
                              Cantidad
                            </p>
                            <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-900">
                              × {prod.cantidad}
                            </p>
                          </div>
                          <div className="text-right">
                            <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-500">
                              Subtotal
                            </p>
                            <p style={{ fontFamily: 'Playfair Display, serif' }} className="text-lg text-[#d65391]">
                              {formatPrecio(prod.precio)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resumen de Total */}
              <div className="bg-gradient-to-r from-[#d65391] to-[#f8a9c5] rounded-lg p-6 text-white">
                <div className="flex justify-between items-center mb-2">
                  <span style={{ fontFamily: 'Playfair Display, serif' }} className="text-xl">Total de la Compra</span>
                  <span style={{ fontFamily: 'Playfair Display, serif' }} className="text-3xl">{formatPrecio(selectedCompra.total)}</span>
                </div>
                <div className="flex justify-between items-center text-white/80 text-sm">
                  <span style={{ fontFamily: 'Inter, sans-serif' }}>
                    {selectedCompra.productos.reduce((sum, p) => sum + p.cantidad, 0)} productos
                  </span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <button
              onClick={() => setViewModalOpen(false)}
              style={{ fontFamily: 'Inter, sans-serif' }}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cerrar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Editar */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }} className="text-2xl">
              Editar Compra
            </DialogTitle>
            <DialogDescription style={{ fontFamily: 'Inter, sans-serif' }} className="text-gray-600">
              Modifica los datos de la compra y gestiona los productos
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Información de la Compra */}
            <div>
              <h3 style={{ fontFamily: 'Playfair Display, serif' }} className="text-lg text-gray-900 mb-4">
                Información General
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-id-compra" style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-700 block mb-2">
                    Orden de Factura
                  </label>
                  <input
                    id="edit-id-compra"
                    type="text"
                    value={formData.ordenFactura}
                    onChange={(e) => setFormData({ ...formData, ordenFactura: e.target.value })}
                    style={{ fontFamily: 'Inter, sans-serif' }}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d65391] bg-gray-50"
                    placeholder="OF-2024-001"
                  />
                </div>
                <div>
                  <label htmlFor="edit-proveedor" style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-700 block mb-2">
                    Proveedor *
                  </label>
                  <input
                    id="edit-proveedor"
                    type="text"
                    value={formData.proveedor}
                    onChange={(e) => setFormData({ ...formData, proveedor: e.target.value })}
                    style={{ fontFamily: 'Inter, sans-serif' }}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d65391]"
                    placeholder="Nombre del proveedor"
                  />
                </div>
                <div>
                  <label htmlFor="edit-fecha" style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-700 block mb-2">
                    Fecha *
                  </label>
                  <input
                    id="edit-fecha"
                    type="date"
                    value={formData.fecha}
                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                    style={{ fontFamily: 'Inter, sans-serif' }}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d65391]"
                  />
                </div>
              </div>
            </div>

            {/* Productos de la Compra */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 style={{ fontFamily: 'Playfair Display, serif' }} className="text-lg text-gray-900">
                  Productos de la Compra
                </h3>
                <button
                  onClick={() => {
                    const newProducto: ProductoComprado = {
                      nombre: '',
                      cantidad: 1,
                      precio: 0,
                      precioUnitario: 0,
                      categoria: '',
                      marca: '',
                      talla: '',
                      color: '',
                      material: '',
                      tipoProducto: '',
                      sku: ''
                    };
                    setFormData({
                      ...formData,
                      productos: [...(formData.productos || []), newProducto]
                    });
                  }}
                  style={{ fontFamily: 'Inter, sans-serif' }}
                  className="px-4 py-2 bg-[#d65391] text-white rounded-lg hover:bg-[#c44880] transition-colors flex items-center gap-2 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Agregar Producto
                </button>
              </div>

              <div className="space-y-4">
                {formData.productos && formData.productos.map((producto, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <h4 style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-900">
                        Producto {idx + 1}
                      </h4>
                      <button
                        onClick={() => {
                          const newProductos = formData.productos?.filter((_, i) => i !== idx);
                          setFormData({ ...formData, productos: newProductos });
                        }}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar producto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <label style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-600 block mb-1">
                          Nombre del Producto
                        </label>
                        <input
                          type="text"
                          value={producto.nombre}
                          onChange={(e) => {
                            const newProductos = [...(formData.productos || [])];
                            newProductos[idx] = { ...newProductos[idx], nombre: e.target.value };
                            setFormData({ ...formData, productos: newProductos });
                          }}
                          style={{ fontFamily: 'Inter, sans-serif' }}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d65391]"
                          placeholder="Ej: Telas de Seda"
                        />
                      </div>

                      <div>
                        <label style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-600 block mb-1">
                          SKU
                        </label>
                        <input
                          type="text"
                          value={producto.sku}
                          onChange={(e) => {
                            const newProductos = [...(formData.productos || [])];
                            newProductos[idx] = { ...newProductos[idx], sku: e.target.value };
                            setFormData({ ...formData, productos: newProductos });
                          }}
                          style={{ fontFamily: 'Inter, sans-serif' }}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d65391]"
                          placeholder="TEL1001"
                        />
                      </div>

                      <div>
                        <label style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-600 block mb-1">
                          Categoría
                        </label>
                        <input
                          type="text"
                          value={producto.categoria}
                          onChange={(e) => {
                            const newProductos = [...(formData.productos || [])];
                            newProductos[idx] = { ...newProductos[idx], categoria: e.target.value };
                            setFormData({ ...formData, productos: newProductos });
                          }}
                          style={{ fontFamily: 'Inter, sans-serif' }}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d65391]"
                          placeholder="Materiales"
                        />
                      </div>

                      <div>
                        <label style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-600 block mb-1">
                          Tipo
                        </label>
                        <input
                          type="text"
                          value={producto.tipoProducto}
                          onChange={(e) => {
                            const newProductos = [...(formData.productos || [])];
                            newProductos[idx] = { ...newProductos[idx], tipoProducto: e.target.value };
                            setFormData({ ...formData, productos: newProductos });
                          }}
                          style={{ fontFamily: 'Inter, sans-serif' }}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d65391]"
                          placeholder="Tela"
                        />
                      </div>

                      <div>
                        <label style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-600 block mb-1">
                          Marca
                        </label>
                        <input
                          type="text"
                          value={producto.marca}
                          onChange={(e) => {
                            const newProductos = [...(formData.productos || [])];
                            newProductos[idx] = { ...newProductos[idx], marca: e.target.value };
                            setFormData({ ...formData, productos: newProductos });
                          }}
                          style={{ fontFamily: 'Inter, sans-serif' }}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d65391]"
                          placeholder="Premium Textil"
                        />
                      </div>

                      <div>
                        <label style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-600 block mb-1">
                          Talla
                        </label>
                        <input
                          type="text"
                          value={producto.talla}
                          onChange={(e) => {
                            const newProductos = [...(formData.productos || [])];
                            newProductos[idx] = { ...newProductos[idx], talla: e.target.value };
                            setFormData({ ...formData, productos: newProductos });
                          }}
                          style={{ fontFamily: 'Inter, sans-serif' }}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d65391]"
                          placeholder="N/A"
                        />
                      </div>

                      <div>
                        <label style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-600 block mb-1">
                          Color
                        </label>
                        <input
                          type="text"
                          value={producto.color}
                          onChange={(e) => {
                            const newProductos = [...(formData.productos || [])];
                            newProductos[idx] = { ...newProductos[idx], color: e.target.value };
                            setFormData({ ...formData, productos: newProductos });
                          }}
                          style={{ fontFamily: 'Inter, sans-serif' }}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d65391]"
                          placeholder="Varios"
                        />
                      </div>

                      <div>
                        <label style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-600 block mb-1">
                          Material
                        </label>
                        <input
                          type="text"
                          value={producto.material}
                          onChange={(e) => {
                            const newProductos = [...(formData.productos || [])];
                            newProductos[idx] = { ...newProductos[idx], material: e.target.value };
                            setFormData({ ...formData, productos: newProductos });
                          }}
                          style={{ fontFamily: 'Inter, sans-serif' }}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d65391]"
                          placeholder="Seda"
                        />
                      </div>

                      <div>
                        <label style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-600 block mb-1">
                          Cantidad
                        </label>
                        <input
                          type="number"
                          value={producto.cantidad}
                          onChange={(e) => {
                            const newProductos = [...(formData.productos || [])];
                            const raw = e.target.value;
                            const sanitized = raw.replace(/\D+/g, '');
                            const cantidad = Number(sanitized || 0);
                            newProductos[idx] = {
                              ...newProductos[idx],
                              cantidad,
                              precio: newProductos[idx].precioUnitario * cantidad
                            };
                            setFormData({ ...formData, productos: newProductos });
                          }}
                          style={{ fontFamily: 'Inter, sans-serif' }}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d65391]"
                          placeholder="1"
                          min="1"
                        />
                      </div>

                      <div>
                        <label style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-600 block mb-1">
                          Precio Unitario ($)
                        </label>
                        <input
                          type="number"
                          value={producto.precioUnitario}
                          onChange={(e) => {
                            const newProductos = [...(formData.productos || [])];
                            const raw = e.target.value;
                            const sanitized = raw.replace(/[^0-9.]/g, '');
                            const precioUnitario = Number(sanitized || 0);
                            const cantidad = newProductos[idx].cantidad;
                            newProductos[idx] = {
                              ...newProductos[idx],
                              precioUnitario,
                              precio: precioUnitario * cantidad
                            };
                            setFormData({ ...formData, productos: newProductos });
                          }}
                          style={{ fontFamily: 'Inter, sans-serif' }}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d65391]"
                          placeholder="0"
                        />
                      </div>

                      <div className="bg-[#d65391] bg-opacity-10 rounded-lg p-2 flex items-center justify-between">
                        <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-600">
                          Subtotal:
                        </span>
                        <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-[#d65391]">
                          {formatPrecio(producto.precio)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {(!formData.productos || formData.productos.length === 0) && (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200 border-dashed">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-500">
                      No hay productos agregados
                    </p>
                    <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-400 mt-1">
                      Haz clic en "Agregar Producto" para comenzar
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Resumen Total */}
            {formData.productos && formData.productos.length > 0 && (
              <div className="bg-gradient-to-r from-[#d65391] to-[#f8a9c5] rounded-lg p-4 text-white">
                <div className="flex justify-between items-center">
                  <span style={{ fontFamily: 'Playfair Display, serif' }} className="text-lg">
                    Total Calculado
                  </span>
                  <span style={{ fontFamily: 'Playfair Display, serif' }} className="text-2xl">
                    {formatPrecio(formData.productos.reduce((sum, p) => sum + p.precio, 0))}
                  </span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <button
              onClick={() => setEditModalOpen(false)}
              style={{ fontFamily: 'Inter, sans-serif' }}
              className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveEdit}
              style={{ fontFamily: 'Inter, sans-serif' }}
              className="px-6 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Guardar Cambios
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Anular */}
      <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ fontFamily: 'Playfair Display, serif' }}>
              ¿Anular compra?
            </AlertDialogTitle>
            <AlertDialogDescription style={{ fontFamily: 'Inter, sans-serif' }}>
              {selectedCompra && (
                <>
                  ¿Estás seguro de anular la compra {selectedCompra.ordenFactura}?
                  <span className="block mt-2">Esta acción cambiará el estado a anulada.</span>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel style={{ fontFamily: 'Inter, sans-serif' }}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              style={{ fontFamily: 'Inter, sans-serif' }}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Anular
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
