"use client";

import { useEffect, useState } from "react";
import { CampoSelect, CampoTextarea } from "@/components/ui/Campo";
import { JURISDICCION_LABEL } from "@/lib/formato";

type Jurisdiccion = "CAPITAL" | "HUILLAPIMA" | "LA_PUERTA";

const JURISDICCIONES: Jurisdiccion[] = ["CAPITAL", "HUILLAPIMA", "LA_PUERTA"];

/**
 * Modalidad de trabajo (habitual / otra jurisdicción), común a actas y
 * procedimientos. No hay autorización previa de un jefe: el agente declara
 * el motivo y queda grabado en el registro — ver Acta.motivoOtraJurisdiccion
 * / Procedimiento.motivoOtraJurisdiccion en el esquema.
 *
 * Cuando pide jurisdicción (solo acta MUNICIPAL): si el puesto de origen no
 * tiene ninguna jurisdicción municipal habitual, el modo HABITUAL queda
 * deshabilitado y fuerza a elegir "Otra jurisdicción" — la regla real se
 * valida igual en el servidor (ver actas/nueva/actions.ts), esto es solo
 * para que el agente no llegue a enviar un acta que el backend va a
 * rechazar.
 */
export function SelectorModalidadTrabajo({
  puestosDisponibles,
  puestoOrigenId,
  jurisdiccionesHabituales,
  onHabilitadoCambia,
}: {
  puestosDisponibles: { id: string; nombre: string }[];
  puestoOrigenId: string;
  /** Si se pasa (aunque sea []), también se pide la jurisdicción del acta —
   * solo aplica a la acta MUNICIPAL. Si no se pasa, no se pide (ej.
   * contravencional, procedimientos). */
  jurisdiccionesHabituales?: Jurisdiccion[];
  /** Avisa al formulario padre si debe deshabilitar el envío (puesto sin
   * jurisdicción habitual y todavía no eligió "Otra jurisdicción"). */
  onHabilitadoCambia?: (habilitado: boolean) => void;
}) {
  const pideJurisdiccion = jurisdiccionesHabituales !== undefined;
  const sinJurisdiccionHabitual =
    pideJurisdiccion && jurisdiccionesHabituales!.length === 0;

  const [modalidad, setModalidad] = useState<"HABITUAL" | "OTRA_JURISDICCION">(
    sinJurisdiccionHabitual ? "OTRA_JURISDICCION" : "HABITUAL",
  );
  const [jurisdiccion, setJurisdiccion] = useState<Jurisdiccion | "">(
    pideJurisdiccion && !sinJurisdiccionHabitual
      ? jurisdiccionesHabituales![0]
      : "",
  );
  const [puestoTrabajoId, setPuestoTrabajoId] = useState("");
  const [motivo, setMotivo] = useState("");

  const otrosPuestos = puestosDisponibles.filter((p) => p.id !== puestoOrigenId);

  const esOtraJurisdiccion = modalidad === "OTRA_JURISDICCION";
  const habilitado =
    !esOtraJurisdiccion
      ? !sinJurisdiccionHabitual
      : Boolean(puestoTrabajoId) &&
        motivo.trim().length > 0 &&
        (!pideJurisdiccion || Boolean(jurisdiccion));

  useEffect(() => {
    onHabilitadoCambia?.(habilitado);
  }, [habilitado, onHabilitadoCambia]);

  function elegirModalidad(m: "HABITUAL" | "OTRA_JURISDICCION") {
    setModalidad(m);
    if (m === "HABITUAL" && pideJurisdiccion && !sinJurisdiccionHabitual) {
      setJurisdiccion(jurisdiccionesHabituales![0]);
    }
  }

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-3 space-y-3">
      <span className="block text-label-sm font-label-sm text-on-surface-variant uppercase">
        ¿Dónde estás trabajando?
      </span>
      <input type="hidden" name="modalidadTrabajo" value={modalidad} />
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={sinJurisdiccionHabitual}
          onClick={() => elegirModalidad("HABITUAL")}
          className={`min-h-touch-min border rounded flex items-center justify-center gap-1.5 font-label-sm text-label-sm active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
            !esOtraJurisdiccion
              ? "border-2 border-primary bg-primary-container/40 text-primary"
              : "border-outline-variant bg-surface-container text-on-surface"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">shield</span>
          Mi Puesto Habitual
        </button>
        <button
          type="button"
          onClick={() => elegirModalidad("OTRA_JURISDICCION")}
          className={`min-h-touch-min border rounded flex items-center justify-center gap-1.5 font-label-sm text-label-sm active:scale-95 transition-all ${
            esOtraJurisdiccion
              ? "border-2 border-primary bg-primary-container/40 text-primary"
              : "border-outline-variant bg-surface-container text-on-surface"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            travel_explore
          </span>
          Otra Jurisdicción
        </button>
      </div>

      {sinJurisdiccionHabitual && !esOtraJurisdiccion && (
        <p className="text-body-sm text-error bg-error-container/40 border border-error rounded p-2">
          Tu puesto no tiene jurisdicción municipal habitual asignada. Si
          estás reforzando otra zona, elegí &quot;Otra Jurisdicción&quot; e
          indicá el motivo.
        </p>
      )}

      {!esOtraJurisdiccion && pideJurisdiccion && !sinJurisdiccionHabitual && (
        <>
          <input type="hidden" name="jurisdiccion" value={jurisdiccion} />
          {jurisdiccionesHabituales!.length > 1 ? (
            <CampoSelect
              label="Jurisdicción del Acta"
              id="jurisdiccionHabitual"
              name="jurisdiccionHabitualVisible"
              value={jurisdiccion}
              onChange={(e) => setJurisdiccion(e.target.value as Jurisdiccion)}
            >
              {jurisdiccionesHabituales!.map((j) => (
                <option key={j} value={j}>
                  {JURISDICCION_LABEL[j]}
                </option>
              ))}
            </CampoSelect>
          ) : (
            <p className="text-body-sm text-on-surface-variant">
              Jurisdicción: <strong>{JURISDICCION_LABEL[jurisdiccion]}</strong>
            </p>
          )}
        </>
      )}

      {esOtraJurisdiccion && (
        <div className="space-y-3 pt-1 border-t border-outline-variant">
          <CampoSelect
            label="Puesto Donde Estás Trabajando"
            id="puestoTrabajoId"
            name="puestoTrabajoId"
            required
            value={puestoTrabajoId}
            onChange={(e) => setPuestoTrabajoId(e.target.value)}
          >
            <option value="" disabled>
              Seleccioná…
            </option>
            {otrosPuestos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </CampoSelect>

          {pideJurisdiccion && (
            <CampoSelect
              label="Jurisdicción del Acta"
              id="jurisdiccionOtra"
              name="jurisdiccion"
              required
              value={jurisdiccion}
              onChange={(e) => setJurisdiccion(e.target.value as Jurisdiccion)}
            >
              <option value="" disabled>
                Seleccioná…
              </option>
              {JURISDICCIONES.map((j) => (
                <option key={j} value={j}>
                  {JURISDICCION_LABEL[j]}
                </option>
              ))}
            </CampoSelect>
          )}

          <CampoTextarea
            label="Motivo (obligatorio)"
            id="motivoOtraJurisdiccion"
            name="motivoOtraJurisdiccion"
            rows={2}
            required
            placeholder="Ej: refuerzo por Día de la Virgen, orden del Jefe de Base…"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
          />
        </div>
      )}
    </div>
  );
}
