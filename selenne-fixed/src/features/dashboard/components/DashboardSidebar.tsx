import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
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
      className={`fixed left-0 top-0 h-screen bg-white border-r border-[#E7E0DA] flex flex-col z-40 transition-all duration-300 ${
        isOpen ? 'w-64' : 'w-0'
      }`}
      style={{ overflow: isOpen ? 'visible' : 'hidden' }}
    >
      <div className={`${isOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
        {/* Logo Header */}
        <div className="p-6 border-b border-[#E7E0DA]">
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => onSectionChange('home')}
          >
            <img src={imgLogo} alt="Selenne Boutique" className="h-8 w-auto transition-transform duration-300 group-hover:scale-105" />
            <span className="text-[18px] text-[#241B22] transition-colors group-hover:text-[#A3395C]">
              Selenne Boutique
            </span>
          </div>
        </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-3">
        <div className="mb-4 px-3">
          <span className="text-xs text-[#7d6f77] uppercase tracking-wider">
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
                  className={`group relative w-full flex items-center gap-3 pl-4 pr-3 py-2.5 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'text-[#A3395C] font-semibold bg-[#EFD9DF]'
                      : 'text-[#241B22] hover:bg-[#FBF8F5] hover:pl-5'
                  }`}
                >
                  <span
                    className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-full bg-[#A3395C] transition-all duration-200 ${
                      isActive ? 'h-5 opacity-100' : 'h-0 opacity-0 group-hover:h-3 group-hover:opacity-60'
                    }`}
                  />
                  <span className={`transition-colors duration-200 ${isActive ? 'text-[#A3395C]' : 'text-[#7d6f77] group-hover:text-[#A3395C]'}`}>
                    {item.icon}
                  </span>
                  <span className="text-sm flex-1 text-left">
                    {item.label}
                  </span>
                  {item.subItems && (
                    <ChevronRight
                      className={`w-4 h-4 transition-transform duration-200 ${isActive ? 'text-[#A3395C]' : 'text-[#7d6f77]'} ${isExpanded ? 'rotate-90' : ''}`}
                    />
                  )}
                </button>

                {/* Submenú Nivel 1 */}
                {item.subItems && (
                  <div
                    className="grid transition-[grid-template-rows] duration-300 ease-out"
                    style={{ gridTemplateRows: isExpanded ? '1fr' : '0fr' }}
                  >
                    <div className="overflow-hidden">
                      <div className="mt-1 ml-4 space-y-1 pb-1">
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
                                className={`group w-full flex items-center gap-2 pl-3 pr-3 py-2 rounded-lg transition-all duration-200 text-left ${
                                  isSubActive
                                    ? 'text-[#A3395C] font-semibold bg-[#EFD9DF]'
                                    : 'text-[#241B22] hover:bg-[#FBF8F5] hover:pl-4'
                                }`}
                              >
                                <span className="text-sm flex-1">
                                  {subItem.label}
                                </span>
                                {subItem.subItems && (
                                  <ChevronRight
                                    className={`w-3 h-3 transition-transform duration-200 ${isSubActive ? 'text-[#A3395C]' : 'text-[#7d6f77]'} ${isSubExpanded ? 'rotate-90' : ''}`}
                                  />
                                )}
                              </button>

                              {/* Submenú Nivel 2 (Anidado) */}
                              {subItem.subItems && (
                                <div
                                  className="grid transition-[grid-template-rows] duration-300 ease-out"
                                  style={{ gridTemplateRows: isSubExpanded ? '1fr' : '0fr' }}
                                >
                                  <div className="overflow-hidden">
                                    <div className="mt-1 ml-4 space-y-1 pb-1">
                                      {subItem.subItems.map((nestedItem, nestedIdx) => (
                                        <button
                                          key={nestedIdx}
                                          onClick={() => {
                                            if (nestedItem.id) {
                                              onSectionChange(nestedItem.id);
                                            }
                                          }}
                                          className={`w-full flex items-center gap-2 pl-3 pr-3 py-1.5 rounded-lg transition-all duration-200 text-left ${
                                            currentSection === nestedItem.id
                                              ? 'text-[#A3395C] font-semibold bg-[#EFD9DF]'
                                              : 'text-[#7d6f77] hover:bg-[#FBF8F5] hover:pl-4'
                                          }`}
                                        >
                                          <span className="text-xs">
                                            {nestedItem.label}
                                          </span>
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </nav>

      </div>
    </aside>
  );
};