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
import { soportaIndexedDB } from "@/lib/offline/db";
import { encolarRelevamiento } from "@/lib/offline/colaRelevamientos";
import { avisarCambioDeCola } from "@/lib/offline/sincronizar";

/** Pantalla "guardado sin conexión" — igual a la de NuevaActaForm y
 * ProcedimientoForm, repetida acá en vez de compartida porque cada una
 * tiene su propio texto y no vale la pena una abstracción para 3 usos. */
function GuardadoOffline({ mensaje }: { mensaje: string }) {
  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-pad-xl text-center space-y-4">
      <span className="material-symbols-outlined text-5xl text-secondary">
        cloud_off
      </span>
      <h2 className="text-headline-md font-headline-md text-primary">
        Guardado sin conexión
      </h2>
      <p className="text-body-md text-on-surface-variant">{mensaje}</p>
      <Boton
        onClick={() => {
          // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- recarga dura intencional, ver NuevaActaForm
          window.location.href = "/guardia";
        }}
        fullWidth
        icono="home"
      >
        Volver al Menú
      </Boton>
    </div>
  );
}

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
  puestoOrigenId,
  agenteId,
}: {
  modalidad: ModalidadRelevamientoValor;
  relevamientoExistente?: RelevamientoExistenteDTO;
  /** Solo hacen falta para poder guardar sin conexión, y solo al crear. */
  puestoOrigenId?: string;
  agenteId?: string;
}) {
  // La carga rápida (3 cantidades + botones) es solo para un registro
  // NUEVO de Día de la Virgen. Editar uno ya cargado sigue siendo el
  // formulario de siempre — un registro, un sexo — para no complicar la
  // corrección de un dato puntual.
  if (modalidad === "DIA_VIRGEN" && !relevamientoExistente) {
    return <FormularioDiaVirgenNuevo puestoOrigenId={puestoOrigenId} agenteId={agenteId} />;
  }
  return (
    <FormularioClasico
      modalidad={modalidad}
      relevamientoExistente={relevamientoExistente}
      puestoOrigenId={puestoOrigenId}
      agenteId={agenteId}
    />
  );
}

function FormularioDiaVirgenNuevo({
  puestoOrigenId,
  agenteId,
}: {
  puestoOrigenId?: string;
  agenteId?: string;
}) {
  const [masculino, setMasculino] = useState("");
  const [femenino, setFemenino] = useState("");
  const [otros, setOtros] = useState("");
  const [medio, setMedio] = useState<(typeof MEDIOS)[number]["value"]>("VEHICULO");
  const [error, setError] = useState<string | null>(null);
  const [guardadoOffline, setGuardadoOffline] = useState(false);
  const [guardandoOffline, setGuardandoOffline] = useState(false);

  async function manejarSubmit(e: React.FormEvent<HTMLFormElement>) {
    const cantidades = {
      MASCULINO: Number(masculino) || 0,
      FEMENINO: Number(femenino) || 0,
      NO_BINARIO: Number(otros) || 0,
    };
    const total = cantidades.MASCULINO + cantidades.FEMENINO + cantidades.NO_BINARIO;
    if (total <= 0) {
      e.preventDefault();
      setError("Cargá al menos una cantidad mayor a cero.");
      return;
    }
    setError(null);

    if (navigator.onLine) return;
    if (!soportaIndexedDB() || !puestoOrigenId || !agenteId) return;

    e.preventDefault();
    setGuardandoOffline(true);

    const formData = new FormData(e.currentTarget);
    const procedencia = String(formData.get("procedencia") ?? "").trim() || null;
    const medioTransporte = String(formData.get("medioTransporte") ?? "VEHICULO");

    const registros = (
      Object.entries(cantidades) as [
        "MASCULINO" | "FEMENINO" | "NO_BINARIO",
        number,
      ][]
    )
      .filter(([, cantidad]) => cantidad > 0)
      .map(([sexo, cantidad]) => ({
        id: crypto.randomUUID(),
        modalidad: "DIA_VIRGEN" as const,
        cantidadPersonas: cantidad,
        procedencia,
        medioTransporte,
        sexo,
      }));

    await encolarRelevamiento({
      id: registros[0].id,
      registros,
      puestoId: puestoOrigenId,
      agenteId,
      creadoEnCliente: new Date().toISOString(),
    });
    avisarCambioDeCola();
    setGuardandoOffline(false);
    setGuardadoOffline(true);
  }

  if (guardadoOffline) {
    return (
      <GuardadoOffline mensaje="El conteo quedó guardado en este celular. Se va a sincronizar solo en cuanto vuelva la señal." />
    );
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

      <BotonEnviar esEdicion={false} guardandoOffline={guardandoOffline} />
    </form>
  );
}

