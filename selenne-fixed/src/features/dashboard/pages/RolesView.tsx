import React, { useState } from 'react';
import {
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Users,
  Ban,
  Settings,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import { removeAt } from '../../../shared/utils/validators';
import { usePermisos, PermissionModule } from '../../../shared/contexts/PermisosContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription } from '../../../components/ui/alert-dialog';
import { Checkbox } from '../../../components/ui/checkbox';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '../../../components/ui/pagination';
import { toast } from 'sonner';

interface Role {
  id: string;
  nombre: string;
  descripcion: string;
  usuarios: number;
  preexistente: boolean;
  permisos?: string[];
  estado: 'activo' | 'inactivo';
  // Opciones específicas para rol EMPLEADO
  opcionesEmpleado?: {
    accesoCaja?: boolean;
    gestionarInventario?: boolean;
  };
  // Opciones específicas para rol ADMINISTRADOR
  opcionesAdmin?: {
    gestionarAdmins?: boolean;
    verAuditoría?: boolean;
    configurarSistema?: boolean;
    verReportes?: boolean;
  };
}

const todosLosModulos: PermissionModule[] = [
  {
    id: 'productos',
    name: 'Módulo Productos',
    checked: false,
    permissions: [
      { id: 'productos_ver', label: 'Ver listado de productos', checked: false },
      { id: 'productos_crear', label: 'Crear productos', checked: false },
      { id: 'productos_editar', label: 'Editar productos', checked: false },
      { id: 'productos_eliminar', label: 'Eliminar productos', checked: false },
    ],
  },
  {
    id: 'ventas',
    name: 'Módulo Ventas',
    checked: false,
    permissions: [
      { id: 'ventas_ver', label: 'Ver ventas', checked: false },
      { id: 'ventas_crear', label: 'Registrar ventas', checked: false },
      { id: 'ventas_editar', label: 'Editar ventas', checked: false },
      { id: 'ventas_reporte', label: 'Ver reportes de ventas', checked: false },
    ],
  },
  {
    id: 'clientes',
    name: 'Módulo Clientes',
    checked: false,
    permissions: [
      { id: 'clientes_ver', label: 'Ver clientes', checked: false },
      { id: 'clientes_crear', label: 'Crear clientes', checked: false },
      { id: 'clientes_editar', label: 'Editar clientes', checked: false },
      { id: 'clientes_eliminar', label: 'Eliminar clientes', checked: false },
    ],
  },
  {
    id: 'inventario',
    name: 'Módulo Inventario',
    checked: false,
    permissions: [
      { id: 'inventario_ver', label: 'Ver inventario', checked: false },
      { id: 'inventario_actualizar', label: 'Actualizar stock', checked: false },
      { id: 'inventario_ajustes', label: 'Realizar ajustes de inventario', checked: false },
      { id: 'inventario_reporte', label: 'Ver reportes de inventario', checked: false },
    ],
  },
  {
    id: 'usuarios',
    name: 'Módulo Usuarios',
    checked: false,
    permissions: [
      { id: 'usuarios_ver', label: 'Ver usuarios', checked: false },
      { id: 'usuarios_crear', label: 'Crear usuarios', checked: false },
      { id: 'usuarios_editar', label: 'Editar usuarios', checked: false },
      { id: 'usuarios_eliminar', label: 'Eliminar usuarios', checked: false },
    ],
  },
  {
    id: 'roles',
    name: 'Módulo Roles y Permisos',
    checked: false,
    permissions: [
      { id: 'roles_ver', label: 'Ver roles', checked: false },
      { id: 'roles_crear', label: 'Crear roles', checked: false },
      { id: 'roles_editar', label: 'Editar roles', checked: false },
      { id: 'roles_eliminar', label: 'Eliminar roles', checked: false },
      { id: 'roles_permisos', label: 'Configurar permisos', checked: false },
    ],
  },
  {
    id: 'reportes',
    name: 'Módulo Reportes',
    checked: false,
    permissions: [
      { id: 'reportes_ventas', label: 'Reportes de ventas', checked: false },
      { id: 'reportes_inventario', label: 'Reportes de inventario', checked: false },
      { id: 'reportes_clientes', label: 'Reportes de clientes', checked: false },
      { id: 'reportes_financiero', label: 'Reportes financieros', checked: false },
    ],
  },
  {
    id: 'tienda',
    name: 'Módulo Tienda Online',
    checked: false,
    permissions: [
      { id: 'tienda_ver', label: 'Ver tienda', checked: false },
      { id: 'tienda_comprar', label: 'Realizar compras', checked: false },
      { id: 'tienda_carrito', label: 'Gestionar carrito', checked: false },
      { id: 'tienda_pedidos', label: 'Ver mis pedidos', checked: false },
    ],
  },
  {
    id: 'configuracion',
    name: 'Módulo Configuración',
    checked: false,
    permissions: [
      { id: 'config_sistema', label: 'Configuración del sistema', checked: false },
      { id: 'config_empresa', label: 'Datos de la empresa', checked: false },
      { id: 'config_email', label: 'Configuración de email', checked: false },
      { id: 'config_integraciones', label: 'Integraciones', checked: false },
    ],
  },
];

export const RolesView: React.FC = () => {
  const { canDelete, getPermisos, setPermisos } = usePermisos();

  const [searchQuery, setSearchQuery] = useState('');
  // State to hold list of users that belong to the selected role (for the edit modal)
  interface User {
    id: string;
    nombre: string;
    tipo: string;
    email: string;
    estado: string;
  }
  const [usuariosDelRol, setUsuariosDelRol] = useState<User[]>([]);

  // carga los usuarios almacenados en localStorage y filtra por tipo/rol
  const loadUsersForRole = (roleName: string) => {
    try {
      const stored = localStorage.getItem('selenne_users');
      if (stored) {
        const parsed: any[] = JSON.parse(stored);
        const formatted: User[] = parsed.map((u: any) => ({
          id: u.id || `u-${Date.now()}-${Math.random()}`,
          nombre: u.nombre || u.name || '',
          tipo: u.tipo || u.role || 'CLIENTE',
          email: u.email || '',
          estado: u.estado || 'Activo',
        }));
        setUsuariosDelRol(formatted.filter(u => u.tipo === roleName));
        return;
      }
    } catch (error) {
      console.error('Error loading users for role:', error);
    }
    setUsuariosDelRol([]);
  };

  const toggleUserStatus = (userId: string) => {
    try {
      const stored = localStorage.getItem('selenne_users');
      if (!stored) return;
      const parsed: any[] = JSON.parse(stored);
      const updated = parsed.map((u) => {
        if (u.id === userId) {
          u.estado = u.estado === 'Activo' ? 'Inactivo' : 'Activo';
        }
        return u;
      });
      localStorage.setItem('selenne_users', JSON.stringify(updated));
      if (selectedRole) {
        loadUsersForRole(selectedRole.nombre);
        // actualizar contador de usuarios activos para el rol
        const activeCount = updated.filter((u) => u.tipo === selectedRole.nombre && u.estado === 'Activo').length;
        setRoles(prev => prev.map(r => r.id === selectedRole.id ? { ...r, usuarios: activeCount } : r));
      }
    } catch (err) {
      console.error('Error toggling user status:', err);
    }
  };

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [permisosModalOpen, setPermisosModalOpen] = useState(false);
  const [usuariosModalOpen, setUsuariosModalOpen] = useState(false);
  const [usuariosSearchQuery, setUsuariosSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const [formData, setFormData] = useState<Partial<Role>>({ nombre: '', descripcion: '', usuarios: 0, preexistente: false, permisos: [], estado: 'activo' });
  const [permisosEditables, setPermisosEditables] = useState<PermissionModule[]>([]);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [createPermisosEditables, setCreatePermisosEditables] = useState<PermissionModule[]>([]);

  const [roles, setRoles] = useState<Role[]>([
    { id: '1', nombre: 'ADMINISTRADOR', descripcion: 'Control total del sistema', usuarios: 4, preexistente: true, permisos: ['Todos los permisos'], estado: 'activo' },
    { id: '2', nombre: 'EMPLEADO', descripcion: 'Gestión de ventas y productos', usuarios: 12, preexistente: false, permisos: [], estado: 'activo', opcionesEmpleado: { accesoCaja: true, gestionarInventario: false } },
    { id: '3', nombre: 'CLIENTE', descripcion: 'Acceso a tienda y compras', usuarios: 1847, preexistente: true, permisos: ['Ver tienda', 'Realizar compras'], estado: 'activo' },
  ]);

  const filteredRoles = roles.filter((role) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      role.nombre.toLowerCase().includes(q) ||
      role.descripcion.toLowerCase().includes(q) ||
      role.usuarios.toString().includes(q) ||
      role.estado.toLowerCase().includes(q)
    );
  });

  // Paginación
  const totalPages = Math.ceil(filteredRoles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRoles = filteredRoles.slice(startIndex, endIndex);

  // Resetear a página 1 cuando se busca
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleView = (role: Role) => { setSelectedRole(role); loadUsersForRole(role.nombre); setViewModalOpen(true); };
  const handleCreate = () => { 
    setFormData({ nombre: '', descripcion: '', usuarios: 0, preexistente: false, permisos: [], estado: 'activo' }); 
    setFormErrors({});
    setCreatePermisosEditables(JSON.parse(JSON.stringify(todosLosModulos)));
    setUsuariosDelRol([]); // no users to show in creation
    setCreateModalOpen(true); 
  };
  const handleEdit = (role: Role) => { 
    setSelectedRole(role); 
    // Si se está editando el rol EMPLEADO, precargar las opciones específicas
    const initialForm: Partial<Role> = { ...role };
    if (role.nombre === 'EMPLEADO') {
      initialForm.opcionesEmpleado = role.opcionesEmpleado || { accesoCaja: false, gestionarInventario: false };
    }
    setFormData(initialForm);
    setFormErrors({});
    const permisosActuales = getPermisos(role.nombre);
    let permisosInicializados: PermissionModule[] = permisosActuales && permisosActuales.length > 0 ? permisosActuales : JSON.parse(JSON.stringify(todosLosModulos));
    setCreatePermisosEditables(JSON.parse(JSON.stringify(permisosInicializados)));
    // también cargar los usuarios que pertenecen a este rol para permitir habilitarlos/deshabilitarlos
    loadUsersForRole(role.nombre);
    setEditModalOpen(true); 
  };
  const handleDelete = (role: Role) => { if (role.preexistente) { toast.error('No se pueden eliminar roles preexistentes'); return; } if (!canDelete()) { toast.error('No tienes permisos para eliminar roles'); return; } setSelectedRole(role); setDeleteModalOpen(true); };

  const handleEditarPermisos = (role: Role) => {
    if (role.nombre === 'ADMINISTRADOR') { toast.info('Los administradores tienen acceso total al sistema'); return; }
    if (role.nombre === 'CLIENTE') { toast.info('Los clientes solo tienen acceso a la tienda online'); return; }
    setSelectedRole(role);
    const permisosActuales = getPermisos(role.nombre);
    let permisosInicializados: PermissionModule[] = [];
    if (permisosActuales && permisosActuales.length > 0) permisosInicializados = permisosActuales;
    else permisosInicializados = todosLosModulos.map((m) => ({ ...m }));
    setPermisosEditables(JSON.parse(JSON.stringify(permisosInicializados)));
    setPermisosModalOpen(true);
  };

  const handleToggleModulo = (moduleId: string) => { setPermisosEditables(prev => prev.map(m => m.id === moduleId ? { ...m, checked: !m.checked, permissions: m.permissions.map(p => ({ ...p, checked: !m.checked })) } : m)); };
  const handleTogglePermiso = (moduleId: string, permisoId: string) => { setPermisosEditables(prev => prev.map(mod => { if (mod.id === moduleId) { const newPerms = mod.permissions.map(p => p.id === permisoId ? { ...p, checked: !p.checked } : p); const any = newPerms.some(p => p.checked); return { ...mod, permissions: newPerms, checked: any }; } return mod; })); };
  const handleToggleModuloCreate = (moduleId: string) => { setCreatePermisosEditables(prev => prev.map(m => m.id === moduleId ? { ...m, checked: !m.checked, permissions: m.permissions.map(p => ({ ...p, checked: !m.checked })) } : m)); };
  const handleTogglePermisoCreate = (moduleId: string, permisoId: string) => { setCreatePermisosEditables(prev => prev.map(mod => { if (mod.id === moduleId) { const newPerms = mod.permissions.map(p => p.id === permisoId ? { ...p, checked: !p.checked } : p); const any = newPerms.some(p => p.checked); return { ...mod, permissions: newPerms, checked: any }; } return mod; })); };
  const handleGuardarPermisos = () => { if (!selectedRole) return; setPermisos(selectedRole.nombre, permisosEditables); setPermisosModalOpen(false); toast.success('Permisos guardados'); };

  const handleSaveCreate = () => {
    // Validar errores de validación
    if (Object.values(formErrors).some(error => error !== '')) {
      toast.error('Por favor, corrige los errores antes de guardar');
      return;
    }

    if (!formData.nombre || !formData.descripcion) {
      setFormErrors({
        nombre: !formData.nombre ? 'El nombre es obligatorio' : '',
        descripcion: !formData.descripcion ? 'La descripción es obligatoria' : ''
      });
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }
    const selectedPermisos = createPermisosEditables
      .filter(m => m.checked)
      .map(m => m.name);
    const newRole: Role = {
      id: String(roles.length + 1),
      nombre: (formData.nombre || '').toUpperCase(),
      descripcion: formData.descripcion || '',
      usuarios: 0,
      preexistente: false,
      permisos: selectedPermisos,
      estado: formData.estado || 'activo',
      opcionesEmpleado: formData.opcionesEmpleado ? { ...formData.opcionesEmpleado } : undefined,
    };
    setRoles(prev => [...prev, newRole]);
    setPermisos(newRole.nombre, createPermisosEditables);
    setCreateModalOpen(false);
    toast.success('Rol creado correctamente');
  };
  const handleSaveEdit = () => {
    // Validar errores de validación
    if (Object.values(formErrors).some(error => error !== '')) {
      toast.error('Por favor, corrige los errores antes de guardar');
      return;
    }

    if (!formData.nombre || !formData.descripcion) {
      setFormErrors({
        nombre: !formData.nombre ? 'El nombre es obligatorio' : '',
        descripcion: !formData.descripcion ? 'La descripción es obligatoria' : ''
      });
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }
    if (selectedRole) {
      const selectedPermisos = createPermisosEditables
        .filter(m => m.checked)
        .map(m => m.name);
      setRoles(prev => prev.map(r => r.id === selectedRole.id ? { 
        ...r, 
        ...(formData as Role), 
        permisos: selectedPermisos,
        // conservar o sobrescribir opcionesEmpleado si existen
        opcionesEmpleado: formData.opcionesEmpleado ? { ...formData.opcionesEmpleado } : r.opcionesEmpleado
      } : r));
      setPermisos(selectedRole.nombre, createPermisosEditables);
      setEditModalOpen(false);
      toast.success('Rol actualizado correctamente');
    }
  };
  const confirmDelete = () => { if (!selectedRole) return; setRoles(prev => prev.filter(r => r.id !== selectedRole.id)); setDeleteModalOpen(false); toast.success('Rol eliminado'); };
  const handleToggleEstado = (role: Role) => { const nuevo = role.estado === 'activo' ? 'inactivo' : 'activo'; setRoles(prev => prev.map(r => r.id === role.id ? { ...r, estado: nuevo } : r)); toast.success(`Rol ${role.nombre} marcado como ${nuevo}`); };

  const getIconForRole = (nombre: string) => { switch (nombre) { case 'ADMINISTRADOR': return '👑'; case 'EMPLEADO': return '💼'; case 'CLIENTE': return '👥'; default: return '👤'; } };

  return (
    <>
      <div className="p-8 bg-gray-50 min-h-screen">
        <div className="flex items-center gap-2 mb-6"><span style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-500">Dashboard</span></div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1"><div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="text" placeholder="Buscar por nombre, descripción, usuarios o estado..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ fontFamily: 'Inter, sans-serif' }} className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d65391] focus:border-transparent transition-all" /></div></div>
              <button onClick={handleCreate} style={{ fontFamily: 'Inter, sans-serif' }} className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2 whitespace-nowrap"><Plus className="w-5 h-5" /> Nuevo Rol</button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200"><tr>
                    <th className="px-6 py-4 text-left" style={{ fontFamily: 'Inter, sans-serif' }}><span className="text-xs uppercase tracking-wider text-gray-600">NOMBRE DEL ROL</span></th>
                    <th className="px-6 py-4 text-left" style={{ fontFamily: 'Inter, sans-serif' }}><span className="text-xs uppercase tracking-wider text-gray-600">DESCRIPCIÓN</span></th>
                    <th className="px-6 py-4 text-left" style={{ fontFamily: 'Inter, sans-serif' }}><span className="text-xs uppercase tracking-wider text-gray-600">USUARIOS</span></th>
                    <th className="px-6 py-4 text-left" style={{ fontFamily: 'Inter, sans-serif' }}><span className="text-xs uppercase tracking-wider text-gray-600">ESTADO</span></th>
                    <th className="px-6 py-4 text-left" style={{ fontFamily: 'Inter, sans-serif' }}><span className="text-xs uppercase tracking-wider text-gray-600">ACCIONES</span></th>
                  </tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedRoles.map((role) => (
                    <tr key={role.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4"><div className="flex items-center gap-3"><span className="text-2xl">{getIconForRole(role.nombre)}</span><div><div className="flex items-center gap-2"><span style={{ fontFamily: 'Inter, sans-serif' }} className="text-gray-900">{role.nombre}</span>{role.preexistente && (<span style={{ fontFamily: 'Inter, sans-serif' }} className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">Preexistente</span>)}</div></div></div></td>
                      <td className="px-6 py-4"><span style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-600">{role.descripcion}</span></td>
                      <td className="px-6 py-4"><button onClick={() => { setSelectedRole(role); loadUsersForRole(role.nombre); setUsuariosSearchQuery(''); setUsuariosModalOpen(true); }} className="flex items-center gap-2 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"><Users className="w-4 h-4 text-gray-400" /><span style={{ fontFamily: 'Inter, sans-serif' }} className="text-gray-900 font-semibold hover:text-[#d65391]">{role.usuarios.toLocaleString()}</span></button></td>
                      <td className="px-6 py-4"><button onClick={() => handleToggleEstado(role)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${role.estado === 'activo' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`} title="Haz clic para cambiar estado">{role.estado === 'activo' ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}<span style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm font-medium capitalize">{role.estado}</span></button></td>
                      <td className="px-6 py-4"><div className="flex items-center gap-2"><button onClick={() => handleView(role)} className="p-2 text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors" title="Ver detalles"><Eye className="w-5 h-5" /></button><button onClick={() => handleEditarPermisos(role)} className="p-2 text-gray-600 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-colors" title="Configurar permisos"><Settings className="w-5 h-5" /></button><button onClick={() => handleEdit(role)} className="p-2 text-gray-600 hover:bg-yellow-50 hover:text-yellow-600 rounded-lg transition-colors" title="Editar rol"><Edit className="w-5 h-5" /></button>{role.preexistente ? (<button disabled className="p-2 text-gray-300 cursor-not-allowed rounded-lg" title="No eliminable (rol preexistente)"><Ban className="w-5 h-5" /></button>) : canDelete() ? (<button onClick={() => handleDelete(role)} className="p-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors" title="Eliminar rol"><Trash2 className="w-5 h-5" /></button>) : (<button disabled className="p-2 text-gray-300 cursor-not-allowed rounded-lg" title="Sin permisos para eliminar"><Ban className="w-5 h-5" /></button>)}</div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginador */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 p-4 border-t border-gray-200 bg-gray-50">
                <Pagination>
                  <PaginationContent>
                    {currentPage > 1 && (
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} 
                          style={{ cursor: 'pointer' }}
                          size="sm"
                        />
                      </PaginationItem>
                    )}
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={page === currentPage}
                          style={{ cursor: 'pointer' }}
                          size="sm"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}

                    {currentPage < totalPages && (
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} 
                          style={{ cursor: 'pointer' }}
                          size="sm"
                        />
                      </PaginationItem>
                    )}
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Ver Detalles */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }} className="text-2xl">Detalles del Rol</DialogTitle>
            <DialogDescription style={{ fontFamily: 'Inter, sans-serif' }}>Información completa del rol y sus permisos</DialogDescription>
          </DialogHeader>
          {selectedRole && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <span className="text-4xl">{getIconForRole(selectedRole.nombre)}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 style={{ fontFamily: 'Inter, sans-serif' }} className="text-xl text-gray-900">{selectedRole.nombre}</h3>
                    {selectedRole.preexistente && (<span style={{ fontFamily: 'Inter, sans-serif' }} className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">Preexistente</span>)}
                  </div>
                  <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-600">{selectedRole.descripcion}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <label style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-600 block mb-1">Usuarios Asignados</label>
                  <p style={{ fontFamily: 'Playfair Display, serif' }} className="text-2xl text-gray-900">{selectedRole.usuarios.toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <label style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-600 block mb-1">Tipo</label>
                  <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-lg text-gray-900">{selectedRole.preexistente ? 'Sistema' : 'Personalizado'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <label style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-600 block mb-1">Estado</label>
                  <div className="flex items-center gap-2">{selectedRole.estado === 'activo' ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <Circle className="w-5 h-5 text-gray-400" />}<p style={{ fontFamily: 'Inter, sans-serif' }} className="text-lg text-gray-900 capitalize">{selectedRole.estado}</p></div>
                </div>
              </div>

              <div>
                <label style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-600 block mb-2">Permisos Asignados</label>
                <div className="space-y-2">
                  {selectedRole.permisos && selectedRole.permisos.length > 0 ? (
                    selectedRole.permisos.map((permiso, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-lg">
                        <div className="w-2 h-2 bg-[#d65391] rounded-full" />
                        <span style={{ fontFamily: 'Inter, sans-serif' }}>{permiso}</span>
                      </div>
                    ))
                  ) : (
                    <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-500 italic">No hay permisos específicos asignados</p>
                  )}
                </div>
              </div>
              {/* Mostrar opciones de empleado si existen */}
              {selectedRole.nombre === 'EMPLEADO' && selectedRole.opcionesEmpleado && (
                <div className="mt-4">
                  <label style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-600 block mb-2">Opciones de Empleado</label>
                  <div className="space-y-2">
                    {selectedRole.opcionesEmpleado.accesoCaja !== undefined && (
                      <div className="flex items-center gap-2 text-sm">
                        <Checkbox checked={selectedRole.opcionesEmpleado.accesoCaja} disabled id="view-opt-acceso-caja" />
                        <label htmlFor="view-opt-acceso-caja" style={{ fontFamily: 'Inter, sans-serif' }} className="cursor-pointer">Acceso a caja</label>
                      </div>
                    )}
                    {selectedRole.opcionesEmpleado.gestionarInventario !== undefined && (
                      <div className="flex items-center gap-2 text-sm">
                        <Checkbox checked={selectedRole.opcionesEmpleado.gestionarInventario} disabled id="view-opt-gestionar-inventario" />
                        <label htmlFor="view-opt-gestionar-inventario" style={{ fontFamily: 'Inter, sans-serif' }} className="cursor-pointer">Gestionar inventario</label>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {/* listado de usuarios (solo visualización) */}
              {usuariosDelRol.length > 0 && (
                <div className="mt-6">
                  <label style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-600 block mb-2">Usuarios asignados</label>
                  <div className="space-y-2">
                    {usuariosDelRol.map(u => (
                      <div key={u.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                        <div>
                          <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm font-medium">{u.nombre}</p>
                          <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-600">{u.email}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${u.estado === 'Activo' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{u.estado}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <button onClick={() => setViewModalOpen(false)} style={{ fontFamily: 'Inter, sans-serif' }} className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">Cerrar</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Permisos */}
      <Dialog open={permisosModalOpen} onOpenChange={setPermisosModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }} className="text-2xl">Configurar Permisos - {selectedRole?.nombre}</DialogTitle>
            <DialogDescription style={{ fontFamily: 'Inter, sans-serif' }}>Selecciona los módulos y permisos que deseas asignar a este rol</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {permisosEditables.map((modulo) => (
              <div key={modulo.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-4">
                  <Checkbox checked={modulo.checked} onCheckedChange={() => handleToggleModulo(modulo.id)} id={`module-${modulo.id}`} />
                  <label htmlFor={`module-${modulo.id}`} style={{ fontFamily: 'Inter, sans-serif' }} className="text-lg text-gray-900 cursor-pointer flex-1">{modulo.name}</label>
                </div>
                <div className="pl-8 space-y-2">
                  {modulo.permissions.map((permiso) => (
                    <div key={permiso.id} className="flex items-center gap-3">
                      <Checkbox checked={permiso.checked} onCheckedChange={() => handleTogglePermiso(modulo.id, permiso.id)} id={`perm-${permiso.id}`} />
                      <label htmlFor={`perm-${permiso.id}`} style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-700 cursor-pointer">{permiso.label}</label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <DialogFooter className="gap-2 mt-6">
            <button onClick={() => setPermisosModalOpen(false)} style={{ fontFamily: 'Inter, sans-serif' }} className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">Cancelar</button>
            <button onClick={handleGuardarPermisos} style={{ fontFamily: 'Inter, sans-serif' }} className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors">Guardar Permisos</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Crear/Editar */}
      <Dialog open={createModalOpen || editModalOpen} onOpenChange={(open: boolean) => { if (!open) { setCreateModalOpen(false); setEditModalOpen(false); } }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }} className="text-2xl">{editModalOpen ? 'Editar Rol' : 'Nuevo Rol'}</DialogTitle>
            <DialogDescription style={{ fontFamily: 'Inter, sans-serif' }}>{editModalOpen ? 'Modifica la información del rol y sus permisos' : 'Completa los datos y asigna permisos al nuevo rol'}</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4 bg-white p-6 rounded-lg shadow-sm">
            {/* Información Básica */}            <div className="space-y-4">
              <h3 style={{ fontFamily: 'Playfair Display, serif' }} className="text-lg text-gray-900">Información Básica</h3>
              
              <div>
                <Label htmlFor="role-nombre" className="text-sm text-gray-700 block mb-2">Nombre del Rol <span className="text-red-600">*</span></Label>
                <Input
                  id="role-nombre"
                  type="text"
                  value={formData.nombre as string}
                  onChange={(e) => {
                    const value = e.target.value;
                    const cleaned = removeAt(value);
                    setFormData({ ...formData, nombre: cleaned });
                    if (cleaned.length > 0 && !/^[a-zA-Z][a-zA-Z0-9\s]*$/.test(cleaned)) {
                      setFormErrors({...formErrors, nombre: 'Debe comenzar con una letra. Números permitidos después del primer carácter (Ej: SUPERVISOR 2)'});
                    } else {
                      setFormErrors({...formErrors, nombre: ''});
                    }
                  }}
                  placeholder="Ej: SUPERVISOR 2"
                  disabled={editModalOpen && selectedRole?.preexistente}
                />
                {formErrors.nombre && <p className="text-red-600 text-sm mt-1">{formErrors.nombre}</p>}
              </div>

              <div>
                <label style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-700 block mb-2">Descripción <span className="text-red-600">*</span></label>
                <textarea 
                  value={formData.descripcion as string} 
                  onChange={(e) => { setFormData({ ...formData, descripcion: e.target.value }); if (formErrors.descripcion) setFormErrors({ ...formErrors, descripcion: '' }); }} 
                  style={{ fontFamily: 'Inter, sans-serif' }} 
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all min-h-[80px] ${formErrors.descripcion ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-[#d65391]'}`}
                  placeholder="Describe las responsabilidades de este rol" 
                />
                {formErrors.descripcion && <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-red-600 text-sm mt-1">{formErrors.descripcion}</p>}
              </div>

              <div>
                <label style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-700 block mb-2">Estado</label>
                <select 
                  value={formData.estado} 
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value as 'activo' | 'inactivo' })} 
                  style={{ fontFamily: 'Inter, sans-serif' }} 
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d65391]"
                >
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </div>
            </div>

            {/* Permisos */}
            <div className="border-t pt-6">
              <h3 style={{ fontFamily: 'Playfair Display, serif' }} className="text-lg text-gray-900 mb-4">Asignar Permisos</h3>
              <div className="space-y-4">
                {createPermisosEditables.map((modulo) => (
                  <div key={modulo.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <Checkbox 
                        checked={modulo.checked} 
                        onCheckedChange={() => handleToggleModuloCreate(modulo.id)} 
                        id={`create-module-${modulo.id}`} 
                      />
                      <label htmlFor={`create-module-${modulo.id}`} style={{ fontFamily: 'Inter, sans-serif' }} className="text-lg text-gray-900 cursor-pointer flex-1 font-medium">{modulo.name}</label>
                    </div>
                    <div className="pl-8 space-y-2">
                      {modulo.permissions.map((permiso) => (
                        <div key={permiso.id} className="flex items-center gap-3">
                          <Checkbox 
                            checked={permiso.checked} 
                            onCheckedChange={() => handleTogglePermisoCreate(modulo.id, permiso.id)} 
                            id={`create-perm-${permiso.id}`} 
                          />
                          <label htmlFor={`create-perm-${permiso.id}`} style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-700 cursor-pointer">{permiso.label}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Opciones especiales para el rol EMPLEADO */}
            {formData.nombre === 'EMPLEADO' && (
              <div className="border-t pt-6">
                <h3 style={{ fontFamily: 'Playfair Display, serif' }} className="text-lg text-gray-900 mb-4">Opciones de Empleado</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={formData.opcionesEmpleado?.accesoCaja || false}
                      onCheckedChange={(val) => setFormData({
                        ...formData,
                        opcionesEmpleado: { ...(formData.opcionesEmpleado || {}), accesoCaja: !!val }
                      })}
                      id="opt-acceso-caja"
                    />
                    <label htmlFor="opt-acceso-caja" style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-700 cursor-pointer">Acceso a caja</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={formData.opcionesEmpleado?.gestionarInventario || false}
                      onCheckedChange={(val) => setFormData({
                        ...formData,
                        opcionesEmpleado: { ...(formData.opcionesEmpleado || {}), gestionarInventario: !!val }
                      })}
                      id="opt-gestionar-inventario"
                    />
                    <label htmlFor="opt-gestionar-inventario" style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-700 cursor-pointer">Gestionar inventario</label>
                  </div>
                </div>
              </div>
            )}

            {/* Lista de usuarios de este rol para activarlos/desactivarlos */}
            {selectedRole && (
              <div className="border-t pt-6">
                <h3 style={{ fontFamily: 'Playfair Display, serif' }} className="text-lg text-gray-900 mb-4">Usuarios asignados</h3>
                {usuariosDelRol.length > 0 ? (
                  <div className="space-y-2">
                    {usuariosDelRol.map((u) => (
                      <div key={u.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                        <div>
                          <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm font-medium">{u.nombre}</p>
                          <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-600">{u.email}</p>
                        </div>
                        <button
                          onClick={() => toggleUserStatus(u.id)}
                          className={`px-3 py-1 rounded-lg text-sm ${u.estado === 'Activo' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}
                        >
                          {u.estado}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-500 italic">No hay usuarios asignados a este rol.</p>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 mt-6">
            <button onClick={() => { setCreateModalOpen(false); setEditModalOpen(false); }} style={{ fontFamily: 'Inter, sans-serif' }} className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">Cancelar</button>
            <button onClick={editModalOpen ? handleSaveEdit : handleSaveCreate} style={{ fontFamily: 'Inter, sans-serif' }} className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors">{editModalOpen ? 'Guardar Cambios' : 'Crear Rol'}</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Lista de Usuarios del Rol (con búsqueda) */}
      <Dialog open={usuariosModalOpen} onOpenChange={setUsuariosModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }}>
              Usuarios del rol <span className="text-[#d65391]">{selectedRole?.nombre}</span>
            </DialogTitle>
            <DialogDescription style={{ fontFamily: 'Inter, sans-serif' }}>
              Total: {usuariosDelRol.length} usuarios
            </DialogDescription>
          </DialogHeader>

          {/* Buscador */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar por nombre o documento..."
              value={usuariosSearchQuery}
              onChange={(e) => setUsuariosSearchQuery(e.target.value)}
              className="pl-10 border-gray-200 focus:ring-[#d65391] focus:border-[#d65391]"
              style={{ fontFamily: 'Inter, sans-serif' }}
            />
          </div>

          {/* Lista de Usuarios */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {usuariosDelRol.filter(usuario => 
              usuario.nombre.toLowerCase().includes(usuariosSearchQuery.toLowerCase()) ||
              usuario.email.toLowerCase().includes(usuariosSearchQuery.toLowerCase())
            ).length > 0 ? (
              usuariosDelRol
                .filter(usuario => 
                  usuario.nombre.toLowerCase().includes(usuariosSearchQuery.toLowerCase()) ||
                  usuario.email.toLowerCase().includes(usuariosSearchQuery.toLowerCase())
                )
                .map((usuario) => (
                  <div key={usuario.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex-1">
                      <p style={{ fontFamily: 'Inter, sans-serif' }} className="font-medium text-gray-900">{usuario.nombre}</p>
                      <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-600">{usuario.email}</p>
                    </div>
                    <span style={{ fontFamily: 'Inter, sans-serif' }} className={`px-3 py-1 rounded-full text-sm ${
                      usuario.estado === 'Activo' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {usuario.estado}
                    </span>
                  </div>
                ))
            ) : (
              <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-500 italic text-center py-6">
                {usuariosSearchQuery ? 'No se encontraron usuarios que coincidan con la búsqueda' : 'No hay usuarios en este rol'}
              </p>
            )}
          </div>

          <DialogFooter>
            <button 
              onClick={() => setUsuariosModalOpen(false)} 
              style={{ fontFamily: 'Inter, sans-serif' }} 
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cerrar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Eliminar */}
      <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ fontFamily: 'Playfair Display, serif' }}>¿Eliminar rol?</AlertDialogTitle>
            <AlertDialogDescription style={{ fontFamily: 'Inter, sans-serif' }}>
              {selectedRole && (
                <>
                  ¿Estás seguro de eliminar el rol "{selectedRole.nombre}"?
                  {selectedRole.usuarios > 0 && (<span className="block mt-2 text-red-600">Este rol tiene {selectedRole.usuarios} usuarios asignados. Deberás reasignarlos antes de eliminar.</span>)}
                  <span className="block mt-2">Esta acción no se puede deshacer.</span>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel style={{ fontFamily: 'Inter, sans-serif' }}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} style={{ fontFamily: 'Inter, sans-serif' }} className="bg-red-600 hover:bg-red-700">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
