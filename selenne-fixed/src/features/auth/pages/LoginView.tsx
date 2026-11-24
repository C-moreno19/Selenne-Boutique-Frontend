import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { CustomInput } from '../components/CustomInput';
import { CustomButton } from '../components/CustomButton';
import { SatinBackground } from '../components/SatinBackground';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { Logo } from '../../../components/Logo';

interface LoginViewProps {
  onForgotPassword: () => void;
  onRegister: () => void;
  onShowAlert: (type: 'success' | 'error' | 'info', message: string) => void;
  onLoginSuccess?: () => void;
  onBack?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onForgotPassword,
  onRegister,
  onShowAlert,
  onLoginSuccess,
  onBack,
}) => {
  const { loginAsync } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateEmail = (email: string): boolean => {
    if (!email) {
      setEmailError('Por favor ingresa tu email.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Formato de email inválido.');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePassword = (password: string): boolean => {
    if (!password) {
      setPasswordError('Escribe tu contraseña.');
      return false;
    }
    if (password.length < 6) {
      setPasswordError('La contraseña debe tener al menos 6 caracteres.');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleSubmit = async () => {
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (isEmailValid && isPasswordValid) {
      setLoading(true);
      try {
        // Validar contra el backend
        const success = await loginAsync(email, password);
        setLoading(false);
        if (success) {
          if (onLoginSuccess) {
            onLoginSuccess();
          } else {
            onShowAlert('success', 'Inicio de sesión exitoso. Redirigiendo…');
          }
        } else {
          // Login falló - credenciales inválidas
          onShowAlert('error', 'Email o contraseña incorrectos. Verifica tus datos.');
        }
      } catch (error) {
        setLoading(false);
        onShowAlert('error', 'Error al conectar con el servidor. Intenta nuevamente.');
        console.error('Login error:', error);
      }
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Hero Section - Left (55%) */}
      <div
        className="hidden lg:flex lg:w-[55%] h-full p-12 flex-col justify-center items-start relative overflow-hidden"
      >
        <SatinBackground />
        <div className="max-w-[450px] ml-12 relative z-10 space-y-6">
          {/* Título */}
          <motion.h1
            className="text-white"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontFamily: '"Playfair Display", Georgia, "Iowan Old Style", "Palatino Linotype", "Times New Roman", serif',
              fontSize: '64px',
              lineHeight: '1.1',
              fontWeight: 500,
              letterSpacing: '0.01em',
            }}
          >
            District Store
          </motion.h1>

          {/* Frase inspiradora */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
              fontSize: '17px',
              lineHeight: '1.7',
              fontWeight: '400',
              fontStyle: 'italic',
              color: '#C9A8C3',
            }}
          >
            "Streetwear y esenciales para hombre y mujer. Piezas con actitud, hechas para la calle."
          </motion.p>
        </div>
      </div>

      {/* Login Panel - Right (45%) */}
      <div className="flex-1 lg:w-[45%] h-full overflow-hidden relative bg-white dark:bg-[#17101f]">
        {/* Back arrow — fijo arriba a la izquierda del panel */}
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
            className="absolute top-6 left-6 sm:left-10 flex items-center gap-2 border border-[#E7E0DA] dark:border-[#3A2E4D] px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#241B22] dark:text-[#F5F3FA] hover:bg-[#0A0A0A] hover:text-white hover:border-[#0A0A0A] transition-colors z-10"
          >
            <ArrowLeft size={14} />
            Volver a la tienda
          </button>
        )}
        <div className="min-h-full flex items-center justify-center px-16 py-8">
        <div className="w-full max-w-md space-y-5">
          {/* Logo */}
          <motion.div
            className="flex justify-center mb-4"
            initial={{ opacity: 0, y: -28, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <Logo className="w-[130px] h-[130px]" />
          </motion.div>

          {/* Form */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
            className="space-y-5 border border-[#E7E0DA] dark:border-[#3A2E4D] p-6 sm:p-8"
          >
            <CustomInput
              type="email"
              label="Email *"
              value={email}
              onChange={(value) => {
                setEmail(value);
                setEmailError('');
              }}
              error={emailError}
              placeholder="tu@email.com"
            />

            <div>
              <CustomInput
                type="password"
                label="Contraseña *"
                value={password}
                onChange={(value) => {
                  setPassword(value);
                  setPasswordError('');
                }}
                error={passwordError}
                showPasswordToggle
              />
              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  onClick={onForgotPassword}
                  className="text-[#5C2A52] hover:underline transition-all"
                  style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', fontSize: '14px' }}
                >
                  Recuperar contraseña
                </button>
              </div>
            </div>

            <CustomButton type="submit" onClick={handleSubmit} loading={loading}>
              INICIAR SESIÓN
            </CustomButton>

            <div className="text-center pt-4">
              <button
                type="button"
                onClick={onRegister}
                className="text-[#1a1a1a] dark:text-[#F5F3FA] hover:text-[#5C2A52] transition-all"
                style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', fontSize: '14px' }}
              >
                ¿No tienes cuenta? <span className="underline">Registrarse</span>
              </button>
            </div>
          </form>
        </div>
        </div>
      </div>
    </div>
  );
};
