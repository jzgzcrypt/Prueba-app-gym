# Registro de cambios

Todo cambio que se haga en la app se anota aquí. Sin excepciones.

## Cómo se escribe una entrada

- Lo nuevo va **arriba**, bajo `## [Sin publicar]`. Al desplegar, esa sección
  se cierra con número de versión y fecha, y se abre una nueva vacía.
- Una línea por cambio, en lenguaje normal: **qué cambió y por qué**, no qué
  fichero se tocó. Dentro de seis meses el "por qué" es lo único que sirve.
- Categorías: `Añadido`, `Cambiado`, `Arreglado`, `Eliminado`, `Datos`.
- `Datos` es obligatorio siempre que cambie la forma de lo que se guarda:
  se anota la versión de esquema y la migración que la acompaña
  (ver `src/lib/storage/esquema.js`). Un cambio de datos sin migración escrita
  es un cambio que puede borrar años de historial.
- Versionado: `MAYOR.MENOR.PARCHE`. MAYOR cuando cambia el modelo de la app
  (p. ej. pasar de un bloque fijo a bloques encadenados), MENOR cuando se añade
  capacidad, PARCHE para arreglos.

---

## [Sin publicar]

### Añadido — Sigues tu menú, apuntas lo que has comido, y las cantidades se recalculan
- **El día es tu menú, no una lista de sugerencias.** Desayuno, almuerzo,
  comida, post-entreno, cena y precama, con la misma forma que los programas
  de 2022 y los alimentos que tienes en casa. Hay dos menús porque hay dos
  tipos de día, igual que entonces.
- **Apuntas lo que has comido y lo que queda se recalcula.** Cada comida se
  marca de dos formas: *me lo he comido* tal cual, o *he comido otra cosa*.
  En cuanto apuntas, los gramos de las comidas que faltan se ajustan para que
  el día siga sumando lo que tiene que sumar, y se marca en verde o en ámbar
  lo que ha subido o bajado respecto al plan.
- **La cantina, sin pesar nada.** 36 platos de comedor que se señalan con el
  dedo y se marcan como poco / normal / mucho. Puedes apuntar varios: en la
  cantina caen tres cosas, no una.
- **La verdura y la fruta no se tocan nunca.** Son volumen y saciedad;
  moverlas no arregla el día y quita justo lo que sacia. Se mueve el
  carbohidrato, que es la palanca, y la proteína solo lo justo para llegar.
- **Si no cabe el menú entero, se quita lo prescindible en vez de encoger
  todo.** Es lo que harías tú: antes saltarse el almuerzo que cenar 20 g de
  pasta. Se quita lo que peor proteína da por caloría —el queso batido de la
  precama son 20 g por 118 kcal, así que es lo último que se toca— y nunca el
  desayuno, la comida ni la cena.
- **Intercambiar alimentos, calculado en vez de a ojo.** "Hoy no hay salmón,
  hay merluza": se toca el ingrediente, se elige el cambio y la cantidad se
  recalcula igualando el macro que define a ese grupo. Es la tabla de
  equivalencias del dietista, con una calculadora detrás.
- **La despensa como datos** (45 alimentos) sacada de tus propios menús de
  2022, con los pesos en crudo o cocido según se pesa de verdad en una cocina.
- **La tira de comida de HOY está viva:** en cuanto apuntas algo deja de
  repetir la regla y dice lo que llevas y lo que queda, y se toca para ir
  directo al menú.

### Añadido — La dieta la editas tú
- **El menú de partida es mío; el que usas es tuyo.** Cada comida tiene
  *Editar*: cambias los gramos de cada alimento, quitas lo que no comes,
  añades lo que sí, o quitas la comida entera del menú. Si no desayunas, no
  desayunas — y el resto del día carga con esas calorías solo.
- Se puede **añadir una comida que no estaba** en ese tipo de día (un
  post-entreno en un día de recortar, por ejemplo) y cae en su sitio del día,
  no al final.
