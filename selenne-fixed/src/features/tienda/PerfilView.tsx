import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  User, Mail, Phone, MapPin, Edit, Save, X, Lock, Bell,
  ShoppingBag, Heart, Package, Loader2, Eye, EyeOff,
  ChevronDown, ArrowLeft, LogOut, Truck, CreditCard,
  CheckCircle2, XCircle, Clock, AlertCircle, Search, RefreshCw, Calendar
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog';
import { useAuth } from '../../shared/contexts/AuthContext';
import { useTienda } from '../../shared/contexts/TiendaContext';
import { toast } from 'sonner';
import api, { getJson, apiBase } from '../../services/api';

interface PerfilViewProps { onBack: () => void; onLogout: () => void; }

interface PedidoDetalle {
  productoID: number; productoNombre: string; imagenProducto?: string;
  talla?: string; color?: string; cantidad: number; precioUnitario: number; subtotal: number;
}

interface PedidoApi {
  pedidoID: number; emailCliente: string; nombreCliente?: string; total: number; subtotal?: number;
  descuento?: number; envio?: number; estado: string; fechaPedido: string;
  metodoPago: string; ciudad: string; direccionEnvio: string;
  numeroGuia?: string; transportadora?: string; notas?: string;
  detalles?: PedidoDetalle[];
}

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

const estadoConfig: Record<string, { label: string; bg: string; text: string }> = {
  Pendiente:  { label: '⏳ Pendiente',  bg: 'bg-yellow-100', text: 'text-yellow-800' },
  Aprobado:   { label: '✔️ Aprobado',   bg: 'bg-blue-100',   text: 'text-blue-800'   },
  Completado: { label: '✅ Entregado',  bg: 'bg-green-100',  text: 'text-green-800'  },
  Rechazado:  { label: '❌ Rechazado',  bg: 'bg-red-100',    text: 'text-red-800'    },
  Cancelado:  { label: 'Cancelado',     bg: 'bg-gray-100',   text: 'text-gray-600'   },
};

// ── Ciudades de Colombia ──────────────────────────────────────────────────────
const COLOMBIA: { dep: string; ciudades: string[] }[] = [
  { dep: 'Bogotá D.C.',        ciudades: ['Bogotá'] },
  { dep: 'Antioquia',          ciudades: ['Medellín','Bello','Itagüí','Envigado','Sabaneta','La Estrella','Copacabana','Girardota','Caldas','Barbosa','Rionegro','Apartadó','Turbo','Caucasia','Marinilla','La Ceja','Andes','Yarumal','Santa Fe de Antioquia'] },
  { dep: 'Atlántico',          ciudades: ['Barranquilla','Soledad','Malambo','Puerto Colombia'] },
  { dep: 'Bolívar',            ciudades: ['Cartagena','Magangué','El Carmen de Bolívar','Mompox'] },
  { dep: 'Boyacá',             ciudades: ['Tunja','Duitama','Sogamoso','Chiquinquirá','Villa de Leyva'] },
  { dep: 'Caldas',             ciudades: ['Manizales','La Dorada','Chinchiná','Villamaría'] },
  { dep: 'Caquetá',            ciudades: ['Florencia','San Vicente del Caguán'] },
  { dep: 'Casanare',           ciudades: ['Yopal','Aguazul','Villanueva'] },
  { dep: 'Cauca',              ciudades: ['Popayán','Santander de Quilichao','Puerto Tejada'] },
  { dep: 'Cesar',              ciudades: ['Valledupar','Aguachica','Bosconia'] },
  { dep: 'Chocó',              ciudades: ['Quibdó','Istmina'] },
  { dep: 'Córdoba',            ciudades: ['Montería','Montelíbano','Sahagún','Cereté'] },
  { dep: 'Cundinamarca',       ciudades: ['Soacha','Fusagasugá','Zipaquirá','Facatativá','Chía','Mosquera','Madrid','Funza','Girardot','Cajicá'] },
  { dep: 'Huila',              ciudades: ['Neiva','Pitalito','Garzón','La Plata'] },
  { dep: 'La Guajira',         ciudades: ['Riohacha','Maicao','Uribia'] },
  { dep: 'Magdalena',          ciudades: ['Santa Marta','Ciénaga','Fundación'] },
  { dep: 'Meta',               ciudades: ['Villavicencio','Acacías','Granada'] },
  { dep: 'Nariño',             ciudades: ['Pasto','Tumaco','Ipiales'] },
  { dep: 'Norte de Santander', ciudades: ['Cúcuta','Ocaña','Pamplona','Villa del Rosario'] },
  { dep: 'Putumayo',           ciudades: ['Mocoa','Puerto Asís','Orito'] },
  { dep: 'Quindío',            ciudades: ['Armenia','Calarcá','Montenegro','La Tebaida'] },
  { dep: 'Risaralda',          ciudades: ['Pereira','Dosquebradas','Santa Rosa de Cabal'] },
  { dep: 'San Andrés',         ciudades: ['San Andrés','Providencia'] },
  { dep: 'Santander',          ciudades: ['Bucaramanga','Floridablanca','Girón','Piedecuesta','Barrancabermeja'] },
  { dep: 'Sucre',              ciudades: ['Sincelejo','Corozal','Sampués'] },
  { dep: 'Tolima',             ciudades: ['Ibagué','Espinal','Melgar','Honda'] },
  { dep: 'Valle del Cauca',    ciudades: ['Cali','Buenaventura','Palmira','Tuluá','Buga','Cartago','Jamundí','Yumbo'] },
  { dep: 'Amazonas',           ciudades: ['Leticia'] },
  { dep: 'Arauca',             ciudades: ['Arauca','Saravena'] },
  { dep: 'Guainía',            ciudades: ['Inírida'] },
  { dep: 'Guaviare',           ciudades: ['San José del Guaviare'] },
  { dep: 'Vaupés',             ciudades: ['Mitú'] },
  { dep: 'Vichada',            ciudades: ['Puerto Carreño'] },
];
const ALL_CITIES = COLOMBIA.flatMap(({ dep, ciudades }) => ciudades.map(c => ({ label: c, value: `${c}, ${dep}`, dep })));

