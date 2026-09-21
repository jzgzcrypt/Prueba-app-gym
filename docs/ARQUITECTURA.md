# Arquitectura

## La regla de las tres capas

La app está partida en tres capas y **las dependencias van siempre en una sola
dirección**: `features` → `domain` → (nada). `design` es hoja: no importa nada.

```
src/
├── app/        Next.js App Router. Solo el envoltorio: una ruta que monta <App/>.
├── design/     Tokens: color, espaciado, tipografía, radios. No importa nada.
├── domain/     QUÉ es el sistema. Datos y reglas puras. Cero React, cero DOM.
├── lib/        Infraestructura. Hoy: persistencia.
└── features/   La UI, una carpeta por pantalla.
```

La razón de la regla es simple: `domain` es lo que debe sobrevivir a los
rediseños. Si el dominio importase un componente, cambiar la UI obligaría a
tocar el plan de entrenamiento, y eso es exactamente lo que ha hundido a la
versión anterior de esta app.

### `domain/` — qué es el sistema

```
domain/
├── plan/
│   ├── bloque-1-base-7k.js   El bloque en curso: 11 semanas, día a día.
│   └── calendario.js         Fechas, día de hoy, lista plana de días.
├── running/     Curva de ritmo esperado, conversión de ritmos, frases.
├── fuerza/      Catálogo de ejercicios, enfoque por grupo, parseo de series.
├── salud/       Cuello (protocolo de fisio), movilidad, patrones, técnica.
├── habilidades/ Magia (trucos) y Guerrero (pilares).
├── nutricion/
│   ├── dias.js       La regla del día (COMER / RECORTAR) y los macros objetivo.
│   ├── menu-dia.js   Tu menú, editable: comidas, ingredientes y gramos.
│   ├── alimentos.js  La despensa e intercambiar un alimento por otro.
│   ├── escribir.js   Entiende lo que escribes que has comido.
│   ├── cantina.js    Platos de comedor: vocabulario para reconocerlos.
│   ├── cuadrar.js    El recálculo: ajusta lo que queda a lo que has comido.
│   └── menus.js      Los programas del dietista de 2022, como referencia.
└── assets/      Iconos embebidos.
```

Todo esto son constantes y funciones puras. Se pueden leer, probar y cambiar
sin abrir la app. Ninguna de estas funciones toca el estado del usuario: dado
`(semana, día)` devuelven **qué toca**, nunca **qué se ha hecho**.

### `lib/storage/` — dónde viven los datos

Es la pieza que hace que la app pueda durar años, y merece entenderse bien.

```
storage/
├── adaptador.js        El contrato: get / set / list / borrar.
├── adaptador-local.js  Implementación sobre localStorage (la de hoy).
├── esquema.js          Versión del estado guardado y sus migraciones.
└── index.js            Elige el adaptador. Es lo único que importa la app.
```

Dos ideas, y solo dos:

**1. La app no sabe dónde se guarda.** Ninguna pantalla llama a `localStorage`.
Todas hablan con `storage`. Cambiar de localStorage a Postgres es reescribir
`index.js` para que exporte otro adaptador. Ninguna pantalla se entera.

**2. Los datos guardados tienen versión.** `migrar()` se ejecuta siempre al
cargar y al importar un backup. Cuando la forma de los datos cambie —y va a
cambiar muchas veces en años— se sube `VERSION_ESQUEMA` y se escribe el paso de
migración. Nunca se renombra ni se borra un campo sin su migración.

### `features/` — la UI

Una carpeta por pantalla, más `features/ui/` para lo compartido. `App.jsx` es
el único componente con estado real: tiene todo el estado del usuario y lo baja
por props. Es deliberado para esta fase — hay un único sitio donde mirar cuando
algo no cuadra— y es también el primer límite que se va a notar: está anotado
como deuda conocida en el ROADMAP, Fase 1.

## Cómo fluye un dato, de punta a punta

Marcar el entrenamiento de hoy como hecho:

1. `HoyScreen` llama a `toggleCheck(dayKey)`, que le llegó por props.
2. `App.jsx` actualiza `checked` en memoria. La pantalla se repinta al instante.
3. Un `useEffect` con 500 ms de espera junta los cambios seguidos en un solo
   guardado y llama a `storage.set(CLAVE_DATOS, ...)` con el estado completo,
   sellado con su `version`.
4. El adaptador lo escribe. Si falla (cuota llena, modo privado), devuelve
   `false` y la app enseña el estado de guardado en Coach → Ajustes: nunca
   falla en silencio.

Al arrancar, el camino inverso: `storage.get` → `migrar()` → `setState`. Hasta
que esa carga no termina, la app **no guarda nada**, para no machacar el
historial con el estado vacío del arranque.

## Lo que hoy está cableado a propósito

Tres cosas están fijas porque el objetivo actual (Base 7K, hasta el 15 nov de
2026) no necesita más, y resolverlas mal ahora costaría más que resolverlas
bien después. Están aisladas para que su día llegue sin cirugía:

| Qué | Dónde está hoy | Cuándo deja de estarlo |
|---|---|---|
| El plan de 11 semanas, escrito a mano | `domain/plan/bloque-1-base-7k.js` | Fase 3 |
| Las áreas de vida, cada una con su código | `domain/*` + `features/*` | Fase 4 |
| Los datos, en un solo navegador | `lib/storage/adaptador-local.js` | Fase 2 |

Ninguna de las tres está repartida por la app: cada una vive en su sitio, y por
eso cada una se puede cambiar sin tocar el resto.

## Cómo se trabaja

```bash
npm install
npm run dev        # desarrollo
npm run build      # build de producción
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
```

`build`, `lint` y `typecheck` tienen que pasar limpios antes de cada commit.
