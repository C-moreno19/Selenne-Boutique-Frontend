-- =====================================================
-- BASE DE DATOS SELENNE BOUTIQUE - SQL SERVER
-- Versión: 26/02/2026 v4.0 - OPTIMIZADA Y LIMPIA
-- Solo tablas necesarias para la aplicación
-- Sin duplicados, sin características innecesarias
-- =====================================================

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'SelenneDB')
BEGIN
    CREATE DATABASE SelenneDB;
END
GO

USE SelenneDB;
GO

-- =====================================================
-- ═══════════════════════════════════════════════════
-- 1. TABLAS DE AUTENTICACIÓN Y SEGURIDAD
-- ═══════════════════════════════════════════════════
-- =====================================================

-- TABLA: Roles
-- PROPÓSITO: Define los tipos de usuarios (Admin, Empleado, Cliente)
-- RELACIONES: Usuarios.RoleID → Roles.RoleID
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Roles')
CREATE TABLE Roles (
    RoleID INT PRIMARY KEY IDENTITY(1,1),
    Nombre NVARCHAR(50) NOT NULL UNIQUE,
    Descripcion NVARCHAR(255),
    Estado NVARCHAR(20) DEFAULT 'activo',
    CONSTRAINT CK_Roles_Estado CHECK (Estado IN ('activo','inactivo'))
);
GO

-- TABLA: Permissions
-- PROPÓSITO: Define los permisos del sistema (crear productos, editar pedidos, etc.)
-- RELACIONES: RolePermissions.PermissionID → Permissions.PermissionID
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Permissions')
CREATE TABLE Permissions (
    PermissionID INT PRIMARY KEY IDENTITY(1,1),
    Nombre NVARCHAR(100) NOT NULL UNIQUE,
    Descripcion NVARCHAR(255),
    Estado NVARCHAR(20) DEFAULT 'activo',
    CONSTRAINT CK_Permissions_Estado CHECK (Estado IN ('activo','inactivo'))
);
GO

-- TABLA: RolePermissions
-- PROPÓSITO: Asigna permisos a los roles (muchos a muchos)
-- RELACIONES: Roles.RoleID, Permissions.PermissionID
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'RolePermissions')
CREATE TABLE RolePermissions (
    RolePermissionID INT PRIMARY KEY IDENTITY(1,1),
    RoleID INT NOT NULL,
    PermissionID INT NOT NULL,
    CONSTRAINT FK_RolePermissions_Roles FOREIGN KEY (RoleID) REFERENCES Roles(RoleID) ON DELETE CASCADE,
    CONSTRAINT FK_RolePermissions_Permissions FOREIGN KEY (PermissionID) REFERENCES Permissions(PermissionID) ON DELETE CASCADE,
    CONSTRAINT UQ_RolePermissions UNIQUE (RoleID, PermissionID)
);
GO

-- TABLA: Usuarios
-- PROPÓSITO: Almacena la información de todos los usuarios (Admin, Empleados, Clientes)
-- RELACIONES: RoleID → Roles.RoleID (relación con roles)
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Usuarios')
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
GO

-- TABLA: RefreshTokens
-- PROPÓSITO: Almacena tokens de actualización para mantener sesiones seguras
-- RELACIONES: UsuarioID → Usuarios.UsuarioID
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'RefreshTokens')
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
GO

-- TABLA: EmailVerifications
-- PROPÓSITO: Almacena tokens para verificar correos electrónicos de nuevos usuarios
-- RELACIONES: UsuarioID → Usuarios.UsuarioID
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'EmailVerifications')
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
GO

-- TABLA: PasswordResetTokens
-- PROPÓSITO: Almacena tokens para recuperación de contraseña
-- RELACIONES: UsuarioID → Usuarios.UsuarioID
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'PasswordResetTokens')
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
GO

-- TABLA: UserSessions
-- PROPÓSITO: Registra las sesiones activas de cada usuario
-- RELACIONES: UsuarioID → Usuarios.UsuarioID, RefreshTokenID → RefreshTokens.RefreshTokenID
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'UserSessions')
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
GO

-- TABLA: LoginAttempts
-- PROPÓSITO: Registra todos los intentos de login (para auditoría y seguridad)
-- RELACIONES: UsuarioID → Usuarios.UsuarioID (puede ser NULL si el user no existe)
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'LoginAttempts')
CREATE TABLE LoginAttempts (
    AttemptID INT PRIMARY KEY IDENTITY(1,1),
    UsuarioID INT,
    Email NVARCHAR(100),
    AttemptAt DATETIME DEFAULT GETDATE(),
    Successful BIT DEFAULT 0,
    IPAddress NVARCHAR(50),
    CONSTRAINT FK_LoginAttempts_Usuarios FOREIGN KEY (UsuarioID) REFERENCES Usuarios(UsuarioID) ON DELETE SET NULL
);
GO

-- =====================================================
-- ═══════════════════════════════════════════════════
-- 2. TABLAS DEL CATÁLOGO DE PRODUCTOS
-- ═══════════════════════════════════════════════════
-- =====================================================

-- TABLA: CategoriasPrincipales
-- PROPÓSITO: Categorías principales de productos (Damas, Caballeros, Accesorios)
-- RELACIONES: Productos.CategoriaPrincipalID → CategoriasPrincipales.CategoriaPrincipalID
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'CategoriasPrincipales')
CREATE TABLE CategoriasPrincipales (
    CategoriaPrincipalID INT PRIMARY KEY IDENTITY(1,1),
    Nombre NVARCHAR(100) NOT NULL UNIQUE,
    Descripcion NVARCHAR(500),
    Imagen NVARCHAR(500),
    Estado NVARCHAR(20) DEFAULT 'activo',
    CONSTRAINT CK_Categorias_Estado CHECK (Estado IN ('activo','inactivo'))
);
GO

