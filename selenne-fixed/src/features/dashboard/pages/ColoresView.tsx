import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, ChevronRight, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../../components/ui/dialog';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { toast } from '@/lib/toast';
import { useSubcategorias } from '../../../shared/contexts/SubcategoriasContext';
import { useAuth } from '../../../shared/contexts/AuthContext';

export const ColoresView: React.FC = () => {
  const { hasPermission } = useAuth();
  const puedeCrear = hasPermission('productos:crear');
  const puedeEditar = hasPermission('productos:editar');
  const puedeEliminar = hasPermission('productos:eliminar');
  const { colores, agregarColor, eliminarColor } = useSubcategorias();

  const [searchQuery, setSearchQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [formName, setFormName] = useState('');
  const [hexColor, setHexColor] = useState('#000000');
  const [saving, setSaving] = useState(false);

  const filtered = colores.filter(c => c.nombre.toLowerCase().includes(searchQuery.toLowerCase()));

  const openCreate = () => { setFormName(''); setHexColor('#000000'); setIsEditing(false); setFormOpen(true); };
  const openEdit = (item: any) => { setSelected(item); setFormName(item.nombre); setHexColor(item.hexColor || '#000000'); setIsEditing(true); setFormOpen(true); };

  const guardar = async () => {
    if (!formName.trim()) { toast.error('El nombre es obligatorio'); return; }
    setSaving(true);
    try {
      if (isEditing && selected) {
        eliminarColor(selected.id);
        agregarColor(formName.trim(), hexColor);
        toast.success('Color actualizado');
      } else {
        agregarColor(formName.trim(), hexColor);
        toast.success('Color creado');
      }
      setFormOpen(false);
    } catch (e: any) { toast.error('Error guardando'); }
    finally { setSaving(false); }
  };

  const eliminar = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      eliminarColor(selected.id);
      toast.success('Color eliminado');
      setDeleteOpen(false);
    } catch { toast.error('Error eliminando'); }
    finally { setSaving(false); }
  };

  return (
    <div className="p-8 bg-[#F7F5FC] dark:bg-[#17101f] min-h-screen">
      <div className="flex items-center gap-2 mb-4">
        <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-500 dark:text-[#b9aedd]">Dashboard</span>
        <ChevronRight className="w-4 h-4 text-[#C9A8C3]" />
        <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-medium text-[#0A0A0A] dark:text-[#F5F3FA]">Colores</span>
      </div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="admin-page-title text-3xl font-bold text-[#0A0A0A] dark:text-[#F5F3FA]">Colores</h1>
          <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-gray-500 dark:text-[#b9aedd] text-sm mt-1">{filtered.length} colores registrados</p>
        </div>
        {puedeCrear && (
          <button onClick={openCreate} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
            className="px-6 py-3 bg-gradient-to-r from-[#0A0A0A] via-[#3B0A45] to-[#5C2A52] text-white rounded-none hover:opacity-90 flex items-center gap-2 transition">
            <Plus className="w-5 h-5" /> Nuevo Color
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-[#1e1530] rounded-none p-6 border border-[#E7E0DA] dark:border-[#3A2E4D] mb-6" style={{ boxShadow: '0 2px 12px rgba(214, 83, 145, 0.07)' }}>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#C9A8C3]" />
          <input type="text" placeholder="Buscar colores..." value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
            className="w-full pl-12 pr-4 py-3 bg-[#F7F5FC] dark:bg-[#17101f] border border-[#E7E0DA] dark:border-[#3A2E4D] rounded-none focus:outline-none focus:ring-2 focus:ring-[#5C2A52]" />
        </div>
      </div>

      <div className="bg-white dark:bg-[#1e1530] rounded-none border border-[#E7E0DA] dark:border-[#3A2E4D] overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(214, 83, 145, 0.07)' }}>
        <table className="w-full">
          <thead className="bg-[#F7F5FC] dark:bg-[#17101f] border-b border-[#E7E0DA] dark:border-[#3A2E4D]">
            <tr>
              <th className="px-6 py-4 text-left w-16"></th>
              <th className="px-6 py-4 text-left"><span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-[#b9aedd]">NOMBRE</span></th>
              <th className="px-6 py-4 text-left"><span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-[#b9aedd]">HEX</span></th>
              <th className="px-6 py-4 text-right"><span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-[#b9aedd]">ACCIONES</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-[#3A2E4D]">
            {filtered.map(item => (
              <tr key={item.id} className="hover:bg-[#C9A8C3] dark:hover:bg-[#241935] transition">
                <td className="px-6 py-4">
                  <div className="w-8 h-8 rounded-full border-2 border-[#E7E0DA] dark:border-[#3A2E4D] shadow-sm"
                    style={{ backgroundColor: item.hexColor || '#000000' }} />
                </td>
                <td className="px-6 py-4">
                  <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="font-medium text-[#0A0A0A] dark:text-[#F5F3FA]">{item.nombre}</span>
                </td>
                <td className="px-6 py-4">
                  <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-500 dark:text-[#b9aedd] font-mono">{item.hexColor || '—'}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    {puedeEditar && (
                      <button onClick={() => openEdit(item)}
                        className="p-2 text-gray-500 dark:text-[#b9aedd] hover:bg-[#C9A8C3] dark:hover:bg-[#241935] hover:text-[#5C2A52] rounded-none transition" title="Editar">
                        <Edit className="w-5 h-5" />
                      </button>
                    )}
                    {puedeEliminar && (
                      <button onClick={() => { setSelected(item); setDeleteOpen(true); }}
                        className="p-2 text-gray-500 dark:text-[#b9aedd] hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-400 rounded-none transition" title="Eliminar">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400 dark:text-[#b9aedd]" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>No hay colores registrados</td></tr>
            )}
          </tbody>
        </table>
        <div className="px-6 py-4 border-t border-[#E7E0DA] dark:border-[#3A2E4D]">
          <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-500 dark:text-[#b9aedd]">
            Mostrando <span className="font-medium text-[#0A0A0A] dark:text-[#F5F3FA]">{filtered.length}</span> de <span className="font-medium text-[#0A0A0A] dark:text-[#F5F3FA]">{colores.length}</span> colores
          </span>
        </div>
      </div>

      {/* Modal Crear / Editar */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl h-auto flex flex-col p-0 gap-0">
          <DialogHeader className="px-8 pt-6 pb-4 border-b border-[#E7E0DA] dark:border-[#3A2E4D] flex-shrink-0">
            <DialogTitle style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xl font-semibold">
              {isEditing ? 'Editar Color' : 'Nuevo Color'}
            </DialogTitle>
            <DialogDescription style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
              {isEditing ? 'Modifica el color' : 'Completa los datos para registrar un nuevo color'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-6 py-6 px-8">
              <div className="bg-white dark:bg-[#1e1530] rounded-none border border-[#E7E0DA] dark:border-[#3A2E4D] shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-[#0A0A0A] via-[#3B0A45] to-[#5C2A52] px-6 py-4">
                  <h3 style={{ fontFamily: '"Playfair Display", Georgia, serif' }} className="font-semibold text-white text-base">Información</h3>
                </div>
                <div className="p-6 flex flex-col gap-5">
                  <div className="flex flex-col gap-2">
                    <Label style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-medium text-gray-700 dark:text-[#F5F3FA]">Nombre <span className="text-red-500">*</span></Label>
                    <Input value={formName} onChange={e => setFormName(e.target.value)}
                      placeholder="Ej: Rosa, Azul, Negro..." className="h-10 border-gray-300 dark:border-[#3A2E4D]" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-medium text-gray-700 dark:text-[#F5F3FA]">Color</Label>
                    <div className="flex items-center gap-4">
                      <input type="color" value={hexColor} onChange={e => setHexColor(e.target.value)}
                        className="w-16 h-10 border border-gray-300 dark:border-[#3A2E4D] rounded-none cursor-pointer" />
                      <div className="w-10 h-10 rounded-full border-2 border-[#E7E0DA] dark:border-[#3A2E4D] shadow-sm" style={{ backgroundColor: hexColor }} />
                      <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-500 dark:text-[#b9aedd] font-mono">{hexColor}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 px-8 py-5 border-t border-[#E7E0DA] dark:border-[#3A2E4D] flex-shrink-0">
            <button onClick={() => setFormOpen(false)} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
              className="px-6 py-2 bg-gray-100 dark:bg-[#221830] text-gray-700 dark:text-[#F5F3FA] rounded-none hover:bg-gray-200 dark:hover:bg-[#241935] transition">Cancelar</button>
            <button onClick={guardar} disabled={saving} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
              className="px-6 py-2 bg-gradient-to-r from-[#0A0A0A] via-[#3B0A45] to-[#5C2A52] text-white rounded-none hover:opacity-90 disabled:opacity-50 flex items-center gap-2 transition">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEditing ? 'Guardar Cambios' : 'Crear Color'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Eliminar */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="¿Eliminar color?"
        description={<>Vas a eliminar <strong>{selected?.nombre}</strong>. Esta acción no se puede deshacer.</>}
        onConfirm={eliminar}
        loading={saving}
      />
    </div>
  );
};

export default ColoresView;