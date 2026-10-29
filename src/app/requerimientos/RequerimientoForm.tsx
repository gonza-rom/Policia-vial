"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { crearRequerimiento, actualizarRequerimiento } from "./actions";
import { TarjetaSeccion } from "@/components/ui/Tarjeta";
import { CampoTextarea } from "@/components/ui/Campo";
import { Boton } from "@/components/ui/Boton";
import { soportaIndexedDB } from "@/lib/offline/db";
import { encolarRequerimiento } from "@/lib/offline/colaRequerimientos";
import { avisarCambioDeCola } from "@/lib/offline/sincronizar";

export type RequerimientoExistenteDTO = {
  id: string;
  tipo: "PERSONA" | "VEHICULO";
  descripcion: string;
  datosOrden: string | null;
  motivo: string | null;
  observaciones: string | null;
};

export function RequerimientoForm({
  requerimientoExistente,
  puestoOrigenId,
  agenteId,
}: {
  requerimientoExistente?: RequerimientoExistenteDTO;
  /** Solo hacen falta para poder guardar sin conexión — ver manejarSubmit. */
  puestoOrigenId?: string;
  agenteId?: string;
}) {
  const [tipo, setTipo] = useState<"PERSONA" | "VEHICULO">(
    requerimientoExistente?.tipo ?? "PERSONA",
  );
  const [guardadoOffline, setGuardadoOffline] = useState(false);
  const [guardandoOffline, setGuardandoOffline] = useState(false);

  /** Mismo mecanismo que ProcedimientoForm, pero cubre alta Y edición: a
   * diferencia de actas/procedimientos/relevamientos, acá no hace falta
   * cachear datos extra para poder editar offline — el formulario ya
   * viene con los valores actuales en el HTML (`defaultValue`), que es
   * justo lo que el Service Worker guarda en cache si esta pantalla se
   * abrió alguna vez con señal (ver README, "editar offline"). */
  async function manejarSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (navigator.onLine) return;
    if (!soportaIndexedDB() || !agenteId) return;
    if (!requerimientoExistente && !puestoOrigenId) return;

    e.preventDefault();
    setGuardandoOffline(true);

    const formData = new FormData(e.currentTarget);
    const campos: Record<string, string> = {};
    for (const nombre of ["tipo", "descripcion", "datosOrden", "motivo", "observaciones"]) {
      campos[nombre] = String(formData.get(nombre) ?? "");
    }

    await encolarRequerimiento({
      id: requerimientoExistente?.id ?? crypto.randomUUID(),
      accion: requerimientoExistente ? "editar" : "crear",
      campos,
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
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-pad-xl text-center space-y-4">
        <span className="material-symbols-outlined text-5xl text-secondary">
          cloud_off
        </span>
        <h2 className="text-headline-md font-headline-md text-primary">
          Guardado sin conexión
        </h2>
        <p className="text-body-md text-on-surface-variant">
          El requerimiento quedó guardado en este celular. Se va a
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
      action={requerimientoExistente ? actualizarRequerimiento : crearRequerimiento}
      onSubmit={manejarSubmit}
      className="space-y-4"
    >
      {requerimientoExistente && (
        <input type="hidden" name="id" value={requerimientoExistente.id} />
      )}
      <input type="hidden" name="tipo" value={tipo} />

      <TarjetaSeccion icono="gpp_maybe" titulo="1. Tipo de Requerimiento" badge="Obligatorio">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setTipo("PERSONA")}
            className={`min-h-touch-min border rounded flex items-center justify-center gap-2 font-label-sm text-label-sm active:scale-95 transition-all ${
              tipo === "PERSONA"
                ? "border-2 border-secondary bg-secondary-container/20 text-secondary"
                : "border-outline-variant bg-surface-container-lowest text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">person</span>
            Persona
          </button>
          <button
            type="button"
            onClick={() => setTipo("VEHICULO")}
            className={`min-h-touch-min border rounded flex items-center justify-center gap-2 font-label-sm text-label-sm active:scale-95 transition-all ${
              tipo === "VEHICULO"
                ? "border-2 border-secondary bg-secondary-container/20 text-secondary"
                : "border-outline-variant bg-surface-container-lowest text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">directions_car</span>
            Vehículo
          </button>
        </div>
      </TarjetaSeccion>

      <TarjetaSeccion icono="description" titulo="2. Datos">
        <CampoTextarea
          label="Descripción / Identificación"
          id="descripcion"
          name="descripcion"
          rows={2}
          required
          placeholder={
            tipo === "PERSONA"
              ? "Nombre, apellido, DNI, características…"
              : "Dominio, marca, modelo, color…"
          }
          defaultValue={requerimientoExistente?.descripcion ?? undefined}
        />
        <CampoTextarea
          label="Datos de la Orden"
          id="datosOrden"
          name="datosOrden"
          rows={2}
          placeholder="Juzgado, N° de causa u oficio…"
          defaultValue={requerimientoExistente?.datosOrden ?? undefined}
        />
        <CampoTextarea
          label="Motivo"
          id="motivo"
          name="motivo"
          rows={2}
          defaultValue={requerimientoExistente?.motivo ?? undefined}
        />
        <CampoTextarea
          label="Observaciones"
          id="observaciones"
          name="observaciones"
          rows={2}
          defaultValue={requerimientoExistente?.observaciones ?? undefined}
        />
      </TarjetaSeccion>

      <BotonEnviar
        esEdicion={Boolean(requerimientoExistente)}
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
        icono={esEdicion ? "save" : "gpp_maybe"}
        fullWidth
        disabled={pending || guardandoOffline}
        className="disabled:opacity-60"
      >
        {pending || guardandoOffline
          ? "Guardando…"
          : esEdicion
            ? "Guardar Cambios"
            : "Cargar Requerimiento"}
      </Boton>
    </div>
  );
}