- Las ediciones son **por tipo de día, no por fecha**: quitar el desayuno lo
  quita de todos los días de COMER, que es lo que significa cambiar la dieta.
  Saltárselo hoy es otra cosa y se hace apuntando el día. La pantalla lo dice.
- **Nada se borra.** Una edición es una capa encima del menú de partida, así
  que *Volver al original* y *Volver al menú de partida* siempre funcionan, y
  lo que has quitado aparece abajo con un botón para devolverlo.

### Cambiado — las calorías del día, con las cuentas a la vista
- Había dos cifras que no cuadraban: las **2.081 / 1.814 kcal** del dietista de
  2022 (un cuerpo que levantaba pesas y no corría) y las **2.800 / 2.350** que
  estimé yo (que no dejaban déficit). Ahora son **2.500 los días de COMER y
  2.100 los de RECORTAR**, y el porqué está escrito entero en
  `src/domain/nutricion/dias.js` para que se pueda discutir en vez de creerse:
  media semanal ~2.220 kcal, unas 400 por debajo del gasto, ~0,4 kg de grasa
  por semana sin tocar el rendimiento del 7K.
- La proteína es la misma los dos días (165 g) porque no se negocia: es lo
  único que protege el hombro mientras se pierde grasa.

### Arreglado
- **La caña descuadraba el día en silencio.** Declaraba 130 kcal y sus macros
  sumaban 48: el alcohol no es proteína, ni hidrato, ni grasa, pero sus
  calorías cuentan igual. Ahora se anotan como hidrato —lo que hace cualquier
  contador de macros— y hay una prueba que comprueba que las calorías de cada
  plato cuadran con sus macros.

### Datos
- Nuevos campos `comidasLog` (`{ fecha: [apunte] }`, donde cada apunte es
  `{comida, origen, id, gramos|ración}`), `cambiosMenu`
  (`{ fecha: { "cena:salmon": "merluza" } }`) y `menuEditado`
  (`{ tipoDía: { comidaId: ingredientes | null } }` — tu dieta editada, donde
  `null` es una comida que has quitado). **No suben la versión de
  esquema**: son campos nuevos y opcionales que por defecto son `{}`, no un
  cambio de forma de nada ya guardado, así que no hay migración que escribir.
  Entran en el guardado automático y en exportar/importar. `comidasLog` y
  `cambiosMenu` entran además en "vaciar este día"; `menuEditado` no, porque
  es tu dieta y no un registro del día.

### Añadido — Nutrición deja de ser una página muerta
- **Los dos programas nutricionales de 2022**, con sus menús completos por
  tipo de día, macros, equivalencias, protocolo de comida libre, trucos del
  día a día y el objetivo de pasos. Antes la pantalla eran 41 líneas estáticas
  que decían "proteína 150-170 g" y nada más.
- Están como **referencia, no como prescripción**, y la pantalla lo dice: los
  escribió un dietista para el cuerpo de 2022.
- Y lo relevante: **esos programas ya separaban día de entreno y día de
  descanso**, que es exactamente la regla de este bloque. La idea no es nueva.

### Cambiado — el resto de pestañas
- **Barra de navegación coherente.** Tres pestañas pintaban un cuadrado vacío
  y tres usaban ilustraciones de otra parte de la app — dos de ellas,
  Progreso y Cuello, eran literalmente el mismo dibujo de una columna
  vertebral. Ahora son seis iconos de trazo hechos para leerse a 21 px.
- **Coach deja de abrir con ceros en rojo.** El día 1 mostraba un `0%` enorme
  de adherencia global y cuatro barras de hábito a `0%`. Eso no mide nada: solo
  confirma que no has empezado. Por debajo de 3 días se enseña un guion y una
  línea que explica cuándo tendrá sentido el número.
- **Semana enseña qué toca comer cada día.** Es el dato que hace falta para
  planificar la compra, y estaba solo en HOY, un día cada vez.

### Cambiado — la pantalla de HOY, reordenada
- **El botón de empezar la sesión estaba en la posición 11.** Antes de llegar
  a él había logo, barra de progreso, una frase, tres contadores, el navegador
  de día, los puntos de la semana, la comida y tres hábitos: **dos pantallas de
  scroll** hasta lo único que hay que hacer. A las 16:00, decidiendo si te
  tumbas, eso juega en contra. Ahora la sesión va justo debajo de la fecha.
