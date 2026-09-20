# Mejoras propuestas

Cada mejora aquí abajo existe para responder **una pregunta concreta** que hoy
no se puede responder, o para quitar **un obstáculo concreto** que ya ha
aparecido. Si una mejora no tiene su pregunta, no entra en la lista.

El orden no es por dificultad: es por lo que cuesta *no* hacerlas.

---

## Ahora — antes de que el bloque avance

### M1 · Copia de seguridad automática
> **Pregunta que responde:** *"Si mañana pierdo el móvil, ¿pierdo el bloque?"*

Hoy sí. Todo vive en el `localStorage` de un navegador: borrar datos del sitio,
cambiar de teléfono o un modo privado y desaparecen semanas de registro. Ya hay
exportación manual, pero depende de acordarse.

**Qué se hace:** al cerrar cada semana, la app ofrece descargar el backup sola.
Y un aviso visible en Coach cuando hace más de N días del último.

**Por qué es la primera:** es la única mejora de toda la lista cuyo coste, si no
se hace, es **irreversible**. Las demás se pueden hacer más tarde.

---

### M2 · Deshacer un día entero
> **Pregunta que responde:** *"Marqué el día que no era, ¿cómo lo quito?"*

El sistema de Undo existe pero cubre acciones sueltas y dura 6 segundos. Un día
marcado por error a media semana no se puede limpiar de golpe.

**Qué se hace:** un "vaciar este día" en el propio día, que borra sus checks,
pesos, ritmo y sensación de una vez.

---

### M3 · Los hábitos no dependen de abrir la app
> **Pregunta que responde:** *"¿Por qué el running sale y los hábitos no?"*

Esta pregunta ya tiene respuesta escrita en tu propia bitácora: *"los hábitos
sin momento fijo dependen de decidir cada vez, y esa decisión se pierde; el
running funciona porque tiene día y hora claros"*. La app sabe el diagnóstico
pero no hace nada con él.

**Qué se hace:** cada hábito lleva su momento fijo (cuello al levantarte,
guerrero al llegar a casa, magia antes de dormir) y una notificación a esa hora.
Es el mismo mecanismo que hace funcionar al tenis: día y hora, no fuerza de
voluntad.

**Nota:** las notificaciones web en iOS solo funcionan con la app instalada en
la pantalla de inicio. Ya se puede instalar, así que el camino está abierto.

---

## Después — cuando el bloque esté rodando

### M4 · Partir el estado de `App.jsx`
> **Pregunta que responde:** *"¿Por qué tocar una pantalla rompe otra?"*

`App.jsx` tiene ~40 estados y se los pasa a todo el mundo por props. Cualquier
cambio toca un fichero que lo sabe todo.

**Qué se hace:** un hook por área (`useRunning`, `useHabitos`, `useFuerza`),
cada uno dueño de sus datos, con la misma persistencia.

**Por qué importa de verdad:** es el cuello de botella de la Fase 4. Un área
nueva hoy significa tocar `App.jsx`; con esto significa añadir un hook.

---

### M5 · Los datos salen del dispositivo *(Fase 2 del roadmap)*
> **Pregunta que responde:** *"¿Puedo mirar el plan desde el portátil?"*

Y también: *"¿seguirá aquí en 2029?"*. Hoy la respuesta a las dos es no.

**Qué se hace:** cuenta, Postgres en Neon y `adaptador-remoto.js`. El contrato
ya está escrito, así que no hay que tocar ninguna pantalla. Local primero y
sincronización detrás: sin cobertura la app tiene que seguir entera, porque se
entrena en sitios sin señal.

---

### M6 · Crear el Bloque 2 sin desplegar *(Fase 3 del roadmap)*
> **Pregunta que responde:** *"El 6 de diciembre se acaba el bloque. ¿Y ahora qué?"*

Hoy: editar código y desplegar. Una app que necesita un programador para
empezar un objetivo nuevo no dura años — esta es literalmente la mejora que
decide si la app sigue viva en 2027.

**Qué se hace:** el bloque pasa a ser un dato editable desde el móvil. Al cerrar
uno se archiva con su revisión y el siguiente arranca donde acabó el anterior.

**Cuándo:** el mejor momento para diseñarlo es al cerrar el Bloque 1, con lo
aprendido de haberlo terminado entero.

---

### M7 · Dar de alta un área sin escribir código *(Fase 4 del roadmap)*
> **Pregunta que responde:** *"Quiero meter idiomas. ¿Cuánto cuesta?"*

Hoy: una semana de trabajo por área — pantalla, bloque de HOY, persistencia y
KPIs. Por eso sigue siendo una app de fitness y no una app de vida.

**Qué se hace:** un área pasa a ser configuración (nombre, color, tipo de
práctica, cómo se mide), sobre un motor común. Las siete de hoy se reescriben
encima: si no caben las siete, el motor está mal.

**La prueba de que está hecha:** dar de alta "Idiomas" en cinco minutos desde el
móvil y verla en HOY el mismo día.

---

## Mejoras de estructura, pequeñas y con efecto

### M8 · Sacar el color del dominio
> **Pregunta que responde:** *"¿Puedo cambiar el aspecto sin tocar el plan?"*

`domain/nutricion/nutricion.js` importa tokens de diseño. Es la única
dependencia que rompe la regla de capas, y es de dos líneas.

### M9 · Tests de las reglas del dominio
> **Pregunta que responde:** *"¿Cómo sé que no he roto el plan al tocarlo?"*

Hoy no hay forma. Las funciones del dominio son puras y triviales de probar:
que las 11 semanas caigan lunes a domingo, que ningún compromiso quede pisado,
que las migraciones no pierdan campos. El script que verificó el calendario hoy
ya es medio test — falta convertirlo en uno de verdad y que corra en cada push.

**Por qué merece la pena aquí y no en cualquier app:** lo que protege no es
código, son **años de tu historial**.

### M10 · Revisión semanal guiada
> **Pregunta que responde:** *"¿Qué me dice la semana que acabo de terminar?"*

La bitácora es un campo de texto libre. Las dos entradas que escribiste valen
oro precisamente porque separan *qué pasó*, *por qué* y *qué ajusto* — pero esa
estructura está en tu cabeza, no en la app.

**Qué se hace:** la revisión pregunta esas tres cosas por separado, y enseña al
lado los datos de la semana (adherencia por área, ritmos, dolor). Es la pieza
que convierte el registro en decisiones, y la que hace que el Coach sea un
coach y no un cuaderno.
