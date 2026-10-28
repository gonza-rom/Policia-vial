"use client";

import { useFormStatus } from "react-dom";
import clsx from "clsx";
import { Boton } from "./Boton";
import type { ComponentPropsWithoutRef } from "react";

/** Botón de submit con feedback de "enviando…" para los formularios
 * simples de una sola acción (cerrar guardia, cerrar sesión, iniciar
 * guardia, elegir puesto, dar de baja, etc.) — los formularios grandes
 * (actas, procedimientos, relevamientos…) ya resuelven esto cada uno con
 * su propio `useFormStatus`. Con mala señal en la ruta, sin este aviso el
 * agente no sabe si el toque se registró y puede volver a tocar,
 * duplicando el envío — por eso también se deshabilita mientras está
 * pendiente. Debe usarse dentro de un `<form action={...}>`. */
export function BotonEnviar({
  children,
  textoEnviando = "Enviando…",
  disabled,
  className,
  ...rest
}: ComponentPropsWithoutRef<typeof Boton> & { textoEnviando?: string }) {
  const { pending } = useFormStatus();
  return (
    <Boton
      type="submit"
      disabled={pending || disabled}
      className={clsx("disabled:opacity-60", className)}
      {...rest}
    >
      {pending ? textoEnviando : children}
    </Boton>
  );
}
