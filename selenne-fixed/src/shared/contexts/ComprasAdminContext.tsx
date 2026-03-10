import React, { createContext, useContext, useState, useState as useStateStorage, ReactNode } from 'react';

export interface Proveedor {
  id: string;
  nombre: string;
  contacto: string;
  email: string;
  telefono: string;
  documento?: string; // NIT, cédula u otro identificador fiscal
}

export interface ProductoComprado {
  id: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  total: number;
  sku: string;
  categoria?: string;
  marca?: string;
  talla?: string;
  color?: string;
  material?: string;
  tipoProducto?: string;
}

export interface Compra {
  id: string;
  ordenFactura: string;
  proveedor: string;
  fecha: string;
  total: number;
  estado: 'Activa' | 'Anulada';
  productos: ProductoComprado[];
}

interface ComprasAdminContextType {
  proveedores: Proveedor[];
  compras: Compra[];
  agregarProveedor: (proveedor: Proveedor) => void;
  agregarCompra: (compra: Compra) => void;
  actualizarCompra: (id: string, compra: Partial<Compra>) => void;
  anularCompra: (id: string) => void;
}

const ComprasAdminContext = createContext<ComprasAdminContextType | undefined>(undefined);

export const useComprasAdmin = () => {
  const context = useContext(ComprasAdminContext);
  if (!context) {
    throw new Error('useComprasAdmin debe usarse dentro de ComprasAdminProvider');
  }
  return context;
};

interface ComprasAdminProviderProps {
  children: ReactNode;
}

const proveedoresIniciales: Proveedor[] = [
  { id: '1', nombre: 'Textiles Premium S.A.', contacto: 'Carlos Rodríguez', email: 'contacto@textilespremium.com', telefono: '+57 312 456 7890' },
  { id: '2', nombre: 'Accesorios Elite Ltda.', contacto: 'María González', email: 'ventas@accesorioselite.com', telefono: '+57 301 234 5678' },
  { id: '3', nombre: 'Importadora Fashion', contacto: 'Ana Martínez', email: 'info@importadorafashion.com', telefono: '+57 320 987 6543' },
];

const comprasIniciales: Compra[] = [
  {
    id: '1',
    ordenFactura: 'OF-2024-001',
    proveedor: 'Textiles Premium S.A.',
    fecha: '2024-11-15',
    total: 2500000,
    estado: 'Activa',
    productos: [
      { id: '1', nombre: 'Telas de Seda Premium', cantidad: 50, precioUnitario: 50000, total: 2500000, sku: 'TEL1001', categoria: 'Materiales', marca: 'Premium Textil', talla: 'N/A', color: 'Varios', material: 'Seda', tipoProducto: 'Tela' }
    ]
  },
  {
    id: '2',
    ordenFactura: 'OF-2024-002',
    proveedor: 'Accesorios Elite Ltda.',
    fecha: '2024-11-17',
    total: 1800000,
    estado: 'Activa',
    productos: [
      { id: '1', nombre: 'Bolsos de Cuero', cantidad: 20, precioUnitario: 90000, total: 1800000, sku: 'BLS2001', categoria: 'Accesorios', marca: 'Elite Fashion', talla: 'Único', color: 'Negro', material: 'Cuero', tipoProducto: 'Bolso' }
    ]
  },
  {
    id: '3',
    ordenFactura: 'OF-2024-003',
    proveedor: 'Importadora Fashion',
    fecha: '2024-11-18',
    total: 3200000,
    estado: 'Activa',
    productos: [
      { id: '1', nombre: 'Vestidos Importados', cantidad: 30, precioUnitario: 106667, total: 3200000, sku: 'VST3001', categoria: 'Vestidos', marca: 'Fashion Import', talla: 'S/M/L', color: 'Varios', material: 'Poliéster', tipoProducto: 'Vestido' }
    ]
  },
];

export const ComprasAdminProvider: React.FC<ComprasAdminProviderProps> = ({ children }) => {
  const [proveedores, setProveedores] = useState<Proveedor[]>(() => {
    try {
      const saved = localStorage.getItem('selenne_proveedores');
      return saved ? JSON.parse(saved) : proveedoresIniciales;
    } catch {
      return proveedoresIniciales;
    }
  });

  const [compras, setCompras] = useState<Compra[]>(() => {
    try {
      const saved = localStorage.getItem('selenne_compras');
      return saved ? JSON.parse(saved) : comprasIniciales;
    } catch {
      return comprasIniciales;
    }
  });

  const agregarProveedor = (nuevoProveedor: Proveedor) => {
    const proveedorConId = {
      ...nuevoProveedor,
      id: nuevoProveedor.id || `prov-${Date.now()}`,
    };
    
    const nuevosProveedores = [...proveedores, proveedorConId];
    setProveedores(nuevosProveedores);
    
    try {
      localStorage.setItem('selenne_proveedores', JSON.stringify(nuevosProveedores));
    } catch {
      console.error('Error al guardar proveedores en localStorage');
    }
  };

  const agregarCompra = (nuevaCompra: Compra) => {
    const compraConId = {
      ...nuevaCompra,
      id: nuevaCompra.id || `compra-${Date.now()}`,
      ordenFactura: nuevaCompra.ordenFactura || `OF-${Date.now()}`,
    };
    
    const nuevasCompras = [...compras, compraConId];
    setCompras(nuevasCompras);
    
    try {
      localStorage.setItem('selenne_compras', JSON.stringify(nuevasCompras));
    } catch {
      console.error('Error al guardar compras en localStorage');
    }
  };

  const actualizarCompra = (id: string, actualizaciones: Partial<Compra>) => {
    const nuevasCompras = compras.map(compra =>
      compra.id === id ? { ...compra, ...actualizaciones } : compra
    );
    setCompras(nuevasCompras);
    
    try {
      localStorage.setItem('selenne_compras', JSON.stringify(nuevasCompras));
    } catch {
      console.error('Error al actualizar compras en localStorage');
    }
  };

  const anularCompra = (id: string) => {
    actualizarCompra(id, { estado: 'Anulada' });
  };

  const value: ComprasAdminContextType = {
    proveedores,
    compras,
    agregarProveedor,
    agregarCompra,
    actualizarCompra,
    anularCompra,
  };

  return (
    <ComprasAdminContext.Provider value={value}>
      {children}
    </ComprasAdminContext.Provider>
  );
};
