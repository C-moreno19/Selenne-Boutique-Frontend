# 🚀 PROMPT PARA GENERAR API + BD COMPLETA - SELENNE BOUTIQUE

**Propósito**: Generar Backend ASP.NET Core 8 COMPLETAMENTE FUNCIONAL  
**Versión**: 1.0  
**Fecha**: 3 Marzo 2026  

---

## 📌 INSTRUCCIONES DE USO

### PASO 1: Copia TODO este archivo (hasta el final)

### PASO 2: Pega en Claude (claude.ai) o ChatGPT

### PASO 3: Agrega esta instrucción final:

```
Genera un proyecto ASP.NET Core 8 llamado "SelenneApi" que sea:
✅ 100% FUNCIONAL
✅ LISTO PARA EJECUTAR (dotnet run)
✅ SIN ERRORES DE COMPILACIÓN
✅ CON BD SQL SERVER INTEGRADA
✅ CON SWAGGER FUNCIONANDO

IMPORTANTE - GENERAR ARCHIVOS COMPLETOS:
- Genera TODOS los archivos .cs (NO parciales, NO con "..." o comentarios omitidos)
- CADA archivo debe estar COMPLETAMENTE escrito
- CADA controlador debe tener TODOS los métodos implementados
- CADA servicio debe tener TODOS los métodos implementados
- CADA DTO debe tener TODAS las propiedades
- NO abrevies, NO omitas código

ESTRUCTURA ESPERADA (todos estos archivos COMPLETOS):

Program.cs - Configuración completa
appsettings.json - Con todas las secciones
AppDbContext.cs - Con los 32 DbSet
Entities/ - 32 archivos de entidades completos (Usuario.cs, Producto.cs, etc.)
DTOs/ - Todos los DTO necesarios
Controllers/ - 8+ controladores completos
Services/ - 10+ servicios completos
Repositories/ - Patrones de repositorio completos
Middleware/ - Error handling y validaciones
```

### PASO 4: Espera a que termine (5-10 minutos)

### PASO 5: Copia todoslos archivos a carpeta `Backend/SelenneApi/`

---

---

# 📋 ESPECIFICACIÓN TÉCNICA COMPLETA

## ⚠️ REQUISITO CRÍTICO: ARCHIVOS COMPLETOS

**TODOS los archivos .cs deben ser COMPLETAMENTE implementados:**
- ✅ NO código parcial
- ✅ NO líneas con "..." para omitir
- ✅ NO comentarios como "// resto del código aquí"
- ✅ TODOS los métodos implementados totalmente
- ✅ TODAS las propiedades con sus atributos [Required], [MaxLength], etc.
- ✅ TODA la lógica de validación y error handling
- ✅ TODOS los servicios con métodos async completos

Ejemplo INCORRECTO ❌:
```csharp
public class ProductoController : ControllerBase
{
    private readonly IProductoService _service;
    
    // ... resto de métodos aquí
}
```

Ejemplo CORRECTO ✅:
```csharp
public class ProductoController : ControllerBase
{
    private readonly IProductoService _service;
    public ProductoController(IProductoService service) => _service = service;
    
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProductoDto>>> GetAll() { /* implementación completa */ }
    
    [HttpPost]
    public async Task<ActionResult<ProductoDto>> Create([FromBody] CreateProductoDto dto) { /* implementación completa */ }
    
    // ... TODOS los métodos completamente implementados
}
```

---

## 🎯 OBJETIVO

Backend REST API para e-commerce de moda (Selenne Boutique):
- Gestión de productos, usuarios, pedidos
- Sistema de permisos granular (35+ permisos)
- Autenticación JWT + Refresh Tokens
- Notificaciones automáticas
- Integración con BD SQL Server

---

## 🔐 SISTEMA DE PERMISOS

### Módulos y Permisos

```
1. PRODUCTOS (5 permisos)
   - productos:ver
   - productos:crear
   - productos:editar
   - productos:eliminar
   - productos:descuento

2. VENTAS (6 permisos)
   - ventas:ver
   - ventas:crear
   - ventas:editar
   - ventas:eliminar
   - ventas:devoluciones
   - ventas:reportes

3. CLIENTES (6 permisos)
   - clientes:ver
   - clientes:crear
   - clientes:editar
   - clientes:eliminar
   - clientes:bloquear
   - clientes:historial

4. INVENTARIO (5 permisos)
   - inventario:ver
   - inventario:actualizar
   - inventario:ajustes
   - inventario:alertas
   - inventario:reportes

5. USUARIOS (6 permisos)
   - usuarios:ver
   - usuarios:crear
   - usuarios:editar
   - usuarios:eliminar
   - usuarios:bloquear
   - usuarios:resetear_pass

6. ROLES (6 permisos)
   - roles:ver
   - roles:crear
   - roles:editar
   - roles:eliminar
   - roles:permisos
   - roles:asignar

7. REPORTES (6 permisos)
   - reportes:ventas
   - reportes:inventario
   - reportes:clientes
   - reportes:financiero
   - reportes:descargar
   - reportes:customizar

8. NOTIFICACIONES (4 permisos)
   - notif:ver
   - notif:enviar
   - notif:templates
   - notif:historial

9. CONFIGURACIÓN (6 permisos)
   - config:sistema
   - config:empresa
   - config:email
   - config:integraciones
   - config:auditoría
   - config:backup

10. TIENDA (5 permisos)
    - tienda:ver
    - tienda:comprar
    - tienda:carrito
    - tienda:pedidos
    - tienda:ofertas
```

### Roles Predefinidos

**ADMINISTRADOR**: Todos los permisos  
**EMPLEADO**: Productos, Ventas, Clientes, Inventario, Tienda  
**CLIENTE**: Solo tienda:* y ver propias notificaciones  

---

## � SCHEMA SQL COMPLETO (usa este para generar Entity Models)

Copia TODO este SQL directamente a SQL Server LocalDB ANTES de ejecutar el backend:

