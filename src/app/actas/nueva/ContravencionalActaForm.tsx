"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import {
  crearActaContravencional,
  actualizarActaContravencional,
} from "./actions";
import { TarjetaSeccion } from "@/components/ui/Tarjeta";
import { Campo, CampoTextarea, CampoSelect } from "@/components/ui/Campo";
import { CampoFotos } from "@/components/ui/CampoFotos";
import { SelectorModalidadTrabajo } from "@/components/ui/SelectorModalidadTrabajo";
import { Boton } from "@/components/ui/Boton";
import { soportaIndexedDB } from "@/lib/offline/db";
import { encolarActa } from "@/lib/offline/colaActas";
import { avisarCambioDeCola } from "@/lib/offline/sincronizar";

type CampoDTO = {
  id: string;
  clave: string;
  etiqueta: string;
  seccion: string;
  tipo: "TEXTO" | "TEXTO_LARGO" | "NUMERO" | "FECHA" | "HORA" | "SELECT";
  opciones: string[];
  requerido: boolean;
};

const TIPO_INPUT: Partial<Record<CampoDTO["tipo"], string>> = {
  NUMERO: "number",
  FECHA: "date",
  HORA: "time",
};

function agruparPorSeccion(campos: CampoDTO[]) {
  const secciones: { nombre: string; campos: CampoDTO[] }[] = [];
  for (const campo of campos) {
    let seccion = secciones.find((s) => s.nombre === campo.seccion);
    if (!seccion) {
      seccion = { nombre: campo.seccion, campos: [] };
      secciones.push(seccion);
    }
    seccion.campos.push(campo);
  }
  return secciones;
}

