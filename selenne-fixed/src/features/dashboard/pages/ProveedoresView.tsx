import React, { useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit, Trash2, ChevronRight, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../../components/ui/dialog';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../../components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { toast } from 'sonner@2.0.3';
import { lettersOnly, numbersOnly, removeSpaces } from '../../../shared/utils/validators';
// pagination removed — reverted to original listing
import { usePermisos } from '../../../shared/contexts/PermisosContext';
import { useComprasAdmin, type Proveedor as ProveedorType } from '../../../shared/contexts/ComprasAdminContext';

interface Proveedor extends ProveedorType {
  documento?: string;
  direccion?: string;
  productos?: number;
  activo?: boolean;
}

export const ProveedoresView: React.FC = () => {
  const { hasPermission } = useAuth();
  const puedeAdmin = hasPermission('admin:dashboard');
  const { canDelete } = usePermisos();
  const { proveedores: proveedoresDelContexto, agregarProveedor } = useComprasAdmin();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [estadoModalOpen, setEstadoModalOpen] = useState(false);
  const [selectedProveedor, setSelectedProveedor] = useState<Proveedor | null>(null);

  const [formData, setFormData] = useState<Partial<Proveedor>>({
    nombre: '',
    contacto: '',
    email: '',
    telefono: '',
    documento: '',
    direccion: '',
    productos: 0,
    activo: true,
  });

  // pagination removed — show full filtered list

  // Usar proveedores del contexto y agregar datos extras
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);

  useEffect(() => {
    // Mapear proveedores del contexto a la interfaz de esta vista
    const proveedoresConDatos = proveedoresDelContexto.map(prov => ({
      ...prov,
      documento: prov.documento || '',
      direccion: `Dirección no especificada`,
      productos: 0,
      activo: true,
    }));
    setProveedores(proveedoresConDatos);
  }, [proveedoresDelContexto]);

  const filteredProveedores = proveedores.filter(proveedor => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      proveedor.nombre.toLowerCase().includes(query) ||
      proveedor.contacto.toLowerCase().includes(query) ||
      proveedor.email.toLowerCase().includes(query) ||
      proveedor.telefono.toLowerCase().includes(query) ||
      (proveedor.documento?.toLowerCase().includes(query) ?? false) ||
      (proveedor.productos?.toString().includes(query) ?? false) ||
      (proveedor.activo ? 'activo' : 'inactivo').includes(query)
    );
  });

  const handleView = (proveedor: Proveedor) => {
    setSelectedProveedor(proveedor);
    setViewModalOpen(true);
  };

  const handleCreate = () => {
    setFormData({
      nombre: '',
      contacto: '',
      email: '',
      telefono: '',
      direccion: '',
      productos: 0,
      activo: true,
    });
    setCreateModalOpen(true);
  };

  const handleEdit = (proveedor: Proveedor) => {
    setSelectedProveedor(proveedor);
    setFormData({ ...proveedor });
    setEditModalOpen(true);
  };

  const handleDelete = (proveedor: Proveedor) => {
    if (!canDelete()) {
      toast.error('No tienes permisos para eliminar proveedores');
      return;
    }
    setSelectedProveedor(proveedor);
    setDeleteModalOpen(true);
  };

  const handleCambiarEstado = (proveedor: Proveedor) => {
    setSelectedProveedor(proveedor);
    setFormData({ activo: proveedor.activo });
    setEstadoModalOpen(true);
  };

  const confirmDelete = () => {
    if (selectedProveedor) {
      setProveedores(prev => prev.filter(p => p.id !== selectedProveedor.id));
      toast.success('Proveedor eliminado correctamente');
      setDeleteModalOpen(false);
      setSelectedProveedor(null);
    }
  };

  const handleSaveCreate = () => {
    if (!formData.nombre || !formData.email || !formData.telefono) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    const newProveedor: ProveedorType = {
      id: `prov-${Date.now()}`,
      nombre: formData.nombre,
      contacto: formData.contacto || '',
      email: formData.email,
      telefono: formData.telefono,
      documento: formData.documento || '',
    };

    // Guardar en el contexto global
    agregarProveedor(newProveedor);
    
    setCreateModalOpen(false);
    setFormData({ nombre: '', contacto: '', email: '', telefono: '', direccion: '', productos: 0, activo: true });
    toast.success('Proveedor creado correctamente');
  };

  const handleSaveEdit = () => {
    if (selectedProveedor) {
      setProveedores(prev =>
        prev.map(p => p.id === selectedProveedor.id ? { ...p, ...formData } : p)
      );
      setEditModalOpen(false);
      toast.success('Proveedor actualizado correctamente');
    }
  };

  const handleSaveEstado = () => {
    if (selectedProveedor) {
      setProveedores(prev =>
        prev.map(p => p.id === selectedProveedor.id ? { ...p, activo: !p.activo } : p)
      );
      setEstadoModalOpen(false);
      toast.success('Estado actualizado correctamente');
    }
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
          Gestión de Proveedores
        </span>
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <h1 style={{ fontFamily: 'Playfair Display, serif' }} className="text-[36px] text-gray-900">
            Gestión de Proveedores
          </h1>
          <span className="px-3 py-1 bg-[#d65391] text-white rounded-full text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
            {filteredProveedores.length}
          </span>
        </div>
        <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-gray-600">
          Administra tus proveedores y contactos
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
                    placeholder="Buscar proveedores..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ fontFamily: 'Inter, sans-serif' }}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d65391] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {puedeAdmin && <button
                onClick={handleCreate}
                style={{ fontFamily: 'Inter, sans-serif' }}
                className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                <Plus className="w-5 h-5" />
                Nuevo Proveedor
              </button>}
            </div>
          </div>

          {/* Tabla */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left" style={{ fontFamily: 'Inter, sans-serif' }}>
                      <span className="text-xs uppercase tracking-wider text-gray-600">NOMBRE</span>
                    </th>
                    <th className="px-6 py-4 text-left" style={{ fontFamily: 'Inter, sans-serif' }}>
                      <span className="text-xs uppercase tracking-wider text-gray-600">CONTACTO</span>
                    </th>
                    <th className="px-6 py-4 text-left" style={{ fontFamily: 'Inter, sans-serif' }}>
                      <span className="text-xs uppercase tracking-wider text-gray-600">TELÉFONO</span>
                    </th>
                    <th className="px-6 py-4 text-left" style={{ fontFamily: 'Inter, sans-serif' }}>
                      <span className="text-xs uppercase tracking-wider text-gray-600">PRODUCTOS</span>
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
                  {filteredProveedores.map((proveedor) => (
                    <tr key={proveedor.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-gray-900">
                          {proveedor.nombre}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div style={{ fontFamily: 'Inter, sans-serif' }} className="text-gray-900">
                            {proveedor.contacto}
                          </div>
                          <div style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-500">
                            {proveedor.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-600">
                          {proveedor.telefono}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-gray-900">
                          {proveedor.productos}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleCambiarEstado(proveedor)}
                          className={`px-3 py-1 rounded-full text-xs ${
                            proveedor.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          } hover:opacity-80 transition-opacity`}
                          style={{ fontFamily: 'Inter, sans-serif' }}
                        >
                          {proveedor.activo ? 'Activo' : 'Inactivo'}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleView(proveedor)}
                            className="p-2 text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
                            title="Ver detalles"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          {puedeAdmin && <button
                            onClick={() => handleEdit(proveedor)}
                            className="p-2 text-gray-600 hover:bg-yellow-50 hover:text-yellow-600 rounded-lg transition-colors"
                            title="Editar proveedor"
                          >
                            <Edit className="w-5 h-5" />
                          </button>}
                          {puedeAdmin && (
                            <button
                              onClick={() => handleDelete(proveedor)}
                              className="p-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                              title="Eliminar proveedor"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 bg-white border-t border-gray-100">
              <div className="text-sm text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>
                Mostrando <span className="text-gray-900">{filteredProveedores.length}</span> proveedores
              </div>
            </div>
          </div>
      </div>

      {/* Modal Ver Detalles */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="bg-gradient-to-r from-[#d65391] to-[#f8a9c5] text-white p-6">
            <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }} className="text-2xl">
              Detalles del Proveedor
            </DialogTitle>
            <DialogDescription style={{ fontFamily: 'Inter, sans-serif' }}>
              Información completa del proveedor seleccionado
            </DialogDescription>
          </DialogHeader>
          {selectedProveedor && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <label style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-600 block mb-1">
                    Nombre
                  </label>
                  <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-lg text-gray-900">
                    {selectedProveedor.nombre}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <label style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-600 block mb-1">
                    Contacto
                  </label>
                  <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-lg text-gray-900">
                    {selectedProveedor.contacto}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <label style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-600 block mb-1">
                    Documento
                  </label>
                  <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-lg text-gray-900">
                    {selectedProveedor.documento || '-'}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <label style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-600 block mb-1">
                    Email
                  </label>
                  <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-900">
                    {selectedProveedor.email}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <label style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-600 block mb-1">
                    Teléfono
                  </label>
                  <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-lg text-gray-900">
                    {selectedProveedor.telefono}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <label style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-600 block mb-1">
                  Dirección
                </label>
                <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-gray-900">
                  {selectedProveedor.direccion}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <label style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-600 block mb-1">
                    Productos
                  </label>
                  <p style={{ fontFamily: 'Playfair Display, serif' }} className="text-2xl text-gray-900">
                    {selectedProveedor.productos}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <label style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-600 block mb-1">
                    Estado
                  </label>
                  <span className={`px-3 py-1 rounded-full text-xs ${
                    selectedProveedor.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`} style={{ fontFamily: 'Inter, sans-serif' }}>
                    {selectedProveedor.activo ? 'Activo' : 'Inactivo'}
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

      {/* Modal Crear/Editar */}
      <Dialog open={createModalOpen || editModalOpen} onOpenChange={(open) => {
        if (!open) {
          setCreateModalOpen(false);
          setEditModalOpen(false);
        }
      }}>
        <DialogContent className="max-w-2xl rounded-lg overflow-hidden">
          <DialogHeader className="bg-gradient-to-r from-[#d65391] to-[#f8a9c5] text-white p-6">
            <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }} className="text-2xl">
              {editModalOpen ? 'Editar Proveedor' : 'Nuevo Proveedor'}
            </DialogTitle>
            <DialogDescription style={{ fontFamily: 'Inter, sans-serif' }}>
              {editModalOpen ? 'Modifica la información del proveedor' : 'Completa los datos para agregar un nuevo proveedor'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 p-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-700 block mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: lettersOnly(e.target.value) })}
                  style={{ fontFamily: 'Inter, sans-serif' }}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d65391]"
                  placeholder="Nombre del proveedor"
                />
              </div>
              <div>
                <label style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-700 block mb-2">
                  Contacto
                </label>
                <input
                  type="text"
                  value={formData.contacto}
                  onChange={(e) => setFormData({ ...formData, contacto: lettersOnly(e.target.value) })}
                  style={{ fontFamily: 'Inter, sans-serif' }}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d65391]"
                  placeholder="Nombre del contacto"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-700 block mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: removeSpaces(e.target.value) })}
                  style={{ fontFamily: 'Inter, sans-serif' }}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d65391]"
                  placeholder="email@ejemplo.com"
                />
              </div>
              <div>
                <label style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-700 block mb-2">
                  Teléfono *
                </label>
                <input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: numbersOnly(e.target.value) })}
                  style={{ fontFamily: 'Inter, sans-serif' }}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d65391]"
                  placeholder="+57 300 123 4567"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-700 block mb-2">
                  Documento
                </label>
                <input
                  type="text"
                  value={formData.documento}
                  onChange={(e) => setFormData({ ...formData, documento: removeSpaces(e.target.value) })}
                  style={{ fontFamily: 'Inter, sans-serif' }}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d65391]"
                  placeholder="NIT o cédula"
                />
              </div>
            </div>

            <div>
              <label style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-700 block mb-2">
                Dirección
              </label>
              <textarea
                value={formData.direccion}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                style={{ fontFamily: 'Inter, sans-serif' }}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d65391] min-h-[80px]"
                placeholder="Dirección completa"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <button
              onClick={() => {
                setCreateModalOpen(false);
                setEditModalOpen(false);
              }}
              style={{ fontFamily: 'Inter, sans-serif' }}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={editModalOpen ? handleSaveEdit : handleSaveCreate}
              style={{ fontFamily: 'Inter, sans-serif' }}
              className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              {editModalOpen ? 'Guardar Cambios' : 'Crear Proveedor'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Cambiar Estado */}
      <Dialog open={estadoModalOpen} onOpenChange={setEstadoModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }} className="text-2xl">
              Cambiar Estado
            </DialogTitle>
            <DialogDescription style={{ fontFamily: 'Inter, sans-serif' }}>
              Actualiza el estado del proveedor
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-gray-600">
              ¿Deseas cambiar el estado de este proveedor a {selectedProveedor?.activo ? 'Inactivo' : 'Activo'}?
            </p>
          </div>
          <DialogFooter className="gap-2">
            <button
              onClick={() => setEstadoModalOpen(false)}
              style={{ fontFamily: 'Inter, sans-serif' }}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveEstado}
              style={{ fontFamily: 'Inter, sans-serif' }}
              className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Confirmar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Eliminar */}
      <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ fontFamily: 'Playfair Display, serif' }}>
              ¿Eliminar proveedor?
            </AlertDialogTitle>
            <AlertDialogDescription style={{ fontFamily: 'Inter, sans-serif' }}>
              {selectedProveedor && (
                <>
                  ¿Estás seguro de eliminar al proveedor "{selectedProveedor.nombre}"?
                  {selectedProveedor.productos > 0 && (
                    <span className="block mt-2 text-red-600">
                      Este proveedor tiene {selectedProveedor.productos} productos asociados.
                    </span>
                  )}
                  <span className="block mt-2">Esta acción no se puede deshacer.</span>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel style={{ fontFamily: 'Inter, sans-serif' }}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              style={{ fontFamily: 'Inter, sans-serif' }}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};