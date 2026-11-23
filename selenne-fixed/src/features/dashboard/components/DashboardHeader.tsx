import React, { useState } from 'react';
import {
  Search,
  Bell,
  ChevronDown,
  LogOut,
  User,
  CheckCheck,
  Loader2,
  Menu
} from 'lucide-react';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { useSidebar } from '../../../shared/contexts/SidebarContext';
import { useNotificaciones } from '../../../shared/hooks/useNotificaciones';
import { NotificacionCard } from '../../../components/NotificacionCard';
import { DashboardSection } from './DashboardView';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '../../../components/ui/dialog';
import { Logo } from '../../../components/Logo';

const FONT_SANS = '"Helvetica Neue", Helvetica, Arial, sans-serif';

interface DashboardHeaderProps {
  currentSection: DashboardSection;
  onSectionChange: (section: DashboardSection) => void;
  onLogout: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  currentSection,
  onSectionChange,
  onLogout,
}) => {
  const { user } = useAuth();
  const { isOpen, toggleSidebar } = useSidebar();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [messagesOpen, setMessagesOpen] = useState(false);

  const { notificaciones, loading, noLeidas, marcarLeida, marcarTodas, cargar } = useNotificaciones();

  const getNavSection = (referencia?: string): DashboardSection | null => {
    if (!referencia) return null;
    if (referencia.startsWith('pedido-') || referencia.startsWith('pedido:')) return 'pedidos';
    if (referencia.startsWith('usuario-')) return 'usuarios';
    if (referencia.startsWith('producto-')) return 'productos';
    return null;
  };

  return (
    <>
      <header 
        className={`fixed top-0 right-0 h-20 bg-white dark:bg-[#1e1530] border-b border-[#E7E0DA] dark:border-[#3A2E4D] z-30 transition-all duration-300 ${
          isOpen ? 'left-64' : 'left-0'
        }`}
      >
        <div className="h-full px-8 flex items-center justify-between gap-6">
          {/* Botón Hamburguesa + Logo */}
          <div className="flex items-center gap-4">
            <button
              onClick={toggleSidebar}
              className="p-2 text-gray-600 dark:text-[#b9aedd] hover:bg-gray-100 dark:hover:bg-[#241935] rounded-lg transition"
              aria-label="Toggle sidebar"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            {/* Logo Clickeable */}
            <div 
              className="cursor-pointer flex-shrink-0"
              onClick={() => onSectionChange('home')}
            >
              <Logo className="h-12 w-12" />
            </div>
          </div>

          {/* Barra de Búsqueda Global */}
          <div className="flex-1 max-w-2xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-[#b9aedd]" />
              <input
                type="text"
                placeholder="Buscar productos, usuarios, ventas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                className="w-full pl-12 pr-4 py-3 bg-[#F7F5FC] dark:bg-[#17101f] dark:text-[#F5F3FA] dark:placeholder-[#b9aedd] border border-[#E7E0DA] dark:border-[#3A2E4D] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5C2A52] focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Iconos de Acción */}
          <div className="flex items-center gap-2">
            {/* Mensajes / Notificaciones unificado */}
            <button
              onClick={() => setMessagesOpen(true)}
              className="relative p-2.5 text-gray-600 dark:text-[#b9aedd] hover:bg-[#F7F5FC] dark:hover:bg-[#17101f] rounded-lg transition"
              title="Mensajes y notificaciones"
            >
              <Bell className="w-5 h-5" />
              {noLeidas > 0 && (
                <span className="absolute top-1 right-1 w-5 h-5 bg-[#5C2A52] text-white text-xs rounded-full flex items-center justify-center">
                  {noLeidas > 9 ? '9+' : noLeidas}
                </span>
              )}
            </button>

            {/* Separador */}
            <div className="w-px h-8 bg-gray-200 dark:bg-[#3A2E4D] mx-2"></div>

            {/* Menú de Usuario */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#F7F5FC] dark:hover:bg-[#17101f] transition"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-[#5C2A52] to-[#C9A8C3] rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <div style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-[#0A0A0A] dark:text-[#F5F3FA]">
                    {user?.name}
                  </div>
                  <div style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-[#5C2A52]">
                    {user?.role}
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 dark:text-[#b9aedd] transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isUserMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsUserMenuOpen(false)}
                  />
                  <div className="absolute top-full right-0 mt-2 bg-white dark:bg-[#1e1530] rounded-lg shadow-lg border border-[#E7E0DA] dark:border-[#3A2E4D] py-2 min-w-[220px] z-50">
                    <button
                      onClick={() => {
                        onSectionChange('perfil');
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#F7F5FC] dark:hover:bg-[#17101f] transition text-left"
                    >
                      <User className="w-4 h-4 text-gray-600 dark:text-[#b9aedd]" />
                      <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-700 dark:text-[#F5F3FA]">
                        Mi Perfil
                      </span>
                    </button>
                    <div className="border-t border-[#E7E0DA] dark:border-[#3A2E4D] my-2" />
                    <button
                      onClick={onLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 transition text-left"
                    >
                      <LogOut className="w-4 h-4 text-red-600" />
                      <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-red-600">
                        Cerrar Sesión
                      </span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Modal de Mensajes / Actividad reciente */}
      <Dialog open={messagesOpen} onOpenChange={(v) => { setMessagesOpen(v); if (v) cargar(); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-8 pt-6 pb-4 border-b border-[#E7E0DA] dark:border-[#3A2E4D] flex-shrink-0">
            <div className="flex items-center gap-2">
              <DialogTitle style={{ fontFamily: FONT_SANS }} className="text-2xl">
                Actividad reciente
              </DialogTitle>
              <button onClick={cargar} className="p-1.5 hover:bg-[#F7F5FC] dark:hover:bg-[#241935] rounded-lg transition" title="Actualizar">
                <Loader2 className={`w-4 h-4 text-gray-400 dark:text-[#b9aedd] ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <DialogDescription style={{ fontFamily: FONT_SANS }}>
              Pedidos nuevos, usuarios registrados y alertas de stock
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            <div className="space-y-3 py-6 px-8">
              {loading && notificaciones.length === 0 ? (
                <div className="flex flex-col items-center py-16 gap-3">
                  <Loader2 className="w-7 h-7 animate-spin text-[#5C2A52]" />
                  <p style={{ fontFamily: FONT_SANS }} className="text-sm text-gray-400 dark:text-[#b9aedd]">Cargando actividad...</p>
                </div>
              ) : notificaciones.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-[#fdf2f8] dark:bg-[#241935] rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bell className="w-7 h-7 text-[#5C2A52]" />
                  </div>
                  <p style={{ fontFamily: FONT_SANS }} className="text-sm text-gray-400 dark:text-[#b9aedd]">
                    No hay actividad por el momento
                  </p>
                </div>
              ) : (
                notificaciones.map(n => {
                  const navSection = getNavSection(n.referencia);
                  return (
                    <NotificacionCard
                      key={n.notificacionID}
                      notif={n}
                      referenciaLabel={navSection === 'usuarios' ? 'Ver usuarios' : navSection === 'productos' ? 'Ver producto' : 'Ver pedido'}
                      onVerReferencia={navSection ? () => { onSectionChange(navSection); setMessagesOpen(false); } : undefined}
                      onClick={() => {
                        if (!n.leida) marcarLeida(n.notificacionID);
                        if (navSection) { onSectionChange(navSection); setMessagesOpen(false); }
                      }}
                    />
                  );
                })
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 px-8 py-5 border-t border-[#E7E0DA] dark:border-[#3A2E4D] flex-shrink-0">
            {noLeidas > 0 && (
              <button
                onClick={marcarTodas}
                style={{ fontFamily: FONT_SANS }}
                className="flex items-center gap-2 px-6 py-2 bg-gray-100 dark:bg-[#221830] text-gray-700 dark:text-[#F5F3FA] rounded-lg hover:bg-gray-200 dark:hover:bg-[#241935] transition"
              >
                <CheckCheck className="w-4 h-4" /> Marcar todo leído
              </button>
            )}
            <button
              onClick={() => setMessagesOpen(false)}
              style={{ fontFamily: FONT_SANS }}
              className="px-6 py-2 bg-gradient-to-r from-[#0A0A0A] via-[#3B0A45] to-[#5C2A52] text-white rounded-lg hover:opacity-90 transition"
            >
              Cerrar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};