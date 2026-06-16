import React, { useState } from 'react';
import {
  Search,
  MessageCircle,
  ChevronDown,
  LogOut,
  User,
  ShoppingBag,
  UserPlus,
  Mail,
  Menu
} from 'lucide-react';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { useSidebar } from '../../../shared/contexts/SidebarContext';
import { useMensajes } from '../../../shared/contexts/MensajesContext';
import { DashboardSection } from './DashboardView';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter, 
  DialogDescription 
} from '../../../components/ui/dialog';
import { toast } from 'sonner';
import imgLogo from 'figma:asset/8184a8c16f30f2f7daa53602475d236bcd50c9b3.png';

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

  const { obtenerMensajesAdmin, marcarComoLeido } = useMensajes();

  const adminMsgs = obtenerMensajesAdmin();
  const unreadMessages = adminMsgs.filter(m => !m.leido).length;

  const getMsgIcon = (tipo: string) => {
    switch (tipo) {
      case 'aprobacion': return <ShoppingBag className="w-4 h-4 text-green-600" />;
      case 'rechazo': return <ShoppingBag className="w-4 h-4 text-red-500" />;
      case 'pago-incompleto': return <ShoppingBag className="w-4 h-4 text-orange-500" />;
      case 'nuevo-cliente': return <UserPlus className="w-4 h-4 text-blue-500" />;
      case 'respuesta-cliente': return <Mail className="w-4 h-4 text-[#d65391]" />;
      default: return <Mail className="w-4 h-4 text-gray-500" />;
    }
  };

  const getMsgLabel = (tipo: string) => {
    switch (tipo) {
      case 'aprobacion': return 'Nuevo pedido aprobado';
      case 'rechazo': return 'Pedido rechazado';
      case 'pago-incompleto': return 'Pago incompleto';
      case 'nuevo-cliente': return 'Nuevo usuario registrado';
      case 'respuesta-cliente': return 'Respuesta de cliente';
      case 'consulta': return 'Consulta recibida';
      default: return 'Notificación';
    }
  };

  const getNavSection = (tipo: string): string | null => {
    if (['aprobacion','rechazo','pago-incompleto','notificacion'].includes(tipo)) return 'pedidos';
    if (tipo === 'nuevo-cliente') return 'usuarios';
    return null;
  };

  return (
    <>
      <header 
        className={`fixed top-0 right-0 h-20 bg-white border-b border-gray-200 z-30 transition-all duration-300 ${
          isOpen ? 'left-64' : 'left-0'
        }`}
      >
        <div className="h-full px-8 flex items-center justify-between gap-6">
          {/* Botón Hamburguesa + Logo */}
          <div className="flex items-center gap-4">
            <button
              onClick={toggleSidebar}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Toggle sidebar"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            {/* Logo Clickeable */}
            <div 
              className="cursor-pointer flex-shrink-0"
              onClick={() => onSectionChange('home')}
            >
              <img src={imgLogo} alt="Selenne Boutique" className="h-12 w-auto" />
            </div>
          </div>

          {/* Barra de Búsqueda Global */}
          <div className="flex-1 max-w-2xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar productos, usuarios, ventas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d65391] focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Iconos de Acción */}
          <div className="flex items-center gap-2">
            {/* Mensajes / Notificaciones unificado */}
            <button
              onClick={() => setMessagesOpen(true)}
              className="relative p-2.5 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              title="Mensajes y notificaciones"
            >
              <MessageCircle className="w-5 h-5" />
              {unreadMessages > 0 && (
                <span className="absolute top-1 right-1 w-5 h-5 bg-[#d65391] text-white text-xs rounded-full flex items-center justify-center">
                  {unreadMessages > 9 ? '9+' : unreadMessages}
                </span>
              )}
            </button>

            {/* Separador */}
            <div className="w-px h-8 bg-gray-200 mx-2"></div>

            {/* Menú de Usuario */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-[#d65391] to-[#f8a9c5] rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <div style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-900">
                    {user?.name}
                  </div>
                  <div style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-[#d65391]">
                    {user?.role}
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isUserMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsUserMenuOpen(false)}
                  />
                  <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[220px] z-50">
                    <button
                      onClick={() => {
                        onSectionChange('perfil');
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                    >
                      <User className="w-4 h-4 text-gray-600" />
                      <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-700">
                        Mi Perfil
                      </span>
                    </button>
                    <div className="border-t border-gray-200 my-2" />
                    <button
                      onClick={onLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 transition-colors text-left"
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

      {/* Modal unificado de Mensajes y Notificaciones */}
      <Dialog open={messagesOpen} onOpenChange={setMessagesOpen}>
        <DialogContent className="max-w-2xl h-auto flex flex-col p-0 gap-0">
          <DialogHeader className="px-8 pt-6 pb-4 border-b border-gray-200 flex-shrink-0">
            <DialogTitle style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-2xl">
              Mensajes
            </DialogTitle>
            <DialogDescription style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
              Pedidos nuevos, usuarios registrados y respuestas de correo
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            <div className="space-y-6 py-6 px-8">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <h3 style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="font-semibold text-gray-800 text-base">💬 Actividad reciente</h3>
                  {unreadMessages > 0 && (
                    <span className="px-2 py-0.5 bg-[#d65391] text-white text-xs rounded-full" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
                      {unreadMessages} sin leer
                    </span>
                  )}
                </div>
                <div className="divide-y divide-gray-100">
                  {adminMsgs.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageCircle className="w-10 h-10 mx-auto text-gray-200 mb-3" />
                      <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-400">
                        No hay mensajes por el momento
                      </p>
                    </div>
                  ) : (
                    adminMsgs.map(msg => {
                      const navSection = getNavSection(msg.tipo) as any;
                      return (
                        <div
                          key={msg.id}
                          onClick={() => {
                            marcarComoLeido(msg.id);
                            if (navSection) {
                              onSectionChange(navSection);
                              setMessagesOpen(false);
                            }
                          }}
                          className={`flex items-start gap-4 px-6 py-4 transition-colors cursor-pointer ${
                            msg.leido ? 'opacity-60' : 'hover:bg-pink-50'
                          }`}
                        >
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${msg.leido ? 'bg-gray-100' : 'bg-pink-100'}`}>
                            {getMsgIcon(msg.tipo)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs font-semibold text-[#d65391] uppercase tracking-wide">
                                {getMsgLabel(msg.tipo)}
                              </p>
                              <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                                {new Date(msg.fecha).toLocaleDateString('es-CO')}
                              </span>
                            </div>
                            <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-700 mt-0.5 truncate">
                              {msg.contenido}
                            </p>
                            {navSection && !msg.leido && (
                              <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-[#d65391] mt-1">
                                Clic para ir a {navSection === 'pedidos' ? 'Pedidos' : 'Usuarios'} →
                              </p>
                            )}
                          </div>
                          {!msg.leido && (
                            <div className="w-2 h-2 bg-[#d65391] rounded-full flex-shrink-0 mt-2" />
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 px-8 py-5 border-t border-gray-200 flex-shrink-0">
            {adminMsgs.some(m => !m.leido) && (
              <button
                onClick={() => {
                  adminMsgs.filter(m => !m.leido).forEach(m => marcarComoLeido(m.id));
                  toast.success('Todos los mensajes marcados como leídos');
                }}
                style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Marcar todos como leídos
              </button>
            )}
            <button
              onClick={() => setMessagesOpen(false)}
              style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
              className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Cerrar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};