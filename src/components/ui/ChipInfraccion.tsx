"use client";

import clsx from "clsx";

export function ChipInfraccion({
  label,
  seleccionado,
  onToggle,
  tono = "normal",
}: {
  label: string;
  seleccionado: boolean;
  onToggle: () => void;
  tono?: "normal" | "grave";
}) {
  const graveYSeleccionado = tono === "grave" && seleccionado;

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={seleccionado}
      className={clsx(
        "min-h-touch-min border rounded p-3 text-left flex items-center justify-between gap-2 active:scale-95 transition-all",
        seleccionado
          ? graveYSeleccionado
            ? "border-2 border-error bg-error-container"
            : "border-2 border-secondary bg-secondary-container/20"
          : "border-outline-variant bg-surface-container-lowest hover:bg-surface-container",
      )}
    >
      <span
        className={clsx(
          "text-body-md font-body-md",
          graveYSeleccionado ? "text-on-error-container font-semibold" : "text-on-surface",
        )}
      >
        {label}
      </span>
      <span
        className={clsx(
          "material-symbols-outlined shrink-0",
          seleccionado
            ? graveYSeleccionado
              ? "text-error"
              : "text-secondary"
            : "text-outline-variant",
        )}
        aria-hidden
      >
        {seleccionado ? "check_box" : "check_box_outline_blank"}
      </span>
    </button>
  );
}
