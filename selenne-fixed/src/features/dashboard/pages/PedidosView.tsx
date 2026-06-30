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
  telefonoCliente: string; direccionEnvio: string; ciudad: string; metodoPago: string;
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
        <DialogContent className="w-[420px] flex flex-col p-0 gap-0 overflow-hidden max-h-[88vh]">
          <DialogTitle className="sr-only">Detalle de pedido</DialogTitle>
          <DialogDescription className="sr-only">Detalle del pedido del cliente</DialogDescription>

          {/* Header */}
          <div className="bg-pink-50 px-4 py-3 pr-12 flex items-center gap-2.5 border-b border-pink-100 flex-shrink-0">
            <div className="w-7 h-7 bg-[#d65391] rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">S</div>
            <span className="text-xs font-bold tracking-[3px] text-[#d65391] uppercase">Selenne Boutique</span>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto bg-gray-50 px-4 py-4 space-y-3">
            {/* Avatar + título + badge */}
            <div className="flex items-start gap-4 pb-3 border-b border-pink-100">
              <div className="w-11 h-11 bg-[#d65391] rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                {selectedPedido?.nombreCliente?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-bold text-gray-900 leading-tight">Detalle de pedido</p>
                <p className="text-[#d65391] font-semibold text-sm">{selectedPedido?.nombreCliente}</p>
                <p className="text-gray-400 text-xs">{selectedPedido?.emailCliente}</p>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${estadoBadgeClass(selectedPedido?.estado ?? '')}`}>
                  <Check className="w-3 h-3" />
                  {selectedPedido?.estado}
                </span>
                <span className="text-xs text-gray-400">
                  {selectedPedido?.fechaPedido ? new Date(selectedPedido.fechaPedido).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                </span>
              </div>
            </div>

            {selectedPedido && (
              <>
                {/* Cliente + Pago */}
                <div className="border border-pink-100 rounded-xl overflow-hidden bg-white shadow-sm">
                  <div className="grid grid-cols-2 divide-x divide-pink-100">
                    <div className="p-3 flex items-start gap-3">
                      <div className="w-8 h-8 bg-pink-50 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-[#d65391]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-400 mb-1">Cliente</p>
                        <p className="text-sm font-bold text-gray-900 truncate">{selectedPedido.nombreCliente}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{selectedPedido.telefonoCliente}</p>
                      </div>
                    </div>
                    <div className="p-3 flex items-start gap-3">
                      <div className="w-8 h-8 bg-pink-50 rounded-full flex items-center justify-center flex-shrink-0">
                        <CreditCard className="w-4 h-4 text-[#d65391]" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Método de pago</p>
                        <p className="text-sm font-bold text-gray-900 capitalize">{selectedPedido.metodoPago}</p>
                        {selectedPedido.comprobantePago && (
                          <button type="button" onClick={() => setComprobanteOpen(true)}
                            className="mt-1.5 text-xs text-[#d65391] font-semibold flex items-center gap-1 hover:underline">
                            <Image className="w-3 h-3" /> Ver comprobante
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dirección */}
                {(selectedPedido.direccionEnvio || selectedPedido.ciudad) && (
                  <div className="border border-pink-100 rounded-xl p-3 bg-white shadow-sm flex items-start gap-3">
                    <div className="w-8 h-8 bg-pink-50 rounded-full flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 text-[#d65391]" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Dirección de envío</p>
                      <p className="text-sm font-bold text-gray-900">{selectedPedido.direccionEnvio || '—'}</p>
                      {selectedPedido.ciudad && <p className="text-xs text-gray-500 mt-0.5">{selectedPedido.ciudad}</p>}
                    </div>
                  </div>
                )}

                {/* Productos */}
                <div className="border border-pink-100 rounded-xl p-3 bg-white shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-pink-50 rounded-full flex items-center justify-center flex-shrink-0">
                      <ShoppingBag className="w-4 h-4 text-[#d65391]" />
                    </div>
                    <p className="text-sm font-semibold text-gray-700">Productos</p>
                  </div>
                  {selectedPedido.detalles.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-2">Sin productos</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedPedido.detalles.map((d, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <span className="w-5 h-5 bg-pink-50 border border-pink-100 rounded-full flex items-center justify-center text-xs font-bold text-[#d65391] flex-shrink-0">
                            {d.cantidad}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-800 truncate">{d.productoNombre}</p>
                            <div className="flex gap-1.5 mt-0.5 flex-wrap">
                              {d.talla && <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">T: {d.talla}</span>}
                              {d.color && <span className="text-[10px] bg-pink-50 text-[#d65391] px-2 py-0.5 rounded-full">{d.color}</span>}
                            </div>
                          </div>
                          <span className="text-sm font-bold text-gray-900 flex-shrink-0">{fmt(d.subtotal)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Total */}
                <div className="bg-white border border-pink-200 rounded-xl px-4 py-3 flex items-center justify-between shadow-sm">
                  <span className="text-base font-semibold text-[#d65391]">Total</span>
                  <span className="text-xl font-bold text-[#d65391]">{fmt(selectedPedido.total)}</span>
                </div>

                {/* Notas */}
                {selectedPedido.notas && (
                  <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3">
                    <p className="text-[10px] font-bold text-amber-600 uppercase mb-1">Nota del cliente</p>
                    <p className="text-sm text-amber-800 leading-snug">{selectedPedido.notas}</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 px-4 py-3 border-t border-pink-100 bg-white">
            {puedeEditar ? (
              <div className="flex gap-2">
                <button type="button" onClick={() => setViewOpen(false)}
                  className="text-sm text-gray-400 hover:text-gray-600 transition-colors px-3 py-2">
                  Cerrar
                </button>
                <div className="flex-1" />
                <button type="button" onClick={() => { setViewOpen(false); setRechazarOpen(true); }}
                  className="px-4 py-2 border border-red-200 text-red-500 rounded-full hover:bg-red-50 flex items-center gap-1.5 transition-colors text-sm font-medium">
                  <XCircle className="w-3.5 h-3.5" /> Rechazar
                </button>
                <button type="button" onClick={() => { setViewOpen(false); setAprobarOpen(true); }}
                  className="px-4 py-2 bg-green-600 text-white rounded-full hover:bg-green-700 flex items-center gap-1.5 transition-colors text-sm font-semibold">
                  <CheckCircle className="w-3.5 h-3.5" /> Aprobar
                </button>
              </div>
            ) : (
              <div className="flex justify-end">
                <button type="button" onClick={() => setViewOpen(false)}
                  className="px-6 py-2 bg-[#d65391] text-white text-sm font-semibold rounded-full hover:bg-[#c0426f] transition-colors">
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
        <DialogContent className="w-[420px] flex flex-col p-0 gap-0 overflow-hidden max-h-[88vh]">
          <DialogDescription className="sr-only">Enviar correo de pago al cliente</DialogDescription>
          {/* Selenne header */}
          <div className="bg-pink-50 px-4 py-3 pr-12 flex items-center gap-2.5 border-b border-pink-100 flex-shrink-0">
            <div className="w-7 h-7 bg-[#d65391] rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">S</div>
            <span className="text-xs font-bold tracking-[3px] text-[#d65391] uppercase">Selenne Boutique</span>
          </div>
          {/* Pink sub-header */}
          <div className="bg-[#d65391] px-4 py-4 flex-shrink-0">
            <DialogTitle className="flex items-center gap-3 mb-3 text-white text-lg font-bold">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-white" />
              </div>
              Correo de pago
            </DialogTitle>
            <div className="flex items-center gap-3 bg-white/15 rounded-xl px-3 py-2.5">
              <div className="w-8 h-8 bg-white/25 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {selectedPedido?.nombreCliente?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-white font-semibold text-sm truncate">{selectedPedido?.nombreCliente}</p>
                <p className="text-white/75 text-xs truncate">{selectedPedido?.emailCliente}</p>
              </div>
            </div>
          </div>
          {/* Body */}
          <div className="flex-1 overflow-y-auto bg-gray-50 px-4 py-4 space-y-3">
            <div className="bg-white border border-pink-100 rounded-xl p-4 flex gap-3 items-start shadow-sm">
              <div className="w-8 h-8 bg-pink-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Mail className="w-4 h-4 text-[#d65391]" />
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                Se enviará al cliente la <span className="font-semibold text-gray-800">información bancaria con código QR</span> para que complete su pago pendiente.
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-semibold text-gray-700">
                Mensaje adicional <span className="text-gray-400 font-normal">(opcional)</span>
              </Label>
              <textarea value={mensajePago} onChange={e => setMensajePago(e.target.value)}
                placeholder="Ej: Hola, falta el saldo de $50.000 para completar tu pedido..."
                rows={3}
                className="w-full px-3 py-2.5 border border-pink-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-[#d65391] resize-none bg-white transition-all" />
            </div>
            <div className="bg-white border border-emerald-100 rounded-xl p-3 flex items-center gap-3 shadow-sm">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 flex-shrink-0 ml-1" />
              <p className="text-xs text-gray-600 font-medium">Información bancaria y QR configurados correctamente</p>
            </div>
          </div>
          {/* Footer */}
          <div className="px-4 py-3 border-t border-pink-100 bg-white flex-shrink-0 flex gap-2">
            <button type="button" onClick={() => setEmailPagoOpen(false)}
              className="px-4 py-2 text-gray-500 text-sm font-medium hover:text-gray-700 transition-colors">
              Cancelar
            </button>
            <button type="button" onClick={enviarEmailPago} disabled={saving}
              className="flex-1 py-2 bg-[#d65391] text-white rounded-full hover:bg-[#c0426f] disabled:opacity-50 flex items-center justify-center gap-2 transition-colors text-sm font-semibold">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              Enviar correo
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Aprobar */}
      <Dialog open={aprobarOpen} onOpenChange={setAprobarOpen}>
        <DialogContent className="w-[380px] flex flex-col p-0 gap-0 overflow-hidden">
          <DialogDescription className="sr-only">Confirmar aprobación del pedido</DialogDescription>
          {/* Selenne header */}
          <div className="bg-pink-50 px-4 py-3 pr-12 flex items-center gap-2.5 border-b border-pink-100 flex-shrink-0">
            <div className="w-7 h-7 bg-[#d65391] rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">S</div>
            <span className="text-xs font-bold tracking-[3px] text-[#d65391] uppercase">Selenne Boutique</span>
          </div>
          {/* Body */}
          <div className="bg-white px-6 py-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-gray-900">¿Aprobar pedido?</DialogTitle>
                <p className="text-xs text-gray-400 mt-0.5">Esta acción no se puede deshacer</p>
              </div>
            </div>
            <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3">
              <p className="text-sm text-gray-700 leading-relaxed">
                El pedido de <strong className="text-gray-900">{selectedPedido?.nombreCliente}</strong> pasará al módulo de Ventas para su despacho.
              </p>
            </div>
          </div>
          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex gap-3 flex-shrink-0">
            <button type="button" onClick={() => setAprobarOpen(false)}
              className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-full hover:bg-gray-100 transition-colors text-sm font-medium">
              Cancelar
            </button>
            <button type="button" onClick={() => selectedPedido && cambiarEstado(selectedPedido, 'Aprobado')}
              disabled={saving}
              className="flex-1 py-2.5 bg-green-600 text-white rounded-full hover:bg-green-700 text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Aprobar
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Rechazar */}
      <Dialog open={rechazarOpen} onOpenChange={setRechazarOpen}>
        <DialogContent className="w-[400px] flex flex-col p-0 gap-0 overflow-hidden">
          <DialogDescription className="sr-only">Rechazar pedido</DialogDescription>
          {/* Selenne header */}
          <div className="bg-pink-50 px-4 py-3 pr-12 flex items-center gap-2.5 border-b border-pink-100 flex-shrink-0">
            <div className="w-7 h-7 bg-[#d65391] rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">S</div>
            <span className="text-xs font-bold tracking-[3px] text-[#d65391] uppercase">Selenne Boutique</span>
          </div>
          {/* Body */}
          <div className="bg-white px-6 py-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                <XCircle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-gray-900">Rechazar pedido</DialogTitle>
                <p className="text-sm text-gray-500 mt-0.5">Pedido de <strong className="text-gray-700">{selectedPedido?.nombreCliente}</strong></p>
              </div>
            </div>
            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-2 block">Razón del rechazo <span className="text-red-500">*</span></Label>
              <Textarea value={razonRechazo} onChange={e => setRazonRechazo(e.target.value)}
                placeholder="Ej: Comprobante ilegible, pago insuficiente..."
                className="border-pink-100 rounded-xl resize-none focus-visible:ring-pink-300" rows={3} />
            </div>
          </div>
          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex gap-3 flex-shrink-0">
            <button type="button" onClick={() => setRechazarOpen(false)}
              className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-full hover:bg-gray-100 transition-colors text-sm font-medium">
              Cancelar
            </button>
            <button type="button" onClick={() => {
              if (!razonRechazo.trim()) { toast.error('La razón del rechazo es obligatoria'); return; }
              selectedPedido && cambiarEstado(selectedPedido, 'Rechazado', razonRechazo);
            }} disabled={saving}
              className="flex-1 py-2.5 bg-red-500 text-white rounded-full hover:bg-red-600 text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
              Rechazar
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};