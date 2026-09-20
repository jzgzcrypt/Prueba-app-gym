# Plan de construcción

## Qué quiere ser esta app

Una app de **vida**, no de fitness. El entrenamiento es el área que hoy está
desarrollada, pero el sistema que hay debajo —proponer qué toca hoy, registrar
qué pasó de verdad, revisar cada semana y ajustar el plan a la realidad— no
tiene nada de específico del deporte. Sirve igual para idiomas, lectura, sueño,
finanzas o trabajo.

Y quiere durar años. Eso impone una prueba concreta a cada decisión:

> **La prueba de los tres años.** En 2029, ¿seguirá estando aquí lo que registré
> hoy? ¿Podré empezar un objetivo nuevo sin reescribir la app? Si la respuesta a
> cualquiera de las dos es "no", la decisión está mal tomada.

## El modelo que ya está latente en la app

La app actual ya contiene, sin nombrarlo, el modelo que la hace general. El plan
consiste en hacerlo explícito, no en inventar otro:

| Concepto | Qué es | Dónde vive hoy |
|---|---|---|
| **Área** | Una parte de la vida que se trabaja | running, fuerza, cuello, movilidad, magia, guerrero, nutrición — cada una a mano |
| **Bloque** | Un tramo con fecha de inicio, fin y una meta medible | `bloquesHistorial` — ya existe |
| **Práctica** | Lo que toca un día: sesión programada o hábito diario | `WEEKS` + los hábitos |
| **Registro** | Lo que pasó de verdad: check, peso, ritmo, dolor, sensación | el estado guardado |
| **Revisión** | Qué dicen los registros frente al plan, y qué se ajusta | `weeklyLog`, `phaseAdjustNote`, Coach |

Esas cinco piezas son toda la app. Hoy están escritas siete veces, una por área.
El trabajo de los próximos meses es escribirlas **una vez**.

---

## Fase 0 — Trasplante y limpieza ✅ *hecha (20 sep 2026)*

Tirar la app anterior, poner la de verdad, y dejarla partida en capas con una
capa de persistencia sustituible. Detalle en el `CHANGELOG.md`.

---

## Fase 1 — Que el Bloque 1 llegue entero al 6 de diciembre

**Hasta el 6 dic 2026. Objetivo: terminar 7K a 4:45/km sin perder un dato.**

Aquí no se cambia el modelo. Se cambia lo que hace daño ahora mismo.

1. ~~**Que los datos no se pierdan, pase lo que pase.**~~ ✅ *hecho*. Aviso en
   Coach → Ajustes cuando hace 7 días o más de la última copia, o si no hay
   ninguna. Queda pendiente probar el ciclo exportar → importar de punta a punta.
1bis. ~~**Revisión semanal guiada.**~~ ✅ *hecho* — se adelanta desde la Fase 5
   porque su materia prima se genera ahora, semana a semana. Construirla en
   noviembre habría perdido ocho semanas de "qué funcionó y por qué".
2. **Traer lo registrado en la versión artifact.** Exportar allí, importar aquí,
   y comprobar semana a semana que el historial cuadra.
3. **Partir el estado de `App.jsx`.** Hoy son ~40 estados en un componente. Se
   agrupan por área en hooks propios (`useRunning`, `useHabitos`, `useFuerza`),
   con la misma persistencia. Es la deuda que más va a pesar en la Fase 4, y la
   más barata de pagar ahora.
4. **Sacar el color del dominio.** `nutricion.js` importa tokens de diseño: el
   dominio no debe saber de colores. Es pequeño, pero es justo la dependencia
   que la regla de capas prohíbe.
5. **Lo que pida el uso diario.** El bloque está en marcha; lo que estorbe al
   usarlo va aquí.

**Se sabe que está hecha cuando:** se puede perder el móvil sin perder el
historial, y `App.jsx` baja de 200 líneas.

---

## Fase 2 — Que los datos sobrevivan al dispositivo

**Nov 2026 – ene 2027.**

Un historial de años no puede vivir en el `localStorage` de un navegador. Un
borrado de datos del móvil y desaparecen tres años.

1. **Cuenta.** Una sola, la tuya. Sin red social, sin invitaciones.
2. **Postgres en Neon**, con el esquema sacado del modelo real de arriba
   (áreas, bloques, prácticas, registros, revisiones), no del esquema anterior,
   que describía otra app.
3. **`adaptador-remoto.js`**, implementando el mismo contrato que el local.
4. **Local primero, nube detrás.** La app escribe en local al instante y
   sincroniza cuando hay red. Sin conexión tiene que seguir funcionando entera:
   se entrena en sitios sin cobertura.
