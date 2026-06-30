import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, MoreVertical, Edit, Power,
  Trash2, ChevronRight, Eye, Shield, Loader2, RefreshCw, FileSpreadsheet, FileText, User
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../../components/ui/alert-dialog';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { toast } from '@/lib/toast';
import api from '../../../services/api';
import { usePedidosAdmin } from '../../../shared/contexts/PedidosAdminContext';

interface ApiUser {
  usuarioID: number;
  nombreCompleto: string;
  email: string;
  telefono?: string;
  documento?: string;
  direccion?: string;
  ciudad?: string;
  roleID?: number;
  rolNombre?: string;
  estado: string;
  emailVerificado: boolean;
  fechaRegistro: string;
  fotoPerfil?: string;
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
    modulo: "Dashboard", icon: "🏠",
    permisos: [
      { nombre: "admin:dashboard", label: "Acceso al panel de administración" },
    ]
  },
  {
    modulo: "Productos", icon: "📦",
    permisos: [
      { nombre: "productos:ver", label: "Ver listado de productos y catálogos" },
      { nombre: "productos:crear", label: "Crear productos" },
      { nombre: "productos:editar", label: "Editar productos" },
      { nombre: "productos:eliminar", label: "Eliminar productos" },
      { nombre: "productos:descuento", label: "Aplicar descuentos" },
    ]
  },
  {
    modulo: "Pedidos", icon: "📋",
    permisos: [
      { nombre: "pedidos:ver", label: "Ver pedidos pendientes" },
      { nombre: "pedidos:editar", label: "Aprobar, rechazar y cambiar estado de pedidos" },
    ]
  },
  {
    modulo: "Ventas", icon: "🛒",
    permisos: [
      { nombre: "ventas:ver", label: "Ver ventas e historial" },
      { nombre: "ventas:crear", label: "Registrar ventas manuales" },
      { nombre: "ventas:editar", label: "Editar ventas registradas" },
      { nombre: "ventas:eliminar", label: "Eliminar ventas del historial" },
    ]
  },
  {
    modulo: "Clientes", icon: "👤",
    permisos: [
      { nombre: "clientes:ver", label: "Ver listado de clientes" },
      { nombre: "clientes:historial", label: "Ver historial de pedidos del cliente" },
    ]
  },
  {
    modulo: "Compras y Proveedores", icon: "🧾",
    permisos: [
      { nombre: "compras:ver", label: "Ver compras, proveedores e historial" },
      { nombre: "compras:crear", label: "Registrar nuevas compras" },
      { nombre: "compras:editar", label: "Editar compras y cambiar estado" },
      { nombre: "compras:eliminar", label: "Eliminar compras del historial" },
    ]
  },
  {
    modulo: "Usuarios", icon: "👥",
    permisos: [
      { nombre: "usuarios:ver", label: "Ver usuarios" },
      { nombre: "usuarios:crear", label: "Crear usuarios" },
      { nombre: "usuarios:editar", label: "Editar usuarios" },
      { nombre: "usuarios:eliminar", label: "Eliminar usuarios" },
      { nombre: "usuarios:bloquear", label: "Bloquear / activar usuarios" },
      { nombre: "usuarios:resetear_pass", label: "Restablecer contraseñas" },
    ]
  },
  {
    modulo: "Roles y Permisos", icon: "🔐",
    permisos: [
      { nombre: "roles:ver", label: "Ver roles" },
      { nombre: "roles:crear", label: "Crear roles" },
      { nombre: "roles:editar", label: "Editar roles" },
      { nombre: "roles:eliminar", label: "Eliminar roles" },
      { nombre: "roles:permisos", label: "Gestionar permisos de un rol" },
      { nombre: "roles:asignar", label: "Asignar roles a usuarios" },
    ]
  },
  {
    modulo: "Notificaciones", icon: "🔔",
    permisos: [
      { nombre: "notif:ver", label: "Ver notificaciones" },
    ]
  },
];

const getRolColor = (_?: string) => "bg-gray-100 text-gray-700";

const getAvatarColor = (_?: string) => "from-gray-500 to-gray-600";

