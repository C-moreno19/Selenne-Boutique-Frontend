import React, { useState, useEffect, lazy, Suspense } from 'react';
import { RecoverPasswordModal } from './features/auth/components/RecoverPasswordModal';
import { CustomAlert } from './features/auth/components/CustomAlert';
import { LandingView } from './features/landing';
import { Toaster } from './components/ui/sonner';

// Vistas cargadas bajo demanda: un visitante anonimo solo necesita LandingView.
// El panel admin arrastra recharts/jspdf/xlsx, asi que no debe ir en el bundle inicial.
const LoginView = lazy(() => import('./features/auth/pages/LoginView').then(m => ({ default: m.LoginView })));
const RegisterView = lazy(() => import('./features/auth/pages/RegisterView').then(m => ({ default: m.RegisterView })));
const DashboardView = lazy(() => import('./features/dashboard/components/DashboardView').then(m => ({ default: m.DashboardView })));
const ClienteView = lazy(() => import('./features/tienda/ClienteView').then(m => ({ default: m.ClienteView })));
const CheckoutView = lazy(() => import('./features/tienda/CheckoutView').then(m => ({ default: m.CheckoutView })));
import { AuthProvider, useAuth } from './shared/contexts/AuthContext';
import { PermisosProvider } from './shared/contexts/PermisosContext';
import { TiendaProvider } from './shared/contexts/TiendaContext';
import { ProductosProvider } from './shared/contexts/ProductosContext';
import { SubcategoriasProvider } from './shared/contexts/SubcategoriasContext';
import { SidebarProvider } from './shared/contexts/SidebarContext';
import { ComprasAdminProvider } from './shared/contexts/ComprasAdminContext';
import { PedidosAdminProvider } from './shared/contexts/PedidosAdminContext';
import { MensajesProvider } from './shared/contexts/MensajesContext';

type View = 'landing' | 'login' | 'register' | 'dashboard' | 'checkout';

interface Alert {
  type: 'success' | 'error' | 'info';
  message: string;
}

function MainApp() {
  const { user, authLoading } = useAuth();
  const [currentView, setCurrentView] = useState<View>(() => {
    try {
      const vistaGuardada = sessionStorage.getItem('_selenne_view') as View | null;
      if (vistaGuardada === 'landing' || vistaGuardada === 'dashboard' || vistaGuardada === 'checkout') {
        return vistaGuardada;
      }
      return sessionStorage.getItem('_selenne_user') ? 'dashboard' : 'landing';
    }
    catch { return 'landing'; }
  });

  // Recordar la vista actual para que un refresh (F5, ctrl+shift+r) no
  // saque al usuario del landing/tienda solo porque tiene sesion activa
  useEffect(() => {
    if (currentView === 'landing' || currentView === 'dashboard' || currentView === 'checkout') {
      try { sessionStorage.setItem('_selenne_view', currentView); } catch {}
    }
  }, [currentView]);
  const [isRecoverModalOpen, setIsRecoverModalOpen] = useState(false);
  const [alert, setAlert] = useState<Alert | null>(null);
  const [pendingCheckout, setPendingCheckout] = useState(false);

  // Si la restauración de sesión termina y no hay usuario, volver al landing
  useEffect(() => {
    if (!authLoading && !user && currentView === 'dashboard') {
      setCurrentView('landing');
    }
  }, [authLoading, user]);

  const showAlert = (type: 'success' | 'error' | 'info', message: string) => {
    setAlert({ type, message });
  };

  const closeAlert = () => {
    setAlert(null);
  };

  const handleLoginSuccess = () => {
    showAlert('success', 'Inicio de sesión exitoso. Redirigiendo…');
    setTimeout(() => {
      setCurrentView(pendingCheckout ? 'checkout' : 'dashboard');
      setPendingCheckout(false);
    }, 1500);
  };

  const handleLogout = () => {
    setCurrentView('landing');
    showAlert('info', 'Sesión cerrada exitosamente');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-[#d65391] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <Toaster position="top-center" />
      
      {alert && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 w-full max-w-md px-4" style={{ zIndex: 9999 }}>
          <CustomAlert
            type={alert.type}
            message={alert.message}
            onClose={closeAlert}
          />
        </div>
      )}

        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="w-8 h-8 border-4 border-[#d65391] border-t-transparent rounded-full animate-spin" />
          </div>
        }>
          {currentView === 'landing' ? (
            <LandingView
              onNavigateToLogin={() => setCurrentView('login')}
              onNavigateToRegister={() => setCurrentView('register')}
              onNavigateToCheckout={() => setCurrentView('checkout')}
              onNavigateToLoginForCheckout={() => { setPendingCheckout(true); setCurrentView('login'); }}
            />
          ) : currentView === 'checkout' ? (
            <CheckoutView onBack={() => setCurrentView('landing')} />
          ) : currentView === 'dashboard' ? (
            user?.role === 'Cliente' ? (
              <ClienteView onLogout={handleLogout} />
            ) : (
              <DashboardView onLogout={handleLogout} />
            )
          ) : currentView === 'login' ? (
            <LoginView
              onForgotPassword={() => setIsRecoverModalOpen(true)}
              onRegister={() => setCurrentView('register')}
              onShowAlert={showAlert}
              onLoginSuccess={handleLoginSuccess}
              onBack={() => setCurrentView('landing')}
            />
          ) : (
            <RegisterView
              onBackToLogin={() => setCurrentView('login')}
              onShowAlert={showAlert}
            />
          )}
        </Suspense>

      <RecoverPasswordModal
        isOpen={isRecoverModalOpen}
        onClose={() => setIsRecoverModalOpen(false)}
        onSuccess={showAlert.bind(null, 'success')}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <PermisosProvider>
        <SubcategoriasProvider>
          <ProductosProvider>
            <TiendaProvider>
              <SidebarProvider>
                <ComprasAdminProvider>
                  <PedidosAdminProvider>
                    <MensajesProvider>
                      <MainApp />
                    </MensajesProvider>
                  </PedidosAdminProvider>
                </ComprasAdminProvider>
              </SidebarProvider>
            </TiendaProvider>
          </ProductosProvider>
        </SubcategoriasProvider>
      </PermisosProvider>
    </AuthProvider>
  );
}