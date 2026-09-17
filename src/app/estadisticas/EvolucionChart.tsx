"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatoMoneda } from "@/lib/formato";

const AZUL = "#2a78d6";

export function EvolucionChart({
  porSemana,
  porDia,
}: {
  porSemana: { semana: number; monto: number }[];
  porDia: { fecha: string; monto: number }[];
}) {
  const [vista, setVista] = useState<"semana" | "dia">("semana");

  const datos =
    vista === "semana"
      ? porSemana.map((s) => ({ etiqueta: `SEM 0${s.semana}`, monto: s.monto }))
      : porDia.map((d) => ({
          etiqueta: d.fecha.slice(8, 10),
          monto: d.monto,
        }));

  return (
    <div className="bg-surface-container-lowest rounded-lg border border-outline-variant p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-label-lg font-label-lg text-primary uppercase">
          Evolución de Recaudación
        </h3>
        <div className="flex bg-surface-container rounded overflow-hidden border border-outline-variant text-label-sm font-label-sm">
          <button
            type="button"
            onClick={() => setVista("semana")}
            className={`px-3 py-1.5 ${vista === "semana" ? "bg-primary-container text-on-primary" : "text-on-surface-variant"}`}
          >
            Semanal
          </button>
          <button
            type="button"
            onClick={() => setVista("dia")}
            className={`px-3 py-1.5 ${vista === "dia" ? "bg-primary-container text-on-primary" : "text-on-surface-variant"}`}
          >
            Diario
          </button>
        </div>
      </div>

      {datos.length === 0 ? (
        <p className="text-body-sm text-on-surface-variant py-8 text-center">
          Sin actas registradas en el período seleccionado.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={datos} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid
              vertical={false}
              stroke="#c4c6ce"
              strokeOpacity={0.5}
            />
            <XAxis
              dataKey="etiqueta"
              tick={{ fontSize: 11, fill: "#44474e" }}
              axisLine={{ stroke: "#c4c6ce" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#44474e" }}
              axisLine={false}
              tickLine={false}
              width={54}
              tickFormatter={(v) =>
                v >= 1000 ? `$${Math.round(v / 1000)}k` : `$${v}`
              }
            />
            <Tooltip
              cursor={{ fill: "rgba(2,132,199,0.08)" }}
              formatter={(value) => [formatoMoneda(Number(value)), "Recaudación"]}
              contentStyle={{
                fontSize: 12,
                borderRadius: 6,
                borderColor: "#c4c6ce",
              }}
            />
            <Bar dataKey="monto" fill={AZUL} radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
