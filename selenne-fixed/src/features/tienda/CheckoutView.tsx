import React, { useState, useEffect } from 'react';
import { ArrowLeft, CreditCard, Truck, ShieldCheck, MapPin, Upload, X, CheckCircle, AlertCircle, Lock } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Separator } from '../../components/ui/separator';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { useTienda } from '../../shared/contexts/TiendaContext';
import { usePedidosAdmin } from '../../shared/contexts/PedidosAdminContext';
import { postJson, postForm, getJson } from '../../services/api';
import { useAuth } from '../../shared/contexts/AuthContext';
import { generarContraseñaTemporal } from '../../shared/utils/credentialGenerator';
import { formatCurrency } from '../../shared/utils';
import { toast } from '@/lib/toast';
import { Logo } from '../../components/Logo';

const PLAYFAIR = '"Playfair Display", Georgia, "Iowan Old Style", "Palatino Linotype", "Times New Roman", serif';

// Lista de ciudades de Colombia
const CIUDADES_COLOMBIA = [
  'Bogotá',
  'Medellín',
  'Cali',
  'Barranquilla',
  'Cartagena',
  'Cúcuta',
  'Bucaramanga',
  'Santa Marta',
  'Valledupar',
  'Montería',
  'Armenia',
  'Manizales',
  'Pereira',
  'Pasto',
  'Ibagué',
  'Villavicencio',
  'Tunja',
  'Neiva',
  'Riohacha',
  'Sincelejo',
  'Quibdó',
  'Leticia',
  'Puerto Carreño',
  'San Andrés',
  'Florencia',
  'Mocoa',
  'Inírida',
  'Mitú',
  'La Chorrera',
  'Yopal',
].sort();

interface CheckoutViewProps {
  onBack: () => void;
}

