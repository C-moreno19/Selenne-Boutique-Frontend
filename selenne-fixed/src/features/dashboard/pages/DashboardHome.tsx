import React, { useEffect, useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Users,
  Package,
  Download,
  FileText,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../../components/ui/dialog';
import { toast } from 'sonner@2.0.3';
import { getJson } from '../../../services/api';
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

interface CategoryItem {
  name: string;
  value: number;
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
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportType, setReportType] = useState('');
  const [salesDetailOpen, setSalesDetailOpen] = useState(false);
  const [stockDetailOpen, setStockDetailOpen] = useState(false);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [lowStockProducts, setLowStockProducts] = useState<Array<StockProduct & { codigo: string; alerta: string; minimo: number }>>([]);
  const [categoryData, setCategoryData] = useState<CategoryItem[]>([]);
  const [allPedidos, setAllPedidos] = useState<PedidoDto[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>(defaultDateRange());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      try {
        const [statsRes, pedidosRes, productosRes] = await Promise.all([
          getJson('/api/admin/dashboard'),
          getJson('/api/pedidos'),
          getJson('/api/productos?estado=activo')
        ]);

        const stats = statsRes?.data || statsRes;
        if (stats) {
          setDashboardStats(stats);
          setLowStockProducts((stats.productosStockBajo || []).map((product: StockProduct) => ({
            ...product,
            codigo: `PRO-${product.productoID.toString().padStart(3, '0')}`,
            alerta: product.stock <= 0 ? 'agotado' : product.stock <= 3 ? 'crítico' : 'medio',
            minimo: 5
          })));
        }

        const pedidos = (pedidosRes?.data || pedidosRes || []) as PedidoDto[];
        setAllPedidos(pedidos);

        const products = (productosRes?.data || productosRes || []) as any[];
        const categoryCounts: Record<string, number> = {};
        products.forEach((product) => {
          const category = product.categoriaNombre || product.CategoriaNombre || 'Sin categoría';
          categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        });
        setCategoryData(Object.entries(categoryCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name, value]) => ({ name, value })));

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

  const getStockAlertColor = (alerta: string) => {
    switch (alerta) {
      case 'agotado': return 'bg-red-100 text-red-700 border-red-200';
      case 'crítico': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medio': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const COLORS = ['#d65391', '#f8a9c5', '#87CEEB', '#FFB347', '#90EE90'];

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
            ['Ventas del mes', `$${totals.ventasMensuales.toLocaleString('es-CO')}`],
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
          body: recentSales.map(s => [s.id, s.cliente, s.producto, `$${s.monto.toLocaleString('es-CO')}`, s.fecha, s.estado]),
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

      case 'Distribución por Categoría':
        autoTable(doc, {
          startY: 32,
          head: [['Categoría', 'Cantidad de Productos']],
          body: categoryData.map(c => [c.name, c.value.toString()]),
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

      case 'Distribución por Categoría':
        data = categoryData.map(cat => ({
          'Categoría': cat.name,
          'Cantidad de Productos': cat.value
        }));
        break;
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, tipo);
    XLSX.writeFile(wb, `${filename}.xlsx`);
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 style={{ fontFamily: 'Playfair Display, serif' }} className="text-[36px] text-gray-900 mb-2">
          Dashboard Principal
        </h1>
        <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-gray-600">
          {loading ? 'Cargando datos del dashboard...' : 'Resumen general del sistema de gestión'}
        </p>
      </div>

      {/* 4 Tarjetas Superiores de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Card 1 - Ventas Mensuales */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-start justify-between mb-4">
            <div className="bg-gradient-to-br from-[#d65391] to-[#f8a9c5] p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full">
              <TrendingUp className="w-3 h-3" />
              <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs">+12%</span>
            </div>
          </div>
          <h3 style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-600 mb-1">
            Ventas Mensuales
          </h3>
          <p style={{ fontFamily: 'Playfair Display, serif' }} className="text-[32px] text-gray-900 mb-1">
            ${totals.ventasMensuales.toLocaleString('es-CL')}
          </p>
          <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-500">
            Total de ingresos registrados
          </p>
        </div>

        {/* Card 2 - Ventas Totales */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-start justify-between mb-4">
            <div className="bg-gradient-to-br from-[#4169E1] to-[#87CEEB] p-3 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full">
              <TrendingUp className="w-3 h-3" />
              <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs">+8%</span>
            </div>
          </div>
          <h3 style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-600 mb-1">
            Pedidos Totales
          </h3>
          <p style={{ fontFamily: 'Playfair Display, serif' }} className="text-[32px] text-gray-900 mb-1">
            {totals.ventasTotales.toLocaleString('es-CL')}
          </p>
          <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-500">
            órdenes registradas
          </p>
        </div>

        {/* Card 3 - Clientes Activos */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-start justify-between mb-4">
            <div className="bg-gradient-to-br from-[#90EE90] to-[#98FB98] p-3 rounded-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full">
              <TrendingUp className="w-3 h-3" />
              <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs">+5%</span>
            </div>
          </div>
          <h3 style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-600 mb-1">
            Clientes Activos
          </h3>
          <p style={{ fontFamily: 'Playfair Display, serif' }} className="text-[32px] text-gray-900 mb-1">
            {totals.clientesActivos.toLocaleString('es-CL')}
          </p>
          <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-500">
            usuarios registrados
          </p>
        </div>

        {/* Card 4 - Productos Stock */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-start justify-between mb-4">
            <div className="bg-gradient-to-br from-[#FFB347] to-[#FFA500] p-3 rounded-lg">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-full">
              <TrendingDown className="w-3 h-3" />
              <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs">-3%</span>
            </div>
          </div>
          <h3 style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-600 mb-1">
            Productos Activos
          </h3>
          <p style={{ fontFamily: 'Playfair Display, serif' }} className="text-[32px] text-gray-900 mb-1">
            {totals.productosStock.toLocaleString('es-CL')}
          </p>
          <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-500">
            productos registrados
          </p>
        </div>
      </div>

      {/* Encabezado de sección de gráficas con selector de fechas */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <h2 style={{ fontFamily: 'Playfair Display, serif' }} className="text-[24px] text-gray-900">
          Análisis de Ventas
        </h2>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
          <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-500 whitespace-nowrap">
            Desde
          </span>
          <input
            type="date"
            value={toInputValue(dateRange.from)}
            max={toInputValue(dateRange.to)}
            onChange={(e) => {
              const val = e.target.value;
              if (val) setDateRange((prev) => ({ ...prev, from: new Date(val + 'T00:00:00') }));
            }}
            className="text-sm text-gray-700 border-none outline-none bg-transparent cursor-pointer"
            style={{ fontFamily: 'Inter, sans-serif' }}
          />
          <span className="text-gray-300">—</span>
          <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-500 whitespace-nowrap">
            Hasta
          </span>
          <input
            type="date"
            value={toInputValue(dateRange.to)}
            min={toInputValue(dateRange.from)}
            max={toInputValue(new Date())}
            onChange={(e) => {
              const val = e.target.value;
              if (val) setDateRange((prev) => ({ ...prev, to: new Date(val + 'T00:00:00') }));
            }}
            className="text-sm text-gray-700 border-none outline-none bg-transparent cursor-pointer"
            style={{ fontFamily: 'Inter, sans-serif' }}
          />
          <button
            onClick={() => setDateRange(defaultDateRange())}
            className="ml-1 text-xs text-[#d65391] hover:text-[#c14a7f] whitespace-nowrap transition-colors"
            style={{ fontFamily: 'Inter, sans-serif' }}
            title="Restablecer a últimos 30 días"
          >
            Resetear
          </button>
        </div>
      </div>

      {/* Gráficos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Gráfico de Ventas */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 style={{ fontFamily: 'Playfair Display, serif' }} className="text-[22px] text-gray-900 mb-1">
                Ventas por Período
              </h3>
              <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-500">
                {dateRangeLabel}
              </p>
            </div>
            <button
              onClick={() => handleExport('Ventas Mensuales')}
              className="p-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              title="Exportar reporte"
            >
              <Download className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="name"
                style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px' }}
                stroke="#9CA3AF"
              />
              <YAxis
                style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px' }}
                stroke="#9CA3AF"
              />
              <Tooltip
                contentStyle={{
                  fontFamily: 'Inter, sans-serif',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}
              />
              <Legend wrapperStyle={{ fontFamily: 'Inter, sans-serif', fontSize: '14px' }} />
              <Line
                type="monotone"
                dataKey="value"
                name="Ventas"
                stroke="#d65391"
                strokeWidth={3}
                dot={{ fill: '#d65391', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de Productos Más Vendidos */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 style={{ fontFamily: 'Playfair Display, serif' }} className="text-[22px] text-gray-900 mb-1">
                Productos Más Vendidos
              </h3>
              <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-500">
                {dateRangeLabel}
              </p>
            </div>
            <button
              onClick={() => handleExport('Productos Más Vendidos')}
              className="p-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              title="Exportar reporte"
            >
              <Download className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={topProductsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="name"
                style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px' }}
                stroke="#9CA3AF"
              />
              <YAxis
                style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px' }}
                stroke="#9CA3AF"
              />
              <Tooltip
                contentStyle={{
                  fontFamily: 'Inter, sans-serif',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}
              />
              <Bar dataKey="value" fill="#d65391" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Distribución por Categoría (Donut) */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 style={{ fontFamily: 'Playfair Display, serif' }} className="text-[22px] text-gray-900 mb-1">
              Distribución por Categoría
            </h3>
            <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-500">
              Productos activos en catálogo
            </p>
          </div>
          <button
            onClick={() => handleExport('Distribución por Categoría')}
            className="p-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            title="Exportar reporte"
          >
            <Download className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={categoryData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={5}
              dataKey="value"
              label={({ name, value }) => `${name}: ${value}`}
            >
              {categoryData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                fontFamily: 'Inter, sans-serif',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}
              formatter={(value) => `${value} producto(s)`}
            />
            <Legend
              wrapperStyle={{ fontFamily: 'Inter, sans-serif', fontSize: '14px' }}
              formatter={(value, props) => `${props.payload.name}: ${props.payload.value}`}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Últimas Ventas */}
      <div className="grid grid-cols-1 gap-6">
        {/* Últimas Ventas */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 style={{ fontFamily: 'Playfair Display, serif' }} className="text-[20px] text-gray-900">
                Últimas Ventas
              </h3>
              <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-500 mt-0.5">
                {dateRangeLabel}
              </p>
            </div>
            <button
              onClick={() => setSalesDetailOpen(true)}
              className="text-sm text-[#d65391] hover:text-[#c14a7f] transition-colors flex items-center gap-1"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Ver todo
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {recentSales.slice(0, 4).map((sale) => (
              <div key={sale.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                <div className="w-10 h-10 bg-gradient-to-br from-[#d65391] to-[#f8a9c5] rounded-lg flex items-center justify-center flex-shrink-0">
                  <ShoppingCart className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-900 truncate">
                      {sale.cliente}
                    </p>
                    <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-500">
                      {sale.fecha}
                    </span>
                  </div>
                  <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-600 truncate">
                    {sale.producto} ({sale.cantidad} {sale.cantidad === 1 ? 'producto' : 'productos'})
                  </p>
                  <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-[#d65391] mt-1">
                    ${sale.monto.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
            {recentSales.length === 0 && (
              <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-400 text-center py-6">
                Sin ventas en el período seleccionado
              </p>
            )}
          </div>
        </div>

      </div>

      {/* Modal de Generar Reporte */}
      <Dialog open={reportModalOpen} onOpenChange={setReportModalOpen}>
        <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
          <div className="bg-gradient-to-r from-[#d65391] to-[#e87ab5] px-8 py-6">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                <Download className="w-5 h-5 text-white" />
              </div>
              <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }} className="text-2xl text-white">
                Generar Reporte
              </DialogTitle>
            </div>
            <DialogDescription style={{ fontFamily: 'Inter, sans-serif' }} className="text-white/80 text-sm ml-12">
              Período: {dateRangeLabel}
            </DialogDescription>
          </div>

          <div className="px-8 py-6 space-y-5">
            <div className="flex items-center gap-3 bg-[#fdf2f8] border border-[#f9a8d4] rounded-xl px-4 py-3">
              <div className="w-8 h-8 bg-[#d65391] rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <div>
                <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm font-semibold text-[#9d174d]">{reportType}</p>
                <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-[#be185d]">Datos del período seleccionado</p>
              </div>
            </div>

            <div>
              <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Formato de descarga</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'xlsx', label: 'Excel', ext: '.xlsx', icon: '📊' },
                  { value: 'pdf', label: 'PDF', ext: '.pdf', icon: '📄' },
                ].map(opt => (
                  <label key={opt.value}
                    className="flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all has-[:checked]:border-[#d65391] has-[:checked]:bg-[#fdf2f8] border-gray-200 hover:border-gray-300">
                    <input type="radio" name="report-format-radio" value={opt.value} id={`fmt-${opt.value}`}
                      defaultChecked={opt.value === 'xlsx'} className="accent-[#d65391]" />
                    <div>
                      <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm font-semibold text-gray-800">{opt.icon} {opt.label}</p>
                      <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-400">{opt.ext}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 px-8 pb-6">
            <button type="button" onClick={() => setReportModalOpen(false)}
              style={{ fontFamily: 'Inter, sans-serif' }}
              className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors text-sm font-medium">
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
            }}
              style={{ fontFamily: 'Inter, sans-serif' }}
              className="flex-1 py-2.5 bg-[#d65391] text-white rounded-xl hover:bg-[#c14a7f] transition-colors text-sm font-semibold flex items-center justify-center gap-2">
              <Download className="w-4 h-4" /> Descargar
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Ver Todo - Últimas Ventas */}
      <Dialog open={salesDetailOpen} onOpenChange={setSalesDetailOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }} className="text-2xl">
              Ventas del Período
            </DialogTitle>
            <DialogDescription style={{ fontFamily: 'Inter, sans-serif' }}>
              {dateRangeLabel} · {recentSales.length} venta{recentSales.length !== 1 ? 's' : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {recentSales.map((sale) => (
              <div key={sale.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="w-12 h-12 bg-gradient-to-br from-[#d65391] to-[#f8a9c5] rounded-lg flex items-center justify-center flex-shrink-0">
                  <ShoppingCart className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-900">
                      {sale.id} - {sale.cliente}
                    </p>
                    <span className={`px-2 py-1 rounded-full text-xs ${sale.estado === 'Completada' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {sale.estado}
                    </span>
                  </div>
                  <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-600">
                    {sale.producto} - {sale.cantidad} {sale.cantidad === 1 ? 'producto' : 'productos'}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-[#d65391]">
                      ${sale.monto.toLocaleString()}
                    </p>
                    <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-500">
                      {sale.fecha}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {recentSales.length === 0 && (
              <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-400 text-center py-10">
                Sin ventas en el período seleccionado
              </p>
            )}
          </div>
          <DialogFooter>
            <button
              onClick={() => setSalesDetailOpen(false)}
              style={{ fontFamily: 'Inter, sans-serif' }}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cerrar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};
