import React, { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, User, Mail, Phone, MapPin, Lock, LogOut, ShoppingBag, Heart, Package, CheckCircle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Separator } from '../../components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { useAuth } from '../../shared/contexts/AuthContext';
import { useTienda } from '../../shared/contexts/TiendaContext';
import { usePedidosAdmin } from '../../shared/contexts/PedidosAdminContext';
import { useMensajes } from '../../shared/contexts/MensajesContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../components/ui/alert-dialog';
import { toast } from 'sonner';
import api from '../../services/api';

interface PerfilViewProps {
  onBack: () => void;
  onLogout: () => void;
}

export const PerfilView: React.FC<PerfilViewProps> = ({ onBack, onLogout }) => {
  const { user, refreshUser } = useAuth();
  const { carritoItems, favoritos } = useTienda();
  const { pedidos, actualizarPedido } = usePedidosAdmin();
  const { crearMensaje } = useMensajes();

  const misPedidos = useMemo(() => {
    return pedidos.filter(p =>
      p.email === user?.email &&
      (p.estado === 'Aprobada' || p.estado === 'Completada')
    );
  }, [pedidos, user?.email]);

  const [selectedPedido, setSelectedPedido] = useState<any>(null);
  const [markCompleteDialog, setMarkCompleteDialog] = useState(false);

  const [datosPersonales, setDatosPersonales] = useState({
    nombre: user?.name || '',
    email: user?.email || '',
    telefono: user?.telefono || '',
    direccion: user?.direccion || '',
    ciudad: ''
  });

  const [errores, setErrores] = useState({
    nombre: '',
    telefono: ''
  });

  const [cambiarPassword, setCambiarPassword] = useState({
    actual: '',
    nueva: '',
    confirmar: ''
  });

  // Cargar datos del perfil al abrir
  useEffect(() => {
    if (user?.usuarioID) {
      api.getJson(`/api/usuarios/${user.usuarioID}`)
        .then((res: any) => {
          const d = res?.data || res;
          setDatosPersonales({
            nombre: d?.nombreCompleto || d?.NombreCompleto || user?.name || '',
            email: d?.email || d?.Email || user?.email || '',
            telefono: d?.telefono || d?.Telefono || '',
            direccion: d?.direccion || d?.Direccion || '',
            ciudad: d?.ciudad || d?.Ciudad || ''
          });
        })
        .catch(() => {});
    }
  }, [user?.usuarioID]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'nombre') {
      if (value && !/^[a-zA-Záéíóúñ\s]*$/.test(value)) {
        setErrores(prev => ({ ...prev, nombre: 'Solo se permiten letras y espacios' }));
        return;
      } else {
        setErrores(prev => ({ ...prev, nombre: '' }));
      }
    } else if (name === 'telefono') {
      if (value && !/^\d*$/.test(value)) {
        setErrores(prev => ({ ...prev, telefono: 'Solo se permiten números' }));
        return;
      } else {
        setErrores(prev => ({ ...prev, telefono: '' }));
      }
    }
    setDatosPersonales({ ...datosPersonales, [name]: value });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCambiarPassword({ ...cambiarPassword, [e.target.name]: e.target.value });
  };

  const handleGuardarCambios = async () => {
    if (!datosPersonales.nombre.trim()) {
      toast.error('El nombre es requerido');
      return;
    }
    try {
      await api.fetchWithAuth(`/api/usuarios/${user?.usuarioID}`, {
        method: 'PUT',
        body: JSON.stringify({
          NombreCompleto: datosPersonales.nombre,
          Telefono: datosPersonales.telefono,
          Direccion: datosPersonales.direccion,
          Ciudad: datosPersonales.ciudad,
        }),
      });
      await refreshUser();
      toast.success('Cambios guardados exitosamente.');
    } catch (e) {
      toast.error('Error al guardar los cambios.');
    }
  };

  const handleCambiarPassword = async () => {
    if (!cambiarPassword.actual.trim()) {
      toast.error('Debes ingresar tu contraseña actual');
      return;
    }
    if (!cambiarPassword.nueva.trim()) {
      toast.error('Debes ingresar una nueva contraseña');
      return;
    }
    if (cambiarPassword.nueva !== cambiarPassword.confirmar) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    if (cambiarPassword.nueva.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    try {
      await api.postJson('/api/auth/change-password', {
        ContrasenaActual: cambiarPassword.actual,
        NuevaContrasena: cambiarPassword.nueva,
      });
      toast.success('Contraseña actualizada correctamente.');
      setCambiarPassword({ actual: '', nueva: '', confirmar: '' });
    } catch (e: any) {
      toast.error(e?.data?.message || 'Error al cambiar la contraseña.');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Banner de Perfil */}
      <div className="bg-gradient-to-r from-[#d65391] to-[#f8a9c5] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mr-6">
              <User className="w-10 h-10 text-[#d65391]" />
            </div>
            <div>
              <h1
                style={{ fontFamily: 'Playfair Display, serif' }}
                className="text-4xl md:text-5xl mb-2"
              >
                Mi Perfil
              </h1>
              <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-lg opacity-90">
                {user?.name} - {user?.role}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
              <div>
                <h3
                  style={{ fontFamily: 'Playfair Display, serif' }}
                  className="text-xl text-gray-900 mb-4"
                >
                  Resumen
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <ShoppingBag className="w-5 h-5 text-[#d65391] mr-2" />
                      <span className="text-sm text-gray-700">Carrito</span>
                    </div>
                    <span className="text-sm text-gray-900">{carritoItems.length}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <Heart className="w-5 h-5 text-[#d65391] mr-2" />
                      <span className="text-sm text-gray-700">Favoritos</span>
                    </div>
                    <span className="text-sm text-gray-900">{favoritos.length}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <Package className="w-5 h-5 text-[#d65391] mr-2" />
                      <span className="text-sm text-gray-700">Pedidos</span>
                    </div>
                    <span className="text-sm text-gray-900">{misPedidos.length}</span>
                  </div>
                </div>
              </div>

              <Separator />

              <Button
                onClick={onLogout}
                variant="outline"
                className="w-full border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600 h-11"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                <LogOut className="w-5 h-5 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="informacion" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="informacion">Información Personal</TabsTrigger>
                <TabsTrigger value="seguridad">Seguridad</TabsTrigger>
                <TabsTrigger value="pedidos">Mis Pedidos</TabsTrigger>
              </TabsList>

              {/* Información Personal */}
              <TabsContent value="informacion">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2
                    style={{ fontFamily: 'Playfair Display, serif' }}
                    className="text-2xl text-gray-900 mb-6"
                  >
                    Información Personal
                  </h2>
                  <div className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="nombre">Nombre Completo *</Label>
                        <div className="relative mt-1">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <Input id="nombre" name="nombre" value={datosPersonales.nombre} onChange={handleInputChange} className="pl-10" />
                        </div>
                        {errores.nombre && <p className="text-red-500 text-sm mt-1">{errores.nombre}</p>}
                      </div>
                      <div>
                        <Label htmlFor="email">Correo Electrónico</Label>
                        <div className="relative mt-1">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <Input id="email" name="email" value={datosPersonales.email} className="pl-10" disabled />
                        </div>
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="telefono">Teléfono *</Label>
                        <div className="relative mt-1">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <Input id="telefono" name="telefono" value={datosPersonales.telefono} onChange={handleInputChange} placeholder="Número de contacto" className="pl-10" />
                        </div>
                        {errores.telefono && <p className="text-red-500 text-sm mt-1">{errores.telefono}</p>}
                      </div>
                      <div>
                        <Label htmlFor="ciudad">Ciudad *</Label>
                        <div className="relative mt-1">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <Input id="ciudad" name="ciudad" value={datosPersonales.ciudad} onChange={handleInputChange} placeholder="Tu ciudad" className="pl-10" />
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="direccion">Dirección *</Label>
                      <div className="relative mt-1">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input id="direccion" name="direccion" value={datosPersonales.direccion} onChange={handleInputChange} placeholder="Tu dirección completa" className="pl-10" />
                      </div>
                    </div>
                    <div className="pt-4">
                      <Button
                        onClick={handleGuardarCambios}
                        className="bg-[#d65391] hover:bg-[#c04380] text-white h-11"
                        style={{ fontFamily: 'Inter, sans-serif' }}
                      >
                        Guardar Cambios
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Seguridad */}
              <TabsContent value="seguridad">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2
                    style={{ fontFamily: 'Playfair Display, serif' }}
                    className="text-2xl text-gray-900 mb-6"
                  >
                    Cambiar Contraseña
                  </h2>
                  <div className="space-y-4 max-w-md">
                    <div>
                      <Label htmlFor="actual">Contraseña Actual</Label>
                      <div className="relative mt-1">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input id="actual" name="actual" type="password" value={cambiarPassword.actual} onChange={handlePasswordChange} className="pl-10" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="nueva">Nueva Contraseña</Label>
                      <div className="relative mt-1">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input id="nueva" name="nueva" type="password" value={cambiarPassword.nueva} onChange={handlePasswordChange} className="pl-10" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="confirmar">Confirmar Nueva Contraseña</Label>
                      <div className="relative mt-1">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input id="confirmar" name="confirmar" type="password" value={cambiarPassword.confirmar} onChange={handlePasswordChange} className="pl-10" />
                      </div>
                    </div>
                    <div className="pt-4">
                      <Button
                        onClick={handleCambiarPassword}
                        className="bg-black hover:bg-gray-800 text-white h-11"
                        style={{ fontFamily: 'Inter, sans-serif' }}
                      >
                        Actualizar Contraseña
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Pedidos */}
              <TabsContent value="pedidos">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2
                    style={{ fontFamily: 'Playfair Display, serif' }}
                    className="text-2xl text-gray-900 mb-6"
                  >
                    Mis Pedidos
                  </h2>
                  {misPedidos.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 mb-2">No tienes pedidos confirmados aún</p>
                      <p className="text-sm text-gray-400">Tus pedidos aparecerán aquí una vez tu pago sea aprobado</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {misPedidos.map((pedido) => (
                        <div key={pedido.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">Pedido {pedido.numeroComprobante}</h3>
                              <p className="text-sm text-gray-600">Referencia: {pedido.idVenta}</p>
                              <p className="text-sm text-gray-600">
                                {new Date(pedido.fecha).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-semibold text-[#d65391]">${(pedido.monto || 0).toLocaleString('es-CO')}</p>
                              <span className={`inline-block px-2 py-1 text-xs rounded-full font-semibold ${
                                pedido.estado === 'Completada' ? 'bg-green-100 text-green-800' :
                                pedido.estado === 'Aprobada' ? 'bg-blue-100 text-blue-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {pedido.estado === 'Completada' ? '✅ Entregado' : pedido.estado === 'Aprobada' ? '✔️ Aprobado' : '⏳ Pendiente'}
                              </span>
                            </div>
                          </div>
                          {pedido.estado === 'Aprobada' && pedido.metodoPago !== 'Transferencia' && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                              <button
                                onClick={() => { setSelectedPedido(pedido); setMarkCompleteDialog(true); }}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Marcar como Entregado
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      <AlertDialog open={markCompleteDialog} onOpenChange={setMarkCompleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Entrega</AlertDialogTitle>
            <AlertDialogDescription>¿Confirmas que recibiste tu pedido {selectedPedido?.numeroComprobante}?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedPedido) {
                  actualizarPedido(selectedPedido.id, { estado: 'Completada' });
                  crearMensaje({
                    idVenta: selectedPedido.idVenta || selectedPedido.id,
                    emailCliente: selectedPedido.email,
                    remitente: 'cliente',
                    contenido: `El cliente ${selectedPedido.cliente} ha confirmado la entrega del pedido ${selectedPedido.numeroComprobante}`,
                    tipo: 'notificacion'
                  });
                  toast.success('Entrega confirmada');
                  setMarkCompleteDialog(false);
                  setSelectedPedido(null);
                }
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              Sí, Confirmar Entrega
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};