-- TABLA: TiposProducto
-- PROPÓSITO: Tipos de productos (Camiseta, Pantalón, Vestido, etc.)
-- RELACIONES: Productos.TipoProductoID → TiposProducto.TipoProductoID
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'TiposProducto')
CREATE TABLE TiposProducto (
    TipoProductoID INT PRIMARY KEY IDENTITY(1,1),
    Nombre NVARCHAR(100) NOT NULL UNIQUE,
    Descripcion NVARCHAR(500),
    Estado NVARCHAR(20) DEFAULT 'activo',
    CONSTRAINT CK_TiposProducto_Estado CHECK (Estado IN ('activo','inactivo'))
);
GO

-- TABLA: Marcas
-- PROPÓSITO: Marcas de productos (Selenne, Premium Style, etc.)
-- RELACIONES: Productos.MarcaID → Marcas.MarcaID
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Marcas')
CREATE TABLE Marcas (
    MarcaID INT PRIMARY KEY IDENTITY(1,1),
    Nombre NVARCHAR(100) NOT NULL UNIQUE,
    Logo NVARCHAR(500),
    SitioWeb NVARCHAR(200),
    Estado NVARCHAR(20) DEFAULT 'activo',
    CONSTRAINT CK_Marcas_Estado CHECK (Estado IN ('activo','inactivo'))
);
GO

-- TABLA: Tallas
-- PROPÓSITO: Tallas disponibles (XS, S, M, L, XL, XXL)
-- RELACIONES: ProductoTallas.TallaID → Tallas.TallaID, VentaDetalles.TallaID → Tallas.TallaID
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Tallas')
CREATE TABLE Tallas (
    TallaID INT PRIMARY KEY IDENTITY(1,1),
    Nombre NVARCHAR(10) NOT NULL UNIQUE,
    Orden INT DEFAULT 0
);
GO

-- TABLA: Colores
-- PROPÓSITO: Colores disponibles (Negro, Blanco, Rojo, etc.)
-- RELACIONES: ProductoColores.ColorID → Colores.ColorID, VentaDetalles.ColorID → Colores.ColorID
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Colores')
CREATE TABLE Colores (
    ColorID INT PRIMARY KEY IDENTITY(1,1),
    Nombre NVARCHAR(50) NOT NULL UNIQUE,
    CodigoHex NVARCHAR(7),
    Estado NVARCHAR(20) DEFAULT 'activo',
    CONSTRAINT CK_Colores_Estado CHECK (Estado IN ('activo','inactivo'))
);
GO

-- TABLA: Materiales
-- PROPÓSITO: Materiales de productos (Algodón, Poliéster, Lino, Seda)
-- RELACIONES: ProductoMateriales.MaterialID → Materiales.MaterialID
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Materiales')
CREATE TABLE Materiales (
    MaterialID INT PRIMARY KEY IDENTITY(1,1),
    Nombre NVARCHAR(100) NOT NULL UNIQUE,
    Descripcion NVARCHAR(500),
    Estado NVARCHAR(20) DEFAULT 'activo',
    CONSTRAINT CK_Materiales_Estado CHECK (Estado IN ('activo','inactivo'))
);
GO

-- TABLA: Productos
-- PROPÓSITO: Tabla principal de productos con información general
-- RELACIONES: CategoriaPrincipalID, TipoProductoID, MarcaID (todas FK)
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Productos')
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
GO

-- TABLA: ProductoImagenes
-- PROPÓSITO: Almacena múltiples imágenes para cada producto
-- RELACIONES: ProductoID → Productos.ProductoID
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'ProductoImagenes')
CREATE TABLE ProductoImagenes (
    ProductoImagenID INT PRIMARY KEY IDENTITY(1,1),
    ProductoID INT NOT NULL,
    URL NVARCHAR(500) NOT NULL,
    Orden INT DEFAULT 0,
    CONSTRAINT FK_ProductoImagenes_Productos FOREIGN KEY (ProductoID) REFERENCES Productos(ProductoID) ON DELETE CASCADE
);
GO

-- TABLA: ProductoTallas
-- PROPÓSITO: Relaciona productos con tallas y su stock por talla
-- RELACIONES: ProductoID → Productos.ProductoID, TallaID → Tallas.TallaID
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'ProductoTallas')
CREATE TABLE ProductoTallas (
    ProductoTallaID INT PRIMARY KEY IDENTITY(1,1),
    ProductoID INT NOT NULL,
    TallaID INT NOT NULL,
    StockTalla INT DEFAULT 0,
    CONSTRAINT FK_ProductoTallas_Productos FOREIGN KEY (ProductoID) REFERENCES Productos(ProductoID) ON DELETE CASCADE,
    CONSTRAINT FK_ProductoTallas_Tallas FOREIGN KEY (TallaID) REFERENCES Tallas(TallaID),
    CONSTRAINT UQ_ProductoTallas UNIQUE (ProductoID, TallaID)
);
GO