export const CheckoutView: React.FC<CheckoutViewProps> = ({ onBack }) => {
  const { getCarritoItemsSeleccionados, getTotalSeleccionado, removerVariosDelCarrito, agregarPedido } = useTienda();
  // Solo se procesan los items que el cliente marcó en el carrito; los demás quedan guardados.
  const carritoItems = getCarritoItemsSeleccionados();
  const getTotalCarrito = getTotalSeleccionado;
  const { crearPedido } = usePedidosAdmin();
  const { user, loginAsync } = useAuth();
  const [metodoPago, setMetodoPago] = useState('contra-entrega');
  const [paso, setPaso] = useState<'envio' | 'pago'>('envio');
  const [emailIngresado, setEmailIngresado] = useState('');
  const [passwordIngresado, setPasswordIngresado] = useState('');
  const [emailValidado, setEmailValidado] = useState(false);
  const [clienteExistente, setClienteExistente] = useState(false);
  const [cambiandoEmail, setCambiandoEmail] = useState(false);
  const [validandoEmail, setValidandoEmail] = useState(false);
  const [enviandoPedido, setEnviandoPedido] = useState(false);
  const [datosEnvio, setDatosEnvio] = useState({
    nombre: '',
    documento: '',
    email: '',
    password: '',
    direccion: '',
    barrio: '',
    ciudad: '',
    telefono: '',
    notas: ''
  });
  const [comprobante, setComprobante] = useState<File | null>(null);
  const [comprobantePreview, setComprobantePreview] = useState<string | null>(null);
  const [cuponInput, setCuponInput] = useState('');
  const [cuponAplicado, setCuponAplicado] = useState<{ codigo: string; montoDescuento: number } | null>(null);
  const [validandoCupon, setValidandoCupon] = useState(false);
  const [errores, setErrores] = useState({
    nombre: '',
    documento: '',
    telefono: '',
    email: ''
  });
  
  // Datos para transferencia — se cargan del backend
  const [datosBanco, setDatosBanco] = React.useState({
    banco: 'Nequi',
    numeroCuenta: '0093334474',
    titular: 'Cristian Cordoba',
    tipoCuenta: 'Nequi',
  });

  React.useEffect(() => {
    getJson('/api/config/banco')
      .then((d: any) => { if (d?.data) setDatosBanco(d.data); })
      .catch(() => {});
  }, []);

  // Pre-rellenar datos del usuario logueado — fetch fresco desde el backend
  useEffect(() => {
    if (!user?.usuarioID) return;
    setEmailValidado(true);
    setPaso('envio');
    setClienteExistente(true);
    getJson(`/api/usuarios/${user.usuarioID}`)
      .then((res: any) => {
        const d = res?.data || res;
        setDatosEnvio(prev => ({
          ...prev,
          nombre: d?.nombreCompleto || d?.NombreCompleto || user.name || '',
          email: d?.email || d?.Email || user.email || '',
          telefono: d?.telefono || d?.Telefono || user.telefono || '',
          documento: d?.documento || d?.Documento || user.documento || '',
          direccion: d?.direccion || d?.Direccion || user.direccion || '',
          ciudad: d?.ciudad || d?.Ciudad || user.ciudad || prev.ciudad,
        }));
      })
      .catch(() => {
        // fallback a datos en caché si la petición falla
        setDatosEnvio(prev => ({
          ...prev,
          nombre: user.name || '',
          email: user.email || '',
          telefono: user.telefono || '',
          documento: user.documento || '',
          direccion: user.direccion || '',
          ciudad: user.ciudad || prev.ciudad,
        }));
      });
  }, [user?.usuarioID]);

  const formatPrecio = (precio: number) => formatCurrency(precio);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // Validación en tiempo real según el campo
    if (name === 'nombre') {
      // Solo permitir letras y espacios (incluye acentos, ñ, ü)
      if (value && !/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]*$/.test(value)) {
        setErrores(prev => ({ ...prev, nombre: 'Solo se permiten letras' }));
        return; // Bloquear el carácter inválido
      } else {
        setErrores(prev => ({ ...prev, nombre: '' }));
      }
    } else if (name === 'telefono' || name === 'documento') {
      // Solo permitir números
      if (value && !/^\d*$/.test(value)) {
        setErrores(prev => ({ ...prev, [name]: 'Solo se permiten números' }));
        return; // Bloquear el carácter inválido
      } else {
        setErrores(prev => ({ ...prev, [name]: '' }));
      }
    }

    setDatosEnvio({
      ...datosEnvio,
      [name]: value
    });
  };

  const handleComprobanteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setComprobante(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setComprobantePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveComprobante = () => {
    setComprobante(null);
    setComprobantePreview(null);
  };

  const handleValidarEmail = () => {
    if (validandoEmail) return;

    if (!emailIngresado.trim()) {
      toast.error('Por favor ingresa tu correo electrónico');
      return;
    }

    // Validar formato de email básico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailIngresado)) {
      toast.error('Por favor ingresa un correo válido');
      return;
    }

    setValidandoEmail(true);

    (async () => {
      try {
        // Si escribió contraseña, intenta iniciar sesión con esa cuenta
        // existente. Sin contraseña, continúa como invitado con este email
        // — el backend crea o reutiliza la cuenta mínima al confirmar el pedido.
        if (passwordIngresado && loginAsync) {
          let ok = false;
          try {
            ok = await loginAsync(emailIngresado, passwordIngresado);
          } catch (e) {
            ok = false;
          }
          if (!ok) {
            toast.error('Contraseña incorrecta. Revisa e intenta nuevamente, o deja el campo vacío para continuar como invitado.');
            return;
          }
          toast.success('Sesión iniciada correctamente.');
        } else {
          setClienteExistente(false);
          setDatosEnvio(prev => ({ ...prev, email: emailIngresado }));
        }

        setEmailValidado(true);
        setPaso('envio');
      } finally {
        setValidandoEmail(false);
      }
    })();
  };


  // Si el usuario está logueado y es Cliente, autocompletar datos desde Auth / clientes guardados
  // Y saltar la validación de email
  useEffect(() => {
    if (!user || user.role !== 'Cliente') return;
    
    // Saltar pantalla de validación de email si ya está logueado
    setEmailIngresado(user.email || '');
    setEmailValidado(true);
    setPaso('envio');

    // Preferir datos de `selenne_clientes` si existe uno con el mismo email
    try {
      const stored = localStorage.getItem('selenne_clientes');
      const list = stored ? JSON.parse(stored) : [];
      const matchByEmail = list.find((c: any) => c.email && user.email && c.email.toLowerCase() === user.email.toLowerCase());
      if (matchByEmail) {
        setClienteExistente(true);
        setDatosEnvio(prev => ({
          ...prev,
          nombre: matchByEmail.nombre || user.name || prev.nombre,
          documento: matchByEmail.documento || matchByEmail.numeroDocumento || prev.documento,
          email: matchByEmail.email || user.email || prev.email,
          telefono: matchByEmail.telefono || prev.telefono,
          direccion: matchByEmail.direccion || prev.direccion,
          barrio: matchByEmail.barrio || prev.barrio,
        }));
      } else {
        setClienteExistente(false);
        setDatosEnvio(prev => ({
          ...prev,
          nombre: user.name || prev.nombre,
          email: user.email || prev.email,
        }));
      }
    } catch (e) {
      setDatosEnvio(prev => ({ ...prev, nombre: user.name || prev.nombre, email: user.email || prev.email }));
    }
  }, [user]);

  // Permitir cambiar correo electrónico
  const handleCambiarEmail = () => {
    setCambiandoEmail(true);
    setEmailValidado(false);
    setEmailIngresado('');
  };

  // Cancelar cambio de email — volver al formulario sin perder datos
  const handleCancelarCambioEmail = () => {
    setCambiandoEmail(false);
    setEmailValidado(true);
    setPaso('envio');
    setEmailIngresado('');
    setPasswordIngresado('');
  };

  // Mismas validaciones de envío que ya corre handleFinalizarCompra al final,
  // pero como paso intermedio del wizard para no dejar avanzar a Pago con
  // datos incompletos.
  const validarPasoEnvio = (): boolean => {
    if (!datosEnvio.nombre?.trim()) { toast.error('Por favor completa tu nombre completo.'); return false; }
    if (!datosEnvio.documento?.trim()) { toast.error('Por favor ingresa tu documento.'); return false; }
    if (!datosEnvio.direccion?.trim()) { toast.error('Por favor ingresa tu dirección.'); return false; }
    if (!datosEnvio.ciudad?.trim()) { toast.error('Por favor selecciona tu ciudad.'); return false; }
    if (!datosEnvio.telefono?.trim()) { toast.error('Por favor ingresa tu teléfono.'); return false; }
    return true;
  };

  const handleSiguientePaso = () => {
    if (validarPasoEnvio()) setPaso('pago');
  };

  const handleAplicarCupon = async () => {
    if (!cuponInput.trim()) { toast.error('Ingresa un código de cupón'); return; }
    setValidandoCupon(true);
    try {
      const res: any = await postJson('/api/cupones/validar', { Codigo: cuponInput.trim(), Subtotal: getTotalCarrito() });
      const data = res?.data || res;
      setCuponAplicado({ codigo: data.codigo, montoDescuento: data.montoDescuento });
      toast.success(`Cupón "${data.codigo}" aplicado`);
    } catch (e: any) {
      toast.error(e?.data?.message || 'Cupón inválido');
    } finally {
      setValidandoCupon(false);
    }
  };

  const handleQuitarCupon = () => {
    setCuponAplicado(null);
    setCuponInput('');
  };

  const handleFinalizarCompra = async () => {
    if (enviandoPedido) return;

    // Validaciones primero: si alguna falla, ni siquiera se marca
    // enviandoPedido=true, asi el usuario puede corregir y reintentar
    // sin que el boton quede bloqueado.
    if (carritoItems.length === 0) { toast.error('Selecciona al menos un producto del carrito para comprar.'); return; }
    if (!datosEnvio.nombre?.trim()) { toast.error('Por favor completa tu nombre completo.'); return; }
    if (!datosEnvio.documento?.trim()) { toast.error('Por favor ingresa tu documento.'); return; }
    if (!datosEnvio.email?.trim()) { toast.error('Por favor ingresa tu correo.'); return; }
    if (!datosEnvio.direccion?.trim()) { toast.error('Por favor ingresa tu dirección.'); return; }
    if (!datosEnvio.ciudad?.trim()) { toast.error('Por favor selecciona tu ciudad.'); return; }
    if (!datosEnvio.telefono?.trim()) { toast.error('Por favor ingresa tu teléfono.'); return; }

    if (metodoPago === 'transferencia' && !comprobante) {
      toast.error('Por favor sube el comprobante de pago.');
      return;
    }

    const total = getTotalCarrito() - (cuponAplicado?.montoDescuento ?? 0);
    if (total <= 0) { toast.error('El monto debe ser mayor a $0.'); return; }

    setEnviandoPedido(true);
    try {
      // 1. Crear pedido en la API
      const pedidoRes = await postJson('/api/pedidos', {
        NombreCliente: datosEnvio.nombre,
        DocumentoCliente: datosEnvio.documento || '',
        EmailCliente: datosEnvio.email,
        TelefonoCliente: datosEnvio.telefono,
        DireccionEnvio: datosEnvio.barrio
          ? `${datosEnvio.direccion}, Barrio ${datosEnvio.barrio}`
          : datosEnvio.direccion,
        Ciudad: datosEnvio.ciudad,
        CodigoPostal: '',
        MetodoPago: metodoPago === 'transferencia' ? 'transferencia' : 'contraentrega',
        Notas: datosEnvio.notas || '',
        CuponCodigo: cuponAplicado?.codigo || null,
        Items: carritoItems.map(item => ({
          ProductoID: item.id,
          Cantidad: item.cantidad,
          TallaID: null,
          ColorID: null,
          TallaNombre: item.tallaSeleccionada || null,
          ColorNombre: item.colorSeleccionado || null,
        })),
      });

      const pedidoID = pedidoRes?.data?.pedidoId || pedidoRes?.pedidoId;

      // 2. Si hay comprobante, subirlo. El pedido ya existe en este punto,
      // asi que si esto falla NO es un fallo de "crear el pedido" — hay que
      // avisar distinto para que el usuario no reintente y duplique el pedido.
      if (comprobante && pedidoID) {
        try {
          const formData = new FormData();
          formData.append('archivo', comprobante);
          await postForm(`/api/pedidos/${pedidoID}/comprobante`, formData);
        } catch (uploadErr) {
          console.error('Error subiendo comprobante:', uploadErr);
          removerVariosDelCarrito(carritoItems.map(item => item.carritoID));
          toast.error('Tu pedido #' + pedidoID + ' quedó registrado, pero no se pudo subir el comprobante. Escríbenos por WhatsApp para enviarlo.');
          setTimeout(() => { onBack(); }, 3000);
          return;
        }
      }

      // 3. Quitar del carrito solo los items comprados (los no seleccionados quedan) y mostrar éxito
      removerVariosDelCarrito(carritoItems.map(item => item.carritoID));
      toast.success('¡Pedido registrado con éxito! El administrador revisará tu pedido.');
      setTimeout(() => { onBack(); }, 2000);

    } catch (e: any) {
      console.error('Error creando pedido:', e);
      toast.error(e?.data?.message || 'Error al procesar el pedido. Intenta de nuevo.');
    } finally {
      setEnviandoPedido(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#17101f]">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white dark:bg-[#1e1530] border-b border-gray-200 dark:border-[#3A2E4D]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1 text-sm text-gray-500 dark:text-[#b9aedd] hover:text-[#5C2A52] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a la tienda
          </button>
          <Logo className="h-9 w-9" />
          <div className="w-[120px] hidden sm:block" aria-hidden="true" />
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1
          style={{ fontFamily: PLAYFAIR }}
          className="text-4xl text-gray-900 dark:text-[#F5F3FA] mb-6"
        >
          Finalizar <span className="text-[#5C2A52]">Compra</span>
        </h1>

        {/* Indicador de pasos */}
        <div className="flex items-center gap-2 mb-8 max-w-md">
          {(() => {
            const pasoActualIndex = !emailValidado ? 0 : paso === 'envio' ? 1 : 2;
            const pasos = [
              { key: 'cuenta', label: 'Cuenta' },
              { key: 'envio', label: 'Envío' },
              { key: 'pago', label: 'Pago' },
            ];
            return pasos.map((s, i) => {
              const completado = i < pasoActualIndex;
              const activo = i === pasoActualIndex;
              return (
                <React.Fragment key={s.key}>
                  {i > 0 && (
                    <div className={`flex-1 h-px ${i <= pasoActualIndex ? 'bg-[#5C2A52]' : 'bg-gray-200 dark:bg-[#3A2E4D]'}`} />
                  )}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                        completado
                          ? 'bg-[#5C2A52] text-white'
                          : activo
                          ? 'border-2 border-[#5C2A52] text-[#5C2A52]'
                          : 'border-2 border-gray-200 dark:border-[#3A2E4D] text-gray-400 dark:text-[#b9aedd]'
                      }`}
                    >
                      {completado ? '✓' : i + 1}
                    </div>
                    <span
                      style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                      className={`text-xs font-medium ${activo || completado ? 'text-gray-900 dark:text-[#F5F3FA]' : 'text-gray-400 dark:text-[#b9aedd]'}`}
                    >
                      {s.label}
                    </span>
                  </div>
                </React.Fragment>
              );
            });
          })()}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Formulario de Checkout */}
          <div className="lg:col-span-2 space-y-6">
            {/* Validación de Documento */}
            {!emailValidado && (
              <div className="bg-white dark:bg-[#1e1530] rounded-none shadow-sm border border-[#E7E0DA] dark:border-[#3A2E4D] overflow-hidden">
                <div className="px-6 py-4" style={{ background: 'linear-gradient(90deg, #0A0A0A 0%, #3B0A45 55%, #5C2A52 100%)' }}>
                  <h2 style={{ fontFamily: PLAYFAIR }} className="text-xl text-white">
                    Validar Correo Electrónico
                  </h2>
                </div>
                <div className="p-6">
                <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-gray-600 dark:text-[#b9aedd] mb-6">
                  Puedes comprar sin crear una cuenta. Si ya tienes una, inicia sesión con tu contraseña para que se rellenen tus datos automáticamente.
                </p>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email-validar">Correo Electrónico *</Label>
                    <Input
                      id="email-validar"
                      type="email"
                      value={emailIngresado}
                      onChange={(e) => setEmailIngresado(e.target.value)}
                      placeholder="tu@email.com"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password-validar">Contraseña (opcional)</Label>
                    <Input
                      id="password-validar"
                      type="password"
                      value={passwordIngresado}
                      onChange={(e) => setPasswordIngresado(e.target.value)}
                      placeholder="Solo si ya tienes una cuenta"
                      className="mt-1"
                    />
                  </div>
                  <Button
                    onClick={handleValidarEmail}
                    disabled={validandoEmail || !emailIngresado}
                    className="w-full text-white border-0 disabled:opacity-50 transition-transform hover:scale-[1.02]"
                    style={{ background: 'linear-gradient(90deg, #0A0A0A 0%, #3B0A45 55%, #5C2A52 100%)' }}
                  >
                    {validandoEmail ? 'Validando...' : 'Continuar'}
                  </Button>
                  {cambiandoEmail && (
                    <Button
                      onClick={handleCancelarCambioEmail}
                      variant="outline"
                      className="w-full"
                    >
                      Cancelar — volver al formulario
                    </Button>
                  )}
                </div>
                </div>
              </div>
            )}

            {emailValidado && paso === 'envio' && (
              <>
                {/* Resumen de Validación */}
                <div className={`rounded-none p-4 mb-6 border-l-4 ${clienteExistente ? 'bg-[#F7F5FC] dark:bg-[#17101f] border-l-emerald-500 border-y border-r border-[#E7E0DA] dark:border-[#3A2E4D]' : 'bg-[#F7F5FC] dark:bg-[#17101f] border-l-[#5C2A52] border-y border-r border-[#E7E0DA] dark:border-[#3A2E4D]'}`}>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {clienteExistente ? (
                        <CheckCircle className="w-6 h-6 text-emerald-500" />
                      ) : (
                        <AlertCircle className="w-6 h-6 text-[#5C2A52]" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="font-semibold mb-1 text-gray-900 dark:text-[#F5F3FA]">
                        {clienteExistente ? '¡Bienvenido de vuelta!' : 'Nuevo Cliente'}
                      </h3>
                      <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-500 dark:text-[#b9aedd]">
                        {clienteExistente 
                          ? 'Encontramos una cuenta con este email. Los datos se han rellenado automáticamente.'
                          : 'Este es tu primer pedido. Por favor, completa todos los datos de envío.'}
                      </p>
                    </div>
                  </div>
                </div>

            {/* Información de Envío */}
            <div className="bg-white dark:bg-[#1e1530] rounded-none shadow-sm border border-[#E7E0DA] dark:border-[#3A2E4D] overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4" style={{ background: 'linear-gradient(90deg, #0A0A0A 0%, #3B0A45 55%, #5C2A52 100%)' }}>
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#C9A8C3]" />
                  <h2 style={{ fontFamily: PLAYFAIR }} className="text-xl text-white">
                    Información de Envío
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={handleCambiarEmail}
                  style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                  className="text-xs font-semibold uppercase tracking-wide text-[#C9A8C3] hover:text-white transition-colors border border-white/20 px-3 py-1.5"
                >
                  Cambiar Email
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <Label htmlFor="nombre">Nombre Completo *</Label>
                  <Input
                    id="nombre"
                    name="nombre"
                    value={datosEnvio.nombre}
                    onChange={handleInputChange}
                    placeholder="Tu nombre completo"
                    className="mt-1"
                  />
                  {errores.nombre && <p className="text-red-500 text-sm mt-1">{errores.nombre}</p>}
                </div>
                <div>
                  <Label htmlFor="documento">Número de Documento *</Label>
                  <Input
                    id="documento"
                    name="documento"
                    value={datosEnvio.documento}
                    onChange={handleInputChange}
                    placeholder="Tu número de documento (sin puntos ni guiones)"
                    className="mt-1"
                  />
                  {errores.documento && <p className="text-red-500 text-sm mt-1">{errores.documento}</p>}
                </div>
                <div>
                  <Label htmlFor="direccion">Dirección *</Label>
                  <Input
                    id="direccion"
                    name="direccion"
                    value={datosEnvio.direccion}
                    onChange={handleInputChange}
                    placeholder="Calle, número, apartamento"
                    className="mt-1"
                  />
                </div>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="barrio">Barrio *</Label>
                    <Input
                      id="barrio"
                      name="barrio"
                      value={datosEnvio.barrio || ''}
                      onChange={handleInputChange}
                      placeholder="Nombre del barrio"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ciudad">Ciudad *</Label>
                    <Select value={datosEnvio.ciudad} onValueChange={(value: string) => setDatosEnvio({ ...datosEnvio, ciudad: value })}>
                      <SelectTrigger id="ciudad" className="mt-1">
                        <SelectValue placeholder="Selecciona una ciudad" />
                      </SelectTrigger>
                      <SelectContent>
                        {CIUDADES_COLOMBIA.map((ciudad) => (
                          <SelectItem key={ciudad} value={ciudad}>
                            {ciudad}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="telefono">Teléfono *</Label>
                    <Input
                      id="telefono"
                      name="telefono"
                      value={datosEnvio.telefono}
                      onChange={handleInputChange}
                      placeholder="Número de contacto"
                      className="mt-1"
                    />
                    {errores.telefono && <p className="text-red-500 text-sm mt-1">{errores.telefono}</p>}
                  </div>
                  <div>
                    <Label htmlFor="email">
                      Correo Electrónico *
                      {clienteExistente && (
                        <span className="ml-2 text-xs bg-green-100 dark:bg-emerald-950/40 text-green-800 dark:text-emerald-400 px-2 py-1 rounded-none">
                          Cliente registrado ✓
                        </span>
                      )}
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={datosEnvio.email}
                      onChange={handleInputChange}
                      placeholder="tu@email.com"
                      className="mt-1"
                      disabled
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="notas">Notas del Pedido (Opcional)</Label>
                  <textarea
                    id="notas"
                    name="notas"
                    value={datosEnvio.notas}
                    onChange={handleInputChange}
                    placeholder="Instrucciones especiales de entrega"
                    maxLength={300}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-[#3A2E4D] dark:bg-[#17101f] dark:text-[#F5F3FA] rounded-none focus:outline-none focus:ring-2 focus:ring-[#5C2A52] focus:border-transparent"
                    rows={3}
                  />
                  <p className="text-xs text-gray-400 dark:text-[#b9aedd] text-right mt-1">{datosEnvio.notas.length}/300</p>
                </div>
              </div>
              <Button
                onClick={handleSiguientePaso}
                className="w-full mt-6 text-white border-0 transition-transform hover:scale-[1.02]"
                style={{ background: 'linear-gradient(90deg, #0A0A0A 0%, #3B0A45 55%, #5C2A52 100%)' }}
              >
                Continuar a Método de Pago →
              </Button>
            </div>
              </>
            )}

            {emailValidado && paso === 'pago' && (
              <>
            {/* Método de Pago */}
            <div className="bg-white dark:bg-[#1e1530] rounded-none shadow-sm border border-[#E7E0DA] dark:border-[#3A2E4D] overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4" style={{ background: 'linear-gradient(90deg, #0A0A0A 0%, #3B0A45 55%, #5C2A52 100%)' }}>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#C9A8C3]" />
                  <h2 style={{ fontFamily: PLAYFAIR }} className="text-xl text-white">
                    Método de Pago
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setPaso('envio')}
                  style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                  className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-[#C9A8C3] hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Volver a Envío
                </button>
              </div>
              <div className="p-6">
              <RadioGroup value={metodoPago} onValueChange={setMetodoPago}>
                <div className="space-y-3">
                  <div className={`flex items-center space-x-3 rounded-none p-4 transition-colors ${metodoPago === 'contra-entrega' ? 'border-2 border-[#5C2A52] bg-[#F7F5FC] dark:bg-[#241935]' : 'border border-[#E7E0DA] dark:border-[#3A2E4D] hover:border-[#5C2A52]'}`}>
                    <RadioGroupItem value="contra-entrega" id="contra-entrega" />
                    <Label htmlFor="contra-entrega" className="flex-1 cursor-pointer">
                      <div className="flex items-center">
                        <Truck className="w-5 h-5 mr-2 text-gray-600 dark:text-[#b9aedd]" />
                        <span className="text-gray-900 dark:text-[#F5F3FA]">Pago Contra Entrega</span>
                      </div>
                    </Label>
                  </div>
                  <div className={`flex items-center space-x-3 rounded-none p-4 transition-colors ${metodoPago === 'transferencia' ? 'border-2 border-[#5C2A52] bg-[#F7F5FC] dark:bg-[#241935]' : 'border border-[#E7E0DA] dark:border-[#3A2E4D] hover:border-[#5C2A52]'}`}>
                    <RadioGroupItem value="transferencia" id="transferencia" />
                    <Label htmlFor="transferencia" className="flex-1 cursor-pointer">
                      <div className="flex items-center">
                        <CreditCard className="w-5 h-5 mr-2 text-gray-600 dark:text-[#b9aedd]" />
                        <span className="text-gray-900 dark:text-[#F5F3FA]">Transferencia Bancaria</span>
                      </div>
                    </Label>
                  </div>
                </div>
              </RadioGroup>

              {metodoPago === 'transferencia' && (
                <div className="mt-6 space-y-6">
                  {/* Información de cuenta y QR */}
                  <div className="border border-[#E7E0DA] dark:border-[#3A2E4D] rounded-none p-6 bg-[#F7F5FC] dark:bg-[#17101f]">
                    <h3
                      style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                      className="text-lg text-gray-900 dark:text-[#F5F3FA] mb-4"
                    >
                      Datos para Transferencia
                    </h3>

                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Datos de cuenta */}
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-[#b9aedd]">Banco</p>
                          <p className="text-sm text-gray-900 dark:text-[#F5F3FA]">{datosBanco.banco}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-[#b9aedd]">Tipo de Cuenta</p>
                          <p className="text-sm text-gray-900 dark:text-[#F5F3FA]">{datosBanco.tipoCuenta}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-[#b9aedd]">Llave Bre-B (Nequi)</p>
                          <p className="text-sm text-gray-900 dark:text-[#F5F3FA] font-semibold">{datosBanco.numeroCuenta}</p>
                          <p className="text-xs text-gray-400 dark:text-[#8a7a82] mt-0.5">
                            No es un número de celular: pégala en la opción "Bre-B" / "Llave" de tu app bancaria (Nequi, Bancolombia, etc.) para transferir.
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-[#b9aedd]">Titular</p>
                          <p className="text-sm text-gray-900 dark:text-[#F5F3FA]">{datosBanco.titular}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-[#b9aedd]">Monto a Transferir</p>
                          <p className="text-[#5C2A52]">
                            {formatCurrency(getTotalCarrito())}
                          </p>
                        </div>
                      </div>

                      {/* Código QR */}
                      <div className="flex flex-col items-center justify-center bg-white dark:bg-[#1e1530] p-4 rounded-none border border-gray-200 dark:border-[#3A2E4D]">
                        <p className="text-xs text-gray-500 dark:text-[#b9aedd] mb-3">Escanea para transferir</p>
                        <img
                          src="/qr-transferencia.png"
                          alt="QR transferencia bancaria"
                          className="w-44 h-44 object-contain"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Subir comprobante */}
                  <div>
                    <Label htmlFor="comprobante">Comprobante de Pago *</Label>
                    <p className="text-xs text-gray-500 dark:text-[#b9aedd] mb-2">
                      Sube una foto o captura de tu comprobante de transferencia
                    </p>

                    {!comprobantePreview ? (
                      <label
                        htmlFor="comprobante"
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-[#3A2E4D] rounded-none cursor-pointer hover:border-[#5C2A52] transition-colors bg-gray-50 dark:bg-[#17101f]"
                      >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 text-gray-400 dark:text-[#b9aedd] mb-2" />
                          <p className="text-sm text-gray-500 dark:text-[#b9aedd]">
                            Click para subir comprobante
                          </p>
                          <p className="text-xs text-gray-400 dark:text-[#b9aedd] mt-1">
                            PNG, JPG o PDF (MAX. 5MB)
                          </p>
                        </div>
                        <input
                          id="comprobante"
                          type="file"
                          accept="image/*,.pdf"
                          onChange={handleComprobanteChange}
                          className="hidden"
                        />
                      </label>
                    ) : (
                      <div className="relative border border-gray-200 dark:border-[#3A2E4D] rounded-none p-4 bg-gray-50 dark:bg-[#17101f]">
                        <button
                          type="button"
                          title="Eliminar comprobante"
                          onClick={handleRemoveComprobante}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        {comprobante?.type.startsWith('image/') ? (
                          <img
                            src={comprobantePreview}
                            alt="Comprobante"
                            className="w-full h-48 object-contain rounded-none"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-48">
                            <div className="text-center">
                              <CreditCard className="w-12 h-12 text-gray-400 dark:text-[#b9aedd] mx-auto mb-2" />
                              <p className="text-sm text-gray-600 dark:text-[#b9aedd]">{comprobante?.name}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="bg-yellow-50 dark:bg-amber-950/30 border border-yellow-200 dark:border-amber-900/40 rounded-none p-4">
                    <p className="text-sm text-yellow-800 dark:text-amber-400">
                      <strong>Importante:</strong> Tu pedido quedará en estado "Pendiente" hasta que el administrador confirme tu pago. Recibirás una notificación cuando sea aprobado.
                    </p>
                  </div>
                </div>
              )}
              </div>
            </div>

            {/* Garantías */}
            <div className="rounded-none p-6 text-white" style={{ background: 'linear-gradient(90deg, #0A0A0A 0%, #3B0A45 55%, #5C2A52 100%)' }}>
              <div className="flex items-center mb-4">
                <ShieldCheck className="w-6 h-6 mr-2" />
                <h3 style={{ fontFamily: PLAYFAIR }} className="text-xl">
                  Compra Segura
                </h3>
              </div>
              <ul className="space-y-2 text-sm opacity-90">
                <li>✓ Envío gratis en compras superiores a $150.000</li>
                <li>✓ Garantía de calidad District Store</li>
                <li>✓ Pago 100% seguro y protegido</li>
              </ul>
            </div>
              </>
            )}
          </div>

          {/* Resumen del Pedido */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-[#1e1530] rounded-none shadow-sm border border-[#E7E0DA] dark:border-[#3A2E4D] sticky top-24 overflow-hidden">
              <div className="px-6 py-4" style={{ background: 'linear-gradient(90deg, #0A0A0A 0%, #3B0A45 55%, #5C2A52 100%)' }}>
                <h2 style={{ fontFamily: PLAYFAIR }} className="text-xl text-white">
                  Resumen del Pedido
                </h2>
              </div>
              <div className="p-6">

              <div className="space-y-4 mb-6">
                {carritoItems.map((item) => (
                  <div key={`${item.id}-${item.tallaSeleccionada}`} className="flex gap-3">
                    <img
                      src={item.imagen}
                      alt={item.nombre}
                      className="w-16 h-16 object-cover rounded-none"
                    />
                    <div className="flex-1">
                      <h4 className="text-sm text-gray-900 dark:text-[#F5F3FA]">{item.nombre}</h4>
                      <p className="text-xs text-gray-500 dark:text-[#b9aedd]">
                        Talla: {item.tallaSeleccionada} | Cant: {item.cantidad}
                      </p>
                      <p className="text-sm text-[#5C2A52] mt-1">
                        {formatPrecio(item.precio * item.cantidad)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              {/* Cupón de descuento */}
              <div className="mb-4">
                {cuponAplicado ? (
                  <div className="flex items-center justify-between bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-none px-3 py-2">
                    <span className="text-sm text-green-700 dark:text-green-400 font-medium">
                      Cupón "{cuponAplicado.codigo}" aplicado
                    </span>
                    <button onClick={handleQuitarCupon} className="text-green-700 dark:text-green-400 hover:opacity-70">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      value={cuponInput}
                      onChange={(e) => setCuponInput(e.target.value.toUpperCase())}
                      placeholder="Código de descuento"
                      className="flex-1 h-9 text-sm"
                    />
                    <Button
                      onClick={handleAplicarCupon}
                      disabled={validandoCupon || !cuponInput.trim()}
                      variant="outline"
                      className="h-9 text-sm px-4 disabled:opacity-50"
                    >
                      {validandoCupon ? '...' : 'Aplicar'}
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-[#b9aedd]">Subtotal:</span>
                  <span className="text-gray-900 dark:text-[#F5F3FA]">{formatPrecio(getTotalCarrito())}</span>
                </div>
                {cuponAplicado && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-[#b9aedd]">Descuento:</span>
                    <span className="text-green-600 dark:text-emerald-400">-{formatPrecio(cuponAplicado.montoDescuento)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-[#b9aedd]">Envío:</span>
                  <span className="text-green-600 dark:text-emerald-400">Gratis</span>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="flex justify-between mb-6">
                <span
                  style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                  className="text-xl text-gray-900 dark:text-[#F5F3FA]"
                >
                  Total:
                </span>
                <span
                  style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                  className="text-xl text-[#5C2A52]"
                >
                  {formatPrecio(getTotalCarrito() - (cuponAplicado?.montoDescuento ?? 0))}
                </span>
              </div>

              <p className="text-xs text-gray-500 dark:text-[#b9aedd] mb-6 text-center">
                *IVA incluido en el precio
              </p>

              {emailValidado && paso === 'envio' ? (
                <Button
                  onClick={handleSiguientePaso}
                  className="w-full text-white border-0 h-12 transition-transform hover:scale-[1.02]"
                  style={{ background: 'linear-gradient(90deg, #0A0A0A 0%, #3B0A45 55%, #5C2A52 100%)', fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                >
                  Continuar a Método de Pago →
                </Button>
              ) : (
                <Button
                  onClick={handleFinalizarCompra}
                  disabled={enviandoPedido || !emailValidado}
                  className="w-full text-white border-0 h-12 disabled:opacity-60 transition-all duration-200 hover:scale-[1.02] flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(90deg, #0A0A0A 0%, #3B0A45 55%, #5C2A52 100%)', fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                >
                  {!enviandoPedido && <Lock className="w-4 h-4" />}
                  {enviandoPedido ? 'Procesando...' : metodoPago === 'transferencia' ? 'Enviar Pedido' : 'Confirmar Compra'}
                </Button>
              )}

              {emailValidado && paso === 'pago' && metodoPago === 'transferencia' && (
                <p className="text-xs text-center text-gray-500 dark:text-[#b9aedd] mt-2">
                  Al enviar, tu pedido quedará pendiente de confirmación
                </p>
              )}

              <div className="flex items-center justify-center gap-1.5 mt-4 pt-4 border-t border-[#E7E0DA] dark:border-[#3A2E4D]">
                <Lock className="w-3.5 h-3.5 text-gray-400 dark:text-[#b9aedd]" />
                <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-[11px] text-gray-400 dark:text-[#b9aedd]">
                  Datos protegidos · Compra 100% segura
                </span>
              </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};