function FormularioClasico({
  modalidad,
  relevamientoExistente,
  puestoOrigenId,
  agenteId,
}: {
  modalidad: ModalidadRelevamientoValor;
  relevamientoExistente?: RelevamientoExistenteDTO;
  puestoOrigenId?: string;
  agenteId?: string;
}) {
  const esDiaVirgen = modalidad === "DIA_VIRGEN";
  const [guardadoOffline, setGuardadoOffline] = useState(false);
  const [guardandoOffline, setGuardandoOffline] = useState(false);

  async function manejarSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (navigator.onLine) return;
    if (!soportaIndexedDB() || !agenteId) return;
    if (relevamientoExistente ? false : !puestoOrigenId) return;

    e.preventDefault();
    setGuardandoOffline(true);

    const formData = new FormData(e.currentTarget);
    const cantidadRaw = Number(formData.get("cantidadPersonas"));
    const id = relevamientoExistente?.id ?? crypto.randomUUID();

    await encolarRelevamiento({
      id,
      accion: relevamientoExistente ? "editar" : "crear",
      registros: [
        {
          id,
          modalidad,
          cantidadPersonas:
            Number.isFinite(cantidadRaw) && cantidadRaw > 0 ? Math.round(cantidadRaw) : 1,
          procedencia: String(formData.get("procedencia") ?? "").trim() || null,
          medioTransporte: esDiaVirgen
            ? String(formData.get("medioTransporte") ?? "") || null
            : null,
          sexo: esDiaVirgen ? String(formData.get("sexo") ?? "") || null : null,
        },
      ],
      puestoId: puestoOrigenId ?? "",
      agenteId,
      creadoEnCliente: new Date().toISOString(),
    });
    avisarCambioDeCola();
    setGuardandoOffline(false);
    setGuardadoOffline(true);
  }

  if (guardadoOffline) {
    return (
      <GuardadoOffline
        mensaje={
          relevamientoExistente
            ? "Los cambios quedaron guardados en este celular. Se van a sincronizar solos en cuanto vuelva la señal."
            : "El registro quedó guardado en este celular. Se va a sincronizar solo en cuanto vuelva la señal."
        }
      />
    );
  }

  return (
    <form
      action={relevamientoExistente ? actualizarRelevamiento : crearRelevamiento}
      onSubmit={manejarSubmit}
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

      <BotonEnviar
        esEdicion={Boolean(relevamientoExistente)}
        guardandoOffline={guardandoOffline}
      />
    </form>
  );
}

function BotonEnviar({
  esEdicion,
  guardandoOffline,
}: {
  esEdicion: boolean;
  guardandoOffline: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <div className="pt-2 pb-6">
      <Boton
        type="submit"
        icono={esEdicion ? "save" : "add"}
        fullWidth
        disabled={pending || guardandoOffline}
        className="disabled:opacity-60"
      >
        {pending || guardandoOffline ? "Guardando…" : esEdicion ? "Guardar Cambios" : "Cargar"}
      </Boton>
    </div>
  );
}
