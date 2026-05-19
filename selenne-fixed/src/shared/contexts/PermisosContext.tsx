import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from './AuthContext';

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
  'home':              'admin:dashboard',
  'productos':         'productos:ver',
  'categorias':        'productos:ver',
  'tallas':            'productos:ver',
  'colores':           'productos:ver',
  'materiales':        'productos:ver',
  'marcas':            'productos:ver',
  'tipos-producto':    'productos:ver',
  'ventas':            'ventas:ver',
  'nueva-venta':       'ventas:crear',
  'pedidos':           'ventas:ver',
  'historial-ventas':  'ventas:ver',
  'clientes':          'clientes:ver',
  'compras':           'compras:ver',
  'nueva-compra':      'compras:crear',
  'historial-compras': 'compras:ver',
  'proveedores':       'compras:ver',
  'usuarios':          'usuarios:ver',
  'roles':             'roles:ver',
  'reportes':          'reportes:ventas',
  'configuracion':     'admin:dashboard',
  'notificaciones':    'admin:dashboard',
};

export const PermisosProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const userPermisos: string[] = user?.permisos || [];
  const esAdmin = (user?.role || '').toLowerCase().includes('admin');

  const hasPermiso = (permiso: string): boolean => {
    if (esAdmin) return true;
    return userPermisos.includes(permiso);
  };

  const canAccessSection = (section: string): boolean => {
    if (esAdmin) return true;
    // Secciones siempre accesibles (perfil personal)
    if (['perfil', 'mi-cuenta'].includes(section)) return true;

    const permiso = sectionToPermiso[section];
    if (!permiso) return false;
    return userPermisos.includes(permiso);
  };

  const canDelete = (): boolean => esAdmin;

  // Legacy methods for backward compatibility
  const getPermisos = (_roleName: string) => [];
  const setPermisos = (_roleName: string, _permisos: any[]) => {};
  const tienePermiso = (_roleName: string, permisoId: string) => hasPermiso(permisoId);
  const tieneModuloActivo = (_roleName: string, moduleId: string) => {
    if (esAdmin) return true;
    return userPermisos.some(p => p.startsWith(moduleId + ':'));
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