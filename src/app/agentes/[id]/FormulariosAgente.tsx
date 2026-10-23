"use client";

import { useActionState } from "react";
import {
  actualizarAgente,
  restablecerContrasena,
  type EstadoForm,
} from "../actions";
import { Campo } from "@/components/ui/Campo";
import { Boton } from "@/components/ui/Boton";

const estadoInicial: EstadoForm = {};

function Mensaje({ estado }: { estado: EstadoForm }) {
  if (estado.error) {
    return (
      <p className="text-body-sm text-error bg-error-container/40 border border-error rounded p-2">
        {estado.error}
      </p>
    );
  }
  if (estado.ok) {
    return (
      <p className="text-body-sm text-on-secondary-container bg-secondary-container/40 border border-secondary rounded p-2">
        {estado.ok}
      </p>
    );
  }
  return null;
}

export function EditarAgenteForm({
  agenteId,
  nombreApellido,
  grado,
}: {
  agenteId: string;
  nombreApellido: string;
  grado: string | null;
}) {
  const [estado, formAction, enCurso] = useActionState(actualizarAgente, estadoInicial);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="agenteId" value={agenteId} />
      <Campo
        id="nombreApellido"
        name="nombreApellido"
        label="Apellido y Nombre"
        defaultValue={nombreApellido}
        required
      />
      <Campo id="grado" name="grado" label="Grado" defaultValue={grado ?? ""} />
      <Mensaje estado={estado} />
      <Boton
        type="submit"
        variante="outline"
        icono="save"
        fullWidth
        disabled={enCurso}
        className="disabled:opacity-60"
      >
        {enCurso ? "Guardando…" : "Guardar Datos"}
      </Boton>
    </form>
  );
}

export function ContrasenaForm({ agenteId }: { agenteId: string }) {
  const [estado, formAction, enCurso] = useActionState(
    restablecerContrasena,
    estadoInicial,
  );

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="agenteId" value={agenteId} />
      <Campo
        id="contrasena"
        name="contrasena"
        type="password"
        label="Nueva contraseña"
        hint="Mínimo 8 caracteres."
        autoComplete="new-password"
        minLength={8}
        required
      />
      <Mensaje estado={estado} />
      <Boton
        type="submit"
        variante="outline"
        icono="key"
        fullWidth
        disabled={enCurso}
        className="disabled:opacity-60"
      >
        {enCurso ? "Guardando…" : "Restablecer Contraseña"}
      </Boton>
    </form>
  );
}
