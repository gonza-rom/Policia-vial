import { guardar, obtener, obtenerTodos, eliminar, STORE_PROCEDIMIENTOS } from "./db";

/** Igual mecánica que colaActas.ts, pero más simple: un procedimiento no
 * lleva fotos ni infracciones, es un solo registro de texto. Solo cubre
 * ALTA (como el acta municipal, editar un procedimiento existente offline
 * queda fuera de alcance). */
export type ProcedimientoOfflinePayload = {
  id: string; // UUID generado en el cliente — va a ser el Procedimiento.id
  campos: Record<string, string>;
  puestoId: string;
  agenteId: string;
  creadoEnCliente: string;
  estado: "pendiente" | "sincronizando" | "error";
  intentos: number;
  ultimoError: string | null;
};

export async function encolarProcedimiento(
  payload: Omit<ProcedimientoOfflinePayload, "estado" | "intentos" | "ultimoError">,
) {
  await guardar<ProcedimientoOfflinePayload>(STORE_PROCEDIMIENTOS, {
    ...payload,
    estado: "pendiente",
    intentos: 0,
    ultimoError: null,
  });
}

export async function listarProcedimientosPendientes() {
  return obtenerTodos<ProcedimientoOfflinePayload>(STORE_PROCEDIMIENTOS);
}

export async function actualizarEstadoProcedimiento(
  id: string,
  cambios: Partial<Pick<ProcedimientoOfflinePayload, "estado" | "intentos" | "ultimoError">>,
) {
  const actual = await obtener<ProcedimientoOfflinePayload>(STORE_PROCEDIMIENTOS, id);
  if (!actual) return;
  await guardar<ProcedimientoOfflinePayload>(STORE_PROCEDIMIENTOS, { ...actual, ...cambios });
}

export async function quitarProcedimientoDeLaCola(id: string) {
  await eliminar(STORE_PROCEDIMIENTOS, id);
}
