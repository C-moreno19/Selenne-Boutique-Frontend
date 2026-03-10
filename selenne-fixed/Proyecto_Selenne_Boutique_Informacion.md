# Información del Proyecto: Selenne Boutique Authentication UI

**Proyecto**: Selenne Boutique Authentication UI (Community)  
**Versión**: 1.0  
**Fecha**: 5 de marzo de 2026  
**Descripción**: Aplicación web de e-commerce para una boutique de moda llamada Selenne. Incluye sistema de autenticación, gestión de productos, carrito de compras, pedidos, notificaciones y panel de administración. El frontend está desarrollado en React/Vite, y el backend en ASP.NET Core 8 con SQL Server.

---

## 📋 Información General del Proyecto

### Objetivo
Crear una plataforma completa de e-commerce para Selenne Boutique que permita a los usuarios navegar productos, realizar compras en línea, gestionar cuentas y a los administradores gestionar inventario, pedidos y usuarios.

### Tecnologías
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Shadcn/UI
- **Backend**: ASP.NET Core 8, Entity Framework Core, SQL Server
- **Base de Datos**: SQL Server LocalDB con 32 tablas predefinidas
- **Autenticación**: JWT + Refresh Tokens
- **Notificaciones**: Sistema integrado con emails SMTP
- **Permisos**: Sistema granular con 35+ permisos

### Roles de Usuario
- **Cliente**: Navegar productos, agregar al carrito, realizar pedidos, ver historial
- **Empleado**: Gestionar productos, ventas, clientes, inventario
- **Administrador**: Todos los permisos, incluyendo configuración del sistema

---

## 🗺️ Mapa de Procesos

### Procesos Principales

#### 1. Proceso de Registro y Autenticación
- **Inicio**: Usuario llega a la página de registro/login
- **Registro**: Usuario ingresa datos (nombre, email, contraseña, teléfono)
- **Validación**: Sistema valida datos y crea cuenta
- **Verificación**: Envío de email de verificación
- **Login**: Usuario ingresa credenciales
- **Autenticación**: Generación de JWT y refresh token
- **Fin**: Usuario accede al sistema

#### 2. Proceso de Compra
- **Inicio**: Usuario navega catálogo de productos
- **Selección**: Usuario agrega productos al carrito
- **Carrito**: Revisión y modificación de items
- **Checkout**: Ingreso de datos de envío y pago
- **Confirmación**: Creación del pedido en BD
- **Notificación**: Email al cliente y notificación al admin
- **Procesamiento**: Admin procesa el pedido
- **Envío**: Actualización de estado y envío
- **Fin**: Entrega y confirmación

#### 3. Gestión de Productos (Admin)
- **Inicio**: Admin accede al panel de productos
- **Creación**: Ingreso de datos del producto
- **Validación**: Verificación de stock y precios
- **Almacenamiento**: Guardado en BD con imágenes
- **Publicación**: Producto disponible en catálogo
- **Fin**: Producto visible para clientes

#### 4. Gestión de Pedidos
- **Inicio**: Cliente crea pedido
- **Revisión**: Admin revisa pedido
- **Aprobación**: Cambio de estado a "Aprobado"
- **Preparación**: Empaque del pedido
- **Envío**: Asignación de guía y transportadora
- **Entrega**: Actualización a "Entregado"
- **Fin**: Pedido completado

#### 5. Sistema de Notificaciones
- **Trigger**: Evento (registro, pedido, cambio de estado)
- **Generación**: Creación de notificación en BD
- **Envío**: Email automático vía SMTP
- **Almacenamiento**: Historial de notificaciones
- **Fin**: Usuario recibe notificación

---

## 🎨 Facilitación Gráfica

### Diagramas Recomendados

#### Diagrama de Flujo de Usuario
```
[Usuario] → [Página Principal] → [Catálogo] → [Producto Detalle] → [Agregar Carrito] → [Checkout] → [Confirmación]
                    ↓
              [Login/Registro] → [Perfil] → [Historial Pedidos]
```

