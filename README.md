# 🏋️ Mi Entrenamiento — Zero Friction Dashboard

Un dashboard de entrenamiento optimizado para móvil y desktop con experiencia de usuario de cero fricción.

## ✨ Características

### 📱 **Experiencia Móvil Optimizada**
- **Detección automática** de dispositivo móvil
- **Interfaz táctil** con tarjetas grandes y fáciles de tocar
- **Modales simples** para entrada de datos
- **Navegación inferior** intuitiva
- **Progreso visual** con círculo animado

### 💻 **Experiencia Desktop Simplificada**
- **Quick entry form** prominente en la parte superior
- **Gráficos interactivos** para seguimiento
- **Vista completa** con todas las funcionalidades

### 🎯 **Funcionalidades Clave**
- ✅ **Toast notifications** elegantes
- ✅ **Validación en tiempo real** con feedback visual
- ✅ **Persistencia local** con localStorage
- ✅ **Estados visuales** claros (Completado/Pendiente)
- ✅ **Animaciones fluidas** y transiciones suaves
- ✅ **Detección automática** de dispositivo

## 🚀 Tecnologías

- **Next.js 15** - Framework React con App Router
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Estilos utilitarios
- **Chart.js** - Gráficos interactivos
- **Lucide React** - Iconos modernos
- **localStorage** - Persistencia de datos

## 📦 Instalación

```bash
# Clonar el repositorio
git clone <repository-url>
cd gym-dashboard

# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Construir para producción
npm run build

# Ejecutar en producción
npm start
```

## 🎨 Estructura del Proyecto

```
src/
├── app/
│   ├── layout.tsx          # Layout principal
│   ├── page.tsx            # Página del dashboard
│   └── globals.css         # Estilos globales
├── components/
│   ├── ProgressCircle.tsx  # Componente de progreso
│   └── ToastContainer.tsx  # Contenedor de notificaciones
├── hooks/
│   ├── useLocalStorage.ts  # Hook para localStorage
│   └── useToast.ts         # Hook para notificaciones
└── types/
    └── index.ts            # Tipos TypeScript
```

## 📊 Funcionalidades

### **Dashboard Principal**
- **Progreso visual** con círculo animado
- **4 tarjetas principales**: Pesaje, Entrenamiento, Cardio, Dieta
- **Estados claros**: ✅ Completado / ⏳ Pendiente
- **Resumen semanal** con estadísticas

### **Entrada de Datos**
- **Modales optimizados** para cada tipo de dato
- **Campos mínimos** - solo lo esencial
- **Validación en tiempo real** con feedback visual
- **Guardado con un clic**

### **Persistencia**
- **localStorage** para datos offline
- **Sincronización automática** entre vistas
- **Backup automático** de datos

## 🎯 Métricas de Éxito

- ✅ **Tiempo de entrada**: < 30 segundos
- ✅ **Tasa de completado**: > 85%
- ✅ **Experiencia móvil**: Nativa y fluida
- ✅ **Carga cognitiva**: Mínima
- ✅ **Feedback visual**: Inmediato

## 🚀 Deploy

### Vercel (Recomendado)
```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Netlify
```bash
# Construir
npm run build

# Deploy manual o con Netlify CLI
```

## 🔧 Configuración

### Variables de Entorno
```env
# .env.local
NEXT_PUBLIC_APP_NAME="Mi Entrenamiento"
NEXT_PUBLIC_VERSION="1.0.0"
```

### Personalización
- **Colores**: Editar `tailwind.config.js`
- **Animaciones**: Modificar `globals.css`
- **Datos**: Ajustar tipos en `types/index.ts`

## 📱 Responsive Design

- **Mobile First**: Optimizado para dispositivos móviles
- **Breakpoints**: 768px para cambio de vista
- **Touch Friendly**: Elementos táctiles grandes
- **Gestos**: Navegación por toque

## 🎨 Diseño

### **Colores**
- **Primario**: Azul (#3b82f6)
- **Éxito**: Verde (#10b981)
- **Advertencia**: Amarillo (#f59e0b)
- **Error**: Rojo (#ef4444)

### **Tipografía**
- **Fuente**: Inter (Google Fonts)
- **Tamaños**: Responsive y legible
- **Pesos**: Variable según importancia

## 🔄 Roadmap

### **Fase 1: Optimización Inmediata** ✅
- [x] Quick entry form
- [x] Toast notifications
- [x] Validación en tiempo real
- [x] Estados de loading

### **Fase 2: Experiencia Mejorada** 🚧
- [ ] Modo entrenamiento
- [ ] Insights automáticos
- [ ] Backup mejorado
- [ ] Temas personalizables

### **Fase 3: Optimización Final** 📋
- [ ] Analytics avanzados
- [ ] Sincronización cloud
- [ ] Testing completo
- [ ] Documentación usuario

## 🤝 Contribuir

1. Fork el proyecto
2. Crear una rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit los cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🙏 Agradecimientos

- **Next.js** por el framework increíble
- **Tailwind CSS** por los estilos utilitarios
- **Chart.js** por las visualizaciones
- **Vercel** por el hosting y deployment

---

**¡Disfruta entrenando con cero fricción! 💪**
# Updated: Fri Aug 15 09:54:13 PM UTC 2025