-- TABLA: ProductoColores
-- PROPÓSITO: Relaciona productos con colores disponibles
-- RELACIONES: ProductoID → Productos.ProductoID, ColorID → Colores.ColorID
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'ProductoColores')
CREATE TABLE ProductoColores (
    ProductoColorID INT PRIMARY KEY IDENTITY(1,1),
    ProductoID INT NOT NULL,
    ColorID INT NOT NULL,
    CONSTRAINT FK_ProductoColores_Productos FOREIGN KEY (ProductoID) REFERENCES Productos(ProductoID) ON DELETE CASCADE,
    CONSTRAINT FK_ProductoColores_Colores FOREIGN KEY (ColorID) REFERENCES Colores(ColorID),
    CONSTRAINT UQ_ProductoColores UNIQUE (ProductoID, ColorID)
);
GO

-- TABLA: ProductoMateriales
-- PROPÓSITO: Relaciona productos con materiales y su porcentaje de composición
-- RELACIONES: ProductoID → Productos.ProductoID, MaterialID → Materiales.MaterialID
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'ProductoMateriales')
CREATE TABLE ProductoMateriales (
    ProductoMaterialID INT PRIMARY KEY IDENTITY(1,1),
    ProductoID INT NOT NULL,
    MaterialID INT NOT NULL,
    Porcentaje DECIMAL(5,2),
    CONSTRAINT FK_ProductoMateriales_Productos FOREIGN KEY (ProductoID) REFERENCES Productos(ProductoID) ON DELETE CASCADE,
    CONSTRAINT FK_ProductoMateriales_Materiales FOREIGN KEY (MaterialID) REFERENCES Materiales(MaterialID),
    CONSTRAINT UQ_ProductoMateriales UNIQUE (ProductoID, MaterialID)
);
GO

-- =====================================================
-- ═══════════════════════════════════════════════════
-- 3. TABLAS DE CARRITO Y PEDIDOS
-- ═══════════════════════════════════════════════════
-- =====================================================

-- TABLA: Carrito
-- PROPÓSITO: Almacena los artículos que el usuario ha añadido a su carrito (no es temporal)
-- RELACIONES: UsuarioID → Usuarios.UsuarioID, ProductoID → Productos.ProductoID
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Carrito')
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
GO

-- TABLA: Pedidos
-- PROPÓSITO: Almacena la información maestra de pedidos (cliente, envío, estado, etc.)
-- RELACIONES: ClienteID → Usuarios.UsuarioID
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Pedidos')
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
GO

-- TABLA: PedidoDetalles
-- PROPÓSITO: Detalles de cada producto dentro de un pedido (cantidad, precio, talla, color)
-- RELACIONES: PedidoID → Pedidos.PedidoID, ProductoID → Productos.ProductoID
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'PedidoDetalles')
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
GO

-- TABLA: Ventas
-- PROPÓSITO: Registro de ventas internas (puede ser diferente de Pedidos, para análisis)
-- RELACIONES: UsuarioID (vendedor), ClienteID (cliente)
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Ventas')
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
GO

-- TABLA: VentaDetalles
-- PROPÓSITO: Detalles de cada producto vendido
-- RELACIONES: VentaID → Ventas.VentaID, ProductoID → Productos.ProductoID
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'VentaDetalles')
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
GO

-- =====================================================
-- ═══════════════════════════════════════════════════
-- 4. TABLAS DE USUARIO (Favoritos, Valoraciones)
-- ═══════════════════════════════════════════════════
-- =====================================================

-- TABLA: Favoritos
-- PROPÓSITO: Almacena los productos marcados como favoritos por cada usuario
-- RELACIONES: UsuarioID → Usuarios.UsuarioID, ProductoID → Productos.ProductoID
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Favoritos')
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
GO

-- TABLA: Valoraciones
-- PROPÓSITO: Almacena las reseñas y calificaciones de productos por usuarios
-- RELACIONES: ProductoID → Productos.ProductoID, UsuarioID → Usuarios.UsuarioID, PedidoID → Pedidos.PedidoID
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Valoraciones')
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
GO

-- =====================================================
-- ═══════════════════════════════════════════════════
-- 5. TABLAS DE PROVEEDORES Y COMPRAS (LOGÍSTICA INTERNA)
-- ═══════════════════════════════════════════════════
-- =====================================================

-- TABLA: Proveedores
-- PROPÓSITO: Lista de proveedores externos (datos de contacto)
-- RELACIONES: Compras.ProveedorID → Proveedores.ProveedorID
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Proveedores')
CREATE TABLE Proveedores (
    ProveedorID INT PRIMARY KEY IDENTITY(1,1),
    Nombre NVARCHAR(200) NOT NULL,
    Contacto NVARCHAR(100),
    Email NVARCHAR(100),
    Telefono NVARCHAR(50),
    Documento NVARCHAR(50) NULL, -- NIT, cédula u otro identificador fiscal
    Estado NVARCHAR(20) DEFAULT 'activo',
    FechaRegistro DATETIME DEFAULT GETDATE(),
    CONSTRAINT CK_Proveedores_Estado CHECK (Estado IN ('activo','inactivo'))
);
GO

-- TABLA: Compras
-- PROPÓSITO: Órdenes de compra realizadas a proveedores
-- RELACIONES: ProveedorID → Proveedores.ProveedorID
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Compras')
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
GO

-- TABLA: CompraDetalles
-- PROPÓSITO: Líneas de productos dentro de una compra
-- RELACIONES: CompraID → Compras.CompraID, ProductoID → Productos.ProductoID
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'CompraDetalles')
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
GO

-- TABLA: StockMovimientos
-- PROPÓSITO: Registro de entradas y salidas de inventario
-- RELACIONES: ProductoID → Productos.ProductoID
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'StockMovimientos')
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
GO

