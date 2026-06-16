import React, { useState } from 'react';
import { ChevronRight, Package, Plus, ArrowLeft, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { toast } from 'sonner';
import { formatCurrency } from '../../../shared/utils';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { useComprasAdmin, type Proveedor } from '../../../shared/contexts/ComprasAdminContext';

interface Producto {
  id: string;
  nombre: string;
  precioBase: number;
  sku: string;
  categoria: string;
}

interface ProductoCompra {
  id: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  total: number;
  sku: string;
}

interface NuevaCompraViewProps {
  onBack: () => void;
  onSuccess?: () => void;
}

export const NuevaCompraView: React.FC<NuevaCompraViewProps> = ({ onBack, onSuccess }) => {
  const { proveedores, agregarProveedor, agregarCompra } = useComprasAdmin();
  
  const [proveedor, setProveedor] = useState('');
  const proveedorSeleccionado = proveedores.find(p => p.id === proveedor) ?? null;
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [productosCompra, setProductosCompra] = useState<ProductoCompra[]>([]);
  const [showModalProveedor, setShowModalProveedor] = useState(false);
  const [formProveedor, setFormProveedor] = useState({
    nombre: '',
    contacto: '',
    email: '',
    telefono: '',
    documento: '',
  });
  const [proveedorErrors, setProveedorErrors] = useState({ nombre: '', contacto: '', email: '', telefono: '', documento: '' });

  const updateProveedor = (field: string, value: string) => {
    if (field === 'nombre' || field === 'contacto') {
      if (value && !/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]*$/.test(value)) {
        setProveedorErrors(prev => ({ ...prev, [field]: 'Solo se permiten letras' }));
        return;
      } else {
        setProveedorErrors(prev => ({ ...prev, [field]: '' }));
      }
    } else if (field === 'telefono') {
      if (value && !/^\d*$/.test(value)) {
        setProveedorErrors(prev => ({ ...prev, telefono: 'Solo se permiten números' }));
        return;
      } else {
        setProveedorErrors(prev => ({ ...prev, telefono: '' }));
      }
    } else if (field === 'documento') {
      if (value && !/^[\d\-]*$/.test(value)) {
        setProveedorErrors(prev => ({ ...prev, documento: 'Solo se permiten números y guiones' }));
        return;
      } else {
        setProveedorErrors(prev => ({ ...prev, documento: '' }));
      }
    } else if (field === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (value && !emailRegex.test(value)) {
        setProveedorErrors(prev => ({ ...prev, email: 'Formato de email inválido' }));
      } else {
        setProveedorErrors(prev => ({ ...prev, email: '' }));
      }
    }
    setFormProveedor(prev => ({ ...prev, [field]: value }));
  };

  const productos: Producto[] = [
    { id: '1', nombre: 'Telas de Seda Premium', precioBase: 50000, sku: 'TEL1001', categoria: 'Materiales' },
    { id: '2', nombre: 'Bolsos de Cuero', precioBase: 90000, sku: 'BLS2001', categoria: 'Accesorios' },
    { id: '3', nombre: 'Botones Metálicos', precioBase: 5000, sku: 'BOT3001', categoria: 'Accesorios' },
    { id: '4', nombre: 'Hilos de Colores', precioBase: 3000, sku: 'HIL4001', categoria: 'Materiales' },
    { id: '5', nombre: 'Cremalleras', precioBase: 8000, sku: 'CRE5001', categoria: 'Accesorios' },
  ];

  const handleAgregarProducto = () => {
    const productoSeleccionado = productos[0];
    const newProducto: ProductoCompra = {
      id: `temp-${Date.now()}`,
      nombre: productoSeleccionado.nombre,
      cantidad: 1,
      precioUnitario: productoSeleccionado.precioBase,
      total: productoSeleccionado.precioBase,
      sku: productoSeleccionado.sku,
    };
    setProductosCompra([...productosCompra, newProducto]);
  };

  const handleActualizarProducto = (index: number, field: string, value: any) => {
    const updated = [...productosCompra];
    if (field === 'cantidad' || field === 'precioUnitario') {
      updated[index][field] = Number(value);
      updated[index].total = updated[index].cantidad * updated[index].precioUnitario;
    } else {
      (updated[index] as any)[field] = value;
    }
    setProductosCompra(updated);
  };

  const handleEliminarProducto = (index: number) => {
    setProductosCompra(productosCompra.filter((_, i) => i !== index));
  };

  const totalCompra = productosCompra.reduce((sum, p) => sum + p.total, 0);

  const handleGuardarCompra = () => {
    if (!proveedor || productosCompra.length === 0) {
      toast.error('Completa todos los campos requeridos');
      return;
    }

    // Obtener nombre del proveedor
    const nombreProveedor = proveedores.find(p => p.id === proveedor)?.nombre || '';

    // crear la compra
    const nuevaCompra = {
      id: `compra-${Date.now()}`,
      ordenFactura: `OF-${Date.now().toString().slice(-6)}`,
      proveedor: nombreProveedor,
      fecha,
      total: productosCompra.reduce((sum, p) => sum + p.total, 0),
      estado: 'Activa' as const,
      productos: productosCompra,
    };

    agregarCompra(nuevaCompra);

    toast.success('Compra registrada exitosamente');
    setProveedor('');
    setProductosCompra([]);
    setFecha(new Date().toISOString().split('T')[0]);
    
    if (onSuccess) onSuccess();
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          title="Volver"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex items-center gap-2 flex-1">
          <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-500">
            Gestión de Compras
          </span>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-900">
            Nueva Compra
          </span>
        </div>
      </div>

      <div className="mb-8">
        <h1 style={{ fontFamily: '"Times New Roman", Times, serif' }} className="text-[36px] text-gray-900 mb-2">
          Crear Nueva Compra
        </h1>
        <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-gray-600">
          Registra una nueva compra a tu proveedor
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Formulario */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información Básica */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-2xl text-gray-900 mb-6">
              Información de la Compra
            </h2>

            <div className="space-y-4">
              <div>
                <Label htmlFor="proveedor" className="text-sm text-gray-700 block mb-2">
                  Proveedor *
                </Label>
                <div className="flex gap-2">
                  <Select value={proveedor} onValueChange={setProveedor}>
                    <SelectTrigger id="proveedor" className="flex-1">
                      <SelectValue placeholder="Selecciona un proveedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {proveedores.map(prov => (
                        <SelectItem key={prov.id} value={prov.id}>
                          {prov.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <button
                    onClick={() => setShowModalProveedor(true)}
                    style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                    className="px-4 py-2 bg-[#d65391] text-white rounded-lg hover:bg-[#c44880] transition-colors flex items-center gap-2 whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" />
                    Crear Proveedor
                  </button>
                </div>
                {proveedorSeleccionado && (
                  <div className="mt-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg flex items-center gap-2">
                    <span className="text-xs text-gray-500 font-medium">NIT / Documento:</span>
                    <span className="text-sm text-gray-800 font-semibold">
                      {proveedorSeleccionado.documento
                        ? proveedorSeleccionado.documento
                        : <span className="text-gray-400 font-normal italic">No registrado</span>}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="fecha" className="text-sm text-gray-700 block mb-2">
                  Fecha de Compra *
                </Label>
                <Input
                  id="fecha"
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Productos */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-2xl text-gray-900">
                Productos
              </h2>
              <button
                onClick={handleAgregarProducto}
                style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Agregar Producto
              </button>
            </div>

            {productosCompra.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-gray-500">
                  No hay productos agregados. Haz clic en "Agregar Producto" para comenzar.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {productosCompra.map((producto, idx) => (
                  <div key={producto.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div>
                          <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-600 mb-1">
                            Producto
                          </p>
                          <Select value={producto.nombre} onValueChange={(val) => handleActualizarProducto(idx, 'nombre', val)}>
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {productos.map(prod => (
                                <SelectItem key={prod.id} value={prod.nombre}>
                                  {prod.nombre}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <Label className="text-xs text-gray-600">Cantidad</Label>
                            <Input
                              type="number"
                              min="1"
                              value={producto.cantidad}
                              onChange={(e) => handleActualizarProducto(idx, 'cantidad', e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-gray-600">Precio Unit.</Label>
                            <Input
                              type="number"
                              min="0"
                              value={producto.precioUnitario}
                              onChange={(e) => handleActualizarProducto(idx, 'precioUnitario', e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-gray-600">Total</Label>
                            <div className="mt-1 px-3 py-2 bg-white border border-gray-200 rounded-lg">
                              <p style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-sm text-gray-900">
                                {formatCurrency(producto.total)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleEliminarProducto(idx)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Anular producto"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Resumen */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 sticky top-24">
            <h3 style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-xl text-gray-900 mb-6">
              Resumen de Compra
            </h3>

            <div className="space-y-4 mb-6">
              {productosCompra.map((prod, idx) => (
                <div key={prod.id} className="flex justify-between text-sm">
                  <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-gray-600">
                    {prod.nombre} × {prod.cantidad}
                  </span>
                  <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-gray-900">
                    {formatCurrency(prod.total)}
                  </span>
                </div>
              ))}
            </div>

            {productosCompra.length > 0 && (
              <>
                <div className="border-t border-gray-200 pt-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-gray-600">
                      Total
                    </span>
                    <span style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-2xl text-[#d65391]">
                      {formatCurrency(totalCompra)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleGuardarCompra}
                  style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                  className="w-full px-6 py-3 bg-[#d65391] text-white rounded-lg hover:bg-[#c44880] transition-colors font-medium"
                >
                  Guardar Compra
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal Crear Proveedor */}
      <Dialog open={showModalProveedor} onOpenChange={setShowModalProveedor}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="text-2xl">
              Crear Nuevo Proveedor
            </DialogTitle>
            <DialogDescription style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
              Completa los datos para crear un nuevo proveedor
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="prov-nombre" className="text-sm text-gray-700 block mb-2">
                Nombre del Proveedor *
              </Label>
              <Input
                id="prov-nombre"
                placeholder="Nombre completo"
                value={formProveedor.nombre}
                onChange={(e) => updateProveedor('nombre', e.target.value)}
                className={proveedorErrors.nombre ? 'border-red-500' : ''}
              />
              {proveedorErrors.nombre && <p className="text-xs text-red-500 mt-1">{proveedorErrors.nombre}</p>}
            </div>

            <div>
              <Label htmlFor="prov-contacto" className="text-sm text-gray-700 block mb-2">
                Contacto *
              </Label>
              <Input
                id="prov-contacto"
                placeholder="Nombre del contacto"
                value={formProveedor.contacto}
                onChange={(e) => updateProveedor('contacto', e.target.value)}
                className={proveedorErrors.contacto ? 'border-red-500' : ''}
              />
              {proveedorErrors.contacto && <p className="text-xs text-red-500 mt-1">{proveedorErrors.contacto}</p>}
            </div>

            <div>
              <Label htmlFor="prov-email" className="text-sm text-gray-700 block mb-2">
                Email *
              </Label>
              <Input
                id="prov-email"
                type="email"
                placeholder="correo@proveedor.com"
                value={formProveedor.email}
                onChange={(e) => updateProveedor('email', e.target.value)}
                className={proveedorErrors.email ? 'border-red-500' : ''}
              />
              {proveedorErrors.email && <p className="text-xs text-red-500 mt-1">{proveedorErrors.email}</p>}
            </div>

            <div>
              <Label htmlFor="prov-telefono" className="text-sm text-gray-700 block mb-2">
                Teléfono *
              </Label>
              <Input
                id="prov-telefono"
                placeholder="3001234567"
                value={formProveedor.telefono}
                onChange={(e) => updateProveedor('telefono', e.target.value)}
                className={proveedorErrors.telefono ? 'border-red-500' : ''}
              />
              {proveedorErrors.telefono && <p className="text-xs text-red-500 mt-1">{proveedorErrors.telefono}</p>}
            </div>

            <div>
              <Label htmlFor="prov-documento" className="text-sm text-gray-700 block mb-2">
                NIT / Documento
              </Label>
              <Input
                id="prov-documento"
                placeholder="900123456-7"
                value={formProveedor.documento}
                onChange={(e) => updateProveedor('documento', e.target.value)}
                className={proveedorErrors.documento ? 'border-red-500' : ''}
              />
              {proveedorErrors.documento && <p className="text-xs text-red-500 mt-1">{proveedorErrors.documento}</p>}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <button
              onClick={() => {
                setShowModalProveedor(false);
                setFormProveedor({ nombre: '', contacto: '', email: '', telefono: '', documento: '' });
                setProveedorErrors({ nombre: '', contacto: '', email: '', telefono: '', documento: '' });
              }}
              style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                const errores: Record<string, string> = {};
                if (!formProveedor.nombre.trim()) errores.nombre = 'El nombre del proveedor es obligatorio';
                if (!formProveedor.contacto.trim()) errores.contacto = 'El nombre del contacto es obligatorio';
                if (!formProveedor.email.trim()) errores.email = 'El email es obligatorio';
                else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formProveedor.email)) errores.email = 'Formato de email inválido';
                if (!formProveedor.telefono.trim()) errores.telefono = 'El teléfono es obligatorio';
                if (Object.keys(errores).length > 0) {
                  setProveedorErrors(prev => ({ ...prev, ...errores }));
                  return;
                }
                
                const nuevoProveedor: Proveedor = {
                  id: `prov-${Date.now()}`,
                  nombre: formProveedor.nombre,
                  contacto: formProveedor.contacto,
                  email: formProveedor.email,
                  telefono: formProveedor.telefono,
                  documento: formProveedor.documento || undefined,
                };

                agregarProveedor(nuevoProveedor);
                setProveedor(nuevoProveedor.id);
                
                toast.success('Proveedor creado exitosamente');
                setShowModalProveedor(false);
                setFormProveedor({ nombre: '', contacto: '', email: '', telefono: '', documento: '' });
                setProveedorErrors({ nombre: '', contacto: '', email: '', telefono: '', documento: '' });
              }}
              style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
              className="px-6 py-2 bg-[#d65391] text-white rounded-lg hover:bg-[#c44880] transition-colors"
            >
              Crear Proveedor
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
