"use client";

/**
 * SignaturePad — minimal canvas-based signature capture.
 *
 * Captures pointer/touch input, draws a smooth stroke with quadratic curves,
 * and exposes the result as a PNG data URL. No external dependencies.
 *
 * Drawing surface is intrinsically responsive: we re-size the canvas to its
 * displayed dimensions on mount and on window resize. The internal pixel
 * buffer is multiplied by devicePixelRatio so strokes stay crisp on retina.
 */

import { useCallback, useEffect, useRef, useState } from "react";

interface Props {
  /** Called whenever the signature changes. Empty string when cleared. */
  readonly onChange: (dataUrl: string) => void;
  readonly heightClass?: string;
  readonly strokeColor?: string;
}

export function SignaturePad({
  onChange,
  heightClass = "h-44",
  strokeColor = "#0a0a12",
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const hasInkRef = useRef(false);
  const [hasInk, setHasInk] = useState(false);

  /** Resize internal pixel buffer to displayed CSS size × DPR. */
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Preserve existing strokes across resize
    const prev = canvas.toDataURL();
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2;
    ctx.strokeStyle = strokeColor;

    if (hasInkRef.current) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height);
      img.src = prev;
    }
  }, [strokeColor]);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [resizeCanvas]);

  function getPoint(e: React.PointerEvent<HTMLCanvasElement>): { x: number; y: number } {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    e.preventDefault();
    canvasRef.current?.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    const p = getPoint(e);
    lastPointRef.current = p;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    // Draw a tiny dot so a tap leaves a mark
    ctx.beginPath();
    ctx.arc(p.x, p.y, 1, 0, Math.PI * 2);
    ctx.fillStyle = strokeColor;
    ctx.fill();
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    const last = lastPointRef.current;
    if (!ctx || !last) return;
    const p = getPoint(e);
    const mid = { x: (last.x + p.x) / 2, y: (last.y + p.y) / 2 };
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.quadraticCurveTo(last.x, last.y, mid.x, mid.y);
    ctx.stroke();
    lastPointRef.current = p;
    if (!hasInkRef.current) {
      hasInkRef.current = true;
      setHasInk(true);
    }
  }

  function handlePointerUp() {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    lastPointRef.current = null;
    if (hasInkRef.current && canvasRef.current) {
      onChange(canvasRef.current.toDataURL("image/png"));
    }
  }

  function handleClear() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasInkRef.current = false;
    setHasInk(false);
    onChange("");
  }

  return (
    <div className="space-y-2">
      <div
        className={`relative w-full ${heightClass} rounded-lg border-2 border-dashed border-white/20 bg-white overflow-hidden`}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className="absolute inset-0 h-full w-full touch-none cursor-crosshair"
        />
        {!hasInk && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-[12px] text-gray-400">
            Sign here with your finger or mouse
          </div>
        )}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-white/50">
          Drawing this is your legal e-signature
        </span>
        <button
          type="button"
          onClick={handleClear}
          disabled={!hasInk}
          className="text-[11px] uppercase tracking-wider font-semibold text-white/60 hover:text-white disabled:opacity-30"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
