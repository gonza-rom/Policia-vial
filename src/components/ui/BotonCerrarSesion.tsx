"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import clsx from "clsx";
import { createClient } from "@/lib/supabase/client";
import { Boton } from "./Boton";
import type { ComponentPropsWithoutRef } from "react";

/** Drop-in reemplazo de BotonEnviar para "Cerrar Sesión" específicamente:
 * sin señal, el `<form action={cerrarSesion}>` normal nunca llega a
 * completarse (la acción de servidor necesita red) y el agente queda
 * trabado sin poder salir de su cuenta. Entrar y salir de sesión es lo
 * único de toda la app que no hace falta encolar para sincronizar
 * después — cerrar sesión del lado del cliente (`scope: "local"`, sin
 * aviso al servidor) alcanza, así que directamente se resuelve ahí mismo
 * en vez de guardarlo para más tarde. Debe usarse dentro de un
 * `<form action={cerrarSesion}>` (con señal, deja pasar ese submit
 * normal). */
export function BotonCerrarSesion({
  children,
  disabled,
  className,
  onClick,
  ...rest
}: ComponentPropsWithoutRef<typeof Boton>) {
  const { pending } = useFormStatus();
  const [saliendo, setSaliendo] = useState(false);

  async function manejarClick(e: React.MouseEvent<HTMLButtonElement>) {
    onClick?.(e);
    if (navigator.onLine) return; // hay señal: que siga el submit normal
    e.preventDefault();
    setSaliendo(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut({ scope: "local" });
    } finally {
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- recarga dura intencional, misma razón que NuevaActaForm
      window.location.href = "/login";
    }
  }

  return (
    <Boton
      type="submit"
      onClick={manejarClick}
      disabled={pending || saliendo || disabled}
      className={clsx("disabled:opacity-60", className)}
      {...rest}
    >
      {pending || saliendo ? "Cerrando sesión…" : children}
    </Boton>
  );
}
