# El objetivo, dónde estamos y cómo seguir

Este archivo existe para una cosa: que dentro de tres meses —o dentro de tres
años, o cuando vuelva otra persona a tocar esto— se sepa **para qué es esta
app, qué está hecho y qué reglas no se rompen**. El `CHANGELOG.md` cuenta qué
cambió cada día; `docs/DECISIONES.md` cuenta por qué se decidió cada cosa. Este
cuenta a dónde vamos.

---

## 1. El objetivo

**7 km a 4:45/km el 6 de diciembre de 2026.** Bloque 1 — Base 7K, 11 semanas,
del 21 de septiembre al 6 de diciembre.

Pero el 7K no es el objetivo de verdad. El objetivo de verdad, en sus palabras:

> *"No me gusta mi vida actual, mi falta de disciplina y no sentirme bien
> conmigo."*

Y debajo del 7K hay cuatro cosas que van a la vez, dichas por él:

| | Qué |
|---|---|
| **Cuello** | Más rápido. Accidente hace tres meses, protocolo de fisio diario. Es de por vida. |
| **Cardio** | El 7K. Tiene fecha, así que **manda**. |
| **Físico** | Hombros a frecuencia alta, cambios estéticos rápidos, que enganche. |
| **Panza** | *"Sobre todo quemar calorías para bajar la panza."* |

La regla que resuelve el conflicto entre los cuatro, y que está escrita en el
código: **el 7K manda, pero hay que bajar panza.** Por eso el déficit se
concentra en los días que no hay intensidad, y los días de correr fuerte se
come. La grasa alimenta el trote suave, pero no alimenta 4:45/km.

---

## 2. El contexto real

Esto es lo que hace que la app sea como es. Sin esto, las decisiones de abajo
parecen arbitrarias.

- **Llega a casa a las 16:00 y se acuesta a las 23:00.** Siete horas.
- **El problema no es la falta de tiempo: es el sofá.** *"Llego a casa y me
  tumbo en el sofá y me consume el móvil."* Eso es ~85% del problema, y **no es
  un problema que resuelva una app.** La app puede ayudar a la visualización y
  a la estructura; el resto es suyo.
- **Vive en pareja.** La tarde no es solo suya. *"Tampoco hay que ser abusivo
  que tengo vida."*
- **Come en la cantina** de lunes a viernes. No pesa nada a mediodía.
- **86 kg, 183 cm.** Sobrepeso ligero, algo de exceso de grasa. IMC 25,7.
- **Los lunes son de tenis**, 20:00-21:30. No es negociable y no es un hueco:
  es 1h30 de intensidad real y cuenta como sesión.
- **Tiene muchas áreas a propósito.** *"Mi problema es no tener cosas que
  hacer. Si no estructuro mi vida con rutina no cumplo."* Reducir áreas fue una
  propuesta mía y **estaba equivocada**.
- **Quiere ver progreso rápido.** *"Hay que ver progreso y rápido mejor para
  que enganche mientras creamos disciplina."* La idea del "mínimo viable diario"
  la rechazó.
- **La referencia es una libreta de gimnasio.** *"Cuando estuve a full de gym,
  iba con una libreta… eso quiero replicar: el diario, el compararte y ver cómo
  vas."*

---

## 3. Qué hay hecho

### La base (bloques 1 y 2 de trabajo)

- **Arquitectura en tres capas** con dependencias en un solo sentido:
  `features → domain`, y `design` como hoja. Ver `docs/ARQUITECTURA.md`.
- **Adaptador de almacenamiento** (`get/set/list/borrar`): ninguna pantalla
  sabe dónde viven los datos. Cambiar `localStorage` por un servidor no toca
  ninguna pantalla.
- **Esquema versionado con migraciones** (`src/lib/storage/esquema.js`), hoy en
  la **v4**. Regla: *nunca se renombra ni se borra un campo guardado sin
  escribir su migración*.
- **El plan sale de una sola fecha** (`FECHA_INICIO`). Todo lo demás se deriva.
- **Los compromisos fijos** (el tenis) son de primera clase, con detección de
  colisiones.
- **157 pruebas** con el runner de Node, sin dependencias nuevas.
- **ESLint con `no-undef`**, que es lo único que pilla un import que falta. El
  build, el typecheck y las pruebas pasaban con la app rota; esta regla no.

