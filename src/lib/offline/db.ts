// IndexedDB mínimo, sin dependencias — solo lo que necesita la cola de
// sincronización offline de actas (Módulo 6). Nada de esto se usa si el
// navegador no soporta IndexedDB (se degrada a "no hay guardado local").

const DB_NAME = "policia-vial-offline";
const DB_VERSION = 1;

export const STORE_ACTAS = "actas_pendientes";
export const STORE_FOTOS = "fotos_pendientes";

function abrirDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_ACTAS)) {
        db.createObjectStore(STORE_ACTAS, { keyPath: "id" });
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
