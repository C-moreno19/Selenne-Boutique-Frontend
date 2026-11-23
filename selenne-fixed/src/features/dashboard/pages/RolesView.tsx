import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit, Trash2, Eye, ChevronRight, Loader2, RefreshCw, Shield, Ban, Users, Settings, Package, ShoppingBag, ShoppingCart, UserCog, Briefcase, User, ClipboardList, Bell } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../components/ui/dialog';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { toast } from '@/lib/toast';
import api, { getJson, postJson } from '../../../services/api';
import { useAuth } from '../../../shared/contexts/AuthContext';

interface ApiRole {
  roleID: number;
  nombre: string;
  descripcion?: string;
  estado?: string;
  permisos: string[];
}

interface ApiPermiso {
  permissionID: number;
  nombre: string;
}

interface PermModule {
  id: string;
  name: string;
  icon: React.ReactNode;
  generalPermiso?: string;
  permisos: { id: string; label: string }[];
}

const MODULOS: PermModule[] = [
  {
    id: 'administracion', name: 'Dashboard', icon: <Settings className="w-4 h-4" />,
    generalPermiso: 'admin:dashboard',
    permisos: [
      { id: 'admin:dashboard', label: 'Acceso al panel de administración' },
    ]
  },
  {
    id: 'productos', name: 'Gestión de Productos', icon: <Package className="w-4 h-4" />,
    generalPermiso: 'productos:ver',
    permisos: [
      { id: 'productos:ver', label: 'Ver listado de productos y catálogos' },
      { id: 'productos:crear', label: 'Crear productos' },
      { id: 'productos:editar', label: 'Editar productos' },
      { id: 'productos:eliminar', label: 'Eliminar productos' },
      { id: 'productos:descuento', label: 'Aplicar descuentos' },
    ]
  },
  {
    id: 'pedidos', name: 'Pedidos', icon: <ClipboardList className="w-4 h-4" />,
    generalPermiso: 'pedidos:ver',
    permisos: [
      { id: 'pedidos:ver', label: 'Ver pedidos pendientes' },
      { id: 'pedidos:editar', label: 'Aprobar, rechazar y cambiar estado de pedidos' },
    ]
  },
  {
    id: 'ventas', name: 'Ventas', icon: <ShoppingCart className="w-4 h-4" />,
    generalPermiso: 'ventas:ver',
    permisos: [
      { id: 'ventas:ver', label: 'Ver ventas e historial' },
      { id: 'ventas:crear', label: 'Registrar ventas manuales' },
      { id: 'ventas:editar', label: 'Editar ventas registradas' },
      { id: 'ventas:eliminar', label: 'Eliminar ventas del historial' },
    ]
  },
  {
    id: 'clientes', name: 'Clientes', icon: <Users className="w-4 h-4" />,
    generalPermiso: 'clientes:ver',
    permisos: [
      { id: 'clientes:ver', label: 'Ver listado de clientes' },
      { id: 'clientes:historial', label: 'Ver historial de pedidos del cliente' },
    ]
  },
  {
    id: 'compras', name: 'Compras y Proveedores', icon: <ShoppingBag className="w-4 h-4" />,
    generalPermiso: 'compras:ver',
    permisos: [
      { id: 'compras:ver', label: 'Ver compras, proveedores e historial' },
      { id: 'compras:crear', label: 'Registrar nuevas compras' },
      { id: 'compras:editar', label: 'Editar compras y cambiar estado' },
      { id: 'compras:eliminar', label: 'Eliminar compras del historial' },
    ]
  },
  {
    id: 'usuarios', name: 'Usuarios', icon: <UserCog className="w-4 h-4" />,
    generalPermiso: 'usuarios:ver',
    permisos: [
      { id: 'usuarios:ver', label: 'Ver usuarios' },
      { id: 'usuarios:crear', label: 'Crear usuarios' },
      { id: 'usuarios:editar', label: 'Editar usuarios' },
      { id: 'usuarios:eliminar', label: 'Eliminar usuarios' },
      { id: 'usuarios:bloquear', label: 'Bloquear / activar usuarios' },
      { id: 'usuarios:resetear_pass', label: 'Restablecer contraseñas' },
    ]
  },
  {
    id: 'roles', name: 'Roles y Permisos', icon: <Shield className="w-4 h-4" />,
    generalPermiso: 'roles:ver',
    permisos: [
      { id: 'roles:ver', label: 'Ver roles' },
      { id: 'roles:crear', label: 'Crear roles' },
      { id: 'roles:editar', label: 'Editar roles' },
      { id: 'roles:eliminar', label: 'Eliminar roles' },
      { id: 'roles:permisos', label: 'Gestionar permisos de un rol' },
      { id: 'roles:asignar', label: 'Asignar roles a usuarios' },
    ]
  },
  {
    id: 'notificaciones', name: 'Notificaciones', icon: <Bell className="w-4 h-4" />,
    generalPermiso: 'notif:ver',
    permisos: [
      { id: 'notif:ver', label: 'Ver notificaciones' },
    ]
  },
];

