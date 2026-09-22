# Sistema 7K

Sistema personal de entrenamiento, salud y habilidades. No es una app de
gimnasio: es el sitio donde se decide qué toca hoy, se registra qué pasó de
verdad y se ajusta el plan a la realidad, semana a semana.

**Bloque en curso:** Base 7K — 21 sep a 6 dic 2026 · objetivo 7 km a 4:45/km.

**Para saber a dónde va esto y cómo seguir:** [`docs/EL-OBJETIVO.md`](docs/EL-OBJETIVO.md).

## Qué cubre hoy

| Área | Qué hace |
|---|---|
| **Running** | Sesiones con intervalos y cronómetro, ritmo real contra ritmo esperado |
| **Fuerza** | Sesiones guiadas, catálogo de ejercicios, pesos serie a serie con historial |
| **Cuello** | Protocolo de fisio diario en tres fases |
| **Movilidad** | Cuatro patrones en paralelo, cada uno con su test |
| **Técnica** | Cadencia y apoyo, repetición deliberada en cada carrera |
| **Magia** | Trucos de cartas con repaso espaciado: avanzas dominando |
| **Guerrero** | Cuatro pilares: calma, golpeo, mentalidad y aplicación |
| **Nutrición** | Tu menú, apuntar lo comido escribiéndolo, recálculo del día y la compra de la semana |
| **Coach** | Bitácora semanal, ajuste de fase, hitos, plan global, backup |
| **Progreso** | Medidas, ritmos y KPIs a lo largo del bloque |

## Arrancar

```bash
npm install
npm run dev        # http://localhost:3000
```

```bash
npm run build      # build de producción
npm run lint
npm run typecheck
```

## Dónde está cada cosa

```
src/
├── app/        Next.js App Router. Solo el envoltorio.
├── design/     Tokens de estilo. Único sitio donde cambiar el aspecto.
├── domain/     El plan y las reglas. Datos puros, sin React.
├── lib/        Persistencia con adaptador intercambiable.
└── features/   La UI, una carpeta por pantalla.
```

Las dependencias van en un solo sentido: `features` → `domain`. El dominio no
conoce la UI, y por eso sobrevive a los rediseños.

## Los datos

Se guardan hoy en el navegador (`localStorage`), a través de una capa que
permite cambiar el backend sin tocar ninguna pantalla. Tienen versión y
migración desde el primer día: un cambio de forma nunca puede perder historial.

**Copia de seguridad:** Coach → Ajustes → Exportar. Hazla. La Fase 2 traerá
cuenta y base de datos real; hasta entonces el historial vive en un solo
dispositivo.

## Documentación

| | |
|---|---|
| [`CHANGELOG.md`](CHANGELOG.md) | Cada cambio de la app, con su motivo |
| [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md) | Cómo está montada y por qué |
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | El plan por fases, hasta la app de vida |
| [`docs/DECISIONES.md`](docs/DECISIONES.md) | Las decisiones tomadas y su coste |
| [`docs/MEJORAS.md`](docs/MEJORAS.md) | Mejoras propuestas, cada una con la pregunta que responde |

## Hacia dónde va

El entrenamiento es el área desarrollada, pero el motor —proponer, registrar,
revisar, ajustar— no tiene nada de específico del deporte. El plan es
generalizarlo para que valga igual para idiomas, lectura, sueño o finanzas, sin
perder nada de lo registrado por el camino. Las fases están en el
[ROADMAP](docs/ROADMAP.md).
