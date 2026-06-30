import React, { useState, useEffect, useCallback } from 'react';
import { Search, Eye, CheckCircle, XCircle, ChevronRight, Loader2, RefreshCw, Package, User, MapPin, CreditCard, Image, Mail, X, ShoppingBag, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../../components/ui/alert-dialog';
import { Textarea } from '../../../components/ui/textarea';
import { Label } from '../../../components/ui/label';
import { toast } from '@/lib/toast';
import { getJson, apiBase } from '../../../services/api';
import api from '../../../services/api';
import { useAuth } from '../../../shared/contexts/AuthContext';

interface PedidoDetalle { productoNombre: string; cantidad: number; precioUnitario: number; subtotal: number; talla?: string; color?: string; }
interface Pedido {
  pedidoID: number; clienteID: number; nombreCliente: string; emailCliente: string;
  telefonoCliente: string; documentoCliente: string; direccionEnvio: string; ciudad: string; metodoPago: string;
  subtotal: number; descuento: number; envio: number; total: number;
  estado: string; fechaPedido: string; notas?: string; comprobantePago?: string;
  detalles: PedidoDetalle[];
}

const fmt = (n: number) => `$${new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)} COP`;
const estadoBadgeClass = (e: string) => {
  if (e === 'Completado' || e === 'Completada') return 'bg-green-50 text-green-600 border-green-200';
  if (e === 'Enviado') return 'bg-pink-50 text-[#d65391] border-pink-200';
  if (e === 'Aprobado' || e === 'Aprobada') return 'bg-blue-50 text-blue-600 border-blue-200';
  if (e === 'Rechazado' || e === 'Rechazada') return 'bg-orange-50 text-orange-600 border-orange-200';
  if (e === 'Pendiente') return 'bg-yellow-50 text-yellow-600 border-yellow-200';
  return 'bg-gray-50 text-gray-600 border-gray-200';
};

export const PedidosView: React.FC = () => {
  const { hasPermission } = useAuth();
  const puedeEditar = hasPermission('pedidos:editar');

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
        telefonoCliente: p.telefonoCliente ?? '', documentoCliente: p.documentoCliente ?? '',
        direccionEnvio: p.direccionEnvio ?? '',
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
        <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-500">Dashboard</span>
        <ChevronRight className="w-4 h-4 text-gray-400" />
        <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-medium text-gray-900">Pedidos Pendientes</span>
      </div>
      <h1 style={{ fontFamily: '"Times New Roman", Times, serif' }} className="text-4xl text-gray-900 mb-6">Pedidos Pendientes</h1>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Buscar por cliente o email..." value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
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
                  <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs font-semibold uppercase tracking-wider text-gray-500">{h}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((p, idx) => (
              <tr key={p.pedidoID} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4"><span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="font-medium text-gray-900">#{idx + 1}</span></td>
                <td className="px-6 py-4">
                  <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="font-medium text-gray-900">{p.nombreCliente}</p>
                  <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-500">{p.emailCliente}</p>
                </td>
                <td className="px-6 py-4"><span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-600">{new Date(p.fechaPedido).toLocaleDateString('es-CO')}</span></td>
                <td className="px-6 py-4"><span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="font-semibold">{fmt(p.total)}</span></td>
                <td className="px-6 py-4"><span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-600">{p.metodoPago}</span></td>
                <td className="px-6 py-4">
                  {p.comprobantePago ? (
                    <button onClick={() => { setSelectedPedido(p); setComprobanteOpen(true); }}
                      style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-[#d65391] text-sm underline hover:text-[#c14a7f] flex items-center gap-1">
                      <Image className="w-4 h-4" /> Ver
                    </button>
                  ) : <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-400">Sin comprobante</span>}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setSelectedPedido(p); setViewOpen(true); }}
                      className="p-2 text-gray-500 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors" title="Ver detalles">
                      <Eye className="w-5 h-5" />
                    </button>
                    {puedeEditar && (
                      <button onClick={() => { setSelectedPedido(p); setEmailPagoOpen(true); }}
                        className="p-2 text-gray-500 hover:bg-pink-50 hover:text-[#d65391] rounded-lg transition-colors" title="Enviar correo de pago">
                        <Mail className="w-5 h-5" />
                      </button>
                    )}
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
              <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-400" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>No hay pedidos pendientes</td></tr>
            )}
          </tbody>
        </table>
        <div className="px-6 py-4 border-t border-gray-100">
          <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-500">
            <span className="font-medium text-gray-800">{filtered.length}</span> pedidos pendientes
          </span>
        </div>
      </div>

      {/* Modal Ver Detalles Completo */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="w-[440px] flex flex-col p-0 gap-0 overflow-hidden max-h-[85vh]">
          <DialogTitle className="sr-only">Detalle de pedido</DialogTitle>
          <DialogDescription className="sr-only">Detalle del pedido del cliente</DialogDescription>

          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex-shrink-0 pr-14" style={{ background: 'linear-gradient(135deg, #fbcfe8 0%, #fdf2f8 100%)' }}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Detalle de pedido</h2>
                <p className="text-sm text-gray-400 mt-0.5">Selenne Boutique</p>
              </div>
              <span className={`mt-1 px-3 py-1 text-xs font-semibold border rounded-full flex items-center gap-1.5 flex-shrink-0 ${estadoBadgeClass(selectedPedido?.estado ?? '')}`}>
                <Check className="w-3 h-3" />{selectedPedido?.estado}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {selectedPedido?.fechaPedido ? new Date(selectedPedido.fechaPedido).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : ''}
            </p>
          </div>


          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 bg-pink-50">
            {selectedPedido && (
              <>
                {/* Cliente */}
                <div className="bg-white rounded-xl p-4 border border-pink-100">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" /> Información del cliente
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Nombre</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedPedido.nombreCliente}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Teléfono</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedPedido.telefonoCliente || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Método de pago</p>
                      <p className="text-sm font-semibold text-gray-900 capitalize">{selectedPedido.metodoPago}</p>
                    </div>
                    {selectedPedido.documentoCliente && (
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Documento</p>
                        <p className="text-sm font-semibold text-gray-900">{selectedPedido.documentoCliente}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Comprobante</p>
                      {selectedPedido.comprobantePago
                        ? <button type="button" onClick={() => setComprobanteOpen(true)} className="text-xs font-semibold flex items-center gap-1 hover:underline" style={{ color: '#d65391' }}>
                            <Image className="w-3 h-3" /> Ver comprobante
                          </button>
                        : <p className="text-xs text-gray-400">Sin comprobante</p>
                      }
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-400 mb-1">Email</p>
                      <p className="text-xs font-semibold text-gray-900 break-all">{selectedPedido.emailCliente}</p>
                    </div>
                  </div>
                </div>

                {/* Dirección */}
                {(selectedPedido.direccionEnvio || selectedPedido.ciudad) && (
                  <div className="bg-white rounded-xl p-4 border border-pink-100">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" /> Dirección de envío
                    </p>
                    <p className="text-sm font-semibold text-gray-900">{selectedPedido.direccionEnvio || '—'}</p>
                    {selectedPedido.ciudad && <p className="text-xs text-gray-500 mt-0.5">{selectedPedido.ciudad}</p>}
                  </div>
                )}

                {/* Productos */}
                <div className="bg-white rounded-xl p-4 border border-pink-100">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5" /> Productos
                  </p>
                  {selectedPedido.detalles.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-2">Sin productos</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedPedido.detalles.map((d, i) => (
                        <div key={i} className="flex items-center gap-3 bg-white rounded-lg p-2.5 border border-gray-100">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                            style={{ background: '#d65391' }}>
                            {d.cantidad}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{d.productoNombre}</p>
                            <div className="flex gap-1.5 mt-0.5 flex-wrap">
                              {d.talla && <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">T: {d.talla}</span>}
                              {d.color && <span className="text-[10px] bg-pink-50 px-1.5 py-0.5 rounded" style={{ color: '#d65391' }}>{d.color}</span>}
                            </div>
                          </div>
                          <p className="text-sm font-bold text-gray-900 flex-shrink-0">{fmt(d.subtotal)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Total */}
                <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: 'linear-gradient(135deg, #fce7f3 0%, #f9a8d4 100%)' }}>
                  <p className="text-sm font-semibold text-gray-600">Total</p>
                  <p className="text-xl font-bold" style={{ color: '#ad1457' }}>{fmt(selectedPedido.total)}</p>
                </div>

                {/* Notas */}
                {selectedPedido.notas && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                    <p className="text-xs font-semibold text-amber-600 mb-1">Nota del cliente</p>
                    <p className="text-sm text-amber-800 leading-snug">{selectedPedido.notas}</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 px-6 py-4 border-t border-pink-100 bg-pink-50">
            {puedeEditar ? (
              <div className="flex items-center justify-center gap-2">
                <button type="button" onClick={() => setViewOpen(false)}
                  className="px-5 py-2 rounded-full border border-gray-200 bg-white text-gray-500 text-sm font-medium hover:bg-gray-50 transition-all shadow-sm">
                  Cerrar
                </button>
                <button type="button" onClick={() => { setViewOpen(false); setRechazarOpen(true); }}
                  className="px-5 py-2 rounded-full border border-rose-200 bg-white text-rose-500 text-sm font-medium hover:bg-rose-50 flex items-center gap-1.5 transition-all shadow-sm">
                  <XCircle className="w-3.5 h-3.5" /> Rechazar
                </button>
                <button type="button" onClick={() => { setViewOpen(false); setAprobarOpen(true); }}
                  className="px-5 py-2 rounded-full text-white text-sm font-semibold flex items-center gap-1.5 transition-all hover:opacity-90 shadow-md"
                  style={{ background: 'linear-gradient(135deg, #d65391 0%, #ad1457 100%)' }}>
                  <CheckCircle className="w-3.5 h-3.5" /> Aprobar
                </button>
              </div>
            ) : (
              <div className="flex justify-center">
                <button type="button" onClick={() => setViewOpen(false)}
                  className="px-8 py-2 rounded-full border border-gray-200 bg-white text-gray-500 text-sm font-medium hover:bg-gray-50 transition-all shadow-sm">
                  Cerrar
                </button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Comprobante */}
      <Dialog open={comprobanteOpen} onOpenChange={setComprobanteOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-200">
            <DialogTitle style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xl">Comprobante de Pago</DialogTitle>
          </DialogHeader>
          <div className="p-6">
            {selectedPedido?.comprobantePago ? (
              <img
                src={selectedPedido.comprobantePago.startsWith('http')
                  ? selectedPedido.comprobantePago
                  : `${apiBase}${selectedPedido.comprobantePago}`}
                alt="Comprobante"
                className="w-full rounded-xl border border-gray-200 shadow-sm" />
            ) : (
              <p className="text-center text-gray-400">Sin comprobante</p>
            )}
          </div>
          <DialogFooter className="px-6 pb-6">
            <button type="button" onClick={() => setComprobanteOpen(false)}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">Cerrar</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Email Pago */}
      <Dialog open={emailPagoOpen} onOpenChange={(v: boolean) => { setEmailPagoOpen(v); if (!v) setMensajePago(''); }}>
        <DialogContent className="max-w-md flex flex-col p-0 gap-0 overflow-hidden max-h-[90vh]">
          <DialogDescription className="sr-only">Enviar correo de pago al cliente</DialogDescription>
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex-shrink-0 pr-14" style={{ background: 'linear-gradient(135deg, #fbcfe8 0%, #fdf2f8 100%)' }}>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 bg-[#fce7f3] rounded-xl flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-[#d65391]" />
              </div>
              <DialogTitle className="text-xl font-semibold text-gray-900">
                Correo de pago
              </DialogTitle>
            </div>
            <p className="text-sm text-gray-500 ml-12">
              Para <strong className="text-gray-700">{selectedPedido?.nombreCliente}</strong>
            </p>
          </div>
          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 bg-pink-50">
            <div className="bg-white border border-pink-100 rounded-xl p-4 flex gap-3 items-start">
              <div className="w-8 h-8 bg-[#fce7f3] rounded-lg flex items-center justify-center flex-shrink-0">
                <Mail className="w-4 h-4 text-[#d65391]" />
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                Se enviará al cliente la <span className="font-semibold text-gray-800">información bancaria con código QR</span> para que complete su pago pendiente.
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-medium text-gray-700">
                Mensaje adicional <span className="text-gray-400 font-normal">(opcional)</span>
              </Label>
              <textarea value={mensajePago} onChange={e => setMensajePago(e.target.value)}
                placeholder="Ej: Hola, falta el saldo de $50.000 para completar tu pedido..."
                rows={3}
                className="w-full px-3 py-2.5 border border-pink-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-[#d65391] resize-none bg-white transition-all" />
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
              <p className="text-xs text-gray-600 font-medium">Información bancaria y QR configurados correctamente</p>
            </div>
          </div>
          {/* Footer */}
          <div className="px-6 py-4 border-t border-pink-100 bg-pink-50 flex-shrink-0 flex gap-2">
            <button type="button" onClick={() => setEmailPagoOpen(false)}
              className="flex-1 py-2.5 rounded-full border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition-all text-sm font-medium shadow-sm">
              Cancelar
            </button>
            <button type="button" onClick={enviarEmailPago} disabled={saving}
              className="flex-1 py-2.5 text-white rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 transition-colors hover:opacity-90 text-sm font-semibold"
              style={{ background: 'linear-gradient(135deg, #d65391 0%, #ad1457 100%)' }}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              Enviar correo
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Aprobar */}
      <Dialog open={aprobarOpen} onOpenChange={setAprobarOpen}>
        <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
          <DialogDescription className="sr-only">Confirmar aprobación del pedido</DialogDescription>
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-pink-100 pr-14"
            style={{ background: 'linear-gradient(135deg, #fbcfe8 0%, #fdf2f8 100%)' }}>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(34, 197, 94, 0.15)' }}>
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <DialogTitle className="text-xl font-semibold text-gray-900">Aprobar pedido</DialogTitle>
            </div>
            <p className="text-sm text-gray-500 ml-12">
              Pedido de <strong className="text-gray-700">{selectedPedido?.nombreCliente}</strong>
            </p>
          </div>
          {/* Body */}
          <div className="px-6 py-5 bg-pink-50">
            <div className="bg-white border border-pink-100 rounded-xl px-4 py-3">
              <p className="text-sm text-gray-700 leading-relaxed">
                El pedido pasará al módulo de <strong className="text-gray-900">Ventas</strong> para su despacho. Esta acción no se puede deshacer.
              </p>
            </div>
          </div>
          {/* Footer */}
          <div className="px-6 py-4 border-t border-pink-100 bg-pink-50 flex gap-2">
            <button type="button" onClick={() => setAprobarOpen(false)}
              className="flex-1 py-2.5 rounded-full border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition-all text-sm font-medium shadow-sm">
              Cancelar
            </button>
            <button type="button" onClick={() => selectedPedido && cambiarEstado(selectedPedido, 'Aprobado')}
              disabled={saving}
              className="flex-1 py-2.5 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors hover:opacity-90 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #d65391 0%, #ad1457 100%)' }}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Aceptar pedido
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Rechazar */}
      <Dialog open={rechazarOpen} onOpenChange={setRechazarOpen}>
        <DialogContent className="max-w-md flex flex-col p-0 gap-0 overflow-hidden">
          <DialogDescription className="sr-only">Rechazar pedido</DialogDescription>
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-pink-100 flex-shrink-0 pr-14"
            style={{ background: 'linear-gradient(135deg, #fbcfe8 0%, #fdf2f8 100%)' }}>
            <svg width="0" height="0" className="absolute">
              <defs>
                <linearGradient id="rechazarIconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fb7185" />
                  <stop offset="100%" stopColor="#be123c" />
                </linearGradient>
              </defs>
            </svg>
            <div className="flex items-center gap-3 mb-1">
              <XCircle className="w-7 h-7 flex-shrink-0" stroke="url(#rechazarIconGradient)" />
              <DialogTitle className="text-xl font-semibold text-gray-900">Rechazar pedido</DialogTitle>
            </div>
            <p className="text-sm text-gray-500 ml-10">
              Pedido de <strong className="text-gray-700">{selectedPedido?.nombreCliente}</strong>
            </p>
          </div>
          {/* Body */}
          <div className="px-6 py-5 space-y-3 bg-pink-50">
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-medium text-gray-700">Razón del rechazo <span className="text-red-500">*</span></Label>
              <textarea value={razonRechazo} onChange={e => setRazonRechazo(e.target.value)}
                placeholder="Ej: Comprobante ilegible, pago insuficiente..."
                rows={3}
                className="w-full px-3 py-2.5 border border-pink-200 rounded-xl text-sm focus:outline-none focus:border-[#d65391] resize-none bg-white transition-colors" />
            </div>
          </div>
          {/* Footer */}
          <div className="px-6 py-4 border-t border-pink-100 bg-pink-50 flex gap-2 flex-shrink-0">
            <button type="button" onClick={() => setRechazarOpen(false)}
              className="flex-1 py-2.5 rounded-full border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition-all text-sm font-medium shadow-sm">
              Cancelar
            </button>
            <button type="button" onClick={() => {
              if (!razonRechazo.trim()) { toast.error('La razón del rechazo es obligatoria'); return; }
              selectedPedido && cambiarEstado(selectedPedido, 'Rechazado', razonRechazo);
            }} disabled={saving}
              className="flex-1 py-2.5 text-white rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 transition-colors hover:opacity-90 text-sm font-semibold"
              style={{ background: 'linear-gradient(135deg, #f43f5e 0%, #dc2626 100%)' }}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
              Rechazar
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};