- **Arriba va el objetivo, no un reproche.** Donde había una frase que regañaba
  —"Hoy toca. No hay debate."— y tres contadores que en el día 1 marcaban
  4 / 0 / 0, ahora está lo que de verdad empuja: **7km @ 4:45/km, domingo 6 de
  diciembre, 76 días**. Lo primero que veías al abrir la app era que no habías
  hecho nada; ahora es por qué lo estás haciendo.
- La frase se queda, pero como línea discreta bajo la sesión en vez de ser el
  bloque tipográfico más grande de la pantalla.
- **Los hábitos bajan debajo de la sesión** y dejan de competir con ella.
- **Fuera los fondos de color de las tarjetas.** El propio sistema de diseño lo
  dice: *"el color de categoría va en bordes e iconos, nunca en el fondo de la
  tarjeta"*. Había cuatro tarjetas de colores pastel, y el resultado era que
  magia (10 min) pesaba visualmente igual que la sesión (35 min). Ahora todas
  son blancas con un filo de color a la izquierda.

### Arreglado
- **La app reventaba al pasar de día.** `bloques.jsx` usaba `claveDia` sin
  importarlo: *"claveDia is not defined"*, pantalla en blanco en cuanto tocabas
  la flecha de siguiente día. Se coló al reescribir el bloque de mover sesión.
- **Y lo que importa: ahora ese fallo no puede volver a desplegarse.** Un
  import que falta **no rompe el build** —webpack lo deja pasar y revienta en
  el navegador, en el momento en que el usuario toca ese componente— y los
  tests tampoco lo ven, porque no montan componentes. Se activa la regla
  `no-undef` en ESLint, que es lo único que lo detecta antes de subirlo.
- Verificado recorriendo los 14 primeros días del bloque en un navegador de
  verdad: cero errores.

---

## [Sin publicar — plan]

### Cambiado — el plan, revisado y aprobado el 21 de septiembre
- **La rampa baja de 2 semanas a 1.** Vuelve de un parón, no empieza de cero:
  dos semanas idénticas de correr/caminar no aportan carga y desmotivan justo
  cuando más falta hace engancharse. Sube algo el riesgo de lesión —la forma
  vuelve antes que los tendones— y se asume a propósito.
- **Aparece el puente que faltaba: S10, 6 km a 4:50-4:55.** El plan anterior
  pedía 7 km a un ritmo sostenido solo 3 km, y un 40% más largo que el mayor
  esfuerzo a ritmo. La semana que libera la rampa lo paga. La progresión queda
  3 → 4 → 5 km → test → 3 km a ritmo → 6 km → el día.
- **El taper se queda en una semana.** Dos, para un objetivo de 33 minutos,
  es desentrenar.

### Añadido — la comida y la estética, que no existían
- **La regla de comida, por día.** *Los días que corres fuerte, comes; los días
  que no, recortas.* Sale en HOY con las kcal y la proteína del día. No es
  fuerza de voluntad: la grasa alimenta el trote suave pero no 4:45/km, que
  tira de glucógeno — así que las sesiones que construyen el objetivo van con
  el depósito lleno y el déficit se concentra donde no hace falta.
- **Ancho de hombro** como medida, y **el ratio hombro ÷ cintura** como
  indicador de estética. Sube por los dos lados a la vez y no miente con
  recomposición, que es el caso: se puede perder grasa y ganar músculo con la
  báscula casi quieta. (El "hombro" que ya existía es el test de movilidad.)

### Arreglado — la rehabilitación del cuello se reiniciaba sola
- **El cuello deja de depender del número de semana del bloque.** Reiniciar el
  bloque reiniciaba la rehabilitación: tres meses después del accidente tocaba
  otra vez la fase aguda, y habría vuelto a pasar en diciembre con el Bloque 2.
  Ahora avanza por **días practicados de verdad** —1-14, 15-42, 43+— con ajuste
  manual por encima para lo que diga el fisio. Fallar una semana ya no adelanta
  de fase.
