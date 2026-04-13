import React, { useState, useEffect, useCallback } from 'react';
import { Search, Eye, CheckCircle, XCircle, ChevronRight, Loader2, RefreshCw, Package, User, MapPin, CreditCard, Image, Mail } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../../components/ui/alert-dialog';
import { Textarea } from '../../../components/ui/textarea';
import { Label } from '../../../components/ui/label';
import { toast } from 'sonner';
import { getJson } from '../../../services/api';
import api from '../../../services/api';
import { useAuth } from '../../../shared/contexts/AuthContext';

interface PedidoDetalle { productoNombre: string; cantidad: number; precioUnitario: number; subtotal: number; talla?: string; color?: string; }
interface Pedido {
  pedidoID: number; clienteID: number; nombreCliente: string; emailCliente: string;
  telefonoCliente: string; direccionEnvio: string; ciudad: string; metodoPago: string;
  subtotal: number; descuento: number; envio: number; total: number;
  estado: string; fechaPedido: string; notas?: string; comprobantePago?: string;
  detalles: PedidoDetalle[];
}

const fmt = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

export const PedidosView: React.FC = () => {
  const { hasPermission } = useAuth();
  const puedeEditar = hasPermission('ventas:editar');

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [aprobarOpen, setAprobarOpen] = useState(false);
  const [rechazarOpen, setRechazarOpen] = useState(false);
  const [razonRechazo, setRazonRechazo] = useState('');
  const [comprobanteOpen, setComprobanteOpen] = useState(false);
  const [emailPagoOpen, setEmailPagoOpen] = useState(false);
  const [mensajePago, setMensajePago] = useState('');

  const loadData = useCallback(async () => {
    try {
      const res = await getJson('/api/pedidos');
      const all = (res?.data || res || []).map((p: any): Pedido => ({
        pedidoID: p.pedidoID, clienteID: p.clienteID,
        nombreCliente: p.nombreCliente ?? '', emailCliente: p.emailCliente ?? '',
        telefonoCliente: p.telefonoCliente ?? '', direccionEnvio: p.direccionEnvio ?? '',
        ciudad: p.ciudad ?? '', metodoPago: p.metodoPago ?? '',
        subtotal: p.subtotal ?? 0, descuento: p.descuento ?? 0,
        envio: p.envio ?? 0, total: p.total ?? 0,
        estado: p.estado ?? 'Pendiente', fechaPedido: p.fechaPedido ?? '',
        notas: p.notas ?? '', comprobantePago: p.comprobantePago ?? '',
        detalles: (p.detalles ?? []).map((d: any) => ({
          productoNombre: d.productoNombre ?? '', cantidad: d.cantidad ?? 0,
          precioUnitario: d.precioUnitario ?? 0, subtotal: d.subtotal ?? 0,
          talla: d.talla ?? d.Talla ?? '', color: d.color ?? d.Color ?? '',
        })),
      }));
      setPedidos(all.filter((p: Pedido) => p.estado === 'Pendiente'));
    } catch { toast.error('Error cargando pedidos'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = pedidos.filter(p => {
    const q = searchQuery.toLowerCase();
    return p.nombreCliente.toLowerCase().includes(q) || p.emailCliente.toLowerCase().includes(q);
  });

  const enviarEmailPago = async () => {
    if (!selectedPedido) return;
    setSaving(true);
    try {
      await api.fetchWithAuth(`/api/pedidos/${selectedPedido.pedidoID}/email-pago`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Mensaje: mensajePago }),
      });
      toast.success('Correo de pago enviado');
      setEmailPagoOpen(false);
      setMensajePago('');
    } catch (e: any) { toast.error(e?.data?.message || e?.message || 'Error enviando correo'); }
    finally { setSaving(false); }
  };

  const cambiarEstado = async (pedido: Pedido, estado: string, notas?: string) => {
    setSaving(true);
    try {
      await api.fetchWithAuth(`/api/pedidos/${pedido.pedidoID}/estado`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ NuevoEstado: estado, Notas: notas }),
      });
      toast.success(`Pedido ${estado.toLowerCase()} correctamente`);
      setAprobarOpen(false); setRechazarOpen(false); setViewOpen(false); setRazonRechazo('');
      loadData();
    } catch { toast.error('Error cambiando estado'); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-8 h-8 animate-spin text-[#d65391]" />
    </div>
  );

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex items-center gap-2 mb-4">
        <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-500">Dashboard</span>
        <ChevronRight className="w-4 h-4 text-gray-400" />
        <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm font-medium text-gray-900">Pedidos Pendientes</span>
      </div>
      <h1 style={{ fontFamily: 'Playfair Display, serif' }} className="text-4xl text-gray-900 mb-6">Pedidos Pendientes</h1>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Buscar por cliente o email..." value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)} style={{ fontFamily: 'Inter, sans-serif' }}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d65391]" />
        </div>
        <button onClick={() => { setLoading(true); loadData(); }} className="px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['#', 'CLIENTE', 'FECHA', 'TOTAL', 'MÉTODO PAGO', 'COMPROBANTE', 'ACCIONES'].map(h => (
                <th key={h} className="px-6 py-4 text-left">
                  <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs font-semibold uppercase tracking-wider text-gray-500">{h}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((p, idx) => (
              <tr key={p.pedidoID} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4"><span style={{ fontFamily: 'Inter, sans-serif' }} className="font-medium text-gray-900">#{idx + 1}</span></td>
                <td className="px-6 py-4">
                  <p style={{ fontFamily: 'Inter, sans-serif' }} className="font-medium text-gray-900">{p.nombreCliente}</p>
                  <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-500">{p.emailCliente}</p>
                </td>
                <td className="px-6 py-4"><span style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-600">{new Date(p.fechaPedido).toLocaleDateString('es-CO')}</span></td>
                <td className="px-6 py-4"><span style={{ fontFamily: 'Inter, sans-serif' }} className="font-semibold">{fmt(p.total)}</span></td>
                <td className="px-6 py-4"><span style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-600">{p.metodoPago}</span></td>
                <td className="px-6 py-4">
                  {p.comprobantePago ? (
                    <button onClick={() => { setSelectedPedido(p); setComprobanteOpen(true); }}
                      style={{ fontFamily: 'Inter, sans-serif' }} className="text-[#d65391] text-sm underline hover:text-[#c14a7f] flex items-center gap-1">
                      <Image className="w-4 h-4" /> Ver
                    </button>
                  ) : <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-400">Sin comprobante</span>}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setSelectedPedido(p); setViewOpen(true); }}
                      className="p-2 text-gray-500 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors" title="Ver detalles">
                      <Eye className="w-5 h-5" />
                    </button>
                    <button onClick={() => { setSelectedPedido(p); setEmailPagoOpen(true); }}
                      className="p-2 text-gray-500 hover:bg-pink-50 hover:text-[#d65391] rounded-lg transition-colors" title="Enviar correo de pago">
                      <Mail className="w-5 h-5" />
                    </button>
                    {puedeEditar && (
                      <>
                        <button onClick={() => { setSelectedPedido(p); setAprobarOpen(true); }}
                          className="p-2 text-gray-500 hover:bg-green-50 hover:text-green-600 rounded-lg transition-colors" title="Aprobar">
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        <button onClick={() => { setSelectedPedido(p); setRechazarOpen(true); }}
                          className="p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors" title="Rechazar">
                          <XCircle className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-400" style={{ fontFamily: 'Inter, sans-serif' }}>No hay pedidos pendientes</td></tr>
            )}
          </tbody>
        </table>
        <div className="px-6 py-4 border-t border-gray-100">
          <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-500">
            <span className="font-medium text-gray-800">{filtered.length}</span> pedidos pendientes
          </span>
        </div>
      </div>

      {/* Modal Ver Detalles Completo */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-2xl h-auto flex flex-col p-0 gap-0">
          <DialogHeader className="px-8 pt-6 pb-4 border-b border-gray-200 flex-shrink-0">
            <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }} className="text-2xl">
              Pedido #{selectedPedido?.pedidoID}
            </DialogTitle>
            <DialogDescription style={{ fontFamily: 'Inter, sans-serif' }}>
              {new Date(selectedPedido?.fechaPedido || '').toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            <div className="space-y-6 py-6 px-8">
            {selectedPedido && (
              <>
                {/* Sección Cliente */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <h3 style={{ fontFamily: 'Inter, sans-serif' }} className="font-semibold text-gray-800 text-base">👤 Información del Cliente</h3>
                  </div>
                  <div className="p-6 grid grid-cols-3 gap-6">
                    {[
                      ['Nombre', selectedPedido.nombreCliente],
                      ['Email', selectedPedido.emailCliente],
                      ['Teléfono', selectedPedido.telefonoCliente],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-500 font-medium uppercase">{label}</p>
                        <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm font-semibold text-gray-900">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sección Envío */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <h3 style={{ fontFamily: 'Inter, sans-serif' }} className="font-semibold text-gray-800 text-base">📍 Dirección de Envío</h3>
                  </div>
                  <div className="p-6 grid grid-cols-2 gap-6">
                    {[
                      ['Dirección', selectedPedido.direccionEnvio],
                      ['Ciudad', selectedPedido.ciudad],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-500 font-medium uppercase">{label}</p>
                        <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm font-semibold text-gray-900">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sección Pago */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <h3 style={{ fontFamily: 'Inter, sans-serif' }} className="font-semibold text-gray-800 text-base">💳 Método de Pago</h3>
                  </div>
                  <div className="p-6 flex items-center justify-between">
                    <div>
                      <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-500 mb-1">Método</p>
                      <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm font-medium text-gray-900">{selectedPedido.metodoPago}</p>
                    </div>
                    {selectedPedido.comprobantePago && (
                      <button onClick={() => setComprobanteOpen(true)}
                        style={{ fontFamily: 'Inter, sans-serif' }}
                        className="px-4 py-2 bg-[#d65391] text-white rounded-lg hover:bg-[#c14a7f] text-sm flex items-center gap-2 transition-colors">
                        <Image className="w-4 h-4" /> Ver Comprobante
                      </button>
                    )}
                  </div>
                </div>

                {/* Sección Productos */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <h3 style={{ fontFamily: 'Inter, sans-serif' }} className="font-semibold text-gray-800 text-base">📦 Productos Pedidos</h3>
                  </div>
                  <div className="p-6">
                    {selectedPedido.detalles.length === 0 ? (
                      <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-400 text-center py-4">Sin detalles de productos</p>
                    ) : (
                      <div className="space-y-3">
                        {selectedPedido.detalles.map((d, i) => (
                          <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="flex-1">
                              <p style={{ fontFamily: 'Inter, sans-serif' }} className="font-semibold text-gray-900">{d.productoNombre}</p>
                              <div className="flex gap-4 mt-1">
                                <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-500">Cantidad: <span className="font-medium text-gray-700">{d.cantidad}</span></p>
                                {d.talla && <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-500">Talla: <span className="font-medium text-gray-700">{d.talla}</span></p>}
                                {d.color && <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-500">Color: <span className="font-medium text-gray-700">{d.color}</span></p>}
                                <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-500">Precio unit: <span className="font-medium text-gray-700">{fmt(d.precioUnitario)}</span></p>
                              </div>
                            </div>
                            <p style={{ fontFamily: 'Inter, sans-serif' }} className="font-bold text-[#d65391] text-lg ml-4">{fmt(d.subtotal)}</p>
                          </div>
                        ))}
                        <div className="flex justify-between items-center pt-3 border-t border-gray-200 mt-2">
                          <p style={{ fontFamily: 'Inter, sans-serif' }} className="font-bold text-gray-900 text-lg">Total del Pedido</p>
                          <p style={{ fontFamily: 'Inter, sans-serif' }} className="font-bold text-[#d65391] text-2xl">{fmt(selectedPedido.total)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {selectedPedido.notas && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs font-semibold text-yellow-700 mb-1">Notas del cliente</p>
                    <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-yellow-800">{selectedPedido.notas}</p>
                  </div>
                )}
              </>
            )}
            </div>
          </div>

          <DialogFooter className="gap-2 px-8 py-5 border-t border-gray-200 flex-shrink-0">
            {puedeEditar && (
              <>
                <button onClick={() => { setViewOpen(false); setAprobarOpen(true); }}
                  style={{ fontFamily: 'Inter, sans-serif' }}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors">
                  <CheckCircle className="w-4 h-4" /> Aprobar
                </button>
                <button onClick={() => { setViewOpen(false); setRechazarOpen(true); }}
                  style={{ fontFamily: 'Inter, sans-serif' }}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 transition-colors">
                  <XCircle className="w-4 h-4" /> Rechazar
                </button>
              </>
            )}
            <button onClick={() => setViewOpen(false)} style={{ fontFamily: 'Inter, sans-serif' }}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">Cerrar</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Comprobante */}
      <Dialog open={comprobanteOpen} onOpenChange={setComprobanteOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-200">
            <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }} className="text-xl">Comprobante de Pago</DialogTitle>
          </DialogHeader>
          <div className="p-6">
            {selectedPedido?.comprobantePago ? (
              <img src={`http://localhost:5000${selectedPedido.comprobantePago}`} alt="Comprobante"
                className="w-full rounded-xl border border-gray-200 shadow-sm" />
            ) : (
              <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-center text-gray-400">Sin comprobante</p>
            )}
          </div>
          <DialogFooter className="px-6 pb-6">
            <button onClick={() => setComprobanteOpen(false)} style={{ fontFamily: 'Inter, sans-serif' }}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">Cerrar</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Email Pago */}
      <Dialog open={emailPagoOpen} onOpenChange={(v: boolean) => { setEmailPagoOpen(v); if (!v) setMensajePago(''); }}>
        <DialogContent className="max-w-md flex flex-col p-0 gap-0 max-h-[90vh]">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100 flex-shrink-0">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 bg-[#fce7f3] rounded-xl flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-[#d65391]" />
              </div>
              <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }} className="text-xl">
                Correo de Pago
              </DialogTitle>
            </div>
            <DialogDescription style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-500 ml-12">
              Para <strong className="text-gray-700">{selectedPedido?.nombreCliente}</strong> · {selectedPedido?.emailCliente}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            <div className="bg-[#fdf2f8] border border-[#f9a8d4] rounded-xl p-4">
              <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-[#9d174d]">
                Se enviará la información bancaria con código QR para que el cliente complete el pago del pedido <strong>#{selectedPedido?.pedidoID}</strong>.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Label style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm font-medium text-gray-700">
                Mensaje adicional <span className="text-gray-400 font-normal">(opcional)</span>
              </Label>
              <textarea value={mensajePago} onChange={e => setMensajePago(e.target.value)}
                placeholder="Ej: Hola, falta el saldo de $50.000 para completar tu pedido..."
                rows={3}
                style={{ fontFamily: 'Inter, sans-serif' }}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#d65391] resize-none bg-gray-50" />
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
              <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Datos bancarios</p>
              <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-500">Configurados en <code className="bg-white border border-gray-200 px-1.5 py-0.5 rounded text-xs">appsettings.json → BankAccount</code></p>
            </div>
          </div>
          <DialogFooter className="px-6 py-4 border-t border-gray-100 flex-shrink-0 flex gap-2">
            <button onClick={() => setEmailPagoOpen(false)} style={{ fontFamily: 'Inter, sans-serif' }}
              className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors text-sm font-medium">
              Cancelar
            </button>
            <button onClick={enviarEmailPago} disabled={saving} style={{ fontFamily: 'Inter, sans-serif' }}
              className="flex-1 py-2.5 bg-[#d65391] text-white rounded-xl hover:bg-[#c0426f] disabled:opacity-50 flex items-center justify-center gap-2 transition-colors text-sm font-medium">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              Enviar correo
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Aprobar */}
      <Dialog open={aprobarOpen} onOpenChange={setAprobarOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader className="px-6 pt-6 pb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }} className="text-xl">¿Aprobar pedido?</DialogTitle>
            </div>
            <DialogDescription style={{ fontFamily: 'Inter, sans-serif' }} className="ml-13 text-gray-600">
              El pedido de <strong className="text-gray-900">{selectedPedido?.nombreCliente}</strong> pasará al módulo de Ventas para su despacho.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 px-6 pb-6">
            <button type="button" onClick={() => setAprobarOpen(false)} style={{ fontFamily: 'Inter, sans-serif' }}
              className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors text-sm font-medium">
              Cancelar
            </button>
            <button type="button" onClick={() => selectedPedido && cambiarEstado(selectedPedido, 'Aprobado')}
              disabled={saving}
              style={{ fontFamily: 'Inter, sans-serif', backgroundColor: '#16a34a', color: '#ffffff' }}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#15803d')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#16a34a')}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Aprobar pedido
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Rechazar */}
      <Dialog open={rechazarOpen} onOpenChange={setRechazarOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-200">
            <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }}>Rechazar pedido</DialogTitle>
            <DialogDescription style={{ fontFamily: 'Inter, sans-serif' }}>
              Pedido #{selectedPedido?.pedidoID} de {selectedPedido?.nombreCliente}
            </DialogDescription>
          </DialogHeader>
          <div className="p-6">
            <Label style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm font-medium text-gray-700 mb-2 block">Razón del rechazo (opcional)</Label>
            <Textarea value={razonRechazo} onChange={e => setRazonRechazo(e.target.value)}
              placeholder="Ej: Comprobante ilegible, pago insuficiente..."
              className="border-gray-300 resize-none" rows={3} />
          </div>
          <DialogFooter className="px-6 pb-6 gap-2">
            <button onClick={() => setRechazarOpen(false)} style={{ fontFamily: 'Inter, sans-serif' }}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">Cancelar</button>
            <button onClick={() => selectedPedido && cambiarEstado(selectedPedido, 'Rechazado', razonRechazo)}
              disabled={saving} style={{ fontFamily: 'Inter, sans-serif' }}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2 transition-colors">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Rechazar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};