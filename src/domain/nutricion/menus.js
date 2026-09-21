/**
 * MENUS REALES — los programas nutricionales que ya seguiste en 2022.
 *
 * Estan aqui como referencia, no como prescripcion: los escribio un dietista
 * para el cuerpo y el momento que tenias entonces, no para ahora. Sirven para
 * dos cosas — ver que forma tiene una comida de verdad en cada tipo de dia, y
 * tener de donde copiar en vez de improvisar a las nueve de la noche.
 *
 * Lo importante: ya separaban dia de entreno y dia de descanso, que es
 * exactamente la regla del bloque actual. La idea no es nueva; es tuya, y
 * funciono.
 */

export const MENUS = [
  {
    id: "2022-11",
    fecha: "8 de noviembre de 2022",
    titulo: "Programa nutricional",
    objetivo: "Optimizar la pérdida de grasa. Progreso en rendimiento.",
    aMedioPlazo: "Optimizar la estética.",
    dias: [
      {
        tipo: "entreno", etiqueta: "DÍAS DE ENTRENAMIENTO",
        kcal: 2081, hc: 223, prot: 153, grasa: 41,
        comidas: [
          { n: "Desayuno", t: "Porridge: 300 ml de bebida de almendras zero + 25 g de proteína whey + 30 g de harina de avena + 50 g de frutos rojos + 1 tostada de pan de molde + 60 g de aguacate" },
          { n: "Almuerzo o merienda", t: "Elegir una de las dos: 150-200 g de fruta de temporada (que no sea plátano) + yogur proteico" },
          { n: "Comida", t: "Hasta 300 g de verduras (salteadas, al horno, cocidas, al vapor, a la plancha o en crema) o ensalada + 150 g de pollo, pavo o burger meat magra + 45 g de arroz, quinoa o pasta + 150 g de fruta + 250 g de queso fresco batido desnatado" },
          { n: "Post-entreno", t: "Batido: 400 ml de bebida de almendras zero + 20 g de whey + 20 g de crema de arroz" },
          { n: "Cena", t: "Hasta 300 g de verduras o ensalada + 45 g de pasta integral, arroz integral o quinoa, o 200 g de patata cocida o boniato + tortilla de un huevo" },
          { n: "Precama", t: "250 g de queso fresco batido desnatado" },
          { n: "Suplemento", t: "0,1 g de creatina monohidrato por kg de peso" },
        ],
      },
      {
        tipo: "descanso", etiqueta: "DÍAS DE DESCANSO DE PESAS",
        kcal: 1814, hc: 215, prot: 153, grasa: 38,
        comidas: [
          { n: "Desayuno", t: "Porridge: 300 ml de bebida de almendras zero + 25 g de proteína whey + 30 g de avena + 1 tostada de pan de molde con 40 g de jamón serrano + 150 g de fruta de temporada (que no sea plátano)" },
          { n: "Comida", t: "Hasta 300 g de verduras o ensalada + 150 g de pollo, pavo o burger meat magra + 50 g de legumbres (contadas como lentejas; valen espirales rojas, o sustituir por arroz o pasta) + 150 g de fruta" },
          { n: "Merienda o almuerzo", t: "Elegir una de las dos: 250 g de queso fresco batido desnatado + 50 g de frutos rojos" },
          { n: "Cena", t: "Hasta 300 g de verduras o ensalada + 200 g de boniato o patata cocida + 150 g de pescado azul" },
          { n: "Suplemento", t: "0,1 g de creatina monohidrato por kg de peso" },
        ],
      },
    ],
  },
  {
    id: "2022-04",
    fecha: "12 de abril de 2022",
    titulo: "Programa nutricional",
    objetivo: "Optimizar la pérdida de grasa. Progreso en rendimiento.",
    aMedioPlazo: "Optimizar la estética.",
    dias: [
      {
        tipo: "entreno", etiqueta: "DÍAS DE ENTRENAMIENTO",
        kcal: 2081, hc: 269, prot: 159, grasa: 41,
        comidas: [
          { n: "Desayuno", t: "Porridge: 300 ml de bebida de almendras zero + 25 g de proteína whey + 50 g de harina de avena + 50 g de frutos rojos + 1 tostada de pan de molde + 60 g de aguacate" },
          { n: "Almuerzo o merienda", t: "Elegir una de las dos: 150-200 g de fruta de temporada (que no sea plátano) + yogur proteico" },
          { n: "Comida", t: "Hasta 300 g de verduras o ensalada + 150 g de pollo, pavo o burger meat magra + 65 g de arroz, quinoa o pasta + 150 g de fruta + 250 g de queso fresco batido desnatado" },
          { n: "Post-entreno", t: "Batido: 400 ml de bebida de almendras zero + 20 g de whey + 20 g de crema de arroz" },
          { n: "Cena", t: "Hasta 300 g de verduras o ensalada + 65 g de pasta integral, arroz integral o quinoa, o 300 g de patata cocida o boniato + tortilla de un huevo" },
          { n: "Precama", t: "250 g de queso fresco batido desnatado" },
          { n: "Suplemento", t: "0,1 g de creatina monohidrato por kg de peso" },
        ],
      },
      {
        tipo: "descanso", etiqueta: "DÍAS DE DESCANSO DE PESAS",
        kcal: 2007, hc: 238, prot: 158, grasa: 47,
        comidas: [
          { n: "Desayuno", t: "Porridge: 300 ml de bebida de almendras zero + 25 g de proteína whey + 30 g de avena + 1 tostada de pan de molde con 40 g de jamón serrano + 150 g de fruta de temporada (que no sea plátano)" },
          { n: "Comida", t: "Hasta 300 g de verduras o ensalada + 150 g de pollo, pavo o burger meat magra + legumbres + 150 g de fruta" },
          { n: "Merienda o almuerzo", t: "Elegir una de las dos: 250 g de queso fresco batido desnatado + 50 g de frutos rojos" },
          { n: "Cena", t: "Hasta 300 g de verduras o ensalada + boniato o patata cocida + 150 g de pescado azul" },
          { n: "Suplemento", t: "0,1 g de creatina monohidrato por kg de peso" },
        ],
      },
    ],
  },
];

