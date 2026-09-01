import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { CustomInput } from "./CustomInput";
import { CustomButton } from "./CustomButton";
import api from "../../../services/api";

interface RecoverPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export const RecoverPasswordModal: React.FC<RecoverPasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [emailError, setEmailError] = useState("");
  const [codeError, setCodeError] = useState("");
  const [newPasswordError, setNewPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  const [loading, setLoading] = useState(false);

  const validateEmail = (email: string): boolean => {
    if (!email) {
      setEmailError("Ingresa tu email.");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError("Formato incorrecto.");
      return false;
    }
    setEmailError("");
    return true;
  };

  const handleSendCode = async () => {
    if (validateEmail(email)) {
      setLoading(true);
      try {
        const payload = { Email: email.toLowerCase().trim() };
        console.log('📧 Enviando forgot-password:', payload);
        
        const response = await api.postJson('/api/auth/forgot-password', payload);
        
        console.log('✅ Email enviado:', response);
        setLoading(false);
        setStep("code");
        onSuccess("✅ Hemos enviado un código de recuperación a tu correo. Revísalo en tu bandeja de entrada.");
      } catch (error: any) {
        setLoading(false);
        console.error('❌ Error en forgot-password:', error);
        const errorMsg = error?.data?.message || error?.data?.error || 'Error al enviar el email. Intenta nuevamente.';
        onSuccess(`❌ ${errorMsg}`);
      }
    }
  };

  const validateCodeForm = (): boolean => {
    let isValid = true;

    if (!code) {
      setCodeError("Ingresa el token recibido.");
      isValid = false;
    } else if (code.length < 10) {
      setCodeError("El token debe ser más largo. Verifica que lo copiaste completo.");
      isValid = false;
    } else {
      setCodeError("");
    }

    if (!newPassword) {
      setNewPasswordError("Ingresa una nueva contraseña.");
      isValid = false;
    } else if (newPassword.length < 6) {
      setNewPasswordError("La contraseña debe tener al menos 6 caracteres.");
      isValid = false;
    } else {
      setNewPasswordError("");
    }

    if (!confirmPassword) {
      setConfirmPasswordError("Confirma tu nueva contraseña.");
      isValid = false;
    } else if (newPassword !== confirmPassword) {
      setConfirmPasswordError("Las contraseñas no coinciden.");
      isValid = false;
    } else {
      setConfirmPasswordError("");
    }

    return isValid;
  };

  const handleResetPassword = async () => {
    if (validateCodeForm()) {
      setLoading(true);
      try {
        const payload = { 
          Token: code,  // El código que ingresó el usuario
          NuevaContrasena: newPassword  // Sin tilde, como espera el backend
        };
        console.log('🔐 Enviando reset-password para:', email);
        
        const response = await api.postJson('/api/auth/reset-password', payload);
        
        console.log('✅ Contraseña actualizada:', response);
        setLoading(false);
        onSuccess("✅ Tu contraseña ha sido actualizada exitosamente.");
        handleClose();
      } catch (error: any) {
        setLoading(false);
        console.error('❌ Error en reset-password:', error);
        const errorMsg = error?.data?.message || error?.data?.error || error?.data?.Mensaje || 'Error al cambiar la contraseña. El token puede haber expirado.';
        onSuccess(`❌ ${errorMsg}`);
      }
    }
  };

  const handleClose = () => {
    setStep("email");
    setEmail("");
    setCode("");
    setNewPassword("");
    setConfirmPassword("");
    setEmailError("");
    setCodeError("");
    setNewPasswordError("");
    setConfirmPasswordError("");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white w-full max-w-md p-6 relative rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.15)] max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleClose}
              aria-label="Cerrar modal"
              className="absolute top-3 right-3 text-gray-500 hover:text-[#c84a8f] transition-colors"
            >
              <X size={20} />
            </button>

            <h2 className="mb-4 text-[#000000] font-bold text-xl">
              Recuperar contraseña
            </h2>

            {step === "email" ? (
              <div className="space-y-4">
                <p className="text-[#1a1a1a] mb-4 text-sm font-['Inter']">
                  Ingresa tu email y te enviaremos un código para restablecer tu contraseña.
                </p>

                <CustomInput
                  type="email"
                  label="Email"
                  value={email}
                  onChange={(value) => {
                    setEmail(value);
                    setEmailError("");
                  }}
                  error={emailError}
                  placeholder="tu@email.com"
                />

                <CustomButton onClick={handleSendCode} loading={loading}>
                  Enviar código
                </CustomButton>

                <button
                  onClick={handleClose}
                  aria-label="Volver al inicio de sesión"
                  className="w-full text-center text-[#c84a8f] hover:underline transition-all text-sm font-['Inter']"
                >
                  Volver al inicio de sesión
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[#1a1a1a] text-sm font-['Inter']">
                  📧 Token enviado a <strong>{email}</strong>. Revisa tu correo (incluyendo spam) y pégalo abajo.
                </p>

                <CustomInput
                  label="Token de recuperación"
                  value={code}
                  onChange={(value) => {
                    setCode(value);
                    setCodeError("");
                  }}
                  error={codeError}
                  placeholder="Pega el token que recibiste por email"
                />

                <CustomInput
                  type="password"
                  label="Nueva contraseña"
                  value={newPassword}
                  onChange={(value) => {
                    setNewPassword(value);
                    setNewPasswordError("");
                  }}
                  error={newPasswordError}
                  placeholder="••••••••"
                  showPasswordToggle
                />

                <CustomInput
                  type="password"
                  label="Confirmar contraseña"
                  value={confirmPassword}
                  onChange={(value) => {
                    setConfirmPassword(value);
                    setConfirmPasswordError("");
                  }}
                  error={confirmPasswordError}
                  placeholder="••••••••"
                  showPasswordToggle
                />

                <CustomButton onClick={handleResetPassword} loading={loading}>
                  Restablecer contraseña
                </CustomButton>

                <div className="flex justify-between items-center">
                  <button
                    onClick={() => {
                      setStep("email");
                      setCode("");
                      setNewPassword("");
                      setConfirmPassword("");
                      setCodeError("");
                      setNewPasswordError("");
                      setConfirmPasswordError("");
                    }}
                    aria-label="Cambiar email"
                    className="text-[#c84a8f] hover:underline transition-all text-sm font-['Inter']"
                  >
                    ← Cambiar email
                  </button>

                  <button
                    onClick={handleSendCode}
                    aria-label="Reenviar email"
                    className="text-[#c84a8f] hover:underline transition-all text-sm font-['Inter']"
                    disabled={loading}
                  >
                    Reenviar email
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
