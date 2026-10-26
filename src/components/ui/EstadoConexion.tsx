"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";

/** Indicador real de conectividad (navigator.onLine) — reemplaza a los
 * textos "En Línea" / "Sincronización Activa" que antes estaban fijos en
 * el código y ya no coincidían con el indicador real que agregó el modo
 * offline (ver SincronizadorOffline). */
export function EstadoConexion({
  className,
  ocultarTextoEnMovil = false,
}: {
  className?: string;
  ocultarTextoEnMovil?: boolean;
}) {
  // Arranca en "true" siempre — igual que lo que asume el servidor (no
  // tiene navigator) — para que la primera pintada del cliente coincida
  // con el HTML servido y no rompa la hidratación. El valor real se
  // corrige recién después de montar.
  const [online, setOnline] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- corrige a propósito el valor asumido en el primer render, ver comentario arriba
    setOnline(navigator.onLine);
    const alConectar = () => setOnline(true);
    const alDesconectar = () => setOnline(false);
    window.addEventListener("online", alConectar);
    window.addEventListener("offline", alDesconectar);
    return () => {
      window.removeEventListener("online", alConectar);
      window.removeEventListener("offline", alDesconectar);
    };
  }, []);

  return (
    <span
      className={clsx("flex items-center gap-1.5", className)}
      title={online ? "Conectado" : "Sin conexión a internet"}
    >
      <span
        className={clsx("w-2 h-2 rounded-full", online ? "bg-emerald-400" : "bg-error")}
        aria-hidden
      />
      <span
        className={clsx(
          "font-label-sm text-label-sm",
          ocultarTextoEnMovil && "hidden md:inline",
        )}
      >
        {online ? "En Línea" : "Sin Conexión"}
      </span>
    </span>
  );
}