```sql

### 🔐 AUTENTICACIÓN Y SEGURIDAD

#### Tabla: Roles
```sql
CREATE TABLE Roles (
    RoleID INT PRIMARY KEY IDENTITY(1,1),
    Nombre NVARCHAR(50) NOT NULL UNIQUE,
    Descripcion NVARCHAR(255),
    Estado NVARCHAR(20) DEFAULT 'activo',
    CONSTRAINT CK_Roles_Estado CHECK (Estado IN ('activo','inactivo'))
);
```

#### Tabla: Permissions
```sql
CREATE TABLE Permissions (
    PermissionID INT PRIMARY KEY IDENTITY(1,1),
    Nombre NVARCHAR(100) NOT NULL UNIQUE,
    Descripcion NVARCHAR(255),
    Estado NVARCHAR(20) DEFAULT 'activo',
    CONSTRAINT CK_Permissions_Estado CHECK (Estado IN ('activo','inactivo'))
);
```

#### Tabla: RolePermissions
```sql
CREATE TABLE RolePermissions (
    RolePermissionID INT PRIMARY KEY IDENTITY(1,1),
    RoleID INT NOT NULL,
    PermissionID INT NOT NULL,
    CONSTRAINT FK_RolePermissions_Roles FOREIGN KEY (RoleID) REFERENCES Roles(RoleID) ON DELETE CASCADE,
    CONSTRAINT FK_RolePermissions_Permissions FOREIGN KEY (PermissionID) REFERENCES Permissions(PermissionID) ON DELETE CASCADE,
    CONSTRAINT UQ_RolePermissions UNIQUE (RoleID, PermissionID)
);
```

#### Tabla: Usuarios
```sql
CREATE TABLE Usuarios (
    UsuarioID INT PRIMARY KEY IDENTITY(1,1),
    NombreCompleto NVARCHAR(100) NOT NULL,
    Email NVARCHAR(100) NOT NULL UNIQUE,
    Telefono NVARCHAR(20),
    Documento NVARCHAR(20),
    Direccion NVARCHAR(255),
    PasswordHash NVARCHAR(255) NOT NULL,
    RoleID INT,
    Estado NVARCHAR(20) DEFAULT 'activo',
    EmailVerificado BIT DEFAULT 0,
    FechaRegistro DATETIME DEFAULT GETDATE(),
    FechaUltimoLogin DATETIME,
    CONSTRAINT CK_Usuarios_Estado CHECK (Estado IN ('activo','inactivo')),
    CONSTRAINT FK_Usuarios_Roles FOREIGN KEY (RoleID) REFERENCES Roles(RoleID) ON DELETE SET NULL
);
```

#### Tabla: RefreshTokens
```sql
CREATE TABLE RefreshTokens (
    RefreshTokenID INT PRIMARY KEY IDENTITY(1,1),
    UsuarioID INT NOT NULL,
    Token NVARCHAR(500) NOT NULL UNIQUE,
    ExpiresAt DATETIME NOT NULL,
    Revoked BIT DEFAULT 0,
    CreatedAt DATETIME DEFAULT GETDATE(),
    RevokedAt DATETIME,
    IPAddress NVARCHAR(50),
    CONSTRAINT FK_RefreshTokens_Usuarios FOREIGN KEY (UsuarioID) REFERENCES Usuarios(UsuarioID) ON DELETE CASCADE
);
```

#### Tabla: EmailVerifications
```sql
CREATE TABLE EmailVerifications (
    VerificationID INT PRIMARY KEY IDENTITY(1,1),
    UsuarioID INT NOT NULL,
    Token NVARCHAR(500) NOT NULL UNIQUE,
    ExpiresAt DATETIME NOT NULL,
    Verified BIT DEFAULT 0,
    VerifiedAt DATETIME,
    CreatedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_EmailVerifications_Usuarios FOREIGN KEY (UsuarioID) REFERENCES Usuarios(UsuarioID) ON DELETE CASCADE
);
```

#### Tabla: PasswordResetTokens
```sql
CREATE TABLE PasswordResetTokens (
    ResetTokenID INT PRIMARY KEY IDENTITY(1,1),
    UsuarioID INT NOT NULL,
    Token NVARCHAR(500) NOT NULL UNIQUE,
    ExpiresAt DATETIME NOT NULL,
    Used BIT DEFAULT 0,
    UsedAt DATETIME,
    CreatedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_PasswordResetTokens_Usuarios FOREIGN KEY (UsuarioID) REFERENCES Usuarios(UsuarioID) ON DELETE CASCADE
);
```

#### Tabla: UserSessions
```sql
CREATE TABLE UserSessions (
    SessionID INT PRIMARY KEY IDENTITY(1,1),
    UsuarioID INT NOT NULL,
    RefreshTokenID INT,
    UserAgent NVARCHAR(500),
    IPAddress NVARCHAR(50),
    CreatedAt DATETIME DEFAULT GETDATE(),
    LastSeenAt DATETIME DEFAULT GETDATE(),
    Revoked BIT DEFAULT 0,
    CONSTRAINT FK_UserSessions_Usuarios FOREIGN KEY (UsuarioID) REFERENCES Usuarios(UsuarioID) ON DELETE CASCADE,
    CONSTRAINT FK_UserSessions_RefreshTokens FOREIGN KEY (RefreshTokenID) REFERENCES RefreshTokens(RefreshTokenID) ON DELETE SET NULL
);
```

#### Tabla: LoginAttempts
```sql
CREATE TABLE LoginAttempts (
    AttemptID INT PRIMARY KEY IDENTITY(1,1),
    UsuarioID INT,
    Email NVARCHAR(100),
    AttemptAt DATETIME DEFAULT GETDATE(),
    Successful BIT DEFAULT 0,
    IPAddress NVARCHAR(50),
    CONSTRAINT FK_LoginAttempts_Usuarios FOREIGN KEY (UsuarioID) REFERENCES Usuarios(UsuarioID) ON DELETE SET NULL
);
```

### 🏪 CATÁLOGO DE PRODUCTOS

#### Tabla: CategoriasPrincipales
```sql
CREATE TABLE CategoriasPrincipales (
    CategoriaPrincipalID INT PRIMARY KEY IDENTITY(1,1),
    Nombre NVARCHAR(100) NOT NULL UNIQUE,
    Descripcion NVARCHAR(500),
    Imagen NVARCHAR(500),
    Estado NVARCHAR(20) DEFAULT 'activo',
    CONSTRAINT CK_Categorias_Estado CHECK (Estado IN ('activo','inactivo'))
);
```

#### Tabla: TiposProducto
```sql
CREATE TABLE TiposProducto (
    TipoProductoID INT PRIMARY KEY IDENTITY(1,1),
    Nombre NVARCHAR(100) NOT NULL UNIQUE,
    Descripcion NVARCHAR(500),
    Estado NVARCHAR(20) DEFAULT 'activo',
    CONSTRAINT CK_TiposProducto_Estado CHECK (Estado IN ('activo','inactivo'))
);
```

#### Tabla: Marcas
```sql
CREATE TABLE Marcas (
    MarcaID INT PRIMARY KEY IDENTITY(1,1),
    Nombre NVARCHAR(100) NOT NULL UNIQUE,
    Logo NVARCHAR(500),
    SitioWeb NVARCHAR(200),
    Estado NVARCHAR(20) DEFAULT 'activo',
    CONSTRAINT CK_Marcas_Estado CHECK (Estado IN ('activo','inactivo'))
);
```

#### Tabla: Tallas
```sql
CREATE TABLE Tallas (
    TallaID INT PRIMARY KEY IDENTITY(1,1),
    Nombre NVARCHAR(10) NOT NULL UNIQUE,
    Orden INT DEFAULT 0
);
```

#### Tabla: Colores
```sql
CREATE TABLE Colores (
    ColorID INT PRIMARY KEY IDENTITY(1,1),
    Nombre NVARCHAR(50) NOT NULL UNIQUE,
    CodigoHex NVARCHAR(7),
    Estado NVARCHAR(20) DEFAULT 'activo',
    CONSTRAINT CK_Colores_Estado CHECK (Estado IN ('activo','inactivo'))
);
```

#### Tabla: Materiales
```sql
CREATE TABLE Materiales (
    MaterialID INT PRIMARY KEY IDENTITY(1,1),
    Nombre NVARCHAR(100) NOT NULL UNIQUE,
    Descripcion NVARCHAR(500),
    Estado NVARCHAR(20) DEFAULT 'activo',
    CONSTRAINT CK_Materiales_Estado CHECK (Estado IN ('activo','inactivo'))
);
```

#### Tabla: Productos
```sql
CREATE TABLE Productos (
    ProductoID INT PRIMARY KEY IDENTITY(1,1),
    Codigo NVARCHAR(50) NOT NULL UNIQUE,
    Nombre NVARCHAR(200) NOT NULL,
    Descripcion NVARCHAR(MAX),
    DescripcionCorta NVARCHAR(500),
    CategoriaPrincipalID INT NOT NULL,
    TipoProductoID INT NOT NULL,
    MarcaID INT NOT NULL,
    PrecioCompra DECIMAL(18,2),
    PrecioVenta DECIMAL(18,2) NOT NULL,
    PrecioOferta DECIMAL(18,2),
    Stock INT DEFAULT 0,
    ImagenPrincipal NVARCHAR(500),
    Estado NVARCHAR(20) DEFAULT 'activo',
    FechaCreacion DATETIME DEFAULT GETDATE(),
    FechaActualizacion DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_Productos_Categoria FOREIGN KEY (CategoriaPrincipalID) REFERENCES CategoriasPrincipales(CategoriaPrincipalID),
    CONSTRAINT FK_Productos_Tipo FOREIGN KEY (TipoProductoID) REFERENCES TiposProducto(TipoProductoID),
    CONSTRAINT FK_Productos_Marca FOREIGN KEY (MarcaID) REFERENCES Marcas(MarcaID),
    CONSTRAINT CK_Productos_Precios CHECK (PrecioVenta > 0),
    CONSTRAINT CK_Productos_Estado CHECK (Estado IN ('activo','inactivo'))
);
```

#### Tabla: ProductoImagenes
```sql
CREATE TABLE ProductoImagenes (
    ProductoImagenID INT PRIMARY KEY IDENTITY(1,1),
    ProductoID INT NOT NULL,
    URL NVARCHAR(500) NOT NULL,
    Orden INT DEFAULT 0,
    CONSTRAINT FK_ProductoImagenes_Productos FOREIGN KEY (ProductoID) REFERENCES Productos(ProductoID) ON DELETE CASCADE
);
```

#### Tabla: ProductoTallas
```sql
CREATE TABLE ProductoTallas (
    ProductoTallaID INT PRIMARY KEY IDENTITY(1,1),
    ProductoID INT NOT NULL,
    TallaID INT NOT NULL,
    StockTalla INT DEFAULT 0,
    CONSTRAINT FK_ProductoTallas_Productos FOREIGN KEY (ProductoID) REFERENCES Productos(ProductoID) ON DELETE CASCADE,
    CONSTRAINT FK_ProductoTallas_Tallas FOREIGN KEY (TallaID) REFERENCES Tallas(TallaID),
    CONSTRAINT UQ_ProductoTallas UNIQUE (ProductoID, TallaID)
);
```

#### Tabla: ProductoColores
```sql
CREATE TABLE ProductoColores (
    ProductoColorID INT PRIMARY KEY IDENTITY(1,1),
    ProductoID INT NOT NULL,
    ColorID INT NOT NULL,
    CONSTRAINT FK_ProductoColores_Productos FOREIGN KEY (ProductoID) REFERENCES Productos(ProductoID) ON DELETE CASCADE,
    CONSTRAINT FK_ProductoColores_Colores FOREIGN KEY (ColorID) REFERENCES Colores(ColorID),
    CONSTRAINT UQ_ProductoColores UNIQUE (ProductoID, ColorID)
);
```

#### Tabla: ProductoMateriales
```sql
CREATE TABLE ProductoMateriales (
    ProductoMaterialID INT PRIMARY KEY IDENTITY(1,1),
    ProductoID INT NOT NULL,
    MaterialID INT NOT NULL,
    Porcentaje DECIMAL(5,2),
    CONSTRAINT FK_ProductoMateriales_Productos FOREIGN KEY (ProductoID) REFERENCES Productos(ProductoID) ON DELETE CASCADE,
    CONSTRAINT FK_ProductoMateriales_Materiales FOREIGN KEY (MaterialID) REFERENCES Materiales(MaterialID),
    CONSTRAINT UQ_ProductoMateriales UNIQUE (ProductoID, MaterialID)
);
```

### 🛒 CARRITO Y PEDIDOS

#### Tabla: Carrito
```sql
CREATE TABLE Carrito (
    CarritoID INT PRIMARY KEY IDENTITY(1,1),
    UsuarioID INT NOT NULL,
    ProductoID INT NOT NULL,
    Cantidad INT NOT NULL DEFAULT 1,
    TallaSeleccionada NVARCHAR(10),
    ColorSeleccionado NVARCHAR(50),
    FechaAgregado DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_Carrito_Usuarios FOREIGN KEY (UsuarioID) REFERENCES Usuarios(UsuarioID) ON DELETE CASCADE,
    CONSTRAINT FK_Carrito_Productos FOREIGN KEY (ProductoID) REFERENCES Productos(ProductoID),
    CONSTRAINT CK_Carrito_Cantidad CHECK (Cantidad > 0)
);
```

#### Tabla: Pedidos
```sql
CREATE TABLE Pedidos (
    PedidoID INT PRIMARY KEY IDENTITY(1,1),
    ClienteID INT NOT NULL,
    FechaPedido DATETIME DEFAULT GETDATE(),
    NombreCliente NVARCHAR(100) NOT NULL,
    DocumentoCliente NVARCHAR(20),
    EmailCliente NVARCHAR(100) NOT NULL,
    TelefonoCliente NVARCHAR(20) NOT NULL,
    DireccionEnvio NVARCHAR(255) NOT NULL,
    Ciudad NVARCHAR(100) NOT NULL,
    CodigoPostal NVARCHAR(10),
    MetodoPago NVARCHAR(50) NOT NULL,
    NumeroCuenta NVARCHAR(50),
    NombreTitular NVARCHAR(100),
    Banco NVARCHAR(100),
    TipoCuenta NVARCHAR(50),
    Subtotal DECIMAL(18,2) NOT NULL,
    Descuento DECIMAL(18,2) DEFAULT 0,
    Envio DECIMAL(18,2) DEFAULT 0,
    Total DECIMAL(18,2) NOT NULL,
    Estado NVARCHAR(20) DEFAULT 'Pendiente',
    NumeroGuia NVARCHAR(50),
    Transportadora NVARCHAR(100),
    FechaEnvio DATETIME,
    FechaEntrega DATETIME,
    Notas NVARCHAR(MAX),
    FechaActualizacion DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_Pedidos_Clientes FOREIGN KEY (ClienteID) REFERENCES Usuarios(UsuarioID),
    CONSTRAINT CK_Pedidos_Estado CHECK (Estado IN ('Pendiente', 'Aprobada', 'En proceso', 'Enviado', 'Entregado', 'Cancelado', 'Rechazada', 'Completada')),
    CONSTRAINT CK_Pedidos_MetodoPago CHECK (MetodoPago IN ('contraentrega', 'transferencia', 'tarjeta'))
);
```

#### Tabla: PedidoDetalles
```sql
CREATE TABLE PedidoDetalles (
    PedidoDetalleID INT PRIMARY KEY IDENTITY(1,1),
    PedidoID INT NOT NULL,
    ProductoID INT NOT NULL,
    TallaID INT,
    ColorID INT,
    Cantidad INT NOT NULL,
    PrecioUnitario DECIMAL(18,2) NOT NULL,
    Subtotal DECIMAL(18,2) NOT NULL,
    CONSTRAINT FK_PedidoDetalles_Pedidos FOREIGN KEY (PedidoID) REFERENCES Pedidos(PedidoID) ON DELETE CASCADE,
    CONSTRAINT FK_PedidoDetalles_Productos FOREIGN KEY (ProductoID) REFERENCES Productos(ProductoID),
    CONSTRAINT FK_PedidoDetalles_Tallas FOREIGN KEY (TallaID) REFERENCES Tallas(TallaID),
    CONSTRAINT FK_PedidoDetalles_Colores FOREIGN KEY (ColorID) REFERENCES Colores(ColorID),
    CONSTRAINT CK_PedidoDetalles_Cantidad CHECK (Cantidad > 0)
);
```

#### Tabla: Ventas
```sql
CREATE TABLE Ventas (
    VentaID INT PRIMARY KEY IDENTITY(1,1),
    UsuarioID INT,
    ClienteID INT,
    FechaVenta DATETIME DEFAULT GETDATE(),
    Subtotal DECIMAL(18,2) NOT NULL,
    Descuento DECIMAL(18,2) DEFAULT 0,
    Envio DECIMAL(18,2) DEFAULT 0,
    Total DECIMAL(18,2) NOT NULL,
    Estado NVARCHAR(20) DEFAULT 'Pendiente',
    MetodoPago NVARCHAR(50),
    Notas NVARCHAR(MAX),
    CONSTRAINT FK_Ventas_Usuarios FOREIGN KEY (UsuarioID) REFERENCES Usuarios(UsuarioID),
    CONSTRAINT FK_Ventas_Clientes FOREIGN KEY (ClienteID) REFERENCES Usuarios(UsuarioID),
    CONSTRAINT CK_Ventas_Estado CHECK (Estado IN ('Pendiente', 'Completada', 'Cancelada', 'En proceso', 'Enviado', 'Entregado'))
);
```

#### Tabla: VentaDetalles
```sql
CREATE TABLE VentaDetalles (
    VentaDetalleID INT PRIMARY KEY IDENTITY(1,1),
    VentaID INT NOT NULL,
    ProductoID INT NOT NULL,
    TallaID INT,
    ColorID INT,
    Cantidad INT NOT NULL,
    PrecioUnitario DECIMAL(18,2) NOT NULL,
    Subtotal DECIMAL(18,2) NOT NULL,
    CONSTRAINT FK_VentaDetalles_Ventas FOREIGN KEY (VentaID) REFERENCES Ventas(VentaID) ON DELETE CASCADE,
    CONSTRAINT FK_VentaDetalles_Productos FOREIGN KEY (ProductoID) REFERENCES Productos(ProductoID),
    CONSTRAINT FK_VentaDetalles_Tallas FOREIGN KEY (TallaID) REFERENCES Tallas(TallaID),
    CONSTRAINT FK_VentaDetalles_Colores FOREIGN KEY (ColorID) REFERENCES Colores(ColorID),
    CONSTRAINT CK_VentaDetalles_Cantidad CHECK (Cantidad > 0)
);
```

### 👤 USUARIO (Favoritos, Valoraciones)

#### Tabla: Favoritos
```sql
CREATE TABLE Favoritos (
    FavoritoID INT PRIMARY KEY IDENTITY(1,1),
    UsuarioID INT NOT NULL,
    ProductoID INT NOT NULL,
    Nota NVARCHAR(500),
    FechaAgregado DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_Favoritos_Usuarios FOREIGN KEY (UsuarioID) REFERENCES Usuarios(UsuarioID) ON DELETE CASCADE,
    CONSTRAINT FK_Favoritos_Productos FOREIGN KEY (ProductoID) REFERENCES Productos(ProductoID) ON DELETE CASCADE,
    CONSTRAINT UQ_Favoritos UNIQUE (UsuarioID, ProductoID)
);
```

#### Tabla: Valoraciones
```sql
CREATE TABLE Valoraciones (
    ValoracionID INT PRIMARY KEY IDENTITY(1,1),
    ProductoID INT NOT NULL,
    UsuarioID INT NOT NULL,
    PedidoID INT,
    Puntuacion INT NOT NULL CHECK (Puntuacion BETWEEN 1 AND 5),
    Comentario NVARCHAR(MAX),
    Util INT DEFAULT 0,
    NoUtil INT DEFAULT 0,
    VerificadoCompra BIT DEFAULT 0,
    FechaCreacion DATETIME DEFAULT GETDATE(),
    Estado NVARCHAR(20) DEFAULT 'pendiente',
    CONSTRAINT FK_Valoraciones_Productos FOREIGN KEY (ProductoID) REFERENCES Productos(ProductoID) ON DELETE CASCADE,
    CONSTRAINT FK_Valoraciones_Usuarios FOREIGN KEY (UsuarioID) REFERENCES Usuarios(UsuarioID) ON DELETE CASCADE,
    CONSTRAINT FK_Valoraciones_Pedidos FOREIGN KEY (PedidoID) REFERENCES Pedidos(PedidoID),
    CONSTRAINT CK_Valoraciones_Estado CHECK (Estado IN ('pendiente', 'aprobada', 'rechazada'))
);
```

### 📦 PROVEEDORES Y COMPRAS

#### Tabla: Proveedores
```sql
CREATE TABLE Proveedores (
    ProveedorID INT PRIMARY KEY IDENTITY(1,1),
    Nombre NVARCHAR(200) NOT NULL,
    Contacto NVARCHAR(100),
    Email NVARCHAR(100),
    Telefono NVARCHAR(50),
    Documento NVARCHAR(50),
    Estado NVARCHAR(20) DEFAULT 'activo',
    FechaRegistro DATETIME DEFAULT GETDATE(),
    CONSTRAINT CK_Proveedores_Estado CHECK (Estado IN ('activo','inactivo'))
);
```

#### Tabla: Compras
```sql
CREATE TABLE Compras (
    CompraID INT PRIMARY KEY IDENTITY(1,1),
    ProveedorID INT NOT NULL,
    OrdenFactura NVARCHAR(50) NOT NULL UNIQUE,
    Fecha DATETIME DEFAULT GETDATE(),
    Total DECIMAL(18,2) NOT NULL,
    Estado NVARCHAR(20) DEFAULT 'Activa',
    Notas NVARCHAR(MAX),
    CONSTRAINT FK_Compras_Proveedores FOREIGN KEY (ProveedorID) REFERENCES Proveedores(ProveedorID),
    CONSTRAINT CK_Compras_Estado CHECK (Estado IN ('Activa','Anulada','Pendiente'))
);
```

#### Tabla: CompraDetalles
```sql
CREATE TABLE CompraDetalles (
    CompraDetalleID INT PRIMARY KEY IDENTITY(1,1),
    CompraID INT NOT NULL,
    ProductoID INT NOT NULL,
    Cantidad INT NOT NULL,
    PrecioUnitario DECIMAL(18,2) NOT NULL,
    Total DECIMAL(18,2) NOT NULL,
    SKU NVARCHAR(50),
    Categoria NVARCHAR(100),
    Marca NVARCHAR(100),
    Talla NVARCHAR(10),
    Color NVARCHAR(50),
    Material NVARCHAR(100),
    TipoProducto NVARCHAR(100),
    CONSTRAINT FK_CompraDetalles_Compras FOREIGN KEY (CompraID) REFERENCES Compras(CompraID) ON DELETE CASCADE,
    CONSTRAINT FK_CompraDetalles_Productos FOREIGN KEY (ProductoID) REFERENCES Productos(ProductoID),
    CONSTRAINT CK_CompraDetalles_Cantidad CHECK (Cantidad > 0)
);
```

#### Tabla: StockMovimientos
```sql
CREATE TABLE StockMovimientos (
    MovimientoID INT PRIMARY KEY IDENTITY(1,1),
    ProductoID INT NOT NULL,
    Cantidad INT NOT NULL,
    Tipo NVARCHAR(20) NOT NULL,
    ReferenciaTipo NVARCHAR(50) NULL,
    ReferenciaID INT NULL,
    Fecha DATETIME DEFAULT GETDATE(),
    UsuarioID INT NULL,
    CONSTRAINT FK_StockMovimientos_Productos FOREIGN KEY (ProductoID) REFERENCES Productos(ProductoID),
    CONSTRAINT CK_StockMovimientos_Tipo CHECK (Tipo IN ('entrada','salida'))
);
```

### 📋 AUDITORÍA Y NOTIFICACIONES

#### Tabla: AuditoriaPerfil
```sql
CREATE TABLE AuditoriaPerfil (
    AuditoriaID INT PRIMARY KEY IDENTITY(1,1),
    UsuarioID INT NOT NULL,
    TipoCambio NVARCHAR(50) NOT NULL,
    CampoModificado NVARCHAR(100),
    ValorAnterior NVARCHAR(MAX),
    ValorNuevo NVARCHAR(MAX),
    FechaCambio DATETIME DEFAULT GETDATE(),
    Origen NVARCHAR(50),
    CONSTRAINT FK_AuditoriaPerfil_Usuarios FOREIGN KEY (UsuarioID) REFERENCES Usuarios(UsuarioID) ON DELETE CASCADE,
    CONSTRAINT CK_AuditoriaPerfil_Tipo CHECK (TipoCambio IN ('perfil', 'email', 'telefono', 'direccion', 'contraseña', 'pedido', 'estado'))
);
```

---

## 🌐 ENDPOINTS REQUERIDOS

### 🔐 AUTH

```
POST /api/auth/signup
├─ Input: { nombreCompleto, email, contraseña, telefono }
├─ Output: { accessToken, refreshToken, usuario }
└─ Acción: Crear usuario + notificación + email verificación

