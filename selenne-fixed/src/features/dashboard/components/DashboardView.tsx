import React, { useState } from 'react';
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardHeader } from './DashboardHeader';
import { DashboardHome } from '../pages/DashboardHome';
import { EmpleadoHome } from '../pages/EmpleadoHome';
import { VentasView } from '../pages/VentasView';
import { ClientesView } from '../pages/ClientesView';
import { NuevaCompraView } from '../pages/NuevaCompraView';
import { NuevaVentaView } from '../pages/NuevaVentaView';
import { PedidosView } from '../pages/PedidosView';
import { RolesView } from '../pages/RolesView';
import { UsuariosView } from '../pages/UsuariosView';
import { ProveedoresView } from '../pages/ProveedoresView';
import { ComprasView } from '../pages/ComprasView';
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
  | 'nueva-venta'
  | 'pedidos'
  | 'clientes'
  | 'nueva-compra'
  | 'proveedores'
  | 'compras'
  | 'perfil'
  | 'mi-cuenta'
  | 'notificaciones';

interface DashboardViewProps {
  onLogout: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onLogout }) => {
  const { user } = useAuth();
  const { canAccessSection } = usePermisos();
  const { isOpen } = useSidebar();
  const [currentSection, setCurrentSection] = useState<DashboardSection>(
    user?.role === 'Empleado' ? 'productos' : 'home'
  );

  const renderContent = () => {
    // Verificar permisos antes de renderizar
    if (!canAccessSection(currentSection)) {
      return (
        <div className="p-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="mb-4 text-6xl">🔒</div>
            <h2 style={{ fontFamily: 'Playfair Display, serif' }} className="text-2xl text-gray-900 mb-2">
              Acceso Restringido
            </h2>
            <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-gray-600">
              No tienes permisos para acceder a esta sección
            </p>
          </div>
        </div>
      );
    }

    switch (currentSection) {
      case 'home':
        return user?.role === 'Empleado' ? <EmpleadoHome /> : <DashboardHome />;
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
        return <VentasView onNavigateToNuevaVenta={() => setCurrentSection('nueva-venta')} />;
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
        return <ComprasView onNavigateToNuevaCompra={() => setCurrentSection('nueva-compra')} />;
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
