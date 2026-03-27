import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, MoreVertical, Edit, Power,
  Trash2, ChevronRight, Eye, Shield, Loader2, RefreshCw
} from 'lucide-react';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../../components/ui/alert-dialog';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { toast } from 'sonner';
import api from '../../../services/api';

interface ApiUser {
  usuarioID: number;
  nombreCompleto: string;
  email: string;
  telefono?: string;
  direccion?: string;
  cargo?: string;
  roleID?: number;
  rolNombre?: string;
  estado: string;
  emailVerificado: boolean;
  fechaRegistro: string;
}

interface ApiRole {
  roleID: number;
  nombre: string;
  descripcion?: string;
  permisos: string[];
}

interface ApiPermiso {
  permissionID: number;
  nombre: string;
  descripcion?: string;
}

const MODULOS_PERMISOS = [
  {
    modulo: "Usuarios", icon: "👥",
    permisos: [
      { nombre: "usuarios:ver", label: "Ver usuarios" },
      { nombre: "usuarios:crear", label: "Crear usuarios" },
      { nombre: "usuarios:editar", label: "Editar usuarios" },
      { nombre: "usuarios:eliminar", label: "Eliminar usuarios" },
      { nombre: "usuarios:bloquear", label: "Bloquear/activar usuarios" },
    ]
  },
  {
    modulo: "Productos", icon: "📦",
    permisos: [
      { nombre: "productos:ver", label: "Ver listado de productos" },
      { nombre: "productos:crear", label: "Crear productos" },
      { nombre: "productos:editar", label: "Editar productos" },
      { nombre: "productos:eliminar", label: "Eliminar productos" },
      { nombre: "productos:descuento", label: "Aplicar descuentos" },
    ]
  },
  {
    modulo: "Roles", icon: "🔐",
    permisos: [
      { nombre: "roles:ver", label: "Ver roles" },
      { nombre: "roles:crear", label: "Crear roles" },
      { nombre: "roles:editar", label: "Editar roles" },
      { nombre: "roles:eliminar", label: "Eliminar roles" },
      { nombre: "roles:permisos", label: "Gestionar permisos" },
    ]
  },
  {
    modulo: "Ventas", icon: "🛒",
    permisos: [
      { nombre: "ventas:ver", label: "Ver listado de ventas" },
      { nombre: "ventas:editar", label: "Editar ventas" },
      { nombre: "ventas:eliminar", label: "Eliminar/anular ventas" },
    ]
  },
  {
    modulo: "Tienda", icon: "🏪",
    permisos: [
      { nombre: "tienda:carrito", label: "Gestionar carrito" },
      { nombre: "tienda:comprar", label: "Realizar compras" },
      { nombre: "tienda:ver", label: "Ver tienda" },
    ]
  },
  {
    modulo: "Reportes", icon: "📊",
    permisos: [
      { nombre: "reportes:ver", label: "Ver reportes" },
      { nombre: "reportes:ventas", label: "Reportes de ventas" },
      { nombre: "reportes:inventario", label: "Reportes de inventario" },
      { nombre: "reportes:clientes", label: "Reportes de clientes" },
      { nombre: "reportes:financiero", label: "Reporte financiero" },
    ]
  },
  {
    modulo: "Notificaciones", icon: "🔔",
    permisos: [
      { nombre: "notif:enviar", label: "Enviar notificaciones" },
    ]
  },
  {
    modulo: "Administración", icon: "⚙️",
    permisos: [
      { nombre: "admin:dashboard", label: "Ver dashboard admin" },
      { nombre: "config:auditoria", label: "Ver auditoría del sistema" },
    ]
  },
];

const getRolColor = (r?: string) => {
  const n = (r || "").toLowerCase();
  if (n.includes("admin")) return "bg-purple-100 text-purple-700";
  if (n.includes("empleado") || n.includes("vendedor")) return "bg-blue-100 text-blue-700";
  return "bg-pink-100 text-pink-700";
};

