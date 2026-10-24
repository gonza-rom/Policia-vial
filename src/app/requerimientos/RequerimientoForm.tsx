"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { crearRequerimiento, actualizarRequerimiento } from "./actions";
import { TarjetaSeccion } from "@/components/ui/Tarjeta";
import { CampoTextarea } from "@/components/ui/Campo";
import { Boton } from "@/components/ui/Boton";

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
}: {
  requerimientoExistente?: RequerimientoExistenteDTO;
}) {
  const [tipo, setTipo] = useState<"PERSONA" | "VEHICULO">(
    requerimientoExistente?.tipo ?? "PERSONA",
  );

  return (
    <form
      action={requerimientoExistente ? actualizarRequerimiento : crearRequerimiento}
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

      <BotonEnviar esEdicion={Boolean(requerimientoExistente)} />
    </form>
  );
}

function BotonEnviar({ esEdicion }: { esEdicion: boolean }) {
  const { pending } = useFormStatus();
  return (
    <div className="pt-2 pb-6">
      <Boton
        type="submit"
        icono={esEdicion ? "save" : "gpp_maybe"}
        fullWidth
        disabled={pending}
        className="disabled:opacity-60"
      >
        {pending ? "Guardando…" : esEdicion ? "Guardar Cambios" : "Cargar Requerimiento"}
      </Boton>
    </div>
  );
}
