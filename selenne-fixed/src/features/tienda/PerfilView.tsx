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
        style={{ fontFamily: 'Inter, sans-serif', color: value ? '#111' : '#9ca3af' }}>
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
                style={{ fontFamily: 'Inter, sans-serif' }} />
            </div>
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: 200 }}>
            {Object.keys(grouped).length === 0
              ? <p className="text-center py-4 text-xs text-gray-400">Sin resultados</p>
              : Object.entries(grouped).map(([dep, cities]) => (
                <div key={dep}>
                  <p className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50"
                    style={{ fontFamily: 'Inter, sans-serif' }}>{dep}</p>
                  {cities.map(c => (
                    <button key={c.value} type="button"
                      onClick={() => { onChange(c.value); setOpen(false); setQ(''); }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-[#fdf2f8] hover:text-[#d65391] transition-colors
                        ${value === c.value ? 'bg-[#fdf2f8] text-[#d65391] font-semibold' : 'text-gray-700'}`}
                      style={{ fontFamily: 'Inter, sans-serif' }}>
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
    if (passwordData.new.length < 6) { toast.error('Mínimo 6 caracteres'); return; }
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
        <span className="text-sm text-gray-500 truncate" style={{ fontFamily: 'Inter, sans-serif' }}>Mi cuenta</span>
        <button type="button" title="Cerrar sesión" onClick={onLogout}
          className="ml-auto flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 px-3 py-1.5 hover:bg-red-50 rounded-xl transition-colors flex-shrink-0"
          style={{ fontFamily: 'Inter, sans-serif' }}>
          <LogOut className="w-4 h-4" /> Cerrar sesión
        </button>
      </div>

      <div className="p-4 md:p-6 max-w-5xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">

          {/* ── Card principal ── */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

              {/* Banner rosa */}
              <div className="bg-gradient-to-r from-[#d65391] to-[#f8a9c5] p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-black opacity-5" />
                <div className="relative flex items-center gap-4 min-w-0">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center ring-4 ring-white/30 flex-shrink-0">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 style={{ fontFamily: 'Playfair Display, serif' }} className="text-xl text-white mb-1 truncate">
                      {user?.name || 'Mi Perfil'}
                    </h2>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Mail className="w-4 h-4 text-white/80 flex-shrink-0" />
                      <p className="text-white/80 text-sm truncate" style={{ fontFamily: 'Inter, sans-serif' }}>{user?.email}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info fields */}
              <div className="p-6">
                <h3 style={{ fontFamily: 'Playfair Display, serif' }} className="text-xl text-gray-900 mb-5">Información Personal</h3>
                <div className="space-y-3">
                  {/* Email con badge de verificado */}
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors overflow-hidden">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#d65391] to-[#f8a9c5] rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md shadow-[#d65391]/30">
                      <Mail className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <p className="text-xs text-gray-500 mb-0.5" style={{ fontFamily: 'Inter, sans-serif' }}>Correo Electrónico</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-900 truncate" style={{ fontFamily: 'Inter, sans-serif' }}>{user?.email}</p>
                        {profileData.emailVerificado
                          ? <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ fontFamily: 'Inter, sans-serif' }}>✓ Verificado</span>
                          : <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ fontFamily: 'Inter, sans-serif' }}>Sin verificar</span>
                        }
                      </div>
                    </div>
                  </div>
                  {[
                  { icon: <Phone className="w-5 h-5 text-white" />,      label: 'Teléfono de Contacto', value: profileData.telefono  || 'No especificado' },
                  { icon: <CreditCard className="w-5 h-5 text-white" />, label: 'Documento',             value: profileData.documento || 'No especificado' },
                  { icon: <MapPin className="w-5 h-5 text-white" />,     label: 'Ciudad',                value: profileData.ciudad    || 'No especificada'  },
                  { icon: <MapPin className="w-5 h-5 text-white" />,     label: 'Dirección',             value: profileData.direccion || 'No especificada'  },
                  ].map(({ icon, label, value }) => (
                    <div key={label} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors overflow-hidden">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#d65391] to-[#f8a9c5] rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md shadow-[#d65391]/30">
                        {icon}
                      </div>
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <p className="text-xs text-gray-500 mb-0.5" style={{ fontFamily: 'Inter, sans-serif' }}>{label}</p>
                        <p className="text-sm text-gray-900 truncate" style={{ fontFamily: 'Inter, sans-serif' }}>{value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-5 border-t border-gray-100">
                  <button type="button"
                    onClick={() => { setFormData({ nombre: user?.name || '', ...profileData }); setErrors({ nombre: '', telefono: '', direccion: '' }); setEditModalOpen(true); }}
                    className="w-full bg-black text-white px-6 h-[44px] rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                    style={{ fontFamily: 'Inter, sans-serif' }}>
                    <Edit className="w-4 h-4" /> Editar Perfil
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── Sidebar ── */}
          <div className="space-y-5">

            {/* Resumen */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-[#d65391] to-[#f8a9c5] px-5 py-3">
                <h3 style={{ fontFamily: 'Playfair Display, serif' }} className="text-base text-white font-semibold">Resumen</h3>
              </div>
              <div className="p-4 grid grid-cols-3 gap-3">
                {[
                  { icon: <ShoppingBag className="w-5 h-5 text-[#d65391]" />, label: 'Carrito',  value: carritoItems.length      },
                  { icon: <Heart className="w-5 h-5 text-[#d65391]" />,       label: 'Favoritos', value: favoritos.length         },
                  { icon: <Package className="w-5 h-5 text-[#d65391]" />,     label: 'Pedidos',   value: pedidosAprobados.length  },
                ].map(({ icon, label, value }) => (
                  <div key={label} className="flex flex-col items-center gap-1.5 bg-[#fdf2f8] rounded-xl p-3">
                    <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      {icon}
                    </div>
                    <span className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Inter, sans-serif' }}>{value}</span>
                    <span className="text-[10px] text-gray-500 text-center leading-tight" style={{ fontFamily: 'Inter, sans-serif' }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mis pedidos */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Package className="w-5 h-5 text-[#d65391]" />
                <h3 style={{ fontFamily: 'Playfair Display, serif' }} className="text-lg text-gray-900">Mis Pedidos</h3>
              </div>
              <button type="button" onClick={() => { setPedidosModalOpen(true); cargarPedidos(); }}
                className="w-full bg-black text-white px-4 py-2.5 rounded-xl hover:bg-gray-800 transition-colors text-sm"
                style={{ fontFamily: 'Inter, sans-serif' }}>
                Ver mis pedidos
              </button>
            </div>

            {/* Contraseña */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Lock className="w-5 h-5 text-[#d65391]" />
                <h3 style={{ fontFamily: 'Playfair Display, serif' }} className="text-lg text-gray-900">Cambiar Contraseña</h3>
              </div>
              <button type="button" onClick={() => setPasswordModalOpen(true)}
                className="w-full bg-black text-white px-4 py-2.5 rounded-xl hover:bg-gray-800 transition-colors text-sm"
                style={{ fontFamily: 'Inter, sans-serif' }}>
                Cambiar Contraseña
              </button>
            </div>

            {/* Notificaciones */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-[#d65391] to-[#f8a9c5] px-5 py-3 flex items-center gap-2">
                <Bell className="w-4 h-4 text-white" />
                <h3 style={{ fontFamily: 'Playfair Display, serif' }} className="text-base text-white font-semibold">Notificaciones</h3>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between p-3 bg-[#fdf2f8] rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      <Mail className="w-4 h-4 text-[#d65391]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800" style={{ fontFamily: 'Inter, sans-serif' }}>Email</p>
                      <p className="text-xs text-gray-400" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {notifications ? 'Activado' : 'Desactivado'}
                      </p>
                    </div>
                  </div>
                  <button type="button"
                    aria-label={notifications ? 'Desactivar notificaciones' : 'Activar notificaciones'}
                    onClick={async () => {
                    const n = !notifications;
                    setNotifications(n);
                    try {
                      await api.fetchWithAuth(`/api/usuarios/${user?.usuarioID}`, {
                        method: 'PUT',
                        body: JSON.stringify({ NotificacionesEmail: n })
                      });
                      toast.success(n ? 'Notificaciones de email activadas' : 'Notificaciones de email desactivadas');
                    } catch {
                      setNotifications(!n);
                      toast.error('Error al guardar preferencia');
                    }
                  }}
                    className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${notifications ? 'bg-[#d65391]' : 'bg-gray-300'}`}>
                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${notifications ? 'translate-x-6' : ''}`} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══ Modal Editar Perfil ══ */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent hideCloseButton className="max-w-md p-0 gap-0 rounded-2xl max-h-[90vh] flex flex-col">
          <div className="bg-gradient-to-r from-[#d65391] to-[#f8a9c5] px-6 py-5 flex items-center gap-4 flex-shrink-0">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center ring-2 ring-white/30 flex-shrink-0">
              <User className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }} className="text-xl text-white leading-tight">
                Editar Perfil
              </DialogTitle>
              <DialogDescription className="text-white/80 text-sm mt-0.5" style={{ fontFamily: 'Inter, sans-serif' }}>
                {user?.email}
              </DialogDescription>
            </div>
            <button type="button" aria-label="Cerrar" onClick={() => setEditModalOpen(false)} className="text-white/70 hover:text-white transition-colors flex-shrink-0">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
            <div>
              <label className="text-xs text-gray-600 block mb-1.5" style={{ fontFamily: 'Inter, sans-serif' }}>
                Nombre Completo <span className="text-[#d65391]">*</span>
              </label>
              <div className="relative">
                <User className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${errors.nombre ? 'text-red-400' : 'text-[#d65391]'}`} />
                <input type="text" value={formData.nombre}
                  onChange={e => { setFormData(p => ({ ...p, nombre: e.target.value })); setErrors(p => ({ ...p, nombre: '' })); }}
                  className={fieldClass(errors.nombre)} placeholder="Tu nombre completo"
                  style={{ fontFamily: 'Inter, sans-serif' }} />
              </div>
              {errors.nombre && <p className="text-xs text-red-500 mt-1">{errors.nombre}</p>}
            </div>

            <div>
              <label className="text-xs text-gray-600 block mb-1.5" style={{ fontFamily: 'Inter, sans-serif' }}>Teléfono</label>
              <div className="relative">
                <Phone className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${errors.telefono ? 'text-red-400' : 'text-[#d65391]'}`} />
                <input type="tel" value={formData.telefono}
                  onChange={e => { setFormData(p => ({ ...p, telefono: e.target.value })); setErrors(p => ({ ...p, telefono: '' })); }}
                  className={fieldClass(errors.telefono)} placeholder="3001234567"
                  style={{ fontFamily: 'Inter, sans-serif' }} />
              </div>
              {errors.telefono && <p className="text-xs text-red-500 mt-1">{errors.telefono}</p>}
            </div>

            <div>
              <label className="text-xs text-gray-600 block mb-1.5" style={{ fontFamily: 'Inter, sans-serif' }}>Documento</label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#d65391]" />
                <input type="text" value={formData.documento}
                  onChange={e => { setFormData(p => ({ ...p, documento: e.target.value })); setErrors(p => ({ ...p, documento: '' })); }}
                  className={fieldClass(errors.documento)} placeholder="Número de documento"
                  style={{ fontFamily: 'Inter, sans-serif' }} />
              </div>
              {errors.documento && <p className="text-xs text-red-500 mt-1">{errors.documento}</p>}
            </div>

            <div>
              <label className="text-xs text-gray-600 block mb-1.5" style={{ fontFamily: 'Inter, sans-serif' }}>Ciudad / Municipio</label>
              <CitySelect value={formData.ciudad} onChange={v => setFormData(p => ({ ...p, ciudad: v }))} />
            </div>

            <div>
              <label className="text-xs text-gray-600 block mb-1.5" style={{ fontFamily: 'Inter, sans-serif' }}>
                Dirección <span className="text-[#d65391]">*</span>
              </label>
              <div className="relative">
                <MapPin className={`absolute left-3 top-3 w-4 h-4 ${errors.direccion ? 'text-red-400' : 'text-[#d65391]'}`} />
                <textarea value={formData.direccion}
                  onChange={e => { setFormData(p => ({ ...p, direccion: e.target.value })); setErrors(p => ({ ...p, direccion: '' })); }}
                  style={{ fontFamily: 'Inter, sans-serif' }}
                  className={`w-full pl-10 pr-3 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 min-h-[42px] max-h-[80px] resize-none transition-all ${errors.direccion ? 'border-red-300 focus:ring-red-200 bg-red-50' : 'border-gray-200 focus:ring-[#d65391]/30 focus:border-[#d65391]'}`}
                  placeholder="Calle 10 # 43E – 125, Apto 301..." />
              </div>
              {errors.direccion && <p className="text-xs text-red-500 mt-1">{errors.direccion}</p>}
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 flex-shrink-0">
            <button type="button" onClick={() => setEditModalOpen(false)}
              className="px-5 h-[40px] text-sm bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors flex items-center gap-2"
              style={{ fontFamily: 'Inter, sans-serif' }}>
              <X className="w-4 h-4" /> Cancelar
            </button>
            <button type="button" onClick={handleSaveProfile} disabled={saving}
              className="px-5 h-[40px] text-sm bg-gradient-to-r from-[#d65391] to-[#f8a9c5] text-white rounded-xl hover:opacity-90 transition-all flex items-center gap-2 shadow-sm disabled:opacity-60"
              style={{ fontFamily: 'Inter, sans-serif' }}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ══ Modal Cambiar Contraseña ══ */}
      <Dialog open={passwordModalOpen} onOpenChange={setPasswordModalOpen}>
        <DialogContent hideCloseButton className="max-w-md p-0 rounded-2xl gap-0">
          <div className="bg-gradient-to-r from-[#d65391] to-[#f8a9c5] px-6 py-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center ring-2 ring-white/30 flex-shrink-0">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }} className="text-xl text-white">Cambiar Contraseña</DialogTitle>
              <DialogDescription className="text-white/80 text-xs mt-0.5" style={{ fontFamily: 'Inter, sans-serif' }}>
                Mantén tu cuenta segura con una contraseña fuerte
              </DialogDescription>
            </div>
            <button type="button" aria-label="Cerrar" onClick={() => setPasswordModalOpen(false)} className="text-white/70 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-6 py-5 space-y-4">
            {([
              { key: 'current', label: 'Contraseña Actual',          placeholder: 'Tu contraseña actual' },
              { key: 'new',     label: 'Nueva Contraseña',            placeholder: 'Mínimo 6 caracteres'  },
              { key: 'confirm', label: 'Confirmar Nueva Contraseña',  placeholder: 'Repite la contraseña'  },
            ] as const).map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="text-xs text-gray-600 block mb-1.5" style={{ fontFamily: 'Inter, sans-serif' }}>{label}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#d65391]" />
                  <input type={showPwd[key] ? 'text' : 'password'} value={passwordData[key]}
                    onChange={e => setPasswordData(p => ({ ...p, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full pl-10 pr-10 h-[42px] text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d65391]/30 focus:border-[#d65391] transition-all"
                    style={{ fontFamily: 'Inter, sans-serif' }} />
                  <button type="button" aria-label="Mostrar/Ocultar"
                    onClick={() => setShowPwd(p => ({ ...p, [key]: !p[key] }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                    {showPwd[key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {key === 'new' && passwordData.new.length > 0 && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex gap-1 flex-1">
                      {[1,2,3,4].map(i => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                          passwordData.new.length >= i * 3
                            ? i <= 1 ? 'bg-red-400' : i <= 2 ? 'bg-yellow-400' : i <= 3 ? 'bg-blue-400' : 'bg-green-400'
                            : 'bg-gray-200'}`} />
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
            <button type="button" onClick={() => { setPasswordModalOpen(false); setPasswordData({ current: '', new: '', confirm: '' }); }}
              className="px-5 h-[40px] text-sm bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors flex items-center gap-2"
              style={{ fontFamily: 'Inter, sans-serif' }}>
              <X className="w-4 h-4" /> Cancelar
            </button>
            <button type="button" onClick={handleChangePassword} disabled={saving}
              className="px-5 h-[40px] text-sm bg-gradient-to-r from-[#d65391] to-[#f8a9c5] text-white rounded-xl hover:opacity-90 transition-all flex items-center gap-2 shadow-sm disabled:opacity-60"
              style={{ fontFamily: 'Inter, sans-serif' }}>
              <Lock className="w-4 h-4" />
              {saving ? 'Guardando...' : 'Cambiar Contraseña'}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ══ Modal Pedidos ══ */}
      <Dialog open={pedidosModalOpen} onOpenChange={v => { setPedidosModalOpen(v); if (!v) setPedidoSelec(null); }}>
        <DialogContent hideCloseButton className="max-w-2xl p-0 rounded-2xl gap-0 max-h-[90vh] flex flex-col">

          {/* Header */}
          <div className="bg-gradient-to-r from-[#d65391] to-[#f8a9c5] px-6 py-5 flex items-center gap-4 flex-shrink-0">
            {pedidoSelec ? (
              <button type="button" onClick={() => setPedidoSelec(null)}
                className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors flex-shrink-0">
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
            ) : (
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Package className="w-5 h-5 text-white" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }} className="text-xl text-white leading-tight">
                {pedidoSelec ? `Pedido #${pedidoSelec.pedidoID}` : 'Mis Pedidos'}
              </DialogTitle>
              <DialogDescription className="text-white/80 text-xs mt-0.5" style={{ fontFamily: 'Inter, sans-serif' }}>
                {pedidoSelec
                  ? new Date(pedidoSelec.fechaPedido).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })
                  : `${pedidos.length} pedido${pedidos.length !== 1 ? 's' : ''} en total`}
              </DialogDescription>
            </div>
            {!pedidoSelec && (
              <button type="button" title="Actualizar" onClick={cargarPedidos} disabled={loadingP}
                className="text-white/70 hover:text-white transition-colors mr-1 disabled:opacity-50">
                <RefreshCw className={`w-4 h-4 ${loadingP ? 'animate-spin' : ''}`} />
              </button>
            )}
            <button type="button" aria-label="Cerrar" onClick={() => { setPedidosModalOpen(false); setPedidoSelec(null); }}
              className="text-white/70 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="overflow-y-auto flex-1">

            {/* ── Vista lista ── */}
            {!pedidoSelec && (
              <div className="p-5">
                {loadingP && pedidos.length === 0 ? (
                  <div className="flex flex-col items-center py-12 gap-3">
                    <Loader2 className="w-7 h-7 animate-spin text-[#d65391]" />
                    <p className="text-sm text-gray-400" style={{ fontFamily: 'Inter, sans-serif' }}>Cargando pedidos...</p>
                  </div>
                ) : pedidos.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-[#fdf2f8] rounded-full flex items-center justify-center mx-auto mb-4">
                      <Package className="w-8 h-8 text-[#d65391]" />
                    </div>
                    <p className="text-base font-semibold text-gray-700" style={{ fontFamily: 'Playfair Display, serif' }}>Sin pedidos</p>
                    <p className="text-sm text-gray-400 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>Tus pedidos aparecerán aquí</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pedidos.map(pedido => {
                      const cfg = estadoConfig[pedido.estado] || estadoConfig.Pendiente;
                      return (
                        <button key={pedido.pedidoID} type="button"
                          onClick={() => setPedidoSelec(pedido)}
                          className="w-full text-left border border-gray-100 rounded-xl p-4 hover:shadow-md hover:border-[#d65391]/30 transition-all bg-white">
                          <div className="flex items-start justify-between gap-3 mb-2.5">
                            <div>
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="font-semibold text-gray-900 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                                  Pedido #{pedido.pedidoID}
                                </span>
                                <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
                              </div>
                              <p className="text-xs text-gray-400 flex items-center gap-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                                <Calendar className="w-3 h-3" />
                                {new Date(pedido.fechaPedido).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
                              </p>
                            </div>
                            <p className="text-base font-bold text-[#d65391] flex-shrink-0" style={{ fontFamily: 'Inter, sans-serif' }}>
                              {fmt(pedido.total)}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-1.5 text-xs">
                            {pedido.metodoPago && <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-lg"><CreditCard className="w-3 h-3 inline mr-1" />{pedido.metodoPago}</span>}
                            {pedido.ciudad && <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-lg"><MapPin className="w-3 h-3 inline mr-1" />{pedido.ciudad}</span>}
                            {pedido.numeroGuia && (
                              <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-lg font-medium">
                                <Truck className="w-3 h-3 inline mr-1" />Guía: {pedido.numeroGuia}{pedido.transportadora ? ` · ${pedido.transportadora}` : ''}
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
                <div className="p-5 space-y-5">
                  {/* Estado */}
                  <div className="flex items-center justify-between p-4 bg-[#fdf2f8] rounded-xl">
                    <span className={`px-3 py-1 text-sm rounded-full font-semibold ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
                    <span className="text-xl font-bold text-[#d65391]" style={{ fontFamily: 'Inter, sans-serif' }}>{fmt(pedidoSelec.total)}</span>
                  </div>

                  {/* Productos */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>Productos</h4>
                    <div className="space-y-3">
                      {(pedidoSelec.detalles ?? []).map((d, i) => (
                        <div key={i} className="flex gap-3 bg-white border border-gray-100 rounded-xl p-3">
                          <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                            {d.imagenProducto ? (
                              <img src={d.imagenProducto.startsWith('http') ? d.imagenProducto : `${apiBase}${d.imagenProducto}`}
                                alt={d.productoNombre} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-8 h-8 text-gray-300" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate" style={{ fontFamily: 'Inter, sans-serif' }}>{d.productoNombre}</p>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {d.talla && <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-md">Talla: {d.talla}</span>}
                              {d.color && <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-md">Color: {d.color}</span>}
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>
                                {fmt(d.precioUnitario)} × {d.cantidad}
                              </span>
                              <span className="text-sm font-bold text-gray-900" style={{ fontFamily: 'Inter, sans-serif' }}>{fmt(d.subtotal)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Desglose de precios */}
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between text-sm text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>
                      <span>Subtotal</span><span>{fmt(pedidoSelec.subtotal ?? 0)}</span>
                    </div>
                    {(pedidoSelec.descuento ?? 0) > 0 && (
                      <div className="flex justify-between text-sm text-green-600" style={{ fontFamily: 'Inter, sans-serif' }}>
                        <span>Descuento</span><span>-{fmt(pedidoSelec.descuento ?? 0)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>
                      <span>Envío</span><span>{(pedidoSelec.envio ?? 0) === 0 ? 'Gratis' : fmt(pedidoSelec.envio ?? 0)}</span>
                    </div>
                    <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-200" style={{ fontFamily: 'Inter, sans-serif' }}>
                      <span>Total</span><span className="text-[#d65391]">{fmt(pedidoSelec.total)}</span>
                    </div>
                  </div>

                  {/* Info envío */}
                  <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
                    <h4 className="text-sm font-semibold text-gray-700" style={{ fontFamily: 'Inter, sans-serif' }}>Información de envío</h4>
                    {[
                      { icon: <CreditCard className="w-4 h-4 text-[#d65391]" />, label: 'Pago',      value: pedidoSelec.metodoPago },
                      { icon: <MapPin className="w-4 h-4 text-[#d65391]" />,     label: 'Ciudad',    value: pedidoSelec.ciudad },
                      { icon: <MapPin className="w-4 h-4 text-[#d65391]" />,     label: 'Dirección', value: pedidoSelec.direccionEnvio },
                      ...(pedidoSelec.numeroGuia ? [{ icon: <Truck className="w-4 h-4 text-[#d65391]" />, label: 'Guía', value: `${pedidoSelec.numeroGuia}${pedidoSelec.transportadora ? ` · ${pedidoSelec.transportadora}` : ''}` }] : []),
                    ].filter(r => r.value).map(({ icon, label, value }) => (
                      <div key={label} className="flex items-start gap-2.5">
                        <span className="mt-0.5 flex-shrink-0">{icon}</span>
                        <div className="min-w-0">
                          <p className="text-xs text-gray-400" style={{ fontFamily: 'Inter, sans-serif' }}>{label}</p>
                          <p className="text-sm text-gray-800 break-words" style={{ fontFamily: 'Inter, sans-serif' }}>{value}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {pedidoSelec.notas && (
                    <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3 text-sm text-yellow-800" style={{ fontFamily: 'Inter, sans-serif' }}>
                      <strong>Notas:</strong> {pedidoSelec.notas}
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