5. **Resolución de conflictos**, que con un solo usuario es "gana la escritura
   más reciente por campo" — y hay que escribirlo, porque es donde se pierden
   datos de verdad.

**Se sabe que está hecha cuando:** se entra desde un móvil nuevo y está todo.

---

## Fase 3 — El plan deja de ser código

**Ene – mar 2027. Esta es la fase que decide si la app dura.**

Hoy el Bloque 1 son 300 líneas escritas a mano. Cuando termine el 15 de
noviembre, **crear el Bloque 2 exige editar código y desplegar**. Una app que
necesita un programador para empezar un objetivo nuevo no dura años.

0. **Cada área declara su papel en el bloque** (`objetivo`, `soporte`,
   `mantenimiento`, `salud`, `habilidad`, `compromiso`). Es lo primero porque
   el Bloque 2 ya está decidido —consolidar el 7K y virar a estética— y eso no
   es cambiar de meta, es cambiar qué área manda. Ver `DECISIONES.md`, D-007.
1. **El bloque pasa a ser un registro en la base de datos**, con el mismo
   formato que hoy tiene `WEEKS`. El actual se migra tal cual.
2. **Editor de bloques dentro de la app**: crear semanas, días, sesiones y
   ejercicios desde el móvil.
3. **Encadenar bloques.** `bloquesHistorial` ya existe: se le da uso real. Al
   cerrar un bloque se archiva con su revisión y el siguiente arranca donde
   acabó el anterior. Los datos del bloque cerrado no se tocan nunca más.
4. **Plantillas.** Un bloque terminado se puede duplicar como punto de partida.
5. **Progresión calculada, no escrita.** Las curvas tipo `RITMO_ESPERADO` se
   derivan de la meta del bloque en lugar de teclearse semana a semana.

**Se sabe que está hecha cuando:** el Bloque 2 se crea entero desde el móvil, sin
desplegar nada.

---

## Fase 4 — El motor de áreas

**Mar – jun 2027. Aquí deja de ser una app de fitness.**

Hoy, añadir "idiomas" significa escribir una pantalla, un bloque de hoy, su
persistencia y sus KPIs: una semana de trabajo por área. Eso es lo que impide
que sea una app de vida.

1. **Definir el área como configuración, no como código**: nombre, color, icono,
   tipo de práctica (sesión programada / hábito diario / seguimiento por
   medición), cómo se mide el progreso.
2. **Un motor de prácticas** que sirva a las tres formas. Las siete áreas de hoy
   se reescriben encima de él: si las siete no caben, el motor está mal y hay
   que arreglarlo antes de seguir.
3. **Pantalla de HOY genérica**, que compone los bloques de las áreas activas en
   vez de tenerlos cableados.
4. **Alta de áreas desde la app.** La prueba real: dar de alta "Idiomas" sin
   escribir una línea.
5. **Revisión que cruza áreas.** El Coach deja de mirar solo el entrenamiento:
   si el sueño cae y el ritmo empeora a la vez, eso es lo que hay que ver junto.

**Se sabe que está hecha cuando:** un área nueva se da de alta en cinco minutos
desde el móvil y aparece en HOY el mismo día.

---

## Fase 5 — La app de vida, con memoria larga

**A partir de jun 2027. Lo que solo tiene sentido con años dentro.**

1. **Historial de años.** Ver 2026 al lado de 2029 por área y por bloque.
2. **Revisiones de bloque, trimestre y año**, guiadas y guardadas — el mismo
   hábito del registro semanal, a otra escala.
3. **Patrones a largo plazo.** Qué áreas aguantan y cuáles se caen siempre; qué
   pasa cuando se solapan dos bloques exigentes.
4. **Entrada de datos automática** donde tenga sentido: reloj, sueño, pasos.
   Nunca a costa de que la app deje de funcionar sin ellos.
5. **Que se pueda salir.** Exportación completa y legible, siempre. Una app que
   guarda años de tu vida tiene que poder devolvértelos.

---

## Tres reglas que no se negocian

1. **El dato del usuario es sagrado.** Nada de lo registrado se borra ni se
   reinterpreta sin migración escrita. Ante la duda, se conserva.
2. **Lo que funciona hoy sigue funcionando mañana.** Cada fase deja la app
   usable a diario. Nada de refactors que la rompan "una semanita".
3. **Cada cambio se anota en el `CHANGELOG.md`.** Es lo que hace que dentro de
   tres años se pueda entender por qué algo está como está.
