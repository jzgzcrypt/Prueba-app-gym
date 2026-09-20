export const FRASES_ENTRADA = [
  "Nadie va a hacerlo por ti. Muevete.",
  "El cuerpo no pregunta si tienes ganas. Tu tampoco deberias.",
  "Hoy toca. No hay debate.",
  "El verano ya paso. Deja de arrastrarlo.",
  "25 de octubre no espera a que te apetezca.",
  "Sube, entrena, tacha. Repite mañana.",
  "No estas cansado. Estas sin excusa.",
  "Cada dia que no bajas es un dia que retrocedes.",
  "El objetivo no se negocia. El horario, tampoco.",
  "Menos pensar. Mas bajar.",
];
export function getFraseHoy(dayIdx) { return FRASES_ENTRADA[dayIdx % FRASES_ENTRADA.length]; }
