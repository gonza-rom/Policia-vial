import {
  listarActasPendientes,
  obtenerFotosDeActa,
  actualizarEstadoActa,
  quitarActaDeLaCola,
} from "./colaActas";
import {
  listarProcedimientosPendientes,
  actualizarEstadoProcedimiento,
  quitarProcedimientoDeLaCola,
} from "./colaProcedimientos";
import {
  listarRelevamientosPendientes,
  actualizarEstadoRelevamiento,
  quitarRelevamientoDeLaCola,
} from "./colaRelevamientos";
import {
  listarRequerimientosPendientes,
  actualizarEstadoRequerimiento,
  quitarRequerimientoDeLaCola,
} from "./colaRequerimientos";
import {
  listarCierresGuardiaPendientes,
  actualizarEstadoCierreGuardia,
  quitarCierreGuardiaDeLaCola,
} from "./colaCierreGuardia";
import { listarFirmasPendientes, actualizarEstadoFirma, quitarFirmaDeLaCola } from "./colaFirmas";
import { subirFotoOffline } from "./cloudinaryUpload";
import {
  sincronizarActaOffline,
  sincronizarActaContravencionalOffline,
} from "@/app/actas/nueva/offline-actions";
import { sincronizarProcedimientoOffline } from "@/app/procedimientos/offline-actions";
import { sincronizarRelevamientoOffline } from "@/app/relevamientos/offline-actions";
import { sincronizarRequerimientoOffline } from "@/app/requerimientos/offline-actions";
import { sincronizarCierreGuardiaOffline } from "@/app/guardia/offline-actions";
import { sincronizarFirmaOffline } from "@/app/actas/[id]/firma/offline-actions";

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

/** Recorre las colas locales y trata de mandar cada pendiente al
 * servidor. Se llama al volver la conexión, al cargar la app, o a mano
 * ("Reintentar ahora"). Nunca tira — siempre devuelve un resumen, lo que
 * falló queda en la cola para el próximo intento. */
export function sincronizarCola(): Promise<ResumenSincronizacion> {
  if (sincronizacionEnCurso) return sincronizacionEnCurso;
  sincronizacionEnCurso = ejecutarSincronizacion().finally(() => {
    sincronizacionEnCurso = null;
  });
  return sincronizacionEnCurso;
}

/** `true` si el mensaje de error pinta una sesión vencida — un error así
 * no se soluciona reintentando solo, hace falta que el agente vuelva a
 * loguearse. Usado por las 6 colas. */
function esErrorDeAuth(mensaje: string) {
  return /unauthorized|auth|sesi[oó]n|login/i.test(mensaje);
}

