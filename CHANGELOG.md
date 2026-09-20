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

_Nada todavía._

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
