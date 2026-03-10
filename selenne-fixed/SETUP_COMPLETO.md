# 🚀 GUÍA COMPLETA - CONFIGURACIÓN SELENNE BOUTIQUE

**Fecha**: 3 Marzo 2026  
**Versión**: 1.0  
**Status**: ✅ LISTO PARA IMPLEMENTAR

---

## 📋 ÍNDICE
1. [Paso 1: Crear Base de Datos](#paso-1-crear-base-de-datos)
2. [Paso 2: Generar Backend API](#paso-2-generar-backend-api)
3. [Paso 3: Configurar Backend](#paso-3-configurar-backend)
4. [Paso 4: Ejecutar Backend](#paso-4-ejecutar-backend)
5. [Paso 5: Conectar Frontend](#paso-5-conectar-frontend)

---

## PASO 1: Crear Base de Datos

### 1.1 Abrir SQL Server
```
⚙️ Opción A: SQL Server Management Studio
   - Busca "SQL Server Management Studio" en Windows
   - Conecta a: (localdb)\mssqllocaldb
   - Usuario/Contraseña: No requerido (Windows Auth)

⚙️ Opción B: Azure Data Studio (más moderno)
   - Descarga desde: https://docs.microsoft.com/es-es/sql/azure-data-studio/download
   - Conecta a: (localdb)\mssqllocaldb
```

### 1.2 Crear Base de Datos
```sql
-- En SQL Server, ejecuta ESTO PRIMERO:
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'SelenneDB')
BEGIN
    CREATE DATABASE SelenneDB;
END
GO

USE SelenneDB;
GO
```

### 1.3 Ejecutar DATABASE.sql
```
1. Abre el archivo: src/DATABASE.sql (desde el proyecto)
2. Copia TODO el contenido
3. En SQL Server, pega y ejecuta (Ctrl+A, F5 o botón Ejecutar)
4. Espera a que termine (2-3 segundos)
5. Verifica en el Explorador de Objetos:
   - BD "SelenneDB" debe tener 32 tablas
   - Si ves todas las tablas ✅, la BD está lista
```

**Tablas que debes ver:**
- Roles, Permissions, RolePermissions
- Usuarios, RefreshTokens, EmailVerifications, PasswordResetTokens, UserSessions, LoginAttempts
- CategoriasPrincipales, TiposProducto, Marcas, Tallas, Colores, Materiales
- Productos, ProductoImagenes, ProductoTallas, ProductoColores, ProductoMateriales
- Carrito, Pedidos, PedidoDetalles, Ventas, VentaDetalles
- Favoritos, Valoraciones
- Proveedores, Compras, CompraDetalles, StockMovimientos
- AuditoriaPerfil

---

## PASO 2: Generar Backend API

### 2.1 Copiar Prompt
```
1. Abre: PROMPT_GENERAR_API_COMPLETA.md (en el proyecto)
2. Copia TODO el contenido (Ctrl+A, Ctrl+C)
```

### 2.2 Generar con Claude
```
1. Ve a: https://claude.ai
2. Inicia sesión
3. Crea una nueva conversación
4. Pega el contenido del PROMPT_GENERAR_API_COMPLETA.md
5. Al final del prompt, añade este mensaje:

---
Genera un proyecto ASP.NET Core 8 llamado "SelenneApi" que sea:
✅ 100% FUNCIONAL
✅ LISTO PARA EJECUTAR (dotnet run)
✅ SIN ERRORES DE COMPILACIÓN
✅ CON BD SQL SERVER INTEGRADA
✅ CON SWAGGER FUNCIONANDO

IMPORTANTE: 
- NO generes migraciones (la BD ya existe en DATABASE.sql)
- Genera Entity Models basados en las 32 tablas existentes
- AppDbContext solo debe hacer CanConnect(), no EnsureCreated()
- Todos los Controllers y Services
---

6. Envía el mensaje
7. Espera a que Claude termine (5-10 minutos)
8. Copia TODOS los archivos generados
```

---

## PASO 3: Configurar Backend

### 3.1 Crear Carpeta
```powershell
# En Windows PowerShell (Administrator):
cd "c:\Users\Usuario\Downloads\Selenne Boutique Authentication UI (Community)\Selenne Boutique Authentication UI (Community)"
mkdir Backend
mkdir Backend\SelenneApi
```

### 3.2 Copiar Archivos
```
1. Claude generará muchos archivos en un formato de texto
2. Copia TODO el código
3. Crea la estructura en Backend/SelenneApi/:

Backend/SelenneApi/
├── Program.cs
├── appsettings.json
├── appsettings.Development.json
├── SelenneApi.csproj
├── Controllers/
│   ├── AuthController.cs
│   ├── UsuariosController.cs
│   ├── ProductosController.cs
│   ├── CarritoController.cs
│   ├── PedidosController.cs
│   ├── NotificacionesController.cs
│   ├── RolesController.cs
│   └── AdminController.cs
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
├── Data/
│   ├── AppDbContext.cs
│   └── SeedData.cs
├── Models/
│   ├── Entities/ (todas las entidades)
│   └── DTOs/ (todos los DTOs)
├── Middleware/
│   ├── ErrorHandlingMiddleware.cs
│   └── RateLimitingMiddleware.cs
├── Repositories/
│   ├── IRepository.cs
│   ├── IUsuarioRepository.cs
│   ├── UsuarioRepository.cs
│   ├── IProductoRepository.cs
│   ├── ProductoRepository.cs
│   ├── IPedidoRepository.cs
│   └── PedidoRepository.cs
├── Utilities/
│   ├── PermissionHelper.cs
│   ├── JwtHelper.cs
│   └── EncryptionHelper.cs
└── Exceptions/
    ├── UnauthorizedException.cs
    ├── ForbiddenException.cs
    └── ValidationException.cs
```

### 3.3 Validar Estructura
```powershell
cd Backend/SelenneApi
# Verifica que exista: SelenneApi.csproj
ls
```

---

## PASO 4: Ejecutar Backend

### 4.1 Compilar
```powershell
cd "Backend\SelenneApi"
dotnet build
```

**Debe mostrar:** `Build succeeded. 0 Warning(s)`

### 4.2 Ejecutar
```powershell
dotnet run
```

**Debe mostrar algo como:**
```
info: Microsoft.Hosting.Lifetime[14]
      Now listening on: http://localhost:5000
      Now listening on: https://localhost:5001
```

### 4.3 Verificar Swagger
```
1. Abre en navegador: http://localhost:5000/swagger
2. Debe ver lista de endpoints (Auth, Usuarios, Productos, etc.)
3. Si ves el Swagger ✅, el backend está funcionando
```

---

## PASO 5: Conectar Frontend

### 5.1 Crear archivo .env
```
Crea archivo: .env (en la raíz del proyecto frontend)

Contenido:
VITE_API_BASE_URL=http://localhost:5000
```

### 5.2 Revisar código Frontend
Los Contexts ya están preparados para usar la API:

```typescript
// src/contexts/AuthContext.tsx - ya tiene:
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Los services hacen peticiones a:
// http://localhost:5000/api/auth/login
// http://localhost:5000/api/auth/signup
// http://localhost:5000/api/usuarios
// etc.
```

### 5.3 Ejecutar Frontend
```powershell
# Desde raíz del proyecto frontend
npm run dev

# Debe mostrar:
# VITE v5.x.x  ready in xxx ms
# ➜  Local:   http://localhost:5173/
```

### 5.4 Verificar Conexión
```
1. Abre: http://localhost:5173
2. Intenta registrarte o login
3. Si funciona ✅, frontend y backend están conectados
```

---

## ✅ CHECKLIST FINAL

- [ ] BD "SelenneDB" creada con 32 tablas
- [ ] DATABASE.sql ejecutado exitosamente
- [ ] PROMPT_GENERAR_API_COMPLETA.md copiado a Claude
- [ ] Backend generado y archivos copiados a Backend/SelenneApi/
- [ ] `dotnet build` compila sin errores
- [ ] `dotnet run` ejecuta sin errores
- [ ] Swagger visible en http://localhost:5000/swagger
- [ ] .env configurado con VITE_API_BASE_URL
- [ ] `npm run dev` ejecuta frontend
- [ ] http://localhost:5173 carga correctamente
- [ ] Login/Signup responden desde la API

---

## 🔧 TROUBLESHOOTING

### Error: "Cannot connect to database"
```
Solución:
1. Verifica que SQL Server está corriendo
2. Verifica ConnectionString en appsettings.json:
   "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=SelenneDb;..."
3. Verifica que ejecutaste DATABASE.sql
```

### Error: "Port 5000 already in use"
```powershell
# Mata el proceso:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# O usa otro puerto en Program.cs:
app.Run("http://localhost:5001");
```

### Error: "CORS error when calling API"
```
Asegúrate que Program.cs tenga:
app.UseCors("AllowLocalhost");

Y en Startup:
services.AddCors(options =>
{
    options.AddPolicy("AllowLocalhost", builder =>
    {
        builder.WithOrigins("http://localhost:5173")
               .AllowAnyMethod()
               .AllowAnyHeader();
    });
});
```

### Error: "JWT token invalid"
```
Verifica en appsettings.json:
"SecretKey": "SuClaveSecretaMuylargaAquíAlMenos32Caracteres"

Debe tener al menos 32 caracteres
```

---

## 📞 CONTACTO / AYUDA

Si algo no funciona:
1. Verifica que seguiste TODOS los pasos en orden
2. Revisa los logs en la consola (PowerShell y Terminal del backend)
3. Verifica que los puertos 5000 (backend) y 5173 (frontend) están libres
4. Intenta nuevamente desde el PASO 1

---

**Proyecto listo para desarrollo full-stack** ✅  
**Frontend**: http://localhost:5173  
**Backend**: http://localhost:5000  
**Swagger API**: http://localhost:5000/swagger
