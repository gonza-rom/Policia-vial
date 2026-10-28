"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { actualizarPuesto } from "../../actions";
import { TarjetaSeccion } from "@/components/ui/Tarjeta";
import { Campo } from "@/components/ui/Campo";
import { Boton } from "@/components/ui/Boton";
import { JURISDICCION_LABEL } from "@/lib/formato";

const JURISDICCIONES = ["CAPITAL", "HUILLAPIMA", "LA_PUERTA"] as const;

export function PuestoEditarForm({
  puesto,
}: {
  puesto: {
    id: string;
    nombre: string;
    codigo: string | null;
    ubicacion: string | null;
    kmRuta: string | null;
    latitud: number | null;
    longitud: number | null;
    activo: boolean;
    jurisdiccionesMunicipales: string[];
  };
}) {
  const [jurisdicciones, setJurisdicciones] = useState<Set<string>>(
    new Set(puesto.jurisdiccionesMunicipales),
  );
  const [activo, setActivo] = useState(puesto.activo);

  function alternar(j: string) {
    setJurisdicciones((prev) => {
      const next = new Set(prev);
      if (next.has(j)) next.delete(j);
      else next.add(j);
      return next;
    });
  }

  return (
    <form action={actualizarPuesto} className="space-y-4">
      <input type="hidden" name="id" value={puesto.id} />

      <div className="flex items-center justify-between">
        <h1 className="text-headline-md font-headline-md text-primary flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary">edit_location</span>
          {puesto.nombre}
        </h1>
        <Link
          href="/puestos"
          className="text-secondary text-label-sm font-label-sm uppercase"
        >
          Volver
        </Link>
      </div>

      <TarjetaSeccion icono="badge" titulo="Identificación">
        <Campo label="Código" id="codigo" name="codigo" defaultValue={puesto.codigo ?? undefined} />
        <Campo
          label="Ubicación Descriptiva"
          id="ubicacion"
          name="ubicacion"
          defaultValue={puesto.ubicacion ?? undefined}
        />
        <Campo
          label="Km de Ruta"
          id="kmRuta"
          name="kmRuta"
          defaultValue={puesto.kmRuta ?? undefined}
        />
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="activo"
            name="activo"
            checked={activo}
            onChange={(e) => setActivo(e.target.checked)}
            className="w-5 h-5 accent-secondary"
          />
          <label htmlFor="activo" className="text-body-md text-on-surface">
            Puesto activo (estado operativo)
          </label>
        </div>
      </TarjetaSeccion>

      <TarjetaSeccion icono="my_location" titulo="Coordenadas">
        <p className="text-body-sm text-on-surface-variant -mt-1">
          Solo de una fuente verificable (Google Maps o dato provisto por la
          Dirección). Si no se conocen, dejar en blanco — el puesto queda
          marcado como pendiente de geolocalización, nunca se inventa.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Campo
            label="Latitud"
            id="latitud"
            name="latitud"
            type="number"
            step="0.000001"
            monoespaciado
            defaultValue={puesto.latitud ?? undefined}
          />
          <Campo
            label="Longitud"
            id="longitud"
            name="longitud"
            type="number"
            step="0.000001"
            monoespaciado
            defaultValue={puesto.longitud ?? undefined}
          />
        </div>
      </TarjetaSeccion>

      <TarjetaSeccion icono="account_balance" titulo="Jurisdicción Municipal Habitual">
        <p className="text-body-sm text-on-surface-variant -mt-1">
          Qué acta(s) municipal(es) puede labrar este puesto bajo modalidad
          habitual (sin declarar &quot;otra jurisdicción&quot;). La
          contravencional no se restringe por jurisdicción.
        </p>
        <div className="grid grid-cols-1 gap-2">
          {JURISDICCIONES.map((j) => (
            <label
              key={j}
              className="flex items-center gap-2 border border-outline-variant rounded p-2"
            >
              <input
                type="checkbox"
                name="jurisdiccionesMunicipales"
                value={j}
                checked={jurisdicciones.has(j)}
                onChange={() => alternar(j)}
                className="w-5 h-5 accent-secondary"
              />
              <span className="text-body-md text-on-surface">{JURISDICCION_LABEL[j]}</span>
            </label>
          ))}
        </div>
      </TarjetaSeccion>

      <BotonEnviar />
    </form>
  );
}

function BotonEnviar() {
  const { pending } = useFormStatus();
  return (
    <div className="pt-2 pb-6">
      <Boton type="submit" icono="save" fullWidth disabled={pending} className="disabled:opacity-60">
        {pending ? "Guardando…" : "Guardar Cambios"}
      </Boton>
    </div>
  );
}
