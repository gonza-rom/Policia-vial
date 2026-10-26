/** Colores para gráficos (barras, SVG inline) — siempre a partir de los
 * tokens reales de globals.css, nunca hex inventado por pantalla. Están
 * hardcodeados acá (no se puede leer una variable CSS calculada) desde
 * un único lugar, en vez de repetidos y ligeramente distintos en cada
 * archivo que dibuja un gráfico. */

const SECUNDARIO = "#0284c7"; // --color-secondary
const PRIMARIO = "#0d2240"; // --color-primary
const ADVERTENCIA = "#d97706"; // --color-warning
const ERROR = "#ba1a1a"; // --color-error
const NEUTRO = "#44474e"; // --color-on-surface-variant

/** Paleta categórica genérica, para series sin un significado semántico
 * fijo (medio de transporte, procedencia, etc.) — se usa por posición. */
export const PALETA_CATEGORICA = [SECUNDARIO, ADVERTENCIA, PRIMARIO, NEUTRO] as const;

/** Gravedad de infracción — mapea directo a los tokens de alerta
 * (DESIGN.md: rojo para faltas graves/gravísimas, ámbar para intermedias). */
export const COLOR_GRAVEDAD: Record<"LEVE" | "GRAVE" | "GRAVISIMA", string> = {
  LEVE: SECUNDARIO,
  GRAVE: ADVERTENCIA,
  GRAVISIMA: ERROR,
};

export const COLOR_VEHICULO: Record<
  "AUTO" | "MOTO" | "PICKUP" | "CARGA" | "PASAJEROS" | "EMERGENCIAS" | "OTRO",
  string
> = {
  AUTO: PRIMARIO,
  MOTO: SECUNDARIO,
  PICKUP: ADVERTENCIA,
  CARGA: NEUTRO,
  PASAJEROS: SECUNDARIO,
  EMERGENCIAS: ERROR,
  OTRO: NEUTRO,
};

/** Color de la barra de evolución de recaudación. */
export const COLOR_RECAUDACION = SECUNDARIO;
