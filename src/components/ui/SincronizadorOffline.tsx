"use client";

import { useCallback, useEffect, useState } from "react";
import { soportaIndexedDB } from "@/lib/offline/db";
import { listarActasPendientes } from "@/lib/offline/colaActas";
import { sincronizarCola, EVENTO_COLA_ACTUALIZADA } from "@/lib/offline/sincronizar";
import { precargarRutasCriticas } from "@/lib/offline/precache";

export function SincronizadorOffline() {
  const [online, setOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  const [pendientes, setPendientes] = useState(0);
  const [necesitaLogin, setNecesitaLogin] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);
  const [listo, setListo] = useState(false);

  const refrescarContador = useCallback(async () => {
    if (!soportaIndexedDB()) return;
    const cola = await listarActasPendientes();
    setPendientes(cola.length);
    setNecesitaLogin(cola.some((a) => a.ultimoError && /sesi[oó]n|login|auth/i.test(a.ultimoError)));
  }, []);

  const sincronizarAhora = useCallback(async () => {
    if (!soportaIndexedDB() || !navigator.onLine) return;
    setSincronizando(true);
    try {
      const resumen = await sincronizarCola();
      setNecesitaLogin(resumen.necesitaLogin);
    } finally {
      setSincronizando(false);
      await refrescarContador();
    }
  }, [refrescarContador]);

  useEffect(() => {
    // "Montado" se usa solo para no renderizar nada hasta después de la
    // hidratación (navigator.onLine no existe en el servidor), no para
    // sincronizar con un sistema externo — por eso el disable.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setListo(true);
    refrescarContador();

    const alConectar = () => {
      setOnline(true);
      sincronizarAhora();
      precargarRutasCriticas();
    };
    const alDesconectar = () => setOnline(false);
    const alCambiarCola = () => refrescarContador();

    window.addEventListener("online", alConectar);
    window.addEventListener("offline", alDesconectar);
    window.addEventListener(EVENTO_COLA_ACTUALIZADA, alCambiarCola);

    // Si ya estaba online al cargar la app: se intenta sincronizar la cola
    // pendiente (de una sesión anterior) y se precargan las rutas críticas
    // para que sigan disponibles si se corta la señal más tarde.
    if (navigator.onLine) {
      sincronizarAhora();
      precargarRutasCriticas();
    }

    return () => {
      window.removeEventListener("online", alConectar);
      window.removeEventListener("offline", alDesconectar);
      window.removeEventListener(EVENTO_COLA_ACTUALIZADA, alCambiarCola);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!listo || !soportaIndexedDB()) return null;
  if (online && pendientes === 0) return null;

  return (
    <div
      className={`sticky top-0 z-50 print:hidden flex items-center justify-between gap-2 px-pad-lg py-1.5 text-label-sm font-label-sm ${
        !online
          ? "bg-error text-on-error"
          : necesitaLogin
            ? "bg-warning text-on-warning"
            : "bg-secondary text-on-secondary"
      }`}
    >
      <span className="flex items-center gap-1.5">
        <span className="material-symbols-outlined text-[16px]">
          {!online ? "cloud_off" : necesitaLogin ? "warning" : "cloud_sync"}
        </span>
        {!online
          ? `Sin conexión${pendientes > 0 ? ` — ${pendientes} acta(s) guardada(s) en el celular` : ""}`
          : necesitaLogin
            ? "Sesión vencida — iniciá sesión de nuevo para sincronizar"
            : sincronizando
              ? "Sincronizando…"
              : `${pendientes} acta(s) pendiente(s) de sincronizar`}
      </span>
      {online && !sincronizando && (
        <button
          type="button"
          onClick={sincronizarAhora}
          className="uppercase underline underline-offset-2 shrink-0"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}