POST /api/auth/login
├─ Input: { email, contraseña }
├─ Output: { accessToken, refreshToken, usuario }
└─ Acción: Autenticar + notificación

POST /api/auth/refresh-token
├─ Input: { refreshToken }
├─ Output: { accessToken }
└─ Acción: Renovar token

POST /api/auth/logout
├─ Input: { refreshToken }
├─ Output: { success }
└─ Acción: Revocar token

POST /api/auth/verify-email
├─ Input: { token }
├─ Output: { success }
└─ Acción: Verificar email + notificación

POST /api/auth/forgot-password
├─ Input: { email }
├─ Output: { success }
└─ Acción: Enviar email reset

POST /api/auth/reset-password
├─ Input: { token, nuevaContraseña }
├─ Output: { success }
└─ Acción: Cambiar contraseña
```

### 👥 USUARIOS

```
GET /api/usuarios [AUTH, usuarios:ver]
└─ Listar usuarios

GET /api/usuarios/{id} [AUTH]
└─ Obtener usuario

POST /api/usuarios [AUTH, usuarios:crear]
├─ Input: { nombreCompleto, email, telefono, roleId }
└─ Output: usuario creado

PUT /api/usuarios/{id} [AUTH, usuarios:editar]
└─ Actualizar usuario

DELETE /api/usuarios/{id} [AUTH, usuarios:eliminar]
└─ Eliminar usuario

