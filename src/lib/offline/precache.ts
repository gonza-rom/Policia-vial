// Nombres de cache duplicados a propósito — deben coincidir con los de
// public/sw.js. No se pueden importar: sw.js corre en su propio scope, sin
// acceso al bundle de la app.
const CACHE_PAGINAS = "pv-cache-paginas-v1";
const CACHE_ESTATICOS = "pv-cache-estaticos-v1";

/** Saca del HTML las URLs de JS/CSS que esa página necesita para
 * hidratarse (`/_next/static/...`). Cachear solo el HTML de la página no
 * alcanza: si el agente nunca llegó a abrir esa pantalla de verdad estando
 * online (solo se precargó en segundo plano con `fetch`), el navegador
 * nunca pidió esos archivos y el Service Worker nunca los guardó en
 * CACHE_ESTATICOS — entonces, ya sin conexión, la página se ve bien (el
 * HTML está) pero no reacciona a nada: el script que la hidrata da 404 y
 * React nunca llega a engancharse. */
function extraerAssetsEstaticos(html: string): string[] {
  const urls = new Set<string>();
  const regex = /\/_next\/static\/[^"'\s)]+/g;
  for (const match of html.matchAll(regex)) {
    urls.add(match[0]);
  }
  return [...urls];
}

/** Rutas que un agente necesita poder abrir sin conexión durante una
 * guardia. Ni el login ni los <Link> de Next generan una navegación que el
 * Service Worker pueda interceptar (son transiciones del lado del
 * cliente) — por eso las precargamos a mano en el cache de páginas cada
 * vez que la app arranca con señal, en vez de depender de cómo se llegó
 * a cada pantalla. Incluye procedimientos y relevamientos (Módulo 6b):
 * en puestos sin señal, puede que la primera vez que hace falta cargar
 * uno de estos sea ya sin conexión, sin haber pasado antes por esa
 * pantalla con señal. */
const RUTAS_CRITICAS = [
  "/guardia",
  "/actas/nueva",
  "/actas/nueva?tipo=municipal",
  "/actas/nueva?tipo=contravencional",
  "/procedimientos",
  "/procedimientos/nuevo",
  "/relevamientos",
  "/relevamientos/nuevo",
  "/relevamientos/nuevo?modalidad=FINES_LARGOS",
  "/relevamientos/nuevo?modalidad=DIA_VIRGEN",
  "/relevamientos/nuevo?modalidad=SEMANA_ESTUDIANTIL",
  "/relevamientos/nuevo?modalidad=FESTIVALES",
  "/relevamientos/nuevo?modalidad=PONCHO",
];

export async function precargarRutasCriticas() {
  if (typeof caches === "undefined" || typeof navigator === "undefined" || !navigator.onLine) {
    return;
  }
  const cachePaginas = await caches.open(CACHE_PAGINAS);
  const cacheEstaticos = await caches.open(CACHE_ESTATICOS);
  const assetsVistos = new Set<string>();

  await Promise.all(
    RUTAS_CRITICAS.map(async (ruta) => {
      try {
        // `redirect: "manual"` es la parte importante: algunas de estas
        // rutas redirigen (ej. a /puesto o /guardia) si al momento exacto
        // de la precarga todavía no hay guardia o puesto elegido en esta
        // sesión — sin esto, `fetch` seguiría la redirección y cachearía
        // esa OTRA pantalla bajo la URL del formulario real. Después, ya
        // sin conexión, el agente vería "Elegí tu puesto" en vez de su
        // formulario, y ahí quedaría trabado (elegir puesto también
        // necesita señal). Con "manual", una redirección da un response
        // opaco (`ok: false`) que simplemente no se cachea — se reintenta
        // en el próximo mount con la sesión ya completa.
        const respuesta = await fetch(ruta, {
          credentials: "same-origin",
          redirect: "manual",
        });
        if (!respuesta.ok) return;
        const html = await respuesta.clone().text();
        await cachePaginas.put(ruta, respuesta);

        for (const assetUrl of extraerAssetsEstaticos(html)) {
          if (assetsVistos.has(assetUrl)) continue;
          assetsVistos.add(assetUrl);
          if (await cacheEstaticos.match(assetUrl)) continue; // ya lo tenía de otra página
          try {
            const assetResp = await fetch(assetUrl, { credentials: "same-origin" });
            if (assetResp.ok) await cacheEstaticos.put(assetUrl, assetResp);
          } catch {
            // Un asset individual que falla no debería tirar abajo el
            // resto — esa página puede quedar sin hidratar del todo si
            // falta justo este archivo, pero las demás no se ven afectadas.
          }
        }
      } catch {
        // Sin señal o falló la carga — no es grave, se reintenta en el
        // próximo mount de la app (login, recarga, reconexión).
      }
    }),
  );
}