export function ContravencionalActaForm({
  campos,
  actaExistente,
  fechaPorDefecto,
  horaPorDefecto,
  puestosDisponibles,
  puestoOrigenId,
  guardiaId,
  puestoId,
}: {
  campos: CampoDTO[];
  actaExistente?: {
    id: string;
    lugarControl: string | null;
    datos: Record<string, string>;
    fotosVehiculo: { id: string; url: string }[];
    fotosDocumento: { id: string; url: string }[];
  };
  /** Solo se usan al cargar un acta nueva (no al editar), para no obligar
   * al agente a tipear la fecha/hora de algo que está pasando ahora mismo. */
  fechaPorDefecto?: string;
  horaPorDefecto?: string;
  /** Solo hacen falta al crear (no al editar, donde la modalidad ya quedó
   * fijada). Ver SelectorModalidadTrabajo. */
  puestosDisponibles?: { id: string; nombre: string }[];
  puestoOrigenId?: string;
  /** Solo hacen falta para poder guardar sin conexión — ver manejarSubmit. */
  guardiaId?: string;
  puestoId?: string;
}) {
  const secciones = agruparPorSeccion(campos);
  const [guardadoOffline, setGuardadoOffline] = useState(false);
  const [guardandoOffline, setGuardandoOffline] = useState(false);

  /** Mismo mecanismo que NuevaActaForm (ver ese archivo para el porqué) —
   * acá los campos a juntar son dinámicos (`CampoContravencional`), así
   * que se arman desde la prop `campos` en vez de una lista fija. */
  async function manejarSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (navigator.onLine) return;
    if (!soportaIndexedDB()) return;
    if (actaExistente ? false : !guardiaId || !puestoId) return;

    e.preventDefault();
    setGuardandoOffline(true);

    const formEl = e.currentTarget;
    const formData = new FormData(formEl);
    const camposValores: Record<string, string> = {};
    for (const nombre of [
      "modalidadTrabajo",
      "puestoTrabajoId",
      "motivoOtraJurisdiccion",
      "lugarControl",
      ...campos.map((c) => c.clave),
    ]) {
      camposValores[nombre] = String(formData.get(nombre) ?? "");
    }

    const id = actaExistente?.id ?? crypto.randomUUID();
    const fotos: { actaId: string; campo: "fotoVehiculo" | "fotoDocumento"; orden: number; blob: Blob; nombre: string; tipo: string }[] = [];
    for (const campo of ["fotoVehiculo", "fotoDocumento"] as const) {
      formData.getAll(campo).forEach((archivo, orden) => {
        if (archivo instanceof File && archivo.size > 0) {
          fotos.push({ actaId: id, campo, orden, blob: archivo, nombre: archivo.name, tipo: archivo.type });
        }
      });
    }
    const fotosABorrar = [
      ...formData.getAll("fotoVehiculoBorrar"),
      ...formData.getAll("fotoDocumentoBorrar"),
    ].map(String);

    await encolarActa(
      {
        id,
        tipo: "CONTRAVENCIONAL",
        accion: actaExistente ? "editar" : "crear",
        campos: camposValores,
        infraccionIds: [],
        otraInfraccionId: null,
        retencionPreventiva: false,
        guardiaId: guardiaId ?? "",
        puestoId: puestoId ?? "",
        fotosABorrar,
        creadoEnCliente: new Date().toISOString(),
      },
      fotos,
    );
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
          {actaExistente
            ? "Los cambios quedaron guardados en este celular. Se van a sincronizar solos en cuanto vuelva la señal."
            : "El acta quedó guardada en este celular. Se va a sincronizar sola — y vas a poder firmarla — en cuanto vuelva la señal."}
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
      action={actaExistente ? actualizarActaContravencional : crearActaContravencional}
      onSubmit={manejarSubmit}
      className="space-y-4"
    >
      {actaExistente && (
        <input type="hidden" name="actaId" value={actaExistente.id} />
      )}

      {!actaExistente && puestosDisponibles && puestoOrigenId && (
        <SelectorModalidadTrabajo
          puestosDisponibles={puestosDisponibles}
          puestoOrigenId={puestoOrigenId}
        />
      )}

      <div className="bg-surface-container-lowest border-l-4 border-secondary p-3 rounded shadow-sm border border-outline-variant">
        <div className="flex items-center justify-between">
          <span className="text-label-sm font-label-sm text-secondary uppercase font-bold">
            Acta de Comprobación
          </span>
          <span className="text-label-sm font-label-sm bg-surface-container px-2 py-0.5 rounded text-on-surface-variant">
            Ley Prov. N° 5171/05
          </span>
        </div>
        <div className="mt-2 pt-2 border-t border-outline-variant">
          <Campo
            label="Lugar"
            id="lugarControl"
            name="lugarControl"
            defaultValue={actaExistente?.lugarControl ?? undefined}
          />
        </div>
      </div>

      {secciones.map((seccion, i) => (
        <TarjetaSeccion
          key={seccion.nombre}
          icono="description"
          titulo={`${i + 1}. ${seccion.nombre}`}
        >
          {seccion.campos.map((campo) => {
            const valorExistente = actaExistente?.datos[campo.clave];
            if (campo.tipo === "TEXTO_LARGO") {
              return (
                <CampoTextarea
                  key={campo.clave}
                  label={campo.etiqueta}
                  id={campo.clave}
                  name={campo.clave}
                  rows={3}
                  required={campo.requerido}
                  defaultValue={valorExistente ?? undefined}
                />
              );
            }
            if (campo.tipo === "SELECT") {
              return (
                <CampoSelect
                  key={campo.clave}
                  label={campo.etiqueta}
                  id={campo.clave}
                  name={campo.clave}
                  required={campo.requerido}
                  defaultValue={valorExistente ?? ""}
                >
                  <option value="" disabled>
                    — Elegir —
                  </option>
                  {campo.opciones.map((opcion) => (
                    <option key={opcion} value={opcion}>
                      {opcion}
                    </option>
                  ))}
                </CampoSelect>
              );
            }
            const defaultValue =
              valorExistente ??
              (campo.clave === "fecha"
                ? fechaPorDefecto
                : campo.clave === "hora"
                  ? horaPorDefecto
                  : undefined);
            return (
              <Campo
                key={campo.clave}
                label={campo.etiqueta}
                id={campo.clave}
                name={campo.clave}
                type={TIPO_INPUT[campo.tipo] ?? "text"}
                required={campo.requerido}
                defaultValue={defaultValue}
              />
            );
          })}
        </TarjetaSeccion>
      ))}

      <TarjetaSeccion icono="photo_camera" titulo="Evidencia Fotográfica">
        <div className="grid grid-cols-2 gap-3">
          <CampoFotos
            label="Foto del Vehículo"
            name="fotoVehiculo"
            existentes={actaExistente?.fotosVehiculo}
          />
          <CampoFotos
            label="Foto de la Infracción"
            name="fotoDocumento"
            existentes={actaExistente?.fotosDocumento}
          />
        </div>
        {actaExistente && (
          <p className="text-body-sm text-on-surface-variant">
            Podés agregar varias fotos por categoría, y sacar las que no sirvan.
          </p>
        )}
      </TarjetaSeccion>

      <BotonEnviar esEdicion={Boolean(actaExistente)} guardandoOffline={guardandoOffline} />
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
        icono={esEdicion ? "save" : "draw"}
        fullWidth
        disabled={pending || guardandoOffline}
        className="disabled:opacity-60"
      >
        {pending || guardandoOffline
          ? "Guardando…"
          : esEdicion
            ? "Guardar Cambios"
            : "Continuar a Firma y Cierre"}
      </Boton>
    </div>
  );
}
