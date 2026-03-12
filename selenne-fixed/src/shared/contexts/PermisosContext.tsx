import React, { createContext, useContext, ReactNode } from 'react';

interface PermisosContextType {
  canAccessSection: (section: string) => boolean;
  canDelete: () => boolean;
  hasPermiso: (permiso: string) => boolean;
  // Legacy compatibility
  getPermisos: (roleName: string) => any[];
  setPermisos: (roleName: string, permisos: any[]) => void;
  tienePermiso: (roleName: string, permisoId: string) => boolean;
  tieneModuloActivo: (roleName: string, moduleId: string) => boolean;
}

const PermisosContext = createContext<PermisosContextType | undefined>(undefined);

// Mapeo de sección del sidebar → permiso requerido en BD
const sectionToPermiso: { [key: string]: string } = {
  'productos':      'productos:ver',
  'categorias':     'productos:ver',
  'tallas':         'productos:ver',
  'colores':        'productos:ver',
  'materiales':     'productos:ver',
  'marcas':         'productos:ver',
  'tipos-producto': 'productos:ver',
  'ventas':         'ventas:ver',
  'pedidos':        'ventas:ver',
  'clientes':       'ventas:ver',
  'compras':        'usuarios:ver',
  'usuarios':       'usuarios:ver',
  'roles':          'roles:ver',
  'reportes':       'reportes:ver',
  'configuracion':  'admin:dashboard',
};

const getUser = () => {
  try {
    const stored = localStorage.getItem('currentUser');
    return stored ? JSON.parse(stored) : null;
  } catch { return null; }
};

const getUserPermisos = (): string[] => {
  const user = getUser();
  return user?.permisos || [];
};

const isAdmin = (): boolean => {
  const user = getUser();
  const role = (user?.role || '').toLowerCase();
  return role.includes('admin');
};

export const PermisosProvider: React.FC<{ children: ReactNode }> = ({ children }) => {

  const hasPermiso = (permiso: string): boolean => {
    if (isAdmin()) return true;
    return getUserPermisos().includes(permiso);
  };

  const canAccessSection = (section: string): boolean => {
    if (isAdmin()) return true;
    // Secciones siempre accesibles
    if (['home', 'perfil', 'mi-cuenta', 'dashboard'].includes(section)) return true;

    const permiso = sectionToPermiso[section];
    if (!permiso) return false;
    return getUserPermisos().includes(permiso);
  };

  const canDelete = (): boolean => isAdmin();

  // Legacy methods for backward compatibility
  const getPermisos = (_roleName: string) => [];
  const setPermisos = (_roleName: string, _permisos: any[]) => {};
  const tienePermiso = (_roleName: string, permisoId: string) => hasPermiso(permisoId);
  const tieneModuloActivo = (_roleName: string, moduleId: string) => {
    if (isAdmin()) return true;
    const permisos = getUserPermisos();
    return permisos.some(p => p.startsWith(moduleId + ':'));
  };

  return (
    <PermisosContext.Provider value={{
      canAccessSection,
      canDelete,
      hasPermiso,
      getPermisos,
      setPermisos,
      tienePermiso,
      tieneModuloActivo,
    }}>
      {children}
    </PermisosContext.Provider>
  );
};

export const usePermisos = () => {
  const context = useContext(PermisosContext);
  if (context === undefined) {
    throw new Error('usePermisos debe ser usado dentro de un PermisosProvider');
  }
  return context;
};