const PREEXISTENTES = ['admin', 'cliente', 'client'];
const isPreexistente = (nombre: string) => PREEXISTENTES.some(p => nombre.toLowerCase().includes(p));

const getRolIcon = (nombre: string): React.ReactNode => {
  const n = nombre.toLowerCase();
  if (n.includes('admin')) return <Shield className="w-5 h-5 text-gray-500 dark:text-[#b9aedd]" />;
  if (n.includes('empleado') || n.includes('vendedor')) return <Briefcase className="w-5 h-5 text-gray-500 dark:text-[#b9aedd]" />;
  return <User className="w-5 h-5 text-gray-500 dark:text-[#b9aedd]" />;
};

interface PermisosEditorProps {
  arr: string[];
  onToggle: (id: string) => void;
  onToggleModulo: (perms: { id: string }[], generalPermiso?: string) => void;
}

const PermisosEditor: React.FC<PermisosEditorProps> = ({ arr, onToggle, onToggleModulo }) => (
  <div className="space-y-4">
    {MODULOS.map(({ id, name, icon, permisos, generalPermiso }) => {
      const allSel = permisos.every(p => arr.includes(p.id));
      const someSel = permisos.some(p => arr.includes(p.id));
      return (
        <div key={id} className="bg-white dark:bg-[#1e1530] rounded-xl border border-[#E7E0DA] dark:border-[#3A2E4D] shadow-sm overflow-hidden">
          {/* Header del módulo */}
          <div className="bg-[#F7F5FC] dark:bg-[#17101f] px-5 py-3 border-b border-[#E7E0DA] dark:border-[#3A2E4D]">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={allSel}
                ref={el => { if (el) el.indeterminate = someSel && !allSel; }}
                onChange={() => onToggleModulo(permisos, generalPermiso)}
                id={`mod-${id}`}
                className="w-4 h-4 cursor-pointer accent-[#5C2A52]"
              />
              <label htmlFor={`mod-${id}`} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                className="text-sm font-semibold text-[#0A0A0A] dark:text-[#F5F3FA] cursor-pointer flex items-center gap-2">
                <span className="text-gray-400 dark:text-[#b9aedd]">{icon}</span>
                {name}
              </label>
              {allSel && (
                <span className="ml-auto text-xs bg-gray-800 dark:bg-[#241935] text-white px-2 py-0.5 rounded" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
                  Acceso completo
                </span>
              )}
            </div>
          </div>
          {/* Subpermisos */}
          <div className="px-5 py-3 space-y-2">
            {permisos.map(p => (
              <div key={p.id} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={arr.includes(p.id)}
                  onChange={() => onToggle(p.id)}
                  id={`perm-${p.id}`}
                  className="w-4 h-4 cursor-pointer accent-[#5C2A52]"
                />
                <label htmlFor={`perm-${p.id}`} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                  className="text-sm text-gray-700 dark:text-[#F5F3FA] cursor-pointer flex-1">
                  {p.label}
                </label>
                <span className="text-xs text-gray-300 dark:text-[#5a4d52] font-mono">{p.id}</span>
              </div>
            ))}
          </div>
        </div>
      );
    })}
  </div>
);

