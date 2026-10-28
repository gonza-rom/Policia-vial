"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import {
  crearRelevamiento,
  actualizarRelevamiento,
  crearRelevamientoDiaVirgen,
} from "./actions";
import { TarjetaSeccion } from "@/components/ui/Tarjeta";
import { Campo, CampoSelect } from "@/components/ui/Campo";
import { Boton } from "@/components/ui/Boton";
import {
  MODALIDAD_LABEL,
  MODALIDAD_ICON,
  type ModalidadRelevamientoValor,
} from "@/lib/relevamientos";

export type RelevamientoExistenteDTO = {
  id: string;
  modalidad: ModalidadRelevamientoValor;
  cantidadPersonas: number;
  procedencia: string | null;
  medioTransporte: string | null;
  sexo: string | null;
};

const MEDIOS = [
  { value: "VEHICULO", label: "Vehículo", icono: "directions_car" },
  { value: "CAMINATA", label: "Caminata", icono: "directions_walk" },
  { value: "BICICLETA", label: "Bicicleta", icono: "directions_bike" },
  { value: "CABALLO", label: "Caballo", icono: "pets" },
  { value: "COLECTIVO", label: "Colectivo", icono: "directions_bus" },
  { value: "CAMION", label: "Camión", icono: "local_shipping" },
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
  modalidad: ModalidadRelevamientoValor;
  relevamientoExistente?: RelevamientoExistenteDTO;
}) {
  // La carga rápida (3 cantidades + botones) es solo para un registro
  // NUEVO de Día de la Virgen. Editar uno ya cargado sigue siendo el
  // formulario de siempre — un registro, un sexo — para no complicar la
  // corrección de un dato puntual.
  if (modalidad === "DIA_VIRGEN" && !relevamientoExistente) {
    return <FormularioDiaVirgenNuevo />;
  }
  return (
    <FormularioClasico modalidad={modalidad} relevamientoExistente={relevamientoExistente} />
  );
}

function FormularioDiaVirgenNuevo() {
  const [masculino, setMasculino] = useState("");
  const [femenino, setFemenino] = useState("");
  const [otros, setOtros] = useState("");
  const [medio, setMedio] = useState<(typeof MEDIOS)[number]["value"]>("VEHICULO");
  const [error, setError] = useState<string | null>(null);

  function manejarSubmit(e: React.FormEvent<HTMLFormElement>) {
    const total =
      (Number(masculino) || 0) + (Number(femenino) || 0) + (Number(otros) || 0);
    if (total <= 0) {
      e.preventDefault();
      setError("Cargá al menos una cantidad mayor a cero.");
      return;
    }
    setError(null);
  }

  return (
    <form action={crearRelevamientoDiaVirgen} onSubmit={manejarSubmit} className="space-y-4">
      <TarjetaSeccion icono="church" titulo="Día de la Virgen">
        <div>
          <span className="block text-label-sm font-label-sm text-on-surface-variant uppercase mb-1">
            Medio de Transporte
          </span>
          <input type="hidden" name="medioTransporte" value={medio} />
          <div className="grid grid-cols-3 gap-2">
            {MEDIOS.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setMedio(m.value)}
                className={`min-h-touch-min border rounded flex flex-col items-center justify-center gap-0.5 py-1.5 font-label-sm text-label-sm active:scale-95 transition-all ${
                  medio === m.value
                    ? "border-2 border-secondary bg-secondary-container/20 text-secondary"
                    : "border-outline-variant bg-surface-container-lowest text-on-surface"
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{m.icono}</span>
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <Campo
          label="Procedencia"
          id="procedencia"
          name="procedencia"
          placeholder="Localidad, provincia…"
        />

        <div className="pt-1 border-t border-outline-variant" />

        <span className="block text-label-sm font-label-sm text-on-surface-variant uppercase">
          Cantidad de Personas por Categoría
        </span>
        <Campo
          label="Masculino"
          id="masculino"
          name="masculino"
          type="number"
          min={0}
          monoespaciado
          value={masculino}
          onChange={(e) => setMasculino(e.target.value)}
          placeholder="0"
        />
        <Campo
          label="Femenino"
          id="femenino"
          name="femenino"
          type="number"
          min={0}
          monoespaciado
          value={femenino}
          onChange={(e) => setFemenino(e.target.value)}
          placeholder="0"
        />
        <Campo
          label="Otros"
          id="otros"
          name="otros"
          type="number"
          min={0}
          monoespaciado
          value={otros}
          onChange={(e) => setOtros(e.target.value)}
          placeholder="0"
        />

        {error && (
          <p className="text-body-sm text-error bg-error-container/40 border border-error rounded p-2">
            {error}
          </p>
        )}
      </TarjetaSeccion>

      <BotonEnviar esEdicion={false} />
    </form>
  );
}

function FormularioClasico({
  modalidad,
  relevamientoExistente,
}: {
  modalidad: ModalidadRelevamientoValor;
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

      <TarjetaSeccion icono={MODALIDAD_ICON[modalidad]} titulo={MODALIDAD_LABEL[modalidad]}>
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