### Nutrición — donde está el grueso del trabajo reciente

Costó cuatro reformulaciones llegar aquí. El resultado:

- **Tu menú del día** (`menu-dia.js`), con la forma de los programas del
  dietista de 2022 y los alimentos que hay en casa.
- **Apuntas lo que comes escribiéndolo** (`escribir.js`): *"macarrones con
  tomate 450 kcal"*. Nada de elegir de listas. Si usas una app de fotos que te
  da las calorías, ahí copias el número.
- **Las cantidades de lo que queda se recalculan** (`cuadrar.js`) para que el
  día cuadre. Si a mediodía cayeron macarrones y pan, la pasta de la cena baja.
- **La dieta la edita él**: gramos, quitar alimentos, quitar comidas enteras.
- **La lista de la compra** (`compra.js`) sale sola del menú, por secciones del
  súper, con alternativas convertidas y lo que se come fuera descontado.

### Magia — repaso espaciado

Las cartas de estudio aplicadas a una habilidad de manos (`repaso.js`). Le das
caña a uno; cuando lo dominas, el siguiente ocupa su sitio **ese mismo día** y
el dominado vuelve a los 2, 5, 12, 30, 60 y 90 días. Se avanza **dominando, no
esperando**.

---

## 4. Las reglas que no se tocan

Cada una costó una vuelta entera. Romperlas es repetir un error ya cometido.

1. **El menú es suyo, no mío.** El de partida es una propuesta; el que se usa
   es el que él ha editado. La app recalcula sobre el suyo.
2. **Se escribe, no se elige.** Ninguna lista va a tener lo que ha comido, y
   buscar en ella cuesta más que escribirlo.
3. **Manda lo que escribe.** Si pone un número de calorías, ese es el número.
4. **Se enseña lo entendido antes de guardarlo**, con el número editable y de
   dónde sale. Un contador que no puedes ver ni corregir es un contador en el
   que dejas de creer a la semana.
5. **Si no se entiende algo, se dice.** Nunca se cuela un cero.
6. **Comer fuera no es quitarlo del menú.** La comida de la cantina cuenta para
   los macros pero no va al carro. Confundirlo rompe una de las dos cosas.
7. **La verdura y la fruta no se tocan** al recalcular: son saciedad.
8. **La proteína no se sacrifica** para ahorrar calorías. Las calorías se
   recuperan mañana; la proteína que falta hoy se paga en el hombro.
9. **Si no cabe el menú entero, se quita lo prescindible** en vez de encoger
   todo. Antes saltarse el almuerzo que cenar 20 g de pasta.
10. **Se avanza dominando, no esperando.** Vale para la magia y vale para todo
    lo que venga después.
11. **Un guardado nunca puede tener menos datos que el anterior.**
12. **Nada se borra: se apila una capa encima.** Por eso "volver al original"
    siempre funciona.
13. **Pensar siempre en él: cómodo, y que nada invite a escaquearse.** Es la
    regla que manda sobre las demás al diseñar cualquier cosa. En concreto:
    - **Nada suelto "para casa".** Lo que va pegado a una sesión se hace; lo
      que queda suelto, no. Por eso la movilidad va dentro de las sesiones.
    - **Un toque, no un formulario.** Todo viene relleno con lo de la última
      vez o lo que pide el plan; apuntar es confirmar.
    - **Ningún botón dice "saltar" donde se puede evitar.** El botón dice lo
      que viene ("a la sesión", "terminar"); lo opcional no bloquea ni culpa.
    - **Lo que se pide, ajustado a como está hoy.** Un ritmo imposible o una
      sesión eterna es una invitación a no ir.
    Antes de añadir algo, preguntarse: ¿esto se lo hace más fácil, o le da
    una excusa?

---

## 5. Los errores que ya cometimos

Están aquí para no repetirlos.

- **Los lunes eran de tenis y el plan tenía tenis en 3 de 11 semanas.** Lo
  detectó él, no las pruebas. De ahí salieron `COMPROMISOS` y sus pruebas.
- **Propuse reducir de siete áreas a cuatro.** Era exactamente lo contrario de
  lo que necesita. Las áreas son deliberadas.
