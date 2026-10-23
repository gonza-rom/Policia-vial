"use client";

import { useActionState } from "react";
import { crearAgente, type EstadoForm } from "../actions";
import { Campo } from "@/components/ui/Campo";
import { Boton } from "@/components/ui/Boton";

const estadoInicial: EstadoForm = {};

export function NuevoAgenteForm() {
  const [estado, formAction, enCurso] = useActionState(crearAgente, estadoInicial);

  return (
    <form action={formAction} className="space-y-4">
      <Campo
        id="legajo"
        name="legajo"
        label="Legajo"
        placeholder="Ej: LP-45.120"
        hint="Es el usuario con el que el agente va a ingresar."
        autoComplete="off"
        required
        monoespaciado
        className="uppercase"
      />
      <Campo
        id="nombreApellido"
        name="nombreApellido"
        label="Apellido y Nombre"
        placeholder="Ej: Pérez, Juan"
        autoComplete="off"
        required
      />
      <Campo id="grado" name="grado" label="Grado (opcional)" placeholder="Ej: Oficial" />
      <Campo
        id="contrasena"
        name="contrasena"
        type="password"
        label="Contraseña inicial"
        hint="Mínimo 8 caracteres. Entregásela al agente en persona."
        autoComplete="new-password"
        minLength={8}
        required
      />

      {estado.error && (
        <p className="text-body-sm text-error bg-error-container/40 border border-error rounded p-2">
          {estado.error}
        </p>
      )}

      <Boton
        type="submit"
        icono="person_add"
        fullWidth
        disabled={enCurso}
        className="disabled:opacity-60"
      >
        {enCurso ? "Creando…" : "Dar de Alta"}
      </Boton>
    </form>
  );
}
