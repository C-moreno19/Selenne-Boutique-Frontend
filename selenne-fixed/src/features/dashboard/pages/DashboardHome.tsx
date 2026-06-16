import React, { useEffect, useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Users,
  Package,
  Download,
  FileText,
  FileSpreadsheet,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../../components/ui/dialog';
import { toast } from 'sonner';
import { getJson, putJson } from '../../../services/api';
import { formatCurrency } from '../../../shared/utils';
import { useAuth } from '../../../shared/contexts/AuthContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface DashboardStats {
  totalUsuarios: number;
  totalProductos: number;
  totalPedidos: number;
  pedidosPendientes: number;
  totalVentas: number;
  productosStockBajo: StockProduct[];
}

interface StockProduct {
  productoID: number;
  nombre: string;
  stock: number;
}

interface PedidoDetalleDto {
  productoNombre: string;
  cantidad: number;
}

interface PedidoDto {
  pedidoID: number;
  nombreCliente: string;
  total: number;
  estado: string;
  fechaPedido: string;
  detalles: PedidoDetalleDto[];
}

interface RecentSale {
  id: string;
  cliente: string;
  producto: string;
  monto: number;
  fecha: string;
  estado: string;
  cantidad: number;
}

interface DateRange { from: Date; to: Date; }

const toInputValue = (d: Date) => d.toISOString().slice(0, 10);

const defaultDateRange = (): DateRange => {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 29);
  return { from, to };
};

const formatDate = (d: Date) =>
  d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });

