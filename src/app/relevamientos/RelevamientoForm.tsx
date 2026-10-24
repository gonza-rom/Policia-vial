"use client";

import { useFormStatus } from "react-dom";
import { crearRelevamiento, actualizarRelevamiento } from "./actions";
import { TarjetaSeccion } from "@/components/ui/Tarjeta";
import { Campo, CampoSelect } from "@/components/ui/Campo";
import { Boton } from "@/components/ui/Boton";

export type RelevamientoExistenteDTO = {
  id: string;
  modalidad: "FINES_LARGOS" | "DIA_VIRGEN";
  cantidadPersonas: number;
  procedencia: string | null;
  medioTransporte: string | null;
  sexo: string | null;
};

const MEDIOS = [
  { value: "VEHICULO", label: "Vehículo" },
  { value: "CAMINATA", label: "Caminata" },
  { value: "BICICLETA", label: "Bicicleta" },
  { value: "CABALLO", label: "Caballo" },
  { value: "COLECTIVO", label: "Colectivo" },
  { value: "CAMION", label: "Camión" },
] as const;

const SEXOS = [
  { value: "FEMENINO", label: "Femenino" },
  { value: "MASCULINO", label: "Masculino" },
  { value: "NO_BINARIO", label: "No binario" },
] as const;

export function RelevamientoForm({
  modalidad,
  relevamientoExistente,
}: {
  modalidad: "FINES_LARGOS" | "DIA_VIRGEN";
  relevamientoExistente?: RelevamientoExistenteDTO;
}) {
  const esDiaVirgen = modalidad === "DIA_VIRGEN";

  return (
    <form
      action={relevamientoExistente ? actualizarRelevamiento : crearRelevamiento}
      className="space-y-4"
    >
      {relevamientoExistente && (
        <input type="hidden" name="id" value={relevamientoExistente.id} />
      )}
      <input type="hidden" name="modalidad" value={modalidad} />

      <TarjetaSeccion
        icono={esDiaVirgen ? "church" : "groups"}
        titulo={esDiaVirgen ? "Día de la Virgen" : "Fines Largos"}
      >
        <Campo
          label="Cantidad de Personas"
          id="cantidadPersonas"
          name="cantidadPersonas"
          type="number"
          min={1}
          required
          monoespaciado
          defaultValue={relevamientoExistente?.cantidadPersonas ?? 1}
          hint="Si es un grupo con los mismos datos, podés cargarlo de una vez."
        />

        {esDiaVirgen && (
          <>
            <CampoSelect
              label="Medio de Transporte"
              id="medioTransporte"
              name="medioTransporte"
              defaultValue={relevamientoExistente?.medioTransporte ?? ""}
              required
            >
              <option value="" disabled>
                Seleccioná…
              </option>
              {MEDIOS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </CampoSelect>
            <CampoSelect
              label="Sexo"
              id="sexo"
              name="sexo"
              defaultValue={relevamientoExistente?.sexo ?? ""}
              required
            >
              <option value="" disabled>
                Seleccioná…
              </option>
              {SEXOS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </CampoSelect>
          </>
        )}

        <Campo
          label={esDiaVirgen ? "Procedencia" : "Provincia de Origen"}
          id="procedencia"
          name="procedencia"
          placeholder={esDiaVirgen ? "Localidad, provincia…" : "Ej: Catamarca, Tucumán…"}
          defaultValue={relevamientoExistente?.procedencia ?? undefined}
        />
      </TarjetaSeccion>

      <BotonEnviar esEdicion={Boolean(relevamientoExistente)} />
    </form>
  );
}

function BotonEnviar({ esEdicion }: { esEdicion: boolean }) {
  const { pending } = useFormStatus();
  return (
    <div className="pt-2 pb-6">
      <Boton
        type="submit"
        icono={esEdicion ? "save" : "add"}
        fullWidth
        disabled={pending}
        className="disabled:opacity-60"
      >
        {pending ? "Guardando…" : esEdicion ? "Guardar Cambios" : "Cargar"}
      </Boton>
    </div>
  );
}
