export function formatoMoneda(valor: number | string) {
  const num = typeof valor === "string" ? Number(valor) : valor;
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(num);
}

// Catamarca es siempre UTC-3 (Argentina no tiene horario de verano desde
// 2009) — fijar la zona acá evita que estas fechas se muestren en UTC (el
// huso del servidor en producción) en vez de la hora real de Catamarca.
const ZONA_HORARIA = "America/Argentina/Buenos_Aires";

export function formatoFechaHora(fecha: Date | string) {
  const d = typeof fecha === "string" ? new Date(fecha) : fecha;
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: ZONA_HORARIA,
  }).format(d);
}

export function formatoFecha(fecha: Date | string) {
  const d = typeof fecha === "string" ? new Date(fecha) : fecha;
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: ZONA_HORARIA,
  }).format(d);
}

export function formatoHora(fecha: Date | string) {
  const d = typeof fecha === "string" ? new Date(fecha) : fecha;
  return new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: ZONA_HORARIA,
  }).format(d);
}

/** "YYYY-MM-DD" de hoy en hora de Catamarca — para usar como defaultValue
 * de un <input type="date">. Se calcula en el servidor con la zona fija
 * para no arrastrar el problema de huso horario que tenía formatoFecha. */
export function fechaInputHoy() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA_HORARIA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** "HH:MM" de ahora en hora de Catamarca — para un <input type="time">. */
export function horaInputAhora() {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: ZONA_HORARIA,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

export function numeroActa(numero: number) {
  return numero.toString().padStart(8, "0");
}

export const TIPO_RODADO_LABEL: Record<string, string> = {
  AUTO: "Auto",
  MOTO: "Moto",
  PICKUP: "Pick-Up",
  CARGA: "Transporte de Carga",
  PASAJEROS: "Transporte de Pasajeros",
  EMERGENCIAS: "Emergencias",
  OTRO: "Otros",
};

export const TIPO_RODADO_ICON: Record<string, string> = {
  AUTO: "directions_car",
  MOTO: "two_wheeler",
  PICKUP: "airport_shuttle",
  CARGA: "local_shipping",
  PASAJEROS: "directions_bus",
  EMERGENCIAS: "emergency",
  OTRO: "help",
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