#### Diagrama de Arquitectura
```
[Frontend React] ←→ [API ASP.NET Core] ←→ [SQL Server BD]
       ↓                    ↓                    ↓
   [Vite + TS]        [JWT Auth]          [32 Tablas]
   [Shadcn/UI]        [Swagger]           [Entity Framework]
   [Tailwind]         [SMTP Email]        [LocalDB]
```

#### Diagrama de Permisos
```
[Admin] → Todos los módulos
    ↓
[Empleado] → Productos, Ventas, Clientes, Inventario, Tienda
    ↓
[Cliente] → Tienda (ver, comprar, carrito, pedidos, ofertas)
```

### Elementos Visuales
- **Colores**: Paleta de moda (negro, blanco, tonos pastel)
- **Tipografía**: Sans-serif moderna para elegancia
- **Iconos**: Minimalistas, relacionados con moda y compras
- **Layout**: Responsive, mobile-first

---

## 📖 Story Mapping

### Épicas Principales

#### Épica 1: Autenticación y Gestión de Usuarios
**Como** usuario del sistema  
**Quiero** poder registrarme y acceder a mi cuenta  
**Para** tener una experiencia personalizada

##### Historias:
- **HU1**: Registrarme con email, nombre y contraseña
- **HU2**: Verificar mi email mediante enlace
- **HU3**: Iniciar sesión con credenciales
- **HU4**: Recibir notificación de bienvenida
- **HU5**: Restablecer mi contraseña olvidada
- **HU6**: Ver y editar mi perfil
- **HU7**: Cerrar sesión de forma segura

#### Épica 2: Catálogo de Productos
**Como** cliente  
**Quiero** explorar productos de moda  
**Para** encontrar prendas que me gusten

##### Historias:
- **HU8**: Ver lista de productos con filtros
- **HU9**: Ver detalles de un producto específico
- **HU10**: Ver imágenes de productos en galería
- **HU11**: Filtrar por categoría, marca, talla, color
- **HU12**: Buscar productos por nombre
- **HU13**: Ver productos destacados/ofertas

#### Épica 3: Carrito y Compra
**Como** cliente  
**Quiero** comprar productos fácilmente  
**Para** adquirir prendas de moda

##### Historias:
- **HU14**: Agregar productos al carrito
- **HU15**: Ver contenido del carrito
- **HU16**: Modificar cantidades en carrito
- **HU17**: Eliminar items del carrito
- **HU18**: Proceder al checkout
- **HU19**: Ingresar datos de envío
- **HU20**: Seleccionar método de pago
- **HU21**: Confirmar pedido
- **HU22**: Recibir confirmación por email

#### Épica 4: Gestión de Pedidos
**Como** cliente/administrador  
**Quiero** rastrear mis pedidos  
**Para** saber el estado de mis compras

##### Historias:
- **HU23**: Ver historial de pedidos
- **HU24**: Ver detalles de un pedido específico
- **HU25**: Rastrear estado del envío
- **HU26**: Cancelar pedido (si permitido)
- **HU27**: Recibir notificaciones de cambios de estado
- **HU28**: Administrar pedidos (solo admin)

#### Épica 5: Panel de Administración
**Como** administrador  
**Quiero** gestionar el sistema  
**Para** mantener la tienda funcionando

##### Historias:
- **HU29**: Gestionar productos (CRUD)
- **HU30**: Gestionar usuarios y roles
- **HU31**: Ver reportes de ventas
- **HU32**: Gestionar inventario
- **HU33**: Configurar sistema
- **HU34**: Ver logs de auditoría

#### Épica 6: Notificaciones y Comunicación
**Como** usuario del sistema  
**Quiero** recibir información relevante  
**Para** estar al día con mi cuenta y pedidos

##### Historias:
- **HU35**: Recibir notificaciones push
- **HU36**: Ver historial de notificaciones
- **HU37**: Marcar notificaciones como leídas
- **HU38**: Recibir emails automáticos

---

## 🎯 Wireframes (Balsamiq)