- La tirada larga del domingo salía como día de recorte: la regla miraba un
  índice que solo existía en la lista plana, no en los días del plan. Lo
  encontraron los tests nuevos.

### Cambiado
- **El registro pasa a ir por fecha real, no por "semana-día del bloque".**
  Antes la clave era `"1-3"` (semana 1, jueves). Eso tenía dos problemas
  graves: el 20 de septiembre no existía —solo existía "semana 1, día 3", así
  que un día fuera del bloque no tenía dónde vivir y no podía haber diario— y,
  peor, al empezar el Bloque 2 la numeración vuelve a 1 y `"1-3"` habría
  escrito **encima** del Bloque 1. Era pérdida de historial con fecha de
  caducidad: el 7 de diciembre.
- El formato de la clave lo decide ahora un único sitio (`claveDia` en el
  calendario), para que no vuelva a estar repartido por veinte ficheros.

### Arreglado
- **Mover una sesión mueve la sesión.** Hasta ahora era un post-it: se
  guardaba "movida al jueves" en el día de origen y nadie lo leía nunca. El
  jueves no se enteraba, la sesión no aparecía en ninguna parte — y era la
  única herramienta que había para reaccionar a un día fallado. Ahora el
  traslado es real: el día de origen se queda vacío y el de destino muestra la
  sesión, con su contenido y su botón de marcar.
- El traslado no deja amontonar dos sesiones en un mismo día ni encadenar
  traslados: juntar dos sesiones en un día es justo lo que hace que no se haga
  ninguna.

### Datos
- **Versión de esquema 3.** Todas las claves de día pasan a fecha ISO
  (`"2026-09-24"`), conservando los sufijos (`"2026-09-24-m"`). La bitácora
  semanal pasa al lunes de su semana, y los rangos en pausa se reindexan
  también.
- La migración saca la fecha de inicio del propio historial guardado siempre
  que puede, así que **una copia importada de la versión antigua cae en sus
  fechas de verdad** —su bloque empezaba el 31 de agosto— y no tres semanas
  desplazada.
- La migración **no importa la fecha de inicio del plan a propósito**: una
  migración es un documento histórico y tiene que dar siempre el mismo
  resultado, aunque mañana se mueva el bloque de fecha.

### Añadido
- **Guardado a prueba de cierre.** Hasta ahora el guardado esperaba medio
  segundo para agrupar cambios seguidos, y no había nada que guardase al
  cerrar: marcar algo y cerrar la app de inmediato —un gesto normal con el
  móvil en la mano— podía perder ese cambio. Ahora se guarda también cuando la
  app pasa a segundo plano y cuando se descarga la página. Coach → Ajustes
  muestra además **la hora del último guardado**, para no tener que fiarse.
- **Vaciar un día.** Marcar el día equivocado era fácil y no tenía arreglo: el
  deshacer general dura 6 segundos y va por acción suelta, así que un error
  detectado al día siguiente se quedaba para siempre. Ahora, desde HOY, se
  puede borrar de una vez todo lo registrado en ese día —marcas, pesos, ritmo
  y sensaciones— con confirmación que dice cuántos registros se van, y con
  deshacer. El botón solo aparece si hay algo que vaciar.
- El borrado se escribe como función pura fuera de los componentes
  (`lib/estado/limpiar-dia.js`) y con ocho tests propios: es lo más delicado
  que hace la app, porque borra datos del usuario. Uno de esos tests cubre el
  fallo que lo habría hecho peligroso — comparar claves por prefijo haría que
  vaciar la semana 1 se llevase por delante la 11.

---

## [1.2.0] — 2026-09-20

Copia de seguridad avisada, revisión semanal en tres preguntas, y los primeros
tests del dominio, que encontraron un fallo de merge en producción.

### Añadido
- **Aviso de copia de seguridad.** Coach → Ajustes avisa cuando hace 7 días o
  más de la última copia, o cuando no hay ninguna. Los datos viven solo en este
  navegador: hasta que haya cuenta y base de datos, la copia es lo único que
  separa "he perdido el móvil" de "he perdido el bloque".
