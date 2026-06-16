import React, { useState } from 'react';
import { ArrowLeft, Plus, Trash2, ShoppingCart } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { toast } from 'sonner';
import { formatCurrency } from '../../../shared/utils';

interface Cliente {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
}

interface Producto {
  id: string;
  nombre: string;
  precioVenta: number;
  sku: string;
  categoria: string;
  marca: string;
  talla: string;
  color: string;
}

interface ProductoVenta {
  id: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  total: number;
  sku: string;
}

interface NuevaVentaViewProps {
  onBack: () => void;
  onSuccess: () => void;
}

const clientesData: Cliente[] = [
  { id: '1', nombre: 'María García', email: 'maria@email.com', telefono: '+57 301 234 5678' },
  { id: '2', nombre: 'Ana Martínez', email: 'ana@email.com', telefono: '+57 302 345 6789' },
  { id: '3', nombre: 'Sofia López', email: 'sofia@email.com', telefono: '+57 303 456 7890' },
];

const productosInventario: Producto[] = [
  { id: '1', nombre: 'Vestido Elegante', precioVenta: 280000, sku: 'VST1001', categoria: 'Vestidos', marca: 'Elegante', talla: 'M', color: 'Negro' },
  { id: '2', nombre: 'Blazer Premium', precioVenta: 320000, sku: 'BLZ1001', categoria: 'Blazers', marca: 'Premium', talla: 'M', color: 'Azul' },
  { id: '3', nombre: 'Bolso Luxury', precioVenta: 100000, sku: 'BLS1001', categoria: 'Bolsos', marca: 'Luxury', talla: 'Único', color: 'Negro' },
  { id: '4', nombre: 'Collar Premium', precioVenta: 5000, sku: 'ACC1001', categoria: 'Accesorios', marca: 'Premium', talla: 'Único', color: 'Oro' },
  { id: '5', nombre: 'Conjunto Casual', precioVenta: 185000, sku: 'CNS1001', categoria: 'Conjuntos', marca: 'Casual', talla: 'M', color: 'Gris' },
];

