export function formatoMoneda(valor: number | string) {
  const num = typeof valor === "string" ? Number(valor) : valor;
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatoFechaHora(fecha: Date | string) {
  const d = typeof fecha === "string" ? new Date(fecha) : fecha;
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function formatoFecha(fecha: Date | string) {
  const d = typeof fecha === "string" ? new Date(fecha) : fecha;
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

export function formatoHora(fecha: Date | string) {
  const d = typeof fecha === "string" ? new Date(fecha) : fecha;
  return new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function numeroActa(numero: number) {
  return numero.toString().padStart(8, "0");
}

export const TIPO_RODADO_LABEL: Record<string, string> = {
  AUTO: "Auto",
  MOTO: "Moto",
  PICKUP: "Pick-Up",
  CARGA: "Carga",
};

export const TIPO_RODADO_ICON: Record<string, string> = {
  AUTO: "directions_car",
  MOTO: "two_wheeler",
  PICKUP: "airport_shuttle",
  CARGA: "local_shipping",
};

export const GRAVEDAD_LABEL: Record<string, string> = {
  LEVE: "Leve",
  GRAVE: "Grave",
  GRAVISIMA: "Gravísima",
};

export const ESTADO_ACTA_LABEL: Record<string, string> = {
  PENDIENTE_FIRMA: "Pendiente de Firma",
  FIRMADA: "Firmada",
  REMITIDA_RENTAS: "Remitida a Rentas",
  ANULADA: "Anulada",
};

export const TIPO_ACTA_LABEL: Record<string, string> = {
  MUNICIPAL: "Municipal",
  CONTRAVENCIONAL: "Contravencional",
};

export const ROL_LABEL: Record<string, string> = {
  AGENTE: "Agente",
  JEFE: "Jefe de Base",
  ADMIN: "Dirección",
};

/** El acta contravencional guarda al conductor en `datosContravencional`
 * (JSON), no en la columna `conductorNombre` — este helper lo resuelve sin
 * importar el tipo de acta. */
export function nombreConductorActa(acta: {
  conductorNombre: string | null;
  datosContravencional: unknown;
}) {
  if (acta.conductorNombre) return acta.conductorNombre;
  const datos = (acta.datosContravencional ?? {}) as Record<string, string>;
  return datos.conductorNombre ?? "—";
}