- **Revisión semanal guiada.** La bitácora deja de ser un campo de texto libre
  y pasa a tres preguntas separadas: qué pasó, por qué, y qué ajusto. Al lado
  se muestran los datos reales de esa semana (running, fuerza, tenis, hábitos,
  ritmos y dolores registrados), para responder mirando lo que pasó y no lo que
  uno recuerda. Las tres preguntas salen de las dos entradas de bitácora que de
  verdad sirvieron: separaban exactamente eso.

### Arreglado
- **Recuperada la reformulación del bloque**, que el merge de la PR #10 dejó
  fuera: GitHub la mergeó con un head desactualizado. Producción tenía la
  versión parcheada — el lunes era tenis en las 11 semanas, pero de S6 a S9 la
  sesión de calidad seguía cayendo el martes, justo después del tenis. Lo
  detectaron los tests del dominio al ejecutarse por primera vez.

### Añadido (2)
- **Tests del dominio** (`npm test`, sin dependencias nuevas). Cubren las
  invariantes del bloque —11 semanas de lunes a domingo, ningún plan pisando un
  compromiso, el día después del tenis sin intensidad, la calidad tres días
  después, máximo un día de pierna— y la migración del esquema. No protegen
  código: protegen años de historial.
- El dominio pasa a usar imports relativos en vez del alias `@/`, así que es un
  módulo ES corriente que puede cargar cualquier herramienta y no solo el
  bundler de Next. Es lo que permite que los tests lo importen directamente.

### Datos
- **Versión de esquema 2.** `weeklyLog` pasa de `string` a
  `{ paso, porque, ajuste }`. La migración conserva el texto anterior entero en
  `paso`: no se reparte a ojo entre los tres campos, porque eso sería inventar
  lo que no se escribió. Probada contra seis formas de datos guardados,
  incluidas las que no llevaban versión.
- Se guarda la fecha de la última copia descargada (`ultimoBackup`).

---

## [1.1.0] — 2026-09-20

El Bloque 1 se reformula entero para arrancar el 21 de septiembre, con el tenis
de los lunes dentro desde el día uno. Desplegado en producción.

### Arreglado
- **Next.js actualizado a 15.5.25.** Vercel rechazaba el despliegue con
  `VULNERABLE_NEXTJS_VERSION` (CVE-2025-66478): la 15.4.6 está bloqueada en
  la plataforma. Se sube al último parche de la línea 15.x, sin salto de
  versión mayor.
- **Los lunes son tenis, en las 11 semanas.** El plan solo lo recogía en las
  semanas 3, 4 y 5: las semanas 1 y 2 se escribieron antes de que el tenis
  fuera un compromiso fijo, y a las semanas 6 a 9 nunca se les aplicó el
  ajuste, así que seguían poniendo sesión de Empuje el lunes por la tarde.

### Añadido
- **Compromisos fijos** (`src/domain/compromisos.js`), una figura nueva del
  dominio: algo que ocurre siempre el mismo día de la semana, sea cual sea el
  bloque. El tenis del lunes es el primero. Se escribe una vez y el calendario
  lo superpone sobre todas las semanas, de este bloque y de los que vengan.
- **Aviso de colisión**: si un plan programa una sesión encima de un compromiso
  fijo, el calendario lo detecta y lo saca por consola en desarrollo. Es
  exactamente el fallo que tenía el plan de origen, y ahora no puede pasar sin
  que se vea.
- La app se puede instalar en el móvil: manifiesto, iconos propios generados a
  partir del logo, y apertura a pantalla completa sin barra de navegador.
- `docs/MEJORAS.md`: mejoras propuestas, cada una con la pregunta concreta que
  responde. Si una mejora no tiene su pregunta, no entra en la lista.

### Cambiado
- **El bloque arranca el lunes 21 de septiembre de 2026** y termina el domingo
  6 de diciembre. Antes empezaba el 31 de agosto.