POST /api/usuarios/{id}/bloquear [AUTH, usuarios:bloquear]
└─ Bloquear/desbloquear usuario
```

### 🛍️ PRODUCTOS

```
GET /api/productos
└─ Listar productos (público)

GET /api/productos/{id}
└─ Obtener producto (público)

POST /api/productos [AUTH, productos:crear]
├─ Input: { code, nombre, precio, stock, imagen }
└─ Crear producto

PUT /api/productos/{id} [AUTH, productos:editar]
└─ Actualizar producto

DELETE /api/productos/{id} [AUTH, productos:eliminar]
└─ Eliminar producto

POST /api/productos/{id}/descuento [AUTH, productos:descuento]
└─ Aplicar descuento
```

### 🛒 CARRITO

```
GET /api/carrito [AUTH]
└─ Obtener carrito del usuario

POST /api/carrito/items [AUTH, tienda:carrito]
├─ Input: { productoId, cantidad }
└─ Agregar al carrito

DELETE /api/carrito/items/{id} [AUTH]
└─ Eliminar item

PUT /api/carrito/items/{id} [AUTH]
└─ Actualizar cantidad
```

### 📦 PEDIDOS

```
GET /api/pedidos [AUTH]
└─ Ver pedidos (clientes ven solo suyos)

POST /api/pedidos [AUTH, tienda:comprar]
├─ Input: { carrito, direccion, metodo_pago }
├─ Output: { pedidoId, numeroPedido }
└─ Acción: Crear pedido + notif CLIENTE + notif ADMIN + 2 EMAILS

