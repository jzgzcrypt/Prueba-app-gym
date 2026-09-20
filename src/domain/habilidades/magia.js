import { semanaHabito } from "../salud/cuello.js";
// ─── HÁBITO APARTE — MAGIA CON CARTAS (memoria/matemática) ────────────────────
// Un truco nuevo cada 1-2 semanas. Practica 10 min/dia. Progreso = dominio del truco, no velocidad.
export const MAGIA_TRUCOS = [
  { id: "t1", semana: 1, nombre: "The Glide", dificultad: "Fundamento",
    necesitas: "Una baraja de 52 cartas.",
    descripcion: "Movimiento clásico de manejo oculto: haces creer que sacas la carta inferior del mazo cuando en realidad sacas la penúltima, dejando la de abajo escondida en su sitio. Es la base de decenas de efectos de cartomagia.",
    metodo: [
      "Sujeta el mazo boca abajo en la mano no dominante, agarre normal de reparto.",
      "Con el pulgar de la mano dominante, empuja la carta inferior ligeramente hacia fuera, como si fueras a sacarla.",
      "En el mismo movimiento, desliza esa carta hacia atrás sin sacarla del todo y saca la SIGUIENTE carta (la penúltima) por debajo de ella.",
      "El espectador ve tu mano sacando 'la de abajo' — en realidad es la de justo encima, mientras la verdadera carta inferior queda oculta.",
      "Practica el movimiento despacio, sintiendo la diferencia entre 'empujar y deslizar' frente a 'sacar directamente'.",
    ],
    presentacion: "El Glide se hace mejor mirando al espectador, no a tus manos — el movimiento debe sentirse automático antes de intentar usarlo en presentación.",
    dominio: "Lo dominas cuando puedes hacerlo 10 veces seguidas sin mirar tus manos, y grabándote en vídeo no se distingue del gesto de sacar la carta real." },

  { id: "t2", semana: 2, nombre: "The Control", dificultad: "Fundamento",
    necesitas: "Una baraja de 52 cartas.",
    descripcion: "Técnica esencial para devolver una carta elegida al mazo y mantenerla en una posición conocida (normalmente arriba o abajo), sin que el espectador note ningún movimiento sospechoso.",
    metodo: [
      "El espectador elige una carta y la memoriza.",
      "Extiende el mazo en abanico para que la devuelva en cualquier punto.",
      "Al cerrar el abanico, desliza el meñique (o el dedo índice) justo encima de la carta devuelta, marcando una pequeña separación (break).",
      "Corta el mazo por ese punto exacto — la carta elegida queda arriba (o abajo, según el corte) de forma natural.",
      "Practica sentir el break sin mirarlo — debe ser algo que notas con el dedo, no que buscas con los ojos.",
    ],
    presentacion: "Habla mientras cierras el abanico y cortas — el corte debe parecer un gesto casual de ordenar el mazo, no una maniobra deliberada.",
    dominio: "Lo dominas cuando localizas y mantienes el break de forma consistente 8 de cada 10 veces, sin mirar el punto de corte." },

  { id: "t3", semana: 3, nombre: "Carta Clave", dificultad: "Fundamento",
    necesitas: "Una baraja normal.",
    descripcion: "Memorizas una sola carta del mazo entero (la 'clave'). Cuando el espectador corta y devuelve su carta elegida, queda justo al lado de tu clave — así la localizas sin fallar, sin necesitar el break físico de The Control.",
    metodo: [
      "Al barajar de forma casual antes del truco, echa un vistazo a la carta del fondo del mazo y memorízala — esa es tu clave.",
      "Extiende el mazo en abanico y pide que saque una carta, la mire y la recuerde.",
      "Pide que corte el mazo por donde quiera y coloque su carta encima del corte, luego complete el corte (así su carta queda justo debajo de tu carta clave).",
      "Da el mazo a barajar de forma superficial (riffle simple, sin cortar de más).",
      "Busca tu carta clave en el mazo — la carta justo después de ella es la del espectador.",
    ],
    presentacion: "El vistazo a tu carta clave debe camuflarse en un barajado natural, nunca mirando el mazo de forma obvia justo antes de pedir que corten.",
    dominio: "Lo dominas cuando localizas tu carta clave en el mazo extendido en menos de 2 segundos, sin dudar ni repasar carta por carta visiblemente." },

  { id: "t4", semana: 4, nombre: "The Glimpse", dificultad: "Fundamento",
    necesitas: "Una baraja de 52 cartas.",
    descripcion: "Métodos secretos para ojear y conocer la identidad de una carta (normalmente la superior o inferior del mazo) sin que el espectador se dé cuenta — completa el trío de fundamentos junto con The Glide y The Control.",
    metodo: [
      "Versión básica: al cortar el mazo de forma casual, deja que tu pulgar 'resbale' ligeramente el borde superior de la mitad inferior, dejando ver el índice de esa carta una fracción de segundo.",
      "El vistazo debe ocurrir mientras miras a otro sitio (al espectador, a la mesa) — nunca mires directamente el mazo en ese instante.",
      "Practica el corte natural muchas veces hasta que el 'resbalón' del pulgar sea indistinguible de un corte normal.",
      "Combina con The Control: primero controlas la carta a una posición conocida, luego la ojeas para confirmar antes de revelar.",
    ],
    presentacion: "El Glimpse funciona mejor combinado con una distracción verbal — pregunta algo al espectador justo en el instante del vistazo.",
    dominio: "Lo dominas cuando puedes ojear la carta de forma fiable sin que nadie que te esté observando de cerca lo note, ni siquiera en cámara lenta." },

  { id: "t5", semana: 5, nombre: "The Force", dificultad: "Técnica de presentación",
    necesitas: "Una baraja de 52 cartas.",
    descripcion: "Conjunto de técnicas psicológicas y mecánicas para hacer que el espectador 'elija libremente' una carta que en realidad tú has determinado de antemano. Es la pieza que conecta la técnica pura con el efecto de magia real.",
    metodo: [
      "Versión clásica (cross-cut force): coloca la carta forzada arriba del mazo, corta el mazo dejando las dos mitades cruzadas en la mesa, y pide al espectador que señale un punto.",
      "Con naturalidad, retira la mitad superior y muestra la carta justo debajo del punto que señaló como 'su elección' — es la carta que ya habías colocado.",
      "Practica el gesto de cortar y cruzar las mitades como un movimiento fluido, sin pausas que delaten preparación.",
      "El lenguaje importa: nunca digas 'elige una carta' de forma que suene a instrucción técnica — hazlo sonar espontáneo.",
    ],
    presentacion: "El Force depende más de tu seguridad y ritmo verbal que de la técnica de manos — practica también lo que vas a decir, no solo el movimiento.",
    dominio: "Lo dominas cuando lo ejecutas con alguien que no sabe nada de magia y no percibe ninguna sugestión ni instrucción forzada." },

  { id: "t6", semana: 6, nombre: "La Interacción", dificultad: "Presentación",
    necesitas: "Nada — es una semana de práctica conversacional, no de técnica de manos.",
    descripcion: "Semana de pausa técnica dedicada a la comunicación y dinámica con el espectador — la pieza que convierte 'sé hacer trucos' en 'hago magia de verdad'. Sin esto, hasta el mejor manejo de cartas se siente frío.",
    metodo: [
      "Revisa los 5 fundamentos anteriores (Glide, Control, Carta Clave, Glimpse, Force) y para cada uno, decide qué vas a DECIR mientras lo ejecutas.",
      "Practica el ritmo: habla más lento de lo normal durante el momento técnico, y acelera en el momento de la revelación — el contraste genera impacto.",
      "Practica mantener contacto visual con el espectador en los momentos críticos, en vez de mirar tus propias manos.",
      "Ensaya cómo reaccionar si algo sale mal — un mago seguro improvisa con naturalidad en vez de congelarse.",
    ],
    presentacion: "Esta semana ES la presentación — no hay técnica nueva, es integrar todo lo anterior con seguridad y ritmo.",
    dominio: "Lo dominas cuando puedes ejecutar cualquiera de los 5 fundamentos anteriores manteniendo conversación fluida y contacto visual, sin que la técnica se note." },

  { id: "t7", semana: 7, nombre: "Shuffle Control", dificultad: "Técnica avanzada",
    necesitas: "Una baraja de 52 cartas.",
    descripcion: "Método avanzado para controlar la posición de una carta elegida mientras mezclas el mazo con apariencia de barajado real (riffle shuffle) — mucho más convincente que cortar el mazo sin más.",
    metodo: [
      "Con la carta elegida ya controlada arriba del mazo (usando The Control), divide el mazo en dos mitades para un riffle shuffle.",
      "Al entrelazar las dos mitades, deja caer la última carta de la mitad que contiene tu carta controlada la ÚLTIMA, de modo que quede de nuevo arriba del mazo tras el barajado.",
      "Practica el riffle shuffle en sí primero, sin preocuparte del control, hasta que sea fluido y de aspecto real.",
      "Después añade el control: la clave es que la carta objetivo caiga literalmente la última en el entrelazado.",
    ],
    presentacion: "Baraja con normalidad, sin ralentizar el movimiento en el momento del control — la velocidad constante es lo que lo hace invisible.",
    dominio: "Lo dominas cuando tras el shuffle, la carta controlada está donde esperabas 9 de cada 10 veces, con un barajado de aspecto completamente normal." },

  { id: "t8", semana: 8, nombre: "Biddle Trick", dificultad: "Efecto completo",
    necesitas: "Una baraja de 52 cartas — este es tu primer efecto completo, construido sobre las técnicas anteriores.",
    descripcion: "Clásico juego de magia con cartas que combina control, un cambio de cartas visualmente limpio y una revelación sorprendente — el primer efecto de principio a fin de tu repertorio.",
    metodo: [
      "El espectador elige y memoriza una carta, que controlas arriba del mazo (The Control, semana 2).",
      "Cuenta varias cartas de la parte superior del mazo a la mesa, en un movimiento que oculta un cambio de la carta elegida por otra.",
      "Este cambio (Biddle Move) requiere práctica específica: al pasar el mazo de una mano a otra, un dedo retiene una carta extra que sustituye visualmente a la controlada.",
      "La revelación final muestra que la carta ha 'viajado' de donde el espectador pensaba a otro punto del mazo.",
      "Practica cada fase por separado antes de unirlas: primero el control, después el cambio, después la revelación.",
    ],
    presentacion: "Este efecto se beneficia de una historia — no lo presentes como 'mira este truco', dale un motivo narrativo a por qué la carta 'viaja'.",
    dominio: "Lo dominas cuando ejecutas las 3 fases (control, cambio, revelación) de seguido sin pausas técnicas visibles, ante alguien que no conoce el método." },

  { id: "t9", semana: 9, nombre: "4 Card Production", dificultad: "Efecto visual",
    necesitas: "Una baraja de 52 cartas.",
    descripcion: "Técnica de producción visual e impactante de 4 cartas de forma consecutiva y sorprendente — un efecto muy visual que no depende de que el espectador elija nada de antemano.",
    metodo: [
      "Prepara 4 cartas concretas (por ejemplo, los 4 ases) repartidas en distintos puntos accesibles del mazo o en tu mano.",
      "Muestra las manos aparentemente vacías antes de empezar — esto es clave para el impacto.",
      "Produce cada carta con un movimiento distinto (una del aire, una de la manga simulada, una del propio mazo, una del bolsillo) para que no se repita el mismo patrón 4 veces.",
      "Practica cada producción individualmente muchas veces antes de encadenar las 4 seguidas.",
      "El ritmo debe acelerar ligeramente con cada producción, terminando con la más sorprendente.",
    ],
    presentacion: "Este efecto es puramente visual — apenas necesita palabras, deja que el asombro hable. Silencio y ritmo son tus mejores herramientas aquí.",
    dominio: "Lo dominas cuando las 4 producciones fluyen sin pausas ni dudas, y el espectador no puede anticipar de dónde saldrá la siguiente carta." },

  { id: "t10", semana: 10, nombre: "Cannibal Cards", dificultad: "Rutina clásica",
    necesitas: "5 cartas específicas del mazo (normalmente 4 iguales + 1 diferente, por ejemplo 4 Jacks + 1 carta indiferente).",
    descripcion: "Rutina clásica de magia temática en la que varias cartas 'se comen' entre sí una a una hasta quedar solo una, y luego reaparecen todas juntas al final — una historia visual completa con inicio, desarrollo y sorpresa.",
    metodo: [
      "Coloca las 4 cartas iguales boca arriba sobre la mesa, con la quinta carta boca abajo entre ellas (representa a la 'víctima').",
      "En cada ronda, una de las cartas iguales 'desaparece' de su sitio (usando una variante de control aprendida en semanas anteriores) y 'reaparece' bajo el mazo — narrativamente, se ha comido a la víctima.",
      "Repite la secuencia con las cartas restantes, manteniendo el mismo patrón de desaparición para dar consistencia.",
      "El final revela que las 4 cartas han vuelto a estar juntas y la 'víctima' ha desaparecido del todo — usando una producción similar a la técnica de la semana 9.",
      "Ensaya la narración completa: esta rutina se sostiene tanto en la historia como en la técnica.",
    ],
    presentacion: "Cuenta la historia de las cartas caníbales en voz alta mientras ejecutas cada fase — la narrativa hace que el espectador siga la lógica del efecto sin fijarse en las manos.",
    dominio: "Lo dominas cuando puedes contar la rutina completa de principio a fin, con las 4 fases de desaparición y la reaparición final, sin dudar en ningún punto de la historia ni de la técnica." },

  { id: "t11", semana: 11, nombre: "Análisis y perfeccionamiento", dificultad: "Integración",
    necesitas: "Todo lo practicado en las 10 semanas anteriores, y si puedes, grabarte en vídeo.",
    descripcion: "Semana de revisión y corrección, igual que el taper del running — no se aprende nada técnico nuevo, se pule lo que ya sabes para cerrar el bloque con un repertorio realmente sólido, no solo memorizado.",
    metodo: [
      "Revisa tus 10 lecciones anteriores y marca cuáles tienes realmente dominadas frente a las que solo conoces a medias.",
      "Elige 2-3 efectos completos (Biddle Trick, 4 Card Production, Cannibal Cards) y ensáyalos de principio a fin, grabándote en vídeo.",
      "Al revisar el vídeo, busca: momentos donde miras tus manos en vez de al espectador, pausas técnicas visibles, y falta de narrativa.",
      "Corrige un problema a la vez, no todos de golpe — vuelve a grabar y compara.",
      "Cierra la semana con una actuación completa (aunque sea solo para ti o alguien de confianza) combinando 2-3 efectos en una rutina de 5 minutos.",
    ],
    presentacion: "El objetivo de esta semana es la autocrítica constructiva — no busques la perfección, busca ver con claridad qué necesitas seguir practicando en el próximo bloque.",
    dominio: "Lo dominas cuando puedes ejecutar una rutina de 2-3 efectos encadenados sin pausas técnicas visibles, con narrativa consistente y contacto visual con quien te mira." },
];
export function getTrucoSemana(weekN) {
  const w = semanaHabito(weekN);
  const disponibles = MAGIA_TRUCOS.filter(t => t.semana <= w);
  return disponibles.length > 0 ? disponibles[disponibles.length - 1] : null;
}

// ─── HÁBITO APARTE — GUERRERO: respiración táctica y control bajo presión ─────
// Progresión de 3 fases a lo largo de las 11 semanas. Practica diaria, 5-10 min.