export const DashboardHome: React.FC = () => {
  const { hasPermission } = useAuth();
  const puedeEditarVentas = hasPermission('pedidos:editar');
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportType, setReportType] = useState('');
  const [salesDetailOpen, setSalesDetailOpen] = useState(false);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [allPedidos, setAllPedidos] = useState<PedidoDto[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>(defaultDateRange());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      try {
        const [statsRes, pedidosRes] = await Promise.all([
          getJson('/api/admin/dashboard'),
          getJson('/api/pedidos'),
        ]);

        const stats = statsRes?.data || statsRes;
        if (stats) {
          setDashboardStats(stats);
        }

        const pedidos = (pedidosRes?.data || pedidosRes || []) as PedidoDto[];
        setAllPedidos(pedidos);

      } catch (error: any) {
        console.error('Error cargando dashboard:', error);
        toast.error('No se pudo cargar el dashboard. Revisa la conexión con el servidor.');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const filteredPedidos = useMemo(() => {
    const { from, to } = dateRange;
    const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
    const end = new Date(to.getFullYear(), to.getMonth(), to.getDate(), 23, 59, 59, 999);
    return allPedidos.filter((pedido) => {
      const fecha = new Date(pedido.fechaPedido);
      return fecha >= start && fecha <= end;
    });
  }, [allPedidos, dateRange]);

  const salesData = useMemo(() => {
    const from = dateRange.from;
    const to = dateRange.to;
    const days: string[] = [];
    const current = new Date(from.getFullYear(), from.getMonth(), from.getDate());
    const end = new Date(to.getFullYear(), to.getMonth(), to.getDate());
    while (current <= end) {
      days.push(current.toISOString().slice(0, 10));
      current.setDate(current.getDate() + 1);
    }
    const salesByDay: Record<string, number> = {};
    days.forEach((d) => { salesByDay[d] = 0; });
    filteredPedidos.forEach((pedido) => {
      const key = new Date(pedido.fechaPedido).toISOString().slice(0, 10);
      if (key in salesByDay) salesByDay[key] += Number(pedido.total || 0);
    });
    return days.map((day) => ({ name: day.slice(5), value: salesByDay[day] || 0 }));
  }, [filteredPedidos, dateRange]);

  const topProductsData = useMemo(() => {
    const productCounts: Record<string, number> = {};
    filteredPedidos.forEach((pedido) => {
      pedido.detalles?.forEach((item) => {
        if (!item?.productoNombre) return;
        productCounts[item.productoNombre] = (productCounts[item.productoNombre] || 0) + (item.cantidad || 0);
      });
    });
    const top = Object.entries(productCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));
    return top.length ? top : [{ name: 'Sin datos', value: 0 }];
  }, [filteredPedidos]);

  const recentSales = useMemo<RecentSale[]>(() => {
    return filteredPedidos
      .slice()
      .sort((a, b) => new Date(b.fechaPedido).getTime() - new Date(a.fechaPedido).getTime())
      .slice(0, 10)
      .map((pedido) => ({
        id: `PED-${pedido.pedidoID}`,
        cliente: pedido.nombreCliente || 'Cliente',
        producto: pedido.detalles?.[0]?.productoNombre || 'Venta',
        monto: Number(pedido.total || 0),
        fecha: new Date(pedido.fechaPedido).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
        estado: pedido.estado || 'Pendiente',
        cantidad: pedido.detalles?.reduce((s, item) => s + (item?.cantidad || 0), 0) || 0,
      }));
  }, [filteredPedidos]);

  const dateRangeLabel = useMemo(() => {
    if (dateRange.from.toDateString() === dateRange.to.toDateString()) {
      return formatDate(dateRange.from);
    }
    return `${formatDate(dateRange.from)} — ${formatDate(dateRange.to)}`;
  }, [dateRange]);

  const totals = useMemo(() => ({
    ventasMensuales: dashboardStats?.totalVentas ?? 0,
    ventasTotales: dashboardStats?.totalPedidos ?? 0,
    clientesActivos: dashboardStats?.totalUsuarios ?? 0,
    productosStock: dashboardStats?.totalProductos ?? 0,
  }), [dashboardStats]);

  const pendingOrders = useMemo(() =>
    allPedidos.filter(p => p.estado === 'Pendiente'),
    [allPedidos]
  );

  const handleAprobar = async (pedidoId: number) => {
    try {
      await putJson(`/api/pedidos/${pedidoId}/estado`, { nuevoEstado: 'Aprobado' });
      setAllPedidos(prev => prev.map(p => p.pedidoID === pedidoId ? { ...p, estado: 'Aprobado' } : p));
      toast.success(`Pedido #${pedidoId} aprobado`);
    } catch {
      toast.error('Error al aprobar el pedido');
    }
  };

  const handleRechazar = async (pedidoId: number) => {
    try {
      await putJson(`/api/pedidos/${pedidoId}/estado`, { nuevoEstado: 'Rechazado' });
      setAllPedidos(prev => prev.map(p => p.pedidoID === pedidoId ? { ...p, estado: 'Rechazado' } : p));
      toast.error(`Pedido #${pedidoId} rechazado`);
    } catch {
      toast.error('Error al rechazar el pedido');
    }
  };

  const handleExport = (tipo: string) => {
    setReportType(tipo);
    setReportModalOpen(true);
  };

  const generatePDFReport = (tipo: string) => {
    const doc = new jsPDF({ orientation: 'landscape' });
    const fecha = new Date().toLocaleDateString('es-CO');
    const filename = `reporte-${tipo.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;

    const head_styles = { fillColor: [214, 83, 145] as [number, number, number], textColor: 255, fontStyle: 'bold' as const };
    const alt_row = { fillColor: [252, 242, 248] as [number, number, number] };

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(`Reporte de ${tipo} — Selenne Boutique`, 14, 18);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Generado el ${fecha} · Período: ${dateRangeLabel}`, 14, 26);

    switch (tipo) {
      case 'Ventas Mensuales':
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('Resumen General', 14, 36);
        autoTable(doc, {
          startY: 40,
          head: [['Métrica', 'Valor']],
          body: [
            ['Ventas del mes', formatCurrency(totals.ventasMensuales)],
            ['Pedidos totales', totals.ventasTotales.toLocaleString('es-CO')],
            ['Clientes activos', totals.clientesActivos.toLocaleString('es-CO')],
            ['Productos activos', totals.productosStock.toLocaleString('es-CO')],
          ],
          headStyles: head_styles,
          alternateRowStyles: alt_row,
          styles: { fontSize: 10 },
          columnStyles: { 0: { fontStyle: 'bold' } },
        });
        const y1 = (doc as any).lastAutoTable.finalY + 10;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('Ventas Recientes', 14, y1);
        autoTable(doc, {
          startY: y1 + 4,
          head: [['#', 'Cliente', 'Producto', 'Monto', 'Fecha', 'Estado']],
          body: recentSales.map(s => [s.id, s.cliente, s.producto, formatCurrency(s.monto), s.fecha, s.estado]),
          headStyles: head_styles,
          alternateRowStyles: alt_row,
          styles: { fontSize: 9 },
        });
        break;

      case 'Productos Más Vendidos':
        autoTable(doc, {
          startY: 32,
          head: [['Producto', 'Unidades Vendidas']],
          body: topProductsData.map(p => [p.name, p.value.toString()]),
          headStyles: head_styles,
          alternateRowStyles: alt_row,
          styles: { fontSize: 10 },
          columnStyles: { 1: { halign: 'center' } },
        });
        break;

    }

    doc.save(filename);
  };

  const generateExcelReport = (tipo: string) => {
    let data: any[] = [];
    const filename = `reporte-${tipo.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}`;
    switch (tipo) {
      case 'Ventas Mensuales':
        data = [
          { 'Métrica': 'Ventas Mensuales', 'Valor': totals.ventasMensuales },
          { 'Métrica': 'Pedidos Totales', 'Valor': totals.ventasTotales },
          { 'Métrica': 'Clientes Activos', 'Valor': totals.clientesActivos },
          { 'Métrica': 'Productos Activos', 'Valor': totals.productosStock },
          {},
          { 'ID': 'ID', 'Cliente': 'Cliente', 'Producto': 'Producto', 'Monto': 'Monto', 'Fecha': 'Fecha', 'Estado': 'Estado' },
          ...recentSales.map(sale => ({
            'ID': sale.id,
            'Cliente': sale.cliente,
            'Producto': sale.producto,
            'Monto': sale.monto,
            'Fecha': sale.fecha,
            'Estado': sale.estado
          }))
        ];
        break;

      case 'Productos Más Vendidos':
        data = topProductsData.map(product => ({
          'Producto': product.name,
          'Cantidad Vendida': product.value
        }));
        break;

    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, tipo);
    XLSX.writeFile(wb, `${filename}.xlsx`);
  };

  const cardShadow = { boxShadow: '0 2px 12px rgba(214, 83, 145, 0.07)' };
  const cardShadowHover = { boxShadow: '0 6px 24px rgba(214, 83, 145, 0.13)' };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 style={{ fontFamily: '"Times New Roman", Times, serif' }} className="text-3xl font-bold text-gray-800 mb-1">Dashboard</h1>
        <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-400">
          {loading ? 'Cargando datos...' : 'Resumen general del sistema'}
        </p>
      </div>

      {/* 4 Tarjetas de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Ventas Mensuales', value: formatCurrency(totals.ventasMensuales), sub: 'Total de ingresos', trend: '+12%', up: true, icon: <TrendingUp className="w-5 h-5 text-[#d65391]" />, iconBg: 'bg-[#fdf2f8]' },
          { label: 'Pedidos Totales', value: totals.ventasTotales.toLocaleString('es-CO'), sub: 'Órdenes registradas', trend: '+8%', up: true, icon: <ShoppingCart className="w-5 h-5 text-[#d65391]" />, iconBg: 'bg-[#fdf2f8]' },
          { label: 'Clientes Activos', value: totals.clientesActivos.toLocaleString('es-CO'), sub: 'Usuarios registrados', trend: '+5%', up: true, icon: <Users className="w-5 h-5 text-[#d65391]" />, iconBg: 'bg-[#fdf2f8]' },
          { label: 'Productos Activos', value: totals.productosStock.toLocaleString('es-CO'), sub: 'Productos en catálogo', trend: '-3%', up: false, icon: <Package className="w-5 h-5 text-[#d65391]" />, iconBg: 'bg-[#fdf2f8]' },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-xl p-6 border border-gray-100 transition-shadow duration-200 cursor-default"
            style={cardShadow}
            onMouseEnter={e => Object.assign((e.currentTarget as HTMLElement).style, cardShadowHover)}
            onMouseLeave={e => Object.assign((e.currentTarget as HTMLElement).style, cardShadow)}>
            <div className="flex items-center justify-between mb-5">
              <div className={`w-10 h-10 ${card.iconBg} rounded-xl flex items-center justify-center`}>
                {card.icon}
              </div>
              <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className={`text-xs font-semibold flex items-center gap-0.5 ${card.up ? 'text-emerald-600' : 'text-red-400'}`}>
                {card.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {card.trend}
              </span>
            </div>
            <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-400 mb-1 uppercase tracking-wide">{card.label}</p>
            <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-3xl font-bold text-gray-800 mb-1">{card.value}</p>
            <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-400">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Selector de fechas */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-lg font-semibold text-gray-800">Análisis de Ventas</h2>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5" style={cardShadow}>
          <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-400 whitespace-nowrap">Desde</span>
          <input type="date" value={toInputValue(dateRange.from)} max={toInputValue(dateRange.to)}
            onChange={(e) => { const val = e.target.value; if (val) setDateRange((prev) => ({ ...prev, from: new Date(val + 'T00:00:00') })); }}
            className="text-sm text-gray-600 border-none outline-none bg-transparent cursor-pointer" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} />
          <span className="text-gray-300">—</span>
          <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-400 whitespace-nowrap">Hasta</span>
          <input type="date" value={toInputValue(dateRange.to)} min={toInputValue(dateRange.from)} max={toInputValue(new Date())}
            onChange={(e) => { const val = e.target.value; if (val) setDateRange((prev) => ({ ...prev, to: new Date(val + 'T00:00:00') })); }}
            className="text-sm text-gray-600 border-none outline-none bg-transparent cursor-pointer" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} />
          <button onClick={() => setDateRange(defaultDateRange())}
            className="ml-1 text-xs text-[#d65391] hover:text-[#c14a7f] whitespace-nowrap transition-colors" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
            Resetear
          </button>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl p-6 border border-gray-100" style={cardShadow}>
          <div className="flex items-start justify-between mb-5">
            <div>
              <h3 style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-semibold text-gray-700 mb-0.5">Ventas por Período</h3>
              <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-400">{dateRangeLabel}</p>
            </div>
            <button onClick={() => handleExport('Ventas Mensuales')} className="p-2 hover:bg-[#fdf2f8] rounded-lg transition-colors" title="Exportar">
              <Download className="w-4 h-4 text-[#d65391]" />
            </button>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', fontSize: '11px' }} stroke="#e5e7eb" tick={{ fill: '#9ca3af' }} />
              <YAxis style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', fontSize: '11px' }} stroke="#e5e7eb" tick={{ fill: '#9ca3af' }} />
              <Tooltip contentStyle={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', borderRadius: '10px', border: '1px solid #fce7f3', fontSize: '12px' }} />
              <Line type="monotone" dataKey="value" name="Ventas" stroke="#d65391" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: '#d65391', stroke: '#fff', strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100" style={cardShadow}>
          <div className="flex items-start justify-between mb-5">
            <div>
              <h3 style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-semibold text-gray-700 mb-0.5">Productos Más Vendidos</h3>
              <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-400">{dateRangeLabel}</p>
            </div>
            <button onClick={() => handleExport('Productos Más Vendidos')} className="p-2 hover:bg-[#fdf2f8] rounded-lg transition-colors" title="Exportar">
              <Download className="w-4 h-4 text-[#d65391]" />
            </button>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={topProductsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', fontSize: '11px' }} stroke="#e5e7eb" tick={{ fill: '#9ca3af' }} />
              <YAxis style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', fontSize: '11px' }} stroke="#e5e7eb" tick={{ fill: '#9ca3af' }} />
              <Tooltip contentStyle={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', borderRadius: '10px', border: '1px solid #fce7f3', fontSize: '12px' }} />
              <Bar dataKey="value" fill="#d65391" radius={[6, 6, 0, 0]} opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Pedidos Pendientes */}
        <div className="bg-white rounded-xl p-6 border border-gray-100 flex flex-col" style={cardShadow}>
          <div className="flex items-start justify-between mb-5">
            <div>
              <h3 style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-semibold text-gray-700 mb-0.5">Pedidos Pendientes</h3>
              <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-400">
                {pendingOrders.length === 0 ? 'Sin pedidos por revisar' : `${pendingOrders.length} pedido${pendingOrders.length !== 1 ? 's' : ''} por revisar`}
              </p>
            </div>
            <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {pendingOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mb-3">
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                </div>
                <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-400">¡Todo al día! No hay pedidos pendientes.</p>
              </div>
            ) : pendingOrders.map((pedido) => (
              <div key={pedido.pedidoID} className="flex items-center gap-3 px-3 py-3 bg-amber-50/60 border border-amber-100 rounded-xl">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs font-bold text-amber-600">PED-{pedido.pedidoID}</span>
                    <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-400">
                      {new Date(pedido.fechaPedido).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                  <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-medium text-gray-700 truncate">{pedido.nombreCliente}</p>
                  <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-400 truncate">
                    {pedido.detalles?.[0]?.productoNombre}
                    {(pedido.detalles?.length ?? 0) > 1 ? ` +${pedido.detalles.length - 1} más` : ''}
                  </p>
                </div>
                <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-semibold text-gray-800 flex-shrink-0 mr-1">
                  {formatCurrency(pedido.total)}
                </p>
                {puedeEditarVentas && (
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button onClick={() => handleAprobar(pedido.pedidoID)}
                      className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors" title="Aprobar">
                      <CheckCircle className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleRechazar(pedido.pedidoID)}
                      className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors" title="Rechazar">
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Últimas Ventas */}
        <div className="bg-white rounded-xl p-6 border border-gray-100" style={cardShadow}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-semibold text-gray-700 mb-0.5">Últimas Ventas</h3>
              <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-400">{dateRangeLabel}</p>
            </div>
            <button onClick={() => setSalesDetailOpen(true)}
              className="text-xs text-[#d65391] hover:text-[#c14a7f] transition-colors flex items-center gap-1" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
              Ver todo <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-1">
            {recentSales.slice(0, 5).map((sale) => (
              <div key={sale.id} className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-[#fdf2f8] transition-colors">
                <div className="w-9 h-9 bg-[#fdf2f8] rounded-lg flex items-center justify-center flex-shrink-0">
                  <ShoppingCart className="w-4 h-4 text-[#d65391]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-medium text-gray-700 truncate">{sale.cliente}</p>
                  <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-400 truncate">{sale.producto}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-semibold text-[#d65391]">{formatCurrency(sale.monto)}</p>
                  <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-400">{sale.fecha}</p>
                </div>
              </div>
            ))}
            {recentSales.length === 0 && (
              <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-400 text-center py-8">Sin ventas en el período</p>
            )}
          </div>
        </div>
      </div>

      {/* Modal Reporte */}
      <Dialog open={reportModalOpen} onOpenChange={setReportModalOpen}>
        <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-8 pt-6 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#fdf2f8] rounded-xl flex items-center justify-center">
                <Download className="w-4 h-4 text-[#d65391]" />
              </div>
              <div>
                <DialogTitle style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-base font-semibold text-gray-800">Generar Reporte</DialogTitle>
                <DialogDescription style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-400 mt-0.5">Período: {dateRangeLabel}</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="px-8 py-6 space-y-5">
            <div className="flex items-center gap-3 bg-[#fdf2f8] border border-[#fce7f3] rounded-xl px-4 py-3">
              <div className="w-8 h-8 bg-[#fce7f3] rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-[#d65391]" />
              </div>
              <div>
                <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-semibold text-gray-700">{reportType}</p>
                <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-400">Datos del período seleccionado</p>
              </div>
            </div>

            <div>
              <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Formato</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'xlsx', label: 'Excel', ext: '.xlsx', icon: <FileSpreadsheet className="w-4 h-4 text-emerald-500" /> },
                  { value: 'pdf', label: 'PDF', ext: '.pdf', icon: <FileText className="w-4 h-4 text-red-400" /> },
                ].map(opt => (
                  <label key={opt.value}
                    className="flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all has-[:checked]:border-[#d65391] has-[:checked]:bg-[#fdf2f8] border-gray-200 hover:border-pink-200">
                    <input type="radio" name="report-format-radio" value={opt.value} defaultChecked={opt.value === 'xlsx'} className="accent-[#d65391]" />
                    <div>
                      <div className="flex items-center gap-1.5 mb-0.5">{opt.icon}
                        <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-semibold text-gray-700">{opt.label}</p>
                      </div>
                      <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-400">{opt.ext}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 px-8 pb-6">
            <button type="button" onClick={() => setReportModalOpen(false)} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
              className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors text-sm font-medium">
              Cancelar
            </button>
            <button type="button" onClick={() => {
              const sel = document.querySelector('input[name="report-format-radio"]:checked') as HTMLInputElement;
              const format = sel?.value || 'xlsx';
              if (!dashboardStats || loading) { toast.error('Los datos aún no están disponibles'); setReportModalOpen(false); return; }
              try {
                if (format === 'pdf') generatePDFReport(reportType);
                else generateExcelReport(reportType);
                toast.success(`Reporte de ${reportType} generado`);
                setReportModalOpen(false);
              } catch { toast.error('Error generando el reporte'); }
            }} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
              className="flex-1 py-2.5 bg-[#d65391] text-white rounded-xl hover:bg-[#c14a7f] transition-colors text-sm font-semibold flex items-center justify-center gap-2">
              <Download className="w-4 h-4" /> Descargar
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Últimas Ventas */}
      <Dialog open={salesDetailOpen} onOpenChange={setSalesDetailOpen}>
        <DialogContent className="max-w-2xl p-0 gap-0">
          <DialogHeader className="px-8 pt-6 pb-4 border-b border-gray-100">
            <DialogTitle style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-base font-semibold text-gray-800">Ventas del Período</DialogTitle>
            <DialogDescription style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-400">
              {dateRangeLabel} · {recentSales.length} venta{recentSales.length !== 1 ? 's' : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="divide-y divide-gray-50 max-h-[480px] overflow-y-auto">
            {recentSales.map((sale) => (
              <div key={sale.id} className="flex items-center gap-4 px-8 py-4 hover:bg-[#fdf2f8] transition-colors">
                <div className="w-9 h-9 bg-[#fdf2f8] rounded-lg flex items-center justify-center flex-shrink-0">
                  <ShoppingCart className="w-4 h-4 text-[#d65391]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-medium text-gray-700">{sale.id} — {sale.cliente}</p>
                  <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-400">{sale.producto} · {sale.cantidad} {sale.cantidad === 1 ? 'unidad' : 'unidades'}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm font-semibold text-[#d65391]">{formatCurrency(sale.monto)}</p>
                  <div className="flex items-center gap-2 justify-end mt-0.5">
                    <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-400">{sale.fecha}</span>
                    <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className={`text-xs font-medium px-2 py-0.5 rounded-full ${sale.estado === 'Completada' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{sale.estado}</span>
                  </div>
                </div>
              </div>
            ))}
            {recentSales.length === 0 && (
              <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-400 text-center py-12">Sin ventas en el período seleccionado</p>
            )}
          </div>
          <DialogFooter className="px-8 py-4 border-t border-gray-100">
            <button onClick={() => setSalesDetailOpen(false)} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
              className="px-5 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors text-sm">
              Cerrar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};
