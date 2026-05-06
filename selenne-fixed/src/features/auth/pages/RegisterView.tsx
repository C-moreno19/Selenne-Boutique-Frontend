import React, { useState } from 'react';
import { Check, X } from 'lucide-react';
import { CustomInput } from '../components/CustomInput';
import { CustomButton } from '../components/CustomButton';
import { SatinBackground } from '../components/SatinBackground';
import api from '../../../services/api';
import { useMensajes } from '../../../shared/contexts/MensajesContext';
import imgLogo from 'figma:asset/8184a8c16f30f2f7daa53602475d236bcd50c9b3.png';

interface RegisterViewProps {
  onBackToLogin: () => void;
  onShowAlert: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const RegisterView: React.FC<RegisterViewProps> = ({
  onBackToLogin,
  onShowAlert,
}) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
  });

  const [errors, setErrors] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
  });

  const [loading, setLoading] = useState(false);
  const { crearMensaje } = useMensajes();

  const passwordRules = {
    minLength: formData.password.length >= 9,
    maxLength: formData.password.length <= 20 && formData.password.length > 0,
    twoNumbers: (formData.password.match(/\d/g) || []).length >= 2,
    specialChar: /[^a-zA-Z0-9\s]/.test(formData.password),
  };

  const updateField = (field: string, value: string) => {
    // Validación en tiempo real según el campo
    if (field === 'fullName') {
      // Solo permitir letras y espacios (incluye acentos, ñ, ü)
      if (value && !/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]*$/.test(value)) {
        setErrors(prev => ({ ...prev, fullName: 'Solo se permiten letras' }));
        return; // Bloquear el carácter inválido
      } else {
        setErrors(prev => ({ ...prev, fullName: '' }));
      }
    } else if (field === 'phone') {
      // Solo permitir números
      if (value && !/^\d*$/.test(value)) {
        setErrors(prev => ({ ...prev, phone: 'Solo se permiten números' }));
        return; // Bloquear el carácter inválido
      } else {
        setErrors(prev => ({ ...prev, phone: '' }));
      }
    } else if (field === 'email') {
      // Validación básica de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (value && !emailRegex.test(value)) {
        setErrors(prev => ({ ...prev, email: 'Formato de email inválido' }));
      } else {
        setErrors(prev => ({ ...prev, email: '' }));
      }
    }

    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field !== 'email') {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors = {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      address: '',
    };

    let isValid = true;

    // Validate full name - no special characters
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Por favor ingresa tu nombre completo.';
      isValid = false;
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(formData.fullName)) {
      newErrors.fullName = 'El nombre no puede contener caracteres especiales.';
      isValid = false;
    }

    // Validate email
    if (!formData.email) {
      newErrors.email = 'Por favor ingresa tu email.';
      isValid = false;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Formato de email inválido.';
        isValid = false;
      }
    }

    // Validate password
    if (!formData.password) {
      newErrors.password = 'Por favor ingresa una contraseña.';
      isValid = false;
    } else if (!passwordRules.minLength || !passwordRules.maxLength || !passwordRules.twoNumbers || !passwordRules.specialChar) {
      newErrors.password = 'La contraseña no cumple con los requisitos.';
      isValid = false;
    }

    // Validate confirm password
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Por favor confirma tu contraseña.';
      isValid = false;
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden.';
      isValid = false;
    }

    // Validate phone - only numbers
    if (!formData.phone) {
      newErrors.phone = 'Ingresa un número de celular válido.';
      isValid = false;
    } else if (!/^\d+$/.test(formData.phone)) {
      newErrors.phone = 'El número de celular solo puede contener dígitos.';
      isValid = false;
    }

    // Validate address
    if (!formData.address.trim()) {
      newErrors.address = 'Por favor ingresa tu dirección.';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (validateForm()) {
      setLoading(true);
      try {
        const payload = {
          NombreCompleto: formData.fullName,
          Email: formData.email.toLowerCase().trim(),
          Contrasena: formData.password,
          Telefono: formData.phone,
          Direccion: formData.address || '',
        };
        
        // Llamar a /api/auth/signup del backend
        const response = await api.postJson('/api/auth/signup', payload);

        console.log('✅ Respuesta exitosa del servidor:', response);
        setLoading(false);

        // Notificar al admin
        crearMensaje({
          idVenta: '',
          emailCliente: formData.email.toLowerCase().trim(),
          remitente: 'cliente',
          contenido: `Nueva cuenta registrada: ${formData.fullName} (${formData.email.toLowerCase().trim()})`,
          tipo: 'nuevo-cliente',
          destinatarios: ['admin'],
        });

        // Éxito - mostrar mensaje
        onShowAlert('success', '✅ Cuenta creada exitosamente. Revisa tu correo para confirmar.');
        
        // Redirigir a login después de 3 segundos
        setTimeout(() => {
          onBackToLogin();
        }, 3000);

      } catch (error: any) {
        setLoading(false);
        
        console.error('❌ Error capturado:', error);
        console.error('Status del error:', error?.status);
        console.error('Body del error:', JSON.stringify(error?.data, null, 2));
        
        // Manejar errores específicos
        let errorMsg = 'Error al crear la cuenta. Intenta nuevamente.';
        
        if (error?.data) {
          // Intentar extraer el mensaje de diferentes formatos
          errorMsg = 
            error?.data?.message || 
            error?.data?.error || 
            error?.data?.Mensaje ||
            error?.data?.Message ||
            JSON.stringify(error?.data) ||
            'Error desconocido del servidor';
        }
        
        console.error('📋 Mensaje de error a mostrar:', errorMsg);
        
        if (error?.status === 409) {
          onShowAlert('error', '⚠️ Este email ya está registrado. Intenta con otro email.');
        } else if (error?.status === 400) {
          onShowAlert('error', `❌ ${errorMsg}`);
        } else if (error?.status === 500) {
          onShowAlert('error', '❌ Error del servidor. Intenta más tarde.');
        } else {
          onShowAlert('error', `❌ ${errorMsg}`);
        }
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
            className="text-[#000000]"
            style={{ 
              fontFamily: 'Playfair Display, serif',
              fontSize: '64px',
              lineHeight: '1.1',
              fontWeight: 'bold',
              letterSpacing: '-0.02em',
            }}
          >
            Selenne Boutique
          </h1>
          
          {/* Frase inspiradora */}
          <p 
            className="text-[#1a1a1a]" 
            style={{ 
              fontFamily: 'Playfair Display, serif',
              fontSize: '22px', 
              lineHeight: '1.6',
              fontWeight: '500',
              fontStyle: 'italic',
            }}
          >
            "Descubre prendas que realzan tu belleza y te hacen sentir única. Cada pieza está diseñada para acompañarte a brillar en cada momento."
          </p>
        </div>
      </div>

      {/* Register Panel - Right (45%) */}
      <div className="flex-1 lg:w-[45%] flex items-center justify-center bg-white px-16 py-12">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-8 flex flex-col items-center space-y-5">
            <img 
              src={imgLogo} 
              alt="Selenne Boutique" 
              className="w-[140px] h-auto object-contain"
            />
            <h1
              className="text-[#000000] text-center"
              style={{
                fontFamily: 'Playfair Display, serif',
                fontSize: '36px',
                fontWeight: 'bold',
              }}
            >
              Crear cuenta
            </h1>
          </div>

          {/* Form */}
          <div className="space-y-5">
            <CustomInput
              label="Nombre completo *"
              value={formData.fullName}
              onChange={(value) => updateField('fullName', value)}
              error={errors.fullName}
              placeholder="María García"
            />

            <CustomInput
              type="email"
              label="Email *"
              value={formData.email}
              onChange={(value) => updateField('email', value)}
              error={errors.email}
              placeholder="tu@email.com"
            />

            <CustomInput
              type="password"
              label="Contraseña *"
              value={formData.password}
              onChange={(value) => updateField('password', value)}
              error={errors.password}
              placeholder="••••••••"
              showPasswordToggle
            />

            {/* Indicador de requisitos de contraseña */}
            <div className="-mt-2 px-1 space-y-1.5">
              {[
                { ok: passwordRules.minLength, label: 'Más de 8 caracteres' },
                { ok: passwordRules.maxLength, label: 'Máximo 20 caracteres' },
                { ok: passwordRules.twoNumbers, label: 'Al menos 2 números' },
                { ok: passwordRules.specialChar, label: 'Al menos 1 carácter especial (!@#$%...)' },
              ].map(({ ok, label }) => (
                <div key={label} className="flex items-center gap-2">
                  {ok ? (
                    <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
                  ) : (
                    <X className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                  )}
                  <span
                    style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px' }}
                    className={ok ? 'text-green-500' : 'text-gray-300'}
                  >
                    {label}
                  </span>
                </div>
              ))}
            </div>

            <CustomInput
              type="password"
              label="Confirmar contraseña *"
              value={formData.confirmPassword}
              onChange={(value) => updateField('confirmPassword', value)}
              error={errors.confirmPassword}
              placeholder="••••••••"
              showPasswordToggle
            />

            <CustomInput
              type="tel"
              label="Número de celular *"
              value={formData.phone}
              onChange={(value) => updateField('phone', value)}
              error={errors.phone}
              placeholder="1234567890"
            />

            <CustomInput
              label="Dirección *"
              value={formData.address}
              onChange={(value) => updateField('address', value)}
              error={errors.address}
              placeholder="Calle Principal 123, Ciudad"
            />

            <CustomButton onClick={handleSubmit} loading={loading}>
              Crear cuenta
            </CustomButton>

            <div className="text-center pt-2">
              <button
                onClick={onBackToLogin}
                className="text-[#1a1a1a] hover:text-[#c84a8f] transition-all"
                style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px' }}
              >
                ¿Ya tienes una cuenta? <span className="underline">Inicia sesión</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