PUT /api/pedidos/{id}/estado [AUTH, ventas:editar]
├─ Input: { nuevoEstado }
└─ Acción: Cambiar estado + notificación cliente + email

DELETE /api/pedidos/{id} [AUTH, ventas:eliminar]
└─ Cancelar pedido (soft delete)
```

### 📬 NOTIFICACIONES

```
GET /api/notificaciones [AUTH]
└─ Obtener notificaciones del usuario

PUT /api/notificaciones/{id}/marcar-leida [AUTH]
└─ Marcar como leída

POST /api/notificaciones/marcar-todas-leidas [AUTH]
└─ Marcar todas como leídas

POST /api/admin/notificaciones/enviar [AUTH, notif:enviar]
├─ Input: { titulo, mensaje, usuarios }
└─ Enviar notificación masiva
```

### 👨‍⚖️ ROLES

```
GET /api/roles [AUTH, roles:ver]
└─ Listar roles

POST /api/roles [AUTH, roles:crear]
├─ Input: { nombre, descripcion, permisos }
└─ Crear rol

PUT /api/roles/{id} [AUTH, roles:editar]
└─ Actualizar rol

DELETE /api/roles/{id} [AUTH, roles:eliminar]
└─ Eliminar rol

POST /api/usuarios/{id}/asignar-rol [AUTH, roles:asignar]
├─ Input: { roleId }
└─ Asignar rol + notificación
```

### 📊 REPORTES

```
GET /api/reportes/ventas [AUTH, reportes:ventas]
└─ Reportes de ventas

