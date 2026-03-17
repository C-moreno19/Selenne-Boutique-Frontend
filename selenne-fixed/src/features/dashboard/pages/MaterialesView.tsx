import { useAuth } from '../../../shared/contexts/AuthContext';
import React, { useState } from 'react';
import { Plus, Search, Layers, Edit } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../../components/ui/alert-dialog';
import { toast } from 'sonner';
import { useSubcategorias } from '../../../shared/contexts/SubcategoriasContext';

export const MaterialesView: React.FC = () => {
  const { hasPermission } = useAuth();
  const puedeAdmin = hasPermission('admin:dashboard');
  const { materiales, agregarMaterial, editarMaterial, eliminarMaterial } = useSubcategorias();
  const [searchQuery, setSearchQuery] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedNombre, setSelectedNombre] = useState('');
  const [formName, setFormName] = useState('');

  const filtered = materiales.filter(m => m.nombre.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleCreate = async () => {
    if (!formName.trim()) { toast.error('Ingresa el nombre del material'); return; }
    await agregarMaterial(formName.trim());
    setFormName(''); setCreateOpen(false);
    toast.success('Material creado exitosamente');
  };

  const handleEdit = async () => {
    if (!selectedId || !formName.trim()) { toast.error('Ingresa el nombre del material'); return; }
    await editarMaterial(selectedId, formName.trim());
    setFormName(''); setEditOpen(false); setSelectedId(null);
    toast.success('Material actualizado exitosamente');
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    await eliminarMaterial(selectedId);
    setSelectedId(null); setDeleteOpen(false);
    toast.success('Material eliminado exitosamente');
  };

  const openEdit = (id: string, nombre: string) => {
    setSelectedId(id); setFormName(nombre); setSelectedNombre(nombre); setEditOpen(true);
  };

  const openDelete = (id: string, nombre: string) => {
    setSelectedId(id); setSelectedNombre(nombre); setDeleteOpen(true);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '32px' }} className="mb-2">Materiales</h1>
          <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-gray-600">Gestiona los materiales de los productos</p>
        </div>
        {puedeAdmin && <button onClick={() => { setFormName(''); setCreateOpen(true); }}
          className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors">
          <Plus className="w-5 h-5" />
          <span style={{ fontFamily: 'Inter, sans-serif' }}>Nuevo Material</span>
        </button>}
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Buscar materiales..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
            style={{ fontFamily: 'Inter, sans-serif' }} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.length === 0 ? (
          <div className="col-span-full bg-white rounded-lg p-8 text-center border border-gray-200">
            <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-gray-500">No hay materiales para mostrar</p>
          </div>
        ) : filtered.map((m) => (
          <div key={m.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-gradient-to-br from-[#d65391] to-[#f8a9c5] p-3 rounded-lg">
                <Layers className="w-6 h-6 text-white" />
              </div>
              <h3 style={{ fontFamily: 'Inter, sans-serif' }} className="text-lg">{m.nombre}</h3>
            </div>
            <div className="flex gap-2">
              <button onClick={() => openEdit(m.id, m.nombre)}
                className="flex-1 text-[#d65391] border border-[#d65391] px-4 py-2 rounded-lg hover:bg-pink-50 transition-colors">
                <span style={{ fontFamily: 'Inter, sans-serif' }}>Editar</span>
              </button>
              <button onClick={() => openDelete(m.id, m.nombre)}
                className="flex-1 text-red-600 border border-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors">
                <span style={{ fontFamily: 'Inter, sans-serif' }}>Eliminar</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Crear */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md rounded-lg overflow-hidden">
          <DialogHeader className="bg-gradient-to-r from-[#d65391] to-[#f8a9c5] text-white p-6">
            <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }} className="text-2xl">Nuevo Material</DialogTitle>
            <DialogDescription style={{ fontFamily: 'Inter, sans-serif' }}>Completa los datos para crear un nuevo material</DialogDescription>
          </DialogHeader>
          <div className="p-6">
            <label style={{ fontFamily: 'Inter, sans-serif' }} className="block text-sm text-gray-700 mb-2">Nombre del Material</label>
            <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)}
              placeholder="Ej: Algodón, Seda, Poliéster"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d65391]"
              style={{ fontFamily: 'Inter, sans-serif' }} />
          </div>
          <DialogFooter>
            <button onClick={() => setCreateOpen(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50" style={{ fontFamily: 'Inter, sans-serif' }}>Cancelar</button>
            <button onClick={handleCreate} className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800" style={{ fontFamily: 'Inter, sans-serif' }}>Crear Material</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Editar */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md rounded-lg overflow-hidden">
          <DialogHeader className="bg-gradient-to-r from-[#d65391] to-[#f8a9c5] text-white p-6">
            <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }} className="text-2xl">Editar Material</DialogTitle>
            <DialogDescription style={{ fontFamily: 'Inter, sans-serif' }}>Modifica los datos del material</DialogDescription>
          </DialogHeader>
          <div className="p-6">
            <label style={{ fontFamily: 'Inter, sans-serif' }} className="block text-sm text-gray-700 mb-2">Nombre del Material</label>
            <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)}
              placeholder="Ej: Algodón, Seda, Poliéster"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d65391]"
              style={{ fontFamily: 'Inter, sans-serif' }} />
          </div>
          <DialogFooter>
            <button onClick={() => setEditOpen(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50" style={{ fontFamily: 'Inter, sans-serif' }}>Cancelar</button>
            <button onClick={handleEdit} className="px-4 py-2 bg-[#d65391] text-white rounded-lg hover:bg-[#c14a7f]" style={{ fontFamily: 'Inter, sans-serif' }}>Guardar Cambios</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Eliminar */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ fontFamily: 'Playfair Display, serif' }} className="text-2xl">¿Eliminar Material?</AlertDialogTitle>
            <AlertDialogDescription style={{ fontFamily: 'Inter, sans-serif' }} className="text-gray-600">
              ¿Estás seguro de que deseas eliminar "{selectedNombre}"? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel style={{ fontFamily: 'Inter, sans-serif' }}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700" style={{ fontFamily: 'Inter, sans-serif' }}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};