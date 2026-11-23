import type { Producto } from "../contexts/TiendaContext";

/**
 * Genera un placeholder on-brand (gradiente + etiqueta) como data URI SVG,
 * para no depender de fotos externas que no representan el producto real.
 */
function placeholder(label: string, angulo: number): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="500" height="625">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1" gradientTransform="rotate(${angulo} 0.5 0.5)">
          <stop offset="0%" stop-color="#0A0A0A" />
          <stop offset="55%" stop-color="#3B0A45" />
          <stop offset="100%" stop-color="#5C2A52" />
        </linearGradient>
      </defs>
      <rect width="500" height="625" fill="url(#g)" />
      <text x="250" y="320" text-anchor="middle" font-family="Georgia, serif" font-size="34" fill="#ffffff" opacity="0.92">${label}</text>
    </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Productos de ejemplo mientras el catálogo real no tiene suficiente stock
 * fotografiado. Ids negativos para no chocar nunca con ids reales de la BD;
 * ProductoDetalleView los usa como fallback cuando no encuentra el id real.
 */
export const PRODUCTOS_EJEMPLO: Producto[] = [
  {
    id: -1,
    nombre: "Camiseta Oversize Negra",
    precio: 89900,
    imagen: placeholder("CAMISETA", 25),
    imagenes: [placeholder("CAMISETA — FRENTE", 25), placeholder("CAMISETA — ESPALDA", 205)],
    categoria: "hombre",
    tipoProducto: "Camiseta",
    tallas: ["S", "M", "L", "XL"],
    colores: ["Negro"],
    rating: 0,
    nuevo: false,
    descripcion: "Camiseta oversize de algodón, corte relajado.",
  },
  {
    id: -2,
    nombre: "Conjunto Deportivo Hombre",
    precio: 189900,
    imagen: placeholder("CONJUNTO", 60),
    imagenes: [placeholder("CONJUNTO — FRENTE", 60), placeholder("CONJUNTO — ESPALDA", 240)],
    categoria: "hombre",
    tipoProducto: "Conjunto",
    tallas: ["M", "L", "XL"],
    colores: ["Negro", "Gris"],
    rating: 0,
    nuevo: false,
    descripcion: "Conjunto deportivo de dos piezas, buzo y pantalón jogger.",
  },
  {
    id: -3,
    nombre: "Pantalón Cargo Negro",
    precio: 139900,
    imagen: placeholder("PANTALÓN", 95),
    imagenes: [placeholder("PANTALÓN — FRENTE", 95), placeholder("PANTALÓN — ESPALDA", 275)],
    categoria: "mujer",
    tipoProducto: "Pantalón",
    tallas: ["S", "M", "L"],
    colores: ["Negro"],
    rating: 0,
    nuevo: false,
    descripcion: "Pantalón cargo de tiro alto con bolsillos laterales.",
  },
  {
    id: -4,
    nombre: "Camisa Oversize Mujer",
    precio: 119900,
    imagen: placeholder("CAMISA", 130),
    imagenes: [placeholder("CAMISA — FRENTE", 130), placeholder("CAMISA — ESPALDA", 310)],
    categoria: "mujer",
    tipoProducto: "Camisa",
    tallas: ["S", "M", "L"],
    colores: ["Morado"],
    rating: 0,
    nuevo: false,
    descripcion: "Camisa oversize de popelina, ideal para combinar.",
  },
  {
    id: -5,
    nombre: "Gorra District",
    precio: 69900,
    imagen: placeholder("GORRA", 165),
    imagenes: [placeholder("GORRA — FRENTE", 165), placeholder("GORRA — LADO", 345)],
    categoria: "accesorios",
    tipoProducto: "Gorra",
    tallas: ["Única"],
    colores: ["Negro"],
    rating: 0,
    nuevo: false,
    descripcion: "Gorra bordada, ajuste regulable.",
  },
  {
    id: -6,
    nombre: "Bolso Urbano",
    precio: 99900,
    imagen: placeholder("BOLSO", 200),
    imagenes: [placeholder("BOLSO — FRENTE", 200), placeholder("BOLSO — INTERIOR", 20)],
    categoria: "accesorios",
    tipoProducto: "Bolso",
    tallas: ["Única"],
    colores: ["Negro"],
    rating: 0,
    nuevo: false,
    descripcion: "Bolso cruzado resistente al agua.",
  },
];
