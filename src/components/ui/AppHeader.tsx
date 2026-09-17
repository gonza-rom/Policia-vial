import Image from "next/image";

function iniciales(nombreApellido: string) {
  const partes = nombreApellido.trim().split(/\s+/);
  const letras = partes.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "");
  return letras.join("") || "PV";
}

export function AppHeader({
  nombreApellido,
  legajo,
}: {
  nombreApellido: string;
  legajo: string;
}) {
  return (
    <header className="sticky top-0 z-40 bg-primary-container text-on-primary border-b border-primary shadow-sm w-full px-pad-lg h-touch-min flex justify-between items-center">
      <div className="flex items-center gap-pad-md min-w-0">
        <Image
          src="/escudo-policia-catamarca.png"
          alt="Escudo Dirección de Seguridad Vial - Policía de Catamarca"
          width={40}
          height={40}
          className="w-10 h-10 object-contain rounded border border-outline-variant/30 bg-primary/40 p-0.5 shrink-0"
        />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h1 className="text-headline-sm font-headline-sm font-bold text-on-primary tracking-tight leading-none truncate">
              Seguridad Vial Catamarca
            </h1>
            <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-label-sm font-bold bg-secondary text-on-secondary uppercase shrink-0">
              Huillapima
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-pad-md shrink-0">
        <span
          className="flex items-center gap-1 text-on-primary-container"
          title="Sincronización activa"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400" aria-hidden />
          <span className="hidden md:inline font-label-sm text-label-sm">
            En Línea
          </span>
        </span>
        <div className="flex items-center gap-2 pl-pad-sm border-l border-on-primary-container/30">
          <div className="text-right hidden sm:block">
            <p className="text-label-sm font-label-sm font-bold text-on-primary leading-tight">
              {nombreApellido}
            </p>
            <p className="text-label-sm font-label-sm text-on-primary-container text-[10px]">
              {legajo}
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-secondary text-on-secondary font-display text-label-md flex items-center justify-center font-bold ring-2 ring-secondary-container/40 shrink-0">
            {iniciales(nombreApellido)}
          </div>
        </div>
      </div>
    </header>
  );
}