/** Los intercambios: lo que de verdad hace que una dieta se pueda sostener. */
export const EQUIVALENCIAS = [
  { de: "100 g de arroz", a: "100 g de pasta, quinoa, cuscús o legumbres · 350-400 g de patata o boniato" },
  { de: "100 g de pechuga de pollo", a: "100 g de pavo, burger meat, pescado blanco o lomo adobado" },
  { de: "Verduras y hortalizas", a: "Intercambiables entre sí a igualdad de gramos" },
  { de: "Fruta", a: "Intercambiable entre sí a igualdad de gramos" },
];

export const TIPS_NUTRICION = [
  "Con la verdura puedes ser generoso. Si el tope dice 300 g y no te sacias, sube a 400 o 500: la dispersión de calorías es mínima.",
  "Para picar: bebidas sin azúcar y acalóricas, las que quieras.",
  "Salsas bajas en calorías, sí — pero mira la etiqueta. Más de 100 kcal por 100 g NO es baja en calorías.",
  "Edulcorantes para el café y el queso batido, sin problema.",
  "No tengas miedo de echar sal.",
  "Ensaladas y verdura: sal y vinagre, y si quieres un chorrito de aceite de no más de 5 g.",
];

export const CHEAT_MEAL = {
  titulo: "Comida libre",
  cuando: "Solo si hace falta",
  idea: "No es algo malo ni algo que rompa el plan: es una desconexión puntual que después hace que tengas más adherencia y disciplina. Su objetivo es el disfrute, así que no se calcula.",
  pautas: [
    "Si no quieres pasarte de calorías, alarga el ayuno esa mañana: un café solo y no comer hasta las 14:00.",
    "Basa el resto de comidas del día en verdura y carne o pescado magros: 150-200 g de proteína y verdura sin contar. Te sacias y dejas calorías libres para el cheat.",
    "Y en la comida libre: sal y disfruta sin preocuparte.",
  ],
};

/** Lo que decia el programa sobre el cardio, y que sigue siendo cierto. */
export const NEAT = {
  titulo: "Los pasos importan más que el cardio",
  texto: "Se tiende a creer que 30-40 minutos de cardio es lo apropiado para quitar la grasa sobrante. Resulta mucho más interesante subir el NEAT — el gasto que no viene del ejercicio — con actividad de baja intensidad y larga duración.",
  objetivo: "8.000 pasos los días de entreno · 10.000 los de descanso",
};