- **Las fechas dejan de estar escritas a mano.** El plan ya no contiene ni una
  sola fecha: define 11 semanas de 7 días y el calendario las ata a fechas
  reales a partir de `FECHA_INICIO`. Mover el bloque entero es cambiar una
  constante, en vez de reescribir 77 días y 11 rangos.
- Sesiones recolocadas para dejar el lunes libre:
  - S1: el Empuje + Tirón del lunes pasa al miércoles, que estaba en descanso.
  - S2: el Empuje del lunes pasa al viernes, que estaba en descanso.
  - S6-S9: el Empuje del lunes se funde en el día de Tirón del miércoles, que
    pasa a ser Tirón + Empuje. No había día libre donde moverlo.
  - S10-S11: el lunes era descanso de taper; ahora lo ocupa el tenis.

### Datos
- **El historial arranca vacío.** Se quitan los datos semilla que traía el
  sistema de las semanas ya vividas: sesiones marcadas, ritmos, sensaciones y
  la bitácora de las semanas 1 y 2. El bloque empieza de cero.
- El historial de bloques toma sus fechas del calendario, así que se mueve solo
  si se mueve `FECHA_INICIO`.

---

## [1.0.0] — 2026-09-20

Primera versión real. Se sustituye por completo la app anterior por el sistema
que ya se estaba usando a diario, y se deja montada la estructura sobre la que
se va a construir a partir de ahora.

### Añadido
- Capa de persistencia con adaptador intercambiable (`src/lib/storage/`). La app
  ya no sabe dónde se guardan sus datos, así que el día que haya cuenta y base
  de datos no hay que tocar ninguna pantalla.
- Versionado y migración del estado guardado (`esquema.js`). Desde hoy, cambiar
  la forma de los datos no puede perder lo ya registrado.
- `docs/ARQUITECTURA.md`, `docs/ROADMAP.md` y `docs/DECISIONES.md`: cómo está
  montada la app, hacia dónde va y por qué se decidió cada cosa.
- Este registro de cambios.

### Cambiado
- La app pasa a ser el sistema completo de entrenamiento, salud y habilidades
  (running, fuerza, cuello, movilidad, técnica, magia, guerrero, nutrición,
  coach y progreso), no solo un panel de gimnasio.
- El fichero único de 4.654 líneas se reparte en tres capas separadas: dominio
  (los datos del plan, sin React), diseño (los tokens) y features (la UI).
  Ninguna capa de abajo conoce a la de arriba.
- El plan del Bloque 1 (Base 7K, 31 ago – 15 nov 2026) vive aislado en
  `src/domain/plan/bloque-1-base-7k.js`, listo para dejar de ser código y
  pasar a ser dato en la Fase 3.
- Los estilos salen de `src/design/tokens.js` en lugar de 643 líneas de CSS
  suelto. Un solo sitio donde cambiar color, espaciado o tipografía.

### Eliminado
- El panel anterior: `page.tsx` de 4.553 líneas con 72 estados locales.
- El mesociclo genérico de 6 semanas (`mesocicloUtils.ts`), que no corresponde
  al plan que se sigue de verdad.
- Las páginas y ficheros de prueba que estaban publicados: `test-db`,
  `test-simple`, `api/test-db` y `test-modals.html`.
- El esquema SQL y los scripts de base de datos anteriores: sus tablas
  (cardio, neat, dieta) venían de otra app y no describen este plan. La base
  de datos se rehace en la Fase 2 a partir del modelo real.
- Dependencias que ya no se usan: Tailwind, Chart.js, lucide-react, dotenv y
  el cliente de Neon. Las gráficas son SVG propio; Neon vuelve en la Fase 2.

### Datos
- Se fija la **versión de esquema 1** como punto de partida. Todo lo guardado
  lleva a partir de ahora su `version`, y `migrar()` se aplica tanto al cargar
  como al importar un backup.
- La persistencia pasa de `window.storage` (que solo existía dentro de un
  artifact de Claude) a `localStorage` a través del adaptador. Los datos ya
  registrados se traen con **Exportar** en la app antigua e **Importar** en la
  nueva, desde Coach → Ajustes.