- **Propuse un "mínimo viable diario".** Lo rechazó: quiere ver progreso rápido.
- **Llené la tarde sin contar con que vive en pareja.**
- **Entendí mal la nutrición tres veces seguidas**: primero inventé cenas
  nuevas desde una despensa, luego hice que se eligiera de listas, y solo a la
  tercera —cuando él lo escribió— quedó claro que lo que quería era escribir
  lo que ha comido y que la app recalcule. **Cuando corrija dos veces lo mismo,
  parar y pedir que lo escriba él.**
- **La app se cayó al pasar de día** por un import que faltaba, con el build,
  el typecheck y 54 pruebas en verde. Por eso existe la regla `no-undef`.
- **Un merge con la cabeza desactualizada** se llevó un commit por delante. Por
  eso se pasa `expectedHeadSha`.
- **Terminar el onboarding borraba todo lo guardado.** Apareció por casualidad,
  probando otra cosa.

---

## 6. Qué queda

### Lo siguiente, por orden de lo que cuesta no hacerlo

Hecho el 24 de septiembre: **la app abre sin cobertura**, **el plan en el
calendario del móvil con aviso antes de cada sesión**, **semanas cumplidas**,
**la movilidad va dentro de las sesiones** (nada
suelto para casa; el calentamiento de running es el del plan), **récords y
resumen de la semana**, **series de
running ajustadas a la última prueba** y **voz en el temporizador**.

Hecho el 22 de septiembre: **la libreta** (al terminar una sesión se compara
con la última vez, y las pruebas dicen si vas en línea con el objetivo), **la
copia de la semana** (aviso en HOY, se guarda con un toque en Archivos o
iCloud) y **Progreso con cintura, hombro/cintura, laterales y fotos**.

1. **Traer los datos de Strava solos.** Necesita conectar la cuenta y un
   pequeño servidor.
2. **Modo oscuro.**
3. **Registrar actividad no planificada** (una pachanga, una caminata larga) y
   eventos de agenda sueltos.
4. **Reglas de ajuste automático** cuando se falla un día. Hoy están escritas
   en Coach → Plan, pero la sesión se mueve a mano.
5. **Las calorías hay que verificarlas contra la cintura**, no contra la
   báscula. 2.500 / 2.100 es una estimación razonada, no una verdad. Si en tres
   semanas la cintura no se mueve, bajar 150 kcal de HC en los días de
   RECORTAR. Si el ritmo Z2 se pone duro, subirlas.

### Lo grande, para cuando acabe el bloque

El 6 de diciembre se acaba el Bloque 1, y ahí es donde se comprueba si la app
sirve de verdad: **empezar un Bloque 2 no debería requerir tocar código.** Hoy
requiere escribir un archivo de plan nuevo a mano. El modelo general
—Área / Bloque / Práctica / Registro / Revisión— está en `docs/ROADMAP.md`, y
es lo que convierte esto en una app de vida en vez de una app de running.

---

## 7. Cómo seguir

**Dónde tocar cada cosa:**

| Si quieres cambiar… | Toca |
|---|---|
| Qué toca cada día del bloque | `src/domain/plan/bloque-1-base-7k.js` |
| Las fechas | `FECHA_INICIO` en ese mismo archivo. Todo lo demás se deriva |
| El tenis u otro compromiso fijo | `src/domain/compromisos.js` |
| Las calorías o los macros objetivo | `src/domain/nutricion/dias.js` |
| El menú de partida | `src/domain/nutricion/menu-dia.js` |
| Cómo se recalcula el día | `src/domain/nutricion/cuadrar.js` |
| Qué entiende al escribir la comida | `src/domain/nutricion/escribir.js` |
| La lista de la compra | `src/domain/nutricion/compra.js` |
| Los intervalos de repaso | `src/domain/habilidades/repaso.js` |
| La forma de lo que se guarda | `src/lib/storage/esquema.js` **+ su migración** |

**Antes de dar nada por bueno:**

```bash
npm test          # 157 pruebas
npm run lint      # no-undef es la que importa
npm run build
```

Y después, **abrirlo en un navegador de verdad a 390 px de ancho**. El fallo
que tiró la app pasó las tres comprobaciones de arriba. Lo único que lo habría
pillado es abrirla.

**Al terminar:** anotar el cambio en `CHANGELOG.md` —qué cambió y *por qué*, no
qué fichero se tocó— y, si la decisión tiene consecuencias, en
`docs/DECISIONES.md`.
