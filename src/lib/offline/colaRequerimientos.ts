import { guardar, obtener, obtenerTodos, eliminar, STORE_REQUERIMIENTOS } from "./db";

/** Igual mecánica que colaProcedimientos.ts — campos planos, sin fotos,
 * cubre alta y edición. */
export type RequerimientoOfflinePayload = {
  id: string; // UUID generado en el cliente (alta) o id real (edición)
  accion?: "crear" | "editar";
  campos: Record<string, string>;
  puestoId: string;
  agenteId: string;
  creadoEnCliente: string;
  estado: "pendiente" | "sincronizando" | "error";
  intentos: number;
  ultimoError: string | null;
};

export async function encolarRequerimiento(
  payload: Omit<RequerimientoOfflinePayload, "estado" | "intentos" | "ultimoError">,
) {
  await guardar<RequerimientoOfflinePayload>(STORE_REQUERIMIENTOS, {
    ...payload,
    estado: "pendiente",
    intentos: 0,
    ultimoError: null,
  });
}

export async function listarRequerimientosPendientes() {
  return obtenerTodos<RequerimientoOfflinePayload>(STORE_REQUERIMIENTOS);
}

export async function actualizarEstadoRequerimiento(
  id: string,
  cambios: Partial<Pick<RequerimientoOfflinePayload, "estado" | "intentos" | "ultimoError">>,
) {
  const actual = await obtener<RequerimientoOfflinePayload>(STORE_REQUERIMIENTOS, id);
  if (!actual) return;
  await guardar<RequerimientoOfflinePayload>(STORE_REQUERIMIENTOS, { ...actual, ...cambios });
}

export async function quitarRequerimientoDeLaCola(id: string) {
  await eliminar(STORE_REQUERIMIENTOS, id);
}
