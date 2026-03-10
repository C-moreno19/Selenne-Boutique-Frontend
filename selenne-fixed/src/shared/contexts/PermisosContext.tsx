import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Permission {
  id: string;
  label: string;
  checked: boolean;
}

export interface PermissionModule {
  id: string;
  name: string;
  permissions: Permission[];
  checked: boolean;
}

interface RolePermissions {
  [roleName: string]: PermissionModule[];
}

interface PermisosContextType {
  getPermisos: (roleName: string) => PermissionModule[];
  setPermisos: (roleName: string, permisos: PermissionModule[]) => void;
  tienePermiso: (roleName: string, permisoId: string) => boolean;
  tieneModuloActivo: (roleName: string, moduleId: string) => boolean;
  canAccessSection: (section: string) => boolean;
  canDelete: () => boolean;
}

const PermisosContext = createContext<PermisosContextType | undefined>(undefined);

const normalizeRoleName = (roleName: string): string => {
  const normalized = roleName.toUpperCase().trim();
  const roleMapping: { [key: string]: string } = {
    'VENDEDOR': 'EMPLEADO',
    'ADMIN': 'ADMINISTRADOR',
  };
  return roleMapping[normalized] || normalized;
};

const permisosIniciales: RolePermissions = {
  'ADMINISTRADOR': [],
  'EMPLEADO': [
    {
      id: 'productos',
      name: 'Módulo Productos',
      checked: true,
      permissions: [
        { id: 'productos_ver', label: 'Ver listado de productos', checked: true },
        { id: 'productos_crear', label: 'Crear productos', checked: false },
        { id: 'productos_editar', label: 'Editar productos', checked: false },
        { id: 'productos_eliminar', label: 'Eliminar productos', checked: false },
      ],
    },
    {
      id: 'ventas',
      name: 'Módulo Ventas',
      checked: true,
      permissions: [
        { id: 'ventas_ver', label: 'Ver listado de ventas', checked: true },
        { id: 'ventas_crear', label: 'Registrar ventas', checked: true },
        { id: 'ventas_editar', label: 'Editar ventas', checked: false },
        { id: 'ventas_anular', label: 'Anular ventas', checked: false },
      ],
    },
  ],
  'CLIENTE': [],
};

const sectionToModuleMapping: { [key: string]: string } = {
  'home': 'home',
  'productos': 'productos',
  'categorias': 'productos',
  'tallas': 'productos',
  'colores': 'productos',
  'materiales': 'productos',
  'marcas': 'productos',
  'tipos-producto': 'productos',
  'ventas': 'ventas',
  'roles': 'admin',
  'usuarios': 'admin',
  'proveedores': 'admin',
  'compras': 'admin',
  'pedidos': 'admin',
  'clientes': 'admin',
  'perfil': 'all',
  'mi-cuenta': 'all',
};

export const PermisosProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [permisosPorRol, setPermisosPorRol] = useState<RolePermissions>(() => {
    try {
      const storedPermisos = localStorage.getItem('permisosPorRol');
      if (storedPermisos) {
        return JSON.parse(storedPermisos);
      }
    } catch (error) {
      console.error('Error cargando permisos desde localStorage:', error);
    }
    localStorage.setItem('permisosPorRol', JSON.stringify(permisosIniciales));
    return permisosIniciales;
  });

  const getPermisos = (roleName: string): PermissionModule[] => {
    const normalizedRoleName = normalizeRoleName(roleName);
    return permisosPorRol[normalizedRoleName] || [];
  };

  const setPermisos = (roleName: string, permisos: PermissionModule[]) => {
    const normalizedRoleName = normalizeRoleName(roleName);
    const updatedPermisos = {
      ...permisosPorRol,
      [normalizedRoleName]: permisos
    };
    try {
      localStorage.setItem('permisosPorRol', JSON.stringify(updatedPermisos));
    } catch (error) {
      console.error('Error guardando permisos en localStorage:', error);
    }
    setPermisosPorRol(updatedPermisos);
  };

  const tienePermiso = (roleName: string, permisoId: string): boolean => {
    const normalizedRoleName = normalizeRoleName(roleName);
    if (normalizedRoleName === 'ADMINISTRADOR') return true;

    const permisos = getPermisos(roleName);
    for (const module of permisos) {
      const permiso = module.permissions.find(p => p.id === permisoId);
      if (permiso && permiso.checked) return true;
    }
    return false;
  };

  const tieneModuloActivo = (roleName: string, moduleId: string): boolean => {
    const normalizedRoleName = normalizeRoleName(roleName);
    if (normalizedRoleName === 'ADMINISTRADOR') return true;

    const permisos = getPermisos(roleName);
    const module = permisos.find(m => m.id === moduleId);
    if (module) {
      return module.permissions.some(p => p.checked);
    }
    return false;
  };

  const canAccessSection = (section: string): boolean => {
    try {
      const authData = localStorage.getItem('currentUser');
      if (authData) {
        const user = JSON.parse(authData);
        const normalizedRoleName = normalizeRoleName(user.role);

        if (normalizedRoleName === 'ADMINISTRADOR') return true;
        if (sectionToModuleMapping[section] === 'all') return true;

        const moduleId = sectionToModuleMapping[section];
        if (moduleId === 'productos' || moduleId === 'ventas') {
          return tieneModuloActivo(user.role, moduleId);
        }

        return false;
      }
    } catch (error) {
      console.error('Error verificando permisos de sección:', error);
    }
    return false;
  };

  const canDelete = (): boolean => {
    try {
      const authData = localStorage.getItem('currentUser');
      if (authData) {
        const user = JSON.parse(authData);
        const normalizedRoleName = normalizeRoleName(user.role);
        return normalizedRoleName === 'ADMINISTRADOR';
      }
    } catch (error) {
      console.error('Error verificando permisos de eliminación:', error);
    }
    return false;
  };

  return (
    <PermisosContext.Provider value={{
      getPermisos,
      setPermisos,
      tienePermiso,
      tieneModuloActivo,
      canAccessSection,
      canDelete
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