GET /api/reportes/inventario [AUTH, reportes:inventario]
└─ Reportes de inventario

GET /api/reportes/clientes [AUTH, reportes:clientes]
└─ Reportes de clientes

GET /api/reportes/financiero [AUTH, reportes:financiero]
└─ Reportes financieros

POST /api/reportes/{tipo}/descargar [AUTH, reportes:descargar]
└─ Descargar en Excel/PDF
```

### ⚙️ ADMIN

```
GET /api/admin/auditoría [AUTH, config:auditoría]
└─ Ver logs de auditoría

POST /api/admin/backup [AUTH, config:backup]
└─ Crear backup BD

GET /api/admin/dashboard [AUTH]
└─ Estadísticas del sistema
```

---

## 🗂️ ESTRUCTURA DE CARPETAS REQUERIDA

```
SelenneApi/
├── Program.cs
├── appsettings.json
├── appsettings.Development.json
├── SelenneApi.csproj
│
├── Controllers/
│   ├── AuthController.cs
│   ├── UsuariosController.cs
│   ├── ProductosController.cs
│   ├── CarritoController.cs
│   ├── PedidosController.cs
│   ├── NotificacionesController.cs
│   ├── RolesController.cs
│   ├── ReportesController.cs
│   └── AdminController.cs
│
├── Services/
│   ├── IAuthService.cs
│   ├── AuthService.cs
│   ├── IJwtService.cs
│   ├── JwtService.cs
│   ├── IEmailService.cs
│   ├── SmtpEmailService.cs
│   ├── IOrderService.cs
│   ├── OrderService.cs
│   ├── IProductService.cs
│   ├── ProductService.cs
│   ├── INotificationService.cs
│   ├── NotificationService.cs
│   ├── IPermissionService.cs
│   ├── PermissionService.cs
│   └── IPermissionCheckService.cs
│
├── Data/
│   ├── AppDbContext.cs
│   └── SeedData.cs
│
├── Models/
│   ├── Entities/
│   │   ├── Usuario.cs
│   │   ├── Rol.cs
│   │   ├── Permission.cs
│   │   ├── RolePermission.cs
│   │   ├── Producto.cs
│   │   ├── Carrito.cs
│   │   ├── CarritoItem.cs
│   │   ├── Pedido.cs
│   │   ├── PedidoDetalle.cs
│   │   ├── Notificacion.cs
│   │   ├── RefreshToken.cs
│   │   ├── AuditLog.cs
│   │   └── EmailVerification.cs
│   │
│   └── DTOs/
│       ├── Auth/
│       │   ├── SignupRequestDto.cs
│       │   ├── LoginRequestDto.cs
│       │   ├── TokenResponseDto.cs
│       │   └── RefreshTokenRequestDto.cs
│       ├── Usuarios/
│       │   ├── UsuarioDto.cs
│       │   └── CreateUsuarioRequestDto.cs
│       ├── Productos/
│       │   ├── ProductoDto.cs
│       │   └── CreateProductoRequestDto.cs
│       ├── Pedidos/
│       │   ├── PedidoDto.cs
│       │   └── CrearPedidoRequestDto.cs
│       ├── Notificaciones/
│       │   └── NotificacionDto.cs
│       └── Roles/
│           ├── RolDto.cs
│           └── CreateRolRequestDto.cs
│
├── Middleware/
│   ├── ErrorHandlingMiddleware.cs
│   └── RateLimitingMiddleware.cs
│
├── Repositories/
│   ├── IRepository.cs
│   ├── IUsuarioRepository.cs
│   ├── UsuarioRepository.cs
│   ├── IProductoRepository.cs
│   ├── ProductoRepository.cs
│   ├── IPedidoRepository.cs
│   └── PedidoRepository.cs
│
├── Utilities/
│   ├── PermissionHelper.cs
│   ├── JwtHelper.cs
│   └── EncryptionHelper.cs
│
├── Exceptions/
│   ├── UnauthorizedException.cs
│   ├── ForbiddenException.cs
│   └── ValidationException.cs
│
└── Docs/
    ├── openapi.yaml
    └── README.md
