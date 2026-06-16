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
    <div className="p-8 max-w-lg">

      {/* Título */}
      <h1 style={{ fontFamily: '"Times New Roman", Times, serif' }} className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-6">Perfil</h1>

      {/* Card info personal */}
      <div className="border border-gray-200 overflow-hidden mb-6">
        <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100">
          <span className="text-sm font-medium text-gray-900">{user?.name}</span>
          <button
            onClick={() => {
              setFormData({ name: user?.name || '', email: user?.email || '', phone: profileData.phone, address: profileData.address, documento: profileData.documento, ciudad: profileData.ciudad });
              setErrors({ phone: '', address: '', documento: '', name: '', email: '' });
              setEditModalOpen(true);
            }}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <Edit className="w-4 h-4" />
          </button>
        </div>
        <div className="divide-y divide-gray-100">
          {[
            { label: 'Correo electrónico',      value: user?.email },
            { label: 'Teléfono',                value: profileData.phone     || '—' },
            { label: 'Ciudad',                  value: profileData.ciudad    || '—' },
            { label: 'Dirección',               value: profileData.address   || '—' },
            { label: 'Documento de identidad',  value: profileData.documento || '—' },
          ].map(({ label, value }) => (
            <div key={label} className="px-5 py-3.5">
              <p className="text-xs text-gray-400 mb-0.5">{label}</p>
              <p className="text-sm text-gray-900">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Cambiar contraseña */}
      <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-3">Cambiar contraseña</h2>
      <div className="border border-gray-200 overflow-hidden mb-2">
        <button
          onClick={() => setPasswordModalOpen(true)}
          className="w-full px-5 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <span className="text-sm text-gray-700">Cambiar contraseña</span>
          <Edit className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* ── Modal Editar Perfil ── */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent hideCloseButton className="max-w-md h-auto flex flex-col p-0 gap-0 rounded-2xl max-h-[90vh]">
          {/* Header con gradiente */}
          <div className="bg-[#fdf2f8] border-b border-pink-100 px-6 py-5 flex items-center gap-4">
            <div className="w-14 h-14 bg-black rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-7 h-7 text-white" />
            </div>
            <div>
              <DialogTitle style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-2xl font-bold text-gray-900 leading-tight">
                Editar Perfil
              </DialogTitle>
              <DialogDescription style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-gray-500 text-sm mt-0.5">
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
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>Datos de Cuenta</p>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="text-xs text-gray-600 block mb-1.5" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
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
                      className={fieldClass(errors.name)} placeholder="Tu nombre completo" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} />
                  </div>
                  {errors.name && <p className="text-xs text-red-500 mt-1" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>{errors.name}</p>}
                </div>

                <div>
                  <label className="text-xs text-gray-600 block mb-1.5" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
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
                      className={fieldClass(errors.email)} placeholder="tu@email.com" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} />
                  </div>
                  {errors.email && <p className="text-xs text-red-500 mt-1" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>{errors.email}</p>}
                </div>

                <div>
                  <label className="text-xs text-gray-600 block mb-1.5" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
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
                      className={fieldClass(errors.documento)} placeholder="1234567890" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} />
                  </div>
                  {errors.documento && <p className="text-xs text-red-500 mt-1" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>{errors.documento}</p>}
                </div>

                <div>
                  <label className="text-xs text-gray-600 block mb-1.5" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
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
                      className={fieldClass(errors.phone)} placeholder="3001234567" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} />
                  </div>
                  {errors.phone && <p className="text-xs text-red-500 mt-1" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>{errors.phone}</p>}
                </div>
              </div>
            </div>

            {/* Ubicación */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>Ubicación</p>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="text-xs text-gray-600 block mb-1.5" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>Ciudad</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#d65391] pointer-events-none" />
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <select
                      aria-label="Ciudad"
                      value={formData.ciudad}
                      onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                      style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
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
                  <label className="text-xs text-gray-600 block mb-1.5" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
                    Dirección <span className="text-[#d65391]">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className={`absolute left-3 top-3 w-4 h-4 ${errors.address ? 'text-red-400' : 'text-[#d65391]'}`} />
                    <textarea value={formData.address} onChange={(e) => { setFormData({ ...formData, address: e.target.value }); setErrors({ ...errors, address: '' }); }}
                      style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                      className={`w-full pl-10 pr-3 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 min-h-[42px] max-h-[80px] resize-none transition-all ${errors.address ? 'border-red-300 focus:ring-red-200 bg-red-50' : 'border-gray-200 focus:ring-[#d65391]/30 focus:border-[#d65391]'}`}
                      placeholder="Calle 123 # 45-67, Barrio..." />
                  </div>
                  {errors.address && <p className="text-xs text-red-500 mt-1" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>{errors.address}</p>}
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
            <button onClick={() => setEditModalOpen(false)} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
              className="px-5 h-[40px] text-sm bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors flex items-center gap-2">
              <X className="w-4 h-4" /> Cancelar
            </button>
            <button onClick={handleSaveProfile} disabled={saving} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
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
          <div className="bg-[#fdf2f8] border-b border-pink-100 px-6 py-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center flex-shrink-0">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <div>
              <DialogTitle style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xl font-bold text-gray-900">
                Cambiar Contraseña
              </DialogTitle>
              <DialogDescription style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-gray-500 text-xs mt-0.5">
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
                <label className="text-xs text-gray-600 block mb-1.5" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>{label}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#d65391]" />
                  <input
                    type={showPasswords[key as keyof typeof showPasswords] ? 'text' : 'password'}
                    value={passwordData[key as keyof typeof passwordData]}
                    onChange={(e) => setPasswordData({ ...passwordData, [key]: e.target.value })}
                    placeholder={placeholder}
                    style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
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
                    <span className="text-xs text-gray-500" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
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

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
            <button onClick={() => { setPasswordModalOpen(false); setPasswordData({ current: '', new: '', confirm: '' }); }}
              style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
              className="px-5 h-[40px] text-sm bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors flex items-center gap-2">
              <X className="w-4 h-4" /> Cancelar
            </button>
            <button onClick={handleChangePassword} disabled={saving} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
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
