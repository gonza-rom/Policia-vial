"use client";

import { useActionState, useState } from "react";
import { iniciarSesion, type EstadoLogin } from "./actions";
import { Boton } from "@/components/ui/Boton";

const estadoInicial: EstadoLogin = {};

export function LoginForm() {
  const [estado, formAction, enCurso] = useActionState(
    iniciarSesion,
    estadoInicial,
  );
  const [verContrasena, setVerContrasena] = useState(false);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label
          htmlFor="legajo"
          className="block text-label-sm font-label-sm text-on-surface-variant uppercase mb-1"
        >
          Usuario
        </label>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
            badge
          </span>
          <input
            id="legajo"
            name="legajo"
            type="text"
            autoComplete="username"
            placeholder="Ej: LP-38.904"
            required
            className="w-full bg-surface-container-low border border-outline rounded text-body-md font-body-md text-on-surface pl-11 pr-3 py-2.5 min-h-touch-min focus:bg-surface-container-lowest uppercase"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="contrasena"
          className="block text-label-sm font-label-sm text-on-surface-variant uppercase mb-1"
        >
          Contraseña
        </label>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
            key
          </span>
          <input
            id="contrasena"
            name="contrasena"
            type={verContrasena ? "text" : "password"}
            autoComplete="current-password"
            required
            className="w-full bg-surface-container-low border border-outline rounded text-body-md font-body-md text-on-surface pl-11 pr-11 py-2.5 min-h-touch-min focus:bg-surface-container-lowest"
          />
          <button
            type="button"
            onClick={() => setVerContrasena((v) => !v)}
            aria-label={verContrasena ? "Ocultar contraseña" : "Mostrar contraseña"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-outline"
          >
            <span className="material-symbols-outlined">
              {verContrasena ? "visibility_off" : "visibility"}
            </span>
          </button>
        </div>
      </div>

      {estado.error && (
        <p className="text-body-sm text-error bg-error-container/40 border border-error rounded p-2">
          {estado.error}
        </p>
      )}

      <Boton
        type="submit"
        variante="primario"
        icono="shield"
        fullWidth
        disabled={enCurso}
        className="disabled:opacity-60"
      >
        {enCurso ? "Ingresando…" : "Ingresar a Guardia Operativa"}
      </Boton>
    </form>
  );
}