export const RolesView: React.FC = () => {
  const { hasPermission, refreshPermisos } = useAuth();
  const puedeCrear = hasPermission('roles:crear');
  const puedeEditar = hasPermission('roles:editar');
  const puedeEliminar = hasPermission('roles:eliminar');
  const puedePermisos = hasPermission('roles:permisos');
  const [roles, setRoles] = useState<ApiRole[]>([]);
  const [allPermisos, setAllPermisos] = useState<ApiPermiso[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<ApiRole | null>(null);

  const [viewOpen, setViewOpen] = useState(false);
  const [permisosOpen, setPermisosOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [permisosArr, setPermisosArr] = useState<string[]>([]);
  const [createPermisosArr, setCreatePermisosArr] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nombre: '', descripcion: '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const loadRoles = useCallback(async () => {
    try {
      const res = await getJson('/api/roles');
      setRoles((res?.data || res || []).map((r: any) => ({
        roleID: r.roleID ?? r.RoleID,
        nombre: r.nombre ?? r.Nombre ?? '',
        descripcion: r.descripcion ?? r.Descripcion ?? '',
        estado: r.estado ?? r.Estado ?? 'activo',
        permisos: r.permisos ?? r.Permisos ?? [],
      })));
    } catch { toast.error('Error cargando roles'); }
  }, []);

  const loadPermisos = useCallback(async () => {
    try {
      const res = await getJson('/api/roles/permisos');
      setAllPermisos((res?.data || res || []).map((p: any) => ({
        permissionID: p.permissionID ?? p.PermissionID,
        nombre: p.nombre ?? p.Nombre ?? '',
      })));
    } catch {}
  }, []);

  useEffect(() => {
    Promise.all([loadRoles(), loadPermisos()]).finally(() => setLoading(false));
  }, [loadRoles, loadPermisos]);

  const filtered = roles.filter(r => {
    const q = searchQuery.toLowerCase();
    return r.nombre.toLowerCase().includes(q) || (r.descripcion || '').toLowerCase().includes(q);
  });

  const getPermissionIDs = (nombres: string[]) =>
    allPermisos.filter(p => nombres.includes(p.nombre)).map(p => p.permissionID);

  const handleToggle = (id: string) =>
    setPermisosArr(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleToggleCreate = (id: string) =>
    setCreatePermisosArr(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleToggleModulo = (perms: { id: string }[], arr: string[], setArr: (v: string[]) => void = () => {}) => {
    const all = perms.every(p => arr.includes(p.id));
    setArr(all ? arr.filter(x => !perms.find(p => p.id === x)) : [...new Set([...arr, ...perms.map(p => p.id)])]);
  };

  const handleEditarPermisos = (role: ApiRole) => {
    setSelectedRole(role);
    setPermisosArr([...role.permisos]);
    setPermisosOpen(true);
  };

  const handleEdit = (role: ApiRole) => {
    setSelectedRole(role);
    setForm({ nombre: role.nombre, descripcion: role.descripcion || '' });
    setFormErrors({});
    setEditOpen(true);
  };

  const handleCreate = () => {
    setForm({ nombre: '', descripcion: '' });
    setFormErrors({});
    setCreatePermisosArr([]);
    setCreateOpen(true);
  };

  const savePermisos = async () => {
    if (!selectedRole) return;
    setSaving(true);
    try {
      const ids = getPermissionIDs(permisosArr);
      await api.fetchWithAuth(`/api/roles/${selectedRole.roleID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Nombre: selectedRole.nombre, Descripcion: selectedRole.descripcion, PermisoIds: ids }),
      });
      toast.success('Permisos guardados correctamente');
      setPermisosOpen(false);
      await loadRoles();
      await refreshPermisos();
    } catch { toast.error('Error guardando permisos'); }
    finally { setSaving(false); }
  };

  const saveEdit = async () => {
    if (!form.nombre.trim()) { setFormErrors({ nombre: 'Nombre requerido' }); return; }
    setSaving(true);
    try {
      const ids = getPermissionIDs(selectedRole?.permisos || []);
      await api.fetchWithAuth(`/api/roles/${selectedRole!.roleID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Nombre: form.nombre, Descripcion: form.descripcion, PermisoIds: ids }),
      });
      toast.success('Rol actualizado');
      setEditOpen(false);
      loadRoles();
    } catch { toast.error('Error actualizando rol'); }
    finally { setSaving(false); }
  };

  const saveCreate = async () => {
    if (!form.nombre.trim()) { setFormErrors({ nombre: 'Nombre requerido' }); return; }
    setSaving(true);
    try {
      const ids = getPermissionIDs(createPermisosArr);
      await postJson('/api/roles', { Nombre: form.nombre, Descripcion: form.descripcion, PermisoIds: ids });
      toast.success('Rol creado');
      setCreateOpen(false);
      loadRoles();
    } catch (e: any) { toast.error(e?.data?.message || 'Error creando rol'); }
    finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    if (!selectedRole) return;
    setSaving(true);
    try {
      await api.fetchWithAuth(`/api/roles/${selectedRole.roleID}`, { method: 'DELETE' });
      toast.success('Rol eliminado');
      setDeleteOpen(false);
      loadRoles();
    } catch { toast.error('No se puede eliminar este rol'); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-8 h-8 animate-spin text-[#5C2A52]" />
      <span className="ml-3 text-gray-600 dark:text-[#b9aedd]" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>Cargando roles...</span>
    </div>
  );

  return (
    <div className="p-8 bg-[#F7F5FC] dark:bg-[#17101f] min-h-screen">
      <div className="flex items-center gap-2 mb-4">
        <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-500 dark:text-[#b9aedd]">Dashboard</span>
        <ChevronRight className="w-4 h-4 text-gray-400 dark:text-[#b9aedd]" />
        <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-500 dark:text-[#b9aedd]">Configuración</span>
        <ChevronRight className="w-4 h-4 text-gray-400 dark:text-[#b9aedd]" />
        <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-medium text-[#0A0A0A] dark:text-[#F5F3FA]">Gestión de Roles</span>
      </div>

      <h1 className="admin-page-title text-3xl font-bold text-[#0A0A0A] dark:text-[#F5F3FA] mb-6">Gestión de Roles</h1>

      <div className="space-y-6">
        <div className="bg-white dark:bg-[#1e1530] rounded-xl p-6 shadow-sm border border-[#E7E0DA] dark:border-[#3A2E4D] flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-[#b9aedd]" />
            <input type="text" placeholder="Buscar por nombre o descripción..." value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
              className="w-full pl-12 pr-4 py-3 bg-[#F7F5FC] dark:bg-[#17101f] border border-[#E7E0DA] dark:border-[#3A2E4D] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5C2A52]" />
          </div>
          <div className="flex gap-3">
            <button onClick={() => { setLoading(true); Promise.all([loadRoles(), loadPermisos()]).finally(() => setLoading(false)); }}
              className="px-4 py-3 bg-white dark:bg-[#1e1530] border border-[#E7E0DA] dark:border-[#3A2E4D] text-gray-700 dark:text-[#F5F3FA] rounded-lg hover:bg-[#F7F5FC] dark:hover:bg-[#221830] transition">
              <RefreshCw className="w-5 h-5" />
            </button>
            {puedeCrear && (
              <button onClick={handleCreate} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                className="px-6 py-3 bg-gradient-to-r from-[#0A0A0A] via-[#3B0A45] to-[#5C2A52] text-white rounded-lg hover:opacity-90 flex items-center gap-2 transition">
                <Plus className="w-5 h-5" /> Nuevo Rol
              </button>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-[#1e1530] rounded-xl shadow-sm border border-[#E7E0DA] dark:border-[#3A2E4D] overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#F7F5FC] dark:bg-[#17101f] border-b border-[#E7E0DA] dark:border-[#3A2E4D]">
              <tr>
                {['NOMBRE DEL ROL', 'DESCRIPCIÓN', 'PERMISOS', 'ESTADO', 'ACCIONES'].map(h => (
                  <th key={h} className="px-6 py-4 text-left">
                    <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-[#b9aedd]">{h}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#3A2E4D]">
              {filtered.map(role => (
                <tr key={role.roleID} className="hover:bg-[#F7F5FC] dark:hover:bg-[#221830] transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500 dark:text-[#b9aedd]">{getRolIcon(role.nombre)}</span>
                      <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="font-bold text-[#0A0A0A] dark:text-[#F5F3FA]">{role.nombre.toUpperCase()}</span>
                      {isPreexistente(role.nombre) && (
                        <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="px-2 py-0.5 bg-gray-100 dark:bg-[#221830] text-gray-500 dark:text-[#b9aedd] rounded-full text-xs">Preexistente</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-600 dark:text-[#b9aedd]">{role.descripcion || '—'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400 dark:text-[#b9aedd]" />
                      <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-semibold text-[#0A0A0A] dark:text-[#F5F3FA]">{role.permisos.length}</span>
                      <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-400 dark:text-[#b9aedd]">permisos</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 rounded-full text-sm" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                      activo
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setSelectedRole(role); setViewOpen(true); }}
                        className="p-2 text-gray-500 dark:text-[#b9aedd] hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition" title="Ver detalles">
                        <Eye className="w-5 h-5" />
                      </button>
                      {puedePermisos && (
                        <button onClick={() => handleEditarPermisos(role)}
                          className="p-2 text-gray-500 dark:text-[#b9aedd] hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-600 dark:hover:text-purple-400 rounded-lg transition" title="Configurar permisos">
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>
                        </button>
                      )}
                      {puedeEditar && (
                        <button onClick={() => handleEdit(role)}
                          className="p-2 text-gray-500 dark:text-[#b9aedd] hover:bg-yellow-50 dark:hover:bg-yellow-950/40 hover:text-yellow-600 dark:hover:text-yellow-400 rounded-lg transition" title="Editar rol">
                          <Edit className="w-5 h-5" />
                        </button>
                      )}
                      {puedeEliminar && (isPreexistente(role.nombre) ? (
                        <button disabled className="p-2 text-gray-300 dark:text-[#3A2E4D] cursor-not-allowed rounded-lg" title="No eliminable">
                          <Ban className="w-5 h-5" />
                        </button>
                      ) : (
                        <button onClick={() => { setSelectedRole(role); setDeleteOpen(true); }}
                          className="p-2 text-gray-500 dark:text-[#b9aedd] hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition" title="Eliminar rol">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400 dark:text-[#b9aedd]" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>No se encontraron roles</td></tr>
              )}
            </tbody>
          </table>
          <div className="px-6 py-4 border-t border-[#E7E0DA] dark:border-[#3A2E4D]">
            <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-500 dark:text-[#b9aedd]">Mostrando <span className="font-medium text-[#0A0A0A] dark:text-[#F5F3FA]">{filtered.length}</span> de <span className="font-medium text-[#0A0A0A] dark:text-[#F5F3FA]">{roles.length}</span> roles</span>
          </div>
        </div>
      </div>

      {/* ═══ VER DETALLES ═══ */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-2xl h-auto flex flex-col p-0 gap-0">
          <div className="px-8 pt-6 pb-5 flex-shrink-0" style={{ background: 'linear-gradient(90deg, #0A0A0A 0%, #3B0A45 55%, #5C2A52 100%)' }}>
            <p className="text-[10px] font-bold uppercase tracking-[3px] text-[#C9A8C3] mb-1">District Store</p>
            <DialogTitle style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xl font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 opacity-80" />
              {selectedRole?.nombre?.toUpperCase()}
            </DialogTitle>
            <DialogDescription style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-[#C9A8C3] text-sm mt-0.5">
              {selectedRole?.descripcion || 'Sin descripción'}
            </DialogDescription>
          </div>
          {selectedRole && (
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-6 py-6 px-8">
                <div className="bg-white dark:bg-[#1e1530] rounded-xl border border-[#E7E0DA] dark:border-[#3A2E4D] shadow-sm overflow-hidden">
                  <div className="bg-[#F7F5FC] dark:bg-[#17101f] px-6 py-4 border-b border-[#E7E0DA] dark:border-[#3A2E4D]">
                    <h3 style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="font-semibold text-[#0A0A0A] dark:text-[#F5F3FA] text-base flex items-center gap-2"><Shield className="w-4 h-4 text-gray-400 dark:text-[#b9aedd]" />Permisos asignados ({selectedRole.permisos.length})</h3>
                  </div>
                  <div className="p-6">
                    {selectedRole.permisos.length === 0 ? (
                      <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-400 dark:text-[#b9aedd]">Sin permisos asignados</p>
                    ) : (
                      <div className="space-y-4">
                        {MODULOS.filter(m => m.permisos.some(p => selectedRole.permisos.includes(p.id))).map(m => (
                          <div key={m.id}>
                            <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs font-semibold text-gray-500 dark:text-[#b9aedd] uppercase mb-2 flex items-center gap-1"><span className="text-gray-400 dark:text-[#b9aedd]">{m.icon}</span>{m.name}</p>
                            <div className="flex flex-wrap gap-2">
                              {m.permisos.filter(p => selectedRole.permisos.includes(p.id)).map(p => (
                                <span key={p.id} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                                  className="px-2 py-1 bg-gray-100 dark:bg-[#221830] text-gray-700 dark:text-[#F5F3FA] rounded text-xs font-medium">
                                  {p.label}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 px-8 py-5 border-t border-[#E7E0DA] dark:border-[#3A2E4D] flex-shrink-0">
            <button onClick={() => setViewOpen(false)} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
              className="px-6 py-2 bg-gray-100 dark:bg-[#221830] text-gray-700 dark:text-[#F5F3FA] rounded-lg hover:bg-gray-200 dark:hover:bg-[#241935] transition">Cerrar</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ CONFIGURAR PERMISOS ═══ */}
      <Dialog open={permisosOpen} onOpenChange={setPermisosOpen}>
        <DialogContent className="max-w-2xl h-auto flex flex-col p-0 gap-0">
          <DialogHeader className="px-8 pt-6 pb-4 border-b border-[#E7E0DA] dark:border-[#3A2E4D] flex-shrink-0">
            <DialogTitle style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-2xl">
              Configurar Permisos
            </DialogTitle>
            <DialogDescription style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
              Rol: <strong>{selectedRole?.nombre?.toUpperCase()}</strong> — Selecciona el módulo completo o permisos individuales
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-4 py-6 px-8">
              <PermisosEditor
                arr={permisosArr}
                onToggle={handleToggle}
                onToggleModulo={(perms) => {
                  const all = perms.every(p => permisosArr.includes(p.id));
                  setPermisosArr(all ? permisosArr.filter(x => !perms.find(p => p.id === x)) : [...new Set([...permisosArr, ...perms.map(p => p.id)])]);
                }}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 px-8 py-5 border-t border-[#E7E0DA] dark:border-[#3A2E4D] flex-shrink-0">
            <button onClick={() => setPermisosOpen(false)} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
              className="px-6 py-2 bg-gray-100 dark:bg-[#221830] text-gray-700 dark:text-[#F5F3FA] rounded-lg hover:bg-gray-200 dark:hover:bg-[#241935] transition">Cancelar</button>
            <button onClick={savePermisos} disabled={saving} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
              className="px-6 py-2 bg-gradient-to-r from-[#0A0A0A] via-[#3B0A45] to-[#5C2A52] text-white rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-2 transition">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Guardar Permisos
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ EDITAR ROL ═══ */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl h-auto flex flex-col p-0 gap-0">
          <DialogHeader className="px-8 pt-6 pb-4 border-b border-[#E7E0DA] dark:border-[#3A2E4D] flex-shrink-0">
            <DialogTitle style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-2xl">Editar Rol</DialogTitle>
            <DialogDescription style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>Modifica el nombre y descripción del rol</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-6 py-6 px-8">
              <div className="bg-white dark:bg-[#1e1530] rounded-xl border border-[#E7E0DA] dark:border-[#3A2E4D] shadow-sm overflow-hidden">
                <div className="bg-[#F7F5FC] dark:bg-[#17101f] px-6 py-4 border-b border-[#E7E0DA] dark:border-[#3A2E4D]">
                  <h3 style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="font-semibold text-[#0A0A0A] dark:text-[#F5F3FA] text-base flex items-center gap-2"><ClipboardList className="w-4 h-4 text-gray-400 dark:text-[#b9aedd]" />Información del Rol</h3>
                </div>
                <div className="p-6 flex flex-col gap-5">
                  <div className="flex flex-col gap-2">
                    <Label style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-medium text-gray-700 dark:text-[#F5F3FA]">Nombre del Rol <span className="text-red-500">*</span></Label>
                    <Input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Vendedor" className="h-10 border-gray-300 dark:border-[#3A2E4D]" />
                    {formErrors.nombre && <p className="text-red-500 text-xs">{formErrors.nombre}</p>}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-medium text-gray-700 dark:text-[#F5F3FA]">Descripción</Label>
                    <textarea value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-[#3A2E4D] dark:bg-[#17101f] dark:text-[#F5F3FA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5C2A52] text-sm min-h-[80px] resize-none"
                      style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} placeholder="Descripción del rol..." />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 px-8 py-5 border-t border-[#E7E0DA] dark:border-[#3A2E4D] flex-shrink-0">
            <button onClick={() => setEditOpen(false)} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
              className="px-6 py-2 bg-gray-100 dark:bg-[#221830] text-gray-700 dark:text-[#F5F3FA] rounded-lg hover:bg-gray-200 dark:hover:bg-[#241935] transition">Cancelar</button>
            <button onClick={saveEdit} disabled={saving} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
              className="px-6 py-2 bg-gradient-to-r from-[#0A0A0A] via-[#3B0A45] to-[#5C2A52] text-white rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-2 transition">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Guardar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ CREAR ROL ═══ */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl h-auto flex flex-col p-0 gap-0">
          <DialogHeader className="px-8 pt-6 pb-4 border-b border-[#E7E0DA] dark:border-[#3A2E4D] flex-shrink-0">
            <DialogTitle style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-2xl">Nuevo Rol</DialogTitle>
            <DialogDescription style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>Crea un nuevo rol y asigna sus permisos</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-6 py-6 px-8">
              <div className="bg-white dark:bg-[#1e1530] rounded-xl border border-[#E7E0DA] dark:border-[#3A2E4D] shadow-sm overflow-hidden">
                <div className="bg-[#F7F5FC] dark:bg-[#17101f] px-6 py-4 border-b border-[#E7E0DA] dark:border-[#3A2E4D]">
                  <h3 style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="font-semibold text-[#0A0A0A] dark:text-[#F5F3FA] text-base flex items-center gap-2"><ClipboardList className="w-4 h-4 text-gray-400 dark:text-[#b9aedd]" />Información del Rol</h3>
                </div>
                <div className="p-6 flex flex-col gap-5">
                  <div className="flex flex-col gap-2">
                    <Label style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-medium text-gray-700 dark:text-[#F5F3FA]">Nombre del Rol <span className="text-red-500">*</span></Label>
                    <Input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Vendedor" className="h-10 border-gray-300 dark:border-[#3A2E4D]" />
                    {formErrors.nombre && <p className="text-red-500 text-xs">{formErrors.nombre}</p>}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-medium text-gray-700 dark:text-[#F5F3FA]">Descripción</Label>
                    <textarea value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-[#3A2E4D] dark:bg-[#17101f] dark:text-[#F5F3FA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5C2A52] text-sm min-h-[80px] resize-none"
                      style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} placeholder="Descripción del rol..." />
                  </div>
                </div>
              </div>
              <div>
                <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-semibold text-gray-700 dark:text-[#F5F3FA] mb-4 flex items-center gap-2"><Shield className="w-4 h-4 text-gray-400 dark:text-[#b9aedd]" />Asignar Permisos</p>
                <PermisosEditor
                  arr={createPermisosArr}
                  onToggle={handleToggleCreate}
                  onToggleModulo={(perms) => {
                    const all = perms.every(p => createPermisosArr.includes(p.id));
                    setCreatePermisosArr(all ? createPermisosArr.filter(x => !perms.find(p => p.id === x)) : [...new Set([...createPermisosArr, ...perms.map(p => p.id)])]);
                  }}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 px-8 py-5 border-t border-[#E7E0DA] dark:border-[#3A2E4D] flex-shrink-0">
            <button onClick={() => setCreateOpen(false)} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
              className="px-6 py-2 bg-gray-100 dark:bg-[#221830] text-gray-700 dark:text-[#F5F3FA] rounded-lg hover:bg-gray-200 dark:hover:bg-[#241935] transition">Cancelar</button>
            <button onClick={saveCreate} disabled={saving} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
              className="px-6 py-2 bg-gradient-to-r from-[#0A0A0A] via-[#3B0A45] to-[#5C2A52] text-white rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-2 transition">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Crear Rol
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ ELIMINAR ═══ */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="¿Eliminar rol?"
        description={<>Vas a eliminar el rol <strong>{selectedRole?.nombre}</strong>. Esta acción no se puede deshacer.</>}
        onConfirm={confirmDelete}
        loading={saving}
      />
    </div>
  );
};