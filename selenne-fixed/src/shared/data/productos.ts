import { Producto } from '../contexts/TiendaContext';

export const productos: Producto[] = [
  // MUJER - Con descuento (Sale)
  {
    id: 1,
    nombre: 'Vestido Elegante Negro',
    precio: 280000,
    precioOriginal: 350000,
    imagen: 'https://images.unsplash.com/photo-1760287363707-851f4780b98c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21lbiUyMGRyZXNzJTIwYm91dGlxdWV8ZW58MXx8fHwxNzYyNTI3Njg1fDA&ixlib=rb-4.1.0&q=80&w=1080',
    imagenes: [
      'https://images.unsplash.com/photo-1760287363707-851f4780b98c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21lbiUyMGRyZXNzJTIwYm91dGlxdWV8ZW58MXx8fHwxNzYyNTI3Njg1fDA&ixlib=rb-4.1.0&q=80&w=1080',
      'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=1080&q=80',
      'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=1080&q=80'
    ],
    colores: ['Negro', 'Azul Marino', 'Vino'],
    materiales: ['Algodón', 'Poliéster'],
    categoria: 'sale',
    subcategoria: 'Vestido',
    tipoProducto: 'Elegante',
    tallas: ['S', 'M', 'L'],
    rating: 4.8,
    badge: 'Sale',
    nuevo: false
  },
  {
    id: 2,
    nombre: 'Blazer Premium Beige',
    precio: 320000,
    precioOriginal: null,
    imagen: 'https://images.unsplash.com/photo-1522865566378-a8b4d1344d24?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjB3b21lbiUyMGNsb3RoaW5nfGVufDF8fHx8MTc2MjUyNzY4NHww&ixlib=rb-4.1.0&q=80&w=1080',
    imagenes: [
      'https://images.unsplash.com/photo-1522865566378-a8b4d1344d24?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjB3b21lbiUyMGNsb3RoaW5nfGVufDF8fHx8MTc2MjUyNzY4NHww&ixlib=rb-4.1.0&q=80&w=1080',
      'https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=1080&q=80',
      'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=1080&q=80'
    ],
    colores: ['Beige', 'Negro', 'Blanco'],
    materiales: ['Lino', 'Sintético'],
    categoria: 'mujer',
    subcategoria: 'Blazer',
    tipoProducto: 'Formal',
    tallas: ['S', 'M', 'L', 'XL'],
    rating: 4.9,
    badge: 'Bestseller',
    nuevo: false
  },
  {
    id: 3,
    nombre: 'Conjunto Casual Chic',
    precio: 185000,
    precioOriginal: 240000,
    imagen: 'https://images.unsplash.com/photo-1619384846683-8dede3452564?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwbW9kZWwlMjBlbGVnYW50fGVufDF8fHx8MTc2MjQ5MDM4NHww&ixlib=rb-4.1.0&q=80&w=1080',
    imagenes: [
      'https://images.unsplash.com/photo-1619384846683-8dede3452564?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwbW9kZWwlMjBlbGVnYW50fGVufDF8fHx8MTc2MjQ5MDM4NHww&ixlib=rb-4.1.0&q=80&w=1080',
      'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=1080&q=80',
      'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?w=1080&q=80'
    ],
    colores: ['Beige', 'Gris', 'Rosa'],
    materiales: ['Algodón'],
    categoria: 'sale',
    subcategoria: 'Conjunto',
    tipoProducto: 'Casual Chic',
    tallas: ['S', 'M'],
    rating: 4.7,
    badge: 'Sale',
    nuevo: false
  },
  {
    id: 4,
    nombre: 'Blusa de Seda Premium',
    precio: 145000,
    precioOriginal: null,
    imagen: 'https://images.unsplash.com/photo-1759893362613-8bb8bb057af1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVnYW50JTIwZmFzaGlvbiUyMGJvdXRpcXVlfGVufDF8fHx8MTc2MjQxMDkyOHww&ixlib=rb-4.1.0&q=80&w=1080',
    imagenes: [
      'https://images.unsplash.com/photo-1759893362613-8bb8bb057af1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVnYW50JTIwZmFzaGlvbiUyMGJvdXRpcXVlfGVufDF8fHx8MTc2MjQxMDkyOHww&ixlib=rb-4.1.0&q=80&w=1080',
      'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=1080&q=80'
    ],
    colores: ['Blanco', 'Negro', 'Nude'],
    materiales: ['Seda'],
    categoria: 'mujer',
    subcategoria: 'Blusa',
    tipoProducto: 'Formal',
    tallas: ['S', 'M', 'L'],
    rating: 4.6,
    badge: null,
    nuevo: true
  },
  {
    id: 5,
    nombre: 'Pantalón Elegante',
    precio: 165000,
    precioOriginal: null,
    imagen: 'https://images.unsplash.com/photo-1522865566378-a8b4d1344d24?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjB3b21lbiUyMGNsb3RoaW5nfGVufDF8fHx8MTc2MjUyNzY4NHww&ixlib=rb-4.1.0&q=80&w=1080',
    imagenes: [
      'https://images.unsplash.com/photo-1522865566378-a8b4d1344d24?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjB3b21lbiUyMGNsb3RoaW5nfGVufDF8fHx8MTc2MjUyNzY4NHww&ixlib=rb-4.1.0&q=80&w=1080',
      'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=1080&q=80'
    ],
    colores: ['Negro', 'Azul Marino', 'Camel'],
    materiales: ['Lana', 'Sintético'],
    categoria: 'mujer',
    subcategoria: 'Pantalón',
    tipoProducto: 'Formal',
    tallas: ['S', 'M', 'L', 'XL'],
    rating: 4.5,
    badge: null,
    nuevo: false
  },
  {
    id: 6,
    nombre: 'Camisa Formal Blanca',
    precio: 125000,
    precioOriginal: null,
    imagen: 'https://images.unsplash.com/photo-1759893362613-8bb8bb057af1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVnYW50JTIwZmFzaGlvbiUyMGJvdXRpcXVlfGVufDF8fHx8MTc2MjQxMDkyOHww&ixlib=rb-4.1.0&q=80&w=1080',
    imagenes: [
      'https://images.unsplash.com/photo-1759893362613-8bb8bb057af1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVnYW50JTIwZmFzaGlvbiUyMGJvdXRpcXVlfGVufDF8fHx8MTc2MjQxMDkyOHww&ixlib=rb-4.1.0&q=80&w=1080',
      'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=1080&q=80'
    ],
    colores: ['Blanco', 'Celeste', 'Rosa Pálido'],
    materiales: ['Algodón'],
    categoria: 'mujer',
    subcategoria: 'Camisa',
    tipoProducto: 'Formal',
    tallas: ['S', 'M', 'L'],
    rating: 4.7,
    badge: null,
    nuevo: true
  },
  {
    id: 7,
    nombre: 'Falda Plisada Midi',
    precio: 135000,
    precioOriginal: 180000,
    imagen: 'https://images.unsplash.com/photo-1760287363707-851f4780b98c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21lbiUyMGRyZXNzJTIwYm91dGlxdWV8ZW58MXx8fHwxNzYyNTI3Njg1fDA&ixlib=rb-4.1.0&q=80&w=1080',
    imagenes: [
      'https://images.unsplash.com/photo-1760287363707-851f4780b98c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21lbiUyMGRyZXNzJTIwYm91dGlxdWV8ZW58MXx8fHwxNzYyNTI3Njg1fDA&ixlib=rb-4.1.0&q=80&w=1080',
      'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=1080&q=80'
    ],
    colores: ['Negro', 'Beige', 'Verde Oliva'],
    materiales: ['Poliéster'],
    categoria: 'sale',
    subcategoria: 'Falda',
    tipoProducto: 'Elegante',
    tallas: ['S', 'M', 'L'],
    rating: 4.8,
    badge: 'Sale',
    nuevo: false
  },
  {
    id: 8,
    nombre: 'Top Crop Elegante',
    precio: 95000,
    precioOriginal: null,
    imagen: 'https://images.unsplash.com/photo-1619384846683-8dede3452564?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwbW9kZWwlMjBlbGVnYW50fGVufDF8fHx8MTc2MjQ5MDM4NHww&ixlib=rb-4.1.0&q=80&w=1080',
    imagenes: [
      'https://images.unsplash.com/photo-1619384846683-8dede3452564?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwbW9kZWwlMjBlbGVnYW50fGVufDF8fHx8MTc2MjQ5MDM4NHww&ixlib=rb-4.1.0&q=80&w=1080',
      'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?w=1080&q=80'
    ],
    colores: ['Negro', 'Blanco', 'Rojo'],
    materiales: ['Algodón'],
    categoria: 'mujer',
    subcategoria: 'Top',
    tipoProducto: 'Deportivo',
    tallas: ['S', 'M', 'L'],
    rating: 4.4,
    badge: null,
    nuevo: true
  },

  // ACCESORIOS
  {
    id: 9,
    nombre: 'Bolso de Mano Luxury',
    precio: 280000,
    precioOriginal: null,
    imagen: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBiYWd8ZW58MXx8fHwxNzYyNTI3Njg1fDA&ixlib=rb-4.1.0&q=80&w=1080',
    imagenes: [
      'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBiYWd8ZW58MXx8fHwxNzYyNTI3Njg1fDA&ixlib=rb-4.1.0&q=80&w=1080',
      'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=1080&q=80',
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=1080&q=80'
    ],
    colores: ['Negro', 'Camel', 'Rojo'],
    materiales: ['Cuero'],
    categoria: 'accesorios',
    subcategoria: 'Bolso',
    tipoProducto: 'Elegante',
    tallas: ['Único'],
    rating: 4.9,
    badge: 'Bestseller',
    nuevo: false
  },
  {
    id: 10,
    nombre: 'Collar Dorado Premium',
    precio: 120000,
    precioOriginal: 160000,
    imagen: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnb2xkJTIwbmVja2xhY2V8ZW58MXx8fHwxNzYyNTI3Njg1fDA&ixlib=rb-4.1.0&q=80&w=1080',
    imagenes: [
      'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnb2xkJTIwbmVja2xhY2V8ZW58MXx8fHwxNzYyNTI3Njg1fDA&ixlib=rb-4.1.0&q=80&w=1080',
      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1080&q=80',
      'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=1080&q=80'
    ],
    colores: ['Dorado', 'Plateado', 'Oro Rosa'],
    materiales: ['Oro'],
    categoria: 'accesorios',
    subcategoria: 'Collar',
    tipoProducto: 'Elegante',
    tallas: ['Único'],
    rating: 4.7,
    badge: 'Sale',
    nuevo: false
  },
  {
    id: 11,
    nombre: 'Gafas de Sol Elite',
    precio: 185000,
    precioOriginal: null,
    imagen: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdW5nbGFzc2VzfGVufDF8fHx8MTc2MjUyNzY4NXww&ixlib=rb-4.1.0&q=80&w=1080',
    imagenes: [
      'https://images.unsplash.com/photo-1572635196237-14b3f281503f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdW5nbGFzc2VzfGVufDF8fHx8MTc2MjUyNzY4NXww&ixlib=rb-4.1.0&q=80&w=1080',
      'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=1080&q=80',
      'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=1080&q=80'
    ],
    colores: ['Negro', 'Tortuga', 'Transparente'],
    materiales: ['Acetato'],
    categoria: 'accesorios',
    subcategoria: 'Gafas',
    tipoProducto: 'Casual',
    tallas: ['Único'],
    rating: 4.8,
    badge: null,
    nuevo: true
  },
  {
    id: 12,
    nombre: 'Bufanda de Seda',
    precio: 95000,
    precioOriginal: null,
    imagen: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzaWxrJTIwc2NhcmZ8ZW58MXx8fHwxNzYyNTI3Njg1fDA&ixlib=rb-4.1.0&q=80&w=1080',
    imagenes: [
      'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzaWxrJTIwc2NhcmZ8ZW58MXx8fHwxNzYyNTI3Njg1fDA&ixlib=rb-4.1.0&q=80&w=1080',
      'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=1080&q=80'
    ],
    colores: ['Rosa', 'Azul', 'Crema'],
    materiales: ['Seda'],
    categoria: 'accesorios',
    subcategoria: 'Bufanda',
    tipoProducto: 'Elegante',
    tallas: ['Único'],
    rating: 4.6,
    badge: null,
    nuevo: false
  },
  {
    id: 13,
    nombre: 'Cinturón de Cuero',
    precio: 75000,
    precioOriginal: 95000,
    imagen: 'https://images.unsplash.com/photo-1624222247344-5448e4e2c18c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsZWF0aGVyJTIwYmVsdHxlbnwxfHx8fDE3NjI1Mjc2ODV8MA&ixlib=rb-4.1.0&q=80&w=1080',
    imagenes: [
      'https://images.unsplash.com/photo-1624222247344-5448e4e2c18c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsZWF0aGVyJTIwYmVsdHxlbnwxfHx8fDE3NjI1Mjc2ODV8MA&ixlib=rb-4.1.0&q=80&w=1080',
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1080&q=80'
    ],
    colores: ['Negro', 'Marrón', 'Camel'],
    materiales: ['Cuero'],
    categoria: 'accesorios',
    subcategoria: 'Cinturón',
    tipoProducto: 'Formal',
    tallas: ['S', 'M', 'L'],
    rating: 4.5,
    badge: 'Sale',
    nuevo: false
  },
  {
    id: 14,
    nombre: 'Aretes Minimalistas',
    precio: 65000,
    precioOriginal: null,
    imagen: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlYXJyaW5nc3xlbnwxfHx8fDE3NjI1Mjc2ODV8MA&ixlib=rb-4.1.0&q=80&w=1080',
    imagenes: [
      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlYXJyaW5nc3xlbnwxfHx8fDE3NjI1Mjc2ODV8MA&ixlib=rb-4.1.0&q=80&w=1080',
      'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=1080&q=80',
      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1080&q=80'
    ],
    colores: ['Dorado', 'Plateado', 'Oro Rosa'],
    materiales: ['Acero'],
    categoria: 'accesorios',
    subcategoria: 'Aretes',
    tipoProducto: 'Elegante',
    tallas: ['Único'],
    rating: 4.7,
    badge: null,
    nuevo: true
  }
];