const getAvatarColor = (r?: string) => {
  const n = (r || "").toLowerCase();
  if (n.includes("admin")) return "from-purple-500 to-purple-600";
  if (n.includes("empleado") || n.includes("vendedor")) return "from-blue-500 to-blue-600";
  return "from-pink-500 to-pink-600";
};

const getInitials = (nombre: string) => {
  const p = nombre.trim().split(" ");
  return (p.length >= 2 ? p[0][0] + p[1][0] : p[0]?.[0] || "?").toUpperCase();
};

const fmtDate = (d: string) => {
  try { return new Date(d).toLocaleDateString("es-CO"); } catch { return d; }
};

export const UsuariosView: React.FC = () => {
  const { hasPermission } = useAuth();
  const puedeCrear = hasPermission('usuarios:crear');
  const puedeEditar = hasPermission('usuarios:editar');
  const puedeEliminar = hasPermission('usuarios:eliminar');
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [roles, setRoles] = useState<ApiRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [dropdownPos, setDropdownPos] = useState<{top: number, right: number} | null>(null);

  const [viewOpen, setViewOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [permisosOpen, setPermisosOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ApiUser | null>(null);
  const [selectedRole, setSelectedRole] = useState<ApiRole | null>(null);

  const [form, setForm] = useState({ nombreCompleto: "", email: "", contrasena: "", cargo: "", telefono: "", direccion: "", roleID: "", estado: "activo" });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [permisosSet, setPermisosSet] = useState<Set<string>>(new Set());
  const [savingPermisos, setSavingPermisos] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      const res = await api.getJson("/api/usuarios");
      const list = (res?.data || res || []).map((u: any) => ({
        usuarioID: u.usuarioID ?? u.UsuarioID,
        nombreCompleto: u.nombreCompleto ?? u.NombreCompleto ?? "",
        email: u.email ?? u.Email ?? "",
        telefono: u.telefono ?? u.Telefono ?? "",
        direccion: u.direccion ?? u.Direccion ?? "",
        cargo: u.cargo ?? u.Cargo ?? u.ciudad ?? u.Ciudad ?? "",
        roleID: u.roleID ?? u.RoleID,
        rolNombre: u.rolNombre ?? u.RolNombre ?? "",
        estado: u.estado ?? u.Estado ?? "activo",
        emailVerificado: u.emailVerificado ?? false,
        fechaRegistro: u.fechaRegistro ?? u.FechaRegistro ?? "",
      }));
      setUsers(list);
    } catch { toast.error("Error cargando usuarios"); }
  }, []);

  const loadRoles = useCallback(async () => {
    try {
      const res = await api.getJson("/api/roles");
      setRoles((res?.data || res || []).map((r: any) => ({
        roleID: r.roleID ?? r.RoleID,
        nombre: r.nombre ?? r.Nombre ?? "",
        descripcion: r.descripcion ?? r.Descripcion ?? "",
        permisos: r.permisos ?? r.Permisos ?? [],
      })));
    } catch {}
  }, []);

  useEffect(() => {
    Promise.all([loadUsers(), loadRoles()]).finally(() => setLoading(false));
  }, [loadUsers, loadRoles]);

  const filtered = users.filter(u => {
    const q = searchQuery.toLowerCase();
    return u.nombreCompleto.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.rolNombre||"").toLowerCase().includes(q);
  });

  const validate = (isEdit = false) => {
    const e: Record<string, string> = {};
    if (!form.nombreCompleto.trim()) e.nombreCompleto = "Nombre requerido";
    if (!form.email.trim()) e.email = "Email requerido";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Email inválido";
    if (!isEdit && !form.contrasena) e.contrasena = "Contraseña requerida";
    if (!isEdit && form.contrasena && form.contrasena.length < 6) e.contrasena = "Mínimo 6 caracteres";
    if (!form.roleID) e.roleID = "Selecciona un rol";
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = () => {
    setForm({ nombreCompleto: "", email: "", contrasena: "", cargo: "", telefono: "", direccion: "", roleID: String(roles.find(r => !r.nombre.toLowerCase().includes("admin"))?.roleID || roles[0]?.roleID || ""), estado: "activo" });
    setFormErrors({});
    setCreateOpen(true);
  };

  const handleEdit = (u: ApiUser) => {
    setSelectedUser(u);
    setForm({ nombreCompleto: u.nombreCompleto, email: u.email, contrasena: "", cargo: u.cargo||"", telefono: u.telefono||"", direccion: u.direccion||"", roleID: String(u.roleID||""), estado: u.estado });
    setFormErrors({});
    setEditOpen(true);
    setActiveDropdown(null);
  };

  const handleDelete = (u: ApiUser) => { setSelectedUser(u); setDeleteOpen(true); setActiveDropdown(null); };

  const handlePermisos = (u: ApiUser) => {
    setSelectedUser(u);
    const rol = roles.find(r => r.roleID === u.roleID) || null;
    setSelectedRole(rol);
    setPermisosSet(new Set(rol?.permisos || []));
    setPermisosOpen(true);
    setActiveDropdown(null);
  };

  const handleToggleStatus = async (u: ApiUser) => {
    try {
      await api.postJson(`/api/usuarios/${u.usuarioID}/bloquear`, {});
      toast.success(`Usuario ${u.estado === "activo" ? "desactivado" : "activado"}`);
      loadUsers();
    } catch { toast.error("Error cambiando estado"); }
    setActiveDropdown(null);
  };

  const saveCreate = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await api.postJson("/api/usuarios", { NombreCompleto: form.nombreCompleto, Email: form.email, Contrasena: form.contrasena, Cargo: form.cargo, Telefono: form.telefono||null, Direccion: form.direccion||null, RoleID: parseInt(form.roleID), Estado: form.estado });
      toast.success(`Usuario creado. Se envió correo a ${form.email}`);
      setCreateOpen(false);
      loadUsers();
    } catch (e: any) { toast.error(e?.data?.message || "Error creando usuario"); }
    finally { setSaving(false); }
  };

  const saveEdit = async () => {
    if (!validate(true) || !selectedUser) return;
    setSaving(true);
    try {
      await api.fetchWithAuth(`/api/usuarios/${selectedUser.usuarioID}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ NombreCompleto: form.nombreCompleto, Telefono: form.telefono||null, Direccion: form.direccion||null, Ciudad: form.cargo, RoleID: parseInt(form.roleID)||undefined, Estado: form.estado }) });
      toast.success("Usuario actualizado");
      setEditOpen(false);
      loadUsers();
    } catch { toast.error("Error actualizando"); }
    finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      await api.fetchWithAuth(`/api/usuarios/${selectedUser.usuarioID}`, { method: "DELETE" });
      toast.success("Usuario eliminado permanentemente");
      setDeleteOpen(false);
      setSelectedUser(null);
      loadUsers();
    } catch { toast.error("Error eliminando usuario"); }
    finally { setSaving(false); }
  };

  const savePermisos = async () => {
    if (!selectedRole) return;
    setSavingPermisos(true);
    try {
      const permRes = await api.getJson("/api/roles/permisos");
      const all: ApiPermiso[] = permRes?.data || permRes || [];
      const ids = all.filter(p => permisosSet.has(p.nombre)).map(p => p.permissionID);
      await api.fetchWithAuth(`/api/roles/${selectedRole.roleID}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ Nombre: selectedRole.nombre, Descripcion: selectedRole.descripcion, PermisoIds: ids }) });
      toast.success("Permisos guardados");
      setPermisosOpen(false);
      loadRoles();
    } catch { toast.error("Error guardando permisos"); }
    finally { setSavingPermisos(false); }
  };

  const togglePermiso = (n: string) => setPermisosSet(prev => { const s = new Set(prev); s.has(n) ? s.delete(n) : s.add(n); return s; });
  const toggleModulo = (perms: {nombre:string}[]) => {
    const all = perms.every(p => permisosSet.has(p.nombre));
    setPermisosSet(prev => { const s = new Set(prev); perms.forEach(p => all ? s.delete(p.nombre) : s.add(p.nombre)); return s; });
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-8 h-8 animate-spin text-[#d65391]" />
      <span className="ml-3 text-gray-600" style={{ fontFamily: "Inter, sans-serif" }}>Cargando usuarios...</span>
    </div>
  );

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex items-center gap-2 mb-4">
        <span style={{ fontFamily: "Inter, sans-serif" }} className="text-sm text-gray-500">Dashboard</span>
        <ChevronRight className="w-4 h-4 text-gray-400" />
        <span style={{ fontFamily: "Inter, sans-serif" }} className="text-sm text-gray-900">Gestión de Usuarios</span>
      </div>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <h1 style={{ fontFamily: "Playfair Display, serif" }} className="text-[36px] text-gray-900">Gestión de Usuarios</h1>
          <span className="px-3 py-1 bg-[#d65391] text-white rounded-full text-sm" style={{ fontFamily: "Inter, sans-serif" }}>{users.length}</span>
        </div>
        <p style={{ fontFamily: "Inter, sans-serif" }} className="text-gray-600">Administra todos los usuarios del sistema</p>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" placeholder="Buscar por nombre, email o rol..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ fontFamily: "Inter, sans-serif" }} className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d65391]" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setLoading(true); loadUsers().finally(() => setLoading(false)); }} className="px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                <RefreshCw className="w-5 h-5" />
              </button>
              {puedeCrear && (
              <button onClick={handleCreate} style={{ fontFamily: "Inter, sans-serif" }} className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2">
                <Plus className="w-5 h-5" /> Nuevo Usuario
              </button>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div>
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {["USUARIO","ROL","CORREO ELECTRÓNICO","ESTADO","FECHA REGISTRO","ACCIONES"].map(h => (
                    <th key={h} className="px-6 py-4 text-left"><span style={{ fontFamily: "Inter, sans-serif" }} className="text-xs uppercase tracking-wider text-gray-600">{h}</span></th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(u => (
                  <tr key={u.usuarioID} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 bg-gradient-to-br ${getAvatarColor(u.rolNombre)} rounded-full flex items-center justify-center flex-shrink-0`}>
                          <span style={{ fontFamily: "Inter, sans-serif" }} className="text-white text-sm font-medium">{getInitials(u.nombreCompleto)}</span>
                        </div>
                        <div>
                          <div style={{ fontFamily: "Inter, sans-serif" }} className="text-gray-900 font-medium">{u.nombreCompleto}</div>
                          <div style={{ fontFamily: "Inter, sans-serif" }} className="text-xs text-gray-500">{u.cargo || "Sin cargo"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span style={{ fontFamily: "Inter, sans-serif" }} className={`px-3 py-1 rounded-full text-xs font-medium ${getRolColor(u.rolNombre)}`}>{(u.rolNombre||"SIN ROL").toUpperCase()}</span>
                    </td>
                    <td className="px-6 py-4"><span style={{ fontFamily: "Inter, sans-serif" }} className="text-sm text-gray-600">{u.email}</span></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${u.estado === "activo" ? "bg-green-500" : "bg-gray-400"}`} />
                        <span style={{ fontFamily: "Inter, sans-serif" }} className={`px-3 py-1 rounded-full text-xs font-medium ${u.estado === "activo" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>{u.estado === "activo" ? "Activo" : "Inactivo"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4"><span style={{ fontFamily: "Inter, sans-serif" }} className="text-sm text-gray-600">{fmtDate(u.fechaRegistro)}</span></td>
                    <td className="px-6 py-4">
                      <div className="relative">
                        <button onClick={(e) => {
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                          const menuHeight = 220;
                          const top = rect.bottom + menuHeight > window.innerHeight
                            ? rect.top - menuHeight
                            : rect.bottom + 4;
                          setDropdownPos({ top, right: window.innerWidth - rect.right });
                          setActiveDropdown(activeDropdown === u.usuarioID ? null : u.usuarioID);
                        }} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                          <MoreVertical className="w-5 h-5 text-gray-600" />
                        </button>
                        {activeDropdown === u.usuarioID && dropdownPos && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setActiveDropdown(null)} />
                            <div className="fixed bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[200px] z-50" style={{ top: dropdownPos.top, right: dropdownPos.right }}>
                              <button onClick={() => { setSelectedUser(u); setViewOpen(true); setActiveDropdown(null); }} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-left">
                                <Eye className="w-4 h-4 text-gray-600" /><span style={{ fontFamily: "Inter, sans-serif" }} className="text-sm text-gray-700">Ver Detalles</span>
                              </button>
                              {puedeEditar && (
                              <button onClick={() => handleEdit(u)} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-left">
                                <Edit className="w-4 h-4 text-gray-600" /><span style={{ fontFamily: "Inter, sans-serif" }} className="text-sm text-gray-700">Editar</span>
                              </button>
                              )}
                              {u.roleID && (
                                <button onClick={() => handlePermisos(u)} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-blue-50 text-left">
                                  <Shield className="w-4 h-4 text-blue-600" /><span style={{ fontFamily: "Inter, sans-serif" }} className="text-sm text-blue-700">Configurar Permisos</span>
                                </button>
                              )}
                              {puedeEditar && (
                              <button onClick={() => handleToggleStatus(u)} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-left">
                                <Power className="w-4 h-4 text-gray-600" /><span style={{ fontFamily: "Inter, sans-serif" }} className="text-sm text-gray-700">{u.estado === "activo" ? "Desactivar" : "Activar"}</span>
                              </button>
                              )}
                              {puedeEliminar && (
                              <>
                              <div className="border-t border-gray-200 my-1" />
                              <button onClick={() => handleDelete(u)} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-red-50 text-left">
                                <Trash2 className="w-4 h-4 text-red-600" /><span style={{ fontFamily: "Inter, sans-serif" }} className="text-sm text-red-600">Eliminar</span>
                              </button>
                              </>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500" style={{ fontFamily: "Inter, sans-serif" }}>No se encontraron usuarios</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-gray-200">
            <span style={{ fontFamily: "Inter, sans-serif" }} className="text-sm text-gray-600">Mostrando <span className="font-medium text-gray-900">{filtered.length}</span> de {users.length} usuarios</span>
          </div>
        </div>
      </div>

      {/* Ver Detalles — estilo Proveedores */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-2xl h-auto flex flex-col p-0 gap-0">
          <DialogHeader className="px-8 pt-6 pb-4 border-b border-gray-200 flex-shrink-0">
            <DialogTitle style={{ fontFamily: "Playfair Display, serif" }} className="text-2xl">
              {selectedUser?.nombreCompleto}
            </DialogTitle>
            <DialogDescription style={{ fontFamily: "Inter, sans-serif" }}>
              {(selectedUser?.rolNombre || "Sin rol").toUpperCase()} — {selectedUser?.cargo || "Sin cargo"}
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-6 py-6 px-8">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <h3 style={{ fontFamily: "Inter, sans-serif" }} className="font-semibold text-gray-800 text-base">👤 Información del Usuario</h3>
                  </div>
                  <div className="p-6 grid grid-cols-2 gap-6">
                    <div className="flex flex-col gap-1">
                      <p style={{ fontFamily: "Inter, sans-serif" }} className="text-xs text-gray-500 font-medium uppercase">Nombre</p>
                      <p style={{ fontFamily: "Inter, sans-serif" }} className="text-sm font-semibold text-gray-900">{selectedUser.nombreCompleto}</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <p style={{ fontFamily: "Inter, sans-serif" }} className="text-xs text-gray-500 font-medium uppercase">Teléfono</p>
                      <p style={{ fontFamily: "Inter, sans-serif" }} className="text-sm font-semibold text-gray-900">{selectedUser.telefono || "—"}</p>
                    </div>
                    <div className="flex flex-col gap-1 col-span-2">
                      <p style={{ fontFamily: "Inter, sans-serif" }} className="text-xs text-gray-500 font-medium uppercase">Correo</p>
                      <p style={{ fontFamily: "Inter, sans-serif" }} className="text-sm font-semibold text-gray-900 break-all">{selectedUser.email}</p>
                    </div>
                    {selectedUser.direccion && (
                      <div className="flex flex-col gap-1 col-span-2">
                        <p style={{ fontFamily: "Inter, sans-serif" }} className="text-xs text-gray-500 font-medium uppercase">Dirección</p>
                        <p style={{ fontFamily: "Inter, sans-serif" }} className="text-sm font-semibold text-gray-900">{selectedUser.direccion}</p>
                      </div>
                    )}
                    <div className="flex flex-col gap-1">
                      <p style={{ fontFamily: "Inter, sans-serif" }} className="text-xs text-gray-500 font-medium uppercase">Estado</p>
                      <span className={`inline-flex w-fit px-3 py-1 rounded-full text-xs font-semibold ${selectedUser.estado === "activo" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                        {selectedUser.estado === "activo" ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <p style={{ fontFamily: "Inter, sans-serif" }} className="text-xs text-gray-500 font-medium uppercase">Fecha Registro</p>
                      <p style={{ fontFamily: "Inter, sans-serif" }} className="text-sm font-semibold text-gray-900">{fmtDate(selectedUser.fechaRegistro)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 px-8 py-5 border-t border-gray-200 flex-shrink-0">
            <button onClick={() => setViewOpen(false)} className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors" style={{ fontFamily: "Inter, sans-serif" }}>Cerrar</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Crear / Editar */}
      <Dialog open={createOpen || editOpen} onOpenChange={o => { if (!o) { setCreateOpen(false); setEditOpen(false); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "Playfair Display, serif" }} className="text-2xl">{editOpen ? "Editar Usuario" : "Nuevo Usuario"}</DialogTitle>
            <DialogDescription style={{ fontFamily: "Inter, sans-serif" }}>{editOpen ? "Modifica la información del usuario" : "Completa los datos para registrar un nuevo usuario"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-gray-700 mb-1 block">Nombre Completo *</Label>
                <Input value={form.nombreCompleto} onChange={e => setForm({...form, nombreCompleto: e.target.value})} placeholder="Juan Pérez" />
                {formErrors.nombreCompleto && <p className="text-red-500 text-xs mt-1">{formErrors.nombreCompleto}</p>}
              </div>
              <div>
                <Label className="text-sm text-gray-700 mb-1 block">Cargo</Label>
                <Input value={form.cargo} onChange={e => setForm({...form, cargo: e.target.value})} placeholder="Vendedor" />
              </div>
            </div>
            <div>
              <Label className="text-sm text-gray-700 mb-1 block">Correo Electrónico *</Label>
              <Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="correo@ejemplo.com" disabled={editOpen} className={editOpen ? "bg-gray-50 text-gray-500" : ""} />
              {editOpen && <p className="text-xs text-gray-400 mt-1">El correo no se puede cambiar</p>}
              {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
            </div>
            {!editOpen && (
              <div>
                <Label className="text-sm text-gray-700 mb-1 block">Contraseña *</Label>
                <Input type="password" value={form.contrasena} onChange={e => setForm({...form, contrasena: e.target.value})} placeholder="Mínimo 6 caracteres" />
                {formErrors.contrasena && <p className="text-red-500 text-xs mt-1">{formErrors.contrasena}</p>}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-gray-700 mb-1 block">Rol *</Label>
                <select value={form.roleID} onChange={e => setForm({...form, roleID: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d65391] text-sm" style={{ fontFamily: "Inter, sans-serif" }}>
                  <option value="">Selecciona un rol</option>
                  {roles.map(r => <option key={r.roleID} value={r.roleID}>{r.nombre}</option>)}
                </select>
                {formErrors.roleID && <p className="text-red-500 text-xs mt-1">{formErrors.roleID}</p>}
              </div>
              <div>
                <Label className="text-sm text-gray-700 mb-1 block">Estado</Label>
                <select value={form.estado} onChange={e => setForm({...form, estado: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d65391] text-sm" style={{ fontFamily: "Inter, sans-serif" }}>
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </div>
            </div>
            <div>
              <Label className="text-sm text-gray-700 mb-1 block">Teléfono</Label>
              <Input type="tel" value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value.replace(/\D/g,"")})} placeholder="3001234567" />
            </div>
            <div>
              <Label className="text-sm text-gray-700 mb-1 block">Dirección</Label>
              <textarea value={form.direccion} onChange={e => setForm({...form, direccion: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d65391] text-sm min-h-[70px] resize-none" style={{ fontFamily: "Inter, sans-serif" }} placeholder="Calle 123 #45-67, Ciudad" />
            </div>
          </div>
          <DialogFooter className="gap-2 pt-2">
            <button onClick={() => { setCreateOpen(false); setEditOpen(false); }} className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200" style={{ fontFamily: "Inter, sans-serif" }}>Cancelar</button>
            <button onClick={editOpen ? saveEdit : saveCreate} disabled={saving} className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2" style={{ fontFamily: "Inter, sans-serif" }}>
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editOpen ? "Guardar Cambios" : "Crear Usuario"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Eliminar */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ fontFamily: "Playfair Display, serif" }}>¿Eliminar usuario?</AlertDialogTitle>
            <AlertDialogDescription style={{ fontFamily: "Inter, sans-serif" }}>
              Vas a eliminar permanentemente a <strong>{selectedUser?.nombreCompleto}</strong> ({selectedUser?.email}). Esta acción <strong>no se puede deshacer</strong> y el usuario será removido de la base de datos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel style={{ fontFamily: "Inter, sans-serif" }}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={saving} className="bg-red-600 hover:bg-red-700 flex items-center gap-2" style={{ fontFamily: "Inter, sans-serif" }}>
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Eliminar permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Permisos */}
      <Dialog open={permisosOpen} onOpenChange={setPermisosOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "Playfair Display, serif" }} className="text-xl">
              Configurar Permisos — {selectedRole?.nombre?.toUpperCase()}
            </DialogTitle>
            <DialogDescription style={{ fontFamily: "Inter, sans-serif" }}>
              Selecciona los permisos que tendrá el rol de {selectedUser?.nombreCompleto}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {MODULOS_PERMISOS.map(({ modulo, icon, permisos }) => {
              const allSel = permisos.every(p => permisosSet.has(p.nombre));
              const someSel = permisos.some(p => permisosSet.has(p.nombre));
              return (
                <div key={modulo} className="border border-gray-200 rounded-lg overflow-hidden">
                  <button onClick={() => toggleModulo(permisos)} className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${allSel ? "bg-[#d65391] border-[#d65391]" : someSel ? "bg-pink-200 border-[#d65391]" : "border-gray-300"}`}>
                      {(allSel || someSel) && <span className="text-white text-xs font-bold">✓</span>}
                    </div>
                    <span style={{ fontFamily: "Inter, sans-serif" }} className="font-semibold text-gray-800">{icon} Módulo {modulo}</span>
                  </button>
                  <div className="px-4 py-2 space-y-1 bg-white">
                    {permisos.map(p => (
                      <label key={p.nombre} className="flex items-center gap-3 cursor-pointer py-1" onClick={() => togglePermiso(p.nombre)}>
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${permisosSet.has(p.nombre) ? "bg-[#d65391] border-[#d65391]" : "border-gray-300 hover:border-[#d65391]"}`}>
                          {permisosSet.has(p.nombre) && <span className="text-white text-xs font-bold">✓</span>}
                        </div>
                        <span style={{ fontFamily: "Inter, sans-serif" }} className="text-sm text-gray-700">{p.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <DialogFooter className="gap-2 pt-2">
            <button onClick={() => setPermisosOpen(false)} className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200" style={{ fontFamily: "Inter, sans-serif" }}>Cancelar</button>
            <button onClick={savePermisos} disabled={savingPermisos} className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2" style={{ fontFamily: "Inter, sans-serif" }}>
              {savingPermisos && <Loader2 className="w-4 h-4 animate-spin" />} Guardar Permisos
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};