-- =====================================================
-- ═══════════════════════════════════════════════════
-- 5. TABLA DE AUDITORÍA
-- ═══════════════════════════════════════════════════
-- =====================================================

-- TABLA: AuditoriaPerfil
-- PROPÓSITO: Registra todos los cambios realizados en perfiles de usuarios
-- RELACIONES: UsuarioID → Usuarios.UsuarioID
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'AuditoriaPerfil')
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
GO

-- =====================================================
-- ═══════════════════════════════════════════════════
-- 6. ÍNDICES PARA PERFORMANCE
-- ═══════════════════════════════════════════════════
-- =====================================================

-- Índices de proveedores y compras
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Compras_Proveedor' AND object_id = OBJECT_ID('Compras'))
    CREATE INDEX IX_Compras_Proveedor ON Compras(ProveedorID);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_CompraDetalles_Compra' AND object_id = OBJECT_ID('CompraDetalles'))
    CREATE INDEX IX_CompraDetalles_Compra ON CompraDetalles(CompraID);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_StockMovimientos_Producto' AND object_id = OBJECT_ID('StockMovimientos'))
    CREATE INDEX IX_StockMovimientos_Producto ON StockMovimientos(ProductoID);
GO

-- =====================================================
-- Índices de autenticación
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Usuarios_Email' AND object_id = OBJECT_ID('Usuarios'))
    CREATE INDEX IX_Usuarios_Email ON Usuarios(Email);
GO

-- Índices de autenticación
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Usuarios_Email' AND object_id = OBJECT_ID('Usuarios'))
    CREATE INDEX IX_Usuarios_Email ON Usuarios(Email);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_RefreshTokens_UsuarioID' AND object_id = OBJECT_ID('RefreshTokens'))
    CREATE INDEX IX_RefreshTokens_UsuarioID ON RefreshTokens(UsuarioID);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_RefreshTokens_Revoked' AND object_id = OBJECT_ID('RefreshTokens'))
    CREATE INDEX IX_RefreshTokens_Revoked ON RefreshTokens(Revoked);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_UserSessions_UsuarioID' AND object_id = OBJECT_ID('UserSessions'))
    CREATE INDEX IX_UserSessions_UsuarioID ON UserSessions(UsuarioID);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_LoginAttempts_Email' AND object_id = OBJECT_ID('LoginAttempts'))
    CREATE INDEX IX_LoginAttempts_Email ON LoginAttempts(Email);
GO

-- Índices de catálogo
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Productos_Codigo' AND object_id = OBJECT_ID('Productos'))
    CREATE INDEX IX_Productos_Codigo ON Productos(Codigo);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Productos_Categoria' AND object_id = OBJECT_ID('Productos'))
    CREATE INDEX IX_Productos_Categoria ON Productos(CategoriaPrincipalID);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Productos_Estado' AND object_id = OBJECT_ID('Productos'))
    CREATE INDEX IX_Productos_Estado ON Productos(Estado);
GO

-- Índices de carrito y pedidos
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Carrito_Usuario' AND object_id = OBJECT_ID('Carrito'))
    CREATE INDEX IX_Carrito_Usuario ON Carrito(UsuarioID);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Pedidos_Cliente' AND object_id = OBJECT_ID('Pedidos'))
    CREATE INDEX IX_Pedidos_Cliente ON Pedidos(ClienteID);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Pedidos_Estado' AND object_id = OBJECT_ID('Pedidos'))
    CREATE INDEX IX_Pedidos_Estado ON Pedidos(Estado);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_PedidoDetalles_Pedido' AND object_id = OBJECT_ID('PedidoDetalles'))
    CREATE INDEX IX_PedidoDetalles_Pedido ON PedidoDetalles(PedidoID);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Ventas_Cliente' AND object_id = OBJECT_ID('Ventas'))
    CREATE INDEX IX_Ventas_Cliente ON Ventas(ClienteID);
GO

-- Índices de usuario
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Favoritos_Usuario' AND object_id = OBJECT_ID('Favoritos'))
    CREATE INDEX IX_Favoritos_Usuario ON Favoritos(UsuarioID);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Valoraciones_Producto' AND object_id = OBJECT_ID('Valoraciones'))
    CREATE INDEX IX_Valoraciones_Producto ON Valoraciones(ProductoID);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Valoraciones_Usuario' AND object_id = OBJECT_ID('Valoraciones'))
    CREATE INDEX IX_Valoraciones_Usuario ON Valoraciones(UsuarioID);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_AuditoriaPerfil_Usuario' AND object_id = OBJECT_ID('AuditoriaPerfil'))
    CREATE INDEX IX_AuditoriaPerfil_Usuario ON AuditoriaPerfil(UsuarioID);
GO

-- =====================================================
-- ═══════════════════════════════════════════════════
-- 7. PROCEDIMIENTOS ALMACENADOS PRINCIPALES
-- ═══════════════════════════════════════════════════
-- =====================================================

