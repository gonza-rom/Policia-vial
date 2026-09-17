"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Boton } from "./Boton";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function esIOS() {
  return /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
}

function estaInstalada() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

// Ninguno de los dos valores cambia durante la sesión salvo por el evento
// "appinstalled", así que basta con re-emitir ese único evento.
function suscribirseAInstalacion(callback: () => void) {
  window.addEventListener("appinstalled", callback);
  return () => window.removeEventListener("appinstalled", callback);
}

function snapshotServidor() {
  return false;
}

export function InstalarApp() {
  const instalada = useSyncExternalStore(
    suscribirseAInstalacion,
    estaInstalada,
    snapshotServidor,
  );
  const dispositivoIOS = useSyncExternalStore(
    suscribirseAInstalacion,
    esIOS,
    snapshotServidor,
  );
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return () =>
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  }, []);

  if (instalada) return null;

  if (promptEvent) {
    return (
      <Boton
        type="button"
        variante="outline"
        icono="install_mobile"
        fullWidth
        onClick={async () => {
          await promptEvent.prompt();
          await promptEvent.userChoice;
          setPromptEvent(null);
        }}
      >
        Instalar app en este dispositivo
      </Boton>
    );
  }

  if (dispositivoIOS) {
    return (
      <div className="bg-surface-container p-pad-md rounded border border-outline-variant text-body-sm text-on-surface-variant flex gap-2">
        <span className="material-symbols-outlined text-secondary shrink-0">
          ios_share
        </span>
        <p>
          Para instalar la app en este iPhone/iPad: tocá{" "}
          <strong>Compartir</strong> en Safari y elegí{" "}
          <strong>&quot;Agregar a pantalla de inicio&quot;</strong>.
        </p>
      </div>
    );
  }

  return null;
}
