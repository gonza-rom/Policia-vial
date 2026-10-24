"use client";

export function BotonEliminarActa({ numero }: { numero: string }) {
  return (
    <button
      type="submit"
      onClick={(e) => {
        if (!confirm(`¿Eliminar el acta N° ${numero}? Esta acción no se puede deshacer.`)) {
          e.preventDefault();
        }
      }}
      className="flex items-center gap-1 text-error text-label-sm font-label-sm uppercase"
    >
      <span className="material-symbols-outlined text-[18px]">delete</span>
      Eliminar
    </button>
  );
}
