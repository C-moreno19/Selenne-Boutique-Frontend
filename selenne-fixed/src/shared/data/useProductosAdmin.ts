import { useProductos, ProductoAdmin } from '../contexts/ProductosContext';

/**
 * Hook para mostrar todos los productos en admin.
 * Ahora carga directamente desde la API via ProductosContext.
 */
export const useProductosAdmin = (): ProductoAdmin[] => {
  const { productos } = useProductos();
  return productos;
};