```

---

## 🗄️ MIGRACIÓN Y CREACIÓN AUTOMÁTICA DE BASE DE DATOS

### ⚠️ INSTRUCCIONES CRÍTICAS - DATABASE FIRST (NO CODE FIRST)

**LA BASE DE DATOS YA EXISTE EN EL ARCHIVO `DATABASE.sql`**

Por lo tanto:

1. **NO generes migraciones ni code-first**
2. **NO crees nuevas tablas desde Entity Framework**
3. **Solo genera Entity Models basados en las 32 tablas que ya existen**

### Qué hacer:

1. **AppDbContext.cs** debe tener:
   ```csharp
   public AppDbContext(DbContextOptions<AppDbContext> options) 
       : base(options) { }
   
   // DbSet para TODAS las 32 entidades (sin migraciones)
   public DbSet<Roles> Roles { get; set; }
   public DbSet<Permissions> Permissions { get; set; }
   // ... resto de DbSets
   
   protected override void OnModelCreating(ModelBuilder modelBuilder)
   {
       base.OnModelCreating(modelBuilder);
       // Configurar relaciones basadas en las FK del DATABASE.sql
       // NO generar código de creación de tablas
   }
   ```

2. **Program.cs** debe:
   ```csharp
   // Conectar a BD existente (que ya tiene las 32 tablas)
   services.AddDbContext<AppDbContext>(options =>
       options.UseSqlServer(configuration.GetConnectionString("DefaultConnection")));
   
   // NO ejecutar EnsureCreated() porque la BD ya existe
   // Solo validar que se puede conectar
   using (var scope = app.Services.CreateScope())
   {
       var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
       db.Database.CanConnect(); // Solo verificar conexión
   }
   ```

3. **Entity Models** deben mapear EXACTAMENTE las 32 tablas del DATABASE.sql:
   - Roles, Permissions, RolePermissions
   - Usuarios, RefreshTokens, EmailVerifications, PasswordResetTokens, UserSessions, LoginAttempts
   - CategoriasPrincipales, TiposProducto, Marcas, Tallas, Colores, Materiales
   - Productos, ProductoImagenes, ProductoTallas, ProductoColores, ProductoMateriales
   - Carrito, Pedidos, PedidoDetalles, Ventas, VentaDetalles
   - Favoritos, Valoraciones
   - Proveedores, Compras, CompraDetalles, StockMovimientos
   - AuditoriaPerfil

4. **Pasos para usar la BD:**
   ```powershell
   # 1. Abre SQL Server Management Studio o Azure Data Studio
   # 2. Crea BD nueva: SelenneDB
   # 3. Abre DATABASE.sql y ejecuta TODO el script
   # 4. Comprueba que se crearon las 32 tablas
   # 5. Luego sí, ejecuta el backend con dotnet run
   ```

### Checklist de BD Database-First
- [ ] DATABASE.sql se ejecutó en SQL Server LocalDB
- [ ] BD "SelenneDB" se creó con 32 tablas
- [ ] ConnectionString en appsettings.json apunta a (localdb)\mssqllocaldb
- [ ] Entity Models mapean correctamente cada tabla
- [ ] Program.cs NO llama EnsureCreated(), solo CanConnect()
- [ ] Controllers usan DbContext para consultar BD existente
- [ ] dotnet run se conecta sin errores a la BD

---

## ⚙️ CONFIGURACIÓN (appsettings.json)

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=SelenneDb;Trusted_Connection=true;MultipleActiveResultSets=true;"
  },
  "Jwt": {
    "SecretKey": "SuClaveSecretaMuylargaAquiAlMenos32Caracteres",
    "ExpiryMinutes": 15,
    "RefreshTokenExpiryDays": 7,
    "Issuer": "SelenneApi",
    "Audience": "SelenneClient"
  },
  "Email": {
    "SmtpHost": "smtp.gmail.com",
    "SmtpPort": 587,
    "SmtpUsername": "tu_email@gmail.com",
    "SmtpPassword": "tu_app_password",
    "FromEmail": "noreply@selenne.com",
    "FromName": "Selenne Boutique"
  },
  "Cors": {
    "AllowedOrigins": ["http://localhost:5173", "http://localhost:3000"]
  }
}
```

