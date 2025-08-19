# 🏋️ Gym Tracker - Aplicación de Seguimiento de Gimnasio

Una aplicación moderna y funcional para el seguimiento de entrenamientos, peso, cardio y NEAT (Non-Exercise Activity Thermogenesis).

## 🚀 Características

### 📊 Dashboard Principal
- **Registro de NEAT**: Actividad física no estructurada (pasos, cinta)
- **Seguimiento de Cardio**: Sesiones de cardio con tipo, duración e intensidad
- **Registro de Peso**: Seguimiento diario del peso corporal
- **Medidas Corporales**: Seguimiento semanal de medidas (cintura, porcentaje graso)
- **Entrenamientos**: Registro de sesiones de entrenamiento con ejercicios

### 📂 Funcionalidades Adicionales
- **Visualización del Mesociclo**: Vista macro de semanas de entrenamiento
- **Historial de Progresos**: Gráficas y análisis de evolución
- **Configuración**: Parámetros de usuario y personalización

## 🛠️ Stack Tecnológico

- **Frontend & Backend**: TypeScript + JavaScript
- **Framework**: Next.js 15
- **Base de Datos**: Neon (PostgreSQL en cloud)
- **UI**: TailwindCSS
- **Despliegue**: Vercel

## 📦 Instalación

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd gym-tracker
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.local.example .env.local
```

Editar `.env.local` con tus credenciales:
```env
DATABASE_URL="postgresql://username:password@host:port/database"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

4. **Configurar la base de datos**
```bash
# Ejecutar el esquema en Neon SQL Editor
cat database/schema.sql
```

5. **Ejecutar en desarrollo**
```bash
npm run dev
```

## 🗄️ Estructura de la Base de Datos

La aplicación utiliza las siguientes tablas principales:

- `users`: Usuarios del sistema
- `weights`: Registro de pesos diarios
- `cardio`: Sesiones de cardio
- `neat`: Actividad física no estructurada
- `seguimiento`: Medidas corporales semanales
- `workouts`: Entrenamientos completados
- `entrenos_no_programados`: Actividades deportivas adicionales
- `adherencia_diaria`: Seguimiento de cumplimiento diario

## 🎯 User Stories Implementadas

### Core - Dashboard Principal
- ✅ **US-01**: Registro de NEAT con histórico
- ✅ **US-02**: Seguimiento de cardio con análisis
- ✅ **US-03**: Registro de peso con gráfico de evolución
- ✅ **US-04**: Medidas corporales semanales
- ✅ **US-05**: Seguimiento de entrenamientos

### Extra - Menú Adicional
- 🔄 **US-06**: Visualización del mesociclo (en desarrollo)
- 🔄 **US-07**: Historial de progresos (en desarrollo)
- 🔄 **US-08**: Configuración de usuario (en desarrollo)

## 🧪 Testing

```bash
# Ejecutar tests unitarios
npm test

# Ejecutar tests de integración
npm run test:integration
```

## 🚀 Despliegue

### Vercel
1. Conectar el repositorio a Vercel
2. Configurar variables de entorno en el dashboard de Vercel
3. Desplegar automáticamente

### Variables de entorno requeridas
- `DATABASE_URL`: URL de conexión a Neon PostgreSQL

## 📱 Uso

1. **Dashboard Principal**: Acceso rápido a todas las funcionalidades
2. **Registro Diario**: Peso, cardio, NEAT y entrenamientos
3. **Seguimiento Semanal**: Medidas corporales (domingos)
4. **Historial**: Análisis de progreso y tendencias
5. **Configuración**: Personalización de la aplicación

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 🆘 Soporte

Para soporte técnico o preguntas, por favor abrir un issue en el repositorio.

---

**Desarrollado con ❤️ para la comunidad fitness**
