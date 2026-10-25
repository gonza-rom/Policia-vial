// Nombre de cache duplicado a propósito — debe coincidir con CACHE_PAGINAS
// en public/sw.js. No se puede importar: sw.js corre en su propio scope,
// sin acceso al bundle de la app.
const CACHE_PAGINAS = "pv-cache-paginas-v1";

/** Rutas que un agente necesita poder abrir sin conexión durante una
 * guardia. Ni el login ni los <Link> de Next generan una navegación que el
 * Service Worker pueda interceptar (son transiciones del lado del
 * cliente) — por eso las precargamos a mano en el cache de páginas cada
 * vez que la app arranca con señal, en vez de depender de cómo se llegó
 * a cada pantalla. */
const RUTAS_CRITICAS = ["/guardia", "/actas/nueva", "/actas/nueva?tipo=municipal"];

export async function precargarRutasCriticas() {
  if (typeof caches === "undefined" || typeof navigator === "undefined" || !navigator.onLine) {
    return;
  }
  const cache = await caches.open(CACHE_PAGINAS);
  await Promise.all(
    RUTAS_CRITICAS.map(async (ruta) => {
      try {
        const respuesta = await fetch(ruta, { credentials: "same-origin" });
        if (respuesta.ok) await cache.put(ruta, respuesta.clone());
      } catch {
        // Sin señal o falló la carga — no es grave, se reintenta en el
        // próximo mount de la app (login, recarga, reconexión).
      }
    }),
  );
}
