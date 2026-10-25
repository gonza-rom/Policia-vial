import {
  listarActasPendientes,
  obtenerFotosDeActa,
  actualizarEstadoActa,
  quitarActaDeLaCola,
} from "./colaActas";
import { subirFotoOffline } from "./cloudinaryUpload";
import { sincronizarActaOffline } from "@/app/actas/nueva/offline-actions";

export const EVENTO_COLA_ACTUALIZADA = "pv:cola-offline-actualizada";

/** Se llama al mostrar /login: en un celular compartido entre agentes, no
 * queremos que las páginas que cacheó el service worker para uso offline
 * (con datos de la guardia del agente anterior) sigan disponibles después
 * de un cierre de sesión. El cache de JS/CSS estático no se toca. */
export function limpiarCachePaginasOffline() {
  if (typeof navigator === "undefined" || !navigator.serviceWorker?.controller) return;
  navigator.serviceWorker.controller.postMessage("limpiar-cache-paginas");
}

export function avisarCambioDeCola() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(EVENTO_COLA_ACTUALIZADA));
  }
}

export type ResumenSincronizacion = {
  sincronizadas: number;
  conflictos: number;
  pendientes: number;
  necesitaLogin: boolean;
};

// Si el evento "online" del navegador y uno disparado a mano (o dos
// pestañas) llaman a sincronizarCola() casi al mismo tiempo, el guard por
// acta de más abajo no alcanza — ambas llamadas pueden leer la cola antes
// de que la primera marque el acta como "sincronizando". Esta promesa
// compartida hace que la segunda llamada espere el resultado de la
// primera en vez de procesar la misma acta dos veces (lo que generaría un
// conflicto de auditoría falso, no uno real).
let sincronizacionEnCurso: Promise<ResumenSincronizacion> | null = null;

/** Recorre la cola local y trata de mandar cada acta pendiente al servidor.
 * Se llama al volver la conexión, al cargar la app, o a mano ("Reintentar
 * ahora"). Nunca tira — siempre devuelve un resumen, lo que falló queda en
 * la cola para el próximo intento. */
export function sincronizarCola(): Promise<ResumenSincronizacion> {
  if (sincronizacionEnCurso) return sincronizacionEnCurso;
  sincronizacionEnCurso = ejecutarSincronizacion().finally(() => {
    sincronizacionEnCurso = null;
  });
  return sincronizacionEnCurso;
}

async function ejecutarSincronizacion(): Promise<ResumenSincronizacion> {
  const pendientes = await listarActasPendientes();
  let sincronizadas = 0;
  let conflictos = 0;
  let necesitaLogin = false;

  for (const acta of pendientes) {
    if (acta.estado === "sincronizando") continue;
    await actualizarEstadoActa(acta.id, { estado: "sincronizando" });

    try {
      const fotos = await obtenerFotosDeActa(acta.id);
      const urls: Record<string, string> = {};
      for (const foto of fotos) {
        urls[foto.campo] = await subirFotoOffline(foto.blob, "actas/fotos");
      }

      const resultado = await sincronizarActaOffline({
        id: acta.id,
        campos: acta.campos,
        infraccionIds: acta.infraccionIds,
        otraInfraccionId: acta.otraInfraccionId,
        retencionPreventiva: acta.retencionPreventiva,
        guardiaId: acta.guardiaId,
        puestoId: acta.puestoId,
        creadoEnCliente: acta.creadoEnCliente,
        fotoVehiculoUrl: urls.fotoVehiculo ?? null,
        fotoDocumentoUrl: urls.fotoDocumento ?? null,
      });

      if (resultado.ok) {
        await quitarActaDeLaCola(acta.id);
        sincronizadas += 1;
        if (resultado.conflicto) conflictos += 1;
      } else {
        await actualizarEstadoActa(acta.id, {
          estado: "error",
          intentos: acta.intentos + 1,
          ultimoError: resultado.error,
        });
      }
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : "Error desconocido.";
      // Un error de autenticación (sesión vencida) no se soluciona
      // reintentando solo — hace falta que el agente vuelva a loguearse.
      const esAuth = /unauthorized|auth|sesi[oó]n|login/i.test(mensaje);
      if (esAuth) necesitaLogin = true;
      await actualizarEstadoActa(acta.id, {
        estado: "error",
        intentos: acta.intentos + 1,
        ultimoError: mensaje,
      });
    }
  }

  avisarCambioDeCola();
  const restantes = await listarActasPendientes();
  return {
    sincronizadas,
    conflictos,
    pendientes: restantes.length,
    necesitaLogin,
  };
}