// ── CitySelect ─────────────────────────────────────────────────────────────
const CitySelect: React.FC<{ value: string; onChange: (v: string) => void; className?: string }> = ({ value, onChange, className }) => {
  const [open, setOpen] = useState(false);
  const [q, setQ]       = useState('');
  const ref             = useRef<HTMLDivElement>(null);
  const inputRef        = useRef<HTMLInputElement>(null);

  const filtered = q.trim()
    ? ALL_CITIES.filter(c => c.label.toLowerCase().includes(q.toLowerCase()) || c.dep.toLowerCase().includes(q.toLowerCase()))
    : ALL_CITIES;

  const grouped = filtered.reduce<Record<string, typeof filtered>>((acc, c) => {
    (acc[c.dep] = acc[c.dep] || []).push(c); return acc;
  }, {});

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const label = value ? ALL_CITIES.find(c => c.value === value)?.label ?? value : '';

  return (
    <div ref={ref} className={`relative ${className ?? ''}`}>
      <button type="button"
        onClick={() => { setOpen(o => !o); setTimeout(() => inputRef.current?.focus(), 50); }}
        className="w-full flex items-center gap-2 pl-10 pr-3 h-[42px] border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#d65391]/30 focus:border-[#d65391] transition-all text-left"
        style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', color: value ? '#111' : '#9ca3af' }}>
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#d65391] pointer-events-none" />
        <span className="flex-1 truncate">{label || 'Selecciona tu ciudad'}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)}
                placeholder="Buscar ciudad..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 outline-none focus:border-[#d65391] bg-gray-50"
                style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} />
            </div>
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: 200 }}>
            {Object.keys(grouped).length === 0
              ? <p className="text-center py-4 text-xs text-gray-400">Sin resultados</p>
              : Object.entries(grouped).map(([dep, cities]) => (
                <div key={dep}>
                  <p className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50"
                    style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>{dep}</p>
                  {cities.map(c => (
                    <button key={c.value} type="button"
                      onClick={() => { onChange(c.value); setOpen(false); setQ(''); }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-[#fdf2f8] hover:text-[#d65391] transition-colors
                        ${value === c.value ? 'bg-[#fdf2f8] text-[#d65391] font-semibold' : 'text-gray-700'}`}
                      style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
                      {c.label}
                    </button>
                  ))}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

const fieldClass = (error?: string) =>
  `w-full pl-10 pr-3 h-[42px] text-sm border rounded-xl focus:outline-none focus:ring-2 transition-all ${
    error ? 'border-red-300 focus:ring-red-200 bg-red-50' : 'border-gray-200 focus:ring-[#d65391]/30 focus:border-[#d65391]'
  }`;

// ═══════════════════════════════════════════════════════════════════════════
export const PerfilView: React.FC<PerfilViewProps> = ({ onBack, onLogout }) => {
  const { user, refreshUser, logout } = useAuth();
  const { carritoItems, favoritos } = useTienda();

  const [editModalOpen, setEditModalOpen]         = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [pedidosModalOpen, setPedidosModalOpen]   = useState(false);
  const [saving, setSaving]                       = useState(false);
  const [showPwd, setShowPwd]                     = useState({ current: false, new: false, confirm: false });
  const [passwordData, setPasswordData]           = useState({ current: '', new: '', confirm: '' });
  const [notifications, setNotifications] = useState(true);

  const [profileData, setProfileData] = useState({ telefono: '', direccion: '', ciudad: '', documento: '', emailVerificado: false });
  const [formData, setFormData]       = useState({ nombre: '', telefono: '', direccion: '', ciudad: '', documento: '' });
  const [errors, setErrors]           = useState({ nombre: '', telefono: '', direccion: '', documento: '' });

  useEffect(() => {
    if (!user?.usuarioID) return;
    getJson(`/api/usuarios/${user.usuarioID}`)
      .then((res: any) => {
        const d = res?.data || res;
        const p = { telefono: d?.telefono || '', direccion: d?.direccion || '', ciudad: d?.ciudad || '', documento: d?.documento || '', emailVerificado: !!d?.emailVerificado };
        setProfileData(p);
        setFormData({ nombre: d?.nombreCompleto || user?.name || '', ...p });
        if (typeof d?.notificacionesEmail === 'boolean') setNotifications(d.notificacionesEmail);
      })
      .catch(() => setFormData({ nombre: user?.name || '', telefono: '', direccion: '', ciudad: '', documento: '' }));
  }, [user?.usuarioID]);

  const handleSaveProfile = async () => {
    const newErr = { nombre: '', telefono: '', direccion: '', documento: '' };
    if (!formData.nombre.trim()) newErr.nombre = 'El nombre es requerido';
    if (formData.telefono && !/^\d{7,15}$/.test(formData.telefono)) newErr.telefono = 'Teléfono inválido (7-15 dígitos)';
    if (formData.documento && !/^\d{5,15}$/.test(formData.documento)) newErr.documento = 'Documento inválido (5-15 dígitos)';
    setErrors(newErr);
    if (Object.values(newErr).some(Boolean)) return;
    setSaving(true);
    try {
      await api.fetchWithAuth(`/api/usuarios/${user?.usuarioID}`, { method: 'PUT', body: JSON.stringify({ NombreCompleto: formData.nombre, Telefono: formData.telefono, Direccion: formData.direccion, Ciudad: formData.ciudad, Documento: formData.documento }) });
      await refreshUser();
      setProfileData({ telefono: formData.telefono, direccion: formData.direccion, ciudad: formData.ciudad, documento: formData.documento });
      setEditModalOpen(false);
      toast.success('Perfil actualizado correctamente');
    } catch (e: any) { toast.error('Error al guardar', { description: e?.data?.message }); }
    finally { setSaving(false); }
  };

  const handleChangePassword = async () => {
    if (!passwordData.current || !passwordData.new || !passwordData.confirm) { toast.error('Completa todos los campos'); return; }
    if (passwordData.new !== passwordData.confirm) { toast.error('Las contraseñas no coinciden'); return; }
    const pwdRegex = /^(?=(.*\d){2})(?=.*[^a-zA-Z0-9\s]).{9,20}$/;
    if (!pwdRegex.test(passwordData.new)) { toast.error('La contraseña debe tener entre 9 y 20 caracteres, al menos 2 números y 1 carácter especial'); return; }
    setSaving(true);
    try {
      await api.postJson('/api/auth/change-password', { ContrasenaActual: passwordData.current, NuevaContrasena: passwordData.new });
      toast.success('Contraseña actualizada. Inicia sesión nuevamente.');
      setPasswordModalOpen(false);
      setPasswordData({ current: '', new: '', confirm: '' });
      setTimeout(() => logout(), 1500);
    } catch (e: any) { toast.error('Error al cambiar contraseña', { description: e?.data?.message }); }
    finally { setSaving(false); }
  };

  // ── Pedidos ──────────────────────────────────────────────────────────────
  const [pedidos, setPedidos]         = useState<PedidoApi[]>([]);
  const [loadingP, setLoadingP]       = useState(false);
  const [pedidoSelec, setPedidoSelec] = useState<PedidoApi | null>(null);

  const cargarPedidos = useCallback(async () => {
    if (!user?.email) return;
    setLoadingP(true);
    try {
      const res = await getJson('/api/pedidos');
      const all: PedidoApi[] = (res?.data || res || []).map((p: any) => ({
        pedidoID: p.pedidoID, emailCliente: p.emailCliente ?? '', nombreCliente: p.nombreCliente ?? '',
        total: p.total ?? 0, subtotal: p.subtotal ?? 0, descuento: p.descuento ?? 0, envio: p.envio ?? 0,
        estado: p.estado ?? '', fechaPedido: p.fechaPedido ?? '', metodoPago: p.metodoPago ?? '',
        ciudad: p.ciudad ?? '', direccionEnvio: p.direccionEnvio ?? '',
        numeroGuia: p.numeroGuia ?? '', transportadora: p.transportadora ?? '', notas: p.notas ?? '',
        detalles: (p.detalles ?? []).map((d: any) => ({
          productoID: d.productoID, productoNombre: d.productoNombre ?? '',
          imagenProducto: d.imagenProducto ?? '',
          talla: d.talla ?? '', color: d.color ?? '',
          cantidad: d.cantidad ?? 1, precioUnitario: d.precioUnitario ?? 0, subtotal: d.subtotal ?? 0,
        })),
      }));
      setPedidos(all.filter(p => p.emailCliente.toLowerCase() === (user.email ?? '').toLowerCase())
        .sort((a, b) => new Date(b.fechaPedido).getTime() - new Date(a.fechaPedido).getTime()));
    } catch { toast.error('Error cargando pedidos'); }
    finally { setLoadingP(false); }
  }, [user?.email]);

  useEffect(() => { cargarPedidos(); }, [cargarPedidos]);
  const pedidosAprobados = pedidos.filter(p => ['Aprobado', 'Completado'].includes(p.estado));

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">

      {/* ── Nav top ── */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <button type="button" title="Volver" onClick={onBack} className="p-2 hover:bg-gray-100 rounded-xl transition-colors flex-shrink-0">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </button>
        <span className="text-sm text-gray-500 truncate">Mi cuenta</span>
      </div>

      <div className="min-h-[calc(100vh-53px)] bg-white">
      <div className="max-w-3xl mx-auto px-8 py-8">

        {/* Título */}
        <h1 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-6">Perfil</h1>

        {/* Card info personal */}
        <div className="border border-gray-200 overflow-hidden mb-6">
          <div className="px-5 py-4 flex items-center justify-between border-b border-gray-200">
            <span className="text-sm font-medium text-gray-900">{user?.name || 'Mi cuenta'}</span>
            <button type="button"
              onClick={() => { setFormData({ nombre: user?.name || '', ...profileData }); setErrors({ nombre: '', telefono: '', direccion: '' }); setEditModalOpen(true); }}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
              <Edit className="w-4 h-4" />
            </button>
          </div>
          <div className="px-5 py-4 space-y-3">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Correo electrónico</p>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm text-gray-900">{user?.email}</p>
                {profileData.emailVerificado
                  ? <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">✓ Verificado</span>
                  : <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full">Sin verificar</span>
                }
              </div>
            </div>
            {[
              { label: 'Teléfono',    value: profileData.telefono  || '—' },
              { label: 'Documento',   value: profileData.documento || '—' },
              { label: 'Ciudad',      value: profileData.ciudad    || '—' },
              { label: 'Dirección',   value: profileData.direccion || '—' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                <p className="text-sm text-gray-900">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Mis pedidos */}
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-3">Mis pedidos</h2>
        <div className="border border-gray-200 overflow-hidden mb-6">
          <button type="button"
            onClick={() => { setPedidosModalOpen(true); cargarPedidos(); }}
            className="w-full px-5 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <span className="text-sm text-gray-700">Ver mis pedidos</span>
            <Package className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Cambiar contraseña */}
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-3">Cambiar contraseña</h2>
        <div className="border border-gray-200 overflow-hidden mb-6">
          <button type="button"
            onClick={() => setPasswordModalOpen(true)}
            className="w-full px-5 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <span className="text-sm text-gray-700">Cambiar contraseña</span>
            <Edit className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Notificaciones */}
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-3">Notificaciones</h2>
        <div className="border border-gray-200 overflow-hidden mb-8">
          <div className="px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700">Recibir notificaciones</p>
              <p className="text-xs text-gray-400 mt-0.5">Activa o desactiva las notificaciones de tus pedidos</p>
            </div>
            <button type="button"
              role="switch"
              aria-checked={notifications}
              aria-label={notifications ? 'Desactivar notificaciones' : 'Activar notificaciones'}
              onClick={() => {
                const n = !notifications;
                setNotifications(n);
                api.fetchWithAuth(`/api/usuarios/${user?.usuarioID}`, {
                  method: 'PUT',
                  body: JSON.stringify({ NotificacionesEmail: n })
                })
                  .then(() => toast.success(n ? 'Notificaciones activadas' : 'Notificaciones desactivadas'))
                  .catch(() => toast.error('Error al guardar preferencia'));
              }}
              className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${notifications ? 'bg-gray-900' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${notifications ? 'left-6' : 'left-1'}`} />
            </button>
          </div>
        </div>

        {/* Cerrar sesión */}
        <div className="border border-gray-200 overflow-hidden">
          <button type="button" onClick={onLogout}
            className="w-full px-5 py-4 text-left flex items-center justify-between hover:bg-red-50 transition-colors group">
            <span className="text-sm text-red-500 group-hover:text-red-600">Cerrar sesión</span>
            <LogOut className="w-4 h-4 text-red-400 group-hover:text-red-500" />
          </button>
        </div>

      </div>
      </div>

      {/* ══ Modal Editar Perfil ══ */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden gap-0 max-h-[90vh] flex flex-col">
          {/* Título */}
          <div style={{ padding: '28px 32px 20px' }} className="border-b border-gray-100 flex-shrink-0">
            <DialogTitle style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
              className="text-2xl font-black uppercase text-gray-900 leading-tight">
              Editar perfil
            </DialogTitle>
            <DialogDescription style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
              className="text-sm text-gray-500 mt-1">
              {user?.email}
            </DialogDescription>
          </div>

          {/* Campos */}
          <div style={{ padding: '24px 32px' }} className="space-y-5 overflow-y-auto flex-1">
            {/* Nombre */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2"
                style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
                Nombre completo <span className="text-red-400 normal-case tracking-normal">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" value={formData.nombre}
                  onChange={e => {
                    const val = e.target.value;
                    if (val && !/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]*$/.test(val)) { setErrors(p => ({ ...p, nombre: 'Solo se permiten letras' })); return; }
                    setFormData(p => ({ ...p, nombre: val })); setErrors(p => ({ ...p, nombre: '' }));
                  }}
                  className={`w-full pl-10 pr-3 h-11 text-sm border focus:outline-none focus:border-gray-900 transition-colors ${errors.nombre ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                  placeholder="Tu nombre completo"
                  style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} />
              </div>
              {errors.nombre && <p className="text-xs text-red-500 mt-1">{errors.nombre}</p>}
            </div>

            {/* Teléfono */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2"
                style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>Teléfono</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="tel" value={formData.telefono}
                  onChange={e => {
                    const val = e.target.value;
                    if (val && !/^\d*$/.test(val)) { setErrors(p => ({ ...p, telefono: 'Solo se permiten números' })); return; }
                    setFormData(p => ({ ...p, telefono: val })); setErrors(p => ({ ...p, telefono: '' }));
                  }}
                  className={`w-full pl-10 pr-3 h-11 text-sm border focus:outline-none focus:border-gray-900 transition-colors ${errors.telefono ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                  placeholder="3001234567"
                  style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} />
              </div>
              {errors.telefono && <p className="text-xs text-red-500 mt-1">{errors.telefono}</p>}
            </div>

            {/* Documento */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2"
                style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>Documento</label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" value={formData.documento}
                  onChange={e => {
                    const val = e.target.value;
                    if (val && !/^\d*$/.test(val)) { setErrors(p => ({ ...p, documento: 'Solo se permiten números' })); return; }
                    setFormData(p => ({ ...p, documento: val })); setErrors(p => ({ ...p, documento: '' }));
                  }}
                  className={`w-full pl-10 pr-3 h-11 text-sm border focus:outline-none focus:border-gray-900 transition-colors ${errors.documento ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                  placeholder="Número de documento"
                  style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} />
              </div>
              {errors.documento && <p className="text-xs text-red-500 mt-1">{errors.documento}</p>}
            </div>

            {/* Ciudad */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2"
                style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>Ciudad</label>
              <CitySelect value={formData.ciudad} onChange={v => setFormData(p => ({ ...p, ciudad: v }))} />
            </div>

            {/* Dirección */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2"
                style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>Dirección</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <textarea value={formData.direccion}
                  onChange={e => { setFormData(p => ({ ...p, direccion: e.target.value })); setErrors(p => ({ ...p, direccion: '' })); }}
                  className={`w-full pl-10 pr-3 py-2.5 text-sm border focus:outline-none focus:border-gray-900 min-h-[44px] max-h-[80px] resize-none transition-colors ${errors.direccion ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                  placeholder="Calle 10 # 43E – 125, Apto 301..."
                  style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} />
              </div>
              {errors.direccion && <p className="text-xs text-red-500 mt-1">{errors.direccion}</p>}
            </div>
          </div>

          {/* Acciones */}
          <div style={{ padding: '16px 32px 28px' }} className="border-t border-gray-100 flex justify-end gap-3 flex-shrink-0">
            <button type="button" onClick={() => setEditModalOpen(false)}
              className="h-10 px-5 text-sm text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
              style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
              Cancelar
            </button>
            <button type="button" onClick={handleSaveProfile} disabled={saving}
              className="h-10 px-5 text-sm font-semibold text-white bg-gray-900 hover:bg-gray-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ══ Modal Cambiar Contraseña ══ */}
      <Dialog open={passwordModalOpen} onOpenChange={v => { setPasswordModalOpen(v); if (!v) setPasswordData({ current: '', new: '', confirm: '' }); }}>
        <DialogContent className="max-w-md p-0 overflow-hidden gap-0">
          {/* Título */}
          <div style={{ padding: '28px 32px 20px' }} className="border-b border-gray-100">
            <DialogTitle style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
              className="text-2xl font-black uppercase text-gray-900 leading-tight">
              Cambiar contraseña
            </DialogTitle>
            <DialogDescription style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
              className="text-sm text-gray-500 mt-1">
              Mantén tu cuenta segura con una contraseña fuerte
            </DialogDescription>
          </div>

          {/* Campos */}
          <div style={{ padding: '24px 32px' }} className="space-y-5">
            {([
              { key: 'current', label: 'Contraseña actual',          placeholder: 'Tu contraseña actual' },
              { key: 'new',     label: 'Nueva contraseña',            placeholder: 'Mínimo 9 caracteres'  },
              { key: 'confirm', label: 'Confirmar nueva contraseña',  placeholder: 'Repite la contraseña'  },
            ] as const).map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2"
                  style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
                  {label}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPwd[key] ? 'text' : 'password'}
                    value={passwordData[key]}
                    onChange={e => setPasswordData(p => ({ ...p, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full pl-10 pr-10 h-11 text-sm border border-gray-200 focus:outline-none focus:border-gray-900 transition-colors"
                    style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                  />
                  <button type="button" aria-label="Mostrar/Ocultar"
                    onClick={() => setShowPwd(p => ({ ...p, [key]: !p[key] }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                    {showPwd[key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {key === 'new' && passwordData.new.length > 0 && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex gap-1 flex-1">
                      {[1,2,3,4].map(i => (
                        <div key={i} className={`h-1 flex-1 transition-colors ${
                          passwordData.new.length >= i * 3
                            ? i <= 1 ? 'bg-red-400' : i <= 2 ? 'bg-yellow-400' : i <= 3 ? 'bg-blue-400' : 'bg-green-500'
                            : 'bg-gray-200'}`} />
                      ))}
                    </div>
                    <span className="text-xs text-gray-400 w-12 text-right"
                      style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
                      {passwordData.new.length < 6 ? 'Débil' : passwordData.new.length < 9 ? 'Regular' : passwordData.new.length < 12 ? 'Buena' : 'Fuerte'}
                    </span>
                  </div>
                )}
                {key === 'confirm' && passwordData.confirm && passwordData.new !== passwordData.confirm && (
                  <p className="text-xs text-red-500 mt-1.5"
                    style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
                    Las contraseñas no coinciden
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Acciones */}
          <div style={{ padding: '16px 32px 28px' }} className="border-t border-gray-100 flex items-center justify-end gap-3">
            <button type="button"
              onClick={() => { setPasswordModalOpen(false); setPasswordData({ current: '', new: '', confirm: '' }); }}
              className="h-10 px-5 text-sm text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
              style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
              Cancelar
            </button>
            <button type="button" onClick={handleChangePassword} disabled={saving}
              className="h-10 px-5 text-sm font-semibold text-white bg-gray-900 hover:bg-gray-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {saving ? 'Guardando...' : 'Actualizar contraseña'}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ══ Modal Pedidos ══ */}
      <Dialog open={pedidosModalOpen} onOpenChange={v => { setPedidosModalOpen(v); if (!v) setPedidoSelec(null); }}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden gap-0 max-h-[90vh] flex flex-col">

          {/* Título */}
          <div style={{ padding: '28px 32px 20px' }} className="border-b border-gray-100 flex items-start justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              {pedidoSelec && (
                <button type="button" onClick={() => setPedidoSelec(null)}
                  className="p-1 -ml-1 hover:bg-gray-100 transition-colors rounded">
                  <ArrowLeft className="w-4 h-4 text-gray-500" />
                </button>
              )}
              <div>
                <DialogTitle style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                  className="text-2xl font-black uppercase text-gray-900 leading-tight">
                  {pedidoSelec ? `Pedido #${pedidoSelec.pedidoID}` : 'Mis pedidos'}
                </DialogTitle>
                <DialogDescription style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                  className="text-sm text-gray-500 mt-1">
                  {pedidoSelec
                    ? new Date(pedidoSelec.fechaPedido).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })
                    : `${pedidos.length} pedido${pedidos.length !== 1 ? 's' : ''} en total`}
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {!pedidoSelec && (
                <button type="button" title="Actualizar" onClick={cargarPedidos} disabled={loadingP}
                  className="p-1.5 hover:bg-gray-100 transition-colors rounded text-gray-400 disabled:opacity-40">
                  <RefreshCw className={`w-4 h-4 ${loadingP ? 'animate-spin' : ''}`} />
                </button>
              )}
            </div>
          </div>

          <div className="overflow-y-auto flex-1">

            {/* ── Vista lista ── */}
            {!pedidoSelec && (
              <div style={{ padding: '24px 32px' }}>
                {loadingP && pedidos.length === 0 ? (
                  <div className="flex flex-col items-center py-16 gap-3">
                    <Loader2 className="w-7 h-7 animate-spin text-gray-400" />
                    <p className="text-sm text-gray-400" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>Cargando pedidos...</p>
                  </div>
                ) : pedidos.length === 0 ? (
                  <div className="text-center py-16">
                    <Package className="w-10 h-10 text-gray-300 mx-auto mb-4" />
                    <p className="text-base font-semibold text-gray-800" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>Sin pedidos aún</p>
                    <p className="text-sm text-gray-400 mt-1" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>Tus pedidos aparecerán aquí cuando realices una compra</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {pedidos.map(pedido => {
                      const cfg = estadoConfig[pedido.estado] || estadoConfig.Pendiente;
                      return (
                        <button key={pedido.pedidoID} type="button"
                          onClick={() => setPedidoSelec(pedido)}
                          className="w-full text-left border border-gray-100 p-5 hover:border-gray-300 hover:bg-gray-50 transition-all">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="font-bold text-gray-900 text-base uppercase tracking-wide"
                                  style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
                                  #{pedido.pedidoID}
                                </span>
                                <span className={`px-2 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
                              </div>
                              <p className="text-sm text-gray-500 flex items-center gap-1.5"
                                style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
                                <Calendar className="w-3.5 h-3.5" />
                                {new Date(pedido.fechaPedido).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
                              </p>
                            </div>
                            <p className="text-base font-bold text-gray-900 flex-shrink-0"
                              style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
                              {fmt(pedido.total)}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs mt-3 pt-3 border-t border-gray-100">
                            {pedido.metodoPago && (
                              <span className="text-gray-500 flex items-center gap-1">
                                <CreditCard className="w-3 h-3" />{pedido.metodoPago}
                              </span>
                            )}
                            {pedido.ciudad && (
                              <span className="text-gray-500 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />{pedido.ciudad}
                              </span>
                            )}
                            {pedido.numeroGuia && (
                              <span className="text-blue-600 flex items-center gap-1 font-medium">
                                <Truck className="w-3 h-3" />Guía: {pedido.numeroGuia}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── Vista detalle ── */}
            {pedidoSelec && (() => {
              const cfg = estadoConfig[pedidoSelec.estado] || estadoConfig.Pendiente;
              return (
                <div style={{ padding: '24px 32px' }} className="space-y-6">

                  {/* Estado + Total */}
                  <div className="flex items-center justify-between py-4 border-b border-gray-100">
                    <span className={`px-3 py-1 text-xs font-semibold uppercase tracking-wide ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
                    <span className="text-2xl font-black text-gray-900"
                      style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
                      {fmt(pedidoSelec.total)}
                    </span>
                  </div>

                  {/* Productos */}
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3"
                      style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>Productos</p>
                    <div className="space-y-3">
                      {(pedidoSelec.detalles ?? []).map((d, i) => (
                        <div key={i} className="flex gap-4 border border-gray-100 p-4">
                          <div className="w-16 h-16 overflow-hidden bg-gray-100 flex-shrink-0">
                            {d.imagenProducto ? (
                              <img src={d.imagenProducto.startsWith('http') ? d.imagenProducto : `${apiBase}${d.imagenProducto}`}
                                alt={d.productoNombre} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-6 h-6 text-gray-300" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 mb-1"
                              style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>{d.productoNombre}</p>
                            <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-2">
                              {d.talla && <span>Talla: {d.talla}</span>}
                              {d.talla && d.color && <span>·</span>}
                              {d.color && <span>Color: {d.color}</span>}
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-400"
                                style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
                                {fmt(d.precioUnitario)} × {d.cantidad}
                              </span>
                              <span className="text-sm font-bold text-gray-900"
                                style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>{fmt(d.subtotal)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Resumen de pago */}
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3"
                      style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>Resumen</p>
                    <div className="border border-gray-100">
                      {[
                        { label: 'Subtotal', value: fmt(pedidoSelec.subtotal ?? 0), className: 'text-gray-600' },
                        ...((pedidoSelec.descuento ?? 0) > 0 ? [{ label: 'Descuento', value: `-${fmt(pedidoSelec.descuento ?? 0)}`, className: 'text-green-600' }] : []),
                        { label: 'Envío', value: (pedidoSelec.envio ?? 0) === 0 ? 'Gratis' : fmt(pedidoSelec.envio ?? 0), className: 'text-gray-600' },
                      ].map(({ label, value, className }) => (
                        <div key={label} className={`flex justify-between text-sm px-4 py-3 border-b border-gray-100 ${className}`}
                          style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
                          <span>{label}</span><span>{value}</span>
                        </div>
                      ))}
                      <div className="flex justify-between text-base font-bold text-gray-900 px-4 py-3"
                        style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
                        <span>Total</span><span>{fmt(pedidoSelec.total)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Info envío */}
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3"
                      style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>Envío</p>
                    <div className="border border-gray-100">
                      {[
                        { icon: <CreditCard className="w-4 h-4 text-gray-400" />, label: 'Método de pago', value: pedidoSelec.metodoPago },
                        { icon: <MapPin className="w-4 h-4 text-gray-400" />,     label: 'Ciudad',         value: pedidoSelec.ciudad },
                        { icon: <MapPin className="w-4 h-4 text-gray-400" />,     label: 'Dirección',      value: pedidoSelec.direccionEnvio },
                        ...(pedidoSelec.numeroGuia ? [{ icon: <Truck className="w-4 h-4 text-gray-400" />, label: 'Número de guía', value: `${pedidoSelec.numeroGuia}${pedidoSelec.transportadora ? ` · ${pedidoSelec.transportadora}` : ''}` }] : []),
                      ].filter(r => r.value).map(({ icon, label, value }) => (
                        <div key={label} className="flex items-start gap-3 px-4 py-3 border-b border-gray-100 last:border-b-0">
                          <span className="mt-0.5 flex-shrink-0">{icon}</span>
                          <div className="min-w-0">
                            <p className="text-xs text-gray-400 mb-0.5"
                              style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>{label}</p>
                            <p className="text-sm text-gray-800 break-words"
                              style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>{value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {pedidoSelec.notas && (
                    <div className="border border-gray-100 p-4 text-sm text-gray-600"
                      style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
                      <span className="font-semibold text-gray-900">Notas: </span>{pedidoSelec.notas}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
