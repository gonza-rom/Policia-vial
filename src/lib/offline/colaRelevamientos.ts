import { guardar, obtener, obtenerTodos, eliminar, STORE_RELEVAMIENTOS } from "./db";
import type { ModalidadRelevamientoValor } from "@/lib/relevamientos";

/** Un envío puede generar más de un registro — la carga rápida de Día de
 * la Virgen manda hasta 3 (uno por sexo con cantidad > 0) de una vez, y el
 * formulario clásico siempre manda 1. Cada registro ya trae su propio id
 * generado en el cliente para que sincronizar sea idempotente aunque el
 * envío tenga varios. */
export type RegistroRelevamientoOffline = {
  id: string; // UUID generado en el cliente — va a ser el Relevamiento.id
  modalidad: ModalidadRelevamientoValor;
  cantidadPersonas: number;
  procedencia: string | null;
  medioTransporte: string | null;
  sexo: string | null;
};

export type RelevamientoOfflinePayload = {
  id: string; // clave de la cola — igual al id del primer registro
  /** Ver el mismo campo en ActaOfflinePayload. Una edición siempre tiene
   * exactamente 1 registro (el formulario de Día de la Virgen no tiene
   * modo edición, solo alta). */
  accion?: "crear" | "editar";
  registros: RegistroRelevamientoOffline[];
  puestoId: string;
  agenteId: string;
  creadoEnCliente: string;
  estado: "pendiente" | "sincronizando" | "error";
  intentos: number;
  ultimoError: string | null;
};

export async function encolarRelevamiento(
  payload: Omit<RelevamientoOfflinePayload, "estado" | "intentos" | "ultimoError">,
) {
  await guardar<RelevamientoOfflinePayload>(STORE_RELEVAMIENTOS, {
    ...payload,
    estado: "pendiente",
    intentos: 0,
    ultimoError: null,
  });
}

export async function listarRelevamientosPendientes() {
  return obtenerTodos<RelevamientoOfflinePayload>(STORE_RELEVAMIENTOS);
}

export async function actualizarEstadoRelevamiento(
  id: string,
  cambios: Partial<Pick<RelevamientoOfflinePayload, "estado" | "intentos" | "ultimoError">>,
) {
  const actual = await obtener<RelevamientoOfflinePayload>(STORE_RELEVAMIENTOS, id);
  if (!actual) return;
  await guardar<RelevamientoOfflinePayload>(STORE_RELEVAMIENTOS, { ...actual, ...cambios });
}

export async function quitarRelevamientoDeLaCola(id: string) {
  await eliminar(STORE_RELEVAMIENTOS, id);
}