### Pantallas Principales

#### 1. Página de Inicio (Home)
- **Header**: Logo Selenne, menú navegación (Inicio, Productos, Carrito, Perfil), botón login
- **Hero Banner**: Imagen principal con texto "Bienvenido a Selenne Boutique"
- **Productos Destacados**: Grid de 6 productos con imagen, nombre, precio
- **Footer**: Enlaces a redes sociales, contacto, términos

#### 2. Página de Login
- **Formulario**: Campos email y contraseña
- **Botones**: "Iniciar Sesión", "Registrarse", "Olvidé contraseña"
- **Enlaces**: Términos y condiciones
- **Layout**: Centrado, minimalista

#### 3. Página de Registro
- **Formulario**: Nombre completo, email, teléfono, contraseña, confirmar contraseña
- **Checkbox**: Aceptar términos
- **Botón**: "Crear Cuenta"
- **Enlace**: "¿Ya tienes cuenta? Inicia sesión"

#### 4. Catálogo de Productos
- **Sidebar**: Filtros (categoría, marca, precio, talla, color)
- **Grid Principal**: Productos con imagen thumbnail, nombre, precio, botón "Ver Detalles"
- **Paginación**: Números de página
- **Header**: Barra de búsqueda

#### 5. Detalle de Producto
- **Imagen Principal**: Carrusel de imágenes del producto
- **Información**: Nombre, descripción, precio, tallas disponibles, colores
- **Botones**: "Agregar al Carrito", "Favoritos"
- **Sección**: Valoraciones y comentarios

#### 6. Carrito de Compras
- **Lista de Items**: Imagen, nombre, precio, cantidad, subtotal
- **Resumen**: Subtotal, envío, total
- **Botones**: "Continuar Comprando", "Proceder al Pago"

#### 7. Checkout
- **Paso 1**: Datos de envío (nombre, dirección, ciudad, teléfono)
- **Paso 2**: Método de pago (contraentrega, transferencia)
- **Paso 3**: Revisión del pedido
- **Botón**: "Confirmar Pedido"

#### 8. Perfil de Usuario
- **Tabs**: Información personal, pedidos, favoritos, direcciones
- **Formulario**: Editar datos personales
- **Lista**: Historial de pedidos con estados

#### 9. Panel Admin - Dashboard
- **Estadísticas**: Cards con total ventas, pedidos pendientes, productos activos
- **Gráficos**: Ventas por mes, productos más vendidos
- **Menú Lateral**: Navegación a módulos (productos, usuarios, pedidos, etc.)

#### 10. Panel Admin - Gestión de Productos
- **Tabla**: Lista de productos con acciones (editar, eliminar)
- **Botón**: "Agregar Producto"
- **Filtros**: Buscar por nombre, categoría

### Elementos Comunes en Wireframes
- **Navegación**: Header consistente en todas las páginas
- **Responsive**: Diseño adaptable a móvil y desktop
- **Estados**: Loading, error, success para interacciones
- **Accesibilidad**: Labels claros, contraste adecuado

---

## 📝 Notas Adicionales

### Requisitos Funcionales
- Sistema debe ser responsive (móvil, tablet, desktop)
- Autenticación segura con JWT
- Notificaciones en tiempo real (opcional para futuras versiones)
- Integración con pasarelas de pago (futuro)
- Sistema de reseñas y valoraciones

### Requisitos No Funcionales
- Rendimiento: Carga de página < 3 segundos
- Seguridad: Encriptación de contraseñas, validación de inputs
- Usabilidad: Flujo intuitivo de compra
- Escalabilidad: Arquitectura preparada para crecimiento

### Próximos Pasos
1. Crear wireframes detallados en Balsamiq usando esta información
2. Desarrollar story mapping con el equipo
3. Crear diagramas de proceso para documentación
4. Implementar prototipos interactivos

---

**Fin del Documento**  
*Generado automáticamente para facilitar la creación de mapas de procesos, facilitación gráfica, story mapping y wireframes.*