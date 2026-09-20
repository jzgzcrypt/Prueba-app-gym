import { C } from "../../design/tokens.js";

export const NUTRICION = {
  reglas: [
    { t: "Proteina primero", d: "En la cantina: elige siempre la opcion con mas proteina. Es la base del plato." },
    { t: "Doble verdura", d: "Si hay opcion, racion extra de verdura en vez de racion extra de carbohidrato." },
    { t: "Carbohidrato con criterio", d: "Dias de calidad (martes/domingo exigente): normal. Dias suaves: reduce." },
    { t: "Plancha antes que frito", d: "Si hay opcion a la plancha, esa. Las salsas cremosas suman calorias sin saciar." },
    { t: "Postre = fruta por defecto", d: "Dulce 2-3 veces por semana esta bien. No es eliminar, es frecuencia." },
  ],
  macros: [
    { n: "Proteina", v: "150-170g/dia", color: C.ok },
    { n: "Deficit", v: "300-500 kcal/dia", color: C.amber },
    { n: "Agua", v: "2.5-3L/dia", color: "#3A6EA5" },
  ],
  timing: [
    { fase: "Mantenimiento / Reconstruccion", d: "Deficit normal. Sin running de calidad, no compite con el rendimiento." },
    { fase: "Calidad (semanas 4-6)", d: "Mantén el deficit. Asegura carbohidrato el dia antes y el dia de calidad." },
    { fase: "Especificidad + Taper (semanas 7-10)", d: "Reduce el deficit a la mitad o pausa. El rendimiento manda sobre el peso." },
    { fase: "Dia del objetivo", d: "Sin deficit. Desayuno normal con carbohidrato 2-3h antes de correr." },
  ],
  alarma: "Si el ritmo Z2 se siente mas duro de lo normal, hay fatiga que no baja, o pierdes mas de 1kg en una semana: sube las calorias esa semana. El objetivo manda sobre la perdida de peso.",
};
