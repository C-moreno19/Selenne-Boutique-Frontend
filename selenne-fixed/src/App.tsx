import React, { useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
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

interface Alert {
  type: 'success' | 'error' | 'info';
  message: string;
}

function MainApp() {
  const { user, authLoading } = useAuth();
  const navigate = useNavigate();
  const [isRecoverModalOpen, setIsRecoverModalOpen] = useState(false);
  const [alert, setAlert] = useState<Alert | null>(null);
  const [pendingCheckout, setPendingCheckout] = useState(false);

  const showAlert = (type: 'success' | 'error' | 'info', message: string) => {
    setAlert({ type, message });
  };

  const closeAlert = () => {
    setAlert(null);
  };

  const handleLoginSuccess = () => {
    showAlert('success', 'Inicio de sesión exitoso. Redirigiendo…');
    setTimeout(() => {
      navigate(pendingCheckout ? '/checkout' : '/dashboard', { replace: true });
      setPendingCheckout(false);
    }, 1500);
  };

  const handleLogout = () => {
    navigate('/', { replace: true });
    showAlert('info', 'Sesión cerrada exitosamente');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-[#A3395C] border-t-transparent rounded-full animate-spin" />
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
            <div className="w-8 h-8 border-4 border-[#A3395C] border-t-transparent rounded-full animate-spin" />
          </div>
        }>
          <Routes>
            <Route
              path="/"
              element={
                <LandingView
                  onNavigateToLogin={() => navigate('/login')}
                  onNavigateToRegister={() => navigate('/registro')}
                  onNavigateToLoginForCheckout={() => { setPendingCheckout(true); navigate('/login'); }}
                />
              }
            />
            <Route
              path="/tienda/:categoria"
              element={
                <LandingView
                  onNavigateToLogin={() => navigate('/login')}
                  onNavigateToRegister={() => navigate('/registro')}
                  onNavigateToLoginForCheckout={() => { setPendingCheckout(true); navigate('/login'); }}
                />
              }
            />
            <Route path="/checkout" element={<CheckoutView onBack={() => navigate('/')} />} />
            <Route
              path="/login"
              element={
                <LoginView
                  onForgotPassword={() => setIsRecoverModalOpen(true)}
                  onRegister={() => navigate('/registro')}
                  onShowAlert={showAlert}
                  onLoginSuccess={handleLoginSuccess}
                  onBack={() => navigate('/')}
                />
              }
            />
            <Route
              path="/registro"
              element={<RegisterView onBackToLogin={() => navigate('/login')} onShowAlert={showAlert} />}
            />
            <Route
              path="/dashboard/*"
              element={
                !user ? (
                  <Navigate to="/" replace />
                ) : user.role === 'Cliente' ? (
                  <ClienteView onLogout={handleLogout} />
                ) : (
                  <DashboardView onLogout={handleLogout} />
                )
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
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
    <BrowserRouter>
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
    </BrowserRouter>
  );
}
