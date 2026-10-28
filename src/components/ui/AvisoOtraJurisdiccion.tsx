/** Aviso completo dentro del detalle de un acta o procedimiento labrado en
 * modalidad "Otra Jurisdicción". Antes estaba duplicado a mano en
 * actas/[id]/firma y procedimientos/[id]; ahora es un solo componente. */
export function AvisoOtraJurisdiccion({
  titulo,
  puestoOrigen,
  puestoTrabajo,
  motivo,
}: {
  titulo: string;
  puestoOrigen: string;
  puestoTrabajo: string | null | undefined;
  motivo: string | null | undefined;
}) {
  return (
    <div className="bg-secondary-container/40 border-2 border-secondary rounded-lg p-3 flex items-start gap-2">
      <span className="material-symbols-outlined text-secondary mt-0.5">
        travel_explore
      </span>
      <div>
        <p className="text-label-sm font-label-sm font-bold text-secondary uppercase">
          {titulo} en Otra Jurisdicción
        </p>
        <p className="text-body-sm text-on-surface">
          Agente de <strong>{puestoOrigen}</strong> trabajando en{" "}
          <strong>{puestoTrabajo ?? "otro puesto"}</strong>.
        </p>
        {motivo && (
          <p className="text-body-sm text-on-surface-variant mt-1">
            Motivo: {motivo}
          </p>
        )}
      </div>
    </div>
  );
}
