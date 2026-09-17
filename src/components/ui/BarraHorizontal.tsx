export function BarraHorizontal({
  etiqueta,
  valor,
  valorMostrado,
  porcentaje,
  color,
  icono,
}: {
  etiqueta: string;
  valor: number;
  valorMostrado: string;
  porcentaje: number;
  color: string;
  icono?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-body-sm mb-1">
        <span className="flex items-center gap-1.5 text-on-surface font-medium">
          {icono && (
            <span
              className="material-symbols-outlined text-[16px]"
              style={{ color }}
              aria-hidden
            >
              {icono}
            </span>
          )}
          {etiqueta}
        </span>
        <span className="font-display font-semibold text-on-surface tabular-nums">
          {valorMostrado}
        </span>
      </div>
      <div
        className="h-2.5 rounded-full bg-surface-container-high overflow-hidden"
        role="img"
        aria-label={`${etiqueta}: ${valorMostrado}`}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.min(100, Math.max(valor > 0 ? 3 : 0, porcentaje))}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
}
