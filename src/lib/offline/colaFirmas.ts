import { guardar, obtener, obtenerTodos, eliminar, STORE_FIRMAS } from "./db";

/** Firmar offline solo aplica a un acta que YA está sincronizada con el
 * servidor (tiene un id y un número real) — firmar una que todavía está
 * en la cola de altas no es parte de este alcance (ver README). La clave
 * es el actaId: solo puede haber una firma pendiente por acta. */
export type FirmaOfflinePayload = {
  id: string; // = actaId
  tipo: "MUNICIPAL" | "CONTRAVENCIONAL";
  infractorSeNiegaAFirmar: boolean;
  firmaInfractorBlob: Blob | null; // null si se niega a firmar
  firmaActuanteBlob: Blob;
  firmaSecretarioBlob: Blob | null; // solo CONTRAVENCIONAL
  creadoEnCliente: string;
  estado: "pendiente" | "sincronizando" | "error";
  intentos: number;
  ultimoError: string | null;
};

export async function encolarFirma(
  payload: Omit<FirmaOfflinePayload, "estado" | "intentos" | "ultimoError">,
) {
  await guardar<FirmaOfflinePayload>(STORE_FIRMAS, {
    ...payload,
    estado: "pendiente",
    intentos: 0,
    ultimoError: null,
  });
}

export async function listarFirmasPendientes() {
  return obtenerTodos<FirmaOfflinePayload>(STORE_FIRMAS);
}

export async function hayFirmaPendiente(actaId: string) {
  const actual = await obtener<FirmaOfflinePayload>(STORE_FIRMAS, actaId);
  return Boolean(actual);
}

export async function actualizarEstadoFirma(
  id: string,
  cambios: Partial<Pick<FirmaOfflinePayload, "estado" | "intentos" | "ultimoError">>,
) {
  const actual = await obtener<FirmaOfflinePayload>(STORE_FIRMAS, id);
  if (!actual) return;
  await guardar<FirmaOfflinePayload>(STORE_FIRMAS, { ...actual, ...cambios });
}

export async function quitarFirmaDeLaCola(id: string) {
  await eliminar(STORE_FIRMAS, id);
}
