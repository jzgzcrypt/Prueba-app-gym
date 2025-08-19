# 🚀 Cómo Ejecutar la Aplicación en Localhost

## Requisitos Previos

1. **Node.js** instalado (versión 18 o superior)
2. **Git** instalado (para clonar el repositorio)

## Pasos para Ejecutar en Localhost

### 1️⃣ Clonar el Repositorio

```bash
# Si tienes el repositorio en GitHub
git clone [URL_DE_TU_REPOSITORIO]
cd [NOMBRE_DEL_PROYECTO]

# O descarga el código desde Vercel
vercel pull
```

### 2️⃣ Instalar Dependencias

```bash
npm install
```

### 3️⃣ Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
# Configuración de la base de datos Neon
DATABASE_URL=postgresql://neondb_owner:npg_nJCyr09LfDwW@ep-long-tooth-ab982wky-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require

# Configuración adicional de Neon
DATABASE_URL_UNPOOLED=postgresql://neondb_owner:npg_nJCyr09LfDwW@ep-long-tooth-ab982wky.eu-west-2.aws.neon.tech/neondb?sslmode=require
PGHOST=ep-long-tooth-ab982wky-pooler.eu-west-2.aws.neon.tech
PGUSER=neondb_owner
PGDATABASE=neondb
PGPASSWORD=npg_nJCyr09LfDwW
```

### 4️⃣ Ejecutar en Modo Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en: **http://localhost:3000**

## 📝 Scripts Disponibles

```bash
# Desarrollo (con hot reload)
npm run dev

# Construir para producción
npm run build

# Ejecutar versión de producción
npm run start

# Verificar conexión con base de datos
node scripts/test-connection.js

# Probar operaciones de base de datos
node scripts/test-db-operations.js
```

## 🔧 Solución de Problemas Comunes

### Error: "Cannot find module '@neondatabase/serverless'"

```bash
# Instalar dependencia faltante
npm install @neondatabase/serverless
```

### Error: "DATABASE_URL no está configurada"

```bash
# Verificar que existe el archivo .env.local
ls -la | grep .env

# Si no existe, créalo con las credenciales
echo 'DATABASE_URL=postgresql://neondb_owner:npg_nJCyr09LfDwW@ep-long-tooth-ab982wky-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require' > .env.local
```

### Error: "Port 3000 is already in use"

```bash
# Opción 1: Matar el proceso en el puerto 3000
npx kill-port 3000

# Opción 2: Usar otro puerto
PORT=3001 npm run dev
```

### Error de CSS o estilos

```bash
# Limpiar caché de Next.js
rm -rf .next
npm run dev
```

## 🖥️ Estructura de Comandos Completa

```bash
# 1. Clonar o descargar el proyecto
git clone [tu-repositorio]
cd [tu-proyecto]

# 2. Instalar dependencias
npm install

# 3. Crear archivo de configuración
cat > .env.local << 'EOF'
DATABASE_URL=postgresql://neondb_owner:npg_nJCyr09LfDwW@ep-long-tooth-ab982wky-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require
DATABASE_URL_UNPOOLED=postgresql://neondb_owner:npg_nJCyr09LfDwW@ep-long-tooth-ab982wky.eu-west-2.aws.neon.tech/neondb?sslmode=require
PGHOST=ep-long-tooth-ab982wky-pooler.eu-west-2.aws.neon.tech
PGUSER=neondb_owner
PGDATABASE=neondb
PGPASSWORD=npg_nJCyr09LfDwW
EOF

# 4. Ejecutar en desarrollo
npm run dev

# 5. Abrir en el navegador
# Automáticamente se abrirá en http://localhost:3000
```

## ✅ Verificación

Una vez ejecutando, deberías ver:

```
▲ Next.js 15.x.x
- Local:        http://localhost:3000
- Environments: .env.local

✓ Starting...
✓ Ready in 2s
```

## 🌐 URLs Disponibles en Localhost

- **Dashboard Principal**: http://localhost:3000
- **Test de Base de Datos**: http://localhost:3000/test-db
- **Test Simple**: http://localhost:3000/test-simple

## 💡 Tips Adicionales

1. **Hot Reload**: Los cambios en el código se reflejan automáticamente
2. **DevTools**: Usa las herramientas de desarrollo del navegador (F12)
3. **Logs**: Revisa la terminal para ver logs del servidor
4. **Base de Datos**: Los datos se sincronizan con Neon en tiempo real

## 🔐 Seguridad

⚠️ **IMPORTANTE**:
- No subas `.env.local` a Git
- Agrega `.env.local` a `.gitignore`
- Las credenciales son las mismas que en Vercel

## 📱 Acceso desde Dispositivos Móviles

Para probar desde tu móvil en la misma red:

1. Encuentra tu IP local:
```bash
# En Mac/Linux
ifconfig | grep inet

# En Windows
ipconfig
```

2. Accede desde tu móvil:
```
http://[TU_IP_LOCAL]:3000
# Ejemplo: http://192.168.1.100:3000
```

---

¡Listo! Ya puedes desarrollar y probar localmente 🚀