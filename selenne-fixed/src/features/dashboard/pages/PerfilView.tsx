import React, { useState } from 'react';
import { User, Mail, Phone, MapPin, Edit, Save, X, Shield, Calendar, Lock, Bell, FileText } from 'lucide-react';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../../components/ui/dialog';
import { toast } from 'sonner@2.0.3';

export const PerfilView: React.FC = () => {
  const { user } = useAuth();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '+52 123 456 7890',
    address: 'Calle Principal 123, Ciudad, Estado, CP 12345',
    documento: '12345678'
  });

  const [profileData, setProfileData] = useState({
    phone: '+52 123 456 7890',
    address: 'Calle Principal 123, Ciudad, Estado, CP 12345',
    documento: '12345678'
  });

  const [errors, setErrors] = useState({
    phone: '',
    address: '',
    documento: '',
    name: '',
    email: ''
  });

  const validateForm = () => {
    const newErrors = {
      phone: '',
      address: '',
      documento: '',
      name: '',
      email: ''
    };

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Formato de email inválido';
    }

    if (!formData.documento.trim()) {
      newErrors.documento = 'El documento es requerido';
    } else if (!/^[0-9]+$/.test(formData.documento)) {
      newErrors.documento = 'El documento debe contener solo números';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es requerido';
    } else if (!/^\+?[\d\s-()]+$/.test(formData.phone)) {
      newErrors.phone = 'Formato de teléfono inválido';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'La dirección es requerida';
    } else if (formData.address.length < 10) {
      newErrors.address = 'La dirección debe tener al menos 10 caracteres';
    }

    setErrors(newErrors);
    return !newErrors.phone && !newErrors.address && !newErrors.documento && !newErrors.name && !newErrors.email;
  };

  const handleSaveProfile = () => {
    if (!validateForm()) {
      toast.error('Por favor corrige los errores en el formulario');
      return;
    }

    setProfileData({
      phone: formData.phone,
      address: formData.address,
      documento: formData.documento
    });
    setEditModalOpen(false);
    toast.success('Perfil actualizado correctamente', {
      description: 'Tus cambios han sido guardados exitosamente'
    });
  };

  const handleChangePassword = () => {
    if (!passwordData.current || !passwordData.new || !passwordData.confirm) {
      toast.error('Por favor completa todos los campos');
      return;
    }
    
    if (passwordData.new !== passwordData.confirm) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (passwordData.new.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    // Aquí iría la lógica de cambio de contraseña
    toast.success('Contraseña actualizada correctamente');
    setPasswordModalOpen(false);
    setPasswordData({ current: '', new: '', confirm: '' });
  };

  return (
    <div className="p-8">
      {/* Header con gradiente */}
      <div className="mb-8 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-[#d65391] to-[#f8a9c5] opacity-10 rounded-2xl"></div>
        <div className="relative p-6">
          <h1 style={{ fontFamily: 'Playfair Display, serif' }} className="text-4xl mb-2 text-gray-900">
            Mi Perfil
          </h1>
          <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-gray-600">
            Gestiona la información de tu cuenta personal
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl">
        {/* Card Principal de Perfil */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header del Card con gradiente */}
            <div className="bg-gradient-to-r from-[#d65391] to-[#f8a9c5] p-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-black opacity-5"></div>
              <div className="relative flex items-center gap-6">
                <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center ring-4 ring-white/30">
                  <User className="w-12 h-12 text-white" />
                </div>
                <div>
                  <h2 style={{ fontFamily: 'Playfair Display, serif' }} className="text-3xl text-white mb-1">
                    {user?.name}
                  </h2>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-white/90" />
                    <p className="text-white/90" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {user?.role}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contenido del Card */}
            <div className="p-8">
              <h3 style={{ fontFamily: 'Playfair Display, serif' }} className="text-xl text-gray-900 mb-6">
                Información Personal
              </h3>
              
              <div className="space-y-4">
                {/* Email */}
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#d65391] to-[#f8a9c5] rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                      Correo Electrónico
                    </p>
                    <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-gray-900 break-all">
                      {user?.email}
                    </p>
                  </div>
                </div>

                {/* Teléfono */}
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#d65391] to-[#f8a9c5] rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                      Teléfono de Contacto
                    </p>
                    <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-gray-900">
                      {profileData.phone}
                    </p>
                  </div>
                </div>

                {/* Dirección */}
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#d65391] to-[#f8a9c5] rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                      Dirección
                    </p>
                    <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-gray-900">
                      {profileData.address}
                    </p>
                  </div>
                </div>

                {/* Documento */}
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#d65391] to-[#f8a9c5] rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                      Documento de Identidad
                    </p>
                    <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-gray-900">
                      {profileData.documento}
                    </p>
                  </div>
                </div>
              </div>

              {/* Botón de Editar */}
              <div className="mt-8 pt-6 border-t border-gray-100">
                <button 
                  onClick={() => {
                    setFormData({
                      name: user?.name || '',
                      email: user?.email || '',
                      phone: profileData.phone,
                      address: profileData.address,
                      documento: profileData.documento
                    });
                    setErrors({ phone: '', address: '', documento: '', name: '', email: '' });
                    setEditModalOpen(true);
                  }}
                  className="w-full bg-black text-white px-6 h-[44px] rounded-lg hover:bg-gray-800 transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  <Edit className="w-5 h-5" />
                  Editar Perfil
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar con información adicional e información de configuración */}
        <div className="space-y-6">
          {/* Card de Estado de Cuenta */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 style={{ fontFamily: 'Playfair Display, serif' }} className="text-lg text-gray-900 mb-4">
              Estado de Cuenta
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-600">
                  Estado
                </span>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Activo
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-600">
                  Verificado
                </span>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Sí
                </span>
              </div>
            </div>
          </div>

          {/* Card de Cambiar Contraseña */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-5 h-5 text-[#d65391]" />
              <h3 style={{ fontFamily: 'Playfair Display, serif' }} className="text-lg text-gray-900">
                Cambiar Contraseña
              </h3>
            </div>
            <button
              onClick={() => setPasswordModalOpen(true)}
              className="w-full bg-black text-white px-4 py-2.5 rounded-lg hover:bg-gray-800 transition-colors text-sm"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Cambiar Contraseña
            </button>
          </div>

          {/* Card de Notificaciones */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Bell className="w-5 h-5 text-[#d65391]" />
              <h3 style={{ fontFamily: 'Playfair Display, serif' }} className="text-lg text-gray-900">
                Notificaciones
              </h3>
            </div>
            <div className="flex items-center justify-between">
              <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-700">
                Email
              </span>
              <button
                onClick={() => setNotifications(!notifications)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  notifications ? 'bg-[#d65391]' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    notifications ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Card de Seguridad */}
          <div className="bg-gradient-to-br from-[#d65391]/10 to-[#f8a9c5]/10 rounded-2xl border border-[#d65391]/20 p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-[#d65391] to-[#f8a9c5] rounded-lg flex items-center justify-center">
                <Lock className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 style={{ fontFamily: 'Playfair Display, serif' }} className="text-lg text-gray-900">
                  Seguridad
                </h3>
              </div>
            </div>
            <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-700 mb-4">
              Tu información está protegida. Solo tú y los administradores pueden modificar ciertos datos.
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-200">
                <div>
                  <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-700">
                    2FA (Autenticación de dos factores)
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5" style={{ fontFamily: 'Inter, sans-serif' }}>
                    No configurada
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-700">
                    Sesiones activas
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5" style={{ fontFamily: 'Inter, sans-serif' }}>
                    1 dispositivo
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Card de Ayuda */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 style={{ fontFamily: 'Playfair Display, serif' }} className="text-lg text-gray-900 mb-3">
              ¿Necesitas Ayuda?
            </h3>
            <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-600 mb-4">
              Si necesitas actualizar tu nombre o email, contacta al administrador.
            </p>
            <button className="text-sm text-[#d65391] hover:text-[#f8a9c5] transition-colors" style={{ fontFamily: 'Inter, sans-serif' }}>
              Contactar Soporte →
            </button>
          </div>
        </div>
      </div>

      {/* Modal Editar Perfil */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }} className="text-2xl">
              Editar Perfil
            </DialogTitle>
            <DialogDescription style={{ fontFamily: 'Inter, sans-serif' }} className="text-gray-600">
              Actualiza tu información personal de contacto
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-5 py-4 overflow-y-auto flex-1 pr-2">
            {/* Avatar con gradiente */}
            <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
              <div className="w-16 h-16 bg-gradient-to-br from-[#d65391] to-[#f8a9c5] rounded-full flex items-center justify-center ring-4 ring-[#d65391]/10">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 style={{ fontFamily: 'Playfair Display, serif' }} className="text-xl text-gray-900">
                  {user?.name}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <Shield className="w-3.5 h-3.5 text-[#d65391]" />
                  <p className="text-sm text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {user?.role}
                  </p>
                </div>
              </div>
            </div>

            {/* Sección de Campos Editables */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Edit className="w-4 h-4 text-[#d65391]" />
                <h4 style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-700">
                  Información de Cuenta
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-900 block mb-1.5">
                    Nombre Completo <span className="text-[#d65391]">*</span>
                  </label>
                  <div className="relative">
                    <User className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${errors.name ? 'text-red-500' : 'text-[#d65391]'}`} />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        setErrors({ ...errors, name: '' });
                      }}
                      style={{ fontFamily: 'Inter, sans-serif' }}
                      className={`w-full pl-10 pr-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                        errors.name 
                          ? 'border-red-300 focus:ring-red-200 bg-red-50' 
                          : 'border-gray-200 focus:ring-[#d65391] focus:border-[#d65391]'
                      }`}
                      placeholder="Tu nombre completo"
                    />
                  </div>
                  {errors.name && (
                    <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                      {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-900 block mb-1.5">
                    Correo Electrónico <span className="text-[#d65391]">*</span>
                  </label>
                  <div className="relative">
                    <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${errors.email ? 'text-red-500' : 'text-[#d65391]'}`} />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        setErrors({ ...errors, email: '' });
                      }}
                      style={{ fontFamily: 'Inter, sans-serif' }}
                      className={`w-full pl-10 pr-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                        errors.email 
                          ? 'border-red-300 focus:ring-red-200 bg-red-50' 
                          : 'border-gray-200 focus:ring-[#d65391] focus:border-[#d65391]'
                      }`}
                      placeholder="tu@email.com"
                    />
                  </div>
                  {errors.email && (
                    <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                      {errors.email}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-900 block mb-1.5">
                  Documento de Identidad <span className="text-[#d65391]">*</span>
                </label>
                <div className="relative">
                  <FileText className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${errors.documento ? 'text-red-500' : 'text-[#d65391]'}`} />
                  <input
                    type="text"
                    value={formData.documento}
                    onChange={(e) => {
                      setFormData({ ...formData, documento: e.target.value });
                      setErrors({ ...errors, documento: '' });
                    }}
                    style={{ fontFamily: 'Inter, sans-serif' }}
                    className={`w-full pl-10 pr-3 h-[40px] text-sm border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                      errors.documento 
                        ? 'border-red-300 focus:ring-red-200 bg-red-50' 
                        : 'border-gray-200 focus:ring-[#d65391] focus:border-[#d65391]'
                    }`}
                    placeholder="12345678"
                  />
                </div>
                {errors.documento && (
                  <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                    {errors.documento}
                  </p>
                )}
              </div>
            </div>

            {/* Divisor decorativo */}
            <div className="relative py-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-xs text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Información de Contacto
                </span>
              </div>
            </div>

            {/* Sección de Campos Editables */}
            <div className="space-y-3">
              <div>
                <label style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-900 block mb-1.5">
                  Teléfono <span className="text-[#d65391]">*</span>
                </label>
                <div className="relative">
                  <Phone className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${errors.phone ? 'text-red-500' : 'text-[#d65391]'}`} />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => {
                      setFormData({ ...formData, phone: e.target.value });
                      setErrors({ ...errors, phone: '' });
                    }}
                    style={{ fontFamily: 'Inter, sans-serif' }}
                    className={`w-full pl-10 pr-3 h-[40px] text-sm border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                      errors.phone 
                        ? 'border-red-300 focus:ring-red-200 bg-red-50' 
                        : 'border-gray-200 focus:ring-[#d65391] focus:border-[#d65391]'
                    }`}
                    placeholder="+52 123 456 7890"
                  />
                </div>
                {errors.phone && (
                  <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                    {errors.phone}
                  </p>
                )}
              </div>

              <div>
                <label style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-900 block mb-1.5">
                  Dirección Completa <span className="text-[#d65391]">*</span>
                </label>
                <div className="relative">
                  <MapPin className={`absolute left-3 top-3 w-4 h-4 ${errors.address ? 'text-red-500' : 'text-[#d65391]'}`} />
                  <textarea
                    value={formData.address}
                    onChange={(e) => {
                      setFormData({ ...formData, address: e.target.value });
                      setErrors({ ...errors, address: '' });
                    }}
                    style={{ fontFamily: 'Inter, sans-serif' }}
                    className={`w-full pl-10 pr-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 min-h-[80px] resize-none transition-all ${
                      errors.address 
                        ? 'border-red-300 focus:ring-red-200 bg-red-50' 
                        : 'border-gray-200 focus:ring-[#d65391] focus:border-[#d65391]'
                    }`}
                    placeholder="Calle, número, colonia, ciudad, estado, código postal"
                  />
                </div>
                {errors.address && (
                  <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                    {errors.address}
                  </p>
                )}
              </div>
            </div>

            {/* Información mejorada */}
            <div className="bg-gradient-to-r from-[#d65391]/10 to-[#f8a9c5]/10 rounded-lg p-3 border border-[#d65391]/20">
              <div className="flex gap-2.5">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gradient-to-br from-[#d65391] to-[#f8a9c5] rounded-lg flex items-center justify-center">
                    <Edit className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div>
                  <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-900 mb-1">
                    <strong>Información Editable</strong>
                  </p>
                  <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-700 leading-relaxed">
                    Ahora puedes actualizar todos tus datos personales, incluyendo nombre, email y documento de identidad.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 flex-shrink-0">
            <button
              onClick={() => {
                setEditModalOpen(false);
                setErrors({ phone: '', address: '' });
              }}
              style={{ fontFamily: 'Inter, sans-serif' }}
              className="px-5 h-[40px] text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancelar
            </button>
            <button
              onClick={handleSaveProfile}
              style={{ fontFamily: 'Inter, sans-serif' }}
              className="px-5 h-[40px] text-sm bg-black text-white rounded-lg hover:bg-gray-800 transition-all flex items-center gap-2 shadow-sm hover:shadow-md"
            >
              <Save className="w-4 h-4" />
              Guardar Cambios
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Cambiar Contraseña */}
      <Dialog open={passwordModalOpen} onOpenChange={setPasswordModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }} className="text-2xl">
              Cambiar Contraseña
            </DialogTitle>
            <DialogDescription style={{ fontFamily: 'Inter, sans-serif' }} className="text-gray-600">
              Actualiza tu contraseña para mantener tu cuenta segura
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                Contraseña Actual
              </label>
              <input
                type="password"
                value={passwordData.current}
                onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d65391] focus:border-[#d65391]"
                style={{ fontFamily: 'Inter, sans-serif' }}
              />
            </div>
            <div>
              <label className="block text-sm mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                Nueva Contraseña
              </label>
              <input
                type="password"
                value={passwordData.new}
                onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d65391] focus:border-[#d65391]"
                style={{ fontFamily: 'Inter, sans-serif' }}
              />
            </div>
            <div>
              <label className="block text-sm mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                Confirmar Nueva Contraseña
              </label>
              <input
                type="password"
                value={passwordData.confirm}
                onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d65391] focus:border-[#d65391]"
                style={{ fontFamily: 'Inter, sans-serif' }}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <button
              onClick={() => setPasswordModalOpen(false)}
              style={{ fontFamily: 'Inter, sans-serif' }}
              className="px-5 h-[40px] text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleChangePassword}
              style={{ fontFamily: 'Inter, sans-serif' }}
              className="px-5 h-[40px] text-sm bg-black text-white rounded-lg hover:bg-gray-800 transition-all"
            >
              Cambiar Contraseña
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
