
// Estilo "Aire" (tipo Apple Fitness): fondo gris muy claro, tarjetas blancas
// redondeadas con sombra suave, un azul de accion y colores vivos con
// moderacion. Elegido pantalla a pantalla en octubre de 2026.
export const C = {
  bg: "#F2F2F7",
  card: "#FFFFFF",
  cardBorder: "#E9E9EE",
  text: "#1C1C1E",
  textDim: "#8E8E93",
  textFaint: "#AEAEB2",
  accent: "#1C1C1E",
  ok: "#248A3D",
  amber: "#B25E00",
  surfaceMuted: "#F2F2F7",
  divider: "#EFEFF4",
};

/** Los colores de accion y de datos del estilo Aire. */
export const A = {
  azul: "#0A84FF",
  verde: "#30D158",
  rojo: "#FF375F",
  naranja: "#FF9F0A",
  morado: "#BF5AF2",
  gris: "#8E8E93",
  // Fondos suaves de los iconos, a juego con cada color.
  fondo: { azul: "#E7F1FF", verde: "#E8F8EE", rojo: "#FFE5EA", naranja: "#FFF1DC", morado: "#F5EAFE", gris: "#F2F2F7" },
};

/** Tarjeta Aire: blanca, muy redondeada, con sombra suave. */
export const CARD = {
  background: "#FFFFFF",
  borderRadius: 22,
  boxShadow: "0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.05)",
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
  screenTitle:  { fontSize: 34, fontWeight: 800, letterSpacing: -0.8 },   // "Hoy", "Semana 3"
  cardTitle:    { fontSize: 15, fontWeight: 700, letterSpacing: -0.1 },   // titulo dentro de tarjeta
  sectionLabel: { fontSize: 10.5, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase" }, // "CUELLO", "RUNNING"
  body:         { fontSize: 13.5, fontWeight: 400, lineHeight: 1.5 },     // texto explicativo
  bodyStrong:   { fontSize: 13.5, fontWeight: 600, lineHeight: 1.4 },
  meta:         { fontSize: 11.5, fontWeight: 600, letterSpacing: 0.1 },  // fechas, duraciones
  micro:        { fontSize: 10, fontWeight: 700, letterSpacing: 0.4 },    // badges pequeños
  statNumber:   { fontSize: 26, fontWeight: 800, letterSpacing: -0.5 },   // numeros grandes tipo KPI
};

// Radios consistentes
export const R = { sm: 8, md: 12, lg: 14, xl: 20, pill: 999 };

// Altura minima de objetivo tactil recomendada (accesibilidad movil)
export const TAP_MIN = 44;
