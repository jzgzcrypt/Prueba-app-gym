import AppCliente from "./app-cliente";

/**
 * Unica ruta de la app. El App Router aqui es solo el envoltorio: toda la
 * aplicacion vive en @/features/App. Cuando en el futuro haya varias rutas
 * (areas de vida separadas, /coach, /historial), se anaden aqui como carpetas
 * hermanas — el dominio y la persistencia no cambian.
 */
export default function Page() {
  return <AppCliente />;
}
