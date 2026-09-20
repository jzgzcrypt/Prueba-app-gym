
export const C = {
  bg: "#FAFAF9",
  card: "#FFFFFF",
  cardBorder: "#E5E5E3",
  text: "#171717",
  textDim: "#787774",
  textFaint: "#A8A8A5",
  accent: "#1C1C1C",
  ok: "#2F7D4F",
  amber: "#946800",
  surfaceMuted: "#F4F4F2", // fondo sutil para sub-bloques (reemplaza los #F2F2F0 dispersos)
  divider: "#EDEDEB",
};

// Colores de categoria - solo para bordes e iconos, nunca para fondos de tarjeta
export const CAT = {
  running: "#B8462F",   // terracota
  fuerza: "#2F6B4F",    // verde bosque
  cuello: "#2F5F8A",    // azul petroleo
  movilidad: "#8A5A2F", // ambar tierra
  nutricion: "#6B4C8A", // ciruela
  tenis: "#1F6F6B",     // verde azulado — compromisos fijos
};

export const GRUPO_COLOR = {
  "Pecho": "#B8462F",
  "Hombro": "#8A5A2F",
  "Triceps": "#946800",
  "Espalda": "#2F6B4F",
  "Biceps": "#6B4C8A",
  "Pierna": "#2F5F8A",
  "Core": "#787774",
  "Cadera": "#B8462F",
};

// ─── SISTEMA DE DISEÑO: espaciado y tipografia consistentes ─────────────────
// Escala de espaciado en multiplos de 4 — usar SP.x en vez de numeros sueltos
export const SP = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 };

// Escala tipografica — un unico punto de referencia para toda la app
export const TYPE = {
  screenTitle:  { fontSize: 22, fontWeight: 800, letterSpacing: -0.3 },   // "HOY", "SEMANA 4"
  cardTitle:    { fontSize: 15, fontWeight: 700, letterSpacing: -0.1 },   // titulo dentro de tarjeta
  sectionLabel: { fontSize: 10.5, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase" }, // "CUELLO", "RUNNING"
  body:         { fontSize: 13.5, fontWeight: 400, lineHeight: 1.5 },     // texto explicativo
  bodyStrong:   { fontSize: 13.5, fontWeight: 600, lineHeight: 1.4 },
  meta:         { fontSize: 11.5, fontWeight: 600, letterSpacing: 0.1 },  // fechas, duraciones
  micro:        { fontSize: 10, fontWeight: 700, letterSpacing: 0.4 },    // badges pequeños
  statNumber:   { fontSize: 26, fontWeight: 800, letterSpacing: -0.5 },   // numeros grandes tipo KPI
};

// Radios consistentes
export const R = { sm: 8, md: 10, lg: 12, xl: 14, pill: 999 };

// Altura minima de objetivo tactil recomendada (accesibilidad movil)
export const TAP_MIN = 44;
