import React, { useState } from 'react';
import { Plus, Search, Trash2, Edit, AlertCircle, Palette } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../../components/ui/alert-dialog';
import { toast } from 'sonner';
import { useSubcategorias } from '../../../shared/contexts/SubcategoriasContext';
import { lettersOnly } from '../../../shared/utils/validators';

export const ColoresView: React.FC = () => {
  const { colores, agregarColor, eliminarColor } = useSubcategorias();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', hexColor: '#000000' });
  const [selectedColor, setSelectedColor] = useState<{ id: string; nombre: string; hexColor?: string } | null>(null);

  const filteredColores = colores.filter(color =>
    color.nombre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = () => {
    if (!formData.name.trim()) {
      toast.error('Por favor ingresa un color');
      return;
    }

    if (colores.some(c => c.nombre.toUpperCase() === formData.name.toUpperCase())) {
      toast.error('Este color ya existe');
      return;
    }

    agregarColor(formData.name.trim(), formData.hexColor);
    setFormData({ name: '', hexColor: '#000000' });
    setIsCreateOpen(false);
    toast.success('Color creado exitosamente');
  };

  const handleEdit = () => {
    if (!selectedColor || !formData.name.trim()) {
      toast.error('Por favor ingresa un color');
      return;
    }

    if (colores.some(c => c.id !== selectedColor.id && c.nombre.toUpperCase() === formData.name.toUpperCase())) {
      toast.error('Este color ya existe');
      return;
    }

    // Para editar necesitaríamos una función actualizarColor en el contexto
    // Por ahora, eliminamos y creamos uno nuevo
    eliminarColor(selectedColor.id);
    agregarColor(formData.name.trim(), formData.hexColor);
    setFormData({ name: '', hexColor: '#000000' });
    setSelectedColor(null);
    setIsEditOpen(false);
    toast.success('Color actualizado exitosamente');
  };

  const handleDelete = () => {
    if (selectedColor) {
      eliminarColor(selectedColor.id);
      setSelectedColor(null);
      setIsDeleteOpen(false);
      toast.success('Color eliminado exitosamente');
    }
  };

  const openEditModal = (color: { id: string; nombre: string; hexColor?: string }) => {
    setSelectedColor(color);
    setFormData({ name: color.nombre, hexColor: color.hexColor || '#000000' });
    setIsEditOpen(true);
  };

  const openDeleteModal = (color: { id: string; nombre: string; hexColor?: string }) => {
    setSelectedColor(color);
    setIsDeleteOpen(true);
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-playfair text-3xl font-bold text-gray-900">Gestionar Colores</h1>
          <p className="font-inter text-gray-600 mt-2">Crea y administra los colores disponibles para tus productos</p>
        </div>
        <button 
          onClick={() => {
            setFormData({ name: '', hexColor: '#000000' });
            setIsCreateOpen(true);
          }}
          className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span className="font-inter">Nuevo Color</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar colores..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg font-inter"
          />
        </div>
      </div>

      {/* Colores Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredColores.length === 0 ? (
          <div className="col-span-full bg-white rounded-lg p-8 text-center border border-gray-200">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="font-inter text-gray-600">No hay colores para mostrar</p>
          </div>
        ) : (
          filteredColores.map((color) => (
            <div key={color.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-4 mb-4">
                <div 
                  className="w-12 h-12 rounded-full shadow-md border-2 border-gray-200"
                  style={{ backgroundColor: color.hexColor || '#000000' }}
                />
                <div>
                  <h3 className="font-inter text-lg font-semibold">
                    {color.nombre}
                  </h3>
                  <p className="font-inter text-sm text-gray-500">
                    {color.hexColor || '#000000'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => openEditModal(color)}
                  className="flex-1 text-[#d65391] border border-[#d65391] px-4 py-2 rounded-lg hover:bg-pink-50 transition-colors"
                >
                  <span className="font-inter">Editar</span>
                </button>
                <button 
                  onClick={() => openDeleteModal(color)}
                  className="flex-1 text-red-600 border border-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <span className="font-inter">Eliminar</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Crear Color */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md rounded-lg overflow-hidden">
          <DialogHeader className="bg-gradient-to-r from-[#d65391] to-[#f8a9c5] text-white p-6">
            <DialogTitle className="font-playfair text-2xl">
              Nuevo Color
            </DialogTitle>
            <DialogDescription className="font-inter">
              Completa los datos para crear un nuevo color
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 p-6">
            <div>
              <Label className="font-inter block text-sm text-gray-700 mb-2">
                Nombre del Color
              </Label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: lettersOnly(e.target.value) })}
                placeholder="Ej: Rosa, Azul, Verde, Negro..."
                className="font-inter w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d65391]"
              />
            </div>
            <div>
              <Label className="font-inter block text-sm text-gray-700 mb-2">
                Color
              </Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.hexColor}
                  onChange={(e) => setFormData({ ...formData, hexColor: e.target.value })}
                  className="w-16 h-10 border border-gray-300 rounded-lg cursor-pointer"
                />
                <span className="font-inter text-sm text-gray-600">{formData.hexColor}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              className="bg-[#d65391] hover:bg-[#c04380] text-white"
            >
              Crear Color
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Editar Color */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md rounded-lg overflow-hidden">
          <DialogHeader className="bg-gradient-to-r from-[#d65391] to-[#f8a9c5] text-white p-6">
            <DialogTitle className="font-playfair text-2xl">
              Editar Color
            </DialogTitle>
            <DialogDescription className="font-inter">
              Modifica los datos del color
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 p-6">
            <div>
              <Label className="font-inter block text-sm text-gray-700 mb-2">
                Nombre del Color
              </Label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: lettersOnly(e.target.value) })}
                placeholder="Ej: Rosa, Azul, Verde, Negro..."
                className="font-inter w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d65391]"
              />
            </div>
            <div>
              <Label className="font-inter block text-sm text-gray-700 mb-2">
                Color
              </Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.hexColor}
                  onChange={(e) => setFormData({ ...formData, hexColor: e.target.value })}
                  className="w-16 h-10 border border-gray-300 rounded-lg cursor-pointer"
                />
                <span className="font-inter text-sm text-gray-600">{formData.hexColor}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleEdit}
              className="bg-[#d65391] hover:bg-[#c04380] text-white"
            >
              Actualizar Color
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Eliminar Color */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Color</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar el color "{selectedColor?.nombre}"? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ColoresView;
