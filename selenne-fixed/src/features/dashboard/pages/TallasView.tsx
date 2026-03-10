import React, { useState } from 'react';
import { Plus, Search, Trash2, Edit, AlertCircle, Ruler } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../../components/ui/alert-dialog';
import { toast } from 'sonner';
import { useSubcategorias } from '../../../shared/contexts/SubcategoriasContext';
import { lettersOnly } from '../../../shared/utils/validators';

export const TallasView: React.FC = () => {
  const { tallas, agregarTalla, eliminarTalla } = useSubcategorias();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '' });
  const [selectedTalla, setSelectedTalla] = useState<{ id: string; nombre: string } | null>(null);

  const filteredTallas = tallas.filter(talla =>
    talla.nombre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = () => {
    if (!formData.name.trim()) {
      toast.error('Por favor ingresa una talla');
      return;
    }

    if (tallas.some(t => t.nombre.toUpperCase() === formData.name.toUpperCase())) {
      toast.error('Esta talla ya existe');
      return;
    }

    agregarTalla(formData.name.trim());
    setFormData({ name: '' });
    setIsCreateOpen(false);
    toast.success('Talla creada exitosamente');
  };

  const handleEdit = () => {
    if (!selectedTalla || !formData.name.trim()) {
      toast.error('Por favor ingresa una talla');
      return;
    }

    if (tallas.some(t => t.id !== selectedTalla.id && t.nombre.toUpperCase() === formData.name.toUpperCase())) {
      toast.error('Esta talla ya existe');
      return;
    }

    // Para editar necesitaríamos una función actualizarTalla en el contexto
    // Por ahora, eliminamos y creamos una nueva
    eliminarTalla(selectedTalla.id);
    agregarTalla(formData.name.trim());
    setFormData({ name: '' });
    setSelectedTalla(null);
    setIsEditOpen(false);
    toast.success('Talla actualizada exitosamente');
  };

  const handleDelete = () => {
    if (selectedTalla) {
      eliminarTalla(selectedTalla.id);
      setSelectedTalla(null);
      setIsDeleteOpen(false);
      toast.success('Talla eliminada exitosamente');
    }
  };

  const openEditModal = (talla: { id: string; nombre: string }) => {
    setSelectedTalla(talla);
    setFormData({ name: talla.nombre });
    setIsEditOpen(true);
  };

  const openDeleteModal = (talla: { id: string; nombre: string }) => {
    setSelectedTalla(talla);
    setIsDeleteOpen(true);
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-playfair text-3xl font-bold text-gray-900">Gestionar Tallas</h1>
          <p className="font-inter text-gray-600 mt-2">Crea y administra las tallas disponibles para tus productos</p>
        </div>
        <button 
          onClick={() => {
            setFormData({ name: '' });
            setIsCreateOpen(true);
          }}
          className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span className="font-inter">Nueva Talla</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar tallas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg font-inter"
          />
        </div>
      </div>

      {/* Tallas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredTallas.length === 0 ? (
          <div className="col-span-full bg-white rounded-lg p-8 text-center border border-gray-200">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="font-inter text-gray-600">No hay tallas para mostrar</p>
          </div>
        ) : (
          filteredTallas.map((talla) => (
            <div key={talla.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-blue-100 text-blue-800 p-3 rounded-lg">
                  <Ruler className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-inter text-lg font-semibold">
                    {talla.nombre}
                  </h3>
                  <p className="font-inter text-sm text-gray-500">
                    Talla
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => openEditModal(talla)}
                  className="flex-1 text-[#d65391] border border-[#d65391] px-4 py-2 rounded-lg hover:bg-pink-50 transition-colors"
                >
                  <span className="font-inter">Editar</span>
                </button>
                <button 
                  onClick={() => openDeleteModal(talla)}
                  className="flex-1 text-red-600 border border-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <span className="font-inter">Eliminar</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Crear Talla */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md rounded-lg overflow-hidden">
          <DialogHeader className="bg-gradient-to-r from-[#d65391] to-[#f8a9c5] text-white p-6">
            <DialogTitle className="font-playfair text-2xl">
              Nueva Talla
            </DialogTitle>
            <DialogDescription className="font-inter">
              Completa los datos para crear una nueva talla
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 p-6">
            <div>
              <Label className="font-inter block text-sm text-gray-700 mb-2">
                Nombre de la Talla
              </Label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ name: lettersOnly(e.target.value) })}
                placeholder="Ej: XS, S, M, L, XL, XXL"
                className="font-inter w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d65391]"
              />
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
              Crear Talla
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Editar Talla */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md rounded-lg overflow-hidden">
          <DialogHeader className="bg-gradient-to-r from-[#d65391] to-[#f8a9c5] text-white p-6">
            <DialogTitle className="font-playfair text-2xl">
              Editar Talla
            </DialogTitle>
            <DialogDescription className="font-inter">
              Modifica los datos de la talla
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 p-6">
            <div>
              <Label className="font-inter block text-sm text-gray-700 mb-2">
                Nombre de la Talla
              </Label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ name: lettersOnly(e.target.value) })}
                placeholder="Ej: XS, S, M, L, XL, XXL"
                className="font-inter w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d65391]"
              />
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
              Actualizar Talla
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Eliminar Talla */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Talla</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar la talla "{selectedTalla?.nombre}"? Esta acción no se puede deshacer.
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
