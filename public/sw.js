/**
 * Service worker: que la app abra sin cobertura.
 *
 * En muchos gimnasios no hay señal. Sin esto, abrir la app en el sotano da
 * una pagina de error, que es la excusa perfecta para no apuntar nada. Los
 * datos ya viven en el movil (localStorage): solo faltaba que la app misma
 * tambien estuviera guardada.
 *
 *   Pagina        primero la red (para tener siempre la ultima version); si no
 *                 hay red o tarda mas de 3 s, la guardada.
 *   /_next/static cache primero: sus nombres llevan hash, nunca cambian.
 *   Lo demas      la guardada al momento, y se actualiza por detras.
 */
const CACHE = "sistema7k-v1";
const ESPERA_RED_MS = 3000;

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(["/"])).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function guardar(req, res) {
  if (res && res.ok && res.type !== "opaque") {
    const copia = res.clone();
    caches.open(CACHE).then((c) => c.put(req, copia));
  }
  return res;
}

function redConLimite(req) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("lenta")), ESPERA_RED_MS);
    fetch(req).then((r) => { clearTimeout(t); resolve(r); }, (err) => { clearTimeout(t); reject(err); });
  });
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const mismoOrigen = url.origin === self.location.origin;
  const fuentes = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  if (!mismoOrigen && !fuentes) return;
  // El calendario se genera en el servidor cada vez: no se guarda.
  if (mismoOrigen && url.pathname.endsWith(".ics")) return;

  if (req.mode === "navigate") {
    e.respondWith(
      redConLimite(req)
        .then((res) => guardar("/", res))
        .catch(() => caches.match("/").then((r) => r || fetch(req)))
    );
    return;
  }

  if (mismoOrigen && url.pathname.startsWith("/_next/static/")) {
    e.respondWith(caches.match(req).then((r) => r || fetch(req).then((res) => guardar(req, res))));
    return;
  }

  e.respondWith(
    caches.match(req).then((guardada) => {
      const red = fetch(req).then((res) => guardar(req, res)).catch(() => guardada);
      return guardada || red;
    })
  );
});

// La primera vez, la app se descarga antes de que este service worker mande:
// la pagina le pasa la lista de lo que ya bajo para guardarlo desde el primer
// dia, y no solo a partir de la segunda visita.
self.addEventListener("message", (e) => {
  const datos = e.data || {};
  if (datos.tipo !== "guardar" || !Array.isArray(datos.urls)) return;
  const urls = datos.urls.filter((u) => {
    try { const x = new URL(u, self.location.origin); return x.origin === self.location.origin && x.pathname.startsWith("/_next/static/"); }
    catch { return false; }
  });
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(urls.map((u) => c.add(u).catch(() => {})))));
});
