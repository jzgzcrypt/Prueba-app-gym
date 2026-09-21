"use client";

/**
 * Iconos de la barra inferior.
 *
 * Antes tres pestañas pintaban un cuadrado vacio y tres usaban ilustraciones
 * detalladas de otra parte de la app — dos de ellas, Progreso y Cuello, eran
 * literalmente el mismo dibujo de una columna vertebral. A 19 px no se leia
 * ninguna y la barra no parecia un conjunto.
 *
 * Trazo de 1.8 sobre 24x24, que es lo que se lee a ese tamaño.
 */
const base = (activo) => ({
  width: 21, height: 21, viewBox: "0 0 24 24", fill: "none",
  stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round",
  opacity: activo ? 1 : 0.55,
});

export function IconoNav({ nombre, activo }) {
  const p = base(activo);
  switch (nombre) {
    case "hoy": // un dia marcado
      return (<svg {...p} aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2.5" /><path d="M8 3v4M16 3v4M3 10h18" /><circle cx="12" cy="15.5" r="2" fill="currentColor" stroke="none" /></svg>);
    case "semana": // siete columnas
      return (<svg {...p} aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2.5" /><path d="M8 3v4M16 3v4M3 10h18M8.5 10v11M15.5 10v11" /></svg>);
    case "ejercicios": // mancuerna
      return (<svg {...p} aria-hidden="true"><path d="M3 9v6M6 7v10M18 7v10M21 9v6M6 12h12" /></svg>);
    case "nutricion": // plato
      return (<svg {...p} aria-hidden="true"><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4" /></svg>);
    case "progreso": // linea que sube
      return (<svg {...p} aria-hidden="true"><path d="M3 20h18" /><path d="M5 16l4.5-5 3.5 3L19 6" /><path d="M19 6h-4M19 6v4" /></svg>);
    case "coach": // conversacion
      return (<svg {...p} aria-hidden="true"><path d="M20 15a2.5 2.5 0 0 1-2.5 2.5H8L4 21V6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5z" /><path d="M9 9h6M9 12.5h4" /></svg>);
    default:
      return null;
  }
}
