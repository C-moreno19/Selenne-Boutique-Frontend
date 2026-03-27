import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, ChevronRight, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../../components/ui/alert-dialog';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { toast } from 'sonner';
import { useSubcategorias } from '../../../shared/contexts/SubcategoriasContext';
import { useAuth } from '../../../shared/contexts/AuthContext';

export const MaterialesView: React.FC = () => {
  const { hasPermission } = useAuth();
  const puedeAdmin = hasPermission('admin:dashboard');
  const { materiales, agregarMaterial, editarMaterial, eliminarMaterial } = useSubcategorias();

  const [searchQuery, setSearchQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [formName, setFormName] = useState('');
  const [saving, setSaving] = useState(false);

  const filtered = materiales.filter(item =>
    item.nombre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openCreate = () => { setFormName(''); setIsEditing(false); setFormOpen(true); };
  const openEdit = (item: any) => { setSelected(item); setFormName(item.nombre); setIsEditing(true); setFormOpen(true); };

  const guardar = async () => {
    if (!formName.trim()) { toast.error('El nombre es obligatorio'); return; }
    setSaving(true);
    try {
      if (isEditing && selected) {
        await editarMaterial(selected.id, formName.trim());
        toast.success('Material actualizado');
      } else {
        await agregarMaterial(formName.trim());
        toast.success('Material creado');
      }
      setFormOpen(false);
    } catch (e: any) { toast.error(e?.data?.message || 'Error guardando'); }
    finally { setSaving(false); }
  };

  const eliminar = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await eliminarMaterial(selected.id);
      toast.success('Material eliminado');
      setDeleteOpen(false);
    } catch { toast.error('Error eliminando'); }
    finally { setSaving(false); }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex items-center gap-2 mb-4">
        <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-500">Dashboard</span>
        <ChevronRight className="w-4 h-4 text-gray-400" />
        <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm font-medium text-gray-900">Materials</span>
      </div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontFamily: 'Playfair Display, serif' }} className="text-4xl text-gray-900">🧵 Materials</h1>
          <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-gray-500 text-sm mt-1">{filtered.length} materials registrados</p>
        </div>
        {puedeAdmin && (
          <button onClick={openCreate} style={{ fontFamily: 'Inter, sans-serif' }}
            className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 flex items-center gap-2 transition-colors">
            <Plus className="w-5 h-5" /> Nuevo Material
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Buscar materials..." value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)} style={{ fontFamily: 'Inter, sans-serif' }}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d65391]" />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              
              <th className="px-6 py-4 text-left"><span style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs font-semibold uppercase tracking-wider text-gray-500">NOMBRE</span></th>
              <th className="px-6 py-4 text-right"><span style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs font-semibold uppercase tracking-wider text-gray-500">ACCIONES</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(item => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                
                <td className="px-6 py-4">
                  <span style={{ fontFamily: 'Inter, sans-serif' }} className="font-medium text-gray-900">{item.nombre}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    {puedeAdmin && (
                      <>
                        <button onClick={() => openEdit(item)}
                          className="p-2 text-gray-500 hover:bg-yellow-50 hover:text-yellow-600 rounded-lg transition-colors" title="Editar">
                          <Edit className="w-5 h-5" />
                        </button>
                        <button onClick={() => { setSelected(item); setDeleteOpen(true); }}
                          className="p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors" title="Eliminar">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={3} className="px-6 py-12 text-center text-gray-400" style={{ fontFamily: 'Inter, sans-serif' }}>No hay materials registrados</td></tr>
            )}
          </tbody>
        </table>
        <div className="px-6 py-4 border-t border-gray-100">
          <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-500">
            Mostrando <span className="font-medium text-gray-800">{filtered.length}</span> de <span className="font-medium text-gray-800">{materiales.length}</span> materials
          </span>
        </div>
      </div>

      {/* Modal Crear / Editar */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl h-auto flex flex-col p-0 gap-0">
          <DialogHeader className="px-8 pt-6 pb-4 border-b border-gray-200 flex-shrink-0">
            <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }} className="text-2xl">
              {isEditing ? 'Editar Material' : 'Nuevo Material'}
            </DialogTitle>
            <DialogDescription style={{ fontFamily: 'Inter, sans-serif' }}>
              {isEditing ? 'Modifica el material' : 'Completa los datos para registrar un nuevo material'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-6 py-6 px-8">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <h3 style={{ fontFamily: 'Inter, sans-serif' }} className="font-semibold text-gray-800 text-base">📋 Información</h3>
                </div>
                <div className="p-6 flex flex-col gap-5">
                  <div className="flex flex-col gap-2">
                    <Label style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm font-medium text-gray-700">Nombre <span className="text-red-500">*</span></Label>
                    <Input value={formName} onChange={e => setFormName(e.target.value)}
                      placeholder="Ej: Algodón, Poliéster..." className="h-10 border-gray-300" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 px-8 py-5 border-t border-gray-200 flex-shrink-0">
            <button onClick={() => setFormOpen(false)} style={{ fontFamily: 'Inter, sans-serif' }}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">Cancelar</button>
            <button onClick={guardar} disabled={saving} style={{ fontFamily: 'Inter, sans-serif' }}
              className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2 transition-colors">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEditing ? 'Guardar Cambios' : 'Crear Material'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Eliminar */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ fontFamily: 'Playfair Display, serif' }}>¿Eliminar material?</AlertDialogTitle>
            <AlertDialogDescription style={{ fontFamily: 'Inter, sans-serif' }}>
              Vas a eliminar <strong>{selected?.nombre}</strong>. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel style={{ fontFamily: 'Inter, sans-serif' }}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={eliminar} disabled={saving}
              className="bg-red-600 hover:bg-red-700 flex items-center gap-2" style={{ fontFamily: 'Inter, sans-serif' }}>
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};