-- PROCEDIMIENTO: sp_RegisterUser
-- PROPÓSITO: Registrar un nuevo usuario en el sistema
CREATE OR ALTER PROCEDURE sp_RegisterUser
    @NombreCompleto NVARCHAR(100),
    @Email NVARCHAR(100),
    @PasswordHash NVARCHAR(255),
    @RoleName NVARCHAR(50) = 'Cliente',
    @UsuarioID INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        -- Obtener o crear el rol
        DECLARE @RoleID INT = (SELECT TOP 1 RoleID FROM Roles WHERE Nombre = @RoleName);
        IF @RoleID IS NULL
        BEGIN
            INSERT INTO Roles (Nombre, Descripcion, Estado) VALUES (@RoleName, @RoleName, 'activo');
            SET @RoleID = SCOPE_IDENTITY();
        END

        -- Inserte el usuario
        INSERT INTO Usuarios (NombreCompleto, Email, PasswordHash, RoleID, Estado)
        VALUES (@NombreCompleto, @Email, @PasswordHash, @RoleID, 'activo');
        SET @UsuarioID = SCOPE_IDENTITY();

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        RAISERROR('Error al registrar usuario', 16, 1);
    END CATCH
END;
GO

-- PROCEDIMIENTO: sp_CreateRefreshToken
-- PROPÓSITO: Crear un nuevo refresh token para un usuario
CREATE OR ALTER PROCEDURE sp_CreateRefreshToken
    @UsuarioID INT,
    @Token NVARCHAR(500),
    @ExpiresAt DATETIME,
    @IPAddress NVARCHAR(50) = NULL,
    @RefreshTokenID INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO RefreshTokens (UsuarioID, Token, ExpiresAt, IPAddress)
    VALUES (@UsuarioID, @Token, @ExpiresAt, @IPAddress);
    SET @RefreshTokenID = SCOPE_IDENTITY();
END;
GO

-- PROCEDIMIENTO: sp_RevokeRefreshToken
-- PROPÓSITO: Revocar un refresh token (marcarlo como inválido)
CREATE OR ALTER PROCEDURE sp_RevokeRefreshToken
    @Token NVARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE RefreshTokens 
    SET Revoked = 1, RevokedAt = GETDATE()
    WHERE Token = @Token;
END;
GO

-- PROCEDIMIENTO: sp_RevokeAllUserTokens
-- PROPÓSITO: Revocar todos los refresh tokens de un usuario (cuando cambia contraseña)
CREATE OR ALTER PROCEDURE sp_RevokeAllUserTokens
    @UsuarioID INT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE RefreshTokens 
    SET Revoked = 1, RevokedAt = GETDATE()
    WHERE UsuarioID = @UsuarioID AND Revoked = 0;
END;
GO

-- PROCEDIMIENTO: sp_CreateEmailVerification
-- PROPÓSITO: Crear un token de verificación de email
CREATE OR ALTER PROCEDURE sp_CreateEmailVerification
    @UsuarioID INT,
    @Token NVARCHAR(500),
    @ExpiresAt DATETIME
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO EmailVerifications (UsuarioID, Token, ExpiresAt)
    VALUES (@UsuarioID, @Token, @ExpiresAt);
END;
GO

-- PROCEDIMIENTO: sp_VerifyEmail
-- PROPÓSITO: Marcar el email como verificado
CREATE OR ALTER PROCEDURE sp_VerifyEmail
    @Token NVARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE EmailVerifications 
    SET Verified = 1, VerifiedAt = GETDATE()
    WHERE Token = @Token AND ExpiresAt >= GETDATE();

    -- Opcional: activar usuario
    UPDATE Usuarios SET EmailVerificado = 1, Estado = 'activo'
    FROM Usuarios u
    INNER JOIN EmailVerifications ev ON ev.UsuarioID = u.UsuarioID
    WHERE ev.Token = @Token AND ev.ExpiresAt >= GETDATE();
END;
GO

-- PROCEDIMIENTO: sp_CreatePasswordReset
-- PROPÓSITO: Crear un token de reset de contraseña
CREATE OR ALTER PROCEDURE sp_CreatePasswordReset
    @Email NVARCHAR(100),
    @Token NVARCHAR(500),
    @ExpiresAt DATETIME,
    @UsuarioID INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT @UsuarioID = UsuarioID FROM Usuarios WHERE Email = @Email;
    
    IF @UsuarioID IS NULL
    BEGIN
        RAISERROR('Usuario no encontrado', 16, 1);
        RETURN;
    END

    INSERT INTO PasswordResetTokens (UsuarioID, Token, ExpiresAt)
    VALUES (@UsuarioID, @Token, @ExpiresAt);
END;
GO

-- PROCEDIMIENTO: sp_ResetPassword
-- PROPÓSITO: Cambiar contraseña usando un token de reset
CREATE OR ALTER PROCEDURE sp_ResetPassword
    @Token NVARCHAR(500),
    @NewPasswordHash NVARCHAR(255),
    @Success BIT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @Success = 0;

    BEGIN TRANSACTION;
    BEGIN TRY
        DECLARE @UsuarioID INT = (SELECT TOP 1 UsuarioID FROM PasswordResetTokens 
                                   WHERE Token = @Token AND ExpiresAt >= GETDATE() AND Used = 0);
        
        IF @UsuarioID IS NULL
        BEGIN
            RAISERROR('Token inválido o expirado', 16, 1);
            RETURN;
        END

        -- Actualizar contraseña
        UPDATE Usuarios SET PasswordHash = @NewPasswordHash WHERE UsuarioID = @UsuarioID;

        -- Marcar token como usado
        UPDATE PasswordResetTokens SET Used = 1, UsedAt = GETDATE() WHERE Token = @Token;

        -- Revocar todos los refresh tokens (logout de todas las sesiones)
        EXEC sp_RevokeAllUserTokens @UsuarioID;

        SET @Success = 1;
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        RAISERROR('Error al resetear contraseña', 16, 1);
    END CATCH