---

## 🔧 REQUISITOS TÉCNICOS

### Paquetes NuGet Requeridos
- Microsoft.EntityFrameworkCore (8.0+)
- Microsoft.EntityFrameworkCore.SqlServer (8.0+)
- System.IdentityModel.Tokens.Jwt (7.0+)
- BCrypt.Net-Next (4.0+)
- Serilog (3.0+)

### .NET Version
- .NET SDK 8.0+
- C# 12

### Base de Datos
- SQL Server LocalDB (incluido con Visual Studio)
- ConnectionString: `(localdb)\mssqllocaldb`

---

## ✅ CHECKLIST OBLIGATORIO

- [ ] Proyecto compila: `dotnet build` ✅
- [ ] Proyecto ejecuta: `dotnet run` ✅
- [ ] Swagger en: http://localhost:5000/swagger ✅
- [ ] **DATABASE.sql se ejecutó en SQL Server LocalDB** ✅
- [ ] **BD "SelenneDB" tiene las 32 tablas creadas** (verificar en SQL Server) ✅
- [ ] **AppDbContext se conecta a la BD existente** ✅
- [ ] **Todos los Entity Models están generados** ✅
- [ ] CORS configurado para http://localhost:5173 ✅
- [ ] JWT funciona (tokens válidos) ✅
- [ ] Refresh token funciona ✅
- [ ] Inicio de sesión funciona ✅
- [ ] Permisos se validan ✅
- [ ] Notificaciones se crean en BD ✅
- [ ] Emails se envían ✅
- [ ] Rate limiting activado ✅
- [ ] Error handling funciona ✅
- [ ] Logging funciona ✅

---

## 🎯 PATRÓN OBLIGATORIO PARA TODOS LOS ENDPOINTS

### Crear/Modificar Datos:
1. Validar permisos del usuario
2. Validar entrada (DTO)
3. Ejecutar en transacción BD
4. Crear notificación (si aplica)
5. Enviar email (si aplica)
6. Retornar respuesta estructurada

### Respuesta Estructura:
```json
{
  "success": true,
  "message": "Operación exitosa",
  "data": { ... },
  "errors": null
}
```

---

## 📧 EMAILS AUTOMÁTICOS

1. **Bienvenida**: POST /auth/signup
2. **Verificación Email**: POST /auth/verify-email
3. **Reset Password**: POST /auth/forgot-password
4. **Contraseña Reseteada**: POST /auth/reset-password
5. **Nuevo Usuarios Creado**: POST /usuarios
6. **Pedido Creado** (Cliente): POST /pedidos
7. **Pedido Creado** (Admin): POST /pedidos
8. **Estado Pedido Actualizado**: PUT /pedidos/{id}/estado

---

## 🚀 DESPUÉS DE GENERAR

### PASO 1: Crear la BD con DATABASE.sql
```powershell
# 1. Abre SQL Server Management Studio o Azure Data Studio
# 2. Conecta a: (localdb)\mssqllocaldb
# 3. Abre el archivo: src/DATABASE.sql
# 4. Ejecuta TODO el script (Ctrl+A, F5)
# 5. Verifica que se crearon las 32 tablas en BD "SelenneDB"
```

### PASO 2: Copiar y ejecutar Backend
```powershell
1. Copiar archivos a: Backend/SelenneApi/
2. cd Backend/SelenneApi
3. dotnet build
4. dotnet run
5. Verificar: http://localhost:5000/swagger
```

### PASO 3: Frontend
```powershell
# Desde el frontend (puerto 5173):
# Actualize VITE_API_BASE_URL=http://localhost:5000 en archivo .env
# npm run dev
```

---

**VERSIÓN**: 1.1  
**FECHA**: 3 Marzo 2026  
**STATUS**: ✅ DATABASE-FIRST (BD EXISTENTE EN DATABASE.SQL)
