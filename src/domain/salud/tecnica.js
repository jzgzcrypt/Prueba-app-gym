// ─── HÁBITO DE TÉCNICA — cadencia y apoyo, repetición deliberada en cada carrera ──
export const TECNICA_CADENCIA = {
  nombre: "Cadencia 170-180",
  foco: "Solo cadencia",
  pasos: [
    "Los primeros 2-3 minutos de cada carrera, cuenta tus pasos durante 15 segundos y multiplica por 4.",
    "El objetivo es 170-180 pasos por minuto — pasos cortos y rápidos, no zancada larga.",
    "Si vas por debajo, acorta el paso sin frenar el ritmo — la sensación es de \"pisar rápido\", casi como correr sobre brasas.",
    "No hace falta contar toda la carrera — solo al principio, hasta que el cuerpo encuentra el ritmo. Luego mantenlo de memoria.",
  ],
  verificable: "170-180 pasos/minuto. Si cuentas 15 segundos y sale menos de 42-45 pasos, vas por debajo — acorta la zancada.",
};
export const TECNICA_APOYO = {
  nombre: "Cadencia + apoyo de mediopié",
  foco: "Cadencia + apoyo",
  pasos: [
    "Mantén la cadencia 170-180 que ya dominas de las semanas anteriores.",
    "Además, siente dónde toca el pie el suelo: debe ser con la parte media del pie, casi bajo la cadera, no con el talón por delante del cuerpo.",
    "Imagina que 'apartas' el suelo hacia atrás en vez de 'frenar' con el talón en cada paso.",
    "Tronco ligeramente inclinado hacia delante desde el tobillo, no desde la cintura.",
  ],
  verificable: "El apoyo debe sentirse debajo de ti, no por delante. Si notas un frenazo en cada paso, el talón está adelantado.",
};
export function getTecnicaEj(weekN) { return weekN <= 4 ? TECNICA_CADENCIA : TECNICA_APOYO; }
