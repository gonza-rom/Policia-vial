"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

export type FirmaCanvasHandle = {
  obtenerDataUrl: () => string | null;
  limpiar: () => void;
};

export const FirmaCanvas = forwardRef<
  FirmaCanvasHandle,
  { deshabilitado?: boolean }
>(function FirmaCanvas({ deshabilitado }, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dibujando = useRef(false);
  const tieneTrazo = useRef(false);
  const [vacio, setVacio] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function ajustarTamano() {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx2 = canvas.getContext("2d");
      if (ctx2) {
        ctx2.scale(dpr, dpr);
        ctx2.lineWidth = 2.2;
        ctx2.lineCap = "round";
        ctx2.strokeStyle = "#0d2240";
      }
    }

    ajustarTamano();
    window.addEventListener("resize", ajustarTamano);
    return () => window.removeEventListener("resize", ajustarTamano);
  }, []);

  function posicion(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function iniciar(e: React.PointerEvent<HTMLCanvasElement>) {
    if (deshabilitado) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    dibujando.current = true;
    const { x, y } = posicion(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function trazar(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!dibujando.current || deshabilitado) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = posicion(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    tieneTrazo.current = true;
    setVacio(false);
  }

  function detener() {
    dibujando.current = false;
  }

  useImperativeHandle(ref, () => ({
    obtenerDataUrl() {
      if (!tieneTrazo.current || !canvasRef.current) return null;
      return canvasRef.current.toDataURL("image/png");
    },
    limpiar() {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      tieneTrazo.current = false;
      setVacio(true);
    },
  }));

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        onPointerDown={iniciar}
        onPointerMove={trazar}
        onPointerUp={detener}
        onPointerLeave={detener}
        className="w-full h-32 bg-surface-container-lowest border border-dashed border-outline-variant rounded touch-none"
      />
      {vacio && !deshabilitado && (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-outline text-body-sm">
          Firme aquí con el dedo o el mouse
        </span>
      )}
    </div>
  );
});
