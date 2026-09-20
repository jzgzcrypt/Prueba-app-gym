import { semanaHabito } from "@/domain/salud/cuello";
// ─── GUERRERO — sistema de 4 pilares en paralelo ─────────────────────────────
export const GUERRERO_PILARES = {
  calma: {
    nombre: "Calma — respiración táctica", color: "#3A3A38",
    niveles: [
      { nivel: 1, nombre: "Box breathing — el patrón base", necesitas: "Nada, sentado o de pie.",
        metodo: ["Espalda recta, manos relajadas.", "Inhala 4s por la nariz llenando el abdomen.", "Retén 4s sin tensión.", "Exhala 4s por la boca vaciando completo.", "Retén vacío 4s. Repite el ciclo 5 minutos."],
        verificable: "Al terminar, tu ritmo cardíaco en reposo debe notarse claramente más bajo." },
      { nivel: 2, nombre: "Retención extendida + incomodidad controlada", necesitas: "Nada, mismo sitio tranquilo.",
        metodo: ["Inhala 4s, retén 6-8s, exhala 4s, retén vacío 4s.", "En la retención llena, observa la tensión sin luchar contra ella.", "Si el cuerpo pide respirar, aguanta 2s más con calma, no con fuerza.", "10 ciclos, 2 veces al día si puedes."],
        verificable: "Retienes 6-8s sin que se dispare la ansiedad — la siguiente respiración sale controlada, no como jadeo de alivio." },
      { nivel: 3, nombre: "Respiración bajo estrés físico real", necesitas: "Espacio para 30s de movimiento (sentadillas, burpees).",
        metodo: ["Genera estrés real: 30-40s de sentadillas rápidas o burpees.", "Nada más parar, empieza inmediatamente el patrón 4-6-4-4.", "No esperes a recuperar el aliento solo — impón el patrón encima del caos.", "Sigue hasta controlar la respiración con precisión otra vez."],
        verificable: "El tiempo que tardas en recuperar el control tras el esfuerzo debe bajar cada semana — cronométralo." },
    ] },
  golpeo: {
    nombre: "Golpeo — boxeo de sombra", color: "#B8462F",
    reglas: [
      "Frena el golpe antes de bloquear el codo — mantén un micro-doble en el codo al final del recorrido, aprieta el puño y el core justo en el milisegundo del impacto ficticio.",
      "Grábate en vídeo una vez por semana — es la mejor forma de detectar si bajas la mano contraria, abres demasiado los codos, o cruzas las piernas al desplazarte.",
      "Mantén la mirada al frente, nunca al suelo — la vista siempre fija en los ojos del rival imaginario, esquives o golpees abajo.",
    ],
    niveles: [
      { nivel: 1, nombre: "Mecánica limpia y memoria neuromuscular", necesitas: "Espacio para moverte, 20-30 min, 3 días/semana. Opcional: comba.",
        metodo: [
          "Calentamiento (5-10 min): salto de comba o trote en el sitio + movilidad de hombros, cadera y tobillos.",
          "Técnica estática frente al espejo (10 min): guardia, jab, cross y ganchos a velocidad media, rotando cadera y talón en la cruzada y los ganchos.",
          "Round 1 (2 min): solo desplazamiento — avanza, retrocede y muévete a los lados sin cruzar las piernas, distancia fija entre pies.",
          "Round 2 (2 min): desplazamiento + jab (1) y jab-cross (1-2) — da el paso al mismo tiempo que tiras el golpe.",
          "Round 3 (2 min): combinaciones simples (1-2-gancho) — golpea y vuelve inmediatamente a cubrirte las mejillas con los puños.",
          "Acondicionamiento (5 min): planchas abdominales y flexiones.",
        ],
        verificable: "El puño vuelve siempre a la guardia después de cada golpe. Si notas que se queda abajo, vas demasiado rápido para tu nivel actual — baja el ritmo." },
      { nivel: 2, nombre: "Integración defensiva y movimiento de cabeza", necesitas: "Espacio para moverte, 30-40 min, 3-4 días/semana. Regla de oro: después de cada combinación, mueves la cabeza o te desplazas.",
        metodo: [
          "Calentamiento y movilidad de esquivas (10 min): slips (inclinar el torso sutilmente hacia los lados) y rolls (dibuja una U con la cabeza pasando por debajo de un golpe imaginario).",
          "Round 1 (2 min): ataque + esquiva — ej. 1-2 seguido de slip a la derecha.",
          "Round 2 (2 min): esquiva + contraataque — ej. slip a la izquierda, crochet de izquierda, cross.",
          "Round 3 (2 min): bloqueos y pasos atrás — imagina que te atacan, bloqueas arriba, das paso atrás, respondes con 1-2.",
          "Round 4 (2 min): sombra continua buscando fluidez entre atacar, esquivar y volver a salir.",
        ],
        verificable: "Tras cada combinación de golpes, tu cuerpo se mueve automáticamente (cabeza o desplazamiento) sin que tengas que pensarlo — si te quedas quieto después de golpear, vuelve al nivel 1 unas sesiones más." },
      { nivel: 3, nombre: "Ángulos, visualización táctica y ritmo", necesitas: "Espacio para moverte, 40-45 min, 4 días/semana.",
        metodo: [
          "Round 1 — distancia larga (3 min): jabs de tanteo, fintas con el cuerpo/manos, trabajo de pies manteniendo lejos al oponente imaginario.",
          "Round 2 — ángulos y pivotaje (3 min): lanza 1-2, pivota 45° sobre el pie adelantado para salir de la línea, entra con gancho al hígado o uppercut.",
          "Round 3 — presión y salida (3 min): simula estar contra las cuerdas o acorralado — bloquea, esquiva, sal con un paso lateral en ángulo.",
          "Round 4 — cambios de ritmo (3 min): dos golpes suaves de distracción para cegar, seguidos de un impacto fuerte y explosivo abajo o arriba.",
          "Round 5 — sombra libre con visualización plena (3 min): combina todo lo aprendido visualizando la respuesta de un rival real.",
        ],
        verificable: "Pivotas 45° sin perder el equilibrio ni cruzar los pies, y puedes encadenar los 5 rounds manteniendo la mirada al frente en todo momento, no al suelo." },
      { nivel: 4, nombre: "Alta intensidad y condición de guerrero", necesitas: "Espacio para moverte, 4-5 días/semana. Opcional: mancuernas muy ligeras (0.5-1kg).",
        metodo: [
          "Formato combate: 6 a 8 rounds de 3 minutos, con 1 minuto de descanso activo o total entre cada uno.",
          "Variante con carga ligera (opcional): los 2 primeros rounds sosteniendo mancuernas de 0.5-1kg máximo, para ganar resistencia en hombros — suéltalas después y siente el incremento de velocidad.",
          "Finisher metabólico al terminar: 3 series de 30s sprawls (o burpees sin flexión) + 30s escaladores (mountain climbers) + 30s salto de comba rápido.",
        ],
        verificable: "Terminas el formato completo (6-8 rounds + finisher) sin que la técnica se degrade por el cansancio — si notas que bajas la guardia o pierdes forma en los últimos rounds, reduce a 6 rounds hasta adaptarte." },
    ] },
  mentalidad: {
    nombre: "Mentalidad — iniciativa y agresividad controlada", color: "#946800",
    niveles: [
      { nivel: 1, nombre: "Detectar el patrón reactivo", necesitas: "Solo atención durante el día.",
        metodo: ["Durante el día, identifica un momento en que reaccionaste tarde o dudaste antes de actuar (una decisión, una respuesta, un conflicto pequeño).", "Por la noche, anota mentalmente (o en la nota diaria) ese momento: qué pasó, cómo reaccionaste.", "No hace falta cambiar nada todavía — solo observar el patrón de dudar antes de actuar."],
        verificable: "Puedes identificar al menos un momento reactivo cada día sin esfuerzo, de forma automática." },
      { nivel: 2, nombre: "Practicar la decisión rápida", necesitas: "Situaciones cotidianas normales.",
        metodo: ["Elige una decisión pequeña al día (qué pedir, qué ruta tomar, cuándo hablar en una conversación) y decide en menos de 3 segundos, sin darle más vueltas.", "El objetivo no es acertar siempre — es entrenar el músculo de decidir sin dudar.", "Si te equivocas, sigue adelante sin volver atrás a corregir — asume la decisión."],
        verificable: "Decides en menos de 3 segundos en situaciones de bajo riesgo, sin sensación de ansiedad por la rapidez." },
      { nivel: 3, nombre: "Tomar la iniciativa en situaciones de tensión real", necesitas: "Una situación real de tu vida donde normalmente esperarías o evitarías.",
        metodo: ["Identifica una conversación o decisión que llevas evitando (un tema pendiente, una petición, un límite que poner).", "Actúa primero en vez de esperar a que la situación se resuelva sola o que el otro dé el paso.", "Usa la respiración del pilar Calma justo antes, para actuar con control, no con impulsividad."],
        verificable: "Has tomado la iniciativa en al menos una situación real que normalmente hubieras evitado o postergado." },
    ] },
  aplicacion: {
    nombre: "Aplicación — usarlo en tu vida real", color: "#2F6B4F",
    niveles: [
      { nivel: 1, nombre: "Registrar el primer uso real", necesitas: "Nada, solo estar atento.",
        metodo: ["Esta semana, usa el patrón de respiración de Calma en una situación real de tensión (no simulada): una discusión, una espera nerviosa, un contratiempo.", "Nada más pasar el momento, anota en tu nota diaria si funcionó o no y cómo te sentiste."],
        verificable: "Has aplicado la respiración al menos una vez en una situación real, no solo en la práctica programada." },
      { nivel: 2, nombre: "Combinar calma + iniciativa en una situación real", necesitas: "Una situación de cierta presión en tu semana.",
        metodo: ["Cuando surja una situación de presión real, aplica primero la respiración para bajar el ritmo, y después toma la iniciativa en vez de esperar.", "Es la unión de los 3 pilares anteriores en un solo momento real."],
        verificable: "Puedes describir un momento concreto donde combinaste calma + acción, no solo uno de los dos." },
      { nivel: 3, nombre: "Mentalidad de guerrero como hábito, no como técnica puntual", necesitas: "Nada — ya es parte de ti a estas alturas.",
        metodo: ["Ya no necesitas pensar conscientemente en aplicar el patrón — revisa esta semana cuántas veces lo has hecho sin planearlo.", "Sigue entrenando golpeo y calma con regularidad — el mantenimiento es lo que sostiene la habilidad a largo plazo."],
        verificable: "Notas que respondes con más calma e iniciativa por defecto, no solo cuando te acuerdas de practicarlo." },
    ] },
};
export const GUERRERO_PILAR_ORDEN = ["calma", "golpeo", "mentalidad", "aplicacion"];
export function getPilarGuerreroDelDia(weekN, dayIdx) {
  const key = GUERRERO_PILAR_ORDEN[dayIdx % GUERRERO_PILAR_ORDEN.length];
  const pilar = GUERRERO_PILARES[key];
  // Golpeo tiene su propio calendario de 4 fases (documento de shadowboxing real). Los demas pilares usan 3 niveles genericos.
  const w = semanaHabito(weekN);
  const nivel = key === "golpeo"
    ? (w <= 2 ? 1 : w <= 4 ? 2 : w <= 7 ? 3 : 4)
    : (w <= 3 ? 1 : w <= 7 ? 2 : 3);
  const nivelData = pilar.niveles.find(n => n.nivel === nivel) || pilar.niveles[pilar.niveles.length - 1];
  return { key, nombre: pilar.nombre, color: pilar.color, nivel, nivelNombre: nivelData.nombre, necesitas: nivelData.necesitas, metodo: nivelData.metodo, verificable: nivelData.verificable, reglas: pilar.reglas || null };
}
