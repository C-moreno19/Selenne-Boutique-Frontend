import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  UserCog, 
  Package, 
  ShoppingCart, 
  ChevronDown,
  ChevronRight,
  Settings
} from 'lucide-react';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { usePermisos } from '../../../shared/contexts/PermisosContext';
import { useSidebar } from '../../../shared/contexts/SidebarContext';
import { DashboardSection } from './DashboardView';
import imgLogo from 'figma:asset/8184a8c16f30f2f7daa53602475d236bcd50c9b3.png';

interface DashboardSidebarProps {
  currentSection: DashboardSection;
  onSectionChange: (section: DashboardSection) => void;
}

interface SubMenuItem {
  id: DashboardSection;
  label: string;
  subItems?: SubMenuItem[];
}

interface MenuItem {
  id?: DashboardSection;
  label: string;
  icon: React.ReactNode;
  requiredPermissions?: string[];
  subItems?: SubMenuItem[];
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  currentSection,
  onSectionChange,
}) => {
  const { user } = useAuth();
  const { canAccessSection } = usePermisos();
  const { isOpen } = useSidebar();
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});

  const menuItems: MenuItem[] = [
    { 
      id: 'home', 
      label: 'Dashboard', 
      icon: <LayoutDashboard className="w-5 h-5" /> 
    },
    { 
      label: 'Gestión de Productos', 
      icon: <Package className="w-5 h-5" />,
      requiredPermissions: ['productos'],
      subItems: [
        { id: 'productos', label: 'Lista de Productos' },
        { id: 'colores', label: 'Colores' },
        { id: 'tallas', label: 'Tallas' },
        { id: 'materiales', label: 'Materiales' },
        { id: 'marcas', label: 'Marcas' },
        { id: 'categorias', label: 'Categorías' },
        { id: 'tipos-producto', label: 'Tipos de Producto' }
      ]
    },
    { 
      label: 'Compras', 
      icon: <Package className="w-5 h-5" />,
      requiredPermissions: ['compras'],
      subItems: [
        { id: 'compras', label: 'Gestión de Compras' },
        { id: 'proveedores', label: 'Proveedores' }
      ]
    },
    { 
      label: 'Gestión de Ventas', 
      icon: <ShoppingCart className="w-5 h-5" />,
      subItems: [
        { id: 'pedidos', label: 'Pedidos' },
        { id: 'ventas', label: 'Ventas' },
        { id: 'clientes', label: 'Clientes' }
      ]
    },
    { 
      label: 'Usuarios', 
      icon: <Users className="w-5 h-5" />,
      requiredPermissions: ['usuarios'],
      subItems: [
        { id: 'usuarios', label: 'Gestión de Usuarios' }
      ]
    },
    { 
      label: 'Configuración', 
      icon: <Settings className="w-5 h-5" />,
      requiredPermissions: [],
      subItems: [
        { id: 'roles', label: 'Gestión de Roles' }
      ]
    }
  ];

  const isAdmin = (user?.role || '').toLowerCase().includes('admin');

  const visibleMenuItems = menuItems.filter(item => {
    // Admin ve todo
    if (isAdmin) return true;
    // Item directo sin subitems (ej: Dashboard)
    if (item.id && !item.subItems) {
      return canAccessSection(item.id);
    }
    // Item con subitems: visible si al menos uno es accesible
    if (item.subItems) {
      return item.subItems.some(subItem =>
        subItem.id ? canAccessSection(subItem.id) : false
      );
    }
    return false;
  }).map(item => {
    // Filtrar subitems también
    if (isAdmin || !item.subItems) return item;
    return {
      ...item,
      subItems: item.subItems.filter(subItem =>
        !subItem.id || canAccessSection(subItem.id)
      )
    };
  });

  // expandExclusive removed — la apertura exclusiva ahora ocurre solo al hacer click (gestión en `toggleMenu`).

  /**
   * Toggle: si se abre, lo hace de forma exclusiva; si se cierra, sólo cierra esa clave.
   */
  const toggleMenu = (menuLabel: string) => {
    setExpandedMenus(prev => {
      const isOpen = !!prev[menuLabel];
      if (isOpen) {
        return { ...prev, [menuLabel]: false };
      }
      // apertura exclusiva
      const top = menuLabel.split('-')[0];
      const next: Record<string, boolean> = {};
      next[top] = true;
      if (menuLabel !== top) next[menuLabel] = true;
      return next;
    });
  };

  // Verificar si algún subitem o subitem anidado está seleccionado
  const isSubItemActive = (item: MenuItem | SubMenuItem): boolean => {
    if (!item.subItems) {
      return item.id === currentSection;
    }
    return item.subItems.some(subItem => {
      if (subItem.id === currentSection) return true;
      if (subItem.subItems) {
        return subItem.subItems.some(nestedItem => nestedItem.id === currentSection);
      }
      return false;
    });
  };

  return (
    <aside 
      className={`fixed left-0 top-0 h-screen bg-white border-r border-gray-200 flex flex-col z-40 transition-all duration-300 ${
        isOpen ? 'w-64' : 'w-0'
      }`}
      style={{ overflow: isOpen ? 'visible' : 'hidden' }}
    >
      <div className={`${isOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
        {/* Logo Header */}
        <div className="p-6 border-b border-gray-200">
          <div 
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => onSectionChange('home')}
          >
            <img src={imgLogo} alt="Selenne Boutique" className="h-8 w-auto" />
            <span 
              style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} 
              className="text-[18px] text-gray-900"
            >
              Selenne Boutique
            </span>
          </div>
        </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-3">
        <div className="mb-4 px-3">
          <span 
            style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} 
            className="text-xs text-gray-500 uppercase tracking-wider"
          >
            NAVEGACIÓN
          </span>
        </div>
        
        <div className="space-y-1">
          {visibleMenuItems.map((item, idx) => {
            const menuKey = item.label;
            const isExpanded = expandedMenus[menuKey];
            const isActive = item.id === currentSection || isSubItemActive(item);

            return (
              <div key={idx}>
                {/* Item Principal */}
                <button
                  onClick={() => {
                    if (item.subItems) {
                      toggleMenu(menuKey);
                    } else if (item.id) {
                      onSectionChange(item.id);
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 transition-all ${
                    isActive
                      ? 'text-gray-900 font-medium bg-gray-50'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  style={isActive ? { boxShadow: '0 3px 0 rgba(214, 83, 145, 0.3)' } : {}}
                >
                  <span className={isActive ? 'text-[#d65391]' : 'text-gray-500'}>
                    {item.icon}
                  </span>
                  <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm flex-1 text-left">
                    {item.label}
                  </span>
                  {item.subItems && (
                    <span className={isActive ? 'text-[#d65391]' : 'text-gray-500'}>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </span>
                  )}
                </button>

                {/* Submenú Nivel 1 */}
                {item.subItems && isExpanded && (
                  <div className="mt-1 ml-4 space-y-1">
                    {item.subItems.map((subItem, subIdx) => {
                      const subMenuKey = `${menuKey}-${subItem.label}`;
                      const isSubExpanded = expandedMenus[subMenuKey];
                      const isSubActive = subItem.id === currentSection || (subItem.subItems && subItem.subItems.some(nested => nested.id === currentSection));

                      return (
                        <div key={subIdx}>
                          <button
                            onClick={() => {
                              if (subItem.subItems) {
                                toggleMenu(subMenuKey);
                              } else if (subItem.id) {
                                onSectionChange(subItem.id);
                              }
                            }}
                            className={`w-full flex items-center gap-2 px-3 py-2 transition-all text-left ${
                              isSubActive
                                ? 'text-gray-900 font-medium bg-gray-50'
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                            style={isSubActive ? { boxShadow: '0 3px 0 rgba(214, 83, 145, 0.3)' } : {}}
                          >
                            <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm flex-1">
                              {subItem.label}
                            </span>
                            {subItem.subItems && (
                              <span className={isSubActive ? 'text-white' : 'text-gray-500'}>
                                {isSubExpanded ? (
                                  <ChevronDown className="w-3 h-3" />
                                ) : (
                                  <ChevronRight className="w-3 h-3" />
                                )}
                              </span>
                            )}
                          </button>

                          {/* Submenú Nivel 2 (Anidado) */}
                          {subItem.subItems && isSubExpanded && (
                            <div className="mt-1 ml-4 space-y-1">
                              {subItem.subItems.map((nestedItem, nestedIdx) => (
                                <button
                                  key={nestedIdx}
                                  onClick={() => {
                                    if (nestedItem.id) {
                                      onSectionChange(nestedItem.id);
                                    }
                                  }}
                                  className={`w-full flex items-center gap-2 px-3 py-1.5 transition-all text-left ${
                                    currentSection === nestedItem.id
                                      ? 'text-gray-900 font-medium bg-gray-50'
                                      : 'text-gray-600 hover:bg-gray-50'
                                  }`}
                                  style={currentSection === nestedItem.id ? { boxShadow: '0 3px 0 rgba(214, 83, 145, 0.3)' } : {}}
                                >
                                  <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs">
                                    {nestedItem.label}
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </nav>

        {/* User Info Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 bg-gradient-to-br from-[#d65391] to-[#f8a9c5] rounded-full flex items-center justify-center flex-shrink-0">
              <UserCog className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-900 truncate">
                {user?.name}
              </div>
              <div style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-[#d65391] truncate">
                {user?.role}
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};