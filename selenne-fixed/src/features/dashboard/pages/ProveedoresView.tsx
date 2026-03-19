import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Eye, Edit, Trash2, ChevronRight, Loader2, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../../components/ui/alert-dialog';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { getJson, postJson } from '../../../services/api';
import api from '../../../services/api';

interface Proveedor {
  proveedorID: number;
  nombre: string;
  contacto?: string;
  email?: string;
  telefono?: string;
  documento?: string;
  estado?: string;
}

export const ProveedoresView: React.FC = () => {
  const { hasPermission } = useAuth();
  const puedeAdmin = hasPermission('admin:dashboard');

  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);

  const [viewOpen, setViewOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selected, setSelected] = useState<Proveedor | null>(null);

  const [form, setForm] = useState({ nombre: '', contacto: '', email: '', telefono: '', documento: '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const loadData = useCallback(async () => {
    try {
      const res = await getJson('/api/proveedores');
      setProveedores((res?.data || res || []).map((p: any) => ({
        proveedorID: p.proveedorID ?? p.ProveedorID,
        nombre: p.nombre ?? p.Nombre ?? '',
        contacto: p.contacto ?? p.Contacto ?? '',
        email: p.email ?? p.Email ?? '',
        telefono: p.telefono ?? p.Telefono ?? '',
        documento: p.documento ?? p.Documento ?? '',
        estado: p.estado ?? p.Estado ?? 'activo',
      })));
    } catch { toast.error('Error cargando proveedores'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = proveedores.filter(p => {
    const q = searchQuery.toLowerCase();
    return p.nombre.toLowerCase().includes(q) ||
      (p.contacto || '').toLowerCase().includes(q) ||
      (p.email || '').toLowerCase().includes(q) ||
      (p.telefono || '').toLowerCase().includes(q);
  });

  const resetForm = () => { setForm({ nombre: '', contacto: '', email: '', telefono: '', documento: '' }); setFormErrors({}); };

  const openCreate = () => { resetForm(); setIsEditing(false); setFormOpen(true); };
  const openEdit = (p: Proveedor) => {
    setSelected(p);
    setForm({ nombre: p.nombre, contacto: p.contacto || '', email: p.email || '', telefono: p.telefono || '', documento: p.documento || '' });
    setFormErrors({});
    setIsEditing(true);
    setFormOpen(true);
  };

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!form.nombre.trim()) errors.nombre = 'El nombre es obligatorio';
    if (!form.email.trim()) errors.email = 'El email es obligatorio';
    if (!form.telefono.trim()) errors.telefono = 'El teléfono es obligatorio';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const guardar = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (isEditing && selected) {
        await api.fetchWithAuth(`/api/proveedores/${selected.proveedorID}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ Nombre: form.nombre, Contacto: form.contacto, Email: form.email, Telefono: form.telefono, Documento: form.documento }),
        });
        toast.success('Proveedor actualizado');
      } else {
        await postJson('/api/proveedores', { Nombre: form.nombre, Contacto: form.contacto, Email: form.email, Telefono: form.telefono, Documento: form.documento });
        toast.success('Proveedor creado');
      }
      setFormOpen(false); resetForm(); loadData();
    } catch (e: any) { toast.error(e?.data?.message || 'Error guardando proveedor'); }
    finally { setSaving(false); }
  };

  const eliminar = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await api.fetchWithAuth(`/api/proveedores/${selected.proveedorID}`, { method: 'DELETE' });
      toast.success('Proveedor eliminado');
      setDeleteOpen(false); loadData();
    } catch { toast.error('Error eliminando proveedor'); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-8 h-8 animate-spin text-[#d65391]" />
    </div>
  );

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex items-center gap-2 mb-4">
        <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-500">Dashboard</span>
        <ChevronRight className="w-4 h-4 text-gray-400" />
        <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm font-medium text-gray-900">Gestión de Proveedores</span>
      </div>
      <h1 style={{ fontFamily: 'Playfair Display, serif' }} className="text-4xl text-gray-900 mb-6">Gestión de Proveedores</h1>

      {/* Barra */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col lg:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Buscar proveedores..." value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)} style={{ fontFamily: 'Inter, sans-serif' }}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d65391]" />
        </div>
        <div className="flex gap-3">
          <button onClick={() => { setLoading(true); loadData(); }} className="px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            <RefreshCw className="w-5 h-5" />
          </button>
          {puedeAdmin && (
            <button onClick={openCreate} style={{ fontFamily: 'Inter, sans-serif' }}
              className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 flex items-center gap-2 transition-colors">
              <Plus className="w-5 h-5" /> Nuevo Proveedor
            </button>
          )}
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['NOMBRE', 'CONTACTO', 'EMAIL', 'TELÉFONO', 'DOCUMENTO', 'ACCIONES'].map(h => (
                <th key={h} className="px-6 py-4 text-left">
                  <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs font-semibold uppercase tracking-wider text-gray-500">{h}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(p => (
              <tr key={p.proveedorID} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4"><span style={{ fontFamily: 'Inter, sans-serif' }} className="font-medium text-gray-900">{p.nombre}</span></td>
                <td className="px-6 py-4"><span style={{ fontFamily: 'Inter, sans-serif' }} className="text-gray-600">{p.contacto || '—'}</span></td>
                <td className="px-6 py-4"><span style={{ fontFamily: 'Inter, sans-serif' }} className="text-gray-600 text-sm">{p.email || '—'}</span></td>
                <td className="px-6 py-4"><span style={{ fontFamily: 'Inter, sans-serif' }} className="text-gray-600">{p.telefono || '—'}</span></td>
                <td className="px-6 py-4"><span style={{ fontFamily: 'Inter, sans-serif' }} className="text-gray-600 text-sm">{p.documento || '—'}</span></td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setSelected(p); setViewOpen(true); }}
                      className="p-2 text-gray-500 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors" title="Ver detalles">
                      <Eye className="w-5 h-5" />
                    </button>
                    {puedeAdmin && (
                      <>
                        <button onClick={() => openEdit(p)}
                          className="p-2 text-gray-500 hover:bg-yellow-50 hover:text-yellow-600 rounded-lg transition-colors" title="Editar">
                          <Edit className="w-5 h-5" />
                        </button>
                        <button onClick={() => { setSelected(p); setDeleteOpen(true); }}
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
              <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400" style={{ fontFamily: 'Inter, sans-serif' }}>No se encontraron proveedores</td></tr>
            )}
          </tbody>
        </table>
        <div className="px-6 py-4 border-t border-gray-100">
          <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-500">
            Mostrando <span className="font-medium text-gray-800">{filtered.length}</span> de <span className="font-medium text-gray-800">{proveedores.length}</span> proveedores
          </span>
        </div>
      </div>

      {/* Modal Crear / Editar */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl h-auto flex flex-col p-0 gap-0">
          <DialogHeader className="px-8 pt-6 pb-4 border-b border-gray-200 flex-shrink-0">
            <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }} className="text-2xl">
              {isEditing ? 'Editar Proveedor' : 'Nuevo Proveedor'}
            </DialogTitle>
            <DialogDescription style={{ fontFamily: 'Inter, sans-serif' }}>
              {isEditing ? 'Modifica la información del proveedor' : 'Completa los datos para registrar un nuevo proveedor'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            <div className="space-y-6 py-6 px-8">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <h3 style={{ fontFamily: 'Inter, sans-serif' }} className="font-semibold text-gray-800 text-base">📋 Información del Proveedor</h3>
                </div>
                <div className="p-6 grid grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <Label style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm font-medium text-gray-700">
                      Nombre <span className="text-red-500">*</span>
                    </Label>
                    <Input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })}
                      placeholder="Nombre del proveedor"
                      className={`h-10 ${formErrors.nombre ? 'border-red-500' : 'border-gray-300'}`} />
                    {formErrors.nombre && <p className="text-red-500 text-xs">{formErrors.nombre}</p>}
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm font-medium text-gray-700">Contacto</Label>
                    <Input value={form.contacto} onChange={e => setForm({ ...form, contacto: e.target.value })}
                      placeholder="Nombre del contacto" className="h-10 border-gray-300" />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm font-medium text-gray-700">
                      Email <span className="text-red-500">*</span>
                    </Label>
                    <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                      placeholder="email@ejemplo.com"
                      className={`h-10 ${formErrors.email ? 'border-red-500' : 'border-gray-300'}`} />
                    {formErrors.email && <p className="text-red-500 text-xs">{formErrors.email}</p>}
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm font-medium text-gray-700">
                      Teléfono <span className="text-red-500">*</span>
                    </Label>
                    <Input type="tel" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })}
                      placeholder="+57 300 123 4567"
                      className={`h-10 ${formErrors.telefono ? 'border-red-500' : 'border-gray-300'}`} />
                    {formErrors.telefono && <p className="text-red-500 text-xs">{formErrors.telefono}</p>}
                  </div>

                  <div className="flex flex-col gap-2 col-span-2">
                    <Label style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm font-medium text-gray-700">Documento (NIT / Cédula)</Label>
                    <Input value={form.documento} onChange={e => setForm({ ...form, documento: e.target.value })}
                      placeholder="NIT o número de cédula" className="h-10 border-gray-300" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 px-8 py-5 border-t border-gray-200 flex-shrink-0">
            <button onClick={() => { setFormOpen(false); resetForm(); }} style={{ fontFamily: 'Inter, sans-serif' }}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">Cancelar</button>
            <button onClick={guardar} disabled={saving} style={{ fontFamily: 'Inter, sans-serif' }}
              className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2 transition-colors">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEditing ? 'Guardar Cambios' : 'Crear Proveedor'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Ver Detalles */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="px-8 pt-6 pb-4 border-b border-gray-200">
            <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }} className="text-2xl">Detalles del Proveedor</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="p-6 space-y-4">
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                  <h3 style={{ fontFamily: 'Inter, sans-serif' }} className="font-semibold text-gray-700 text-sm">Información General</h3>
                </div>
                <div className="p-6 grid grid-cols-2 gap-4">
                  {[
                    { label: 'Nombre', value: selected.nombre },
                    { label: 'Contacto', value: selected.contacto || '—' },
                    { label: 'Email', value: selected.email || '—' },
                    { label: 'Teléfono', value: selected.telefono || '—' },
                    { label: 'Documento', value: selected.documento || '—' },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex flex-col gap-1">
                      <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-500 font-medium uppercase">{label}</p>
                      <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm font-semibold text-gray-900">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="px-6 pb-6">
            <button onClick={() => setViewOpen(false)} style={{ fontFamily: 'Inter, sans-serif' }}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">Cerrar</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Eliminar */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ fontFamily: 'Playfair Display, serif' }}>¿Eliminar proveedor?</AlertDialogTitle>
            <AlertDialogDescription style={{ fontFamily: 'Inter, sans-serif' }}>
              Vas a eliminar a <strong>{selected?.nombre}</strong>. Esta acción no se puede deshacer.
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