END;
GO

-- PROCEDIMIENTO: sp_AgregarAlCarrito
-- PROPÓSITO: Agregar un producto al carrito (o incrementar cantidad)
CREATE OR ALTER PROCEDURE sp_AgregarAlCarrito
    @UsuarioID INT,
    @ProductoID INT,
    @Cantidad INT,
    @TallaSeleccionada NVARCHAR(10) = NULL,
    @ColorSeleccionado NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        -- Verificar stock disponible
        DECLARE @StockDisponible INT;
        SELECT @StockDisponible = Stock FROM Productos WHERE ProductoID = @ProductoID;

        IF @StockDisponible < @Cantidad
        BEGIN
            RAISERROR('Stock insuficiente', 16, 1);
            RETURN;
        END

        -- Verificar si ya existe en el carrito
        IF EXISTS (
            SELECT 1 FROM Carrito 
            WHERE UsuarioID = @UsuarioID AND ProductoID = @ProductoID
              AND ISNULL(TallaSeleccionada,'') = ISNULL(@TallaSeleccionada,'')
              AND ISNULL(ColorSeleccionado,'') = ISNULL(@ColorSeleccionado,'')
        )
        BEGIN
            -- Incrementar cantidad
            UPDATE Carrito 
            SET Cantidad = Cantidad + @Cantidad, FechaAgregado = GETDATE()
            WHERE UsuarioID = @UsuarioID AND ProductoID = @ProductoID
              AND ISNULL(TallaSeleccionada,'') = ISNULL(@TallaSeleccionada,'')
              AND ISNULL(ColorSeleccionado,'') = ISNULL(@ColorSeleccionado,'');
        END
        ELSE
        BEGIN
            -- Agregar nuevo item al carrito
            INSERT INTO Carrito (UsuarioID, ProductoID, Cantidad, TallaSeleccionada, ColorSeleccionado)
            VALUES (@UsuarioID, @ProductoID, @Cantidad, @TallaSeleccionada, @ColorSeleccionado);
        END

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        RAISERROR('Error al agregar al carrito', 16, 1);
    END CATCH
END;
GO

-- PROCEDIMIENTO: sp_ObtenerCarrito
-- PROPÓSITO: Obtener todos los items del carrito de un usuario
CREATE OR ALTER PROCEDURE sp_ObtenerCarrito
    @UsuarioID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Retornar items del carrito con información del producto
    SELECT c.CarritoID, c.ProductoID, p.Nombre, p.PrecioVenta, c.Cantidad,
           c.TallaSeleccionada, c.ColorSeleccionado,
           (p.PrecioVenta * c.Cantidad) AS Subtotal, p.ImagenPrincipal,
           c.FechaAgregado
    FROM Carrito c
    INNER JOIN Productos p ON c.ProductoID = p.ProductoID
    WHERE c.UsuarioID = @UsuarioID
    ORDER BY c.FechaAgregado DESC;

    -- Retornar total del carrito
    SELECT SUM(p.PrecioVenta * c.Cantidad) AS Total
    FROM Carrito c
    INNER JOIN Productos p ON c.ProductoID = p.ProductoID
    WHERE c.UsuarioID = @UsuarioID;
END;
GO

-- PROCEDIMIENTO: sp_CrearPedido
-- PROPÓSITO: Crear un pedido desde el carrito (transaccional)
CREATE OR ALTER PROCEDURE sp_CrearPedido
    @ClienteID INT,
    @NombreCliente NVARCHAR(100),
    @EmailCliente NVARCHAR(100),
    @TelefonoCliente NVARCHAR(20),
    @DireccionEnvio NVARCHAR(255),
    @Ciudad NVARCHAR(100),
    @MetodoPago NVARCHAR(50),
    @Descuento DECIMAL(18,2) = 0,
    @Envio DECIMAL(18,2) = 0,
    @Notas NVARCHAR(MAX) = NULL,
    @PedidoID INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        DECLARE @Subtotal DECIMAL(18,2) = 0;
        DECLARE @Total DECIMAL(18,2) = 0;

        -- Calcular subtotal desde carrito
        SELECT @Subtotal = SUM(c.Cantidad * p.PrecioVenta)
        FROM Carrito c
        INNER JOIN Productos p ON c.ProductoID = p.ProductoID
        WHERE c.UsuarioID = @ClienteID;

        IF @Subtotal IS NULL SET @Subtotal = 0;
        SET @Total = @Subtotal - @Descuento + @Envio;

        -- Crear pedido
        INSERT INTO Pedidos (
            ClienteID, NombreCliente, EmailCliente, TelefonoCliente,
            DireccionEnvio, Ciudad, MetodoPago, Subtotal, Descuento, Envio, Total, Notas
        )
        VALUES (
            @ClienteID, @NombreCliente, @EmailCliente, @TelefonoCliente,
            @DireccionEnvio, @Ciudad, @MetodoPago, @Subtotal, @Descuento, @Envio, @Total, @Notas
        );
        SET @PedidoID = SCOPE_IDENTITY();

        -- Copiar detalles desde carrito a pedido
        INSERT INTO PedidoDetalles (PedidoID, ProductoID, TallaID, ColorID, Cantidad, PrecioUnitario, Subtotal)
        SELECT 
            @PedidoID, 
            c.ProductoID, 
            NULL, NULL, 
            c.Cantidad, 
            p.PrecioVenta, 
            c.Cantidad * p.PrecioVenta
        FROM Carrito c
        INNER JOIN Productos p ON c.ProductoID = p.ProductoID
        WHERE c.UsuarioID = @ClienteID;

        -- Actualizar stock
        UPDATE Productos 
        SET Stock = Stock - c.Cantidad
        FROM Productos p
        INNER JOIN Carrito c ON p.ProductoID = c.ProductoID
        WHERE c.UsuarioID = @ClienteID;

        -- Limpiar carrito
        DELETE FROM Carrito WHERE UsuarioID = @ClienteID;

        -- Registrar la venta
        INSERT INTO Ventas (ClienteID, FechaVenta, Subtotal, Descuento, Envio, Total, Estado, MetodoPago)
        VALUES (@ClienteID, GETDATE(), @Subtotal, @Descuento, @Envio, @Total, 'Completada', @MetodoPago);

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        RAISERROR('Error al crear pedido', 16, 1);
    END CATCH
