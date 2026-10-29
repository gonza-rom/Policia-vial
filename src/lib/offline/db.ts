// IndexedDB mínimo, sin dependencias — solo lo que necesita la cola de
// sincronización offline de actas (Módulo 6). Nada de esto se usa si el
// navegador no soporta IndexedDB (se degrada a "no hay guardado local").

const DB_NAME = "policia-vial-offline";
// v3: agrega requerimientos, cierre de guardia y firma (Módulo 6c — antes
// la v2 sumó procedimientos y relevamientos). Subir DB_VERSION dispara
// onupgradeneeded incluso en un navegador que ya tenía una versión previa
// guardada, sin tocar lo que ya había en las demás tiendas.
const DB_VERSION = 3;

export const STORE_ACTAS = "actas_pendientes";
export const STORE_FOTOS = "fotos_pendientes";
export const STORE_PROCEDIMIENTOS = "procedimientos_pendientes";
export const STORE_RELEVAMIENTOS = "relevamientos_pendientes";
export const STORE_REQUERIMIENTOS = "requerimientos_pendientes";
export const STORE_CIERRES_GUARDIA = "cierres_guardia_pendientes";
export const STORE_FIRMAS = "firmas_pendientes";

function abrirDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const store of [
        STORE_ACTAS,
        STORE_PROCEDIMIENTOS,
        STORE_RELEVAMIENTOS,
        STORE_REQUERIMIENTOS,
        STORE_CIERRES_GUARDIA,
        STORE_FIRMAS,
      ]) {
        if (!db.objectStoreNames.contains(store)) {
          db.createObjectStore(store, { keyPath: "id" });
        }
      }
      if (!db.objectStoreNames.contains(STORE_FOTOS)) {
        db.createObjectStore(STORE_FOTOS, { keyPath: "clave" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function conTienda<T>(
  store: string,
  modo: IDBTransactionMode,
  fn: (tienda: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, modo);
    const req = fn(tx.objectStore(store));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

export async function guardar<T>(store: string, valor: T): Promise<void> {
  await conTienda(store, "readwrite", (t) => t.put(valor));
}

export async function obtener<T>(store: string, clave: string): Promise<T | undefined> {
  return conTienda(store, "readonly", (t) => t.get(clave));
}

export async function obtenerTodos<T>(store: string): Promise<T[]> {
  return conTienda<T[]>(store, "readonly", (t) => t.getAll() as IDBRequest<T[]>);
}

export async function eliminar(store: string, clave: string): Promise<void> {
  await conTienda(store, "readwrite", (t) => t.delete(clave));
}

export function soportaIndexedDB() {
  return typeof window !== "undefined" && "indexedDB" in window;
}
