import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Edit, Save, X, Shield, Lock, Bell, FileText, Eye, EyeOff, ChevronDown, ChevronRight, IdCard } from 'lucide-react';
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
      error ? 'border-red-300 dark:border-red-900/50 focus:ring-red-200 dark:focus:ring-red-900/30 bg-red-50 dark:bg-red-950/40' : 'border-[#E7E0DA] dark:border-[#453840] focus:ring-[#A3395C]/30 focus:border-[#A3395C]'
    }`;

  const iniciales = (user?.name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

  return (
    <div className="p-8 bg-[#FBF8F5] dark:bg-[#2a2029] min-h-screen">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-4">
        <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-500 dark:text-[#b8a3ac]">Dashboard</span>
        <ChevronRight className="w-4 h-4 text-gray-400 dark:text-[#b8a3ac]" />
        <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-medium text-[#241B22] dark:text-[#F5EDE9]">Perfil</span>
      </div>

      {/* Título */}
      <div className="mb-6">
        <h1 className="admin-page-title text-3xl font-bold text-[#241B22] dark:text-[#F5EDE9]">Mi Perfil</h1>
        <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-gray-500 dark:text-[#b8a3ac] text-sm mt-1">Gestiona tu información personal y la seguridad de tu cuenta</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl">

        {/* Columna izquierda: resumen de cuenta */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-[#322631] rounded-xl border border-[#E7E0DA] dark:border-[#453840] overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(214, 83, 145, 0.07)' }}>
            <div className="bg-gradient-to-br from-[#241B22] via-[#7a3350] to-[#A3395C] px-6 py-8 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-white/15 border-2 border-white/40 flex items-center justify-center text-white text-2xl font-bold mb-3" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                {iniciales}
              </div>
              <p className="text-white font-semibold text-lg leading-tight" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>{user?.name}</p>
              <span className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-semibold uppercase tracking-wide" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
                <Shield className="w-3 h-3" /> {user?.role || 'Administrador'}
              </span>
            </div>
            <div className="p-5">
              <button
                onClick={() => {
                  setFormData({ name: user?.name || '', email: user?.email || '', phone: profileData.phone, address: profileData.address, documento: profileData.documento, ciudad: profileData.ciudad });
                  setErrors({ phone: '', address: '', documento: '', name: '', email: '' });
                  setEditModalOpen(true);
                }}
                style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                className="w-full px-4 py-2.5 bg-gradient-to-r from-[#241B22] via-[#7a3350] to-[#A3395C] text-white rounded-lg hover:opacity-90 flex items-center justify-center gap-2 transition text-sm font-medium"
              >
                <Edit className="w-4 h-4" /> Editar Perfil
              </button>
            </div>
          </div>
        </div>

        {/* Columna derecha: informacion + seguridad */}
        <div className="lg:col-span-2 space-y-6">

          {/* Informacion personal */}
          <div className="bg-white dark:bg-[#322631] rounded-xl border border-[#E7E0DA] dark:border-[#453840] overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(214, 83, 145, 0.07)' }}>
            <div className="bg-[#FBF8F5] dark:bg-[#2a2029] px-6 py-4 border-b border-[#E7E0DA] dark:border-[#453840]">
              <h3 style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="font-semibold text-[#241B22] dark:text-[#F5EDE9] text-base">Información Personal</h3>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
              {[
                { icon: Mail,    label: 'Correo electrónico',     value: user?.email },
                { icon: Phone,   label: 'Teléfono',               value: profileData.phone     || '—' },
                { icon: MapPin,  label: 'Ciudad',                 value: profileData.ciudad    || '—' },
                { icon: MapPin,  label: 'Dirección',              value: profileData.address   || '—' },
                { icon: IdCard,  label: 'Documento de identidad', value: profileData.documento || '—' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#EFD9DF] dark:bg-[#3a2530] flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-[#A3395C]" />
                  </div>
                  <div className="min-w-0">
                    <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-400 dark:text-[#b8a3ac] mb-0.5">{label}</p>
                    <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-medium text-[#241B22] dark:text-[#F5EDE9] break-words">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Seguridad */}
          <div className="bg-white dark:bg-[#322631] rounded-xl border border-[#E7E0DA] dark:border-[#453840] overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(214, 83, 145, 0.07)' }}>
            <div className="bg-[#FBF8F5] dark:bg-[#2a2029] px-6 py-4 border-b border-[#E7E0DA] dark:border-[#453840]">
              <h3 style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="font-semibold text-[#241B22] dark:text-[#F5EDE9] text-base">Seguridad</h3>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-[#453840]">
              <button
                onClick={() => setPasswordModalOpen(true)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-[#FBF8F5] dark:hover:bg-[#362b34] transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#EFD9DF] dark:bg-[#3a2530] flex items-center justify-center flex-shrink-0">
                    <Lock className="w-4 h-4 text-[#A3395C]" />
                  </div>
                  <div>
                    <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-medium text-[#241B22] dark:text-[#F5EDE9]">Cambiar contraseña</p>
                    <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-400 dark:text-[#b8a3ac] mt-0.5">Actualiza tu contraseña periódicamente</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 dark:text-[#b8a3ac] group-hover:text-[#A3395C] transition-colors flex-shrink-0" />
              </button>
              <div className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#EFD9DF] dark:bg-[#3a2530] flex items-center justify-center flex-shrink-0">
                    <Bell className="w-4 h-4 text-[#A3395C]" />
                  </div>
                  <div>
                    <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-medium text-[#241B22] dark:text-[#F5EDE9]">Notificaciones por correo</p>
                    <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-400 dark:text-[#b8a3ac] mt-0.5">Recibe alertas de pedidos y actividad</p>
                  </div>
                </div>
                <button type="button"
                  role="switch"
                  aria-checked={notifications}
                  aria-label={notifications ? 'Desactivar notificaciones' : 'Activar notificaciones'}
                  onClick={() => setNotifications(!notifications)}
                  className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${notifications ? 'bg-gradient-to-r from-[#241B22] to-[#A3395C]' : 'bg-gray-300 dark:bg-[#453840]'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${notifications ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modal Editar Perfil ── */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent hideCloseButton className="max-w-md h-auto flex flex-col p-0 gap-0 rounded-2xl max-h-[90vh]">
          {/* Header con gradiente */}
          <div className="bg-[#EFD9DF] dark:bg-[#3a2530] border-b border-pink-100 dark:border-[#4a3540] px-6 py-5 flex items-center gap-4">
            <div className="w-14 h-14 bg-[#241B22] rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-7 h-7 text-white" />
            </div>
            <div>
              <DialogTitle style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-2xl font-bold text-[#241B22] dark:text-[#F5EDE9] leading-tight">
                Editar Perfil
              </DialogTitle>
              <DialogDescription style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-gray-500 dark:text-[#b8a3ac] text-sm mt-0.5">
                {user?.name} · {user?.role}
              </DialogDescription>
            </div>
            <button aria-label="Cerrar" onClick={() => setEditModalOpen(false)} className="ml-auto text-white/70 hover:text-white transition">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1">
            {/* Datos de cuenta */}
            <div>
              <p className="text-xs font-semibold text-gray-400 dark:text-[#b8a3ac] uppercase tracking-wider mb-3" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>Datos de Cuenta</p>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="text-xs text-gray-600 dark:text-[#b8a3ac] block mb-1.5" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
                    Nombre Completo <span className="text-[#A3395C]">*</span>
                  </label>
                  <div className="relative">
                    <User className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${errors.name ? 'text-red-400' : 'text-[#A3395C]'}`} />
                    <input type="text" value={formData.name} onChange={(e) => {
                      const val = e.target.value;
                      if (val && !/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]*$/.test(val)) {
                        setErrors({ ...errors, name: 'Solo se permiten letras' });
                        return;
                      }
                      setFormData({ ...formData, name: val });
                      setErrors({ ...errors, name: '' });
                    }}
                      className={fieldClass(errors.name)} placeholder="Tu nombre completo" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} />
                  </div>
                  {errors.name && <p className="text-xs text-red-500 mt-1" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>{errors.name}</p>}
                </div>

                <div>
                  <label className="text-xs text-gray-600 dark:text-[#b8a3ac] block mb-1.5" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
                    Correo Electrónico <span className="text-[#A3395C]">*</span>
                  </label>
                  <div className="relative">
                    <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${errors.email ? 'text-red-400' : 'text-[#A3395C]'}`} />
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
                      className={fieldClass(errors.email)} placeholder="tu@email.com" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} />
                  </div>
                  {errors.email && <p className="text-xs text-red-500 mt-1" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>{errors.email}</p>}
                </div>

                <div>
                  <label className="text-xs text-gray-600 dark:text-[#b8a3ac] block mb-1.5" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
                    Documento de Identidad <span className="text-[#A3395C]">*</span>
                  </label>
                  <div className="relative">
                    <FileText className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${errors.documento ? 'text-red-400' : 'text-[#A3395C]'}`} />
                    <input type="text" value={formData.documento} onChange={(e) => {
                      const val = e.target.value;
                      if (val && !/^\d*$/.test(val)) {
                        setErrors({ ...errors, documento: 'Solo se permiten números' });
                        return;
                      }
                      setFormData({ ...formData, documento: val });
                      setErrors({ ...errors, documento: '' });
                    }}
                      className={fieldClass(errors.documento)} placeholder="1234567890" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} />
                  </div>
                  {errors.documento && <p className="text-xs text-red-500 mt-1" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>{errors.documento}</p>}
                </div>

                <div>
                  <label className="text-xs text-gray-600 dark:text-[#b8a3ac] block mb-1.5" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
                    Teléfono <span className="text-[#A3395C]">*</span>
                  </label>
                  <div className="relative">
                    <Phone className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${errors.phone ? 'text-red-400' : 'text-[#A3395C]'}`} />
                    <input type="tel" value={formData.phone} onChange={(e) => {
                      const val = e.target.value;
                      if (val && !/^\d*$/.test(val)) {
                        setErrors({ ...errors, phone: 'Solo se permiten números' });
                        return;
                      }
                      setFormData({ ...formData, phone: val });
                      setErrors({ ...errors, phone: '' });
                    }}
                      className={fieldClass(errors.phone)} placeholder="3001234567" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} />
                  </div>
                  {errors.phone && <p className="text-xs text-red-500 mt-1" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>{errors.phone}</p>}
                </div>
              </div>
            </div>

            {/* Ubicación */}
            <div>
              <p className="text-xs font-semibold text-gray-400 dark:text-[#b8a3ac] uppercase tracking-wider mb-3" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>Ubicación</p>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="text-xs text-gray-600 dark:text-[#b8a3ac] block mb-1.5" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>Ciudad</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A3395C] pointer-events-none" />
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-[#b8a3ac] pointer-events-none" />
                    <select
                      aria-label="Ciudad"
                      value={formData.ciudad}
                      onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                      style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                      className="w-full pl-10 pr-8 h-[42px] text-sm border border-[#E7E0DA] dark:border-[#453840] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A3395C]/30 focus:border-[#A3395C] transition-all appearance-none bg-white dark:bg-[#322631] text-[#241B22] dark:text-[#F5EDE9]"
                    >
                      <option value="">Selecciona una ciudad</option>
                      {CIUDADES_COLOMBIA.sort().map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-600 dark:text-[#b8a3ac] block mb-1.5" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
                    Dirección <span className="text-[#A3395C]">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className={`absolute left-3 top-3 w-4 h-4 ${errors.address ? 'text-red-400' : 'text-[#A3395C]'}`} />
                    <textarea value={formData.address} onChange={(e) => { setFormData({ ...formData, address: e.target.value }); setErrors({ ...errors, address: '' }); }}
                      style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                      className={`w-full pl-10 pr-3 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 min-h-[42px] max-h-[80px] resize-none transition-all ${errors.address ? 'border-red-300 dark:border-red-900/50 focus:ring-red-200 dark:focus:ring-red-900/30 bg-red-50 dark:bg-red-950/40' : 'border-[#E7E0DA] dark:border-[#453840] focus:ring-[#A3395C]/30 focus:border-[#A3395C]'}`}
                      placeholder="Calle 123 # 45-67, Barrio..." />
                  </div>
                  {errors.address && <p className="text-xs text-red-500 mt-1" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>{errors.address}</p>}
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-[#FBF8F5] dark:bg-[#2a2029] border-t border-[#E7E0DA] dark:border-[#453840] flex justify-end gap-3">
            <button onClick={() => setEditModalOpen(false)} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
              className="px-5 h-[40px] text-sm bg-white dark:bg-[#322631] border border-[#E7E0DA] dark:border-[#453840] text-gray-700 dark:text-[#F5EDE9] rounded-xl hover:bg-gray-100 dark:hover:bg-[#362b34] transition flex items-center gap-2">
              <X className="w-4 h-4" /> Cancelar
            </button>
            <button onClick={handleSaveProfile} disabled={saving} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
              className="px-5 h-[40px] text-sm bg-gradient-to-r from-[#A3395C] to-[#EFD9DF] text-white rounded-xl hover:opacity-90 transition-all flex items-center gap-2 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed">
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
          <div className="bg-[#EFD9DF] dark:bg-[#3a2530] border-b border-pink-100 dark:border-[#4a3540] px-6 py-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-[#241B22] rounded-full flex items-center justify-center flex-shrink-0">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <div>
              <DialogTitle style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xl font-bold text-[#241B22] dark:text-[#F5EDE9]">
                Cambiar Contraseña
              </DialogTitle>
              <DialogDescription style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-gray-500 dark:text-[#b8a3ac] text-xs mt-0.5">
                Mantén tu cuenta segura con una contraseña fuerte
              </DialogDescription>
            </div>
            <button aria-label="Cerrar" onClick={() => setPasswordModalOpen(false)} className="ml-auto text-white/70 hover:text-white transition">
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
                <label className="text-xs text-gray-600 dark:text-[#b8a3ac] block mb-1.5" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>{label}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A3395C]" />
                  <input
                    type={showPasswords[key as keyof typeof showPasswords] ? 'text' : 'password'}
                    value={passwordData[key as keyof typeof passwordData]}
                    onChange={(e) => setPasswordData({ ...passwordData, [key]: e.target.value })}
                    placeholder={placeholder}
                    style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                    className="w-full pl-10 pr-10 h-[42px] text-sm border border-[#E7E0DA] dark:border-[#453840] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A3395C]/30 focus:border-[#A3395C] transition-all"
                  />
                  <button type="button" aria-label={showPasswords[key as keyof typeof showPasswords] ? 'Ocultar contraseña' : 'Mostrar contraseña'} onClick={() => setShowPasswords({ ...showPasswords, [key]: !showPasswords[key as keyof typeof showPasswords] })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#b8a3ac] hover:text-gray-600 dark:hover:text-[#F5EDE9] transition">
                    {showPasswords[key as keyof typeof showPasswords] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {key === 'new' && passwordData.new.length > 0 && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex gap-1 flex-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition ${
                          passwordData.new.length >= i * 3
                            ? i <= 1 ? 'bg-red-400' : i <= 2 ? 'bg-yellow-400' : i <= 3 ? 'bg-blue-400' : 'bg-green-400'
                            : 'bg-gray-200 dark:bg-[#453840]'
                        }`} />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500 dark:text-[#b8a3ac]" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
                      {passwordData.new.length < 6 ? 'Débil' : passwordData.new.length < 9 ? 'Regular' : passwordData.new.length < 12 ? 'Buena' : 'Fuerte'}
                    </span>
                  </div>
                )}
                {key === 'confirm' && passwordData.confirm && passwordData.new !== passwordData.confirm && (
                  <p className="text-xs text-red-500 mt-1" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>Las contraseñas no coinciden</p>
                )}
              </div>
            ))}
          </div>

          <div className="px-6 py-4 bg-[#FBF8F5] dark:bg-[#2a2029] border-t border-[#E7E0DA] dark:border-[#453840] flex justify-end gap-3">
            <button onClick={() => { setPasswordModalOpen(false); setPasswordData({ current: '', new: '', confirm: '' }); }}
              style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
              className="px-5 h-[40px] text-sm bg-white dark:bg-[#322631] border border-[#E7E0DA] dark:border-[#453840] text-gray-700 dark:text-[#F5EDE9] rounded-xl hover:bg-gray-100 dark:hover:bg-[#362b34] transition flex items-center gap-2">
              <X className="w-4 h-4" /> Cancelar
            </button>
            <button onClick={handleChangePassword} disabled={saving} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
              className="px-5 h-[40px] text-sm bg-gradient-to-r from-[#A3395C] to-[#EFD9DF] text-white rounded-xl hover:opacity-90 transition-all flex items-center gap-2 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed">
              <Lock className="w-4 h-4" />
              {saving ? 'Guardando...' : 'Cambiar Contraseña'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