END;
GO

-- PROCEDIMIENTO: sp_ActualizarEstadoPedido
-- PROPÓSITO: Actualizar el estado de un pedido y registrar auditoría
CREATE OR ALTER PROCEDURE sp_ActualizarEstadoPedido
    @PedidoID INT,
    @NuevoEstado NVARCHAR(20),
    @Notas NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        DECLARE @EstadoAnterior NVARCHAR(20);
        DECLARE @ClienteID INT;

        SELECT @EstadoAnterior = Estado, @ClienteID = ClienteID FROM Pedidos WHERE PedidoID = @PedidoID;

        UPDATE Pedidos 
        SET Estado = @NuevoEstado, 
            Notas = ISNULL(@Notas, Notas),
            FechaActualizacion = GETDATE()
        WHERE PedidoID = @PedidoID;

        -- Registrar cambio en auditoría
        INSERT INTO AuditoriaPerfil (UsuarioID, TipoCambio, CampoModificado, ValorAnterior, ValorNuevo, Origen)
        VALUES (@ClienteID, 'pedido', 'Estado', @EstadoAnterior, @NuevoEstado, 'sistema');

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        RAISERROR('Error al actualizar pedido', 16, 1);
    END CATCH
END;
GO

-- PROCEDIMIENTO: sp_CreateProveedor
-- PROPÓSITO: Insertar un nuevo proveedor
CREATE OR ALTER PROCEDURE sp_CreateProveedor
    @Nombre NVARCHAR(200),
    @Contacto NVARCHAR(100) = NULL,
    @Email NVARCHAR(100) = NULL,
    @Telefono NVARCHAR(50) = NULL,
    @Documento NVARCHAR(50) = NULL,
    @ProveedorID INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Proveedores (Nombre, Contacto, Email, Telefono, Documento)
    VALUES (@Nombre, @Contacto, @Email, @Telefono, @Documento);
    SET @ProveedorID = SCOPE_IDENTITY();
END;
GO

-- PROCEDIMIENTO: sp_CreateCompra
-- PROPÓSITO: Registrar compra y sus detalles, actualizar stock y registrar movimiento
CREATE OR ALTER PROCEDURE sp_CreateCompra
    @ProveedorID INT,
    @OrdenFactura NVARCHAR(50),
    @Fecha DATETIME,
    @Total DECIMAL(18,2),
    @Notas NVARCHAR(MAX) = NULL,
    @CompraID INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        INSERT INTO Compras (ProveedorID, OrdenFactura, Fecha, Total, Estado, Notas)
        VALUES (@ProveedorID, @OrdenFactura, @Fecha, @Total, 'Activa', @Notas);
        SET @CompraID = SCOPE_IDENTITY();
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        RAISERROR('Error al crear compra', 16, 1);
    END CATCH;
END;
GO

-- PROCEDIMIENTO: sp_AnularCompra
-- PROPÓSITO: Cambiar estado a anulada (podría revertir stock externamente)
CREATE OR ALTER PROCEDURE sp_AnularCompra
    @CompraID INT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Compras SET Estado='Anulada' WHERE CompraID=@CompraID;
END;
GO

-- PROCEDIMIENTO: sp_RegistarStockMovimiento
-- PROPÓSITO: Agregar registro de movimiento de inventario
CREATE OR ALTER PROCEDURE sp_RegistrarStockMovimiento
    @ProductoID INT,
    @Cantidad INT,
    @Tipo NVARCHAR(20), -- 'entrada' o 'salida'
    @ReferenciaTipo NVARCHAR(50) = NULL,
    @ReferenciaID INT = NULL,
    @UsuarioID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO StockMovimientos (ProductoID, Cantidad, Tipo, ReferenciaTipo, ReferenciaID, UsuarioID)
    VALUES (@ProductoID, @Cantidad, @Tipo, @ReferenciaTipo, @ReferenciaID, @UsuarioID);
    -- actualizar stock en productos
    IF @Tipo='entrada'
        UPDATE Productos SET Stock=Stock+@Cantidad WHERE ProductoID=@ProductoID;
    ELSE IF @Tipo='salida'
        UPDATE Productos SET Stock=Stock-@Cantidad WHERE ProductoID=@ProductoID;
END;
GO

-- =====================================================
-- ═══════════════════════════════════════════════════
-- 8. TRIGGERS PARA AUDITORÍA
-- ═══════════════════════════════════════════════════
-- =====================================================

