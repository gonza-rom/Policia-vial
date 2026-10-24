"use client";

export function BotonEliminarConConfirmacion({ mensaje }: { mensaje: string }) {
  return (
    <button
      type="submit"
      onClick={(e) => {
        if (!confirm(mensaje)) e.preventDefault();
      }}
      className="flex items-center gap-1 text-error text-label-sm font-label-sm uppercase"
    >
      <span className="material-symbols-outlined text-[18px]">delete</span>
      Eliminar
    </button>
  );
}
