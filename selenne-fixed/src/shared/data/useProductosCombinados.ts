import { useMemo } from 'react';
import { useProductos } from '../contexts/ProductosContext';
import { Producto } from '../contexts/TiendaContext';

/**
 * Hook que convierte los productos de la API al formato de la tienda.
 * Solo muestra productos activos de la BD — sin datos hardcodeados.
 */
export const useProductosCombinados = (): Producto[] => {
  const { productos: productosAdmin } = useProductos();

  return useMemo(() => {
    return productosAdmin
      .filter(p => p.activo)
      .map((p) => {
        let categoria: 'mujer' | 'accesorios' | 'sale' = 'mujer';
        const cat = (p.categoriaMain ?? '').toLowerCase();
        if (cat === 'accesorios') categoria = 'accesorios';
        else if (cat === 'sale') categoria = 'sale';
        if (p.isSale || (p.precioOriginal && p.precioOriginal > p.precio)) categoria = 'sale';

        const imagenes = Array.isArray(p.imagenes) && p.imagenes.length > 0
          ? p.imagenes : (p.imagen ? [p.imagen] : []);

        return {
          id: Number(p.id) || Math.abs(p.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)),
          nombre: p.nombre,
          precio: Number(p.precio) || 0,
          precioOriginal: p.precioOriginal ? Number(p.precioOriginal) : null,
          imagen: p.imagen ?? '',
          imagenes,
          imagenesPorColor: p.imagenesPorColor,
          categoria,
          subcategoria: p.categoria,
          tipoProducto: p.tipoProducto || 'General',
          tallas: Array.isArray(p.tallas) ? p.tallas : [],
          colores: Array.isArray(p.colores) ? p.colores : [],
          materiales: Array.isArray(p.materiales) ? p.materiales : [],
          rating: 4.5,
          badge: (p.isSale || p.precioOriginal) ? 'Sale' : null,
          nuevo: false,
        };
      });
  }, [productosAdmin]);
};