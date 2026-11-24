import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Eye, Edit, ChevronRight, Loader2, RefreshCw, Truck, ClipboardList } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { toast } from '@/lib/toast';
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
  estado: string;
}

export const ProveedoresView: React.FC = () => {
  const { hasPermission } = useAuth();
  const puedeCrear = hasPermission('compras:crear');
  const puedeAdmin = hasPermission('compras:editar');

  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);

  const [viewOpen, setViewOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selected, setSelected] = useState<Proveedor | null>(null);

  const [form, setForm] = useState({ nombre: '', contacto: '', email: '', telefono: '', documento: '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const updateForm = (field: string, value: string) => {
    if (field === 'nombre' || field === 'contacto') {
      if (value && !/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]*$/.test(value)) {
        setFormErrors(prev => ({ ...prev, [field]: 'Solo se permiten letras' }));
        return;
      } else {
        setFormErrors(prev => ({ ...prev, [field]: '' }));
      }
    } else if (field === 'telefono' || field === 'documento') {
      if (value && !/^\d*$/.test(value)) {
        setFormErrors(prev => ({ ...prev, [field]: 'Solo se permiten números' }));
        return;
      } else {
        setFormErrors(prev => ({ ...prev, [field]: '' }));
      }
    } else if (field === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (value && !emailRegex.test(value)) {
        setFormErrors(prev => ({ ...prev, email: 'Formato de email inválido' }));
      } else {
        setFormErrors(prev => ({ ...prev, email: '' }));
      }
    }
    setForm(prev => ({ ...prev, [field]: value }));
  };

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

  const toggleEstado = async (p: Proveedor) => {
    const nuevoEstado = p.estado === 'activo' ? 'inactivo' : 'activo';
    setSaving(true);
    try {
      await api.fetchWithAuth(`/api/proveedores/${p.proveedorID}`, {
        method: 'PUT',
        body: JSON.stringify({
          Nombre: p.nombre,
          Contacto: p.contacto || '',
          Email: p.email || '',
          Telefono: p.telefono || '',
          Documento: p.documento || '',
          Estado: nuevoEstado,
        }),
      });
      toast.success(`Proveedor marcado como ${nuevoEstado}`);
      loadData();
    } catch (e: any) {
      const mensaje =
        e?.data?.message || e?.data?.Message ||
        e?.data?.title   || e?.data?.Title   ||
        e?.message       || 'Error cambiando estado del proveedor';
      toast.error(mensaje);
    } finally { setSaving(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-8 h-8 animate-spin text-[#5C2A52]" />
    </div>
  );

  return (
    <div className="p-8 bg-[#F7F5FC] dark:bg-[#17101f] min-h-screen">
      <div className="flex items-center gap-2 mb-4">
        <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-500 dark:text-[#b9aedd]">Dashboard</span>
        <ChevronRight className="w-4 h-4 text-gray-400 dark:text-[#b9aedd]" />
        <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-medium text-[#0A0A0A] dark:text-[#F5F3FA]">Gestión de Proveedores</span>
      </div>
      <h1 className="admin-page-title text-4xl text-[#0A0A0A] dark:text-[#F5F3FA] mb-6">Gestión de Proveedores</h1>

      {/* Barra */}
      <div className="bg-white dark:bg-[#1e1530] rounded-none p-6 shadow-sm border border-[#E7E0DA] dark:border-[#3A2E4D] flex flex-col lg:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-[#b9aedd]" />
          <input type="text" placeholder="Buscar proveedores..." value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
            className="w-full pl-12 pr-4 py-3 bg-[#F7F5FC] dark:bg-[#17101f] border border-[#E7E0DA] dark:border-[#3A2E4D] rounded-none focus:outline-none focus:ring-2 focus:ring-[#5C2A52]" />
        </div>
        <div className="flex gap-3">
          <button onClick={() => { setLoading(true); loadData(); }} className="px-4 py-3 bg-white dark:bg-[#1e1530] border border-[#E7E0DA] dark:border-[#3A2E4D] text-gray-700 dark:text-[#F5F3FA] rounded-none hover:bg-[#F7F5FC] dark:hover:bg-[#221830] transition">
            <RefreshCw className="w-5 h-5" />
          </button>
          {puedeCrear && (
            <button onClick={openCreate} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
              className="px-6 py-3 bg-gradient-to-r from-[#0A0A0A] via-[#3B0A45] to-[#5C2A52] text-white rounded-none hover:opacity-90 flex items-center gap-2 transition">
              <Plus className="w-5 h-5" /> Nuevo Proveedor
            </button>
          )}
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white dark:bg-[#1e1530] rounded-none shadow-sm border border-[#E7E0DA] dark:border-[#3A2E4D] overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#F7F5FC] dark:bg-[#17101f] border-b border-[#E7E0DA] dark:border-[#3A2E4D]">
            <tr>
              {['NOMBRE', 'CONTACTO', 'EMAIL', 'TELÉFONO', 'DOCUMENTO', 'ESTADO', 'ACCIONES'].map(h => (
                <th key={h} className="px-6 py-4 text-left">
                  <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-[#b9aedd]">{h}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-[#3A2E4D]">
            {filtered.map(p => (
              <tr key={p.proveedorID} className="hover:bg-[#F7F5FC] dark:hover:bg-[#221830] transition">
                <td className="px-6 py-4"><span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="font-medium text-[#0A0A0A] dark:text-[#F5F3FA]">{p.nombre}</span></td>
                <td className="px-6 py-4"><span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-gray-600 dark:text-[#b9aedd]">{p.contacto || '—'}</span></td>
                <td className="px-6 py-4"><span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-gray-600 dark:text-[#b9aedd] text-sm">{p.email || '—'}</span></td>
                <td className="px-6 py-4"><span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-gray-600 dark:text-[#b9aedd]">{p.telefono || '—'}</span></td>
                <td className="px-6 py-4"><span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-gray-600 dark:text-[#b9aedd] text-sm">{p.documento || '—'}</span></td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => puedeAdmin && toggleEstado(p)}
                    disabled={saving || !puedeAdmin}
                    style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      p.estado === 'activo'
                        ? 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/50 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-900/50'
                        : 'bg-gray-100 dark:bg-[#221830] text-gray-500 dark:text-[#b9aedd] border-[#E7E0DA] dark:border-[#3A2E4D] hover:bg-green-50 dark:hover:bg-green-950/40 hover:text-green-700 dark:hover:text-green-400 hover:border-green-200 dark:hover:border-green-900/50'
                    } ${!puedeAdmin ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    title={p.estado === 'activo' ? 'Clic para desactivar' : 'Clic para activar'}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${p.estado === 'activo' ? 'bg-green-500' : 'bg-gray-400 dark:bg-[#5a4d52]'}`} />
                    {p.estado === 'activo' ? 'Activo' : 'Inactivo'}
                  </button>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setSelected(p); setViewOpen(true); }}
                      className="p-2 text-gray-500 dark:text-[#b9aedd] hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400 rounded-none transition" title="Ver detalles">
                      <Eye className="w-5 h-5" />
                    </button>
                    {puedeAdmin && (
                      <>
                        <button onClick={() => openEdit(p)}
                          className="p-2 text-gray-500 dark:text-[#b9aedd] hover:bg-yellow-50 dark:hover:bg-yellow-950/40 hover:text-yellow-600 dark:hover:text-yellow-400 rounded-none transition" title="Editar">
                          <Edit className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400 dark:text-[#b9aedd]" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>No se encontraron proveedores</td></tr>
            )}
          </tbody>
        </table>
        <div className="px-6 py-4 border-t border-[#E7E0DA] dark:border-[#3A2E4D]">
          <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-500 dark:text-[#b9aedd]">
            Mostrando <span className="font-medium text-[#0A0A0A] dark:text-[#F5F3FA]">{filtered.length}</span> de <span className="font-medium text-[#0A0A0A] dark:text-[#F5F3FA]">{proveedores.length}</span> proveedores
          </span>
        </div>
      </div>

      {/* Modal Crear / Editar */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl h-auto flex flex-col p-0 gap-0">
          <DialogHeader className="px-8 pt-6 pb-4 border-b border-[#E7E0DA] dark:border-[#3A2E4D] flex-shrink-0">
            <DialogTitle style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-2xl text-[#0A0A0A] dark:text-[#F5F3FA]">
              {isEditing ? 'Editar Proveedor' : 'Nuevo Proveedor'}
            </DialogTitle>
            <DialogDescription style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-[#7d6f77] dark:text-[#b9aedd]">
              {isEditing ? 'Modifica la información del proveedor' : 'Completa los datos para registrar un nuevo proveedor'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            <div className="space-y-6 py-6 px-8">
              <div className="bg-white dark:bg-[#1e1530] rounded-none border border-[#E7E0DA] dark:border-[#3A2E4D] shadow-sm overflow-hidden">
                <div className="bg-[#C9A8C3]/50 dark:bg-[#241935]/50 px-6 py-4 border-b border-[#E7E0DA] dark:border-[#3A2E4D]">
                  <h3 style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="font-semibold text-[#5C2A52] text-base flex items-center gap-2"><ClipboardList className="w-4 h-4" />Información del Proveedor</h3>
                </div>
                <div className="p-6 grid grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <Label style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-medium text-[#0A0A0A] dark:text-[#F5F3FA]">
                      Nombre <span className="text-red-500">*</span>
                    </Label>
                    <Input value={form.nombre} onChange={e => updateForm('nombre', e.target.value)}
                      placeholder="Nombre del proveedor"
                      className={`h-10 focus-visible:ring-[#5C2A52] focus-visible:border-[#5C2A52] ${formErrors.nombre ? 'border-red-500' : 'border-[#E7E0DA] dark:border-[#3A2E4D]'}`} />
                    {formErrors.nombre && <p className="text-red-500 text-xs">{formErrors.nombre}</p>}
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-medium text-[#0A0A0A] dark:text-[#F5F3FA]">Contacto</Label>
                    <Input value={form.contacto} onChange={e => updateForm('contacto', e.target.value)}
                      placeholder="Nombre del contacto" className={`h-10 focus-visible:ring-[#5C2A52] focus-visible:border-[#5C2A52] ${formErrors.contacto ? 'border-red-500' : 'border-[#E7E0DA] dark:border-[#3A2E4D]'}`} />
                    {formErrors.contacto && <p className="text-red-500 text-xs">{formErrors.contacto}</p>}
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-medium text-[#0A0A0A] dark:text-[#F5F3FA]">
                      Email <span className="text-red-500">*</span>
                    </Label>
                    <Input type="email" value={form.email} onChange={e => updateForm('email', e.target.value)}
                      placeholder="email@ejemplo.com"
                      className={`h-10 focus-visible:ring-[#5C2A52] focus-visible:border-[#5C2A52] ${formErrors.email ? 'border-red-500' : 'border-[#E7E0DA] dark:border-[#3A2E4D]'}`} />
                    {formErrors.email && <p className="text-red-500 text-xs">{formErrors.email}</p>}
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-medium text-[#0A0A0A] dark:text-[#F5F3FA]">
                      Teléfono <span className="text-red-500">*</span>
                    </Label>
                    <Input type="tel" value={form.telefono} onChange={e => updateForm('telefono', e.target.value)}
                      placeholder="3001234567"
                      className={`h-10 focus-visible:ring-[#5C2A52] focus-visible:border-[#5C2A52] ${formErrors.telefono ? 'border-red-500' : 'border-[#E7E0DA] dark:border-[#3A2E4D]'}`} />
                    {formErrors.telefono && <p className="text-red-500 text-xs">{formErrors.telefono}</p>}
                  </div>

                  <div className="flex flex-col gap-2 col-span-2">
                    <Label style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-medium text-[#0A0A0A] dark:text-[#F5F3FA]">Documento (NIT / Cédula)</Label>
                    <Input value={form.documento} onChange={e => updateForm('documento', e.target.value)}
                      placeholder="NIT o número de cédula" className={`h-10 focus-visible:ring-[#5C2A52] focus-visible:border-[#5C2A52] ${formErrors.documento ? 'border-red-500' : 'border-[#E7E0DA] dark:border-[#3A2E4D]'}`} />
                    {formErrors.documento && <p className="text-red-500 text-xs">{formErrors.documento}</p>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 px-8 py-5 border-t border-[#E7E0DA] dark:border-[#3A2E4D] flex-shrink-0">
            <button onClick={() => { setFormOpen(false); resetForm(); }} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
              className="px-6 py-2 bg-gray-100 dark:bg-[#221830] text-gray-700 dark:text-[#F5F3FA] rounded-none hover:bg-gray-200 dark:hover:bg-[#241935] transition">Cancelar</button>
            <button onClick={guardar} disabled={saving} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', background: 'linear-gradient(90deg, #0A0A0A 0%, #3B0A45 55%, #5C2A52 100%)' }}
              className="px-6 py-2 text-white rounded-none disabled:opacity-50 flex items-center gap-2 transition-transform hover:scale-105">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEditing ? 'Guardar Cambios' : 'Crear Proveedor'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Ver Detalles */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-lg flex flex-col p-0 gap-0 overflow-hidden">
          <div className="px-8 pt-6 pb-5 flex-shrink-0" style={{ background: 'linear-gradient(90deg, #0A0A0A 0%, #3B0A45 55%, #5C2A52 100%)' }}>
            <p className="text-[10px] font-bold uppercase tracking-[3px] text-[#C9A8C3] mb-1">District Store</p>
            <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
              <Truck className="w-5 h-5 opacity-80" /> {selected?.nombre}
            </DialogTitle>
            <DialogDescription className="text-[#C9A8C3] text-sm mt-0.5">Proveedor</DialogDescription>
          </div>
          {selected && (
            <div className="bg-[#F7F5FC] dark:bg-[#17101f] px-6 py-5">
              <div className="bg-white dark:bg-[#1e1530] rounded-none border border-[#E7E0DA] dark:border-[#3A2E4D] shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-[#E7E0DA] dark:border-[#3A2E4D] bg-[#C9A8C3]/50 dark:bg-[#241935]/50">
                  <h3 className="font-semibold text-[#5C2A52] text-xs uppercase tracking-wider">Información General</h3>
                </div>
                <div className="p-5 grid grid-cols-2 gap-4">
                  {[
                    { label: 'Nombre', value: selected.nombre },
                    { label: 'Contacto', value: selected.contacto || '—' },
                    { label: 'Email', value: selected.email || '—' },
                    { label: 'Teléfono', value: selected.telefono || '—' },
                    { label: 'Documento', value: selected.documento || '—' },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex flex-col gap-1">
                      <p className="text-xs text-gray-400 dark:text-[#b9aedd] font-medium uppercase tracking-wide">{label}</p>
                      <p className="text-sm font-semibold text-[#0A0A0A] dark:text-[#F5F3FA]">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <div className="px-6 py-4 border-t border-[#E7E0DA] dark:border-[#3A2E4D] bg-white dark:bg-[#1e1530] flex-shrink-0 flex justify-end">
            <button onClick={() => setViewOpen(false)}
              className="px-6 py-2 bg-gray-100 dark:bg-[#221830] text-gray-700 dark:text-[#F5F3FA] rounded-none hover:bg-gray-200 dark:hover:bg-[#241935] transition text-sm font-medium">Cerrar</button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};