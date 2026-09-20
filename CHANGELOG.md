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
