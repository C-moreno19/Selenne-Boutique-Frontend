import React, { useState } from 'react';
import { 
  Search, 
  Bell, 
  MessageCircle, 
  HelpCircle, 
  ChevronDown, 
  LogOut, 
  User, 
  Settings, 
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

  // Estados para modales
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  // notificaciones y mensajes dinámicos a partir del contexto de Mensajes
  const { obtenerMensajesPorCliente, obtenerMensajesAdmin, marcarComoLeido } = useMensajes();

  // calculamos datos para el header a partir de lo que hay en el contexto
  // si es admin, mostrar todas las notificaciones; si es cliente, mostrar solo las suyas
  const notifications = (user?.role === 'ADMINISTRADOR' ? obtenerMensajesAdmin() : (user?.email ? obtenerMensajesPorCliente(user.email) : [])).map(m => ({
    id: m.id,
    titulo: m.tipo.charAt(0).toUpperCase() + m.tipo.slice(1),
    mensaje: m.contenido,
    tiempo: m.fecha,
    tipo: m.tipo,
    leido: m.leido,
  }));

  const unreadNotifications = notifications.filter(n => !n.leido).length;

  const messages = user?.email
    ? obtenerMensajesPorCliente(user.email).map(m => ({
        id: m.id,
        usuario: m.remitente === 'admin' ? 'Soporte' : m.emailCliente || 'Cliente',
        mensaje: m.contenido,
        tiempo: m.fecha,
        avatar: m.remitente === 'admin' ? 'AD' : m.emailCliente?.slice(0,2).toUpperCase() || '??',
        leido: m.leido,
      }))
    : [];

  const unreadMessages = messages.filter(m => !m.leido).length;

  const getNotificationIcon = (tipo: string) => {
    switch (tipo) {
      case 'alerta': 
        return '⚠️';
      case 'exito':
        return '✅';
      case 'error':
        return '❌';
      case 'info':
        return 'ℹ️';
      default:
        return '📢';
    }
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
                style={{ fontFamily: 'Inter, sans-serif' }}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d65391] focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Iconos de Acción */}
          <div className="flex items-center gap-2">
            {/* Notificaciones */}
            <button 
              onClick={() => setNotificationsOpen(true)}
              className="relative p-2.5 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifications > 0 && (
                <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadNotifications}
                </span>
              )}
            </button>

            {/* Mensajes */}
            <button 
              onClick={() => setMessagesOpen(true)}
              className="relative p-2.5 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              {unreadMessages > 0 && (
                <span className="absolute top-1 right-1 w-5 h-5 bg-[#d65391] text-white text-xs rounded-full flex items-center justify-center">
                  {unreadMessages}
                </span>
              )}
            </button>

            {/* Ayuda */}
            <button 
              onClick={() => setHelpOpen(true)}
              className="p-2.5 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              title="Algo"
            >
              <HelpCircle className="w-5 h-5" />
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
                  <div style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-900">
                    {user?.name}
                  </div>
                  <div style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-[#d65391]">
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
                      <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-700">
                        Mi Perfil
                      </span>
                    </button>
                    <div className="border-t border-gray-200 my-2" />
                    <button
                      onClick={onLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4 text-red-600" />
                      <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-red-600">
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

      {/* Modal de Notificaciones */}
      <Dialog open={notificationsOpen} onOpenChange={setNotificationsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }} className="text-2xl">
              🔔 Notificaciones
            </DialogTitle>
            <DialogDescription style={{ fontFamily: 'Inter, sans-serif' }}>
              Revisa tus notificaciones recientes
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-8">
                <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-gray-500">
                  No tienes notificaciones por el momento
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => marcarComoLeido(notif.id)}
                  className={`p-4 rounded-lg border-l-4 transition-all cursor-pointer ${
                    notif.leido
                      ? 'bg-gray-50 border-l-gray-300'
                      : 'bg-white border-l-[#d65391] shadow-sm hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">{getNotificationIcon(notif.tipo)}</span>
                    <div className="flex-1 min-w-0">
                      <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm font-semibold text-gray-900">
                        {notif.titulo}
                      </p>
                      <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-600 mt-1">
                        {notif.mensaje}
                      </p>
                      <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-400 mt-2 block">
                        {notif.tiempo}
                      </span>
                    </div>
                    {!notif.leido && (
                      <div className="w-2 h-2 bg-[#d65391] rounded-full flex-shrink-0 mt-2"></div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          <DialogFooter className="mt-4 pt-4 border-t">
            {notifications.length > 0 && (
              <button
                onClick={() => {
                  notifications.forEach(n => {
                    if (!n.leido) marcarComoLeido(n.id);
                  });
                  toast.success('Todas las notificaciones marcadas como leídas');
                  setNotificationsOpen(false);
                }}
                style={{ fontFamily: 'Inter, sans-serif' }}
                className="px-6 py-2 bg-[#d65391] text-white rounded-lg hover:bg-[#c14a7f] transition-colors font-medium"
              >
                Marcar todas como leídas
              </button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Mensajes */}
      <Dialog open={messagesOpen} onOpenChange={setMessagesOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }} className="text-2xl">
              ✉️ Mensajes
            </DialogTitle>
            <DialogDescription style={{ fontFamily: 'Inter, sans-serif' }}>
              Conversaciones y mensajes recientes
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-gray-500">
                  No hay mensajes por el momento
                </p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  onClick={() => marcarComoLeido(msg.id)}
                  className={`p-4 rounded-lg border-l-4 transition-all cursor-pointer ${
                    msg.leido
                      ? 'bg-gray-50 border-l-gray-300'
                      : 'bg-white border-l-[#d65391] shadow-sm hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#d65391] to-[#f8a9c5] rounded-full flex items-center justify-center flex-shrink-0">
                      <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-white text-xs font-bold">
                        {msg.avatar}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm font-semibold text-gray-900">
                          {msg.usuario}
                        </p>
                        <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-400 whitespace-nowrap ml-2">
                          {msg.tiempo}
                        </span>
                      </div>
                      <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-600 mt-1">
                        {msg.mensaje}
                      </p>
                    </div>
                    {!msg.leido && (
                      <div className="w-2 h-2 bg-[#d65391] rounded-full flex-shrink-0 mt-2"></div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          <DialogFooter className="mt-4 pt-4 border-t">
            <button
              onClick={() => setMessagesOpen(false)}
              style={{ fontFamily: 'Inter, sans-serif' }}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Cerrar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Ayuda */}
      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }} className="text-2xl">
              Centro de Ayuda
            </DialogTitle>
            <DialogDescription style={{ fontFamily: 'Inter, sans-serif' }}>
              Encuentra respuestas y documentación útil
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-[#d65391] to-[#f8a9c5] rounded-lg p-6 text-white">
              <h3 style={{ fontFamily: 'Playfair Display, serif' }} className="text-xl mb-2">
                ¿Necesitas ayuda?
              </h3>
              <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-white/90">
                Aquí encontrarás guías y recursos para usar el sistema
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                <h4 style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-900 mb-2">
                  📚 Guía de Inicio
                </h4>
                <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-600">
                  Aprende los conceptos básicos del sistema
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                <h4 style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-900 mb-2">
                  🎥 Video Tutoriales
                </h4>
                <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-600">
                  Tutoriales paso a paso en video
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                <h4 style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-900 mb-2">
                  💬 Soporte en Vivo
                </h4>
                <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-600">
                  Chatea con nuestro equipo de soporte
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                <h4 style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-900 mb-2">
                  ❓ Preguntas Frecuentes
                </h4>
                <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-600">
                  Respuestas a las dudas más comunes
                </p>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-600 mb-2">
                ¿Necesitas ayuda personalizada?
              </p>
              <button
                onClick={() => toast.info('Abriendo chat de soporte...')}
                style={{ fontFamily: 'Inter, sans-serif' }}
                className="w-full px-4 py-2 bg-[#d65391] text-white rounded-lg hover:bg-[#c14a7f] transition-colors"
              >
                Contactar Soporte
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};