-- TRIGGER: Auditar cambios en el perfil de Usuarios
IF OBJECT_ID('trg_Usuarios_Auditar', 'TR') IS NULL
EXEC('CREATE TRIGGER trg_Usuarios_Auditar ON Usuarios AFTER UPDATE AS BEGIN SET NOCOUNT ON; END');
GO
ALTER TRIGGER trg_Usuarios_Auditar ON Usuarios
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    -- Registrar cambios en email
    IF UPDATE(Email)
    BEGIN
        INSERT INTO AuditoriaPerfil (UsuarioID, TipoCambio, CampoModificado, ValorAnterior, ValorNuevo, Origen)
        SELECT i.UsuarioID, 'email', 'Email', d.Email, i.Email, 'automatico'
        FROM INSERTED i INNER JOIN DELETED d ON i.UsuarioID = d.UsuarioID
        WHERE ISNULL(d.Email,'') <> ISNULL(i.Email,'');
    END

    -- Registrar cambios en teléfono
    IF UPDATE(Telefono)
    BEGIN
        INSERT INTO AuditoriaPerfil (UsuarioID, TipoCambio, CampoModificado, ValorAnterior, ValorNuevo, Origen)
        SELECT i.UsuarioID, 'telefono', 'Telefono', d.Telefono, i.Telefono, 'automatico'
        FROM INSERTED i INNER JOIN DELETED d ON i.UsuarioID = d.UsuarioID
        WHERE ISNULL(d.Telefono,'') <> ISNULL(i.Telefono,'');
    END

    -- Registrar cambios en dirección
    IF UPDATE(Direccion)
    BEGIN
        INSERT INTO AuditoriaPerfil (UsuarioID, TipoCambio, CampoModificado, ValorAnterior, ValorNuevo, Origen)
        SELECT i.UsuarioID, 'direccion', 'Direccion', d.Direccion, i.Direccion, 'automatico'
        FROM INSERTED i INNER JOIN DELETED d ON i.UsuarioID = d.UsuarioID
        WHERE ISNULL(d.Direccion,'') <> ISNULL(i.Direccion,'');
    END
END;
GO

-- =====================================================
-- ═══════════════════════════════════════════════════
-- 9. DATOS INICIALES (SEED)
-- ═══════════════════════════════════════════════════
-- =====================================================

-- Crear roles
IF NOT EXISTS (SELECT 1 FROM Roles WHERE Nombre = 'Admin')
    INSERT INTO Roles (Nombre, Descripcion, Estado) VALUES ('Admin', 'Administrador del sistema', 'activo');

IF NOT EXISTS (SELECT 1 FROM Roles WHERE Nombre = 'Empleado')
    INSERT INTO Roles (Nombre, Descripcion, Estado) VALUES ('Empleado', 'Empleado de tienda', 'activo');

IF NOT EXISTS (SELECT 1 FROM Roles WHERE Nombre = 'Cliente')
    INSERT INTO Roles (Nombre, Descripcion, Estado) VALUES ('Cliente', 'Cliente final', 'activo');

-- Crear marcas
IF NOT EXISTS (SELECT 1 FROM Marcas WHERE Nombre = 'Selenne')
    INSERT INTO Marcas (Nombre, Logo, SitioWeb) VALUES ('Selenne', NULL, 'https://selenne.com');

IF NOT EXISTS (SELECT 1 FROM Marcas WHERE Nombre = 'Premium Style')
    INSERT INTO Marcas (Nombre, Logo, SitioWeb) VALUES ('Premium Style', NULL, 'https://premiumstyle.com');

-- Crear tallas
IF NOT EXISTS (SELECT 1 FROM Tallas WHERE Nombre = 'XS')
    INSERT INTO Tallas (Nombre, Orden) VALUES ('XS',1),('S',2),('M',3),('L',4),('XL',5),('XXL',6);

-- Crear colores
IF NOT EXISTS (SELECT 1 FROM Colores WHERE Nombre = 'Negro')
    INSERT INTO Colores (Nombre, CodigoHex) VALUES 
        ('Negro','#000000'),('Blanco','#FFFFFF'),('Rojo','#FF0000'),
        ('Azul','#0000FF'),('Verde','#00FF00'),('Amarillo','#FFFF00');

-- Crear materiales
IF NOT EXISTS (SELECT 1 FROM Materiales WHERE Nombre = 'Algodón')
    INSERT INTO Materiales (Nombre, Descripcion) VALUES 
        ('Algodón','Fibra natural transpirable'),
        ('Poliéster','Fibra sintética resistente'),
        ('Lino','Fibra natural elegante'),
        ('Seda','Fibra natural lujosa');

-- Crear categorías
IF NOT EXISTS (SELECT 1 FROM CategoriasPrincipales WHERE Nombre = 'Damas')
    INSERT INTO CategoriasPrincipales (Nombre, Descripcion, Estado) VALUES 
        ('Damas','Productos para mujeres','activo'),
        ('Caballeros','Productos para hombres','activo'),
        ('Accesorios','Complementos y accesorios','activo');

-- Crear tipos de producto
IF NOT EXISTS (SELECT 1 FROM TiposProducto WHERE Nombre = 'Camiseta')
    INSERT INTO TiposProducto (Nombre, Descripcion, Estado) VALUES 
        ('Camiseta','Prenda de vestir casual','activo'),
        ('Pantalón','Prenda para piernas','activo'),
        ('Vestido','Prenda elegante','activo'),
        ('Chaqueta','Abrigo superior','activo');

GO

-- =====================================================
-- FIN DEL SCRIPT
-- Fecha: 26 de febrero de 2026
-- Versión 4.0 - Base de datos simplificada y optimizada
-- =====================================================
