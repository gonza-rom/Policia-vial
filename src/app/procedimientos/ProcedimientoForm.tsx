"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { crearProcedimiento, actualizarProcedimiento } from "./actions";
import { TarjetaSeccion } from "@/components/ui/Tarjeta";
import { Campo, CampoTextarea } from "@/components/ui/Campo";
import { SelectorModalidadTrabajo } from "@/components/ui/SelectorModalidadTrabajo";
import { Boton } from "@/components/ui/Boton";
import { TIPO_PROCEDIMIENTO_LABEL, TIPO_PROCEDIMIENTO_ICON } from "@/lib/formato";
import { soportaIndexedDB } from "@/lib/offline/db";
import { encolarProcedimiento } from "@/lib/offline/colaProcedimientos";
import { avisarCambioDeCola } from "@/lib/offline/sincronizar";

export type TipoProcedimientoValor =
  | "ORDEN_JUDICIAL"
  | "SECUESTRO"
  | "DEMORA"
  | "ARRESTO"
  | "DETENCION"
  | "UBICACION_PARADERO"
  | "ESTUPEFACIENTES";

const TIPOS: TipoProcedimientoValor[] = [
  "ORDEN_JUDICIAL",
  "SECUESTRO",
  "DEMORA",
  "ARRESTO",
  "DETENCION",
  "UBICACION_PARADERO",
  "ESTUPEFACIENTES",
];

export type ProcedimientoExistenteDTO = {
  id: string;
  tipo: TipoProcedimientoValor;
  personaNombre: string | null;
  personaDni: string | null;
  vehiculoDominio: string | null;
  descripcion: string;
  datosOrden: string | null;
  observaciones: string | null;
};

export function ProcedimientoForm({
  procedimientoExistente,
  tipoInicial,
  puestosDisponibles,
  puestoOrigenId,
  agenteId,
}: {
  procedimientoExistente?: ProcedimientoExistenteDTO;
  tipoInicial?: TipoProcedimientoValor;
  /** Solo hacen falta al crear. Ver SelectorModalidadTrabajo. */
  puestosDisponibles?: { id: string; nombre: string }[];
  puestoOrigenId?: string;
  /** Solo hace falta para poder guardar sin conexión — ver manejarSubmit. */
  agenteId?: string;
}) {
  const [tipo, setTipo] = useState<TipoProcedimientoValor>(
    procedimientoExistente?.tipo ?? tipoInicial ?? "DEMORA",
  );
  const [guardadoOffline, setGuardadoOffline] = useState(false);
  const [guardandoOffline, setGuardandoOffline] = useState(false);

  /** Mismo mecanismo que NuevaActaForm — solo para altas nuevas, no para
   * editar un procedimiento ya existente. */
  async function manejarSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (procedimientoExistente) return;
    if (navigator.onLine) return;
    if (!soportaIndexedDB() || !puestoOrigenId || !agenteId) return;

    e.preventDefault();
    setGuardandoOffline(true);

    const formData = new FormData(e.currentTarget);
    const campos: Record<string, string> = {};
    for (const nombre of [
      "tipo",
      "modalidadTrabajo",
      "puestoTrabajoId",
      "motivoOtraJurisdiccion",
      "personaNombre",
      "personaDni",
      "vehiculoDominio",
      "descripcion",
      "datosOrden",
      "observaciones",
    ]) {
      campos[nombre] = String(formData.get(nombre) ?? "");
    }

    await encolarProcedimiento({
      id: crypto.randomUUID(),
      campos,
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
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-pad-xl text-center space-y-4">
        <span className="material-symbols-outlined text-5xl text-secondary">
          cloud_off
        </span>
        <h2 className="text-headline-md font-headline-md text-primary">
          Guardado sin conexión
        </h2>
        <p className="text-body-md text-on-surface-variant">
          El procedimiento quedó guardado en este celular. Se va a
          sincronizar solo en cuanto vuelva la señal.
        </p>
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

  return (
    <form
      action={procedimientoExistente ? actualizarProcedimiento : crearProcedimiento}
      onSubmit={manejarSubmit}
      className="space-y-4"
    >
      {procedimientoExistente && (
        <input type="hidden" name="id" value={procedimientoExistente.id} />
      )}
      <input type="hidden" name="tipo" value={tipo} />

      {!procedimientoExistente && puestosDisponibles && puestoOrigenId && (
        <SelectorModalidadTrabajo
          puestosDisponibles={puestosDisponibles}
          puestoOrigenId={puestoOrigenId}
        />
      )}

      {!procedimientoExistente && (
        <TarjetaSeccion icono="gavel" titulo="1. Tipo de Procedimiento" badge="Obligatorio">
          <div className="grid grid-cols-2 gap-2">
            {TIPOS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTipo(t)}
                className={`min-h-touch-min border rounded flex items-center justify-center gap-1.5 font-label-sm text-label-sm text-center active:scale-95 transition-all px-2 ${
                  tipo === t
                    ? "border-2 border-secondary bg-secondary-container/20 text-secondary"
                    : "border-outline-variant bg-surface-container-lowest text-on-surface"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {TIPO_PROCEDIMIENTO_ICON[t]}
                </span>
                {TIPO_PROCEDIMIENTO_LABEL[t]}
              </button>
            ))}
          </div>
        </TarjetaSeccion>
      )}

      <TarjetaSeccion icono="description" titulo="2. Datos">
        <CampoTextarea
          label="Descripción del Procedimiento"
          id="descripcion"
          name="descripcion"
          rows={3}
          required
          placeholder="Circunstancias, lugar exacto, resultado…"
          defaultValue={procedimientoExistente?.descripcion ?? undefined}
        />
        <div className="grid grid-cols-2 gap-3">
          <Campo
            label="Persona (Nombre)"
            id="personaNombre"
            name="personaNombre"
            placeholder="Si corresponde"
            defaultValue={procedimientoExistente?.personaNombre ?? undefined}
          />
          <Campo
            label="Persona (D.N.I.)"
            id="personaDni"
            name="personaDni"
            monoespaciado
            defaultValue={procedimientoExistente?.personaDni ?? undefined}
          />
        </div>
        <Campo
          label="Vehículo (Dominio)"
          id="vehiculoDominio"
          name="vehiculoDominio"
          monoespaciado
          className="uppercase"
          placeholder="Si corresponde"
          defaultValue={procedimientoExistente?.vehiculoDominio ?? undefined}
        />
        <CampoTextarea
          label="Datos de la Orden"
          id="datosOrden"
          name="datosOrden"
          rows={2}
          placeholder="Juzgado, N° de causa u oficio…"
          defaultValue={procedimientoExistente?.datosOrden ?? undefined}
        />
        <CampoTextarea
          label="Observaciones"
          id="observaciones"
          name="observaciones"
          rows={2}
          defaultValue={procedimientoExistente?.observaciones ?? undefined}
        />
      </TarjetaSeccion>

      <BotonEnviar
        esEdicion={Boolean(procedimientoExistente)}
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
        icono={esEdicion ? "save" : "gavel"}
        fullWidth
        disabled={pending || guardandoOffline}
        className="disabled:opacity-60"
      >
        {pending || guardandoOffline
          ? "Guardando…"
          : esEdicion
            ? "Guardar Cambios"
            : "Cargar Procedimiento"}
      </Boton>
    </div>
  );
}
