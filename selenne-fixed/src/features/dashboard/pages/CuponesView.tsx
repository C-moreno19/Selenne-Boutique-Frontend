import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Edit, Trash2, ChevronRight, Loader2, Tag, Power } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../../components/ui/dialog';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { toast } from '@/lib/toast';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { getJson, postJson, putJson, deleteJson } from '../../../services/api';

interface Cupon {
  cuponID: number;
  codigo: string;
  tipoDescuento: 'porcentaje' | 'monto';
  valorDescuento: number;
  montoMinimo?: number | null;
  usosMaximos?: number | null;
  usosActuales: number;
  fechaExpiracion?: string | null;
  activo: boolean;
  fechaCreacion: string;
}

const EMPTY_FORM = {
  codigo: '',
  tipoDescuento: 'porcentaje' as 'porcentaje' | 'monto',
  valorDescuento: '',
  montoMinimo: '',
  usosMaximos: '',
  fechaExpiracion: '',
};

const fmt = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

export const CuponesView: React.FC = () => {
  const { hasPermission } = useAuth();
  const puedeEditar = hasPermission('productos:editar');

  const [cupones, setCupones] = useState<Cupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selected, setSelected] = useState<Cupon | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const r = await getJson<{ data?: Cupon[] }>('/api/cupones');
      setCupones(r?.data ?? []);
    } catch {
      toast.error('No se pudieron cargar los cupones');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const filtered = cupones.filter(c => c.codigo.toLowerCase().includes(searchQuery.toLowerCase()));

  const openCreate = () => { setForm(EMPTY_FORM); setIsEditing(false); setFormOpen(true); };
  const openEdit = (c: Cupon) => {
    setSelected(c);
    setForm({
      codigo: c.codigo,
      tipoDescuento: c.tipoDescuento,
      valorDescuento: String(c.valorDescuento),
      montoMinimo: c.montoMinimo != null ? String(c.montoMinimo) : '',
      usosMaximos: c.usosMaximos != null ? String(c.usosMaximos) : '',
      fechaExpiracion: c.fechaExpiracion ? c.fechaExpiracion.slice(0, 10) : '',
    });
    setIsEditing(true);
    setFormOpen(true);
  };

  const guardar = async () => {
    if (!isEditing && !form.codigo.trim()) { toast.error('El código es obligatorio'); return; }
    const valor = Number(form.valorDescuento);
    if (!valor || valor <= 0) { toast.error('El valor del descuento debe ser mayor a 0'); return; }
    if (form.tipoDescuento === 'porcentaje' && valor > 100) { toast.error('El porcentaje no puede ser mayor a 100'); return; }

    setSaving(true);
    try {
      const payload = {
        ValorDescuento: valor,
        MontoMinimo: form.montoMinimo ? Number(form.montoMinimo) : null,
        UsosMaximos: form.usosMaximos ? Number(form.usosMaximos) : null,
        FechaExpiracion: form.fechaExpiracion ? new Date(form.fechaExpiracion).toISOString() : null,
      };
      if (isEditing && selected) {
        await putJson(`/api/cupones/${selected.cuponID}`, payload);
        toast.success('Cupón actualizado');
      } else {
        await postJson('/api/cupones', {
          Codigo: form.codigo.trim(),
          TipoDescuento: form.tipoDescuento,
          ...payload,
        });
        toast.success('Cupón creado');
      }
      setFormOpen(false);
      cargar();
    } catch (e: any) {
      toast.error(e?.data?.message || 'Error guardando el cupón');
    } finally {
      setSaving(false);
    }
  };

  const toggleActivo = async (c: Cupon) => {
    try {
      await putJson(`/api/cupones/${c.cuponID}`, { Activo: !c.activo });
      toast.success(c.activo ? 'Cupón desactivado' : 'Cupón activado');
      cargar();
    } catch { toast.error('Error actualizando el cupón'); }
  };

  const eliminar = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await deleteJson(`/api/cupones/${selected.cuponID}`);
      toast.success('Cupón eliminado');
      setDeleteOpen(false);
      cargar();
    } catch { toast.error('Error eliminando el cupón'); }
    finally { setSaving(false); }
  };

  return (
    <div className="p-8 bg-[#FBF8F5] dark:bg-[#2a2029] min-h-screen">
      <div className="flex items-center gap-2 mb-4">
        <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-500 dark:text-[#b8a3ac]">Dashboard</span>
        <ChevronRight className="w-4 h-4 text-gray-400 dark:text-[#b8a3ac]" />
        <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-medium text-[#241B22] dark:text-[#F5EDE9]">Cupones</span>
      </div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="admin-page-title text-3xl font-bold text-[#241B22] dark:text-[#F5EDE9]">Cupones</h1>
          <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-gray-500 dark:text-[#b8a3ac] text-sm mt-1">{filtered.length} cupones registrados</p>
        </div>
        {puedeEditar && (
          <button onClick={openCreate} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
            className="px-6 py-3 bg-gradient-to-r from-[#241B22] via-[#7a3350] to-[#A3395C] text-white rounded-lg hover:opacity-90 flex items-center gap-2 transition">
            <Plus className="w-5 h-5" /> Nuevo Cupón
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-[#322631] rounded-xl p-6 border border-[#E7E0DA] dark:border-[#453840] mb-6" style={{ boxShadow: '0 2px 12px rgba(214, 83, 145, 0.07)' }}>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-[#b8a3ac]" />
          <input type="text" placeholder="Buscar por código..." value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
            className="w-full pl-12 pr-4 py-3 bg-[#FBF8F5] dark:bg-[#2a2029] border border-[#E7E0DA] dark:border-[#453840] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A3395C]" />
        </div>
      </div>

      <div className="bg-white dark:bg-[#322631] rounded-xl border border-[#E7E0DA] dark:border-[#453840] overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(214, 83, 145, 0.07)' }}>
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
        ) : (
        <table className="w-full">
          <thead className="bg-[#FBF8F5] dark:bg-[#2a2029] border-b border-[#E7E0DA] dark:border-[#453840]">
            <tr>
              {['CÓDIGO', 'DESCUENTO', 'MÍNIMO', 'USOS', 'EXPIRA', 'ESTADO', ''].map(h => (
                <th key={h} className="px-6 py-4 text-left"><span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-[#b8a3ac]">{h}</span></th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-[#453840]">
            {filtered.map(c => (
              <tr key={c.cuponID} className="hover:bg-[#EFD9DF] dark:hover:bg-[#3a2530] transition">
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1.5 font-mono font-semibold text-[#241B22] dark:text-[#F5EDE9]">
                    <Tag className="w-3.5 h-3.5 text-[#A3395C]" />{c.codigo}
                  </span>
                </td>
                <td className="px-6 py-4" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
                  {c.tipoDescuento === 'porcentaje' ? `${c.valorDescuento}%` : fmt(c.valorDescuento)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-[#b8a3ac]" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
                  {c.montoMinimo ? fmt(c.montoMinimo) : '—'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-[#b8a3ac]" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
                  {c.usosActuales}{c.usosMaximos ? ` / ${c.usosMaximos}` : ''}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-[#b8a3ac]" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
                  {c.fechaExpiracion ? new Date(c.fechaExpiracion).toLocaleDateString('es-CO') : 'Sin límite'}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${c.activo ? 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-[#362b34] text-gray-500 dark:text-[#b8a3ac]'}`}>
                    {c.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    {puedeEditar && (
                      <>
                        <button onClick={() => toggleActivo(c)}
                          className="p-2 text-gray-500 dark:text-[#b8a3ac] hover:bg-[#EFD9DF] dark:hover:bg-[#3a2530] hover:text-[#A3395C] rounded-lg transition" title={c.activo ? 'Desactivar' : 'Activar'}>
                          <Power className="w-5 h-5" />
                        </button>
                        <button onClick={() => openEdit(c)}
                          className="p-2 text-gray-500 dark:text-[#b8a3ac] hover:bg-[#EFD9DF] dark:hover:bg-[#3a2530] hover:text-[#A3395C] rounded-lg transition" title="Editar">
                          <Edit className="w-5 h-5" />
                        </button>
                        <button onClick={() => { setSelected(c); setDeleteOpen(true); }}
                          className="p-2 text-gray-500 dark:text-[#b8a3ac] hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition" title="Eliminar">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-400 dark:text-[#b8a3ac]" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>No hay cupones registrados</td></tr>
            )}
          </tbody>
        </table>
        )}
      </div>

      {/* Modal Crear / Editar */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl h-auto flex flex-col p-0 gap-0">
          <DialogHeader className="px-8 pt-6 pb-4 border-b border-[#E7E0DA] dark:border-[#453840] flex-shrink-0">
            <DialogTitle style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xl font-semibold">
              {isEditing ? 'Editar Cupón' : 'Nuevo Cupón'}
            </DialogTitle>
            <DialogDescription style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
              {isEditing ? 'El código no se puede modificar una vez creado' : 'Completa los datos del código de descuento'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-5 py-6 px-8">
              <div className="flex flex-col gap-2">
                <Label style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-medium text-gray-700 dark:text-[#F5EDE9]">Código <span className="text-red-500">*</span></Label>
                <Input value={form.codigo} disabled={isEditing}
                  onChange={e => setForm(f => ({ ...f, codigo: e.target.value.toUpperCase() }))}
                  placeholder="Ej: BIENVENIDA10" className="h-10 border-gray-300 dark:border-[#453840] font-mono disabled:opacity-60" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-medium text-gray-700 dark:text-[#F5EDE9]">Tipo</Label>
                  <Select value={form.tipoDescuento} disabled={isEditing} onValueChange={(v: 'porcentaje' | 'monto') => setForm(f => ({ ...f, tipoDescuento: v }))}>
                    <SelectTrigger className="h-10 border-gray-300 dark:border-[#453840] disabled:opacity-60"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="porcentaje">Porcentaje (%)</SelectItem>
                      <SelectItem value="monto">Monto fijo ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-medium text-gray-700 dark:text-[#F5EDE9]">
                    Valor <span className="text-red-500">*</span>
                  </Label>
                  <Input type="number" value={form.valorDescuento}
                    onChange={e => setForm(f => ({ ...f, valorDescuento: e.target.value }))}
                    placeholder={form.tipoDescuento === 'porcentaje' ? '10' : '20000'} className="h-10 border-gray-300 dark:border-[#453840]" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-medium text-gray-700 dark:text-[#F5EDE9]">Compra mínima</Label>
                  <Input type="number" value={form.montoMinimo}
                    onChange={e => setForm(f => ({ ...f, montoMinimo: e.target.value }))}
                    placeholder="Opcional" className="h-10 border-gray-300 dark:border-[#453840]" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-medium text-gray-700 dark:text-[#F5EDE9]">Usos máximos</Label>
                  <Input type="number" value={form.usosMaximos}
                    onChange={e => setForm(f => ({ ...f, usosMaximos: e.target.value }))}
                    placeholder="Ilimitado" className="h-10 border-gray-300 dark:border-[#453840]" />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-medium text-gray-700 dark:text-[#F5EDE9]">Fecha de expiración</Label>
                <Input type="date" value={form.fechaExpiracion}
                  onChange={e => setForm(f => ({ ...f, fechaExpiracion: e.target.value }))}
                  className="h-10 border-gray-300 dark:border-[#453840]" />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 px-8 py-5 border-t border-[#E7E0DA] dark:border-[#453840] flex-shrink-0">
            <button onClick={() => setFormOpen(false)} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
              className="px-6 py-2 bg-gray-100 dark:bg-[#362b34] text-gray-700 dark:text-[#F5EDE9] rounded-lg hover:bg-gray-200 dark:hover:bg-[#3a2530] transition">Cancelar</button>
            <button onClick={guardar} disabled={saving} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
              className="px-6 py-2 bg-gradient-to-r from-[#241B22] via-[#7a3350] to-[#A3395C] text-white rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-2 transition">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEditing ? 'Guardar Cambios' : 'Crear Cupón'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Eliminar */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="¿Eliminar cupón?"
        description={<>Vas a eliminar <strong>{selected?.codigo}</strong>. Si ya tiene pedidos asociados, se desactivará en vez de borrarse.</>}
        onConfirm={eliminar}
        loading={saving}
      />
    </div>
  );
};
