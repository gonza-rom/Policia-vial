"use client";

export function BotonImprimir({ texto = "Exportar PDF" }: { texto?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="flex items-center gap-1 text-secondary text-label-sm font-label-sm uppercase"
    >
      <span className="material-symbols-outlined text-[18px]">print</span>
      {texto}
    </button>
  );
}
