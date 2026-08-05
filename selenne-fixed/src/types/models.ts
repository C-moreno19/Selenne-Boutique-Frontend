// Tipos que reflejan los DTOs reales del backend (Selenne-Boutique-Backend/Models/DTOs).
// El JSON llega en camelCase (ASP.NET Core usa JsonNamingPolicy.CamelCase por defecto en AddControllers()).

export interface ApiResponse<T> {
  success: boolean;
  message?: string | null;
  data?: T | null;
  errors?: unknown;
}

export interface ImagenProducto {
  url: string;
  colorNombre?: string | null;
}

export interface VarianteStock {
  tallaNombre?: string | null;
  colorNombre?: string | null;
  stock: number;
}

export interface TallaStock {
  tallaID: number;
  nombre: string;
  stock: number;
}

export interface ColorProducto {
  colorID: number;
  nombre: string;
  codigoHex?: string | null;
}

export interface Producto {
  productoID: number;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  descripcionCorta?: string | null;
  categoriaPrincipalID: number;
  categoriaNombre?: string | null;
  tipoProductoID: number;
  tipoNombre?: string | null;
  marcaID: number;
  marcaNombre?: string | null;
  precioCompra?: number | null;
  precioVenta: number;
  precioOferta?: number | null;
  stock: number;
  imagenPrincipal?: string | null;
  estado: string;
  fechaCreacion: string;
  imagenes: ImagenProducto[];
  variantes: VarianteStock[];
  agotadoGeneral: boolean;
  tallas: TallaStock[];
  materiales: string[];
  colores: ColorProducto[];
  promedioValoracion?: number | null;
  totalValoraciones: number;
}

export type UserRole = 'Administrador' | 'Empleado' | 'Cliente';

export interface Usuario {
  usuarioID: number;
  nombreCompleto: string;
  email: string;
  telefono?: string | null;
  documento?: string | null;
  direccion?: string | null;
  ciudad?: string | null;
  cargo?: string | null;
  roleID?: number | null;
  rolNombre?: string | null;
  estado: string;
  emailVerificado: boolean;
  notificacionesEmail: boolean;
  fechaRegistro: string;
  fechaUltimoLogin?: string | null;
}

export interface PedidoDetalle {
  pedidoDetalleID: number;
  productoID: number;
  productoNombre: string;
  imagenProducto?: string | null;
  talla?: string | null;
  color?: string | null;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface Pedido {
  pedidoID: number;
  clienteID: number;
  nombreCliente: string;
  emailCliente: string;
  telefonoCliente: string;
  documentoCliente?: string | null;
  direccionEnvio: string;
  ciudad: string;
  metodoPago: string;
  subtotal: number;
  descuento: number;
  envio: number;
  total: number;
  estado: string;
  numeroGuia?: string | null;
  transportadora?: string | null;
  comprobantePago?: string | null;
  fechaPedido: string;
  fechaEnvio?: string | null;
  fechaEntrega?: string | null;
  notas?: string | null;
  detalles: PedidoDetalle[];
}

export interface Rol {
  roleID: number;
  nombre: string;
  descripcion?: string | null;
  estado?: string | null;
  permisos: string[];
}

export interface Notificacion {
  notificacionID: number;
  titulo: string;
  mensaje: string;
  tipo: string;
  leida: boolean;
  fechaCreacion: string;
  referencia?: string | null;
}

export interface CarritoItem {
  carritoID: number;
  productoID: number;
  productoNombre: string;
  imagenProducto?: string | null;
  precioUnitario: number;
  precioOferta?: number | null;
  cantidad: number;
  tallaSeleccionada?: string | null;
  colorSeleccionado?: string | null;
  subtotal: number;
}
