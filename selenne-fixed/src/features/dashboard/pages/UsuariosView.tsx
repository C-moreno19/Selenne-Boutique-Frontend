import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Download,
  MoreVertical,
  Edit,
  Power,
  Mail,
  Trash2,
  ChevronRight,
  Users as UsersIcon,
  UserCheck,
  UserCog,
  ShoppingBag,
  Eye,
  X
} from 'lucide-react';
import { usePermisos } from '../../../shared/contexts/PermisosContext';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../../components/ui/alert-dialog';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { toast } from 'sonner';
import { lettersOnly, numbersOnly, removeSpaces } from '../../../shared/utils/validators';
// pagination removed — reverted to original listing

type UserType = 'ADMINISTRADOR' | 'EMPLEADO' | 'CLIENTE';
type UserStatus = 'Activo' | 'Inactivo' | 'Pendiente';

interface User {
  id: string;
  nombre: string;
  cargo: string;
  tipo: UserType;
  email: string;
  estado: UserStatus;
  fechaRegistro: string;
  avatar?: string;
  telefono?: string;
  direccion?: string;
}

export const UsuariosView: React.FC = () => {
  const { canDelete } = usePermisos();
  const { user: currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('todos');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Estados para modales
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Estados para formulario
  const [formData, setFormData] = useState<Partial<User>>({
    nombre: '',
    cargo: '',
    tipo: 'CLIENTE',
    email: '',
    estado: 'Activo',
    telefono: '',
    direccion: '',
  });
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

  const [users, setUsers] = useState<User[]>(() => {
    try {
      const stored = localStorage.getItem('selenne_users');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Asegurar que tengan ID
        return parsed.map((u: any) => ({
          id: u.id || `u-${Date.now()}-${Math.random()}`,
          nombre: u.nombre || u.name || '',
          cargo: u.cargo || 'Cliente',
          tipo: u.tipo || u.role || 'CLIENTE',
          email: u.email || '',
          estado: u.estado || 'Activo',
          fechaRegistro: u.fechaRegistro || new Date().toLocaleDateString(),
          telefono: u.telefono || '',
          direccion: u.direccion || '',
        }));
      }
    } catch (error) {
      console.error('Error loading usuarios from localStorage:', error);
    }

    // Datos iniciales si no hay en localStorage
    return [
      {
        id: '1',
        nombre: 'Ana María Gómez',
        cargo: 'Administrador',
        tipo: 'ADMINISTRADOR',
        email: 'ana@selenne.com',
        estado: 'Activo',
        fechaRegistro: '15/02/2024',
        telefono: '+57 300 123 4567',
        direccion: 'Calle 123 #45-67, Bogotá',
      },
      {
        id: '2',
        nombre: 'Carlos Rodríguez',
        cargo: 'Administrador',
        tipo: 'ADMINISTRADOR',
        email: 'carlos@selenne.com',
        estado: 'Activo',
        fechaRegistro: '20/02/2024',
        telefono: '+57 301 234 5678',
        direccion: 'Carrera 45 #12-34, Medellín',
      },
    ];
  });

  // Sincronizar con localStorage cuando hay cambios
      fechaRegistro: '01/04/2024',
  // Sincronizar con localStorage cuando hay cambios
  useEffect(() => {
    localStorage.setItem('selenne_users', JSON.stringify(users));
  }, [users]);

  // Escuchar cambios en localStorage desde otras pestañas/ventanas
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'selenne_users' && e.newValue) {
        try {
          const updated = JSON.parse(e.newValue);
          const formatted = updated.map((u: any) => ({
            id: u.id || `u-${Date.now()}-${Math.random()}`,
            nombre: u.nombre || u.name || '',
            cargo: u.cargo || 'Cliente',
            tipo: u.tipo || u.role || 'CLIENTE',
            email: u.email || '',
            estado: u.estado || 'Activo',
            fechaRegistro: u.fechaRegistro || new Date().toLocaleDateString(),
            telefono: u.telefono || '',
            direccion: u.direccion || '',
          }));
          setUsers(formatted);
        } catch (error) {
          console.error('Error updating users from storage:', error);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    
    // También recargar cuando se monta el componente para ver actualizaciones de otros contextos
    const reloadUsers = () => {
      try {
        const stored = localStorage.getItem('selenne_users');
        if (stored) {
          const parsed = JSON.parse(stored);
          const formatted = parsed.map((u: any) => ({
            id: u.id || `u-${Date.now()}-${Math.random()}`,
            nombre: u.nombre || u.name || '',
            cargo: u.cargo || 'Cliente',
            tipo: u.tipo || u.role || 'CLIENTE',
            email: u.email || '',
            estado: u.estado || 'Activo',
            fechaRegistro: u.fechaRegistro || new Date().toLocaleDateString(),
            telefono: u.telefono || '',
            direccion: u.direccion || '',
          }));
          setUsers(formatted);
        }
      } catch (error) {
        console.error('Error reloading users:', error);
      }
    };

    // Recargar cada 2 segundos para detectar cambios desde otros contextos
    const interval = setInterval(reloadUsers, 2000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Filtrar usuarios
  const filteredUsers = users.filter(user => {
    const searchLower = searchQuery.toLowerCase();
    return (
      user.nombre.toLowerCase().includes(searchLower) ||
      user.tipo.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.estado.toLowerCase().includes(searchLower) ||
      user.fechaRegistro.includes(searchLower)
    );
  });

  // pagination removed — show full filtered list

  // Stats for internal use (now unused but kept for reference)

  const getStatusColor = (estado: UserStatus) => {
    switch (estado) {
      case 'Activo':
        return 'bg-green-100 text-green-700';
      case 'Inactivo':
        return 'bg-gray-100 text-gray-700';
      case 'Pendiente':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeColor = (tipo: UserType) => {
    switch (tipo) {
      case 'ADMINISTRADOR':
        return 'bg-purple-100 text-purple-700';
      case 'EMPLEADO':
        return 'bg-blue-100 text-blue-700';
      case 'CLIENTE':
        return 'bg-pink-100 text-pink-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusDot = (estado: UserStatus) => {
    switch (estado) {
      case 'Activo':
        return '🟢';
      case 'Inactivo':
        return '🔴';
      case 'Pendiente':
        return '🟡';
      default:
        return '⚪';
    }
  };

  const getAvatarInitials = (nombre: string) => {
    const parts = nombre.split(' ');
    return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}` : parts[0][0];
  };

  const getAvatarColor = (tipo: UserType) => {
    switch (tipo) {
      case 'ADMINISTRADOR':
        return 'from-purple-500 to-purple-600';
      case 'EMPLEADO':
        return 'from-blue-500 to-blue-600';
      case 'CLIENTE':
        return 'from-pink-500 to-pink-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  // Funciones de modales
  const handleView = (user: User) => {
    setSelectedUser(user);
    setViewModalOpen(true);
    setActiveDropdown(null);
  };

  const handleCreate = () => {
    setFormData({
      nombre: '',
      cargo: '',
      tipo: 'CLIENTE',
      email: '',
      estado: 'Activo',
      telefono: '',
      direccion: '',
    });
    setFormErrors({});
    setCreateModalOpen(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setFormData({ ...user });
    setFormErrors({});
    setEditModalOpen(true);
    setActiveDropdown(null);
  };

  const handleDelete = (user: User) => {
    if (!canDelete()) {
      toast.error('No tienes permisos para eliminar usuarios');
      return;
    }
    setSelectedUser(user);
    setDeleteModalOpen(true);
    setActiveDropdown(null);
  };

  const confirmDelete = () => {
    if (selectedUser) {
      // Eliminar de usuarios
      setUsers(prev => prev.filter(u => u.id !== selectedUser.id));
      
      // Si es CLIENTE, también eliminarlo de clientes
      if (selectedUser.tipo === 'CLIENTE') {
        try {
          const clientes = JSON.parse(localStorage.getItem('selenne_users') || '[]');
          const clientesFiltrados = clientes.filter((c: any) => c.id !== selectedUser.id);
          localStorage.setItem('selenne_users', JSON.stringify(clientesFiltrados));
        } catch (error) {
          console.error('Error deteling client from clients storage:', error);
        }
      }
      
      toast.success('Usuario eliminado correctamente');
      setDeleteModalOpen(false);
      setSelectedUser(null);
    }
  };

  const handleChangeStatus = (user: User) => {
    const newStatus: UserStatus = user.estado === 'Activo' ? 'Inactivo' : 'Activo';
    setUsers(prev => 
      prev.map(u => u.id === user.id ? { ...u, estado: newStatus } : u)
    );
    toast.success(`Usuario ${newStatus === 'Activo' ? 'activado' : 'desactivado'} correctamente`);
    setActiveDropdown(null);
  };

  const handleResendInvitation = (user: User) => {
    toast.success(`Invitación reenviada a ${user.email}`);
    setActiveDropdown(null);
  };

  const handleExport = () => {
    toast.success('Exportando lista de usuarios...');
  };

  const handleSaveCreate = () => {
    // Validar errores de validación
    if (Object.values(formErrors).some(error => error !== '')) {
      toast.error('Por favor, corrige los errores antes de guardar');
      return;
    }

    if (!formData.nombre || !formData.email) {
      toast.error('Por favor completa los campos obligatorios');
      return;
    }

    const newUser: User = {
      id: String(users.length + 1),
      nombre: formData.nombre,
      cargo: formData.cargo || 'Usuario',
      tipo: formData.tipo || 'CLIENTE',
      email: formData.email,
      estado: formData.estado || 'Activo',
      fechaRegistro: new Date().toLocaleDateString('es-ES'),
      telefono: formData.telefono,
      direccion: formData.direccion,
    };

    setUsers(prev => [...prev, newUser]);
    setCreateModalOpen(false);
    
    // TODO: Integrar con API de email
    // Si es cliente, enviar correo con enlace para crear contraseña
    if (newUser.tipo === 'CLIENTE') {
      // Aquí se llamaría a un servicio de email para enviar:
      // - Nombre de usuario
      // - Enlace para crear contraseña
      // - Instrucciones de acceso
      // Simular envío de email
      setTimeout(() => {
        toast.success(`Correo enviado a ${newUser.email}. El cliente puede crear su contraseña`);
      }, 500);
    } else {
      toast.success('Usuario creado correctamente');
    }
  };

  const handleSaveEdit = () => {
    // Validar errores de validación
    if (Object.values(formErrors).some(error => error !== '')) {
      toast.error('Por favor, corrige los errores antes de guardar');
      return;
    }

    if (selectedUser) {
      setUsers(prev =>
        prev.map(u => u.id === selectedUser.id ? { ...u, ...formData } : u)
      );
      setEditModalOpen(false);
      toast.success('Usuario actualizado correctamente');
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-4">
        <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-500">
          Dashboard
        </span>
        <ChevronRight className="w-4 h-4 text-gray-400" />
        <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-900">
          Gestión de Usuarios
        </span>
      </div>

      {/* Header del Módulo */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <h1 style={{ fontFamily: 'Playfair Display, serif' }} className="text-[36px] text-gray-900">
            Gestión de Usuarios
          </h1>
          <span className="px-3 py-1 bg-[#d65391] text-white rounded-full text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
            {users.length.toLocaleString()}
          </span>
        </div>
        <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-gray-600">
          Administra todos los usuarios del sistema
        </p>
      </div>

      {/* Layout Tabla */}
      <div className="space-y-6">
          {/* Barra de Herramientas */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Búsqueda */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar usuarios..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ fontFamily: 'Inter, sans-serif' }}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d65391] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Filtros y Acciones */}
              <div className="flex flex-wrap gap-3">
                {/* Botón Exportar */}
                <button 
                  onClick={handleExport}
                  style={{ fontFamily: 'Inter, sans-serif' }}
                  className="px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Exportar
                </button>

                {/* Botón Nuevo Usuario */}
                <button 
                  onClick={handleCreate}
                  style={{ fontFamily: 'Inter, sans-serif' }}
                  className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  <Plus className="w-5 h-5" />
                  Nuevo Usuario
                </button>
              </div>
            </div>
          </div>

          {/* Tabla de Usuarios */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left" style={{ fontFamily: 'Inter, sans-serif' }}>
                      <span className="text-xs uppercase tracking-wider text-gray-600">USUARIO</span>
                    </th>
                    <th className="px-6 py-4 text-left" style={{ fontFamily: 'Inter, sans-serif' }}>
                      <span className="text-xs uppercase tracking-wider text-gray-600">TIPO</span>
                    </th>
                    <th className="px-6 py-4 text-left" style={{ fontFamily: 'Inter, sans-serif' }}>
                      <span className="text-xs uppercase tracking-wider text-gray-600">CORREO ELECTRÓNICO</span>
                    </th>
                    <th className="px-6 py-4 text-left" style={{ fontFamily: 'Inter, sans-serif' }}>
                      <span className="text-xs uppercase tracking-wider text-gray-600">ESTADO</span>
                    </th>
                    <th className="px-6 py-4 text-left" style={{ fontFamily: 'Inter, sans-serif' }}>
                      <span className="text-xs uppercase tracking-wider text-gray-600">FECHA REGISTRO</span>
                    </th>
                    <th className="px-6 py-4 text-left" style={{ fontFamily: 'Inter, sans-serif' }}>
                      <span className="text-xs uppercase tracking-wider text-gray-600">ACCIONES</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      {/* Usuario (avatar + nombre + rol) */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 bg-gradient-to-br ${getAvatarColor(user.tipo)} rounded-full flex items-center justify-center flex-shrink-0`}>
                            <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-white text-sm">
                              {getAvatarInitials(user.nombre)}
                            </span>
                          </div>
                          <div>
                            <div style={{ fontFamily: 'Inter, sans-serif' }} className="text-gray-900">
                              {user.nombre}
                            </div>
                            <div style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-500">
                              {user.cargo}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Tipo (badge) */}
                      <td className="px-6 py-4">
                        <span 
                          style={{ fontFamily: 'Inter, sans-serif' }} 
                          className={`px-3 py-1 rounded-full text-xs ${getTypeColor(user.tipo)}`}
                        >
                          {user.tipo}
                        </span>
                      </td>

                      {/* Email */}
                      <td className="px-6 py-4">
                        <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-600">
                          {user.email}
                        </span>
                      </td>

                      {/* Estado (badge con emoji) */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span>{getStatusDot(user.estado)}</span>
                          <span 
                            style={{ fontFamily: 'Inter, sans-serif' }} 
                            className={`px-3 py-1 rounded-full text-xs ${getStatusColor(user.estado)}`}
                          >
                            {user.estado}
                          </span>
                        </div>
                      </td>

                      {/* Fecha Registro */}
                      <td className="px-6 py-4">
                        <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-600">
                          {user.fechaRegistro}
                        </span>
                      </td>

                      {/* Acciones (dropdown) */}
                      <td className="px-6 py-4">
                        <div className="relative">
                          <button
                            onClick={() => setActiveDropdown(activeDropdown === user.id ? null : user.id)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <MoreVertical className="w-5 h-5 text-gray-600" />
                          </button>

                          {activeDropdown === user.id && (
                            <>
                              <div 
                                className="fixed inset-0 z-40" 
                                onClick={() => setActiveDropdown(null)}
                              />
                              <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[200px] z-50">
                                <button
                                  onClick={() => handleView(user)}
                                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors text-left"
                                >
                                  <Eye className="w-4 h-4 text-gray-600" />
                                  <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-700">
                                    Ver Detalles
                                  </span>
                                </button>
                                <button
                                  onClick={() => handleEdit(user)}
                                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors text-left"
                                >
                                  <Edit className="w-4 h-4 text-gray-600" />
                                  <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-700">
                                    Editar
                                  </span>
                                </button>
                                <button
                                  onClick={() => handleChangeStatus(user)}
                                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors text-left"
                                >
                                  <Power className="w-4 h-4 text-gray-600" />
                                  <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-700">
                                    Cambiar Estado
                                  </span>
                                </button>
                                {user.estado === 'Pendiente' && (
                                  <button
                                    onClick={() => handleResendInvitation(user)}
                                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors text-left"
                                  >
                                    <Mail className="w-4 h-4 text-gray-600" />
                                    <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-700">
                                      Reenviar Invitación
                                    </span>
                                  </button>
                                )}
                                {canDelete() && (
                                  <>
                                    <div className="border-t border-gray-200 my-2" />
                                    <button
                                      onClick={() => handleDelete(user)}
                                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-red-50 transition-colors text-left"
                                    >
                                      <Trash2 className="w-4 h-4 text-red-600" />
                                      <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-red-600">
                                        Eliminar
                                      </span>
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
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 border-t border-gray-200">
              <div>
                <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-600">
                  Mostrando <span className="text-gray-900">{filteredUsers.length}</span> usuarios
                </span>
              </div>
            </div>
          </div>
      </div>

      {/* Modal Ver Detalles */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }} className="text-2xl">
              Detalles del Usuario
            </DialogTitle>
            <DialogDescription style={{ fontFamily: 'Inter, sans-serif' }}>
              Información completa del usuario y su rol
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 bg-gradient-to-br ${getAvatarColor(selectedUser.tipo)} rounded-full flex items-center justify-center`}>
                  <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-white text-xl">
                    {getAvatarInitials(selectedUser.nombre)}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 style={{ fontFamily: 'Inter, sans-serif' }} className="text-xl text-gray-900 mb-1">
                    {selectedUser.nombre}
                  </h3>
                  <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-600">
                    {selectedUser.cargo}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs ${getStatusColor(selectedUser.estado)}`}>
                  {selectedUser.estado}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-600 block mb-1">
                    Tipo de Usuario
                  </label>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs ${getTypeColor(selectedUser.tipo)}`}>
                    {selectedUser.tipo}
                  </span>
                </div>
                <div>
                  <label style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-600 block mb-1">
                    Fecha de Registro
                  </label>
                  <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-gray-900">
                    {selectedUser.fechaRegistro}
                  </p>
                </div>
              </div>

              <div>
                <label style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-600 block mb-1">
                  Correo Electrónico
                </label>
                <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-gray-900">
                  {selectedUser.email}
                </p>
              </div>

              {selectedUser.telefono && (
                <div>
                  <label style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-600 block mb-1">
                    Teléfono
                  </label>
                  <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-gray-900">
                    {selectedUser.telefono}
                  </p>
                </div>
              )}

              {selectedUser.direccion && (
                <div>
                  <label style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-600 block mb-1">
                    Dirección
                  </label>
                  <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-gray-900">
                    {selectedUser.direccion}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <button
              onClick={() => setViewModalOpen(false)}
              style={{ fontFamily: 'Inter, sans-serif' }}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cerrar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Crear/Editar Usuario */}
      <Dialog open={createModalOpen || editModalOpen} onOpenChange={(open) => {
        if (!open) {
          setCreateModalOpen(false);
          setEditModalOpen(false);
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }} className="text-2xl">
              {editModalOpen ? 'Editar Usuario' : 'Nuevo Usuario'}
            </DialogTitle>
            <DialogDescription style={{ fontFamily: 'Inter, sans-serif' }}>
              {editModalOpen ? 'Modifica la información del usuario' : 'Completa los datos para registrar un nuevo usuario'}
            </DialogDescription>
          </DialogHeader>
          <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="user-nombre" className="text-sm text-gray-700 block mb-2">
                  Nombre Completo *
                </Label>
                <Input
                  id="user-nombre"
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => {
                    const value = lettersOnly(e.target.value);
                    setFormData({ ...formData, nombre: value });
                    if (!/^[a-zA-Z\s]+$/.test(value)) {
                      setFormErrors({...formErrors, nombre: 'Solo se permiten letras y espacios'});
                    } else {
                      setFormErrors({...formErrors, nombre: ''});
                    }
                  }}
                  placeholder="Juan Pérez"
                />
                {formErrors.nombre && <p className="text-red-600 text-sm mt-1">{formErrors.nombre}</p>}
              </div>
              <div>
                <Label htmlFor="user-cargo" className="text-sm text-gray-700 block mb-2">
                  Cargo
                </Label>
                <Input
                  id="user-cargo"
                  type="text"
                  value={formData.cargo}
                  onChange={(e) => {
                    const value = lettersOnly(e.target.value);
                    setFormData({ ...formData, cargo: value });
                    if (value && !/^[a-zA-Z\s]+$/.test(value)) {
                      setFormErrors({...formErrors, cargo: 'Solo se permiten letras y espacios'});
                    } else {
                      setFormErrors({...formErrors, cargo: ''});
                    }
                  }}
                  placeholder="Vendedor"
                />
                {formErrors.cargo && <p className="text-red-600 text-sm mt-1">{formErrors.cargo}</p>}
              </div>
            </div>

            <div>
              <label style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-700 block mb-2">
                Correo Electrónico *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: removeSpaces(e.target.value) })}
                style={{ fontFamily: 'Inter, sans-serif' }}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d65391]"
                placeholder="correo@ejemplo.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-700 block mb-2">
                  Tipo de Usuario
                </label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value as UserType })}
                  style={{ fontFamily: 'Inter, sans-serif' }}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d65391]"
                >
                  <option value="ADMINISTRADOR">Administrador</option>
                  <option value="EMPLEADO">Empleado</option>
                  <option value="CLIENTE">Cliente</option>
                </select>
              </div>
              <div>
                <label style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-700 block mb-2">
                  Estado
                </label>
                <select
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value as UserStatus })}
                  style={{ fontFamily: 'Inter, sans-serif' }}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d65391]"
                >
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                  <option value="Pendiente">Pendiente</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-700 block mb-2">
                Teléfono
              </label>
              <input
                type="tel"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: numbersOnly(e.target.value) })}
                style={{ fontFamily: 'Inter, sans-serif' }}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d65391]"
                placeholder="+57 300 123 4567"
              />
            </div>

            <div>
              <label style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-700 block mb-2">
                Dirección
              </label>
              <textarea
                value={formData.direccion}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                style={{ fontFamily: 'Inter, sans-serif' }}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d65391] min-h-[80px]"
                placeholder="Calle 123 #45-67, Ciudad"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <button
              onClick={() => {
                setCreateModalOpen(false);
                setEditModalOpen(false);
              }}
              style={{ fontFamily: 'Inter, sans-serif' }}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={editModalOpen ? handleSaveEdit : handleSaveCreate}
              style={{ fontFamily: 'Inter, sans-serif' }}
              className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              {editModalOpen ? 'Guardar Cambios' : 'Crear Usuario'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Confirmar Eliminación */}
      <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ fontFamily: 'Playfair Display, serif' }}>
              ¿Eliminar usuario?
            </AlertDialogTitle>
            <AlertDialogDescription style={{ fontFamily: 'Inter, sans-serif' }}>
              {selectedUser && (
                <>
                  ¿Estás seguro de eliminar a "{selectedUser.nombre}"? Esta acción no se puede deshacer.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel style={{ fontFamily: 'Inter, sans-serif' }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              style={{ fontFamily: 'Inter, sans-serif' }}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
