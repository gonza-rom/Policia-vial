import { guardar, obtener, obtenerTodos, eliminar, STORE_ACTAS, STORE_FOTOS } from "./db";

/** Todo lo que el formulario junta para una acta (municipal o
 * contravencional), tal cual se manda al servidor — más los metadatos de
 * la cola. `tipo` es opcional porque actas encoladas antes de agregar
 * contravencional offline no lo tienen — se tratan como MUNICIPAL (ver
 * sincronizar.ts), así no se pierde lo que ya estaba guardado en el
 * celular de un agente al actualizar la app. */
export type ActaOfflinePayload = {
  id: string; // UUID generado en el cliente (alta) o id real del acta (edición)
  tipo?: "MUNICIPAL" | "CONTRAVENCIONAL";
  /** "editar" es nuevo — actas encoladas antes se tratan como "crear" (ver
   * sincronizar.ts). En una edición, `id` es el id real del acta existente,
   * no un UUID generado en el cliente. */
  accion?: "crear" | "editar";
  campos: Record<string, string>;
  infraccionIds: string[];
  otraInfraccionId: string | null;
  retencionPreventiva: boolean;
  guardiaId: string;
  puestoId: string;
  /** Solo aplica en "editar": ids de `FotoActa` ya existentes que el agente
   * sacó en el celular y hay que borrar del servidor al sincronizar. */
  fotosABorrar?: string[];
  creadoEnCliente: string; // ISO — "cuándo se escribió esto" para resolver conflictos
  estado: "pendiente" | "sincronizando" | "error";
  intentos: number;
  ultimoError: string | null;
};

export type FotoOffline = {
  clave: string; // `${actaId}:${campo}:${orden}`
  actaId: string;
  campo: "fotoVehiculo" | "fotoDocumento";
  orden: number;
  blob: Blob;
  nombre: string;
  tipo: string;
};

export async function encolarActa(
  payload: Omit<ActaOfflinePayload, "estado" | "intentos" | "ultimoError">,
  fotos: Omit<FotoOffline, "clave">[],
) {
  await guardar<ActaOfflinePayload>(STORE_ACTAS, {
    ...payload,
    estado: "pendiente",
    intentos: 0,
    ultimoError: null,
  });
  for (const foto of fotos) {
    await guardar<FotoOffline>(STORE_FOTOS, {
      ...foto,
      clave: `${foto.actaId}:${foto.campo}:${foto.orden}`,
    });
  }
}

export async function listarActasPendientes() {
  return obtenerTodos<ActaOfflinePayload>(STORE_ACTAS);
}

export async function obtenerFotosDeActa(actaId: string) {
  const todas = await obtenerTodos<FotoOffline>(STORE_FOTOS);
  return todas.filter((f) => f.actaId === actaId);
}

export async function actualizarEstadoActa(
  id: string,
  cambios: Partial<Pick<ActaOfflinePayload, "estado" | "intentos" | "ultimoError">>,
) {
  const actual = await obtener<ActaOfflinePayload>(STORE_ACTAS, id);
  if (!actual) return;
  await guardar<ActaOfflinePayload>(STORE_ACTAS, { ...actual, ...cambios });
}

export async function quitarActaDeLaCola(id: string) {
  await eliminar(STORE_ACTAS, id);
  const fotos = await obtenerFotosDeActa(id);
  for (const f of fotos) await eliminar(STORE_FOTOS, f.clave);
}
