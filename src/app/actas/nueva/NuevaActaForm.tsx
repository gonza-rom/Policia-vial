"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { crearActa } from "./actions";
import { TarjetaSeccion } from "@/components/ui/Tarjeta";
import { Campo, CampoSelect, CampoTextarea } from "@/components/ui/Campo";
import { ChipInfraccion } from "@/components/ui/ChipInfraccion";
import { Boton } from "@/components/ui/Boton";

type InfraccionCatalogoDTO = {
  id: string;
  categoria: "DOCUMENTACION" | "ESTADO_RODADO" | "ALCOHOLEMIA_CONDUCTA" | "OTRA";
  descripcion: string;
  gravedad: "LEVE" | "GRAVE" | "GRAVISIMA";
  montoBase: number;
};

const CATEGORIAS: {
  key: InfraccionCatalogoDTO["categoria"];
  titulo: string;
}[] = [
  { key: "DOCUMENTACION", titulo: "Conducir Sin Documentación Habilitante / Elementos" },
  { key: "ESTADO_RODADO", titulo: "Estado del Rodado y Seguridad Vial" },
  { key: "ALCOHOLEMIA_CONDUCTA", titulo: "Alcoholemia y Estado Psicofísico" },
];

const TIPOS_RODADO = [
  { value: "AUTO", label: "Auto", icono: "directions_car" },
  { value: "MOTO", label: "Moto", icono: "two_wheeler" },
  { value: "PICKUP", label: "Pick-Up", icono: "airport_shuttle" },
  { value: "CARGA", label: "Carga", icono: "local_shipping" },
] as const;

const ALCOHOLEMIA_DESC = "Estado de Ebriedad / Efecto Estupefacientes";

