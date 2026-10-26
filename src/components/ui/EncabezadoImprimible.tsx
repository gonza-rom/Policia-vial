import Image from "next/image";

/** Encabezado que SOLO se ve al imprimir/exportar a PDF (el AppHeader normal
 * se oculta con @media print en globals.css, junto con nav/footer). Único
 * lugar donde se arma "logo + lugar/fecha/hora" para los documentos, así
 * actas, requerimientos y relevamientos lo muestran siempre igual. */
export function EncabezadoImprimible({
  titulo,
  lugar,
  fecha,
  hora,
}: {
  titulo: string;
  lugar: string;
  fecha: string;
  hora: string;
}) {
  return (
    <div className="hidden print:flex items-center justify-between gap-4 border-b-2 border-primary pb-3 mb-4">
      <div className="flex items-center gap-3">
        <Image
          src="/escudo-policia-catamarca.png"
          alt="Escudo Dirección de Seguridad Vial - Policía de Catamarca"
          width={56}
          height={56}
          // Este bloque empieza oculto (display:none) y solo se muestra al
          // imprimir — sin `priority` la imagen queda con carga diferida y
          // nunca llega a pedirse, porque el observer de intersección no
          // dispara para un elemento que nunca tuvo caja de layout.
          priority
          className="w-14 h-14 object-contain shrink-0"
        />
        <div>
          <p className="text-label-sm font-label-sm text-on-surface-variant uppercase leading-tight">
            Policía de Catamarca
          </p>
          <p className="text-body-lg font-bold text-primary leading-tight">
            Dirección de Seguridad Vial
          </p>
          <p className="text-body-sm text-on-surface-variant leading-tight">{titulo}</p>
        </div>
      </div>
      <dl className="text-body-sm text-right shrink-0">
        <div className="flex justify-end gap-1.5">
          <dt className="text-on-surface-variant uppercase">Lugar:</dt>
          <dd className="font-semibold text-on-surface">{lugar}</dd>
        </div>
        <div className="flex justify-end gap-1.5">
          <dt className="text-on-surface-variant uppercase">Fecha:</dt>
          <dd className="font-semibold text-on-surface">{fecha}</dd>
        </div>
        <div className="flex justify-end gap-1.5">
          <dt className="text-on-surface-variant uppercase">Hora:</dt>
          <dd className="font-semibold text-on-surface">{hora} Hs</dd>
        </div>
      </dl>
    </div>
  );
}