async function sincronizarActas() {
  const pendientes = await listarActasPendientes();
  let sincronizadas = 0;
  let conflictos = 0;
  let necesitaLogin = false;

  for (const acta of pendientes) {
    // No se salta un acta que ya quedó marcada "sincronizando": si esa
    // marca quedó de un intento anterior que se interrumpió a mitad de
    // camino (la pestaña se cerró o navegó justo mientras esperaba la
    // respuesta del servidor), saltarla la dejaría huérfana para
    // siempre. El guardado del lado del servidor es idempotente (upsert
    // por el id generado en el cliente), así que reintentar es seguro —
    // `sincronizacionEnCurso` ya evita que la MISMA pestaña la procese
    // dos veces en paralelo.
    await actualizarEstadoActa(acta.id, { estado: "sincronizando" });

    try {
      const fotos = await obtenerFotosDeActa(acta.id);
      const urls: Record<string, string> = {};
      for (const foto of fotos) {
        urls[foto.campo] = await subirFotoOffline(foto.blob, "actas/fotos");
      }

      // `tipo`/`accion` pueden faltar en actas encoladas antes de agregar
      // contravencional y edición offline — se tratan como
      // MUNICIPAL/"crear" (ver colaActas.ts).
      const accion = acta.accion ?? "crear";
      const resultado =
        acta.tipo === "CONTRAVENCIONAL"
          ? await sincronizarActaContravencionalOffline({
              id: acta.id,
              accion,
              campos: acta.campos,
              guardiaId: acta.guardiaId,
              puestoId: acta.puestoId,
              creadoEnCliente: acta.creadoEnCliente,
              fotoVehiculoUrl: urls.fotoVehiculo ?? null,
              fotoDocumentoUrl: urls.fotoDocumento ?? null,
            })
          : await sincronizarActaOffline({
              id: acta.id,
              accion,
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
      if (esErrorDeAuth(mensaje)) necesitaLogin = true;
      await actualizarEstadoActa(acta.id, {
        estado: "error",
        intentos: acta.intentos + 1,
        ultimoError: mensaje,
      });
    }
  }

  const restantes = await listarActasPendientes();
  return { sincronizadas, conflictos, pendientes: restantes.length, necesitaLogin };
}

async function sincronizarProcedimientos() {
  const pendientes = await listarProcedimientosPendientes();
  let sincronizadas = 0;
  let conflictos = 0;
  let necesitaLogin = false;

  for (const p of pendientes) {
    await actualizarEstadoProcedimiento(p.id, { estado: "sincronizando" });

    try {
      const resultado = await sincronizarProcedimientoOffline({
        id: p.id,
        accion: p.accion ?? "crear",
        campos: p.campos,
        puestoId: p.puestoId,
        agenteId: p.agenteId,
        creadoEnCliente: p.creadoEnCliente,
      });

      if (resultado.ok) {
        await quitarProcedimientoDeLaCola(p.id);
        sincronizadas += 1;
        if (resultado.conflicto) conflictos += 1;
      } else {
        await actualizarEstadoProcedimiento(p.id, {
          estado: "error",
          intentos: p.intentos + 1,
          ultimoError: resultado.error,
        });
      }
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : "Error desconocido.";
      if (esErrorDeAuth(mensaje)) necesitaLogin = true;
      await actualizarEstadoProcedimiento(p.id, {
        estado: "error",
        intentos: p.intentos + 1,
        ultimoError: mensaje,
      });
    }
  }

  const restantes = await listarProcedimientosPendientes();
  return { sincronizadas, conflictos, pendientes: restantes.length, necesitaLogin };
}

async function sincronizarRelevamientos() {
  const pendientes = await listarRelevamientosPendientes();
  let sincronizadas = 0;
  let conflictos = 0;
  let necesitaLogin = false;

  for (const r of pendientes) {
    await actualizarEstadoRelevamiento(r.id, { estado: "sincronizando" });

    try {
      const resultado = await sincronizarRelevamientoOffline({
        accion: r.accion ?? "crear",
        registros: r.registros,
        puestoId: r.puestoId,
        agenteId: r.agenteId,
        creadoEnCliente: r.creadoEnCliente,
      });

      if (resultado.ok) {
        await quitarRelevamientoDeLaCola(r.id);
        sincronizadas += 1;
        if (resultado.conflicto) conflictos += 1;
      } else {
        await actualizarEstadoRelevamiento(r.id, {
          estado: "error",
          intentos: r.intentos + 1,
          ultimoError: resultado.error,
        });
      }
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : "Error desconocido.";
      if (esErrorDeAuth(mensaje)) necesitaLogin = true;
      await actualizarEstadoRelevamiento(r.id, {
        estado: "error",
        intentos: r.intentos + 1,
        ultimoError: mensaje,
      });
    }
  }

  const restantes = await listarRelevamientosPendientes();
  return { sincronizadas, conflictos, pendientes: restantes.length, necesitaLogin };
}

async function sincronizarRequerimientos() {
  const pendientes = await listarRequerimientosPendientes();
  let sincronizadas = 0;
  let conflictos = 0;
  let necesitaLogin = false;

  for (const r of pendientes) {
    await actualizarEstadoRequerimiento(r.id, { estado: "sincronizando" });

    try {
      const resultado = await sincronizarRequerimientoOffline({
        id: r.id,
        accion: r.accion ?? "crear",
        campos: r.campos,
        puestoId: r.puestoId,
        agenteId: r.agenteId,
        creadoEnCliente: r.creadoEnCliente,
      });

      if (resultado.ok) {
        await quitarRequerimientoDeLaCola(r.id);
        sincronizadas += 1;
        if (resultado.conflicto) conflictos += 1;
      } else {
        await actualizarEstadoRequerimiento(r.id, {
          estado: "error",
          intentos: r.intentos + 1,
          ultimoError: resultado.error,
        });
      }
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : "Error desconocido.";
      if (esErrorDeAuth(mensaje)) necesitaLogin = true;
      await actualizarEstadoRequerimiento(r.id, {
        estado: "error",
        intentos: r.intentos + 1,
        ultimoError: mensaje,
      });
    }
  }

  const restantes = await listarRequerimientosPendientes();
  return { sincronizadas, conflictos, pendientes: restantes.length, necesitaLogin };
}

async function sincronizarCierresGuardia() {
  const pendientes = await listarCierresGuardiaPendientes();
  let sincronizadas = 0;
  let necesitaLogin = false;

  for (const c of pendientes) {
    await actualizarEstadoCierreGuardia(c.id, { estado: "sincronizando" });

    try {
      const resultado = await sincronizarCierreGuardiaOffline({
        guardiaId: c.id,
        notasCierre: c.notasCierre,
      });

      if (resultado.ok) {
        await quitarCierreGuardiaDeLaCola(c.id);
        sincronizadas += 1;
      } else {
        await actualizarEstadoCierreGuardia(c.id, {
          estado: "error",
          intentos: c.intentos + 1,
          ultimoError: resultado.error,
        });
      }
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : "Error desconocido.";
      if (esErrorDeAuth(mensaje)) necesitaLogin = true;
      await actualizarEstadoCierreGuardia(c.id, {
        estado: "error",
        intentos: c.intentos + 1,
        ultimoError: mensaje,
      });
    }
  }

  const restantes = await listarCierresGuardiaPendientes();
  return { sincronizadas, pendientes: restantes.length, necesitaLogin };
}

async function sincronizarFirmas() {
  const pendientes = await listarFirmasPendientes();
  let sincronizadas = 0;
  let necesitaLogin = false;

  for (const f of pendientes) {
    await actualizarEstadoFirma(f.id, { estado: "sincronizando" });

    try {
      const [firmaInfractorUrl, firmaActuanteUrl, firmaSecretarioUrl] = await Promise.all([
        f.firmaInfractorBlob ? subirFotoOffline(f.firmaInfractorBlob, "actas/firmas") : null,
        subirFotoOffline(f.firmaActuanteBlob, "actas/firmas"),
        f.firmaSecretarioBlob ? subirFotoOffline(f.firmaSecretarioBlob, "actas/firmas") : null,
      ]);

      const resultado = await sincronizarFirmaOffline({
        actaId: f.id,
        infractorSeNiegaAFirmar: f.infractorSeNiegaAFirmar,
        firmaInfractorUrl,
        firmaActuanteUrl: firmaActuanteUrl as string,
        firmaSecretarioUrl,
      });

      if (resultado.ok) {
        await quitarFirmaDeLaCola(f.id);
        sincronizadas += 1;
      } else {
        await actualizarEstadoFirma(f.id, {
          estado: "error",
          intentos: f.intentos + 1,
          ultimoError: resultado.error,
        });
      }
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : "Error desconocido.";
      if (esErrorDeAuth(mensaje)) necesitaLogin = true;
      await actualizarEstadoFirma(f.id, {
        estado: "error",
        intentos: f.intentos + 1,
        ultimoError: mensaje,
      });
    }
  }

  const restantes = await listarFirmasPendientes();
  return { sincronizadas, pendientes: restantes.length, necesitaLogin };
}

async function ejecutarSincronizacion(): Promise<ResumenSincronizacion> {
  // Una cola por vez, no Promise.all: varias acciones de servidor en
  // paralelo apenas vuelve la señal llegaron a trabar la sincronización
  // (probablemente el pool de conexiones a la base) — cada cola sincroniza
  // rápido sola, así que ir secuencial no se nota y es mucho más seguro.
  const actas = await sincronizarActas();
  const procedimientos = await sincronizarProcedimientos();
  const relevamientos = await sincronizarRelevamientos();
  const requerimientos = await sincronizarRequerimientos();
  const cierresGuardia = await sincronizarCierresGuardia();
  const firmas = await sincronizarFirmas();

  avisarCambioDeCola();
  return {
    sincronizadas:
      actas.sincronizadas +
      procedimientos.sincronizadas +
      relevamientos.sincronizadas +
      requerimientos.sincronizadas +
      cierresGuardia.sincronizadas +
      firmas.sincronizadas,
    conflictos: actas.conflictos + procedimientos.conflictos + relevamientos.conflictos + requerimientos.conflictos,
    pendientes:
      actas.pendientes +
      procedimientos.pendientes +
      relevamientos.pendientes +
      requerimientos.pendientes +
      cierresGuardia.pendientes +
      firmas.pendientes,
    necesitaLogin:
      actas.necesitaLogin ||
      procedimientos.necesitaLogin ||
      relevamientos.necesitaLogin ||
      requerimientos.necesitaLogin ||
      cierresGuardia.necesitaLogin ||
      firmas.necesitaLogin,
  };
}
