import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Edit, Save, X, Shield, Lock, Bell, FileText, Eye, EyeOff, ChevronDown } from 'lucide-react';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../../components/ui/dialog';
import { toast } from 'sonner@2.0.3';
import api from '../../../services/api';

const CIUDADES_COLOMBIA = [
  'Armenia', 'Arauca', 'Barranquilla', 'Bello', 'Bogotá', 'Bucaramanga',
  'Buenaventura', 'Buga', 'Cartagena', 'Cúcuta', 'Dosquebradas', 'Floridablanca',
  'Ibagué', 'Itagüí', 'Leticia', 'Manizales', 'Medellín', 'Mitú',
  'Mocoa', 'Montería', 'Neiva', 'Palmira', 'Pasto', 'Pereira',
  'Popayán', 'Puerto Carreño', 'Quibdó', 'Riohacha', 'San Andrés',
  'Santa Marta', 'Sincelejo', 'Soacha', 'Soledad', 'Tunja', 'Tulúa',
  'Valledupar', 'Villavicencio', 'Yopal', 'Cali', 'Inírida', 'Barrancabermeja',
];

export const PerfilView: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [notifications, setNotifications] = useState(() => localStorage.getItem('selenne_notif_email') !== 'false');

  useEffect(() => {
    localStorage.setItem('selenne_notif_email', String(notifications));
  }, [notifications]);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.telefono || '',
    address: user?.direccion || '',
    documento: user?.documento || '',
    ciudad: user?.ciudad || ''
  });

  const [profileData, setProfileData] = useState({
    phone: user?.telefono || '',
    address: user?.direccion || '',
    documento: user?.documento || '',
    ciudad: user?.ciudad || ''
  });

  const [errors, setErrors] = useState({ phone: '', address: '', documento: '', name: '', email: '' });

  const validateForm = () => {
    const newErrors = { phone: '', address: '', documento: '', name: '', email: '' };
    if (!formData.name.trim()) newErrors.name = 'El nombre es requerido';
    if (!formData.email.trim()) newErrors.email = 'El email es requerido';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Formato de email inválido';
    if (!formData.documento.trim()) newErrors.documento = 'El documento es requerido';
    else if (!/^[0-9]+$/.test(formData.documento)) newErrors.documento = 'Solo números';
    if (!formData.phone.trim()) newErrors.phone = 'El teléfono es requerido';
    else if (!/^\+?[\d\s-()]+$/.test(formData.phone)) newErrors.phone = 'Formato inválido';
    if (!formData.address.trim()) newErrors.address = 'La dirección es requerida';
    else if (formData.address.length < 10) newErrors.address = 'Mínimo 10 caracteres';
    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  };

  const handleSaveProfile = async () => {
    if (!validateForm()) { toast.error('Por favor corrige los errores'); return; }
    setSaving(true);
    try {
      await api.fetchWithAuth(`/api/usuarios/${user?.usuarioID}`, {
        method: 'PUT',
        body: JSON.stringify({
          NombreCompleto: formData.name,
          Telefono: formData.phone,
          Documento: formData.documento,
          Direccion: formData.address,
          Ciudad: formData.ciudad,
        })
      });
      await refreshUser();
      setProfileData({ phone: formData.phone, address: formData.address, documento: formData.documento, ciudad: formData.ciudad });
      setEditModalOpen(false);
      toast.success('Perfil actualizado correctamente');
    } catch (e: any) {
      toast.error('Error al guardar', { description: e?.data?.message || 'Intenta de nuevo' });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.current || !passwordData.new || !passwordData.confirm) { toast.error('Completa todos los campos'); return; }
    if (passwordData.new !== passwordData.confirm) { toast.error('Las contraseñas no coinciden'); return; }
    if (passwordData.new.length < 6) { toast.error('Mínimo 6 caracteres'); return; }
    setSaving(true);
    try {
      await api.postJson('/api/auth/change-password', {
        ContrasenaActual: passwordData.current,
        NuevaContrasena: passwordData.new
      });
      toast.success('Contraseña actualizada correctamente');
      setPasswordModalOpen(false);
      setPasswordData({ current: '', new: '', confirm: '' });
    } catch (e: any) {
      toast.error('Error al cambiar contraseña', { description: e?.data?.message || 'Contraseña actual incorrecta' });
    } finally {
      setSaving(false);
    }
  };

  const fieldClass = (error?: string) =>
    `w-full pl-10 pr-3 h-[42px] text-sm border rounded-xl focus:outline-none focus:ring-2 transition-all ${
      error ? 'border-red-300 focus:ring-red-200 bg-red-50' : 'border-gray-200 focus:ring-[#d65391]/30 focus:border-[#d65391]'
    }`;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-[#d65391] to-[#f8a9c5] opacity-10 rounded-2xl" />
        <div className="relative p-6">
          <h1 style={{ fontFamily: 'Playfair Display, serif' }} className="text-4xl mb-2 text-gray-900">Mi Perfil</h1>
          <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-gray-600">Gestiona la información de tu cuenta personal</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl">
        {/* Card Principal */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-[#d65391] to-[#f8a9c5] p-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-black opacity-5" />
              <div className="relative flex items-center gap-6">
                <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center ring-4 ring-white/30">
                  <User className="w-12 h-12 text-white" />
                </div>
                <div>
                  <h2 style={{ fontFamily: 'Playfair Display, serif' }} className="text-3xl text-white mb-1">{user?.name}</h2>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-white/90" />
                    <p className="text-white/90" style={{ fontFamily: 'Inter, sans-serif' }}>{user?.role}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8">
              <h3 style={{ fontFamily: 'Playfair Display, serif' }} className="text-xl text-gray-900 mb-6">Información Personal</h3>
              <div className="space-y-4">
                {[
                  { icon: <Mail className="w-5 h-5 text-white" />, label: 'Correo Electrónico', value: user?.email },
                  { icon: <Phone className="w-5 h-5 text-white" />, label: 'Teléfono', value: profileData.phone || 'No especificado' },
                  { icon: <MapPin className="w-5 h-5 text-white" />, label: 'Ciudad', value: profileData.ciudad || 'No especificada' },
                  { icon: <MapPin className="w-5 h-5 text-white" />, label: 'Dirección', value: profileData.address || 'No especificada' },
                  { icon: <FileText className="w-5 h-5 text-white" />, label: 'Documento de Identidad', value: profileData.documento || 'No especificado' },
                ].map(({ icon, label, value }) => (
                  <div key={label} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#d65391] to-[#f8a9c5] rounded-lg flex items-center justify-center flex-shrink-0">
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>{label}</p>
                      <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-gray-900 break-all">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 pt-6 border-t border-gray-100">
                <button
                  onClick={() => {
                    setFormData({ name: user?.name || '', email: user?.email || '', phone: profileData.phone, address: profileData.address, documento: profileData.documento, ciudad: profileData.ciudad });
                    setErrors({ phone: '', address: '', documento: '', name: '', email: '' });
                    setEditModalOpen(true);
                  }}
                  className="w-full bg-black text-white px-6 h-[44px] rounded-xl hover:bg-gray-800 transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  <Edit className="w-5 h-5" />
                  Editar Perfil
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 style={{ fontFamily: 'Playfair Display, serif' }} className="text-lg text-gray-900 mb-4">Estado de Cuenta</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-600">Estado</span>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>Activo</span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-600">Verificado</span>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>Sí</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-5 h-5 text-[#d65391]" />
              <h3 style={{ fontFamily: 'Playfair Display, serif' }} className="text-lg text-gray-900">Cambiar Contraseña</h3>
            </div>
            <button onClick={() => setPasswordModalOpen(true)} className="w-full bg-black text-white px-4 py-2.5 rounded-xl hover:bg-gray-800 transition-colors text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
              Cambiar Contraseña
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Bell className="w-5 h-5 text-[#d65391]" />
              <h3 style={{ fontFamily: 'Playfair Display, serif' }} className="text-lg text-gray-900">Notificaciones</h3>
            </div>
            <div className="flex items-center justify-between">
              <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-700">Email</span>
              <button aria-label={notifications ? 'Desactivar notificaciones' : 'Activar notificaciones'} onClick={() => { const next = !notifications; setNotifications(next); toast.success(next ? 'Notificaciones activadas' : 'Notificaciones desactivadas'); }} className={`relative w-12 h-6 rounded-full transition-colors ${notifications ? 'bg-[#d65391]' : 'bg-gray-300'}`}>
                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${notifications ? 'translate-x-6' : ''}`} />
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#d65391]/10 to-[#f8a9c5]/10 rounded-2xl border border-[#d65391]/20 p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-[#d65391] to-[#f8a9c5] rounded-lg flex items-center justify-center">
                <Lock className="w-5 h-5 text-white" />
              </div>
              <h3 style={{ fontFamily: 'Playfair Display, serif' }} className="text-lg text-gray-900">Seguridad</h3>
            </div>
            <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-700 mb-4">Tu información está protegida. Solo tú y los administradores pueden modificar ciertos datos.</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-200">
                <div>
                  <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-700">2FA (Autenticación de dos factores)</p>
                  <p className="text-xs text-gray-500 mt-0.5" style={{ fontFamily: 'Inter, sans-serif' }}>No configurada</p>
                </div>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-700">Sesiones activas</p>
                  <p className="text-xs text-gray-500 mt-0.5" style={{ fontFamily: 'Inter, sans-serif' }}>1 dispositivo</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modal Editar Perfil ── */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent hideCloseButton className="max-w-md h-auto flex flex-col p-0 gap-0 rounded-2xl max-h-[90vh]">
          {/* Header con gradiente */}
          <div className="bg-gradient-to-r from-[#d65391] to-[#f8a9c5] px-6 py-5 flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center ring-2 ring-white/30 flex-shrink-0">
              <User className="w-7 h-7 text-white" />
            </div>
            <div>
              <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }} className="text-2xl text-white leading-tight">
                Editar Perfil
              </DialogTitle>
              <DialogDescription style={{ fontFamily: 'Inter, sans-serif' }} className="text-white/80 text-sm mt-0.5">
                {user?.name} · {user?.role}
              </DialogDescription>
            </div>
            <button aria-label="Cerrar" onClick={() => setEditModalOpen(false)} className="ml-auto text-white/70 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1">
            {/* Datos de cuenta */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>Datos de Cuenta</p>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="text-xs text-gray-600 block mb-1.5" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Nombre Completo <span className="text-[#d65391]">*</span>
                  </label>
                  <div className="relative">
                    <User className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${errors.name ? 'text-red-400' : 'text-[#d65391]'}`} />
                    <input type="text" value={formData.name} onChange={(e) => {
                      const val = e.target.value;
                      if (val && !/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]*$/.test(val)) {
                        setErrors({ ...errors, name: 'Solo se permiten letras' });
                        return;
                      }
                      setFormData({ ...formData, name: val });
                      setErrors({ ...errors, name: '' });
                    }}
                      className={fieldClass(errors.name)} placeholder="Tu nombre completo" style={{ fontFamily: 'Inter, sans-serif' }} />
                  </div>
                  {errors.name && <p className="text-xs text-red-500 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>{errors.name}</p>}
                </div>

                <div>
                  <label className="text-xs text-gray-600 block mb-1.5" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Correo Electrónico <span className="text-[#d65391]">*</span>
                  </label>
                  <div className="relative">
                    <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${errors.email ? 'text-red-400' : 'text-[#d65391]'}`} />
                    <input type="email" value={formData.email} onChange={(e) => {
                      const val = e.target.value;
                      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                      if (val && !emailRegex.test(val)) {
                        setErrors({ ...errors, email: 'Formato de email inválido' });
                      } else {
                        setErrors({ ...errors, email: '' });
                      }
                      setFormData({ ...formData, email: val });
                    }}
                      className={fieldClass(errors.email)} placeholder="tu@email.com" style={{ fontFamily: 'Inter, sans-serif' }} />
                  </div>
                  {errors.email && <p className="text-xs text-red-500 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>{errors.email}</p>}
                </div>

                <div>
                  <label className="text-xs text-gray-600 block mb-1.5" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Documento de Identidad <span className="text-[#d65391]">*</span>
                  </label>
                  <div className="relative">
                    <FileText className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${errors.documento ? 'text-red-400' : 'text-[#d65391]'}`} />
                    <input type="text" value={formData.documento} onChange={(e) => {
                      const val = e.target.value;
                      if (val && !/^\d*$/.test(val)) {
                        setErrors({ ...errors, documento: 'Solo se permiten números' });
                        return;
                      }
                      setFormData({ ...formData, documento: val });
                      setErrors({ ...errors, documento: '' });
                    }}
                      className={fieldClass(errors.documento)} placeholder="1234567890" style={{ fontFamily: 'Inter, sans-serif' }} />
                  </div>
                  {errors.documento && <p className="text-xs text-red-500 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>{errors.documento}</p>}
                </div>

                <div>
                  <label className="text-xs text-gray-600 block mb-1.5" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Teléfono <span className="text-[#d65391]">*</span>
                  </label>
                  <div className="relative">
                    <Phone className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${errors.phone ? 'text-red-400' : 'text-[#d65391]'}`} />
                    <input type="tel" value={formData.phone} onChange={(e) => {
                      const val = e.target.value;
                      if (val && !/^\d*$/.test(val)) {
                        setErrors({ ...errors, phone: 'Solo se permiten números' });
                        return;
                      }
                      setFormData({ ...formData, phone: val });
                      setErrors({ ...errors, phone: '' });
                    }}
                      className={fieldClass(errors.phone)} placeholder="3001234567" style={{ fontFamily: 'Inter, sans-serif' }} />
                  </div>
                  {errors.phone && <p className="text-xs text-red-500 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>{errors.phone}</p>}
                </div>
              </div>
            </div>

            {/* Ubicación */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>Ubicación</p>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="text-xs text-gray-600 block mb-1.5" style={{ fontFamily: 'Inter, sans-serif' }}>Ciudad</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#d65391] pointer-events-none" />
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <select
                      aria-label="Ciudad"
                      value={formData.ciudad}
                      onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                      style={{ fontFamily: 'Inter, sans-serif' }}
                      className="w-full pl-10 pr-8 h-[42px] text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d65391]/30 focus:border-[#d65391] transition-all appearance-none bg-white text-gray-900"
                    >
                      <option value="">Selecciona una ciudad</option>
                      {CIUDADES_COLOMBIA.sort().map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-600 block mb-1.5" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Dirección <span className="text-[#d65391]">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className={`absolute left-3 top-3 w-4 h-4 ${errors.address ? 'text-red-400' : 'text-[#d65391]'}`} />
                    <textarea value={formData.address} onChange={(e) => { setFormData({ ...formData, address: e.target.value }); setErrors({ ...errors, address: '' }); }}
                      style={{ fontFamily: 'Inter, sans-serif' }}
                      className={`w-full pl-10 pr-3 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 min-h-[42px] max-h-[80px] resize-none transition-all ${errors.address ? 'border-red-300 focus:ring-red-200 bg-red-50' : 'border-gray-200 focus:ring-[#d65391]/30 focus:border-[#d65391]'}`}
                      placeholder="Calle 123 # 45-67, Barrio..." />
                  </div>
                  {errors.address && <p className="text-xs text-red-500 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>{errors.address}</p>}
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
            <button onClick={() => setEditModalOpen(false)} style={{ fontFamily: 'Inter, sans-serif' }}
              className="px-5 h-[40px] text-sm bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors flex items-center gap-2">
              <X className="w-4 h-4" /> Cancelar
            </button>
            <button onClick={handleSaveProfile} disabled={saving} style={{ fontFamily: 'Inter, sans-serif' }}
              className="px-5 h-[40px] text-sm bg-gradient-to-r from-[#d65391] to-[#f8a9c5] text-white rounded-xl hover:opacity-90 transition-all flex items-center gap-2 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed">
              <Save className="w-4 h-4" />
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Modal Cambiar Contraseña ── */}
      <Dialog open={passwordModalOpen} onOpenChange={setPasswordModalOpen}>
        <DialogContent hideCloseButton className="max-w-md p-0 rounded-2xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#d65391] to-[#f8a9c5] px-6 py-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center ring-2 ring-white/30 flex-shrink-0">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <div>
              <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }} className="text-xl text-white">
                Cambiar Contraseña
              </DialogTitle>
              <DialogDescription style={{ fontFamily: 'Inter, sans-serif' }} className="text-white/80 text-xs mt-0.5">
                Mantén tu cuenta segura con una contraseña fuerte
              </DialogDescription>
            </div>
            <button aria-label="Cerrar" onClick={() => setPasswordModalOpen(false)} className="ml-auto text-white/70 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-6 py-5 space-y-4">
            {[
              { key: 'current', label: 'Contraseña Actual', placeholder: 'Ingresa tu contraseña actual' },
              { key: 'new', label: 'Nueva Contraseña', placeholder: 'Mínimo 6 caracteres' },
              { key: 'confirm', label: 'Confirmar Nueva Contraseña', placeholder: 'Repite la nueva contraseña' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="text-xs text-gray-600 block mb-1.5" style={{ fontFamily: 'Inter, sans-serif' }}>{label}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#d65391]" />
                  <input
                    type={showPasswords[key as keyof typeof showPasswords] ? 'text' : 'password'}
                    value={passwordData[key as keyof typeof passwordData]}
                    onChange={(e) => setPasswordData({ ...passwordData, [key]: e.target.value })}
                    placeholder={placeholder}
                    style={{ fontFamily: 'Inter, sans-serif' }}
                    className="w-full pl-10 pr-10 h-[42px] text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d65391]/30 focus:border-[#d65391] transition-all"
                  />
                  <button type="button" aria-label={showPasswords[key as keyof typeof showPasswords] ? 'Ocultar contraseña' : 'Mostrar contraseña'} onClick={() => setShowPasswords({ ...showPasswords, [key]: !showPasswords[key as keyof typeof showPasswords] })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                    {showPasswords[key as keyof typeof showPasswords] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {key === 'new' && passwordData.new.length > 0 && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex gap-1 flex-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                          passwordData.new.length >= i * 3
                            ? i <= 1 ? 'bg-red-400' : i <= 2 ? 'bg-yellow-400' : i <= 3 ? 'bg-blue-400' : 'bg-green-400'
                            : 'bg-gray-200'
                        }`} />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {passwordData.new.length < 6 ? 'Débil' : passwordData.new.length < 9 ? 'Regular' : passwordData.new.length < 12 ? 'Buena' : 'Fuerte'}
                    </span>
                  </div>
                )}
                {key === 'confirm' && passwordData.confirm && passwordData.new !== passwordData.confirm && (
                  <p className="text-xs text-red-500 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>Las contraseñas no coinciden</p>
                )}
              </div>
            ))}
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
            <button onClick={() => { setPasswordModalOpen(false); setPasswordData({ current: '', new: '', confirm: '' }); }}
              style={{ fontFamily: 'Inter, sans-serif' }}
              className="px-5 h-[40px] text-sm bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors flex items-center gap-2">
              <X className="w-4 h-4" /> Cancelar
            </button>
            <button onClick={handleChangePassword} disabled={saving} style={{ fontFamily: 'Inter, sans-serif' }}
              className="px-5 h-[40px] text-sm bg-gradient-to-r from-[#d65391] to-[#f8a9c5] text-white rounded-xl hover:opacity-90 transition-all flex items-center gap-2 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed">
              <Lock className="w-4 h-4" />
              {saving ? 'Guardando...' : 'Cambiar Contraseña'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
