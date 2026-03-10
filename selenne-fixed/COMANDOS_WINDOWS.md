# Comandos para Windows (PowerShell)

## ⚠️ En PowerShell NO uses `rm -rf` ni `rmdir /s /q` — usa estos comandos:

### Eliminar node_modules / dist / build:
```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item -Recurse -Force dist
Remove-Item -Recurse -Force build
```

### Instalar dependencias:
```powershell
npm install
```

### Correr el proyecto:
```powershell
npm run dev
```

### Abrir en el navegador:
http://localhost:3000

### Asegúrate que el backend esté corriendo en:
http://localhost:5000
(configurado en el archivo .env como VITE_API_BASE_URL)
