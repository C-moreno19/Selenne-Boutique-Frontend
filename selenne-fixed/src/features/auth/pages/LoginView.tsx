import React, { useState } from 'react';
import { CustomInput } from '../components/CustomInput';
import { CustomButton } from '../components/CustomButton';
import { SatinBackground } from '../components/SatinBackground';
import { useAuth } from '../../../shared/contexts/AuthContext';
import imgLogo from 'figma:asset/8184a8c16f30f2f7daa53602475d236bcd50c9b3.png';

interface LoginViewProps {
  onForgotPassword: () => void;
  onRegister: () => void;
  onShowAlert: (type: 'success' | 'error' | 'info', message: string) => void;
  onLoginSuccess?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onForgotPassword,
  onRegister,
  onShowAlert,
  onLoginSuccess,
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
    <div className="flex min-h-screen w-full">
      {/* Hero Section - Left (55%) */}
      <div 
        className="hidden lg:flex lg:w-[55%] p-12 flex-col justify-center items-start relative overflow-hidden"
      >
        <SatinBackground />
        <div className="max-w-[450px] ml-12 relative z-10 space-y-7">
          {/* Título */}
          <h1
            style={{
              fontFamily: '"Times New Roman", Times, serif',
              fontSize: '88px',
              lineHeight: '1.1',
              fontWeight: 'bold',
              letterSpacing: '-0.02em',
              color: '#000000',
            }}
          >
            <span className="block" style={{ fontFamily: '"Times New Roman", Times, serif' }}>Selenne</span>
            <span className="block" style={{ fontFamily: '"Times New Roman", Times, serif', paddingLeft: '5.5rem' }}>Boutique</span>
          </h1>

          {/* Frase inspiradora */}
          <p
            style={{
              fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
              fontSize: '18px',
              lineHeight: '1.6',
              fontWeight: '400',
              fontStyle: 'italic',
              color: '#000000',
              textAlign: 'center',
            }}
          >
            "Descubre prendas que realzan tu belleza y te hacen sentir única. Cada pieza está diseñada para acompañarte a brillar en cada momento."
          </p>
        </div>
      </div>

      {/* Login Panel - Right (45%) */}
      <div className="flex-1 lg:w-[45%] flex items-center justify-center bg-white px-16 py-12">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="flex justify-center mb-10">
            <img 
              src={imgLogo} 
              alt="Selenne Boutique" 
              className="w-[160px] h-auto object-contain"
            />
          </div>

          {/* Form */}
          <div className="space-y-6">
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
                label="Password *"
                value={password}
                onChange={(value) => {
                  setPassword(value);
                  setPasswordError('');
                }}
                error={passwordError}
                placeholder="••••••••"
                showPasswordToggle
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={onForgotPassword}
                  className="text-[#c84a8f] hover:underline transition-all"
                  style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', fontSize: '14px' }}
                >
                  Recuperar contraseña
                </button>
              </div>
            </div>

            <CustomButton onClick={handleSubmit} loading={loading}>
              SIGN IN
            </CustomButton>

            <div className="text-center pt-4">
              <button
                onClick={onRegister}
                className="text-[#1a1a1a] hover:text-[#c84a8f] transition-all"
                style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', fontSize: '14px' }}
              >
                ¿No tienes cuenta? <span className="underline">Registrarse</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