export function NuevaActaForm({
  catalogo,
  lugarControlSugerido,
}: {
  catalogo: InfraccionCatalogoDTO[];
  lugarControlSugerido: string;
}) {
  const [seleccionadas, setSeleccionadas] = useState<Set<string>>(new Set());
  const [tipoRodado, setTipoRodado] = useState<(typeof TIPOS_RODADO)[number]["value"]>("AUTO");
  const [montoBase, setMontoBase] = useState<number>(0);
  const [montoEditadoManualmente, setMontoEditadoManualmente] = useState(false);
  const [retencion, setRetencion] = useState(false);

  const otraInfraccion = catalogo.find((i) => i.categoria === "OTRA");

  function alternar(id: string) {
    setSeleccionadas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);

      if (!montoEditadoManualmente) {
        let suma = 0;
        for (const item of catalogo) {
          if (next.has(item.id)) suma += item.montoBase;
        }
        setMontoBase(suma);
      }
      return next;
    });
  }

  const montoConDescuento = useMemo(
    () => Math.round(montoBase * 0.6),
    [montoBase],
  );

  return (
    <form action={crearActa} className="space-y-4">
      <div className="bg-surface-container-lowest border-l-4 border-secondary p-3 rounded shadow-sm border border-outline-variant">
        <div className="flex items-center justify-between">
          <span className="text-label-sm font-label-sm text-secondary uppercase font-bold">
            Acta de Comprobación
          </span>
          <span className="text-label-sm font-label-sm bg-surface-container px-2 py-0.5 rounded text-on-surface-variant">
            L.N.T. 24.449 / 26.363
          </span>
        </div>
        <div className="mt-2 pt-2 border-t border-outline-variant">
          <Campo
            label="Lugar de Constatación"
            id="lugarControl"
            name="lugarControl"
            defaultValue={lugarControlSugerido}
          />
        </div>
      </div>

      <TarjetaSeccion icono="person" titulo="1. Datos del Conductor" badge="Obligatorio">
        <Campo
          label="Apellido y Nombre del Conductor"
          id="conductorNombre"
          name="conductorNombre"
          placeholder="Ej: CARRIZO, MARCELO ANTONIO"
          required
          className="uppercase"
        />
        <Campo
          label="Domicilio Legal"
          id="conductorDomicilio"
          name="conductorDomicilio"
          placeholder="Calle, Barrio, Localidad"
        />
        <div className="grid grid-cols-2 gap-3">
          <Campo
            label="D.N.I. N°"
            id="conductorDni"
            name="conductorDni"
            placeholder="Ej: 34.892.115"
            required
            monoespaciado
          />
          <Campo
            label="Edad"
            id="conductorEdad"
            name="conductorEdad"
            type="number"
            min={14}
            max={110}
            placeholder="Ej: 32"
            monoespaciado
          />
        </div>
        <Campo
          label="Expedido Por"
          id="conductorExpedidoPor"
          name="conductorExpedidoPor"
          placeholder="Ej: RENAPER / Catamarca"
          className="uppercase"
        />
        <div className="grid grid-cols-2 gap-3">
          <Campo
            label="Licencia de Conducir N°"
            id="conductorLicenciaNro"
            name="conductorLicenciaNro"
            placeholder="N° Carnet"
            monoespaciado
          />
          <Campo
            label="Clase"
            id="conductorLicenciaClase"
            name="conductorLicenciaClase"
            placeholder="B1, B2, C…"
            monoespaciado
            className="uppercase"
          />
        </div>
      </TarjetaSeccion>

      <TarjetaSeccion
        icono="directions_car"
        titulo="2. Datos del Vehículo"
        badge="Verificación Física"
      >
        <Campo
          label="Dominio (Chapa Patente)"
          id="vehiculoDominio"
          name="vehiculoDominio"
          placeholder="Ej: AB 123 CD ó WXY 789"
          required
          monoespaciado
          className="uppercase tracking-widest text-lg text-primary"
        />
        <Campo
          label="Vehículo Marca - Modelo"
          id="vehiculoMarcaModelo"
          name="vehiculoMarcaModelo"
          placeholder="Ej: TOYOTA HILUX"
          className="uppercase"
        />
        <div>
          <span className="block text-label-sm font-label-sm text-on-surface-variant uppercase mb-1">
            Tipo de Rodado
          </span>
          <input type="hidden" name="vehiculoTipo" value={tipoRodado} />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {TIPOS_RODADO.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setTipoRodado(t.value)}
                className={`min-h-touch-min border rounded flex items-center justify-center gap-1 font-label-sm text-label-sm active:scale-95 transition-all ${
                  tipoRodado === t.value
                    ? "border-2 border-secondary bg-secondary-container/20 text-secondary"
                    : "border-outline-variant bg-surface-container-lowest text-on-surface"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {t.icono}
                </span>
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <Campo
          label="Remitido Al"
          id="vehiculoRemitidoA"
          name="vehiculoRemitidoA"
          placeholder="Ej: Corralón Municipal Huillapima"
        />
        <div className="grid grid-cols-2 gap-3">
          <CampoArchivo label="Foto del Vehículo" id="fotoVehiculo" name="fotoVehiculo" />
          <CampoArchivo label="Foto Documentación" id="fotoDocumento" name="fotoDocumento" />
        </div>
      </TarjetaSeccion>

      <TarjetaSeccion
        icono="warning"
        titulo="3. Infracciones Constatadas"
        badge={`${seleccionadas.size} Marcadas`}
        badgeTono="error"
      >
        <p className="text-body-sm font-body-sm text-on-surface-variant -mt-1">
          Pulse sobre las faltas tipificadas según inspección ocular directa.
        </p>
        {CATEGORIAS.map((cat) => {
          const items = catalogo.filter((i) => i.categoria === cat.key);
          if (items.length === 0) return null;
          return (
            <div key={cat.key} className="space-y-2">
              <div className="bg-surface-container-low p-2 rounded text-label-sm font-label-sm text-primary font-bold tracking-wider">
                {cat.titulo.toUpperCase()}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {items.map((item) => {
                  const esAlcoholemia = item.descripcion === ALCOHOLEMIA_DESC;
                  const grave = item.gravedad !== "LEVE";
                  return (
                    <div
                      key={item.id}
                      className={esAlcoholemia ? "sm:col-span-2" : undefined}
                    >
                      <input
                        type="checkbox"
                        hidden
                        readOnly
                        name="infracciones"
                        value={item.id}
                        checked={seleccionadas.has(item.id)}
                      />
                      <ChipInfraccion
                        label={item.descripcion}
                        seleccionado={seleccionadas.has(item.id)}
                        onToggle={() => alternar(item.id)}
                        tono={grave ? "grave" : "normal"}
                      />
                      {esAlcoholemia && seleccionadas.has(item.id) && (
                        <div className="mt-2 grid grid-cols-2 gap-2 bg-error-container/30 border border-error rounded p-2">
                          <Campo
                            label="Graduación (g/L)"
                            id="alcoholemiaGraduacion"
                            name="alcoholemiaGraduacion"
                            type="number"
                            step="0.01"
                            min={0}
                            placeholder="Ej: 0.85"
                            monoespaciado
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {otraInfraccion && (
          <div className="pt-2 border-t border-outline-variant space-y-2">
            <input
              type="checkbox"
              hidden
              readOnly
              name="infracciones"
              value={otraInfraccion.id}
              checked={seleccionadas.has(otraInfraccion.id)}
            />
            <input type="hidden" name="otraInfraccionId" value={otraInfraccion.id} />
            <ChipInfraccion
              label="Otra Infracción / Ver Detalle"
              seleccionado={seleccionadas.has(otraInfraccion.id)}
              onToggle={() => alternar(otraInfraccion.id)}
            />
            {seleccionadas.has(otraInfraccion.id) && (
              <Campo
                label="Especificar Otra Infracción / Detalle Operativo"
                id="detalleOtraInfraccion"
                name="detalleOtraInfraccion"
                placeholder="Tipificación adicional según Código de Faltas…"
              />
            )}
          </div>
        )}
      </TarjetaSeccion>

      <TarjetaSeccion icono="notes" titulo="4. Otros Datos Ampliatorios">
        <CampoTextarea
          label="Observaciones del Oficial de Guardia / Circunstancias"
          id="otrosDatosAmpliatorios"
          name="otrosDatosAmpliatorios"
          rows={3}
          placeholder="Detalle estado del tiempo, visibilidad, comportamiento del conductor…"
        />
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="retencionPreventiva"
            name="retencionPreventiva"
            checked={retencion}
            onChange={(e) => setRetencion(e.target.checked)}
            className="w-5 h-5 accent-error"
          />
          <label htmlFor="retencionPreventiva" className="text-body-md text-on-surface">
            Aplicar retención preventiva
          </label>
        </div>
        {retencion && (
          <CampoSelect label="Tipo de Retención" id="tipoRetencion" name="tipoRetencion" defaultValue="LICENCIA">
            <option value="LICENCIA">Licencia de Conducir</option>
            <option value="VEHICULO">Vehículo</option>
            <option value="LICENCIA_Y_VEHICULO">Licencia y Vehículo</option>
          </CampoSelect>
        )}
      </TarjetaSeccion>

      <TarjetaSeccion icono="payments" titulo="5. Liquidación Municipal Estimada" badge="Dpto. Rentas" badgeTono="primario">
        <div>
          <label
            htmlFor="montoBase"
            className="block text-label-sm font-label-sm text-on-surface-variant uppercase mb-1"
          >
            Monto Determinado / Multa Base ($ ARS)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-display text-lg text-outline">
              $
            </span>
            <input
              id="montoBase"
              name="montoBase"
              type="number"
              min={0}
              step="100"
              value={montoBase}
              onChange={(e) => {
                setMontoEditadoManualmente(true);
                setMontoBase(Number(e.target.value));
              }}
              className="w-full bg-surface-container-low border border-outline rounded font-display text-xl font-bold text-primary pl-8 pr-3 py-2.5 min-h-touch-min focus:bg-surface-container-lowest"
            />
          </div>
        </div>

        <div className="bg-surface-container p-3 rounded border border-outline-variant space-y-2">
          <div className="flex items-start gap-2">
            <span className="material-symbols-outlined text-secondary mt-0.5">
              info
            </span>
            <p className="text-body-sm font-body-sm text-on-surface leading-tight">
              <strong>Art. 65° y 70° Ord. N° 385/12:</strong> Se comunica al
              infractor que la presente acta será remitida al Dpto. de Rentas.
              Deberá comparecer en el término de <strong>tres (3) días hábiles</strong>{" "}
              a fin de presentar descargo o abonar voluntariamente.
            </p>
          </div>
          <div className="bg-surface-container-lowest p-2.5 rounded border border-secondary flex items-center justify-between">
            <div>
              <span className="text-label-sm font-label-sm uppercase text-secondary font-bold block">
                Beneficio Pago Voluntario (-40%)
              </span>
              <span className="text-body-sm text-outline">Dentro de los 3 días hábiles</span>
            </div>
            <span className="font-display text-lg font-bold text-secondary">
              ${" "}
              {montoConDescuento.toLocaleString("es-AR")}
            </span>
          </div>
        </div>
      </TarjetaSeccion>

      <BotonEnviar />
    </form>
  );
}

function CampoArchivo({
  label,
  id,
  name,
}: {
  label: string;
  id: string;
  name: string;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-label-sm font-label-sm text-on-surface-variant uppercase mb-1"
      >
        {label}
      </label>
      <label
        htmlFor={id}
        className="flex items-center justify-center gap-1.5 min-h-touch-min border border-dashed border-outline rounded bg-surface-container-low text-label-sm font-label-sm text-on-surface-variant cursor-pointer hover:bg-surface-container px-2 text-center"
      >
        <span className="material-symbols-outlined text-[18px]">
          photo_camera
        </span>
        Adjuntar
      </label>
      <input id={id} name={name} type="file" accept="image/*" capture="environment" className="hidden" />
    </div>
  );
}

function BotonEnviar() {
  const { pending } = useFormStatus();
  return (
    <div className="pt-2 pb-6">
      <Boton
        type="submit"
        icono="draw"
        fullWidth
        disabled={pending}
        className="disabled:opacity-60"
      >
        {pending ? "Guardando…" : "Continuar a Firma y Cierre"}
      </Boton>
      <p className="text-center text-label-sm font-label-sm text-outline mt-2 uppercase">
        Firma infractor y actuante con valor probatorio legal
      </p>
    </div>
  );
}