const getInitials = (nombre: string) => {
  const p = nombre.trim().split(" ");
  return (p.length >= 2 ? p[0][0] + p[1][0] : p[0]?.[0] || "?").toUpperCase();
};

const fmtDate = (d: string) => {
  try { return new Date(d).toLocaleDateString("es-CO"); } catch { return d; }
};

export const UsuariosView: React.FC = () => {
  const { hasPermission } = useAuth();
  const { pedidos } = usePedidosAdmin();
  const puedeCrear = hasPermission('usuarios:crear');
  const puedeEditar = hasPermission('usuarios:editar');
  const puedeEliminar = hasPermission('usuarios:eliminar');
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [roles, setRoles] = useState<ApiRole[]>([]);
  const [allPedidos, setAllPedidos] = useState<any[]>([]);
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

  const [form, setForm] = useState({ nombreCompleto: "", email: "", contrasena: "", ciudad: "", telefono: "", documento: "", direccion: "", roleID: "", estado: "activo" });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const updateForm = (field: string, value: string) => {
    if (field === 'nombreCompleto') {
      if (value && !/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]*$/.test(value)) {
        setFormErrors(prev => ({ ...prev, nombreCompleto: 'Solo se permiten letras' }));
        return;
      } else {
        setFormErrors(prev => ({ ...prev, nombreCompleto: '' }));
      }
    } else if (field === 'telefono') {
      if (value && !/^\d*$/.test(value)) {
        setFormErrors(prev => ({ ...prev, telefono: 'Solo se permiten números' }));
        return;
      } else {
        setFormErrors(prev => ({ ...prev, telefono: '' }));
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

  const [permisosSet, setPermisosSet] = useState<Set<string>>(new Set());
  const [savingPermisos, setSavingPermisos] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      const [res, pedidosRes] = await Promise.all([
        api.getJson("/api/usuarios"),
        api.getJson("/api/pedidos").catch(() => null),
      ]);
      setAllPedidos(pedidosRes?.data || pedidosRes || []);
      const list = (res?.data || res || []).map((u: any) => ({
        usuarioID: u.usuarioID ?? u.UsuarioID,
        nombreCompleto: u.nombreCompleto ?? u.NombreCompleto ?? "",
        email: u.email ?? u.Email ?? "",
        telefono: u.telefono ?? u.Telefono ?? "",
        documento: u.documento ?? u.Documento ?? "",
        direccion: u.direccion ?? u.Direccion ?? "",
        ciudad: u.ciudad ?? u.Ciudad ?? "",
        roleID: u.roleID ?? u.RoleID,
        rolNombre: u.rolNombre ?? u.RolNombre ?? "",
        estado: u.estado ?? u.Estado ?? "activo",
        emailVerificado: u.emailVerificado ?? false,
        fechaRegistro: u.fechaRegistro ?? u.FechaRegistro ?? "",
        fotoPerfil: u.fotoPerfil ?? u.FotoPerfil ?? "",
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
    if (!isEdit && form.contrasena && !/^(?=(.*\d){2})(?=.*[^a-zA-Z0-9\s]).{9,20}$/.test(form.contrasena))
      e.contrasena = "9–20 caracteres, mínimo 2 números y 1 carácter especial (ej: Abc12#45)";
    if (!form.roleID) e.roleID = "Selecciona un rol";
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = () => {
    setForm({ nombreCompleto: "", email: "", contrasena: "", ciudad: "", telefono: "", documento: "", direccion: "", roleID: String(roles.find(r => !r.nombre.toLowerCase().includes("admin"))?.roleID || roles[0]?.roleID || ""), estado: "activo" });
    setFormErrors({});
    setCreateOpen(true);
  };

  const handleEdit = (u: ApiUser) => {
    setSelectedUser(u);
    setForm({ nombreCompleto: u.nombreCompleto, email: u.email, contrasena: "", ciudad: u.ciudad||"", telefono: u.telefono||"", documento: u.documento||"", direccion: u.direccion||"", roleID: String(u.roleID||""), estado: u.estado });
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
      await api.postJson("/api/usuarios", { NombreCompleto: form.nombreCompleto, Email: form.email, Contrasena: form.contrasena, Ciudad: form.ciudad, Telefono: form.telefono||null, Documento: form.documento||null, Direccion: form.direccion||null, RoleID: parseInt(form.roleID), Estado: form.estado });
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
      await api.fetchWithAuth(`/api/usuarios/${selectedUser.usuarioID}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ NombreCompleto: form.nombreCompleto, Telefono: form.telefono||null, Documento: form.documento||null, Direccion: form.direccion||null, Ciudad: form.ciudad||null, RoleID: parseInt(form.roleID)||undefined, Estado: form.estado }) });
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

  const exportarExcel = () => {
    const datos = filtered.map(u => ({
      'Nombre': u.nombreCompleto,
      'Email': u.email,
      'Teléfono': u.telefono || '—',
      'Ciudad': u.ciudad || '—',
      'Dirección': u.direccion || '—',
      'Rol': u.rolNombre || '—',
      'Estado': u.estado,
      'Email Verificado': u.emailVerificado ? 'Sí' : 'No',
      'Fecha Registro': fmtDate(u.fechaRegistro),
    }));
    const ws = XLSX.utils.json_to_sheet(datos);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Usuarios');
    // Ajustar ancho de columnas
    ws['!cols'] = [
      { wch: 30 }, { wch: 35 }, { wch: 15 }, { wch: 18 },
      { wch: 20 }, { wch: 12 }, { wch: 18 }, { wch: 18 },
    ];
    XLSX.writeFile(wb, `usuarios_selenne_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const exportarPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Gestión de Usuarios — Selenne Boutique', 14, 18);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Generado el ${new Date().toLocaleDateString('es-CO')} · ${filtered.length} usuario(s)`, 14, 26);
    autoTable(doc, {
      startY: 32,
      head: [['Nombre', 'Email', 'Teléfono', 'Rol', 'Estado', 'Email Verificado', 'Fecha Registro']],
      body: filtered.map(u => [
        u.nombreCompleto,
        u.email,
        u.telefono || '—',
        u.rolNombre || '—',
        u.estado,
        u.emailVerificado ? 'Sí' : 'No',
        fmtDate(u.fechaRegistro),
      ]),
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [214, 83, 145], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [252, 242, 248] },
    });
    doc.save(`usuarios_selenne_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-8 h-8 animate-spin text-[#d65391]" />
      <span className="ml-3 text-gray-600" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>Cargando usuarios...</span>
    </div>
  );

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex items-center gap-2 mb-4">
        <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-500">Dashboard</span>
        <ChevronRight className="w-4 h-4 text-gray-400" />
        <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-900">Gestión de Usuarios</span>
      </div>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <h1 style={{ fontFamily: '"Times New Roman", Times, serif' }} className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm font-medium" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>{users.length}</span>
        </div>
        <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-gray-600">Administra todos los usuarios del sistema</p>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" placeholder="Buscar por nombre, email o rol..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d65391]" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setLoading(true); loadUsers().finally(() => setLoading(false)); }} className="px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                <RefreshCw className="w-5 h-5" />
              </button>
              <button onClick={exportarExcel} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="px-4 py-3 bg-white border border-gray-200 text-green-700 rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors flex items-center gap-2" title="Exportar a Excel">
                <FileSpreadsheet className="w-5 h-5" />
                <span className="hidden sm:inline">Excel</span>
              </button>
              <button onClick={exportarPDF} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="px-4 py-3 bg-white border border-gray-200 text-red-600 rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors flex items-center gap-2" title="Exportar a PDF">
                <FileText className="w-5 h-5" />
                <span className="hidden sm:inline">PDF</span>
              </button>
              {puedeCrear && (
              <button onClick={handleCreate} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2">
                <Plus className="w-5 h-5" /> Nuevo Usuario
              </button>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div>
            <table className="w-full" style={{ tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '22%' }} />
                <col style={{ width: '22%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '20%' }} />
                <col style={{ width: '14%' }} />
                <col style={{ width: '10%' }} />
              </colgroup>
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {["USUARIO","CORREO ELECTRÓNICO","TELÉFONO","DIRECCIÓN","ROL","ACCIONES"].map(h => (
                    <th key={h} className="px-6 py-4 text-left"><span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs uppercase tracking-wider text-gray-600">{h}</span></th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(u => (
                  <tr key={u.usuarioID} className="hover:bg-gray-50 transition-colors">
                    {/* Avatar + nombre */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 bg-gradient-to-br ${getAvatarColor(u.rolNombre)} rounded-full flex items-center justify-center flex-shrink-0`}>
                          <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-white text-sm font-medium">{getInitials(u.nombreCompleto)}</span>
                        </div>
                        <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-gray-900 font-medium">{u.nombreCompleto}</span>
                      </div>
                    </td>
                    {/* Email */}
                    <td className="px-6 py-4"><span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-600 truncate block" title={u.email}>{u.email}</span></td>
                    {/* Teléfono */}
                    <td className="px-6 py-4"><span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-600">{u.telefono || "—"}</span></td>
                    {/* Dirección */}
                    <td className="px-6 py-4"><span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-600 truncate block">{(() => {
                      if (u.direccion) return u.direccion;
                      const pedido = [...allPedidos, ...pedidos]
                        .filter((p: any) => (p.emailCliente ?? p.email ?? '').toLowerCase() === u.email.toLowerCase())
                        .sort((a: any, b: any) => new Date(b.fechaPedido ?? b.fecha ?? 0).getTime() - new Date(a.fechaPedido ?? a.fecha ?? 0).getTime())[0];
                      return pedido?.direccionEnvio || pedido?.direccion || '—';
                    })()}</span></td>
                    {/* Rol */}
                    <td className="px-6 py-4">
                      <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className={`px-3 py-1 rounded text-xs font-medium ${getRolColor(u.rolNombre)}`}>{(u.rolNombre || "SIN ROL").toUpperCase()}</span>
                    </td>
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
                                <Eye className="w-4 h-4 text-gray-600" /><span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-700">Ver Detalles</span>
                              </button>
                              {puedeEditar && (
                              <button onClick={() => handleEdit(u)} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-left">
                                <Edit className="w-4 h-4 text-gray-600" /><span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-700">Editar</span>
                              </button>
                              )}
                              {u.roleID && (
                                <button onClick={() => handlePermisos(u)} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-blue-50 text-left">
                                  <Shield className="w-4 h-4 text-blue-600" /><span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-blue-700">Configurar Permisos</span>
                                </button>
                              )}
                              {puedeEditar && (
                              <button onClick={() => handleToggleStatus(u)} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-left">
                                <Power className="w-4 h-4 text-gray-600" /><span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-700">{u.estado === "activo" ? "Desactivar" : "Activar"}</span>
                              </button>
                              )}
                              {puedeEliminar && (
                              <>
                              <div className="border-t border-gray-200 my-1" />
                              <button onClick={() => handleDelete(u)} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-red-50 text-left">
                                <Trash2 className="w-4 h-4 text-red-600" /><span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-red-600">Eliminar</span>
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
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>No se encontraron usuarios</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-gray-200">
            <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-600">Mostrando <span className="font-medium text-gray-900">{filtered.length}</span> de {users.length} usuarios</span>
          </div>
        </div>
      </div>

      {/* Ver Detalles — estilo Proveedores */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-2xl h-auto flex flex-col p-0 gap-0">
          <DialogHeader className="px-8 pt-6 pb-4 border-b border-gray-200 flex-shrink-0">
            <DialogTitle style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-2xl">
              {selectedUser?.nombreCompleto}
            </DialogTitle>
            <DialogDescription style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
              {(selectedUser?.rolNombre || "Sin rol").toUpperCase()}{selectedUser?.ciudad ? ` — ${selectedUser.ciudad}` : ""}
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-6 py-6 px-8">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <h3 style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="font-semibold text-gray-800 text-base flex items-center gap-2"><User className="w-4 h-4 text-gray-400" />Información del Usuario</h3>
                  </div>
                  <div className="p-6 grid grid-cols-2 gap-6">
                    <div className="flex flex-col gap-1">
                      <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-500 font-medium uppercase">Nombre</p>
                      <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-semibold text-gray-900">{selectedUser.nombreCompleto}</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-500 font-medium uppercase">Teléfono</p>
                      <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-semibold text-gray-900">{selectedUser.telefono || "—"}</p>
                    </div>
                    <div className="flex flex-col gap-1 col-span-2">
                      <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-500 font-medium uppercase">Correo</p>
                      <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-semibold text-gray-900 break-all">{selectedUser.email}</p>
                    </div>
                    {selectedUser.direccion && (
                      <div className="flex flex-col gap-1 col-span-2">
                        <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-500 font-medium uppercase">Dirección</p>
                        <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-semibold text-gray-900">{selectedUser.direccion}</p>
                      </div>
                    )}
                    <div className="flex flex-col gap-1">
                      <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-500 font-medium uppercase">Estado</p>
                      <span className={`inline-flex w-fit px-3 py-1 rounded-full text-xs font-semibold ${selectedUser.estado === "activo" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                        {selectedUser.estado === "activo" ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-500 font-medium uppercase">Fecha Registro</p>
                      <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-semibold text-gray-900">{fmtDate(selectedUser.fechaRegistro)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 px-8 py-5 border-t border-gray-200 flex-shrink-0">
            <button onClick={() => setViewOpen(false)} className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>Cerrar</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Crear / Editar */}
      <Dialog open={createOpen || editOpen} onOpenChange={(o: boolean) => { if (!o) { setCreateOpen(false); setEditOpen(false); } }}>
        <DialogContent className="max-w-2xl h-auto flex flex-col p-0 gap-0">
          <DialogHeader className="px-8 pt-6 pb-4 border-b border-gray-200 flex-shrink-0">
            <DialogTitle style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-2xl">{editOpen ? "Editar Usuario" : "Nuevo Usuario"}</DialogTitle>
            <DialogDescription style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>{editOpen ? "Modifica la información del usuario" : "Completa los datos para registrar un nuevo usuario"}</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-6 py-6 px-8">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <h3 style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="font-semibold text-gray-800 text-base flex items-center gap-2"><User className="w-4 h-4 text-gray-400" />Información del Usuario</h3>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-gray-700 mb-1 block">Nombre Completo *</Label>
                      <Input value={form.nombreCompleto} onChange={e => updateForm('nombreCompleto', e.target.value)} placeholder="Juan Pérez" className={formErrors.nombreCompleto ? 'border-red-500' : ''} />
                      {formErrors.nombreCompleto && <p className="text-red-500 text-xs mt-1">{formErrors.nombreCompleto}</p>}
                    </div>
                    <div>
                      <Label className="text-sm text-gray-700 mb-1 block">Ciudad</Label>
                      <Input value={form.ciudad} onChange={e => setForm({...form, ciudad: e.target.value})} placeholder="Medellín" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-700 mb-1 block">Correo Electrónico *</Label>
                    <Input type="email" value={form.email} onChange={e => updateForm('email', e.target.value)} placeholder="correo@ejemplo.com" disabled={editOpen} className={editOpen ? "bg-gray-50 text-gray-500" : (formErrors.email ? "border-red-500" : "")} />
                    {editOpen && <p className="text-xs text-gray-400 mt-1">El correo no se puede cambiar</p>}
                    {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
                  </div>
                  {!editOpen && (
                    <div>
                      <Label className="text-sm text-gray-700 mb-1 block">Contraseña *</Label>
                      <Input type="password" value={form.contrasena} onChange={e => setForm({...form, contrasena: e.target.value})} placeholder="Ej: MiPass12#" />
                      <p className="text-xs text-gray-400 mt-1">9–20 caracteres · 2 números · 1 carácter especial</p>
                      {formErrors.contrasena && <p className="text-red-500 text-xs mt-1">{formErrors.contrasena}</p>}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-gray-700 mb-1 block">Rol *</Label>
                      <select value={form.roleID} onChange={e => setForm({...form, roleID: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d65391] text-sm" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
                        <option value="">Selecciona un rol</option>
                        {roles.map(r => <option key={r.roleID} value={r.roleID}>{r.nombre}</option>)}
                      </select>
                      {formErrors.roleID && <p className="text-red-500 text-xs mt-1">{formErrors.roleID}</p>}
                    </div>
                    <div>
                      <Label className="text-sm text-gray-700 mb-1 block">Estado</Label>
                      <select value={form.estado} onChange={e => setForm({...form, estado: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d65391] text-sm" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
                        <option value="activo">Activo</option>
                        <option value="inactivo">Inactivo</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-gray-700 mb-1 block">Teléfono</Label>
                      <Input type="tel" value={form.telefono} onChange={e => updateForm('telefono', e.target.value)} placeholder="3001234567" className={formErrors.telefono ? 'border-red-500' : ''} />
                      {formErrors.telefono && <p className="text-red-500 text-xs mt-1">{formErrors.telefono}</p>}
                    </div>
                    <div>
                      <Label className="text-sm text-gray-700 mb-1 block">Número de Documento</Label>
                      <Input type="text" inputMode="numeric" value={form.documento} onChange={e => setForm({...form, documento: e.target.value.replace(/\D/g, '')})} placeholder="1234567890" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-700 mb-1 block">Dirección</Label>
                    <textarea value={form.direccion} onChange={e => setForm({...form, direccion: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d65391] text-sm min-h-[70px] resize-none" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} placeholder="Calle 123 #45-67, Ciudad" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 px-8 py-5 border-t border-gray-200 flex-shrink-0">
            <button onClick={() => { setCreateOpen(false); setEditOpen(false); }} className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>Cancelar</button>
            <button onClick={editOpen ? saveEdit : saveCreate} disabled={saving} className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
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
            <AlertDialogTitle style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>¿Eliminar usuario?</AlertDialogTitle>
            <AlertDialogDescription style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
              Vas a eliminar permanentemente a <strong>{selectedUser?.nombreCompleto}</strong> ({selectedUser?.email}). Esta acción <strong>no se puede deshacer</strong> y el usuario será removido de la base de datos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={saving} className="bg-red-600 hover:bg-red-700 flex items-center gap-2" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Eliminar permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Permisos */}
      <Dialog open={permisosOpen} onOpenChange={setPermisosOpen}>
        <DialogContent className="max-w-2xl h-auto flex flex-col p-0 gap-0">
          <DialogHeader className="px-8 pt-6 pb-4 border-b border-gray-200 flex-shrink-0">
            <DialogTitle style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-2xl">
              Configurar Permisos
            </DialogTitle>
            <DialogDescription style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
              Rol: {selectedRole?.nombre?.toUpperCase()} — {selectedUser?.nombreCompleto}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-3 py-6 px-8">
              {MODULOS_PERMISOS.map(({ modulo, permisos }) => {
                const allSel = permisos.every(p => permisosSet.has(p.nombre));
                const someSel = permisos.some(p => permisosSet.has(p.nombre));
                return (
                  <div key={modulo} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <button onClick={() => toggleModulo(permisos)} className="w-full flex items-center gap-3 px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left border-b border-gray-200">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${allSel ? "bg-[#d65391] border-[#d65391]" : someSel ? "bg-pink-200 border-[#d65391]" : "border-gray-300"}`}>
                        {(allSel || someSel) && <span className="text-white text-xs font-bold">✓</span>}
                      </div>
                      <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="font-semibold text-gray-800">Módulo {modulo}</span>
                    </button>
                    <div className="px-6 py-3 space-y-1 bg-white">
                      {permisos.map(p => (
                        <label key={p.nombre} className="flex items-center gap-3 cursor-pointer py-1" onClick={() => togglePermiso(p.nombre)}>
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${permisosSet.has(p.nombre) ? "bg-[#d65391] border-[#d65391]" : "border-gray-300 hover:border-[#d65391]"}`}>
                            {permisosSet.has(p.nombre) && <span className="text-white text-xs font-bold">✓</span>}
                          </div>
                          <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-700">{p.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <DialogFooter className="gap-2 px-8 py-5 border-t border-gray-200 flex-shrink-0">
            <button onClick={() => setPermisosOpen(false)} className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>Cancelar</button>
            <button onClick={savePermisos} disabled={savingPermisos} className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
              {savingPermisos && <Loader2 className="w-4 h-4 animate-spin" />} Guardar Permisos
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};