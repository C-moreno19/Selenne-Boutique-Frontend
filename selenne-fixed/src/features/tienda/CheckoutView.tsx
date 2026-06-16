import React, { useState, useEffect } from 'react';
import { ArrowLeft, CreditCard, Truck, ShieldCheck, MapPin, Upload, X, CheckCircle, AlertCircle } from 'lucide-react';
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
import { useMensajes } from '../../shared/contexts/MensajesContext';
import { generarContraseñaTemporal } from '../../shared/utils/credentialGenerator';
import { formatCurrency } from '../../shared/utils';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';

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
  const { carritoItems, getTotalCarrito, limpiarCarrito, agregarPedido } = useTienda();
  const { crearPedido } = usePedidosAdmin();
  const { user, loginAsync } = useAuth();
  const { crearMensaje } = useMensajes();
  const [metodoPago, setMetodoPago] = useState('contra-entrega');
  const [emailIngresado, setEmailIngresado] = useState('');
  const [passwordIngresado, setPasswordIngresado] = useState('');
  const [emailValidado, setEmailValidado] = useState(false);
  const [clienteExistente, setClienteExistente] = useState(false);
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
  const [errores, setErrores] = useState({
    nombre: '',
    documento: '',
    telefono: '',
    email: ''
  });
  
  // Datos para transferencia — se cargan del backend
  const [datosBanco, setDatosBanco] = React.useState({
    banco: 'Bancolombia',
    numeroCuenta: '91292106179',
    titular: 'Selenne Boutique',
    tipoCuenta: 'Ahorros',
  });

  React.useEffect(() => {
    getJson('/api/config/banco')
      .then((d: any) => { if (d?.data) setDatosBanco(d.data); })
      .catch(() => {});
  }, []);

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
    if (!emailIngresado.trim()) {
      toast.error('Por favor ingresa tu correo electrónico');
      return;
    }

    if (!passwordIngresado) {
      toast.error('Por favor ingresa tu contraseña');
      return;
    }

    // Validar formato de email básico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailIngresado)) {
      toast.error('Por favor ingresa un correo válido');
      return;
    }

    // Primero intentar validar vía API (si existe). Si falla, usar fallback localStorage.
    (async () => {
      try {
        if (loginAsync) {
          const ok = await loginAsync(emailIngresado, passwordIngresado);
          if (ok) {
            toast.success('Sesión iniciada correctamente.');
            setEmailValidado(true);
            return;
          }
        }
      } catch (e) {
        // ignore and fallback
      }

      // Fallback local
      try {
        const stored = localStorage.getItem('selenne_clientes');
        const list = stored ? JSON.parse(stored) : [];
        const found = list.find((c: any) => c && c.email && c.email.toLowerCase() === emailIngresado.toLowerCase());

        const usersRaw = localStorage.getItem('selenne_users');
        const users = usersRaw ? JSON.parse(usersRaw) : [];
        const matchedUser = users.find((u: any) => u && u.email && u.email.toLowerCase() === emailIngresado.toLowerCase());

        if (found) {
          // Si existe un usuario con credenciales, validar contraseña
          if (matchedUser) {
            const passFinal = matchedUser.passwordFinal;
            const passTemp = matchedUser.passwordTemporal;
            const ok = (passFinal && passFinal === passwordIngresado) || (passTemp && passTemp === passwordIngresado);
            if (!ok) {
              toast.error('Contraseña incorrecta. Revisa e intenta nuevamente.');
              return;
            }
            // Si coincide, guardar la contraseña en el estado de envío si aplica
            setDatosEnvio(prev => ({ ...prev, password: passFinal || passTemp || prev.password }));
          }

          setClienteExistente(true);
          setDatosEnvio(prev => ({
            ...prev,
            nombre: found.nombre || prev.nombre,
            documento: found.documento || prev.documento,
            email: found.email || prev.email,
            direccion: found.direccion || prev.direccion,
            telefono: found.telefono || prev.telefono,
          }));
          toast.success('Cliente encontrado. Datos rellenados automáticamente.');
        } else {
          // No existe cliente: guardar email y contraseña para crear la cuenta al finalizar
          setClienteExistente(false);
          setDatosEnvio(prev => ({ ...prev, email: emailIngresado, password: passwordIngresado }));
          toast.info('Cliente no registrado. Completa todos los datos para finalizar la compra.');
        }
      } catch (e) {
        setClienteExistente(false);
        setDatosEnvio(prev => ({ ...prev, email: emailIngresado, password: passwordIngresado }));
        toast.info('Cliente no registrado. Completa todos los datos para finalizar la compra.');
      }

      setEmailValidado(true);
    })();
  };


  // Si el usuario está logueado y es Cliente, autocompletar datos desde Auth / clientes guardados
  // Y saltar la validación de email
  useEffect(() => {
    if (!user || user.role !== 'Cliente') return;
    
    // Saltar pantalla de validación de email si ya está logueado
    setEmailIngresado(user.email || '');
    setEmailValidado(true);
    
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
    setEmailValidado(false);
    setEmailIngresado('');
    setClienteExistente(false);
    setDatosEnvio(prev => ({
      ...prev,
      nombre: '',
      documento: '',
      direccion: '',
      barrio: '',
      telefono: '',
    }));
  };

  const handleFinalizarCompra = async () => {
    console.log('🛒 handleFinalizarCompra iniciado');
    
    if (carritoItems.length === 0) { toast.error('Tu carrito está vacío.'); return; }
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

    const total = getTotalCarrito();
    if (total <= 0) { toast.error('El monto debe ser mayor a $0.'); return; }

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

      // 2. Si hay comprobante, subirlo
      if (comprobante && pedidoID) {
        const formData = new FormData();
        formData.append('archivo', comprobante);
        await postForm(`/api/pedidos/${pedidoID}/comprobante`, formData);
      }

      // 3. Limpiar carrito y mostrar éxito
      limpiarCarrito();
      toast.success('¡Pedido registrado con éxito! El administrador revisará tu pedido.');
      setTimeout(() => { onBack(); }, 2000);

    } catch (e: any) {
      console.error('Error creando pedido:', e);
      toast.error(e?.data?.message || 'Error al procesar el pedido. Intenta de nuevo.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Contenido Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1
          style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
          className="text-4xl text-gray-900 mb-8"
        >
          Finalizar <span className="text-[#d65391]">Compra</span>
        </h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Formulario de Checkout */}
          <div className="lg:col-span-2 space-y-6">
            {/* Validación de Documento */}
            {!emailValidado && (
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h2
                  style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                  className="text-2xl text-gray-900 mb-6"
                >
                  Validar Correo Electrónico
                </h2>
                <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-gray-600 mb-6">
                  Ingresa tu correo electrónico para continuar con la compra. Si ya tienes una cuenta, se rellenarán automáticamente tus datos.
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
                    <Label htmlFor="password-validar">Contraseña *</Label>
                    <Input
                      id="password-validar"
                      type="password"
                      value={passwordIngresado}
                      onChange={(e) => setPasswordIngresado(e.target.value)}
                      placeholder="Tu contraseña"
                      className="mt-1"
                    />
                  </div>
                  <Button
                    onClick={handleValidarEmail}
                    disabled={!emailIngresado || !passwordIngresado}
                    className="w-full bg-[#d65391] hover:bg-[#c44880] text-white disabled:opacity-50"
                  >
                    Continuar con mi Email
                  </Button>
                </div>
              </div>
            )}

            {emailValidado && (
              <>
                {/* Resumen de Validación */}
                <div className={`rounded-lg p-4 mb-6 ${clienteExistente ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'}`}>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {clienteExistente ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : (
                        <AlertCircle className="w-6 h-6 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-semibold mb-1 ${clienteExistente ? 'text-green-900' : 'text-blue-900'}`}>
                        {clienteExistente ? '¡Bienvenido de vuelta!' : 'Nuevo Cliente'}
                      </h3>
                      <p className={`text-sm ${clienteExistente ? 'text-green-700' : 'text-blue-700'}`}>
                        {clienteExistente 
                          ? 'Encontramos una cuenta con este email. Los datos se han rellenado automáticamente.'
                          : 'Este es tu primer pedido. Por favor, completa todos los datos de envío.'}
                      </p>
                    </div>
                  </div>
                </div>

            {/* Información de Envío */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <MapPin className="w-6 h-6 text-[#d65391] mr-2" />
                  <h2
                    style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                    className="text-2xl text-gray-900"
                  >
                    Información de Envío
                  </h2>
                </div>
                <Button
                  onClick={handleCambiarEmail}
                  variant="outline"
                  className="text-sm"
                >
                  Cambiar Email
                </Button>
              </div>
              <div className="space-y-4">
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
                        <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
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
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#d65391] focus:border-transparent"
                    rows={3}
                  />
                  <p className="text-xs text-gray-400 text-right mt-1">{datosEnvio.notas.length}/300</p>
                </div>
              </div>
            </div>

            {/* Método de Pago */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center mb-6">
                <CreditCard className="w-6 h-6 text-[#d65391] mr-2" />
                <h2
                  style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                  className="text-2xl text-gray-900"
                >
                  Método de Pago
                </h2>
              </div>
              <RadioGroup value={metodoPago} onValueChange={setMetodoPago}>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 border border-gray-200 rounded-lg p-4 hover:border-[#d65391] transition-colors">
                    <RadioGroupItem value="contra-entrega" id="contra-entrega" />
                    <Label htmlFor="contra-entrega" className="flex-1 cursor-pointer">
                      <div className="flex items-center">
                        <Truck className="w-5 h-5 mr-2 text-gray-600" />
                        <span>Pago Contra Entrega</span>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 border border-gray-200 rounded-lg p-4 hover:border-[#d65391] transition-colors">
                    <RadioGroupItem value="transferencia" id="transferencia" />
                    <Label htmlFor="transferencia" className="flex-1 cursor-pointer">
                      <div className="flex items-center">
                        <CreditCard className="w-5 h-5 mr-2 text-gray-600" />
                        <span>Transferencia Bancaria</span>
                      </div>
                    </Label>
                  </div>
                </div>
              </RadioGroup>

              {metodoPago === 'transferencia' && (
                <div className="mt-6 space-y-6">
                  {/* Información de cuenta y QR */}
                  <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                    <h3 
                      style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                      className="text-lg text-gray-900 mb-4"
                    >
                      Datos para Transferencia
                    </h3>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Datos de cuenta */}
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-gray-500">Banco</p>
                          <p className="text-sm text-gray-900">{datosBanco.banco}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Tipo de Cuenta</p>
                          <p className="text-sm text-gray-900">{datosBanco.tipoCuenta}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Número de Cuenta</p>
                          <p className="text-sm text-gray-900">{datosBanco.numeroCuenta}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Titular</p>
                          <p className="text-sm text-gray-900">{datosBanco.titular}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Monto a Transferir</p>
                          <p className="text-[#d65391]">
                            {formatCurrency(getTotalCarrito())}
                          </p>
                        </div>
                      </div>

                      {/* Código QR */}
                      <div className="flex flex-col items-center justify-center bg-white p-4 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500 mb-3">Escanea para transferir</p>
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
                    <p className="text-xs text-gray-500 mb-2">
                      Sube una foto o captura de tu comprobante de transferencia
                    </p>
                    
                    {!comprobantePreview ? (
                      <label
                        htmlFor="comprobante"
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#d65391] transition-colors bg-gray-50"
                      >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 text-gray-400 mb-2" />
                          <p className="text-sm text-gray-500">
                            Click para subir comprobante
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
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
                      <div className="relative border border-gray-200 rounded-lg p-4 bg-gray-50">
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
                            className="w-full h-48 object-contain rounded"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-48">
                            <div className="text-center">
                              <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                              <p className="text-sm text-gray-600">{comprobante?.name}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Importante:</strong> Tu pedido quedará en estado "Pendiente" hasta que el administrador confirme tu pago. Recibirás una notificación cuando sea aprobado.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Garantías */}
            <div className="bg-gradient-to-r from-[#d65391] to-[#f8a9c5] rounded-lg p-6 text-white">
              <div className="flex items-center mb-4">
                <ShieldCheck className="w-6 h-6 mr-2" />
                <h3 style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xl">
                  Compra Segura
                </h3>
              </div>
              <ul className="space-y-2 text-sm opacity-90">
                <li>✓ Envío gratis en compras superiores a $150.000</li>
                <li>✓ Garantía de calidad Selenne Boutique</li>
                <li>✓ Pago 100% seguro y protegido</li>
              </ul>
            </div>
              </>
            )}
          </div>

          {/* Resumen del Pedido */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 sticky top-24">
              <h2
                style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                className="text-2xl text-gray-900 mb-6"
              >
                Resumen del Pedido
              </h2>

              <div className="space-y-4 mb-6">
                {carritoItems.map((item) => (
                  <div key={`${item.id}-${item.tallaSeleccionada}`} className="flex gap-3">
                    <img
                      src={item.imagen}
                      alt={item.nombre}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h4 className="text-sm text-gray-900">{item.nombre}</h4>
                      <p className="text-xs text-gray-500">
                        Talla: {item.tallaSeleccionada} | Cant: {item.cantidad}
                      </p>
                      <p className="text-sm text-[#d65391] mt-1">
                        {formatPrecio(item.precio * item.cantidad)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="text-gray-900">{formatPrecio(getTotalCarrito())}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Envío:</span>
                  <span className="text-green-600">Gratis</span>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="flex justify-between mb-6">
                <span
                  style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                  className="text-xl text-gray-900"
                >
                  Total:
                </span>
                <span
                  style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                  className="text-xl text-[#d65391]"
                >
                  {formatPrecio(getTotalCarrito())}
                </span>
              </div>

              <p className="text-xs text-gray-500 mb-6 text-center">
                *IVA incluido en el precio
              </p>

              <Button
                onClick={handleFinalizarCompra}
                className="w-full bg-black hover:bg-gray-800 text-white h-12"
                style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
              >
                {metodoPago === 'transferencia' ? 'Enviar Pedido' : 'Confirmar Compra'}
              </Button>
              
              {metodoPago === 'transferencia' && (
                <p className="text-xs text-center text-gray-500 mt-2">
                  Al enviar, tu pedido quedará pendiente de confirmación
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};