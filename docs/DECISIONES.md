# Decisiones

Cada decisión con consecuencias, con su motivo y con lo que costó. Sirve para no
volver a discutir lo ya discutido, y para saber qué hay que revisar cuando
cambien las circunstancias que la justificaron.

---

## D-001 — La app anterior se sustituye entera, no se fusiona

**20 sep 2026**

El repositorio tenía un panel de Next.js con un `page.tsx` de 4.553 líneas y 72
estados locales, un mesociclo genérico de 6 semanas, páginas de prueba
publicadas y persistencia partida entre `localStorage` y Postgres sin una fuente
de verdad única. El historial de commits era una cadena de arreglos de modales,
z-index y logs de depuración: síntomas de que el problema era estructural.

En paralelo existía `sistema_v61.jsx`, un artifact de Claude de 4.654 líneas,
que es **el sistema que se usa de verdad todos los días** y que cubre siete
áreas, no una.

Fusionarlos habría significado arrastrar la estructura que causaba los fallos.

**Decisión:** la app anterior se elimina. El artifact pasa a ser la app.

**Lo que se conserva de la anterior**, porque vale:
- El esqueleto Next.js 15 + App Router y el despliegue en Vercel.
- La idea de una base de datos real con historial por fecha — se retoma en la
  Fase 2, con un esquema nuevo sacado del plan real.
- La idea de adherencia diaria e "insights", que en el sistema nuevo ya está
  mejor resuelta y con criterio propio: es el Coach.

**Lo que se descarta, y por qué:**
- `page.tsx` (4.553 líneas): imposible de razonar y origen de los bugs.
- `mesocicloUtils.ts` (1.085 líneas): describe un mesociclo genérico de 6
  semanas que no es el plan que se sigue.
- El esquema SQL: sus tablas (cardio, NEAT, dieta) venían calcadas de otra app.
- Las páginas de prueba (`test-db`, `test-simple`, `test-modals.html`): estaban
  publicadas en producción.
- Tailwind y 643 líneas de CSS: el sistema nuevo tiene tokens de diseño, que es
  lo que faltaba.

**Coste asumido:** se pierde el trabajo de conexión a Neon. Es barato de
rehacer, y hay que rehacerlo igualmente con el esquema correcto.

---

## D-002 — El estilo va en tokens y estilos en línea, no en Tailwind

**20 sep 2026**

La app hereda un sistema de diseño real —`C`, `CAT`, `SP`, `TYPE`, `R`,
`TAP_MIN`— con criterio detrás: el color de categoría solo en bordes e iconos,
nunca en fondos de tarjeta; espaciado en múltiplos de 4; tipografía con una sola
escala; 44 px de objetivo táctil mínimo. Traducirlo a clases de utilidad habría
diluido esas reglas en cadenas de texto imposibles de verificar.

**Decisión:** `src/design/tokens.js` es la única fuente de estilo. Tailwind se
elimina.

**Consecuencia aceptada:** los estilos en línea no permiten media queries ni
`:hover` sin trabajo extra. La app es de uso móvil y ya lo asumía. Si algún día
necesita temas o modo oscuro, los tokens son el sitio correcto para meterlos.

---

## D-003 — La UI se porta como está, no se reescribe

**20 sep 2026**

Las 4.654 líneas se repartieron en 34 módulos partiendo por límites de función,
con un script, sin tocar el cuerpo de ningún componente. La tentación era
reescribir de paso.

**Decisión:** el porte es mecánico. Ni una línea de lógica cambiada.

**Motivo:** el sistema **funciona y está en uso**. Un porte mecánico se verifica
—compila, arranca, pinta el día correcto—; una reescritura simultánea mezcla
fallos de porte con fallos nuevos y no se puede verificar de ninguna manera.
Separar el dominio, el diseño y la persistencia ya da casi todo el valor
estructural; el resto se cobra por fases, con la app funcionando.

**Deuda reconocida:** `App.jsx` conserva ~40 estados. Está en la Fase 1.

---

## D-004 — La persistencia se abstrae antes de necesitarlo

**20 sep 2026**

El sistema guardaba con `window.storage`, una API que solo existe dentro de un
artifact de Claude. Había que sustituirla igualmente. Lo directo era llamar a
`localStorage` en su lugar.

**Decisión:** no. Se escribe un contrato de adaptador y `localStorage` pasa a
ser una implementación entre varias.

**Motivo:** la Fase 2 es base de datos real y multi-dispositivo. La diferencia
entre hacerlo ahora y hacerlo entonces es un fichero de 50 líneas contra buscar
llamadas a `localStorage` repartidas por 34 módulos. Es la decisión más barata
del proyecto y la que más condiciona si la app llega a 2029.

---

## D-005 — El estado guardado lleva versión desde el primer día

**20 sep 2026**

No hace falta ninguna migración todavía: solo hay una versión del esquema.

**Decisión:** se monta igualmente el mecanismo de versión y migración, y
`migrar()` se ejecuta siempre —al cargar y al importar un backup— aunque hoy no
haga nada.

**Motivo:** el versionado de datos es retroactivo o no sirve. Si el primer dato
guardado no lleva versión, la primera migración de verdad tiene que adivinar qué
forma tenía. Adivinar sobre años de historial es exactamente lo que no puede
pasar. El coste hoy es una línea por guardado.

---

## D-006 — El plan sigue cableado en código, a propósito

**20 sep 2026**

El Bloque 1 son 300 líneas escritas a mano en `bloque-1-base-7k.js`. Sacarlo a
datos es el trabajo de la Fase 3.

**Decisión:** se queda como está hasta que el bloque termine, aislado en su
propio módulo.

**Motivo:** el bloque está en marcha y termina el 15 de noviembre de 2026.
Modelar bloques genéricos **antes** de haber terminado uno entero es diseñar a
ciegas: el mejor material para ese modelo es lo que se aprenda al cerrar este.

**Cuándo se revisa:** al cerrar el Bloque 1. A partir de ahí el cableado deja de
ser una decisión y pasa a ser el obstáculo, porque el Bloque 2 no puede exigir
un despliegue.
