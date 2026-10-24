"use client";

import { useFormStatus } from "react-dom";
import {
  crearActaContravencional,
  actualizarActaContravencional,
} from "./actions";
import { TarjetaSeccion } from "@/components/ui/Tarjeta";
import { Campo, CampoTextarea } from "@/components/ui/Campo";
import { CampoArchivo } from "@/components/ui/CampoArchivo";
import { Boton } from "@/components/ui/Boton";

type CampoDTO = {
  id: string;
  clave: string;
  etiqueta: string;
  seccion: string;
  tipo: "TEXTO" | "TEXTO_LARGO" | "NUMERO" | "FECHA";
  requerido: boolean;
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
}: {
  campos: CampoDTO[];
  actaExistente?: {
    id: string;
    lugarControl: string | null;
    datos: Record<string, string>;
  };
}) {
  const secciones = agruparPorSeccion(campos);

  return (
    <form
      action={actaExistente ? actualizarActaContravencional : crearActaContravencional}
      className="space-y-4"
    >
      {actaExistente && (
        <input type="hidden" name="actaId" value={actaExistente.id} />
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
          {seccion.campos.map((campo) =>
            campo.tipo === "TEXTO_LARGO" ? (
              <CampoTextarea
                key={campo.clave}
                label={campo.etiqueta}
                id={campo.clave}
                name={campo.clave}
                rows={3}
                required={campo.requerido}
                defaultValue={actaExistente?.datos[campo.clave] ?? undefined}
              />
            ) : (
              <Campo
                key={campo.clave}
                label={campo.etiqueta}
                id={campo.clave}
                name={campo.clave}
                type={campo.tipo === "NUMERO" ? "number" : campo.tipo === "FECHA" ? "date" : "text"}
                required={campo.requerido}
                defaultValue={actaExistente?.datos[campo.clave] ?? undefined}
              />
            ),
          )}
        </TarjetaSeccion>
      ))}

      <TarjetaSeccion icono="photo_camera" titulo="Evidencia Fotográfica">
        <div className="grid grid-cols-2 gap-3">
          <CampoArchivo label="Foto del Vehículo" id="fotoVehiculo" name="fotoVehiculo" />
          <CampoArchivo label="Foto de la Infracción" id="fotoDocumento" name="fotoDocumento" />
        </div>
        {actaExistente && (
          <p className="text-body-sm text-on-surface-variant">
            Si no adjuntás una foto nueva, se conserva la que ya estaba cargada.
          </p>
        )}
      </TarjetaSeccion>

      <BotonEnviar esEdicion={Boolean(actaExistente)} />
    </form>
  );
}

function BotonEnviar({ esEdicion }: { esEdicion: boolean }) {
  const { pending } = useFormStatus();
  return (
    <div className="pt-2 pb-6">
      <Boton
        type="submit"
        icono={esEdicion ? "save" : "draw"}
        fullWidth
        disabled={pending}
        className="disabled:opacity-60"
      >
        {pending
          ? "Guardando…"
          : esEdicion
            ? "Guardar Cambios"
            : "Continuar a Firma y Cierre"}
      </Boton>
    </div>
  );
}
