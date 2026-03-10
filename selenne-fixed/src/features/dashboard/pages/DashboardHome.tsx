import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  ShoppingCart, 
  Users, 
  Package, 
  Download,
  FileText,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../../components/ui/dialog';
import { toast } from 'sonner@2.0.3';

export const DashboardHome: React.FC = () => {
  // Estados para modales
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportType, setReportType] = useState('');
  const [salesDetailOpen, setSalesDetailOpen] = useState(false);
  const [stockDetailOpen, setStockDetailOpen] = useState(false);

  // Datos para gráfico de ventas últimos 30 días
  const salesData = [
    { name: '1', value: 12000 },
    { name: '5', value: 15000 },
    { name: '10', value: 18000 },
    { name: '15', value: 16000 },
    { name: '20', value: 22000 },
    { name: '25', value: 25000 },
    { name: '30', value: 28000 },
  ];

  // Datos para productos más vendidos
  const topProductsData = [
    { name: 'Vestidos', value: 2400 },
    { name: 'Blusas', value: 1800 },
    { name: 'Pantalones', value: 1200 },
    { name: 'Accesorios', value: 800 },
  ];

  // Datos para métricas por categoría (donut)
  const categoryData = [
    { name: 'Vestidos', value: 35 },
    { name: 'Blusas', value: 25 },
    { name: 'Pantalones', value: 20 },
    { name: 'Accesorios', value: 15 },
    { name: 'Otros', value: 5 },
  ];

  const COLORS = ['#d65391', '#f8a9c5', '#87CEEB', '#FFB347', '#90EE90'];

  // Últimas ventas
  const recentSales = [
    { id: 'VEN-001', cliente: 'María García', producto: 'Vestido Floral', monto: 189000, fecha: 'Hace 5 min', estado: 'Completada', cantidad: 1 },
    { id: 'VEN-002', cliente: 'Ana López', producto: 'Blusa Blanca', monto: 89000, fecha: 'Hace 15 min', estado: 'Completada', cantidad: 1 },
    { id: 'VEN-003', cliente: 'Laura Ruiz', producto: 'Jean Skinny', monto: 129000, fecha: 'Hace 1 hora', estado: 'Pendiente', cantidad: 2 },
    { id: 'VEN-004', cliente: 'Sofia Martínez', producto: 'Vestido Negro', monto: 199000, fecha: 'Hace 2 horas', estado: 'Completada', cantidad: 1 },
    { id: 'VEN-005', cliente: 'Carmen Díaz', producto: 'Blusa Satinada', monto: 119000, fecha: 'Hace 3 horas', estado: 'Completada', cantidad: 3 },
  ];

  // Productos bajos en stock
  const lowStockProducts = [
    { nombre: 'Vestido Floral Elegante', codigo: 'PRO-001', stock: 3, alerta: 'crítico', minimo: 10 },
    { nombre: 'Blusa Satinada Rosa', codigo: 'PRO-015', stock: 5, alerta: 'medio', minimo: 10 },
    { nombre: 'Jean Skinny Azul', codigo: 'PRO-003', stock: 0, alerta: 'agotado', minimo: 10 },
    { nombre: 'Vestido Cóctel Negro', codigo: 'PRO-028', stock: 7, alerta: 'medio', minimo: 10 },
    { nombre: 'Pantalón Casual Beige', codigo: 'PRO-012', stock: 2, alerta: 'crítico', minimo: 10 },
  ];

  const handleExport = (tipo: string) => {
    setReportType(tipo);
    setReportModalOpen(true);
  };

  const handleGenerateReport = () => {
    toast.success(`Generando reporte de ${reportType}...`);
    setReportModalOpen(false);
    // Simular descarga
    setTimeout(() => {
      toast.success('Reporte descargado exitosamente');
    }, 1500);
  };

  const getStockAlertColor = (alerta: string) => {
    switch (alerta) {
      case 'agotado':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'crítico':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medio':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 style={{ fontFamily: 'Playfair Display, serif' }} className="text-[36px] text-gray-900 mb-2">
          Dashboard Principal
        </h1>
        <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-gray-600">
          Resumen general del sistema de gestión
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
            $15.2M
          </p>
          <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-500">
            vs. mes anterior
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
            Ventas Totales
          </h3>
          <p style={{ fontFamily: 'Playfair Display, serif' }} className="text-[32px] text-gray-900 mb-1">
            245
          </p>
          <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-500">
            este mes
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
            1,847
          </p>
          <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-500">
            registrados
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
            Productos en Stock
          </h3>
          <p style={{ fontFamily: 'Playfair Display, serif' }} className="text-[32px] text-gray-900 mb-1">
            156
          </p>
          <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-500">
            productos disponibles
          </p>
        </div>
      </div>

      {/* Gráficos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Gráfico de Ventas */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 style={{ fontFamily: 'Playfair Display, serif' }} className="text-[22px] text-gray-900 mb-1">
                Ventas Últimos 30 Días
              </h3>
              <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-600">
                Tendencia de ventas diarias (claramente identificadas)
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
                name="Días"
              />
              <YAxis 
                style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px' }}
                stroke="#9CA3AF"
                name="Ventas ($)"
              />
              <Tooltip 
                contentStyle={{ 
                  fontFamily: 'Inter, sans-serif',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}
              />
              <Legend 
                wrapperStyle={{ fontFamily: 'Inter, sans-serif', fontSize: '14px' }}
              />
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
              <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-600">
                Top productos del mes
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
                name="Productos"
              />
              <YAxis 
                style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px' }}
                stroke="#9CA3AF"
                name="Cantidad Vendida"
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
            <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-600">
              Cantidad de productos vendidos por categoría
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

      {/* 2 Tablas de Datos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Últimas Ventas */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ fontFamily: 'Playfair Display, serif' }} className="text-[20px] text-gray-900">
              Últimas Ventas
            </h3>
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
          </div>
        </div>

        {/* Productos con Stock Bajo */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ fontFamily: 'Playfair Display, serif' }} className="text-[20px] text-gray-900">
              Stock Bajo
            </h3>
            <button
              onClick={() => setStockDetailOpen(true)}
              className="text-sm text-[#d65391] hover:text-[#c14a7f] transition-colors flex items-center gap-1"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Ver todo
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {lowStockProducts.slice(0, 4).map((product) => (
              <div key={product.codigo} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                <div className="flex items-start justify-between mb-2">
                  <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-900 flex-1">
                    {product.nombre}
                  </p>
                  <span className={`px-2 py-0.5 rounded-full text-xs border ${getStockAlertColor(product.alerta)}`}>
                    {product.alerta}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-600">
                    {product.codigo}
                  </span>
                  <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-900">
                    {product.stock} unid.
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal de Generar Reporte */}
      <Dialog open={reportModalOpen} onOpenChange={setReportModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }} className="text-2xl">
              Generar Reporte
            </DialogTitle>
            <DialogDescription style={{ fontFamily: 'Inter, sans-serif' }}>
              Selecciona el tipo de reporte que deseas generar
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h4 style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-blue-900">
                  {reportType}
                </h4>
              </div>
              <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-blue-700">
                Se generará un archivo Excel con los datos actuales
              </p>
            </div>

            <div>
              <label htmlFor="report-format" style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-700 block mb-2">
                Formato del archivo
              </label>
              <select 
                id="report-format"
                style={{ fontFamily: 'Inter, sans-serif' }}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d65391]"
              >
                <option value="xlsx">Excel (.xlsx)</option>
                <option value="pdf">PDF (.pdf)</option>
                <option value="csv">CSV (.csv)</option>
              </select>
            </div>

            <div>
              <label htmlFor="report-period" style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-700 block mb-2">
                Período
              </label>
              <select 
                id="report-period"
                style={{ fontFamily: 'Inter, sans-serif' }}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d65391]"
              >
                <option value="today">Hoy</option>
                <option value="week">Última semana</option>
                <option value="month">Último mes</option>
                <option value="year">Último año</option>
                <option value="custom">Personalizado</option>
              </select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <button
              onClick={() => setReportModalOpen(false)}
              style={{ fontFamily: 'Inter, sans-serif' }}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleGenerateReport}
              style={{ fontFamily: 'Inter, sans-serif' }}
              className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Generar Reporte
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Ver Todo - Últimas Ventas */}
      <Dialog open={salesDetailOpen} onOpenChange={setSalesDetailOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }} className="text-2xl">
              Todas las Ventas Recientes
            </DialogTitle>
            <DialogDescription style={{ fontFamily: 'Inter, sans-serif' }}>
              Historial completo de ventas realizadas
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

      {/* Modal Ver Todo - Stock Bajo */}
      <Dialog open={stockDetailOpen} onOpenChange={setStockDetailOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }} className="text-2xl flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
              Productos con Stock Bajo
            </DialogTitle>
            <DialogDescription style={{ fontFamily: 'Inter, sans-serif' }}>
              Productos que necesitan reabastecimiento urgente
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {lowStockProducts.map((product) => (
              <div key={product.codigo} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-900 mb-1">
                      {product.nombre}
                    </p>
                    <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-600">
                      Código: {product.codigo}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs border ${getStockAlertColor(product.alerta)}`}>
                    {product.alerta}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div>
                    <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-600">
                      Stock actual:
                    </span>
                    <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-900 ml-2">
                      {product.stock} unidades
                    </span>
                  </div>
                  <div>
                    <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-xs text-gray-600">
                      Stock mínimo:
                    </span>
                    <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-sm text-gray-900 ml-2">
                      {product.minimo} unidades
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <button
              onClick={() => setStockDetailOpen(false)}
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
