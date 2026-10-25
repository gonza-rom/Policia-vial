// Service worker con cache real — Módulo 6 (modo offline).
//
// Estrategia:
//  - Navegaciones (HTML de una página): red primero, si falla sirve la
//    última copia cacheada de ESA URL (así /actas/nueva?tipo=municipal
//    abre con el catálogo de infracciones y el puesto tal como estaban la
//    última vez que hubo señal — eso cubre "cache local de la
//    configuración de campos" sin tener que duplicar esa data en
//    IndexedDB).
//  - Archivos estáticos de Next (/_next/static/...): cache primero — son
//    inmutables (el nombre cambia con el contenido), no hace falta
//    revalidar contra la red.
//  - Todo lo demás (API externas, Cloudinary, Supabase): no se toca, pasa
//    derecho a la red.
// Dos caches separados a propósito: las páginas (HTML) tienen datos de la
// sesión de quien estaba logueado cuando se guardaron — en un dispositivo
// compartido entre agentes hay que poder borrarlas al cerrar sesión sin
// perder el cache de archivos estáticos (JS/CSS), que no es sensible y no
// vale la pena volver a descargar.
const CACHE_PAGINAS = "pv-cache-paginas-v1";
const CACHE_ESTATICOS = "pv-cache-estaticos-v1";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const nombres = await caches.keys();
      await Promise.all(
        nombres
          .filter((n) => n.startsWith("pv-cache-") && n !== CACHE_PAGINAS && n !== CACHE_ESTATICOS)
          .map((n) => caches.delete(n)),
      );
      await self.clients.claim();
    })(),
  );
});

// El cliente pide esto al deslogearse — borra solo las páginas guardadas,
// no el cache de archivos estáticos.
self.addEventListener("message", (event) => {
  if (event.data === "limpiar-cache-paginas") {
    event.waitUntil(caches.delete(CACHE_PAGINAS));
  }
});

function esNavegacion(request) {
  return request.mode === "navigate";
}

function esEstaticoNext(url) {
  return url.pathname.startsWith("/_next/static/");
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (esNavegacion(request)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_PAGINAS);
        try {
          const respuesta = await fetch(request);
          cache.put(request, respuesta.clone());
          return respuesta;
        } catch {
          const cacheada = await cache.match(request);
          return (
            cacheada ??
            new Response(
              "<h1>Sin conexión</h1><p>Esta página todavía no se guardó para uso offline.</p>",
              { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } },
            )
          );
        }
      })(),
    );
    return;
  }

  if (esEstaticoNext(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_ESTATICOS);
        const cacheada = await cache.match(request);
        if (cacheada) return cacheada;
        const respuesta = await fetch(request);
        cache.put(request, respuesta.clone());
        return respuesta;
      })(),
    );
  }
});