export const NuevaVentaView: React.FC<NuevaVentaViewProps> = ({ onBack, onSuccess }) => {
  const [clienteSeleccionado, setClienteSeleccionado] = useState<string>('');
  const [productoSeleccionadoId, setProductoSeleccionadoId] = useState<string>('');
  const [cantidad, setCantidad] = useState<number>(1);
  const [metodoPago, setMetodoPago] = useState<string>('Contra Entrega');
  const [productosVenta, setProductosVenta] = useState<ProductoVenta[]>([]);

  const productoSeleccionado = productosInventario.find(p => p.id === productoSeleccionadoId);

  const handleAgregarProducto = () => {
    if (!productoSeleccionado || cantidad <= 0) {
      toast.error('Selecciona un producto y cantidad válida');
      return;
    }

    const productoExistente = productosVenta.find(p => p.id === productoSeleccionadoId);
    
    if (productoExistente) {
      // Si el producto ya existe, aumenta la cantidad
      const productosActualizados = productosVenta.map(p =>
        p.id === productoSeleccionadoId
          ? {
              ...p,
              cantidad: p.cantidad + cantidad,
              total: (p.cantidad + cantidad) * p.precioUnitario,
            }
          : p
      );
      setProductosVenta(productosActualizados);
    } else {
      // Si es nuevo, lo agrega
      const nuevoProducto: ProductoVenta = {
        id: productoSeleccionado.id,
        nombre: productoSeleccionado.nombre,
        cantidad,
        precioUnitario: productoSeleccionado.precioVenta,
        total: cantidad * productoSeleccionado.precioVenta,
        sku: productoSeleccionado.sku,
      };
      setProductosVenta([...productosVenta, nuevoProducto]);
    }

    // Reset
    setProductoSeleccionadoId('');
    setCantidad(1);
    toast.success('Producto agregado al carrito');
  };

  const handleActualizarProducto = (id: string, nuevaCantidad: number) => {
    if (nuevaCantidad <= 0) {
      handleEliminarProducto(id);
      return;
    }
    
    const productosActualizados = productosVenta.map(p =>
      p.id === id
        ? {
            ...p,
            cantidad: nuevaCantidad,
            total: nuevaCantidad * p.precioUnitario,
          }
        : p
    );
    setProductosVenta(productosActualizados);
  };

  const handleEliminarProducto = (id: string) => {
    setProductosVenta(productosVenta.filter(p => p.id !== id));
    toast.success('Producto eliminado del carrito');
  };

  const subtotal = productosVenta.reduce((sum, p) => sum + p.total, 0);
  const impuesto = Math.round(subtotal * 0.19); // IVA 19%
  const total = subtotal + impuesto;

  const handleGuardarVenta = () => {
    if (!clienteSeleccionado) {
      toast.error('Debes seleccionar un cliente para continuar');
      return;
    }
    if (productosVenta.length === 0) {
      toast.error('Agrega al menos un producto a la venta');
      return;
    }

    // Aquí iría la lógica para guardar la venta
    toast.success('Venta creada correctamente');
    onSuccess();
  };

  const formatPrecio = (precio: number) => formatCurrency(precio);

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Volver"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 style={{ fontFamily: '"Times New Roman", Times, serif' }} className="text-[32px] text-gray-900">
            Nueva Venta
          </h1>
          <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-gray-600">
            Crea una nueva venta y selecciona los productos
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cliente */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xl text-gray-900 mb-4">
              Información del Cliente
            </h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="cliente" className="text-sm text-gray-700 block mb-2" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
                  Cliente *
                </Label>
                <Select value={clienteSeleccionado} onValueChange={setClienteSeleccionado}>
                  <SelectTrigger aria-label="Seleccionar cliente" className="w-full h-[42px]">
                    <SelectValue placeholder="Seleccionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientesData.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nombre} ({c.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="metodoPago" className="text-sm text-gray-700 block mb-2" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
                  Método de Pago
                </Label>
                <Select value={metodoPago} onValueChange={setMetodoPago}>
                  <SelectTrigger aria-label="Seleccionar método de pago" className="w-full h-[42px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Contra Entrega">Contra Entrega</SelectItem>
                    <SelectItem value="Tarjeta de Crédito">Tarjeta de Crédito</SelectItem>
                    <SelectItem value="Efectivo">Efectivo</SelectItem>
                    <SelectItem value="Transferencia">Transferencia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Agregar Productos */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xl text-gray-900 mb-4">
              Agregar Productos
            </h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="producto" className="text-sm text-gray-700 block mb-2" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
                  Producto
                </Label>
                <Select value={productoSeleccionadoId} onValueChange={setProductoSeleccionadoId}>
                  <SelectTrigger aria-label="Seleccionar producto" className="w-full h-[42px]">
                    <SelectValue placeholder="Seleccionar producto" />
                  </SelectTrigger>
                  <SelectContent>
                    {productosInventario.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nombre} ({formatPrecio(p.precioVenta)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cantidad" className="text-sm text-gray-700 block mb-2" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
                    Cantidad
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    value={cantidad}
                    onChange={(e) => setCantidad(Math.max(1, Number(e.target.value)))}
                    className="w-full"
                  />
                </div>

                {productoSeleccionado && (
                  <div>
                    <Label className="text-sm text-gray-700 block mb-2" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
                      Precio Unitario
                    </Label>
                    <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
                      {formatPrecio(productoSeleccionado.precioVenta)}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleAgregarProducto}
                className="w-full px-4 py-3 bg-[#d65391] text-white rounded-lg hover:bg-[#c44880] transition-colors flex items-center justify-center gap-2"
                style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
              >
                <Plus className="w-5 h-5" />
                Agregar al Carrito
              </button>
            </div>
          </div>

          {/* Carrito */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xl text-gray-900 mb-4">
              Carrito
            </h2>
            
            {productosVenta.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-8 text-center border-2 border-dashed border-gray-200">
                <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-500">
                  No hay productos en el carrito
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {productosVenta.map((producto) => (
                  <div key={producto.id} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex-1">
                      <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-gray-900 font-semibold">
                        {producto.nombre}
                      </p>
                      <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-600">
                        {formatPrecio(producto.precioUnitario)} c/u
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="1"
                        value={producto.cantidad}
                        onChange={(e) => handleActualizarProducto(producto.id, Number(e.target.value))}
                        className="w-16 text-center"
                      />
                      <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-gray-900 font-semibold w-20 text-right">
                        {formatPrecio(producto.total)}
                      </span>
                      <button
                        onClick={() => handleEliminarProducto(producto.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Resumen Lateral */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 sticky top-24">
            <h2 style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xl text-gray-900 mb-6">
              Resumen
            </h2>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center">
                <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-gray-600">
                  Subtotal
                </span>
                <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-gray-900">
                  {formatPrecio(subtotal)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-gray-600">
                  IVA (19%)
                </span>
                <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-gray-900">
                  {formatPrecio(impuesto)}
                </span>
              </div>

              <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
                <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-lg text-gray-900">
                  Total
                </span>
                <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-2xl text-[#d65391]">
                  {formatPrecio(total)}
                </span>
              </div>
            </div>

            <button
              onClick={handleGuardarVenta}
              disabled={!clienteSeleccionado || productosVenta.length === 0}
              className="w-full px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
            >
              Guardar Venta
            </button>

            <button
              onClick={onBack}
              className="w-full mt-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
            >
              Cancelar
            </button>

            {/* Resumen de Productos */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-600 mb-2">
                Productos en carrito
              </p>
              <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-2xl text-gray-900">
                {productosVenta.length}
              </p>
              {productosVenta.length > 0 && (
                <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xs text-gray-500 mt-2">
                  {productosVenta.reduce((sum, p) => sum + p.cantidad, 0)} {productosVenta.reduce((sum, p) => sum + p.cantidad, 0) === 1 ? 'artículo' : 'artículos'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
