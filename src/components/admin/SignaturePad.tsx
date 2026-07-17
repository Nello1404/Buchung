"use client";

import { useEffect, useRef } from "react";

// Einfaches Unterschriftfeld auf Canvas-Basis. Ruft onChange mit der PNG-Data-URL
// nach jedem Strich auf (bzw. "" nach dem Löschen).
export function SignaturePad({ onChange }: { onChange: (dataUrl: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const zeichnet = useRef(false);
  const letzter = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#111111";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  function position(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function start(e: React.PointerEvent<HTMLCanvasElement>) {
    e.preventDefault();
    zeichnet.current = true;
    letzter.current = position(e);
    canvasRef.current?.setPointerCapture(e.pointerId);
  }

  function bewegen(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!zeichnet.current) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const p = position(e);
    ctx.beginPath();
    ctx.moveTo(letzter.current!.x, letzter.current!.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    letzter.current = p;
  }

  function ende() {
    if (!zeichnet.current) return;
    zeichnet.current = false;
    const canvas = canvasRef.current!;
    onChange(canvas.toDataURL("image/png"));
  }

  function loeschen() {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    onChange("");
  }

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={500}
        height={180}
        onPointerDown={start}
        onPointerMove={bewegen}
        onPointerUp={ende}
        onPointerLeave={ende}
        className="w-full touch-none rounded-lg border border-line bg-white"
        style={{ aspectRatio: "500 / 180" }}
      />
      <button type="button" onClick={loeschen} className="mt-2 text-sm text-muted hover:text-ink">
        Unterschrift löschen
      </button>
    </div>
  );
}
