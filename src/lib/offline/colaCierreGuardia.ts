import { guardar, obtener, obtenerTodos, eliminar, STORE_CIERRES_GUARDIA } from "./db";

/** A diferencia de las demás colas, acá la "clave" es el id de la guardia
 * (no un UUID nuevo) — cerrar guardia es una edición sobre un registro que
 * ya existe, nunca un alta, así que no hay riesgo de duplicarla por
 * reintentar: `guardar` con la misma clave simplemente pisa el pendiente
 * anterior (ej. si el agente toca "Cerrar Guardia" dos veces por las
 * dudas). */
export type CierreGuardiaOfflinePayload = {
  id: string; // = guardiaId
  notasCierre: string | null;
  creadoEnCliente: string;
  estado: "pendiente" | "sincronizando" | "error";
  intentos: number;
  ultimoError: string | null;
};

export async function encolarCierreGuardia(
  payload: Omit<CierreGuardiaOfflinePayload, "estado" | "intentos" | "ultimoError">,
) {
  await guardar<CierreGuardiaOfflinePayload>(STORE_CIERRES_GUARDIA, {
    ...payload,
    estado: "pendiente",
    intentos: 0,
    ultimoError: null,
  });
}

export async function listarCierresGuardiaPendientes() {
  return obtenerTodos<CierreGuardiaOfflinePayload>(STORE_CIERRES_GUARDIA);
}

/** Para que la pantalla de guardia pueda avisar "ya pediste cerrarla,
 * falta sincronizar" en vez de seguir mostrando "en curso" sin más. */
export async function hayCierrePendienteDeGuardia(guardiaId: string) {
  const actual = await obtener<CierreGuardiaOfflinePayload>(STORE_CIERRES_GUARDIA, guardiaId);
  return Boolean(actual);
}

export async function actualizarEstadoCierreGuardia(
  id: string,
  cambios: Partial<Pick<CierreGuardiaOfflinePayload, "estado" | "intentos" | "ultimoError">>,
) {
  const actual = await obtener<CierreGuardiaOfflinePayload>(STORE_CIERRES_GUARDIA, id);
  if (!actual) return;
  await guardar<CierreGuardiaOfflinePayload>(STORE_CIERRES_GUARDIA, { ...actual, ...cambios });
}

export async function quitarCierreGuardiaDeLaCola(id: string) {
  await eliminar(STORE_CIERRES_GUARDIA, id);
}
