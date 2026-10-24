type RelevamientoAgregable = {
  cantidadPersonas: number;
  procedencia: string | null;
  medioTransporte: string | null;
  sexo: string | null;
};

export function agruparPorClave<T extends RelevamientoAgregable>(
  items: T[],
  clave: (item: T) => string | null,
) {
  const mapa = new Map<string, number>();
  for (const item of items) {
    const k = clave(item) ?? "Sin dato";
    mapa.set(k, (mapa.get(k) ?? 0) + item.cantidadPersonas);
  }
  return Array.from(mapa.entries())
    .map(([etiqueta, cantidad]) => ({ etiqueta, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad);
}

export const MEDIO_TRANSPORTE_LABEL: Record<string, string> = {
  VEHICULO: "Vehículo",
  CAMINATA: "Caminata",
  BICICLETA: "Bicicleta",
  CABALLO: "Caballo",
  COLECTIVO: "Colectivo",
  CAMION: "Camión",
};

export const SEXO_LABEL: Record<string, string> = {
  FEMENINO: "Femenino",
  MASCULINO: "Masculino",
  NO_BINARIO: "No binario",
};

export const MODALIDAD_LABEL: Record<string, string> = {
  FINES_LARGOS: "Fines Largos",
  DIA_VIRGEN: "Día de la Virgen",
};
