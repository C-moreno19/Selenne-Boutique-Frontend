import React, { useState } from 'react';
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardHeader } from './DashboardHeader';
import { DashboardHome } from '../pages/DashboardHome';
import { VentasView } from '../pages/VentasView';
import { HistorialVentasView } from '../pages/HistorialVentasView';
import { ClientesView } from '../pages/ClientesView';
import { NuevaCompraView } from '../pages/NuevaCompraView';
import { NuevaVentaView } from '../pages/NuevaVentaView';
import { PedidosView } from '../pages/PedidosView';
import { RolesView } from '../pages/RolesView';
import { UsuariosView } from '../pages/UsuariosView';
import { ProveedoresView } from '../pages/ProveedoresView';
import { ComprasView } from '../pages/ComprasView';
import { HistorialComprasView } from '../pages/HistorialComprasView';
import { PerfilView } from '../pages/PerfilView';
import { ProductosView } from '../pages/ProductosView';
import { CategoriasView } from '../pages/CategoriasView';
import { TallasView } from '../pages/TallasView';
import { ColoresView } from '../pages/ColoresView';
import { MaterialesView } from '../pages/MaterialesView';
import { MarcasView } from '../pages/MarcasView';
import { TiposProductoView } from '../pages/TiposProductoView';
import { NotificacionesAdminView } from '../pages/NotificacionesAdminView';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { usePermisos } from '../../../shared/contexts/PermisosContext';
import { useSidebar } from '../../../shared/contexts/SidebarContext';


export type DashboardSection = 
  | 'home'
  | 'productos' 
  | 'categorias'
  | 'tallas'
  | 'colores'
  | 'materiales'
  | 'marcas'
  | 'tipos-producto'
  | 'roles'
  | 'usuarios'
  | 'ventas'
  | 'historial-ventas'
  | 'nueva-venta'
  | 'pedidos'
  | 'clientes'
  | 'nueva-compra'
  | 'proveedores'
  | 'compras'
  | 'historial-compras'
  | 'perfil'
  | 'mi-cuenta'
  | 'notificaciones';

interface DashboardViewProps {
  onLogout: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onLogout }) => {
  const { refreshPermisos } = useAuth();
  const { canAccessSection } = usePermisos();
  const { isOpen } = useSidebar();

  // Al montar el dashboard, refrescar el JWT para tener permisos actualizados del servidor
  React.useEffect(() => {
    refreshPermisos();
  }, []);
  const [currentSection, setCurrentSectionState] = useState<DashboardSection>(() => {
    const saved = localStorage.getItem('currentSection') as DashboardSection;
    if (saved) return saved;
    return 'home';
  });

  const setCurrentSection = (section: DashboardSection) => {
    setCurrentSectionState(section);
    localStorage.setItem('currentSection', section);
  };

  const renderContent = () => {
    // Verificar permisos antes de renderizar
    if (!canAccessSection(currentSection)) {
      return (
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="text-center max-w-md mx-auto px-6">
            <div className="mb-6 text-7xl">🔒</div>
            <h2 style={{ fontFamily: 'Playfair Display, serif' }} className="text-3xl text-gray-900 mb-3">
              Sin acceso
            </h2>
            <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-gray-500 mb-2">
              No tienes permisos para ver esta sección.
            </p>
            <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-gray-400 text-sm">
              Pídele al administrador que te asigne los permisos necesarios.
            </p>
          </div>
        </div>
      );
    }

    switch (currentSection) {
      case 'home':
        return <DashboardHome />;
      case 'productos':
        return <ProductosView />;
      case 'categorias':
        return <CategoriasView />;
      case 'tallas':
        return <TallasView />;
      case 'colores':
        return <ColoresView />;
      case 'materiales':
        return <MaterialesView />;
      case 'marcas':
        return <MarcasView />;
      case 'tipos-producto':
        return <TiposProductoView />;
      case 'roles':
        return <RolesView />;
      case 'usuarios':
        return <UsuariosView />;
      case 'ventas':
        return <VentasView onNavigateToHistorial={() => setCurrentSection('historial-ventas')} />;
      case 'historial-ventas':
        return <HistorialVentasView onBack={() => setCurrentSection('ventas')} />;
      case 'nueva-venta':
        return <NuevaVentaView onBack={() => setCurrentSection('ventas')} onSuccess={() => setCurrentSection('ventas')} />;
      case 'pedidos':
        return <PedidosView />;
      case 'clientes':
        return <ClientesView />;
      case 'nueva-compra':
        return <NuevaCompraView onBack={() => setCurrentSection('compras')} onSuccess={() => setCurrentSection('compras')} />;
      case 'proveedores':
        return <ProveedoresView />;
      case 'compras':
        return <ComprasView onNavigateToHistorial={() => setCurrentSection('historial-compras')} />;
      case 'historial-compras':
        return <HistorialComprasView onBack={() => setCurrentSection('compras')} />;
      case 'perfil':
      case 'mi-cuenta':
        return <PerfilView />;
      case 'notificaciones':
        return <NotificacionesAdminView />;
      default:
        return <div>Sección no encontrada</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar Izquierdo */}
      <DashboardSidebar
        currentSection={currentSection}
        onSectionChange={setCurrentSection}
      />

      {/* Header Superior */}
      <DashboardHeader
        currentSection={currentSection}
        onSectionChange={setCurrentSection}
        onLogout={onLogout}
      />

      {/* Contenido Principal */}
      <main 
        className={`pt-20 min-h-screen transition-all duration-300 ${
          isOpen ? 'ml-64' : 'ml-0'
        }`}
      >
        {renderContent()}
      </main>
    </div>
  );
};